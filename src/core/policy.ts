import type { ModelTypeName } from "../types/model";
import type { RegisteredProvider } from "../types/provider";
import { Telemetry } from "./telemetry";
import { CircuitBreaker } from "./circuitBreaker";
import { costEstimator, type CostEstimate } from "./costs";

export interface PolicyOptions {
	promptLength?: number; // characters of prompt if applicable
	hasSchema?: boolean; // whether structured JSON output is needed
	promptLengthThreshold?: number; // default e.g., 600
	jsonBiasWeight?: number; // weight for json reliability capability
	latencyWeight?: number; // negative weight for higher p95 latency
	failurePenalty?: number; // penalty per recent failure proportion
	explorationEpsilon?: number; // small random jitter to explore
	costWeight?: number; // weight for cost penalty (default 1.0)
	expectedOutputTokens?: number; // for cost estimation
	sessionBudget?: number; // total budget for session
	sessionSpent?: number; // amount already spent in session
}

export interface ScoredProvider {
	provider: RegisteredProvider;
	score: number;
	stats: {
		p95Latency: number | null;
		successRatio: number | null;
		failureRatio: number | null;
	};
	costEstimate?: CostEstimate;
}

export class RoutingPolicy {
	private readonly telemetry: Telemetry;
	private readonly circuit: CircuitBreaker;

	constructor(telemetry: Telemetry, circuit: CircuitBreaker) {
		this.telemetry = telemetry;
		this.circuit = circuit;
	}

	select(
		modelType: ModelTypeName | string,
		providers: RegisteredProvider[],
		options: PolicyOptions = {}
	): ScoredProvider[] {
		const {
			promptLength = 0,
			hasSchema = false,
			promptLengthThreshold = 600,
			jsonBiasWeight = 1.0,
			latencyWeight = 0.001,
			failurePenalty = 2.0,
			explorationEpsilon = 0.01,
			costWeight = 1.0,
			expectedOutputTokens,
			sessionBudget,
			sessionSpent = 0,
		} = options;

		const isShort = promptLength > 0 ? promptLength < promptLengthThreshold : false;

		// Adjust cost weight based on budget pressure
		let effectiveCostWeight = costWeight;
		if (sessionBudget && sessionSpent > 0) {
			const budgetUsedRatio = sessionSpent / sessionBudget;
			if (budgetUsedRatio > 0.8) {
				// Increase cost sensitivity when budget is 80%+ used
				effectiveCostWeight *= 2.0;
			}
		}

		const scored: ScoredProvider[] = [];
		for (const p of providers) {
			// Skip open circuits
			if (this.circuit.isOpen(p.provider, String(modelType))) {
				continue;
			}

			const caps = p.capabilities || {};
			let score = 0;

			// Base preference: use priority as baseline
			score += (p.priority ?? 0);

			// Cost estimation and penalty
			let costEstimate: CostEstimate | undefined;
			if (caps.cost?.simulatedModelName && promptLength > 0) {
				costEstimate = costEstimator.estimateCostWithVariance({
					promptChars: promptLength,
					expectedOutputTokens,
					simulatedModelName: caps.cost.simulatedModelName,
					charsPerToken: caps.cost.tokenCharsPerToken,
					requestFixedFeeUSD: caps.cost.requestFixedFeeUSD,
					discountFactor: caps.cost.discountFactor,
				});

				// Apply cost penalty
				score -= effectiveCostWeight * costEstimate.totalUSD;

				// Hard budget ceiling: exclude if projected cost exceeds remaining budget
				if (sessionBudget) {
					const remainingBudget = sessionBudget - sessionSpent;
					if (costEstimate.totalUSD > remainingBudget) {
						continue; // Skip this provider
					}
				}
			}

			// Prompt-length heuristic: if short, slightly favor providers tagged as small/fast
			if (isShort && typeof caps.typicalLatencyMs === 'number') {
				// lower typical latency → higher score
				score += 1 / Math.max(1, caps.typicalLatencyMs);
			}

			// JSON bias when schema is required
			if (hasSchema && typeof caps.jsonReliabilityScore === 'number') {
				score += jsonBiasWeight * caps.jsonReliabilityScore;
			}

			// Telemetry-informed adjustments
			const stats = this.telemetry.getStats(p.provider, String(modelType));
			const failureRatio = stats.count > 0 ? (stats.failure + stats.timeout) / stats.count : 0;
			const successRatio = stats.count > 0 ? stats.success / stats.count : null;
			const p95 = stats.p95Latency;

			if (p95 != null) {
				// higher p95 → larger subtraction
				score -= latencyWeight * p95;
			}
			if (failureRatio > 0) {
				score -= failurePenalty * failureRatio;
			}

			// Small exploration to avoid lock-in
			score += (Math.random() * explorationEpsilon);

			scored.push({
				provider: p,
				score,
				stats: { p95Latency: p95, successRatio, failureRatio },
				costEstimate,
			});
		}

		// Sort descending by score
		scored.sort((a, b) => b.score - a.score);
		return scored;
	}
}