import type { ElizaOSBaseline } from '../baseline/elizaos-baseline';
import type { SmartRouter } from '../smart/smart-router';
import type { CallRecordWithCost, TestSuiteResults } from '../types/comparison';

export class RealWorldScenariosSuite {
  constructor(
    private baseline: ElizaOSBaseline,
    private smartRouter: SmartRouter
  ) {}
  
  async runCustomerSupportTests(): Promise<TestSuiteResults> {
    const customerQueries = [
      "Help with order tracking",
      "Return policy for electronics",
      "Change shipping address",
      "Cancel subscription",
      "Product warranty info",
      "Checkout error help",
      "Business hours",
      "Shipping time to California"
    ];
    
    const baselineResults: CallRecordWithCost[] = [];
    const smartResults: CallRecordWithCost[] = [];
    
    for (const query of customerQueries) {
      try {
        const baselineResult = await this.baseline.useModel('TEXT_SMALL', { prompt: query });
        baselineResults.push(baselineResult);
        
        const smartResult = await this.smartRouter.useModel('TEXT_SMALL', { prompt: query });
        smartResults.push(smartResult);
      } catch (error) {
        console.warn(`Customer support test failed: ${query}`, error);
        baselineResults.push({
          group: 'TEXT_SMALL',
          provider: 'failed',
          latencyMs: 0,
          success: false,
          promptLength: query.length,
          outputLength: 0,
          timestamp: Date.now()
        });
        smartResults.push({
          group: 'TEXT_SMALL',
          provider: 'failed',
          latencyMs: 0,
          success: false,
          promptLength: query.length,
          outputLength: 0,
          timestamp: Date.now()
        });
      }
    }
    
    return { baseline: baselineResults, smart: smartResults };
  }
  
