import type { ModelTypeName, ModelParamsMap, ModelResultMap } from "../types/model";
import { globalRegistry } from "./registry";
import { Telemetry } from "./telemetry";
import { CircuitBreaker } from "./circuitBreaker";
import { RoutingPolicy, type PolicyOptions } from "./policy";
import { costEstimator, type CostEstimate } from "./costs";

export interface RouterOptions {
	telemetryWindow?: number;
	circuitFailureThreshold?: number;
	circuitCoolOffMs?: number;
	perCallTimeoutMs?: number;
	maxRetries?: number;
	sessionBudget?: number; // total budget for the session
}

export interface BudgetStatus {
	totalBudget: number;
	spent: number;
	remaining: number;
	utilizationRatio: number;
}

export class Router {
	private readonly telemetry: Telemetry;
	private readonly circuit: CircuitBreaker;
	private readonly policy: RoutingPolicy;
	private readonly perCallTimeoutMs: number;
	private readonly maxRetries: number;
	private readonly sessionBudget: number | undefined;
	private sessionSpent: number = 0;

	constructor(opts: RouterOptions = {}) {
		this.telemetry = new Telemetry(opts.telemetryWindow ?? 200);
		this.circuit = new CircuitBreaker({
			failureThreshold: opts.circuitFailureThreshold ?? 3,
			coolOffMs: opts.circuitCoolOffMs ?? 60_000,
		});
		this.policy = new RoutingPolicy(this.telemetry, this.circuit);
		this.perCallTimeoutMs = opts.perCallTimeoutMs ?? 300_000;
		this.maxRetries = Math.max(0, opts.maxRetries ?? 2);
		this.sessionBudget = opts.sessionBudget;
	}

	async useModel<T extends ModelTypeName, R = ModelResultMap[T]>(
		modelType: T,
		params: Omit<ModelParamsMap[T], 'runtime'> | any,
		policyOptions: PolicyOptions = {},
		providerHint?: string
	): Promise<R> {
		const { result } = await this.useModelWithInfo<T, R>(modelType, params, policyOptions, providerHint);
		return result as R;
	}

	async useModelWithInfo<T extends ModelTypeName, R = ModelResultMap[T]>(
		modelType: T,
		params: Omit<ModelParamsMap[T], 'runtime'> | any,
		policyOptions: PolicyOptions = {},
		providerHint?: string
	): Promise<{ result: R; provider: string; costEstimate?: CostEstimate }> {
		const providers = globalRegistry.getProviders(modelType as string);
		let candidates = providers;

		if (providerHint) {
			candidates = providers.filter((p) => p.provider === providerHint);
		}
		if (!candidates.length) {
			throw new Error(`No providers registered for ${String(modelType)}${providerHint ? ` (hint=${providerHint})` : ''}`);
		}

		const promptLength = typeof params?.prompt === 'string' ? params.prompt.length : 0;
		const hasSchema = !!params?.schema;
		const scored = this.policy.select(modelType, candidates, { 
			...policyOptions, 
			promptLength, 
			hasSchema,
			sessionBudget: this.sessionBudget,
			sessionSpent: this.sessionSpent,
		});
		if (!scored.length) {
			throw new Error(`All providers are unavailable (circuit-open) for ${String(modelType)}`);
		}

		const ranked = scored.map((s) => s.provider);
		let lastError: any;
		let attempts = 0;
		let selectedProvider: any = null;
		let actualCostEstimate: CostEstimate | undefined = undefined;

		for (const rp of ranked) {
			if (attempts > this.maxRetries) break;
			attempts++;
			const start = Date.now();
			try {
				// Pass timeout to the provider
				const paramsWithTimeout = { ...params, timeout: this.perCallTimeoutMs };
				const result = await this.withTimeout(rp.handler(paramsWithTimeout), this.perCallTimeoutMs);
				this.telemetry.record({ provider: rp.provider, modelType: String(modelType), latencyMs: Date.now() - start, timestamp: Date.now(), outcome: 'success' });
				this.circuit.onSuccess(rp.provider, String(modelType));
				
				// Track cost for successful calls
				const scoredProvider = scored.find(s => s.provider === rp);
				if (scoredProvider?.costEstimate) {
					actualCostEstimate = scoredProvider.costEstimate;
					this.sessionSpent += actualCostEstimate.totalUSD;
				}
				
				selectedProvider = rp;
				return { result: result as R, provider: rp.provider, costEstimate: actualCostEstimate };
			} catch (err: any) {
				const latency = Date.now() - start;
				const isTimeout = err && (err.name === 'TimeoutError' || /timeout/i.test(String(err?.message)));
				this.telemetry.record({ provider: rp.provider, modelType: String(modelType), latencyMs: latency, timestamp: Date.now(), outcome: isTimeout ? 'timeout' : 'failure' });
				this.circuit.onFailure(rp.provider, String(modelType));
				lastError = err;
				continue;
			}
		}
		// Include attempted providers in the error for better debugging
		const attemptedProviders = ranked.slice(0, attempts).map(rp => rp.provider).join(', ');
		const error = lastError ?? new Error(`Failed to execute ${String(modelType)} with available providers`);
		if (error && typeof error === 'object') {
			(error as any).attemptedProviders = attemptedProviders;
			(error as any).lastAttemptedProvider = ranked[attempts - 1]?.provider || 'unknown';
		}
		throw error;
	}

	/**
	 * Set the session budget
	 */
	setBudget(budget: number): void {
		(this as any).sessionBudget = budget;
	}

	/**
	 * Get current budget status
	 */
	getBudgetStatus(): BudgetStatus | null {
		if (this.sessionBudget === undefined) {
			return null;
		}
		return {
			totalBudget: this.sessionBudget,
			spent: this.sessionSpent,
			remaining: this.sessionBudget - this.sessionSpent,
			utilizationRatio: this.sessionSpent / this.sessionBudget,
		};
	}

	/**
	 * Reset session spending (useful for new sessions)
	 */
	resetSession(): void {
		this.sessionSpent = 0;
	}

	/**
	 * Get total spent in current session
	 */
	getSessionSpent(): number {
		return this.sessionSpent;
	}

	private async withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
		let timer: any;
		const timeout = new Promise<never>((_, reject) => {
			timer = setTimeout(() => {
				const err: any = new Error(`Operation timed out after ${ms}ms`);
				err.name = 'TimeoutError';
				reject(err);
			}, ms);
		});
		try {
			return await Promise.race([p, timeout]);
		} finally {
			clearTimeout(timer);
		}
	}
}