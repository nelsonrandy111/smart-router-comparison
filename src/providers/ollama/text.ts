import { ModelType } from '../../types/model';
import type { TextGenerationParams } from '../../types/model';
import type { ProviderHandler } from '../../types/provider';
import { OllamaClient } from './client';
import { globalRegistry } from '../../core/registry';

function getBaseUrl(): string {
	return (process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434').replace(/\/$/, '');
}

function makeTextHandler(modelName: string): ProviderHandler {
	return async (params: TextGenerationParams | any): Promise<string> => {
		let prompt: string = params?.prompt ?? '';
		const temperature: number | undefined = params?.temperature;
		const maxTokens: number | undefined = params?.maxTokens;
		const stopSequences: string[] | undefined = params?.stopSequences;
		const schema: any = params?.schema;
		const timeout: number | undefined = params?.timeout;
		
		// If schema is provided, modify prompt to request JSON output
		if (schema) {
			prompt = `${prompt}\n\nReturn only valid JSON that matches this schema: ${JSON.stringify(schema, null, 2)}\n\nDo not include any other text, explanations, or markdown formatting.`;
		}
		
		const client = new OllamaClient(getBaseUrl(), timeout || 30000);
		return client.generateText(modelName, { prompt, temperature, maxTokens, stopSequences });
	};
}

export function registerDefaultOllamaTextProviders(): void {
	// Small, fast model - mapped to gpt-4o-mini for cost simulation
	globalRegistry.registerModel(
		ModelType.TEXT_SMALL,
		makeTextHandler('phi3:mini'),
		'ollama-phi3-mini',
		5,
		{ 
			modelName: 'phi3:mini', 
			typicalLatencyMs: 400, 
			jsonReliabilityScore: 0.6,
			cost: {
				simulatedModelName: 'gpt-4o-mini',
				tokenCharsPerToken: 4.2, // phi3 specific ratio
				requestFixedFeeUSD: 0,
				discountFactor: 1.0
			}
		}
	);

	// General 7B - mapped to claude-3-5-haiku for cost simulation
	globalRegistry.registerModel(
		ModelType.TEXT_LARGE,
		makeTextHandler('mistral:7b'),
		'ollama-mistral-7b',
		6,
		{ 
			modelName: 'mistral:7b', 
			typicalLatencyMs: 900, 
			jsonReliabilityScore: 0.7,
			cost: {
				simulatedModelName: 'claude-3-5-haiku-20241022',
				tokenCharsPerToken: 4.0, // mistral specific ratio
				requestFixedFeeUSD: 0,
				discountFactor: 1.0
			}
		}
	);

	// Stronger 8B - mapped to gpt-4o-mini (upper bound) for cost simulation
	globalRegistry.registerModel(
		ModelType.TEXT_LARGE,
		makeTextHandler('llama3:8b'),
		'ollama-llama3-8b',
		7,
		{ 
			modelName: 'llama3:8b', 
			typicalLatencyMs: 1100, 
			jsonReliabilityScore: 0.8,
			cost: {
				simulatedModelName: 'gpt-4o-mini',
				tokenCharsPerToken: 3.8, // llama3 specific ratio
				requestFixedFeeUSD: 0,
				discountFactor: 1.0
			}
		}
	);

	// OBJECT_SMALL - same as TEXT_SMALL but with schema support
	globalRegistry.registerModel(
		ModelType.OBJECT_SMALL,
		makeTextHandler('phi3:mini'),
		'ollama-phi3-mini-object',
		5,
		{ 
			modelName: 'phi3:mini', 
			typicalLatencyMs: 400, 
			jsonReliabilityScore: 0.6,
			cost: {
				simulatedModelName: 'gpt-4o-mini',
				tokenCharsPerToken: 4.2,
				requestFixedFeeUSD: 0,
				discountFactor: 1.0
			}
		}
	);

	// OBJECT_LARGE - same as TEXT_LARGE but with schema support
	globalRegistry.registerModel(
		ModelType.OBJECT_LARGE,
		makeTextHandler('mistral:7b'),
		'ollama-mistral-7b-object',
		6,
		{ 
			modelName: 'mistral:7b', 
			typicalLatencyMs: 900,
			jsonReliabilityScore: 0.7,
			cost: {
				simulatedModelName: 'claude-3-5-haiku-20241022',
				tokenCharsPerToken: 4.0,
				requestFixedFeeUSD: 0,
				discountFactor: 1.0
			}
		}
	);
}