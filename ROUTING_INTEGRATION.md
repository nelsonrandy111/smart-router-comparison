# Cost-Aware Routing Integration

## How Cost-Aware Routing Integrates with Existing Methods

The cost-aware routing system seamlessly integrates with all existing routing methods through a **unified multi-objective scoring system**. Here's how it works:

## Unified Scoring Formula

```typescript
score = priority + jsonBias + latencyBonus - costPenalty - latencyPenalty - failurePenalty + exploration
```

## Integration Points

### 1. **Priority Routing** (Existing)
- **What**: Base provider priority from registration
- **How**: `score += (p.priority ?? 0)`
- **Integration**: Unchanged - still the foundation of routing decisions

### 2. **Cost Routing** (NEW)
- **What**: Cost penalties based on estimated spending
- **How**: `score -= effectiveCostWeight * costEstimate.totalUSD`
- **Integration**: Adds cost as a new objective in the scoring system

### 3. **Latency Routing** (Existing)
- **What**: P95 latency penalties for slow providers
- **How**: `score -= latencyWeight * p95`
- **Integration**: Unchanged - still penalizes slow providers

### 4. **Failure Routing** (Existing)
- **What**: Circuit breaker and failure rate penalties
- **How**: `score -= failurePenalty * failureRatio`
- **Integration**: Unchanged - still avoids failing providers

### 5. **JSON Routing** (Existing)
- **What**: Bias toward providers with better JSON reliability
- **How**: `score += jsonBiasWeight * caps.jsonReliabilityScore`
- **Integration**: Unchanged - still prioritizes JSON-capable providers

### 6. **Prompt Routing** (Existing)
- **What**: Length-based heuristics for short vs long prompts
- **How**: `score += 1 / Math.max(1, caps.typicalLatencyMs)` for short prompts
- **Integration**: Unchanged - still optimizes for prompt characteristics

### 7. **Exploration** (Existing)
- **What**: Random jitter to avoid lock-in
- **How**: `score += (Math.random() * explorationEpsilon)`
- **Integration**: Unchanged - still provides diversity

### 8. **Budget Routing** (NEW)
- **What**: Hard budget ceilings and pressure adjustment
- **How**: 
  - Excludes providers exceeding remaining budget
  - Increases cost sensitivity when budget is 80%+ used
- **Integration**: Adds budget enforcement as a hard constraint

## How They Work Together

### Example Scoring Process

```typescript
// For each provider candidate:
let score = 0;

// 1. Base priority (existing)
score += provider.priority; // e.g., +5

// 2. Cost penalty (NEW)
const costEstimate = estimateCost(prompt, provider);
score -= costWeight * costEstimate.totalUSD; // e.g., -0.0001

// 3. Latency penalty (existing)
score -= latencyWeight * p95Latency; // e.g., -0.5

// 4. Failure penalty (existing)
score -= failurePenalty * failureRatio; // e.g., -0.2

// 5. JSON bias (existing)
if (hasSchema) {
  score += jsonBiasWeight * jsonReliabilityScore; // e.g., +0.8
}

// 6. Prompt length bonus (existing)
if (isShortPrompt) {
  score += 1 / typicalLatencyMs; // e.g., +0.001
}

// 7. Exploration (existing)
score += Math.random() * explorationEpsilon; // e.g., +0.01

// 8. Budget enforcement (NEW)
if (costEstimate.totalUSD > remainingBudget) {
  continue; // Skip this provider entirely
}
```

## Configurable Weights

All routing methods can be tuned via `PolicyOptions`:

```typescript
const options: PolicyOptions = {
  // Existing weights
  jsonBiasWeight: 1.0,        // JSON reliability importance
  latencyWeight: 0.001,       // Latency penalty strength
  failurePenalty: 2.0,        // Failure penalty strength
  explorationEpsilon: 0.01,   // Exploration randomness
  
  // NEW cost-aware weights
  costWeight: 1.0,            // Cost penalty strength
  expectedOutputTokens: 100,  // For cost estimation
  sessionBudget: 1.0,         // Total budget
  sessionSpent: 0.0,          // Already spent
};
```

## Routing Modes

### Quality-First Mode
```typescript
{ costWeight: 0.1, jsonBiasWeight: 2.0 }
// Prioritizes quality and JSON reliability over cost
```

### Cost-First Mode
```typescript
{ costWeight: 5.0, latencyWeight: 0.001 }
// Prioritizes cost savings and speed
```

### Balanced Mode
```typescript
{ costWeight: 1.0, latencyWeight: 0.001, failurePenalty: 2.0 }
// Balances all objectives equally
```

## Dynamic Behavior

### Budget Pressure
- **Normal**: `costWeight = 1.0`
- **High Pressure** (80%+ budget used): `costWeight = 2.0`
- **Result**: Automatically becomes more cost-sensitive as budget depletes

### Hard Constraints
- **Budget Ceiling**: Providers exceeding remaining budget are excluded
- **Circuit Breaker**: Failed providers are excluded
- **Result**: Ensures budget compliance and reliability

## 🔧 Backward Compatibility

The cost-aware routing is **100% backward compatible**:

- **Existing code**: Works unchanged (cost weight defaults to 0)
- **Existing providers**: Work unchanged (no cost capabilities = no cost penalty)
- **Existing benchmarks**: Work unchanged (cost tracking is additive)
- **Existing APIs**: Work unchanged (cost data is optional)

## Benefits of Integration

1. **Unified Decision Making**: All routing factors considered together
2. **Configurable Trade-offs**: Tune the balance between objectives
3. **Dynamic Adaptation**: Automatically adjusts based on budget pressure
4. **Hard Constraints**: Ensures budget and reliability compliance
5. **Backward Compatibility**: Existing code continues to work
6. **Comprehensive Reporting**: All factors tracked and reported

## Example Integration Scenarios

### Scenario 1: Short Prompt, Quality-First
```typescript
// Prompt: "Write a haiku"
// Factors: Low cost (short), high quality needed
// Result: Prioritizes JSON reliability and quality over cost
```

### Scenario 2: Long Prompt, Cost-First
```typescript
// Prompt: "Write a detailed analysis..."
// Factors: High cost (long), cost sensitivity important
// Result: Prioritizes cost savings and speed
```

### Scenario 3: JSON Schema, Balanced
```typescript
// Prompt: "Create a user profile" + schema
// Factors: JSON reliability critical, moderate cost
// Result: Balances JSON capability with cost efficiency
```

### Scenario 4: Budget Pressure
```typescript
// Budget: 80%+ used
// Factors: Cost becomes primary concern
// Result: Automatically switches to cost-first mode
```

The cost-aware routing seamlessly integrates with all existing routing methods, creating a unified, configurable, and intelligent routing system that can optimize for any combination of objectives!