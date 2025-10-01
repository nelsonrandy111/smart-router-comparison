import { describe, it, expect } from 'vitest';
import { Telemetry } from '../src/core/telemetry';
import { CircuitBreaker } from '../src/core/circuitBreaker';
import { RoutingPolicy } from '../src/core/policy';

describe('RoutingPolicy', () => {
	it('scores higher priority and lower latency', () => {
		const t = new Telemetry();
		const c = new CircuitBreaker({ failureThreshold: 3, coolOffMs: 1000 });
		const p = new RoutingPolicy(t, c);
		const providers = [
			{ modelType: 'TEXT_SMALL', provider: 'A', handler: async () => 'ok', priority: 5, capabilities: { typicalLatencyMs: 100 } },
			{ modelType: 'TEXT_SMALL', provider: 'B', handler: async () => 'ok', priority: 4, capabilities: { typicalLatencyMs: 500 } },
		] as any;
		const scored = p.select('TEXT_SMALL', providers, { promptLength: 50, promptLengthThreshold: 100 });
		expect(scored[0].provider.provider).toBe('A');
	});
});
