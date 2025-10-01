import type { CostEstimate } from '../core/costs';

export interface CallRecord {
	group: string; // e.g., TEXT_SMALL, TEXT_LARGE, OBJECT_SMALL, OBJECT_LARGE, TEXT_EMBEDDING
	provider: string;
	latencyMs: number;
	success: boolean;
	jsonValid?: boolean;
	costEstimate?: CostEstimate;
}

export interface Aggregates {
	count: number;
	successRate: number;
	jsonValidityRate?: number;
	meanLatency: number | null;
	p95Latency: number | null;
	totalCostUSD?: number;
	meanCostUSD?: number | null;
	costPerProvider?: Record<string, number>;
}

export function aggregate(records: CallRecord[]): Aggregates {
	const count = records.length;
	if (count === 0) {
		return { count: 0, successRate: 0, jsonValidityRate: 0, meanLatency: null, p95Latency: null };
	}
	const success = records.filter((r) => r.success).length;
	const jsonValidValues: number[] = records.map((r) => (r.jsonValid ? 1 : 0));
	const jsonValidityRate = jsonValidValues.length ? jsonValidValues.reduce((a: number, b: number) => a + b, 0) / jsonValidValues.length : undefined;
	const latencies = records.map((r) => r.latencyMs).sort((a, b) => a - b);
	const meanLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
	const p95Latency = percentile(latencies, 0.95);
	
	// Cost aggregation
	const costRecords = records.filter(r => r.costEstimate);
	const totalCostUSD = costRecords.reduce((sum, r) => sum + (r.costEstimate?.totalUSD || 0), 0);
	const meanCostUSD = costRecords.length > 0 ? totalCostUSD / costRecords.length : null;
	
	// Cost per provider
	const costPerProvider: Record<string, number> = {};
	for (const record of costRecords) {
		if (record.costEstimate) {
			costPerProvider[record.provider] = (costPerProvider[record.provider] || 0) + record.costEstimate.totalUSD;
		}
	}
	
	return {
		count,
		successRate: success / count,
		jsonValidityRate,
		meanLatency,
		p95Latency,
		totalCostUSD: costRecords.length > 0 ? totalCostUSD : undefined,
		meanCostUSD,
		costPerProvider: Object.keys(costPerProvider).length > 0 ? costPerProvider : undefined,
	};
}

function percentile(sorted: number[], p: number): number | null {
	if (!sorted.length) return null;
	const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor(p * (sorted.length - 1))));
	return sorted[idx];
}