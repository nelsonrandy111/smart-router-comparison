type State = 'closed' | 'open' | 'half-open';

export interface CircuitOptions {
	failureThreshold: number; // consecutive failures to open
	coolOffMs: number; // time to stay open before trying half-open
}

interface Entry {
	state: State;
	consecutiveFailures: number;
	openedAt?: number;
}

export class CircuitBreaker {
	private readonly options: CircuitOptions;
	private readonly map: Map<string, Entry> = new Map();

	constructor(options: CircuitOptions) {
		this.options = options;
	}

	private key(provider: string, modelType: string): string {
		return `${provider}::${modelType}`;
	}

	isOpen(provider: string, modelType: string): boolean {
		const e = this.map.get(this.key(provider, modelType));
		if (!e) return false;
		if (e.state === 'open') {
			const now = Date.now();
			if (e.openedAt && now - e.openedAt >= this.options.coolOffMs) {
				// move to half-open allowing a trial call
				e.state = 'half-open';
				this.map.set(this.key(provider, modelType), e);
				return false;
			}
			return true;
		}
		return false;
	}

	onSuccess(provider: string, modelType: string): void {
		const k = this.key(provider, modelType);
		const e: Entry = this.map.get(k) ?? { state: 'closed', consecutiveFailures: 0 };
		// success closes/keeps closed and resets failures
		e.state = 'closed';
		e.consecutiveFailures = 0;
		e.openedAt = undefined;
		this.map.set(k, e);
	}

	onFailure(provider: string, modelType: string): void {
		const k = this.key(provider, modelType);
		const e: Entry = this.map.get(k) ?? { state: 'closed', consecutiveFailures: 0 };
		e.consecutiveFailures += 1;
		if (e.consecutiveFailures >= this.options.failureThreshold) {
			e.state = 'open';
			e.openedAt = Date.now();
		}
		this.map.set(k, e);
	}

	reset(provider: string, modelType: string): void {
		this.map.delete(this.key(provider, modelType));
	}

	clearAll(): void {
		this.map.clear();
	}
}