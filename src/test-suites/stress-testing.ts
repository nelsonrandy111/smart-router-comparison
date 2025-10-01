import type { ElizaOSBaseline } from '../baseline/elizaos-baseline';
import type { SmartRouter } from '../smart/smart-router';
import type { CallRecordWithCost, TestSuiteResults } from '../types/comparison';

export class StressTestingSuite {
  constructor(
    private baseline: ElizaOSBaseline,
    private smartRouter: SmartRouter
  ) {}
  
  async runConcurrentTests(concurrency: number = 3): Promise<TestSuiteResults> {
    const tasks = Array.from({ length: 10 }, (_, i) => ({
      prompt: `Test ${i + 1}: Write about sustainability`,
      minChars: 10
    }));
    
    console.log(`Running concurrent tests with concurrency: ${concurrency}`);
    
    // Run baseline with concurrency
    const baselinePromises = tasks.map(task => 
      this.baseline.useModel('TEXT_SMALL', { prompt: task.prompt }).catch(error => {
        console.warn(`Baseline test failed: ${task.prompt}`, error);
        return {
          group: 'TEXT_SMALL',
          provider: 'failed',
          latencyMs: 0,
          success: false,
          promptLength: task.prompt.length,
          outputLength: 0,
          timestamp: Date.now()
        };
      })
    );
    
    const baselineResults = await Promise.all(baselinePromises);
    
    // Run smart routing with concurrency
    const smartPromises = tasks.map(task => 
      this.smartRouter.useModel('TEXT_SMALL', { prompt: task.prompt }).catch(error => {
        console.warn(`Smart test failed: ${task.prompt}`, error);
        return {
          group: 'TEXT_SMALL',
          provider: 'failed',
          latencyMs: 0,
          success: false,
          promptLength: task.prompt.length,
          outputLength: 0,
          timestamp: Date.now()
        };
      })
    );
    
    const smartResults = await Promise.all(smartPromises);
    
    return { baseline: baselineResults, smart: smartResults };
  }
  
