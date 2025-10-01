export const config = {
  ollama: {
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434',
    timeout: parseInt(process.env.OLLAMA_TIMEOUT || '180000') // 3 minutes
  },
  benchmark: {
    sessionBudget: parseFloat(process.env.SESSION_BUDGET || '1.0'),
    concurrency: parseInt(process.env.CONCURRENCY || '3'), // Reduced from 5 to 3
    testIterations: parseInt(process.env.TEST_ITERATIONS || '5'), // Reduced from 10 to 5
    timeoutMs: parseInt(process.env.BENCHMARK_TIMEOUT || '180000') // 3 minutes
  },
  costEstimation: {
    enableVariance: process.env.COST_VARIANCE === 'true',
    variancePercentage: parseFloat(process.env.COST_VARIANCE_PCT || '0.05'),
    enableDiscounts: process.env.COST_DISCOUNTS === 'true',
    discountFactor: parseFloat(process.env.DISCOUNT_FACTOR || '1.0')
  },
  statistical: {
    confidenceLevel: parseFloat(process.env.CONFIDENCE_LEVEL || '0.95'),
    significanceThreshold: parseFloat(process.env.SIGNIFICANCE_THRESHOLD || '0.05'),
    bootstrapSamples: parseInt(process.env.BOOTSTRAP_SAMPLES || '1000')
  },
  reporting: {
    generateDetailedReport: process.env.DETAILED_REPORT !== 'false',
    saveRawData: process.env.SAVE_RAW_DATA !== 'false',
    includeProviderBreakdown: process.env.PROVIDER_BREAKDOWN !== 'false'
  },
  testSuites: {
    runBasicTests: process.env.BASIC_TESTS !== 'false',
    runStressTests: process.env.STRESS_TESTS !== 'false',
    runRealWorldTests: process.env.REAL_WORLD_TESTS !== 'false',
    stressTestConcurrency: parseInt(process.env.STRESS_CONCURRENCY || '3'), // Reduced from 5 to 3
    stressTestVolume: parseInt(process.env.STRESS_VOLUME || '20'), // Reduced from 50 to 20
    stressTestBudget: parseFloat(process.env.STRESS_BUDGET || '0.01')
  },
  quickMode: {
    enabled: process.env.QUICK_MODE === 'true',
    maxBasicTests: parseInt(process.env.QUICK_BASIC_TESTS || '9'),
    maxRealWorldTests: parseInt(process.env.QUICK_REAL_WORLD_TESTS || '7'),
    skipStressTests: process.env.QUICK_SKIP_STRESS === 'true'
  }
};

export function validateConfig(): void {
  const errors: string[] = [];
  
  if (config.benchmark.sessionBudget <= 0) {
    errors.push('SESSION_BUDGET must be greater than 0');
  }
  
  if (config.benchmark.concurrency <= 0) {
    errors.push('CONCURRENCY must be greater than 0');
  }
  
  if (config.benchmark.testIterations <= 0) {
    errors.push('TEST_ITERATIONS must be greater than 0');
  }
  
  if (config.benchmark.timeoutMs <= 0) {
    errors.push('BENCHMARK_TIMEOUT must be greater than 0');
  }
  
  if (config.costEstimation.variancePercentage < 0 || config.costEstimation.variancePercentage > 1) {
    errors.push('COST_VARIANCE_PCT must be between 0 and 1');
  }
  
  if (config.costEstimation.discountFactor < 0 || config.costEstimation.discountFactor > 2) {
    errors.push('DISCOUNT_FACTOR must be between 0 and 2');
  }
  
  if (config.statistical.confidenceLevel <= 0 || config.statistical.confidenceLevel >= 1) {
    errors.push('CONFIDENCE_LEVEL must be between 0 and 1');
  }
  
  if (config.statistical.significanceThreshold <= 0 || config.statistical.significanceThreshold >= 1) {
    errors.push('SIGNIFICANCE_THRESHOLD must be between 0 and 1');
  }
  
  if (config.statistical.bootstrapSamples <= 0) {
    errors.push('BOOTSTRAP_SAMPLES must be greater than 0');
  }
  
  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }
}

export function logConfig(): void {
  console.log('Configuration loaded:');
  console.log(`  Ollama Base URL: ${config.ollama.baseUrl}`);
  console.log(`  Session Budget: $${config.benchmark.sessionBudget}`);
  console.log(`  Concurrency: ${config.benchmark.concurrency}`);
  console.log(`  Test Iterations: ${config.benchmark.testIterations}`);
  console.log(`  Cost Variance: ${config.costEstimation.enableVariance ? `${config.costEstimation.variancePercentage * 100}%` : 'disabled'}`);
  console.log(`  Confidence Level: ${config.statistical.confidenceLevel * 100}%`);
  console.log(`  Bootstrap Samples: ${config.statistical.bootstrapSamples}`);
  console.log(`  Basic Tests: ${config.testSuites.runBasicTests ? 'enabled' : 'disabled'}`);
  console.log(`  Stress Tests: ${config.testSuites.runStressTests ? 'enabled' : 'disabled'}`);
  console.log(`  Real-World Tests: ${config.testSuites.runRealWorldTests ? 'enabled' : 'disabled'}`);
  console.log(`  Quick Mode: ${config.quickMode.enabled ? 'enabled' : 'disabled'}`);
  if (config.quickMode.enabled) {
    console.log(`    Max Basic Tests: ${config.quickMode.maxBasicTests}`);
    console.log(`    Max Real-World Tests: ${config.quickMode.maxRealWorldTests}`);
    console.log(`    Skip Stress Tests: ${config.quickMode.skipStressTests ? 'yes' : 'no'}`);
  }
}