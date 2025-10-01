import type { ModelTypeName } from "../types/model";
import type { RegisteredProvider, ProviderHandler } from "../types/provider";

export class ModelRegistry {
	private readonly modelTypeToProviders: Map<string, RegisteredProvider[]> = new Map();

	registerModel(
		modelType: ModelTypeName | string,
		handler: ProviderHandler,
		provider: string,
		priority: number = 0,
		capabilities?: Record<string, any>
	): void {
		const key = String(modelType);
		if (!this.modelTypeToProviders.has(key)) {
			this.modelTypeToProviders.set(key, []);
		}
		const providers = this.modelTypeToProviders.get(key)!;

		const registration: RegisteredProvider = {
			modelType: key,
			handler,
			provider,
			priority,
			capabilities,
		};

		providers.push(registration);

		providers.sort((a, b) => {
			const ap = a.priority ?? 0;
			const bp = b.priority ?? 0;
			if (bp !== ap) return bp - ap; // higher priority first
			// tie-breaker: stable by insertion order (providers.push preserves order)
			return 0;
		});
	}

	getProviders(modelType: ModelTypeName | string): RegisteredProvider[] {
		return [...(this.modelTypeToProviders.get(String(modelType)) ?? [])];
	}

	getAll(): Map<string, RegisteredProvider[]> {
		return this.modelTypeToProviders;
	}

	clear(): void {
		this.modelTypeToProviders.clear();
	}
}

export const globalRegistry = new ModelRegistry();