import { Router } from '../core/router';
import { CostEstimator } from '../core/costs';
import type { RouterOptions } from '../core/router';
import type { CallRecordWithCost } from '../types/comparison';

export class SmartRouter {
  private router: Router;
  private costEstimator: CostEstimator;
  
  constructor(options: RouterOptions = {}) {
    this.router = new Router({
      perCallTimeoutMs: 300_000,
      sessionBudget: options.sessionBudget || 1.0,
      ...options
    });
    this.costEstimator = new CostEstimator();
  }
  
  async useModel(modelType: string, params: any): Promise<CallRecordWithCost> {
    const start = Date.now();
    
    try {
      const { result, provider, costEstimate } = await this.router.useModelWithInfo(
        modelType,
        params,
        {
          promptLength: params.prompt?.length || params.text?.length || 0,
          hasSchema: !!params.schema,
          costWeight: 1.0,
          expectedOutputTokens: this.estimateExpectedTokens(params)
        }
      );
      
      const latencyMs = Date.now() - start;
      
      return {
        group: modelType,
        provider,
        latencyMs,
        success: this.validateResult(result, modelType),
        jsonValid: this.validateJson(result, params),
        costEstimate,
        promptLength: params.prompt?.length || params.text?.length || 0,
        outputLength: this.getOutputLength(result),
        timestamp: Date.now()
      };
    } catch (error) {
      const latencyMs = Date.now() - start;
      // Get the last attempted provider from the error
      let attemptedProvider = 'unknown';
      if (error && typeof error === 'object') {
        if ('lastAttemptedProvider' in error) {
          attemptedProvider = (error as any).lastAttemptedProvider;
        } else if ('attemptedProviders' in error) {
          const providers = (error as any).attemptedProviders;
          if (providers && providers.length > 0) {
            attemptedProvider = providers.split(', ').pop() || 'unknown';
          }
        }
      }
      
      return {
        group: modelType,
        provider: attemptedProvider,
        latencyMs,
        success: false,
        jsonValid: false,
        promptLength: params.prompt?.length || params.text?.length || 0,
        outputLength: 0,
        timestamp: Date.now()
      };
    }
  }
  
  private estimateExpectedTokens(params: any): number {
    // Simple heuristic based on prompt length
    const promptLength = params.prompt?.length || params.text?.length || 0;
    return Math.ceil(promptLength / 4.0); // Rough estimate
  }
  
  private validateResult(result: any, modelType: string): boolean {
    // Same validation logic as baseline
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