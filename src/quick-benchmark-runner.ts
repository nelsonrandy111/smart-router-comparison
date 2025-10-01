import { ElizaOSBaseline } from './baseline/elizaos-baseline';
import { BaselineCostEstimator } from './baseline/cost-estimation';
import { SmartRouter } from './smart/smart-router';
import { StatisticalAnalyzer } from './comparison/statistical-analysis';
import { CostComparisonAnalyzer } from './comparison/cost-comparison';
import { ReportGenerator } from './comparison/report-generator';
import { registerDefaultOllamaTextProviders } from './providers/ollama/text';
import { registerDefaultOllamaEmbeddingProviders } from './providers/ollama/embedding';
import type { ComprehensiveComparison, CallRecordWithCost } from './types/comparison';
import * as fs from 'fs';
import * as path from 'path';

export class QuickBenchmarkRunner {
  private baseline: ElizaOSBaseline;
  private smartRouter: SmartRouter;
  private costEstimator: BaselineCostEstimator;
  private statisticalAnalyzer: StatisticalAnalyzer;
  private costAnalyzer: CostComparisonAnalyzer;
  private reportGenerator: ReportGenerator;
  
  constructor() {
    this.baseline = new ElizaOSBaseline();
    this.smartRouter = new SmartRouter();
    this.costEstimator = new BaselineCostEstimator();
    this.statisticalAnalyzer = new StatisticalAnalyzer();
    this.costAnalyzer = new CostComparisonAnalyzer();
    this.reportGenerator = new ReportGenerator();
    
    this.setupProviders();
  }
  
  private setupProviders() {
    console.log('Setting up providers for quick benchmark...');
    
    try {
      registerDefaultOllamaTextProviders();
      registerDefaultOllamaEmbeddingProviders();
      console.log('Default providers registered successfully');
    } catch (error) {
      console.warn('Failed to register default providers:', error);
    }
  }
  
  async runQuickBenchmark(): Promise<ComprehensiveComparison> {
    console.log('Starting QUICK benchmark (target: 15-20 minutes)...');
    console.log('Running reduced test suite for rapid iteration...');
    
    const startTime = Date.now();
    
    // Run reduced test suites
    console.log('\n=== Running Quick Basic Tests ===');
    const basicResults = await this.runQuickBasicTests();
    
    console.log('\n=== Running Quick Real-World Tests ===');
    const realWorldResults = await this.runQuickRealWorldTests();
    
    // Skip stress tests in quick mode
    console.log('\n=== Skipping Stress Tests (Quick Mode) ===');
    
    // Combine results
    const allBaselineResults: CallRecordWithCost[] = [
      ...basicResults.baseline,
      ...realWorldResults.baseline
    ];
    
    const allSmartResults: CallRecordWithCost[] = [
      ...basicResults.smart,
      ...realWorldResults.smart
    ];
    
    console.log(`\n=== Analysis Phase ===`);
    console.log(`Total baseline results: ${allBaselineResults.length}`);
    console.log(`Total smart results: ${allSmartResults.length}`);
    
    // Estimate costs for baseline
    console.log('Estimating baseline costs...');
    const baselineWithCosts = this.costEstimator.estimateCostsForBaseline(allBaselineResults);
    
    // Perform statistical analysis
    console.log('Performing statistical analysis...');
    const statisticalAnalysis = this.statisticalAnalyzer.analyze(baselineWithCosts, allSmartResults);
    
    // Perform cost comparison
    console.log('Analyzing cost comparison...');
    const costComparison = this.costAnalyzer.analyze(baselineWithCosts, allSmartResults);
    
    // Calculate performance metrics
    console.log('Calculating performance metrics...');
    const performance = this.calculatePerformanceMetrics(baselineWithCosts, allSmartResults);
    
    // Calculate provider efficiency
    console.log('Calculating provider efficiency...');
    const providerEfficiency = this.calculateProviderEfficiency(baselineWithCosts, allSmartResults);
    
    const comparison: ComprehensiveComparison = {
      methodology: {
        note: "QUICK MODE: Reduced test suite for rapid development iteration. Comparison between ElizaOS-style baseline and smart routing using local Ollama models with essential test coverage only.",
        limitations: [
          "Quick mode uses reduced test volume (80% fewer tests)",
          "Stress testing and high-volume scenarios skipped",
          "Local models may have higher failure rates than production paid models",
          "Baseline costs are estimated post-hoc (ElizaOS doesn't track costs natively)",
          "Performance characteristics may differ from production environments"
        ],
        assumptions: [
          "Essential test scenarios are representative of full test suite",
          "Circuit breaking in baseline provides realistic failure handling patterns",
          "Cost estimation using equivalent paid model pricing is representative",
          "Local model performance patterns are indicative of production behavior",
          "Provider fallback mechanisms work as expected in both systems"
        ]
      },
      performance,
      cost: costComparison,
      statisticalAnalysis,
      providerEfficiency
    };
    
    // Ensure results directory exists
    const resultsDir = 'results';
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }
    
