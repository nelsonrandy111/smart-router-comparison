import type { ElizaOSBaseline } from '../baseline/elizaos-baseline';
import type { SmartRouter } from '../smart/smart-router';
import type { CallRecordWithCost, TestSuiteResults, BenchmarkTask } from '../types/comparison';

export class BasicFunctionalityTests {
  constructor(
    private baseline: ElizaOSBaseline,
    private smartRouter: SmartRouter
  ) {}

  private getAttemptedProvider(error: any): string {
    if (error && typeof error === 'object') {
      if ('lastAttemptedProvider' in error) {
        return (error as any).lastAttemptedProvider;
      } else if ('attemptedProviders' in error) {
        const providers = (error as any).attemptedProviders;
        if (providers && providers.length > 0) {
          return providers.split(', ').pop() || 'unknown';
        }
      }
    }
    return 'unknown';
  }
  
  async runTextSmallTests(): Promise<TestSuiteResults> {
    const tasks: BenchmarkTask[] = [
      { prompt: "Say hello", minChars: 5 },
      { prompt: "Meeting at 2pm", minChars: 10 },
      { prompt: "Tweet about energy", minChars: 15 },
      { prompt: "Weather is nice", minChars: 10 },
      { prompt: "2+2=?", minChars: 3 },
      { prompt: "Creative hello", minChars: 10 },
      { prompt: "What is photosynthesis?", minChars: 15 },
      { prompt: "Thank you", minChars: 8 }
    ];
    
    const baselineResults: CallRecordWithCost[] = [];
    const smartResults: CallRecordWithCost[] = [];
    
    for (const task of tasks) {
      try {
        // Run baseline
        const baselineResult = await this.baseline.useModel('TEXT_SMALL', { prompt: task.prompt });
        baselineResults.push(baselineResult);
        
        // Run smart routing
        const smartResult = await this.smartRouter.useModel('TEXT_SMALL', { prompt: task.prompt });
        smartResults.push(smartResult);
      } catch (error) {
        console.warn(`Test failed for prompt: ${task.prompt}`, error);
        
        // Get attempted provider from error
        const attemptedProvider = this.getAttemptedProvider(error);
        
        // Add failed results with actual attempted provider
        baselineResults.push({
          group: 'TEXT_SMALL',
          provider: attemptedProvider,
          latencyMs: 0,
          success: false,
          promptLength: task.prompt.length,
          outputLength: 0,
          timestamp: Date.now()
        });
        smartResults.push({
          group: 'TEXT_SMALL',
          provider: attemptedProvider,
          latencyMs: 0,
          success: false,
          promptLength: task.prompt.length,
          outputLength: 0,
          timestamp: Date.now()
        });
      }
    }
    
    return { baseline: baselineResults, smart: smartResults };
  }
  
  async runTextLargeTests(): Promise<TestSuiteResults> {
    const tasks: BenchmarkTask[] = [
      { prompt: "What is quantum computing?", minChars: 20 },
      { prompt: "Benefits of renewable energy", minChars: 30 },
      { prompt: "How does photosynthesis work?", minChars: 25 },
      { prompt: "What is machine learning?", minChars: 20 },
      { prompt: "History of the internet", minChars: 25 },
      { prompt: "What is the water cycle?", minChars: 20 }
    ];
    
    const baselineResults: CallRecordWithCost[] = [];
    const smartResults: CallRecordWithCost[] = [];
    
    for (const task of tasks) {
      try {
        const baselineResult = await this.baseline.useModel('TEXT_LARGE', { prompt: task.prompt });
        baselineResults.push(baselineResult);
        
        const smartResult = await this.smartRouter.useModel('TEXT_LARGE', { prompt: task.prompt });
        smartResults.push(smartResult);
      } catch (error) {
        console.warn(`Test failed for prompt: ${task.prompt}`, error);
        baselineResults.push({
          group: 'TEXT_LARGE',
          provider: 'failed',
          latencyMs: 0,
          success: false,
          promptLength: task.prompt.length,
          outputLength: 0,
          timestamp: Date.now()
        });
        smartResults.push({
          group: 'TEXT_LARGE',
          provider: 'failed',
          latencyMs: 0,
          success: false,
          promptLength: task.prompt.length,
          outputLength: 0,
          timestamp: Date.now()
        });
      }
    }
    
    return { baseline: baselineResults, smart: smartResults };
  }
  
