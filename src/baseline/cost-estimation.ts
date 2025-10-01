import { CostEstimator } from '../core/costs';
import type { CallRecord, CallRecordWithCost } from '../types/comparison';

export class BaselineCostEstimator {
  private costEstimator: CostEstimator;
  private providerMapping: Record<string, string>;
  
  constructor() {
    this.costEstimator = new CostEstimator();
    this.providerMapping = {
      'ollama-phi3-mini': 'gpt-4o-mini',
      'ollama-mistral-7b': 'claude-3-5-haiku-20241022',
      'ollama-llama3-8b': 'gpt-4o-mini',
      'ollama-nomic-embed-text': 'text-embedding-3-small',
      'ollama-all-minilm': 'text-embedding-3-small'
    };
  }
  
  estimateCostsForBaseline(baselineResults: CallRecord[]): CallRecordWithCost[] {
    return baselineResults.map(record => {
      const simulatedModel = this.providerMapping[record.provider] || 'gpt-4o-mini';
      const estimatedOutputTokens = this.estimateOutputTokens(record);
      
      const estimatedCost = this.costEstimator.estimateCost({
        promptChars: record.promptLength,
        expectedOutputTokens: estimatedOutputTokens,
        simulatedModelName: simulatedModel,
        charsPerToken: this.getCharsPerToken(record.provider),
        requestFixedFeeUSD: 0,
        discountFactor: 1.0
      });
      
      return {
        ...record,
        estimatedCost,
        simulatedModelName: simulatedModel
      };
    });
  }
  
  private estimateOutputTokens(record: CallRecord): number {
    // Model-specific token estimation based on output length
    const tokenRatios: Record<string, number> = {
      'ollama-phi3-mini': 4.2,
      'ollama-mistral-7b': 4.0,
      'ollama-llama3-8b': 3.8,
      'ollama-nomic-embed-text': 4.0,
      'ollama-all-minilm': 4.0
    };
    
    const ratio = tokenRatios[record.provider] || 4.0;
    return Math.ceil(record.outputLength / ratio);
  }
  
  private getCharsPerToken(provider: string): number {
    const ratios: Record<string, number> = {
      'ollama-phi3-mini': 4.2,
      'ollama-mistral-7b': 4.0,
      'ollama-llama3-8b': 3.8,
      'ollama-nomic-embed-text': 4.0,
      'ollama-all-minilm': 4.0
    };
    return ratios[provider] || 4.0;
  }
}