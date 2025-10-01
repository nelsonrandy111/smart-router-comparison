import type { ModelTypeName } from './model';

export type ProviderHandler = (params: any) => Promise<any>;

export interface CostCapabilities {
  simulatedModelName: string;
  tokenCharsPerToken?: number; // e.g., 4.0 for most models
  requestFixedFeeUSD?: number; // per-request fee
  discountFactor?: number; // enterprise discount, e.g., 0.8 for 20% off
}

export interface RegisteredProvider {
  modelType: ModelTypeName | string;
  provider: string;
  handler: ProviderHandler;
  priority?: number;
  capabilities?: Record<string, any> & {
    cost?: CostCapabilities;
  };
}
