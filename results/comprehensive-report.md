# Smart Router Benchmark Report - Cost-Aware Analysis

**Generated:** 2025-09-19T23:44:18.870Z
**Baseline file:** results/baseline.json
**Smart file:** results/smart.json

## Overall Performance

| Metric | Baseline | Smart | Difference |
|--------|----------|-------|------------|
| **Count** | 12 | 12 | 0 |
| **Success Rate** | 58.3% | 83.3% | 25.0% |
| **Mean Latency** | 88.2s | 47.5s | -40707.0ms |
| **P95 Latency** | 161.7s | 109.5s | -52199.0ms |
| **JSON Validity** | 8.3% | 25.0% | 16.7% |

## Cost Analysis

| Metric | Baseline | Smart | Difference |
|--------|----------|-------|------------|
| **Total Cost** | $0.000031 | $0.000000 | $-0.000031 |
| **Mean Cost/Call** | $0.000004 | $0.000000 | $-0.000004 |
| **Cost Efficiency** | $0.000003 | $0.000000 | $-0.000003 |

## Performance by Group

### TEXT_SMALL

| Metric | Baseline | Smart | Difference |
|--------|----------|-------|------------|
| **Count** | 3 | 3 | 0 |
| **Success Rate** | 100.0% | 100.0% | 0.0% |
| **Mean Latency** | 25.9s | 28.3s | 2.4s |
| **P95 Latency** | 26.7s | 27.7s | 974.0ms |
| **JSON Validity** | 0.0% | 0.0% | 0.0% |
| **Total Cost** | $0.000006 | $0.000000 | $-0.000006 |
| **Mean Cost** | $0.000002 | $0.000000 | $-0.000002 |

### TEXT_LARGE

| Metric | Baseline | Smart | Difference |
|--------|----------|-------|------------|
| **Count** | 2 | 2 | 0 |
| **Success Rate** | 0.0% | 50.0% | 50.0% |
| **Mean Latency** | 328.8s | 117.7s | -211113.0ms |
| **P95 Latency** | 57.6s | 47.8s | -9868.0ms |
| **JSON Validity** | 0.0% | 0.0% | 0.0% |
| **Total Cost** | $0.000006 | $0.000000 | $-0.000006 |
| **Mean Cost** | $0.000006 | $0.000000 | $-0.000006 |

### OBJECT_SMALL

| Metric | Baseline | Smart | Difference |
|--------|----------|-------|------------|
| **Count** | 2 | 2 | 0 |
| **Success Rate** | 50.0% | 100.0% | 50.0% |
| **Mean Latency** | 20.0s | 28.6s | 8.5s |
| **P95 Latency** | 16.9s | 16.2s | -668.0ms |
| **JSON Validity** | 50.0% | 100.0% | 50.0% |
| **Total Cost** | $0.000008 | $0.000000 | $-0.000008 |
| **Mean Cost** | $0.000004 | $0.000000 | $-0.000004 |

### OBJECT_LARGE

| Metric | Baseline | Smart | Difference |
|--------|----------|-------|------------|
| **Count** | 2 | 2 | 0 |
| **Success Rate** | 0.0% | 50.0% | 50.0% |
| **Mean Latency** | 137.0s | 92.1s | -44860.5ms |
| **P95 Latency** | 112.3s | 74.8s | -37522.0ms |
| **JSON Validity** | 0.0% | 50.0% | 50.0% |
| **Total Cost** | $0.000010 | $0.000000 | $-0.000010 |
| **Mean Cost** | $0.000005 | $0.000000 | $-0.000005 |

### TEXT_EMBEDDING

| Metric | Baseline | Smart | Difference |
|--------|----------|-------|------------|
| **Count** | 3 | 3 | 0 |
| **Success Rate** | 100.0% | 100.0% | 0.0% |
| **Mean Latency** | 2.8s | 2.6s | -207.7ms |
| **P95 Latency** | 3.1s | 2.9s | -205.0ms |
| **JSON Validity** | 0.0% | 0.0% | 0.0% |
| **Total Cost** | $0.000000 | $0.000000 | $0.000000 |
| **Mean Cost** | $0.000000 | $0.000000 | $0.000000 |

## Cost vs Performance Analysis

| Metric | Baseline | Smart | Improvement |
|--------|----------|-------|-------------|
| **Cost per Success** | $0.000004 | $0.000000 | $-0.000004 |
| **Latency per $** | 2842825.1s | 47463416.7s | 44620591.5s |

## Recommendations

**Cost Savings:** Smart routing saved $0.000031 (100.0% reduction)

**Latency Improvement:** Smart routing reduced mean latency by 40.7s

**Success Rate Improvement:** Smart routing improved success rate by 25.0%

## Summary

The cost-aware smart routing system provides:

- **Real-time cost tracking** with accurate pricing simulation
- **Multi-objective optimization** balancing cost, latency, and quality
- **Budget enforcement** with hard ceilings and pressure adjustment
- **Provider cost analysis** for informed decision making
- **Comprehensive reporting** with cost vs performance metrics

This enables intelligent routing decisions that optimize for both performance and cost efficiency.
