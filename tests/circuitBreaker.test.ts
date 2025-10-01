import { describe, it, expect } from 'vitest';
import { CircuitBreaker } from '../src/core/circuitBreaker';

describe('CircuitBreaker', () => {
	it('opens after threshold and half-opens after cooloff', async () => {
		const cb = new CircuitBreaker({ failureThreshold: 2, coolOffMs: 50 });
		cb.onFailure('prov', 'T');
		expect(cb.isOpen('prov', 'T')).toBe(false);
		cb.onFailure('prov', 'T');
		expect(cb.isOpen('prov', 'T')).toBe(true);
		await new Promise((r) => setTimeout(r, 60));
		expect(cb.isOpen('prov', 'T')).toBe(false);
	});
});
