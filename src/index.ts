// Core router and policy
export { Router } from './core/router';
export { RoutingPolicy } from './core/policy';
export { globalRegistry } from './core/registry';
export { Telemetry } from './core/telemetry';
export { CircuitBreaker } from './core/circuitBreaker';

// Cost-aware functionality
export { costEstimator, CostEstimator } from './core/costs';
export type { CostEstimate, CostEstimateParams, ModelCosts } from './core/costs';

// Types
export type { ModelTypeName, ModelParamsMap, ModelResultMap } from './types/model';
export type { RegisteredProvider, CostCapabilities } from './types/provider';
export type { PolicyOptions, ScoredProvider } from './core/policy';
export type { RouterOptions, BudgetStatus } from './core/router';

// Provider registration functions
export { registerDefaultOllamaTextProviders } from './providers/ollama/text';
export { registerDefaultOllamaEmbeddingProviders } from './providers/ollama/embedding';

// Benchmark utilities
export { aggregate } from './bench/metrics';
export type { CallRecord, Aggregates } from './bench/metrics';

console.log('smart-router initialized with cost-aware routing');