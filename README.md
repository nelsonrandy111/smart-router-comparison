# Smart Cost-Aware LLM Router

A local, benchmark-driven toolkit for smart, policy-based routing across local LLMs (Ollama). It includes a production-style router (policies, circuit breaker, telemetry), an extensible provider layer, and a benchmark suite with quick and comprehensive modes.

## Requirements
- Node.js 18+
- Ollama installed and running locally
- Models pulled: `phi3:mini`, `mistral:7b`, `llama3:8b`, `nomic-embed-text`, `all-minilm`

## Setup
1. Install dependencies:
   - `npm install`
2. Configure environment (optional):
   - See `.env.example`. Defaults work for `OLLAMA_BASE_URL=http://localhost:11434`.
3. Pull models:
   - Windows: `powershell -ExecutionPolicy Bypass -File scripts/pull-models.ps1`
   - macOS/Linux: `bash scripts/pull-models.sh`

## Project Structure
- `src/types/` – Model types, params/results, provider capabilities
- `src/core/` – Registry, telemetry, circuit breaker, policy, router
- `src/providers/ollama/` – Local text and embedding providers
- `src/bench/` – Benchmark runner, metrics, report generator
- `bench/tasks/` – Benchmark datasets
- `tests/` – Unit tests for core modules

## Running Benchmarks
Ensure Ollama is running locally.

### Quick Development Mode (Recommended)
- `npm run bench:quick` (6-8 minutes)
  - Reduced test volume (80% fewer tests)
  - Essential scenarios only

### Comprehensive Analysis
- `npm run bench:full` (4+ hours)
  - Complete test suite with stress testing
  - Statistical analysis and confidence intervals

### Legacy Benchmarks
- Baseline (fixed providers): `npm run bench:baseline`
- Smart routing (policy-driven): `npm run bench:smart`
- Generate comparison report: `npm run bench:report`

### Outputs
- Quick: `results/quick-comparison-report.md`, `results/quick-comparison-data.json`
- Full: `results/comprehensive-comparison-report.md`, `results/comparison-data.json`, `results/baseline-results.json`, `results/smart-results.json`

## How It Works
- Providers are registered with priorities and capabilities (e.g., typical latency, JSON reliability).
- Routing policy scores providers based on prompt length, schema presence, telemetry (p95 latency, failures), and circuit-breaker status.
- Router enforces per-call timeouts, records telemetry, updates circuit state, and falls back to next candidates.

## Performance Optimizations
- Request Queuing: Limits concurrent requests to Ollama (max 2 by default)
- Connection Pooling: Reuses HTTP connections
- Exponential Backoff: Retries with increasing delays (1s, 2s, 4s, 8s)
- Priority-based Processing: Text generation prioritized over embeddings
- Circuit Breaking: Automatically disables failing providers

## Environment Configuration
Create a `.env` based on `.env.example` to customize:

```bash
# Quick mode for development
QUICK_MODE=true
QUICK_BASIC_TESTS=9
QUICK_REAL_WORLD_TESTS=7

# Ollama configuration
OLLAMA_BASE_URL=http://127.0.0.1:11434

# Request queuing
MAX_CONCURRENT_REQUESTS=2
REQUEST_TIMEOUT=30000
```

## Troubleshooting
- If tests fail due to a loader issue, the code still compiles and benchmarks run. A minimal `vitest.config.ts` is included to run tests in node.
- If Ollama requests time out, verify the server is running and models are present: `ollama list`.
- Reduce `MAX_CONCURRENT_REQUESTS` for frequent timeouts.
- Use `npm run bench:quick` for faster iteration.
