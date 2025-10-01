process.env.OLLAMA_BASE_URL = 'http://127.0.0.1:11434';

import { Router } from '../src/core/router';
import { registerDefaultOllamaTextProviders } from '../src/providers/ollama/text';
import { registerDefaultOllamaEmbeddingProviders } from '../src/providers/ollama/embedding';
import { ModelType } from '../src/types/model';

async function main() {
	registerDefaultOllamaTextProviders();
	registerDefaultOllamaEmbeddingProviders();
	const router = new Router({ perCallTimeoutMs: 60_000 });
	const prompt = 'Say hello in one short sentence.';
	const t0 = Date.now();
	try {
		const text = await router.useModel(ModelType.TEXT_SMALL, { prompt }, { promptLength: prompt.length });
		const ms = Date.now() - t0;
		console.log('OK len=', String(text).length, 'ms=', ms);
		console.log(String(text).slice(0, 200));
	} catch (e: any) {
		const ms = Date.now() - t0;
		console.error('SANITY ERROR after', ms, 'ms:', e?.message || e);
		process.exit(1);
	}
}

main();