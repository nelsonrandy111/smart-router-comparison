import type { CallRecordWithCost, StatisticalAnalysis } from '../types/comparison';

export class StatisticalAnalyzer {
  analyze(baselineResults: CallRecordWithCost[], smartResults: CallRecordWithCost[]): StatisticalAnalysis {
    const baselineLatencies = baselineResults.map(r => r.latencyMs);
    const smartLatencies = smartResults.map(r => r.latencyMs);
    
    const baselineSuccessRates = baselineResults.map(r => r.success ? 1 : 0);
    const smartSuccessRates = smartResults.map(r => r.success ? 1 : 0);
    
    const baselineCosts = baselineResults.map(r => r.costEstimate?.totalUSD || r.estimatedCost?.totalUSD || 0);
    const smartCosts = smartResults.map(r => r.costEstimate?.totalUSD || 0);
    
    return {
      confidenceIntervals: {
        latency: {
          mean: this.calculateConfidenceInterval([...baselineLatencies, ...smartLatencies]),
          p95: this.calculateP95ConfidenceInterval([...baselineLatencies, ...smartLatencies])
        },
        successRate: this.calculateConfidenceInterval([...baselineSuccessRates, ...smartSuccessRates]),
        cost: {
          mean: this.calculateConfidenceInterval([...baselineCosts, ...smartCosts]),
          total: this.calculateConfidenceInterval([...baselineCosts, ...smartCosts])
        }
      },
      significanceTests: {
        latencyImprovement: this.performTTest(baselineLatencies, smartLatencies),
        costReduction: this.performTTest(baselineCosts, smartCosts),
        successRateImprovement: this.performTTest(baselineSuccessRates, smartSuccessRates)
      },
      effectSizes: {
        cohensD: this.calculateCohensD(baselineCosts, smartCosts),
        practicalSignificance: this.determinePracticalSignificance(baselineCosts, smartCosts)
      }
    };
  }
  
  private calculateConfidenceInterval(values: number[], confidence = 0.95): [number, number] {
    if (values.length === 0) return [0, 0];
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    // Use t-distribution for small samples, normal for large samples
    const tValue = values.length < 30 ? 2.045 : 1.96; // 95% confidence
    const margin = tValue * (stdDev / Math.sqrt(values.length));
    
    return [mean - margin, mean + margin];
  }
  
  private calculateP95ConfidenceInterval(values: number[]): [number, number] {
    if (values.length === 0) return [0, 0];
    
    const sorted = [...values].sort((a, b) => a - b);
    const p95Index = Math.floor(sorted.length * 0.95);
    const p95Value = sorted[p95Index];
    
    // Bootstrap confidence interval for P95
    const bootstrapSamples = 1000;
    const p95Samples: number[] = [];
    
    for (let i = 0; i < bootstrapSamples; i++) {
      const sample = this.bootstrapSample(values);
      const sampleSorted = sample.sort((a, b) => a - b);
      const sampleP95Index = Math.floor(sampleSorted.length * 0.95);
      p95Samples.push(sampleSorted[sampleP95Index]);
    }
    
    p95Samples.sort((a, b) => a - b);
    const lowerIndex = Math.floor(p95Samples.length * 0.025);
    const upperIndex = Math.floor(p95Samples.length * 0.975);
    
    return [p95Samples[lowerIndex], p95Samples[upperIndex]];
  }
  
  private bootstrapSample(values: number[]): number[] {
    const sample: number[] = [];
    for (let i = 0; i < values.length; i++) {
      const randomIndex = Math.floor(Math.random() * values.length);
      sample.push(values[randomIndex]);
    }
    return sample;
  }
  
  private performTTest(group1: number[], group2: number[]): { pValue: number, significant: boolean } {
    if (group1.length === 0 || group2.length === 0) {
      return { pValue: 1.0, significant: false };
    }
    
    const mean1 = group1.reduce((a, b) => a + b, 0) / group1.length;
    const mean2 = group2.reduce((a, b) => a + b, 0) / group2.length;
    
    const var1 = group1.reduce((sq, n) => sq + Math.pow(n - mean1, 2), 0) / (group1.length - 1);
    const var2 = group2.reduce((sq, n) => sq + Math.pow(n - mean2, 2), 0) / (group2.length - 1);
    
    // Pooled standard deviation
    const pooledStd = Math.sqrt(((group1.length - 1) * var1 + (group2.length - 1) * var2) / 
                                (group1.length + group2.length - 2));
    
    // Standard error of the difference
    const seDiff = pooledStd * Math.sqrt(1/group1.length + 1/group2.length);
    
    // t-statistic
    const tStat = (mean1 - mean2) / seDiff;
    
    // Degrees of freedom
    const df = group1.length + group2.length - 2;
    
    // Calculate p-value using approximation
    const pValue = 2 * (1 - this.tCDF(Math.abs(tStat), df));
    
    return {
      pValue,
      significant: pValue < 0.05
    };
  }
  
  private calculateCohensD(group1: number[], group2: number[]): number {
    if (group1.length === 0 || group2.length === 0) return 0;
    
    const mean1 = group1.reduce((a, b) => a + b, 0) / group1.length;
    const mean2 = group2.reduce((a, b) => a + b, 0) / group2.length;
    
    const var1 = group1.reduce((sq, n) => sq + Math.pow(n - mean1, 2), 0) / (group1.length - 1);
    const var2 = group2.reduce((sq, n) => sq + Math.pow(n - mean2, 2), 0) / (group2.length - 1);
    
    const pooledStd = Math.sqrt(((group1.length - 1) * var1 + (group2.length - 1) * var2) / 
                                (group1.length + group2.length - 2));
    
    if (pooledStd === 0) return 0;
    
    return (mean1 - mean2) / pooledStd;
  }
  
  private determinePracticalSignificance(group1: number[], group2: number[]): 'small' | 'medium' | 'large' {
    const cohensD = Math.abs(this.calculateCohensD(group1, group2));
    
    if (cohensD < 0.2) return 'small';
    if (cohensD < 0.5) return 'medium';
    return 'large';
  }
  
  private tCDF(t: number, df: number): number {
    // Approximation of t-distribution CDF
    if (df > 30) {
      // Use normal approximation for large df
      return this.normalCDF(t);
    }
    
    // Simplified t-distribution approximation
    const x = t / Math.sqrt(df);
    const a = 0.5 + 0.5 * this.erf(x / Math.sqrt(2));
    
    // Adjust for degrees of freedom
    const correction = Math.min(0.05, df / 1000);
    return Math.max(0, Math.min(1, a + correction));
  }
  
  private normalCDF(x: number): number {
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
  }
  
  private erf(x: number): number {
    // Approximation of error function
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;
    
    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);
    
    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    
    return sign * y;
  }
}