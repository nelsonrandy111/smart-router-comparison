import type { CallRecordWithCost, CostComparison } from '../types/comparison';

export class CostComparisonAnalyzer {
  analyze(baselineResults: CallRecordWithCost[], smartResults: CallRecordWithCost[]): CostComparison {
    const baselineCosts = this.analyzeBaselineCosts(baselineResults);
    const smartCosts = this.analyzeSmartCosts(smartResults);
    
    const costSavings = baselineCosts.totalEstimatedCost - smartCosts.totalActualCost;
    const costSavingsPercentage = baselineCosts.totalEstimatedCost > 0 
      ? (costSavings / baselineCosts.totalEstimatedCost) * 100 
      : 0;
    
    const baselineQuality = baselineResults.filter(r => r.success).length / baselineResults.length;
    const smartQuality = smartResults.filter(r => r.success).length / smartResults.length;
    
    return {
      baseline: {
        totalEstimatedCost: baselineCosts.totalEstimatedCost,
        costPerCall: baselineCosts.costPerCall,
        costPerProvider: baselineCosts.costPerProvider,
        note: "Costs estimated post-hoc - ElizaOS doesn't track costs natively"
      },
      smart: {
        totalActualCost: smartCosts.totalActualCost,
        costPerCall: smartCosts.costPerCall,
        costPerProvider: smartCosts.costPerProvider,
        note: "Real costs from smart routing with cost awareness"
      },
      comparison: {
        costSavings,
        costSavingsPercentage,
        costEffectiveness: {
          baseline: baselineCosts.costPerCall > 0 ? baselineQuality / baselineCosts.costPerCall : 0,
          smart: smartCosts.costPerCall > 0 ? smartQuality / smartCosts.costPerCall : 0
        },
        roi: smartCosts.totalActualCost > 0 ? costSavings / smartCosts.totalActualCost : 0
      }
    };
  }
  
  private analyzeBaselineCosts(results: CallRecordWithCost[]) {
    const totalCost = results.reduce((sum, r) => sum + (r.estimatedCost?.totalUSD || 0), 0);
    const costPerProvider: Record<string, number> = {};
    
    results.forEach(record => {
      const cost = record.estimatedCost?.totalUSD || 0;
      costPerProvider[record.provider] = (costPerProvider[record.provider] || 0) + cost;
    });
    
    return {
      totalEstimatedCost: totalCost,
      costPerCall: results.length > 0 ? totalCost / results.length : 0,
      costPerProvider
    };
  }
  
  private analyzeSmartCosts(results: CallRecordWithCost[]) {
    const totalCost = results.reduce((sum, r) => sum + (r.costEstimate?.totalUSD || 0), 0);
    const costPerProvider: Record<string, number> = {};
    
    results.forEach(record => {
      const cost = record.costEstimate?.totalUSD || 0;
      costPerProvider[record.provider] = (costPerProvider[record.provider] || 0) + cost;
    });
    
    return {
      totalActualCost: totalCost,
      costPerCall: results.length > 0 ? totalCost / results.length : 0,
      costPerProvider
    };
  }
}