    // Generate and save report
    console.log('\n=== Generating Quick Report ===');
    const report = this.reportGenerator.generateComprehensiveReport(comparison);
    const reportPath = path.join(resultsDir, 'quick-comparison-report.md');
    fs.writeFileSync(reportPath, report);
    
    // Save raw data with quick prefix
    console.log('Saving quick benchmark data...');
    fs.writeFileSync(path.join(resultsDir, 'quick-baseline-results.json'), JSON.stringify(baselineWithCosts, null, 2));
    fs.writeFileSync(path.join(resultsDir, 'quick-smart-results.json'), JSON.stringify(allSmartResults, null, 2));
    fs.writeFileSync(path.join(resultsDir, 'quick-comparison-data.json'), JSON.stringify(comparison, null, 2));
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.log('\n=== Quick Benchmark Complete ===');
    console.log(`Total duration: ${duration.toFixed(1)} seconds (${(duration / 60).toFixed(1)} minutes)`);
    console.log(`Report saved to: ${reportPath}`);
    console.log(`Raw data saved to: ${resultsDir}/`);
    
    return comparison;
  }
  
  private async runQuickBasicTests(): Promise<{ baseline: CallRecordWithCost[], smart: CallRecordWithCost[] }> {
    // Minimal basic tests - only most essential scenarios to account for longer timeouts
    const tasks = [
      // TEXT_SMALL - 2 tests (reduced from 3) - using shorter prompts to avoid Ollama timeout
      { type: 'TEXT_SMALL', prompt: "Say hello", minChars: 5 },
      { type: 'TEXT_SMALL', prompt: "2+2=?", minChars: 3 },
      
      // TEXT_LARGE - 1 test (reduced from 2) - using shorter prompt
      { type: 'TEXT_LARGE', prompt: "What is AI?", minChars: 20 },
      
      // OBJECT_SMALL - 1 test (reduced from 2) - using shorter prompt
      { type: 'OBJECT_SMALL', prompt: "JSON about recycling", schema: {
        type: "object",
        properties: {
          title: { type: "string" },
          tags: { type: "array", items: { type: "string" } }
        },
        required: ["title", "tags"]
      }},
      
      // TEXT_EMBEDDING - 1 test (reduced from 2)
      { type: 'TEXT_EMBEDDING', text: "Machine learning is a subset of artificial intelligence." }
    ];
    
    const baselineResults: CallRecordWithCost[] = [];
    const smartResults: CallRecordWithCost[] = [];
    
    for (const task of tasks) {
      try {
        // Add small delay between requests to prevent overwhelming Ollama
        await new Promise(resolve => setTimeout(resolve, 1000));
        
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
        console.error(`Quick basic test failed: ${task.type}`, error);
        console.error(`Error details:`, {
          message: error.message,
          code: error.code,
          status: error.response?.status
        });
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
    
    console.log(`Quick basic tests: ${baselineResults.length} baseline, ${smartResults.length} smart`);
    return { baseline: baselineResults, smart: smartResults };
  }
  
  private async runQuickRealWorldTests(): Promise<{ baseline: CallRecordWithCost[], smart: CallRecordWithCost[] }> {
    // Minimal real-world tests - only most essential scenarios to account for longer timeouts
    const tasks = [
      // Customer Support - 2 tests (reduced from 3) - using shorter prompts
      { type: 'TEXT_SMALL', prompt: "Help with order?" },
      { type: 'TEXT_SMALL', prompt: "Return policy?" },
      
      // Content Generation - 1 test (reduced from 2) - using shorter prompt
      { type: 'TEXT_LARGE', prompt: "Write about sustainability." },
      
      // Data Processing - 1 test (reduced from 2) - using shorter prompt
      { type: 'OBJECT_SMALL', prompt: "Analyze: 'Great service'", schema: {
        type: "object",
        properties: {
          rating: { type: "number" },
          sentiment: { type: "string" }
        },
        required: ["rating", "sentiment"]
      }}
    ];
    
    const baselineResults: CallRecordWithCost[] = [];
    const smartResults: CallRecordWithCost[] = [];
    
    for (const task of tasks) {
      try {
        // Add small delay between requests to prevent overwhelming Ollama
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        let baselineResult;
        let smartResult;
        
        const params = { prompt: task.prompt };
        if (task.schema) {
          (params as any).schema = task.schema;
        }
        
        baselineResult = await this.baseline.useModel(task.type, params);
        smartResult = await this.smartRouter.useModel(task.type, params);
        
        baselineResults.push(baselineResult);
        smartResults.push(smartResult);
      } catch (error) {
        console.warn(`Quick real-world test failed: ${task.type}`, error);
        baselineResults.push({
          group: task.type,
          provider: 'failed',
          latencyMs: 0,
          success: false,
          promptLength: task.prompt.length,
          outputLength: 0,
          timestamp: Date.now()
        });
        smartResults.push({
          group: task.type,
          provider: 'failed',
          latencyMs: 0,
          success: false,
          promptLength: task.prompt.length,
          outputLength: 0,
          timestamp: Date.now()
        });
      }
    }
    
    console.log(`Quick real-world tests: ${baselineResults.length} baseline, ${smartResults.length} smart`);
    return { baseline: baselineResults, smart: smartResults };
  }
  
  private calculatePerformanceMetrics(baseline: CallRecordWithCost[], smart: CallRecordWithCost[]) {
    const baselineLatency = baseline.length > 0 ? baseline.reduce((sum, r) => sum + r.latencyMs, 0) / baseline.length : 0;
    const smartLatency = smart.length > 0 ? smart.reduce((sum, r) => sum + r.latencyMs, 0) / smart.length : 0;
    
    const baselineSuccessRate = baseline.length > 0 ? baseline.filter(r => r.success).length / baseline.length : 0;
    const smartSuccessRate = smart.length > 0 ? smart.filter(r => r.success).length / smart.length : 0;
    
    return {
      latency: {
        baseline: baselineLatency,
        smart: smartLatency,
        improvement: baselineLatency > 0 ? ((baselineLatency - smartLatency) / baselineLatency) * 100 : 0
      },
      successRate: {
        baseline: baselineSuccessRate,
        smart: smartSuccessRate,
        improvement: baselineSuccessRate > 0 ? ((smartSuccessRate - baselineSuccessRate) / baselineSuccessRate) * 100 : 0
      },
      quality: {
        baseline: baselineSuccessRate,
        smart: smartSuccessRate,
        improvement: baselineSuccessRate > 0 ? ((smartSuccessRate - baselineSuccessRate) / baselineSuccessRate) * 100 : 0
      }
    };
  }
  
  private calculateProviderEfficiency(baseline: CallRecordWithCost[], smart: CallRecordWithCost[]) {
    const baselineEfficiency: Record<string, { calls: number, successRate: number }> = {};
    const smartEfficiency: Record<string, { calls: number, successRate: number, cost: number }> = {};
    
    // Helper function to filter out non-provider entries
    const isValidProvider = (provider: string) => {
      return provider && provider !== 'failed' && provider !== 'error' && provider !== 'unknown' && provider !== '[object Object]';
    };
    
    // Calculate baseline efficiency
    baseline.forEach(record => {
      if (!isValidProvider(record.provider)) {
        return; // Skip non-provider entries
      }
      
      if (!baselineEfficiency[record.provider]) {
        baselineEfficiency[record.provider] = { calls: 0, successRate: 0 };
      }
      baselineEfficiency[record.provider].calls++;
    });
    
    Object.keys(baselineEfficiency).forEach(provider => {
      const providerRecords = baseline.filter(r => r.provider === provider);
      const successCount = providerRecords.filter(r => r.success).length;
      baselineEfficiency[provider].successRate = providerRecords.length > 0 ? successCount / providerRecords.length : 0;
    });
    
    // Calculate smart efficiency
    smart.forEach(record => {
      if (!isValidProvider(record.provider)) {
        return; // Skip non-provider entries
      }
      
      if (!smartEfficiency[record.provider]) {
        smartEfficiency[record.provider] = { calls: 0, successRate: 0, cost: 0 };
      }
      smartEfficiency[record.provider].calls++;
      smartEfficiency[record.provider].cost += record.costEstimate?.totalUSD || 0;
    });
    
    Object.keys(smartEfficiency).forEach(provider => {
      const providerRecords = smart.filter(r => r.provider === provider);
      const successCount = providerRecords.filter(r => r.success).length;
      smartEfficiency[provider].successRate = providerRecords.length > 0 ? successCount / providerRecords.length : 0;
    });
    
    return { baseline: baselineEfficiency, smart: smartEfficiency };
  }
}

// Usage
async function main() {
  try {
    const runner = new QuickBenchmarkRunner();
    const results = await runner.runQuickBenchmark();
    
    console.log('\n=== Quick Summary ===');
    console.log(`Cost Savings: $${results.cost.comparison.costSavings.toFixed(6)} (${results.cost.comparison.costSavingsPercentage.toFixed(1)}%)`);
    console.log(`Latency Improvement: ${results.performance.latency.improvement.toFixed(1)}%`);
    console.log(`Success Rate Improvement: ${results.performance.successRate.improvement.toFixed(1)}%`);
    console.log(`Statistical Significance: ${results.statisticalAnalysis.significanceTests.latencyImprovement.significant ? 'Yes' : 'No'}`);
    console.log(`Effect Size: ${results.statisticalAnalysis.effectSizes.practicalSignificance}`);
  } catch (error) {
    console.error('Quick benchmark failed:', error);
    process.exit(1);
  }
}

// Run main function if this file is executed directly
main().catch(console.error);