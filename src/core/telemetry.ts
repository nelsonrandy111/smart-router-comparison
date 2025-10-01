export type Outcome = 'success' | 'failure' | 'timeout';

export interface TelemetryRecord {
	provider: string;
	modelType: string;
	latencyMs: number;
	timestamp: number;
	outcome: Outcome;
}

export interface TelemetryStats {
	count: number;
	success: number;
	failure: number;
	timeout: number;
	p50Latency: number | null;
	p95Latency: number | null;
}

export class Telemetry {
	private readonly windowSize: number;
	private readonly store: Map<string, TelemetryRecord[]> = new Map();

	constructor(windowSize: number = 200) {
		this.windowSize = windowSize;
	}

	private key(provider: string, modelType: string): string {
		return `${provider}::${modelType}`;
	}

	record(rec: TelemetryRecord): void {
		const k = this.key(rec.provider, rec.modelType);
		if (!this.store.has(k)) this.store.set(k, []);
		const arr = this.store.get(k)!;
		arr.push(rec);
		if (arr.length > this.windowSize) {
			arr.splice(0, arr.length - this.windowSize);
		}
	}

	getStats(provider: string, modelType: string): TelemetryStats {
		const k = this.key(provider, modelType);
		const arr = this.store.get(k) ?? [];
		const count = arr.length;
		if (count === 0) {
			return { count: 0, success: 0, failure: 0, timeout: 0, p50Latency: null, p95Latency: null };
		}

		const success = arr.filter((a) => a.outcome === 'success').length;
		const failure = arr.filter((a) => a.outcome === 'failure').length;
		const timeout = arr.filter((a) => a.outcome === 'timeout').length;

		const latencies = arr.map((a) => a.latencyMs).sort((a, b) => a - b);
		const p50Latency = this.percentile(latencies, 0.5);
		const p95Latency = this.percentile(latencies, 0.95);

		return { count, success, failure, timeout, p50Latency, p95Latency };
	}

	private percentile(sortedLatencies: number[], p: number): number | null {
		if (sortedLatencies.length === 0) return null;
		const idx = Math.min(
			sortedLatencies.length - 1,
			Math.max(0, Math.floor(p * (sortedLatencies.length - 1)))
		);
		return sortedLatencies[idx];
	}

	clear(): void {
		this.store.clear();
	}
}