  async runContentGenerationTests(): Promise<TestSuiteResults> {
    const contentPrompts = [
      "Write about sustainable living",
      "Eco-friendly water bottles description",
      "Social media caption about Earth Day",
      "Newsletter headline about renewable energy",
      "FAQ for solar panel company",
      "Call-to-action for recycling",
      "Case study about green building",
      "Press release about carbon neutrality"
    ];
    
    const baselineResults: CallRecordWithCost[] = [];
    const smartResults: CallRecordWithCost[] = [];
    
    for (const prompt of contentPrompts) {
      try {
        const baselineResult = await this.baseline.useModel('TEXT_LARGE', { prompt });
        baselineResults.push(baselineResult);
        
        const smartResult = await this.smartRouter.useModel('TEXT_LARGE', { prompt });
        smartResults.push(smartResult);
      } catch (error) {
        console.warn(`Content generation test failed: ${prompt}`, error);
        baselineResults.push({
          group: 'TEXT_LARGE',
          provider: 'failed',
          latencyMs: 0,
          success: false,
          promptLength: prompt.length,
          outputLength: 0,
          timestamp: Date.now()
        });
        smartResults.push({
          group: 'TEXT_LARGE',
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
  
  async runDataProcessingTests(): Promise<TestSuiteResults> {
    const schema = {
      type: "object",
      properties: {
        sentiment: { type: "string", enum: ["positive", "negative", "neutral"] },
        keywords: { type: "array", items: { type: "string" } }
      },
      required: ["sentiment", "keywords"]
    };
    
    const dataProcessingPrompts = [
      "Analyze: 'Great service, fast delivery'",
      "Analyze: 'Product okay, slow shipping'",
      "Analyze: 'User-friendly website'",
      "Analyze: 'Poor quality product'",
      "Analyze: 'Average experience'",
      "Analyze: 'Excellent customer service'",
      "Analyze: 'Product damaged, easy replacement'",
      "Analyze: 'Love design, price too high'"
    ];
    
    const baselineResults: CallRecordWithCost[] = [];
    const smartResults: CallRecordWithCost[] = [];
    
    for (const prompt of dataProcessingPrompts) {
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
        console.warn(`Data processing test failed: ${prompt}`, error);
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
  
  async runSemanticSearchTests(): Promise<TestSuiteResults> {
    const documents = [
      "Solar panels convert sunlight to electricity.",
      "Wind turbines generate clean energy.",
      "Electric vehicles reduce emissions.",
      "Recycling programs reduce waste.",
      "LED bulbs are energy-efficient.",
      "Green buildings use sustainable materials.",
      "Carbon offsets neutralize emissions.",
      "Hydroelectric power generates electricity."
    ];
    
    const query = "renewable energy sources";
    
    const baselineResults: CallRecordWithCost[] = [];
    const smartResults: CallRecordWithCost[] = [];
    
    for (const document of documents) {
      try {
        const baselineResult = await this.baseline.useModel('TEXT_EMBEDDING', { text: document });
        baselineResults.push(baselineResult);
        
        const smartResult = await this.smartRouter.useModel('TEXT_EMBEDDING', { text: document });
        smartResults.push(smartResult);
      } catch (error) {
        console.warn(`Semantic search test failed: ${document}`, error);
        baselineResults.push({
          group: 'TEXT_EMBEDDING',
          provider: 'failed',
          latencyMs: 0,
          success: false,
          promptLength: document.length,
          outputLength: 0,
          timestamp: Date.now()
        });
        smartResults.push({
          group: 'TEXT_EMBEDDING',
          provider: 'failed',
          latencyMs: 0,
          success: false,
          promptLength: document.length,
          outputLength: 0,
          timestamp: Date.now()
        });
      }
    }
    
    return { baseline: baselineResults, smart: smartResults };
  }
  
  async runMixedWorkloadTests(): Promise<TestSuiteResults> {
    console.log('Running mixed workload tests...');
    
    const mixedTasks = [
      // Customer support
      { type: 'TEXT_SMALL', prompt: "Help me with my account login issue" },
      { type: 'TEXT_SMALL', prompt: "What's your refund policy?" },
      
      // Content generation
      { type: 'TEXT_LARGE', prompt: "Write a product description for organic cotton t-shirts" },
      { type: 'TEXT_LARGE', prompt: "Create a blog post about sustainable fashion" },
      
      // Data processing
      { type: 'OBJECT_SMALL', prompt: "Extract key info from: 'Great product, fast shipping, 5 stars!'", schema: {
        type: "object",
        properties: {
          rating: { type: "number" },
          sentiment: { type: "string" },
          aspects: { type: "array", items: { type: "string" } }
        },
        required: ["rating", "sentiment", "aspects"]
      }},
      
      // Embeddings
      { type: 'TEXT_EMBEDDING', text: "Sustainable agriculture practices protect soil health" },
      { type: 'TEXT_EMBEDDING', text: "Renewable energy reduces carbon emissions" },
      
      // More mixed tasks
      { type: 'TEXT_SMALL', prompt: "Generate a creative tagline for eco-friendly products" },
      { type: 'TEXT_LARGE', prompt: "Write a detailed explanation of carbon footprint reduction" }
    ];
    
    const baselineResults: CallRecordWithCost[] = [];
    const smartResults: CallRecordWithCost[] = [];
    
    for (const task of mixedTasks) {
      try {
        let baselineResult;
        let smartResult;
        
        if (task.type === 'TEXT_EMBEDDING') {
          baselineResult = await this.baseline.useModel(task.type, { text: task.text });
          smartResult = await this.smartRouter.useModel(task.type, { text: task.text });
        } else {
          const params = { prompt: task.prompt };
          if (task.schema) {
            (params as any).schema = task.schema;
          }
          baselineResult = await this.baseline.useModel(task.type, params);
          smartResult = await this.smartRouter.useModel(task.type, params);
        }
        
        baselineResults.push(baselineResult);
        smartResults.push(smartResult);
      } catch (error) {
        console.warn(`Mixed workload test failed: ${task.type}`, error);
        baselineResults.push({
          group: task.type,
          provider: 'failed',
          latencyMs: 0,
          success: false,
          promptLength: task.prompt?.length || task.text?.length || 0,
          outputLength: 0,
          timestamp: Date.now()
        });
        smartResults.push({
          group: task.type,
          provider: 'failed',
          latencyMs: 0,
          success: false,
          promptLength: task.prompt?.length || task.text?.length || 0,
          outputLength: 0,
          timestamp: Date.now()
        });
      }
    }
    
    return { baseline: baselineResults, smart: smartResults };
  }
  
  async runAllRealWorldTests(): Promise<{
    customerSupport: TestSuiteResults;
    contentGeneration: TestSuiteResults;
    dataProcessing: TestSuiteResults;
    semanticSearch: TestSuiteResults;
    mixedWorkload: TestSuiteResults;
  }> {
    console.log('Running real-world scenario tests...');
    
    const customerSupport = await this.runCustomerSupportTests();
    console.log(`Customer support tests: ${customerSupport.baseline.length} baseline, ${customerSupport.smart.length} smart`);
    
    const contentGeneration = await this.runContentGenerationTests();
    console.log(`Content generation tests: ${contentGeneration.baseline.length} baseline, ${contentGeneration.smart.length} smart`);
    
    const dataProcessing = await this.runDataProcessingTests();
    console.log(`Data processing tests: ${dataProcessing.baseline.length} baseline, ${dataProcessing.smart.length} smart`);
    
    const semanticSearch = await this.runSemanticSearchTests();
    console.log(`Semantic search tests: ${semanticSearch.baseline.length} baseline, ${semanticSearch.smart.length} smart`);
    
    const mixedWorkload = await this.runMixedWorkloadTests();
    console.log(`Mixed workload tests: ${mixedWorkload.baseline.length} baseline, ${mixedWorkload.smart.length} smart`);
    
    return {
      customerSupport,
      contentGeneration,
      dataProcessing,
      semanticSearch,
      mixedWorkload
    };
  }
}