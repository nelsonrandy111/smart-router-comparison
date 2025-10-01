import { ModelType } from '../../types/model';
import type { TextEmbeddingParams } from '../../types/model';
import type { ProviderHandler } from '../../types/provider';
import axios from 'axios';
import { globalRegistry } from '../../core/registry';

function getBaseUrl(): string {
	return (process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434').replace(/\/$/, '');
}

async function generateEmbedding(model: string, input: string, timeout: number = 30000): Promise<number[]> {
	const url = `${getBaseUrl()}/api/embeddings`;
	const body = { model, prompt: input } as any;
	const res = await axios.post(url, body, { timeout });
	// Ollama returns { embedding: number[], ... }
	return res.data?.embedding ?? [];
}

function makeEmbeddingHandler(modelName: string): ProviderHandler {
	return async (params: TextEmbeddingParams | string | null): Promise<number[]> => {
		const text = typeof params === 'string' ? params : (params?.text ?? '');
		const timeout = typeof params === 'object' && params ? (params as any).timeout : undefined;
		return generateEmbedding(modelName, text, timeout || 30000);
	};
}

export function registerDefaultOllamaEmbeddingProviders(): void {
	// nomic-embed-text - mapped to text-embedding-3-small for cost simulation
	globalRegistry.registerModel(
		ModelType.TEXT_EMBEDDING,
		makeEmbeddingHandler('nomic-embed-text'),
		'ollama-nomic-embed-text',
		7,
		{ 
			modelName: 'nomic-embed-text', 
			typicalLatencyMs: 200,
			cost: {
				simulatedModelName: 'text-embedding-3-small',
				tokenCharsPerToken: 4.0,
				requestFixedFeeUSD: 0,
				discountFactor: 1.0
			}
		}
	);

	// all-minilm - mapped to text-embedding-3-small for cost simulation
	globalRegistry.registerModel(
		ModelType.TEXT_EMBEDDING,
		makeEmbeddingHandler('all-minilm'),
		'ollama-all-minilm',
		6,
		{ 
			modelName: 'all-minilm', 
			typicalLatencyMs: 180,
			cost: {
				simulatedModelName: 'text-embedding-3-small',
				tokenCharsPerToken: 4.0,
				requestFixedFeeUSD: 0,
				discountFactor: 1.0
			}
		}
	);
}