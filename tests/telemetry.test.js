import { describe, it, expect } from 'vitest';
import { Telemetry } from '../src/core/telemetry';
describe('Telemetry', () => {
    it('computes p50/p95 and counts', () => {
        const t = new Telemetry(10);
        for (let i = 1; i <= 10; i++) {
            t.record({ provider: 'p', modelType: 'T', latencyMs: i * 10, timestamp: Date.now(), outcome: i % 3 === 0 ? 'failure' : 'success' });
        }
        const stats = t.getStats('p', 'T');
        expect(stats.count).toBe(10);
        expect(stats.success).toBeGreaterThan(0);
        expect(stats.p50Latency).not.toBeNull();
        expect(stats.p95Latency).not.toBeNull();
    });
});
