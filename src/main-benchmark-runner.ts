import { ElizaOSBaseline } from './baseline/elizaos-baseline';
import { BaselineCostEstimator } from './baseline/cost-estimation';
import { SmartRouter } from './smart/smart-router';
import { StatisticalAnalyzer } from './comparison/statistical-analysis';
import { CostComparisonAnalyzer } from './comparison/cost-comparison';
import { ReportGenerator } from './comparison/report-generator';
import { BasicFunctionalityTests } from './test-suites/basic-functionality';
import { StressTestingSuite } from './test-suites/stress-testing';
import { RealWorldScenariosSuite } from './test-suites/real-world-scenarios';
import { registerDefaultOllamaTextProviders } from './providers/ollama/text';
import { registerDefaultOllamaEmbeddingProviders } from './providers/ollama/embedding';
import type { ComprehensiveComparison, CallRecordWithCost } from './types/comparison';
import * as fs from 'fs';
import * as path from 'path';

export class MainBenchmarkRunner {
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
    console.log('Setting up providers...');
    
    // Register providers for both baseline and smart router
    // This uses the existing provider registration system
    try {
      registerDefaultOllamaTextProviders();
      registerDefaultOllamaEmbeddingProviders();
      console.log('Default providers registered successfully');
    } catch (error) {
      console.warn('Failed to register default providers:', error);
    }
    
