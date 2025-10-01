import costsData from './costs.json';

export interface ModelCosts {
  input: number;  // per 1K tokens
  output: number; // per 1K tokens
}

export interface CostEstimateParams {
  promptChars: number;
  expectedOutputTokens?: number;
  simulatedModelName: string;
  charsPerToken?: number;
  requestFixedFeeUSD?: number;
  discountFactor?: number;
}

export interface CostEstimate {
  inputTokens: number;
  outputTokens: number;
  inputCostUSD: number;
  outputCostUSD: number;
  fixedFeeUSD: number;
  totalUSD: number;
  simulatedModelName: string;
}

export class CostEstimator {
  private costs: Record<string, ModelCosts>;

  constructor() {
    this.costs = costsData as Record<string, ModelCosts>;
  }

  /**
   * Estimate tokens from character count using model-specific ratios
   */
  private estimateTokens(chars: number, charsPerToken: number = 4.0): number {
    return Math.ceil(chars / charsPerToken);
  }

  /**
   * Get cost rates for a simulated model, falling back to default
   */
  private getModelCosts(simulatedModelName: string): ModelCosts {
    return this.costs[simulatedModelName] || this.costs.default;
  }

  /**
   * Estimate the cost of a request
   */
  estimateCost(params: CostEstimateParams): CostEstimate {
    const {
      promptChars,
      expectedOutputTokens,
      simulatedModelName,
      charsPerToken = 4.0,
      requestFixedFeeUSD = 0,
      discountFactor = 1.0
    } = params;

    // Estimate input tokens
    const inputTokens = this.estimateTokens(promptChars, charsPerToken);
    
    // Estimate output tokens
    let outputTokens: number;
    if (expectedOutputTokens && expectedOutputTokens > 0) {
      outputTokens = expectedOutputTokens;
    } else {
      // Fallback estimation: assume 20% of input length for short responses
      outputTokens = Math.max(1, Math.ceil(inputTokens * 0.2));
    }

    // Get pricing
    const modelCosts = this.getModelCosts(simulatedModelName);
    
    // Calculate costs
    const inputCostUSD = (inputTokens / 1000) * modelCosts.input;
    const outputCostUSD = (outputTokens / 1000) * modelCosts.output;
    const fixedFeeUSD = requestFixedFeeUSD;
    
    // Apply discount factor
    const totalUSD = (inputCostUSD + outputCostUSD + fixedFeeUSD) * discountFactor;

    return {
      inputTokens,
      outputTokens,
      inputCostUSD: inputCostUSD * discountFactor,
      outputCostUSD: outputCostUSD * discountFactor,
      fixedFeeUSD: fixedFeeUSD * discountFactor,
      totalUSD,
      simulatedModelName
    };
  }

  /**
   * Add price variance simulation (±5% jitter)
   */
  estimateCostWithVariance(params: CostEstimateParams): CostEstimate {
    const base = this.estimateCost(params);
    
    // Apply ±5% jitter to input/output rates
    const jitter = (Math.random() - 0.5) * 0.1; // -5% to +5%
    const varianceFactor = 1 + jitter;
    
    return {
      ...base,
      inputCostUSD: base.inputCostUSD * varianceFactor,
      outputCostUSD: base.outputCostUSD * varianceFactor,
      totalUSD: base.totalUSD * varianceFactor
    };
  }

  /**
   * Get all available model names
   */
  getAvailableModels(): string[] {
    return Object.keys(this.costs);
  }

  /**
   * Check if a model has pricing data
   */
  hasModelPricing(modelName: string): boolean {
    return modelName in this.costs;
  }
}

// Default instance
export const costEstimator = new CostEstimator();