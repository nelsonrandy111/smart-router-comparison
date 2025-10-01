import type { CostEstimate } from '../core/costs';

export interface CallRecord {
  group: string; // TEXT_SMALL, TEXT_LARGE, etc.
  provider: string;
  latencyMs: number;
  success: boolean;
  jsonValid?: boolean;
  promptLength: number;
  outputLength: number;
  timestamp: number;
}

export interface CallRecordWithCost extends CallRecord {
  costEstimate?: CostEstimate;
  estimatedCost?: CostEstimate; // For baseline
  simulatedModelName?: string;
}

export interface StatisticalAnalysis {
  confidenceIntervals: {
    latency: { mean: [number, number], p95: [number, number] };
    successRate: [number, number];
    cost: { mean: [number, number], total: [number, number] };
  };
  significanceTests: {
    latencyImprovement: { pValue: number, significant: boolean };
    costReduction: { pValue: number, significant: boolean };
    successRateImprovement: { pValue: number, significant: boolean };
  };
  effectSizes: {
    cohensD: number;
    practicalSignificance: 'small' | 'medium' | 'large';
  };
}

export interface CostComparison {
  baseline: {
    totalEstimatedCost: number;
    costPerCall: number;
    costPerProvider: Record<string, number>;
    note: string;
  };
  smart: {
    totalActualCost: number;
    costPerCall: number;
    costPerProvider: Record<string, number>;
    note: string;
  };
  comparison: {
    costSavings: number;
    costSavingsPercentage: number;
    costEffectiveness: {
      baseline: number;
      smart: number;
    };
    roi: number;
  };
}

export interface ComprehensiveComparison {
  methodology: {
    note: string;
    limitations: string[];
    assumptions: string[];
  };
  performance: {
    latency: { baseline: number, smart: number, improvement: number };
    successRate: { baseline: number, smart: number, improvement: number };
    quality: { baseline: number, smart: number, improvement: number };
  };
  cost: CostComparison;
  statisticalAnalysis: StatisticalAnalysis;
  providerEfficiency: {
    baseline: Record<string, { calls: number, successRate: number }>;
    smart: Record<string, { calls: number, successRate: number, cost: number }>;
  };
}

export interface BenchmarkTask {
  prompt: string;
  minChars?: number;
  schema?: any;
  text?: string; // For embedding tasks
}

export interface TestSuiteResults {
  baseline: CallRecordWithCost[];
  smart: CallRecordWithCost[];
}