  async runObjectGenerationTests(): Promise<TestSuiteResults> {
    const schema = {
      type: "object",
      properties: {
        title: { type: "string" },
        tags: { type: "array", items: { type: "string" } }
      },
      required: ["title", "tags"]
    };
    
    const prompts = [
      "JSON about recycling",
      "JSON about air quality",
      "JSON about renewable energy",
      "JSON about water conservation",
      "JSON about solar power"
    ];
    
    const baselineResults: CallRecordWithCost[] = [];
    const smartResults: CallRecordWithCost[] = [];
    
    for (const prompt of prompts) {
      try {
        const baselineResult = await this.baseline.useModel('OBJECT_SMALL', { 
          prompt, 
          schema 
        });
        baselineResults.push(baselineResult);
        
        const smartResult = await this.smartRouter.useModel('OBJECT_SMALL', { 
          prompt, 
          schema 
        });
        smartResults.push(smartResult);
      } catch (error) {
        console.warn(`Test failed for prompt: ${prompt}`, error);
        baselineResults.push({
          group: 'OBJECT_SMALL',
          provider: 'failed',
          latencyMs: 0,
          success: false,
          promptLength: prompt.length,
          outputLength: 0,
          timestamp: Date.now()
        });
        smartResults.push({
          group: 'OBJECT_SMALL',
          provider: 'failed',
          latencyMs: 0,
          success: false,
          promptLength: prompt.length,
          outputLength: 0,
          timestamp: Date.now()
        });
      }
    }
    
    return { baseline: baselineResults, smart: smartResults };
  }
  
  async runEmbeddingTests(): Promise<TestSuiteResults> {
    const texts = [
      "Machine learning is AI.",
      "Solar and wind power.",
      "Exercise improves health.",
      "Climate change affects weather.",
      "Technology transforms communication.",
      "Sustainable agriculture protects environment."
    ];
    
    const baselineResults: CallRecordWithCost[] = [];
    const smartResults: CallRecordWithCost[] = [];
    
    for (const text of texts) {
      try {
        const baselineResult = await this.baseline.useModel('TEXT_EMBEDDING', { text });
        baselineResults.push(baselineResult);
        
        const smartResult = await this.smartRouter.useModel('TEXT_EMBEDDING', { text });
        smartResults.push(smartResult);
      } catch (error) {
        console.warn(`Test failed for text: ${text}`, error);
        baselineResults.push({
          group: 'TEXT_EMBEDDING',
          provider: 'failed',
          latencyMs: 0,
          success: false,
          promptLength: text.length,
          outputLength: 0,
          timestamp: Date.now()
        });
        smartResults.push({
          group: 'TEXT_EMBEDDING',
          provider: 'failed',
          latencyMs: 0,
          success: false,
          promptLength: text.length,
          outputLength: 0,
          timestamp: Date.now()
        });
      }
    }
    
    return { baseline: baselineResults, smart: smartResults };
  }
  
  async runAllBasicTests(): Promise<{
    textSmall: TestSuiteResults;
    textLarge: TestSuiteResults;
    objectGeneration: TestSuiteResults;
    embedding: TestSuiteResults;
  }> {
    console.log('Running basic functionality tests...');
    
    const textSmall = await this.runTextSmallTests();
    console.log(`Text Small tests: ${textSmall.baseline.length} baseline, ${textSmall.smart.length} smart`);
    
    const textLarge = await this.runTextLargeTests();
    console.log(`Text Large tests: ${textLarge.baseline.length} baseline, ${textLarge.smart.length} smart`);
    
    const objectGeneration = await this.runObjectGenerationTests();
    console.log(`Object Generation tests: ${objectGeneration.baseline.length} baseline, ${objectGeneration.smart.length} smart`);
    
    const embedding = await this.runEmbeddingTests();
    console.log(`Embedding tests: ${embedding.baseline.length} baseline, ${embedding.smart.length} smart`);
    
    return {
      textSmall,
      textLarge,
      objectGeneration,
      embedding
    };
  }
}