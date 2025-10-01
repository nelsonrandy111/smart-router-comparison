export type ModelTypeName = (typeof ModelType)[keyof typeof ModelType] | string;

export const ModelType = {
  TEXT_SMALL: 'TEXT_SMALL',
  TEXT_LARGE: 'TEXT_LARGE',
  TEXT_EMBEDDING: 'TEXT_EMBEDDING',
  OBJECT_SMALL: 'OBJECT_SMALL',
  OBJECT_LARGE: 'OBJECT_LARGE',
} as const;

export interface BaseModelParams {}

export interface TextGenerationParams extends BaseModelParams {
  prompt: string;
  temperature?: number;
  maxTokens?: number;
  stopSequences?: string[];
}

export interface TextEmbeddingParams extends BaseModelParams {
  text: string;
}

export type JSONSchema = {
  type: string;
  properties?: Record<string, any>;
  required?: string[];
  items?: JSONSchema;
  [key: string]: any;
};

export interface ObjectGenerationParams extends BaseModelParams {
  prompt: string;
  schema?: JSONSchema;
  output?: 'object' | 'array' | 'enum';
  enumValues?: string[];
  temperature?: number;
  stopSequences?: string[];
}

export interface ModelParamsMap {
  [ModelType.TEXT_SMALL]: TextGenerationParams;
  [ModelType.TEXT_LARGE]: TextGenerationParams;
  [ModelType.TEXT_EMBEDDING]: TextEmbeddingParams | string | null;
  [ModelType.OBJECT_SMALL]: ObjectGenerationParams;
  [ModelType.OBJECT_LARGE]: ObjectGenerationParams;
  [key: string]: BaseModelParams | any;
}

export interface ModelResultMap {
  [ModelType.TEXT_SMALL]: string;
  [ModelType.TEXT_LARGE]: string;
  [ModelType.TEXT_EMBEDDING]: number[];
  [ModelType.OBJECT_SMALL]: any;
  [ModelType.OBJECT_LARGE]: any;
  [key: string]: any;
}

export interface ProviderCapabilities {
  provider: string;
  modelName: string;
  maxContextTokens?: number;
  jsonReliabilityScore?: number; // 0..1 heuristic
  typicalLatencyMs?: number;
  supportsJsonMode?: boolean;
}
