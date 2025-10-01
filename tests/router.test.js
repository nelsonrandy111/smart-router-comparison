import { describe, it, expect } from 'vitest';
import { Router } from '../src/core/router';
import { globalRegistry } from '../src/core/registry';
import { ModelType } from '../src/types/model';
function delayedResolve(v, ms) {
    return new Promise((res) => setTimeout(() => res(v), ms));
}
function delayedReject(ms) {
    return new Promise((_res, rej) => setTimeout(() => rej(new Error('fail')), ms));
}
describe('Router', () => {
    it('selects fastest successful provider and falls back on failure', async () => {
        globalRegistry.clear();
        globalRegistry.registerModel(ModelType.TEXT_SMALL, async () => { await delayedReject(50); }, 'prov-fail', 5, { typicalLatencyMs: 500 });
        globalRegistry.registerModel(ModelType.TEXT_SMALL, async () => { return delayedResolve('ok', 10); }, 'prov-fast', 4, { typicalLatencyMs: 100 });
        const router = new Router({ perCallTimeoutMs: 200, maxRetries: 2 });
        const out = await router.useModel(ModelType.TEXT_SMALL, { prompt: 'hi' }, { promptLength: 2 });
        expect(out).toBe('ok');
    });
});
