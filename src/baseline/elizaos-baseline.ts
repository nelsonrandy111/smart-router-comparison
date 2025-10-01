import type { RegisteredProvider } from '../types/provider';
import type { CallRecord } from '../types/comparison';
import { globalRegistry } from '../core/registry';

export class ElizaOSBaseline {
  async useModel(modelType: string, params: any): Promise<CallRecord> {
    const providers = globalRegistry.getProviders(modelType);
    
    // ElizaOS behavior: Sort by priority, use highest
    const sorted = providers.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    
    if (sorted.length === 0) {
      throw new Error(`No providers for ${modelType}`);
    }
    
    const start = Date.now();
    let result: any;
    let provider: string;
    
    try {
      // Try primary provider (ElizaOS behavior)
      const primaryProvider = sorted[0];
      result = await primaryProvider.handler(params);
      provider = primaryProvider.provider;
    } catch (error) {
      // Basic fallback for realistic failure rates with local models
      if (sorted.length > 1) {
        try {
          const fallbackProvider = sorted[1];
          result = await fallbackProvider.handler(params);
          provider = `${fallbackProvider.provider}-fallback`;
        } catch (fallbackError) {
          // Include provider info in the error
          if (fallbackError && typeof fallbackError === 'object') {
            (fallbackError as any).attemptedProviders = `${sorted[0].provider}, ${sorted[1].provider}`;
            (fallbackError as any).lastAttemptedProvider = sorted[1].provider;
          }
          throw fallbackError;
        }
      } else {
        // Include provider info in the error
        if (error && typeof error === 'object') {
          (error as any).attemptedProviders = sorted[0].provider;
          (error as any).lastAttemptedProvider = sorted[0].provider;
        }
        throw error;
      }
    }
    
    const latencyMs = Date.now() - start;
    
    return {
      group: modelType,
      provider,
      latencyMs,
      success: this.validateResult(result, modelType),
      jsonValid: this.validateJson(result, params),
      promptLength: params.prompt?.length || params.text?.length || 0,
      outputLength: this.getOutputLength(result),
      timestamp: Date.now()
    };
  }
  
  private validateResult(result: any, modelType: string): boolean {
    switch (modelType) {
      case 'TEXT_SMALL':
      case 'TEXT_LARGE':
        return typeof result === 'string' && result.length > 0;
      case 'TEXT_EMBEDDING':
        return Array.isArray(result) && result.length > 0;
      case 'OBJECT_SMALL':
      case 'OBJECT_LARGE':
        return typeof result === 'object' && result !== null;
      default:
        return true;
    }
  }
  
  private validateJson(result: any, params: any): boolean {
    if (!params.schema) return true; // No schema to validate against
    
    if (typeof result === 'string') {
      try {
        const parsed = JSON.parse(result);
        return this.validateAgainstSchema(parsed, params.schema);
      } catch {
        return false;
      }
    }
    
    return this.validateAgainstSchema(result, params.schema);
  }
  
  private validateAgainstSchema(obj: any, schema: any): boolean {
    // Basic schema validation - check required fields
    if (schema.required) {
      for (const field of schema.required) {
        if (!(field in obj)) {
          return false;
        }
      }
    }
    
    // Check property types
    if (schema.properties) {
      for (const [key, value] of Object.entries(obj)) {
        if (schema.properties[key]) {
          const propSchema = schema.properties[key] as any;
          if (propSchema.type === 'string' && typeof value !== 'string') {
            return false;
          }
          if (propSchema.type === 'number' && typeof value !== 'number') {
            return false;
          }
          if (propSchema.type === 'array' && !Array.isArray(value)) {
            return false;
          }
          if (propSchema.type === 'object' && (typeof value !== 'object' || Array.isArray(value))) {
            return false;
          }
        }
      }
    }
    
    return true;
  }
  
  private getOutputLength(result: any): number {
    if (typeof result === 'string') return result.length;
    if (Array.isArray(result)) return result.length;
    if (typeof result === 'object') return JSON.stringify(result).length;
    return 0;
  }
}