  async runBudgetConstraintTests(budget: number = 0.01): Promise<TestSuiteResults> {
    console.log(`Running budget constraint tests with budget: $${budget}`);
    
    // Create new smart router with budget constraint
    const { SmartRouter } = await import('../smart/smart-router');
    const budgetSmartRouter = new SmartRouter({ sessionBudget: budget });
    
    const tasks = Array.from({ length: 5 }, (_, i) => ({
      prompt: `Budget test ${i + 1}: Write about environmental impact`,
      minChars: 20
    }));
    
    const baselineResults: CallRecordWithCost[] = [];
    const smartResults: CallRecordWithCost[] = [];
    
    for (const task of tasks) {
      try {
        const baselineResult = await this.baseline.useModel('TEXT_LARGE', { prompt: task.prompt });
        baselineResults.push(baselineResult);
      } catch (error) {
        console.warn(`Baseline test failed: ${task.prompt}`, error);
        baselineResults.push({
          group: 'TEXT_LARGE',
          provider: 'failed',
          latencyMs: 0,
          success: false,
          promptLength: task.prompt.length,
          outputLength: 0,
          timestamp: Date.now()
        });
      }
      
      try {
        const smartResult = await budgetSmartRouter.useModel('TEXT_LARGE', { prompt: task.prompt });
        smartResults.push(smartResult);
      } catch (error) {
        console.warn(`Smart test failed (budget exceeded?): ${task.prompt}`, error);
        // Budget exceeded or other error
        smartResults.push({
          group: 'TEXT_LARGE',
          provider: 'budget-exceeded',
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
  
  async runHighVolumeTests(volume: number = 20): Promise<TestSuiteResults> {
    console.log(`Running high volume tests with ${volume} requests`);
    
    const tasks = Array.from({ length: volume }, (_, i) => ({
      prompt: `Volume test ${i + 1}: Write about innovation`,
      minChars: 15
    }));
    
    const baselineResults: CallRecordWithCost[] = [];
    const smartResults: CallRecordWithCost[] = [];
    
    // Process in batches to avoid overwhelming the system
    const batchSize = 10;
    for (let i = 0; i < tasks.length; i += batchSize) {
      const batch = tasks.slice(i, i + batchSize);
      
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(tasks.length / batchSize)}`);
      
      for (const task of batch) {
        try {
          const baselineResult = await this.baseline.useModel('TEXT_SMALL', { prompt: task.prompt });
          baselineResults.push(baselineResult);
        } catch (error) {
          console.warn(`Baseline test failed: ${task.prompt}`, error);
          baselineResults.push({
            group: 'TEXT_SMALL',
            provider: 'failed',
            latencyMs: 0,
            success: false,
            promptLength: task.prompt.length,
            outputLength: 0,
            timestamp: Date.now()
          });
        }
        
        try {
          const smartResult = await this.smartRouter.useModel('TEXT_SMALL', { prompt: task.prompt });
          smartResults.push(smartResult);
        } catch (error) {
          console.warn(`Smart test failed: ${task.prompt}`, error);
          smartResults.push({
            group: 'TEXT_SMALL',
            provider: 'failed',
            latencyMs: 0,
            success: false,
            promptLength: task.prompt.length,
            outputLength: 0,
            timestamp: Date.now()
          });
        }
      }
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return { baseline: baselineResults, smart: smartResults };
  }
  
  async runTimeoutTests(timeoutMs: number = 30000): Promise<TestSuiteResults> {
    console.log(`Running timeout tests with timeout: ${timeoutMs}ms`);
    
    // Create routers with shorter timeout
    const { SmartRouter } = await import('../smart/smart-router');
    const timeoutSmartRouter = new SmartRouter({ perCallTimeoutMs: timeoutMs });
    
    const tasks = [
      { prompt: "Write a very detailed and comprehensive analysis of climate change impacts.", minChars: 500 },
      { prompt: "Explain the entire history of computing in great detail.", minChars: 400 },
      { prompt: "Write a long essay about renewable energy technologies.", minChars: 600 }
    ];
    
    const baselineResults: CallRecordWithCost[] = [];
    const smartResults: CallRecordWithCost[] = [];
    
    for (const task of tasks) {
      try {
        const baselineResult = await this.baseline.useModel('TEXT_LARGE', { prompt: task.prompt });
        baselineResults.push(baselineResult);
      } catch (error) {
        console.warn(`Baseline test failed: ${task.prompt}`, error);
        baselineResults.push({
          group: 'TEXT_LARGE',
          provider: 'failed',
          latencyMs: 0,
          success: false,
          promptLength: task.prompt.length,
          outputLength: 0,
          timestamp: Date.now()
        });
      }
      
      try {
        const smartResult = await timeoutSmartRouter.useModel('TEXT_LARGE', { prompt: task.prompt });
        smartResults.push(smartResult);
      } catch (error) {
        console.warn(`Smart test failed (timeout?): ${task.prompt}`, error);
        smartResults.push({
          group: 'TEXT_LARGE',
          provider: 'timeout',
          latencyMs: timeoutMs,
          success: false,
          promptLength: task.prompt.length,
          outputLength: 0,
          timestamp: Date.now()
        });
      }
    }
    
    return { baseline: baselineResults, smart: smartResults };
  }
  
  async runAllStressTests(): Promise<{
    concurrent: TestSuiteResults;
    budget: TestSuiteResults;
    highVolume: TestSuiteResults;
    timeout: TestSuiteResults;
  }> {
    console.log('Running stress tests...');
    
    const concurrent = await this.runConcurrentTests();
    console.log(`Concurrent tests: ${concurrent.baseline.length} baseline, ${concurrent.smart.length} smart`);
    
    const budget = await this.runBudgetConstraintTests();
    console.log(`Budget tests: ${budget.baseline.length} baseline, ${budget.smart.length} smart`);
    
    const highVolume = await this.runHighVolumeTests();
    console.log(`High volume tests: ${highVolume.baseline.length} baseline, ${highVolume.smart.length} smart`);
    
    const timeout = await this.runTimeoutTests();
    console.log(`Timeout tests: ${timeout.baseline.length} baseline, ${timeout.smart.length} smart`);
    
    return {
      concurrent,
      budget,
      highVolume,
      timeout
    };
  }
}