    // Both baseline and smart router now use the global registry
    this.registerBaselineProviders();
  }
  
  private registerBaselineProviders() {
    // Baseline now uses the global registry, so no separate registration needed
    console.log('Baseline will use providers from global registry');
  }
  
  async runComprehensiveBenchmark(): Promise<ComprehensiveComparison> {
    console.log('Starting comprehensive benchmark...');
    console.log('This may take several minutes depending on your system...');
    
    const startTime = Date.now();
    
    // Run all test suites
    const basicTests = new BasicFunctionalityTests(this.baseline, this.smartRouter);
    const stressTests = new StressTestingSuite(this.baseline, this.smartRouter);
    const realWorldTests = new RealWorldScenariosSuite(this.baseline, this.smartRouter);
    
    console.log('\n=== Running Basic Functionality Tests ===');
    const basicResults = await basicTests.runAllBasicTests();
    
    // Add delay between test suites to prevent overwhelming Ollama
    console.log('Waiting 5 seconds before stress tests...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('\n=== Running Stress Tests ===');
    const stressResults = await stressTests.runAllStressTests();
    
    // Add delay between test suites
    console.log('Waiting 5 seconds before real-world tests...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('\n=== Running Real-World Scenario Tests ===');
    const realWorldResults = await realWorldTests.runAllRealWorldTests();
    
    // Combine all results
    const allBaselineResults: CallRecordWithCost[] = [
      ...basicResults.textSmall.baseline,
      ...basicResults.textLarge.baseline,
      ...basicResults.objectGeneration.baseline,
      ...basicResults.embedding.baseline,
      ...stressResults.concurrent.baseline,
      ...stressResults.budget.baseline,
      ...stressResults.highVolume.baseline,
      ...stressResults.timeout.baseline,
      ...realWorldResults.customerSupport.baseline,
      ...realWorldResults.contentGeneration.baseline,
      ...realWorldResults.dataProcessing.baseline,
      ...realWorldResults.semanticSearch.baseline,
      ...realWorldResults.mixedWorkload.baseline
    ];
    
    const allSmartResults: CallRecordWithCost[] = [
      ...basicResults.textSmall.smart,
      ...basicResults.textLarge.smart,
      ...basicResults.objectGeneration.smart,
      ...basicResults.embedding.smart,
      ...stressResults.concurrent.smart,
      ...stressResults.budget.smart,
      ...stressResults.highVolume.smart,
      ...stressResults.timeout.smart,
      ...realWorldResults.customerSupport.smart,
      ...realWorldResults.contentGeneration.smart,
      ...realWorldResults.dataProcessing.smart,
      ...realWorldResults.semanticSearch.smart,
      ...realWorldResults.mixedWorkload.smart
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
        note: "Comparison between ElizaOS-style baseline and smart routing using local Ollama models. This evaluation simulates real-world usage patterns with comprehensive test coverage including basic functionality, stress testing, and realistic scenarios.",
        limitations: [
          "Local models may have higher failure rates than production paid models",
          "Baseline costs are estimated post-hoc (ElizaOS doesn't track costs natively)",
          "Performance characteristics may differ from production environments with paid models",
          "Network latency and model loading times may skew results",
          "Limited model variety compared to production deployments"
        ],
        assumptions: [
          "Circuit breaking in baseline provides realistic failure handling patterns",
          "Cost estimation using equivalent paid model pricing is representative",
          "Local model performance patterns are indicative of production behavior",
          "Provider fallback mechanisms work as expected in both systems",
          "Test scenarios represent realistic usage patterns"
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
    console.log('\n=== Generating Report ===');
    const report = this.reportGenerator.generateComprehensiveReport(comparison);
    const reportPath = path.join(resultsDir, 'comprehensive-comparison-report.md');
    fs.writeFileSync(reportPath, report);
    
    // Save raw data
    console.log('Saving raw data...');
    fs.writeFileSync(path.join(resultsDir, 'baseline-results.json'), JSON.stringify(baselineWithCosts, null, 2));
    fs.writeFileSync(path.join(resultsDir, 'smart-results.json'), JSON.stringify(allSmartResults, null, 2));
    fs.writeFileSync(path.join(resultsDir, 'comparison-data.json'), JSON.stringify(comparison, null, 2));
    
    // Save test suite breakdown
    const testSuiteData = {
      basic: {
        textSmall: { baseline: basicResults.textSmall.baseline.length, smart: basicResults.textSmall.smart.length },
        textLarge: { baseline: basicResults.textLarge.baseline.length, smart: basicResults.textLarge.smart.length },
        objectGeneration: { baseline: basicResults.objectGeneration.baseline.length, smart: basicResults.objectGeneration.smart.length },
        embedding: { baseline: basicResults.embedding.baseline.length, smart: basicResults.embedding.smart.length }
      },
      stress: {
        concurrent: { baseline: stressResults.concurrent.baseline.length, smart: stressResults.concurrent.smart.length },
        budget: { baseline: stressResults.budget.baseline.length, smart: stressResults.budget.smart.length },
        highVolume: { baseline: stressResults.highVolume.baseline.length, smart: stressResults.highVolume.smart.length },
        timeout: { baseline: stressResults.timeout.baseline.length, smart: stressResults.timeout.smart.length }
      },
      realWorld: {
        customerSupport: { baseline: realWorldResults.customerSupport.baseline.length, smart: realWorldResults.customerSupport.smart.length },
        contentGeneration: { baseline: realWorldResults.contentGeneration.baseline.length, smart: realWorldResults.contentGeneration.smart.length },
        dataProcessing: { baseline: realWorldResults.dataProcessing.baseline.length, smart: realWorldResults.dataProcessing.smart.length },
        semanticSearch: { baseline: realWorldResults.semanticSearch.baseline.length, smart: realWorldResults.semanticSearch.smart.length },
        mixedWorkload: { baseline: realWorldResults.mixedWorkload.baseline.length, smart: realWorldResults.mixedWorkload.smart.length }
      }
    };
    fs.writeFileSync(path.join(resultsDir, 'test-suite-breakdown.json'), JSON.stringify(testSuiteData, null, 2));
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.log('\n=== Benchmark Complete ===');
    console.log(`Total duration: ${duration.toFixed(1)} seconds`);
    console.log(`Report saved to: ${reportPath}`);
    console.log(`Raw data saved to: ${resultsDir}/`);
    
    return comparison;
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
        baseline: baselineSuccessRate, // Simplified quality metric
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
    const runner = new MainBenchmarkRunner();
    const results = await runner.runComprehensiveBenchmark();
    
    console.log('\n=== Quick Summary ===');
    console.log(`Cost Savings: $${results.cost.comparison.costSavings.toFixed(6)} (${results.cost.comparison.costSavingsPercentage.toFixed(1)}%)`);
    console.log(`Latency Improvement: ${results.performance.latency.improvement.toFixed(1)}%`);
    console.log(`Success Rate Improvement: ${results.performance.successRate.improvement.toFixed(1)}%`);
    console.log(`Statistical Significance: ${results.statisticalAnalysis.significanceTests.latencyImprovement.significant ? 'Yes' : 'No'}`);
    console.log(`Effect Size: ${results.statisticalAnalysis.effectSizes.practicalSignificance}`);
  } catch (error) {
    console.error('Benchmark failed:', error);
    process.exit(1);
  }
}

// Run main function if this file is executed directly
main().catch(console.error);