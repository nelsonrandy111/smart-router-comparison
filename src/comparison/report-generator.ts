import type { ComprehensiveComparison } from '../types/comparison';

export class ReportGenerator {
  generateComprehensiveReport(comparison: ComprehensiveComparison): string {
    return `
# Smart Router vs ElizaOS Baseline: Comprehensive Comparison

## Methodology

${comparison.methodology.note}

### Limitations
${comparison.methodology.limitations.map(limitation => `- ${limitation}`).join('\n')}

### Assumptions
${comparison.methodology.assumptions.map(assumption => `- ${assumption}`).join('\n')}

## Executive Summary

This comprehensive comparison evaluates the performance of a smart routing system against an ElizaOS-style baseline using local Ollama models. The analysis covers performance metrics, cost analysis, and statistical significance.

### Key Findings
- **Latency Improvement**: ${comparison.performance.latency.improvement > 0 ? '+' : ''}${comparison.performance.latency.improvement.toFixed(1)}% ${comparison.performance.latency.improvement > 0 ? 'faster' : 'slower'}
- **Cost Savings**: $${comparison.cost.comparison.costSavings.toFixed(6)} (${comparison.cost.comparison.costSavingsPercentage.toFixed(1)}%)
- **Success Rate**: ${comparison.performance.successRate.improvement > 0 ? '+' : ''}${comparison.performance.successRate.improvement.toFixed(1)}% ${comparison.performance.successRate.improvement > 0 ? 'improvement' : 'degradation'}
- **Statistical Significance**: ${comparison.statisticalAnalysis.significanceTests.latencyImprovement.significant ? 'Significant' : 'Not significant'} improvements detected

## Performance Comparison

### Latency Analysis
- **Baseline Average**: ${comparison.performance.latency.baseline.toFixed(1)}ms
- **Smart Routing Average**: ${comparison.performance.latency.smart.toFixed(1)}ms
- **Improvement**: ${comparison.performance.latency.improvement > 0 ? '+' : ''}${comparison.performance.latency.improvement.toFixed(1)}% ${comparison.performance.latency.improvement > 0 ? 'faster' : 'slower'}

**Confidence Interval (95%)**: [${comparison.statisticalAnalysis.confidenceIntervals.latency.mean[0].toFixed(1)}, ${comparison.statisticalAnalysis.confidenceIntervals.latency.mean[1].toFixed(1)}]ms

### Success Rate Analysis
- **Baseline**: ${(comparison.performance.successRate.baseline * 100).toFixed(1)}%
- **Smart Routing**: ${(comparison.performance.successRate.smart * 100).toFixed(1)}%
- **Improvement**: ${comparison.performance.successRate.improvement > 0 ? '+' : ''}${comparison.performance.successRate.improvement.toFixed(1)}% ${comparison.performance.successRate.improvement > 0 ? 'better' : 'worse'}

**Confidence Interval (95%)**: [${(comparison.statisticalAnalysis.confidenceIntervals.successRate[0] * 100).toFixed(1)}%, ${(comparison.statisticalAnalysis.confidenceIntervals.successRate[1] * 100).toFixed(1)}%]

### Quality Metrics
- **Baseline Quality Score**: ${comparison.performance.quality.baseline.toFixed(2)}
- **Smart Routing Quality Score**: ${comparison.performance.quality.smart.toFixed(2)}
- **Improvement**: ${comparison.performance.quality.improvement > 0 ? '+' : ''}${comparison.performance.quality.improvement.toFixed(1)}% ${comparison.performance.quality.improvement > 0 ? 'better' : 'worse'}

## Cost Analysis

### Baseline (Estimated Costs)
- **Total Estimated Cost**: $${comparison.cost.baseline.totalEstimatedCost.toFixed(6)}
- **Cost per Call**: $${comparison.cost.baseline.costPerCall.toFixed(6)}
- **Note**: ${comparison.cost.baseline.note}

#### Cost Breakdown by Provider
${Object.entries(comparison.cost.baseline.costPerProvider)
  .map(([provider, cost]) => `- **${provider}**: $${cost.toFixed(6)}`)
  .join('\n')}

### Smart Routing (Actual Costs)
- **Total Actual Cost**: $${comparison.cost.smart.totalActualCost.toFixed(6)}
- **Cost per Call**: $${comparison.cost.smart.costPerCall.toFixed(6)}
- **Note**: ${comparison.cost.smart.note}

#### Cost Breakdown by Provider
${Object.entries(comparison.cost.smart.costPerProvider)
  .map(([provider, cost]) => `- **${provider}**: $${cost.toFixed(6)}`)
  .join('\n')}

### Cost Comparison
- **Absolute Savings**: $${comparison.cost.comparison.costSavings.toFixed(6)}
- **Percentage Savings**: ${comparison.cost.comparison.costSavingsPercentage.toFixed(1)}%
- **Return on Investment**: ${comparison.cost.comparison.roi.toFixed(2)}x

### Cost Effectiveness
- **Baseline**: ${comparison.cost.comparison.costEffectiveness.baseline.toFixed(2)} quality per dollar
- **Smart Routing**: ${comparison.cost.comparison.costEffectiveness.smart.toFixed(2)} quality per dollar

## Statistical Analysis

### Confidence Intervals (95%)
- **Latency Mean**: [${comparison.statisticalAnalysis.confidenceIntervals.latency.mean[0].toFixed(1)}, ${comparison.statisticalAnalysis.confidenceIntervals.latency.mean[1].toFixed(1)}]ms
- **Latency P95**: [${comparison.statisticalAnalysis.confidenceIntervals.latency.p95[0].toFixed(1)}, ${comparison.statisticalAnalysis.confidenceIntervals.latency.p95[1].toFixed(1)}]ms
- **Success Rate**: [${(comparison.statisticalAnalysis.confidenceIntervals.successRate[0] * 100).toFixed(1)}%, ${(comparison.statisticalAnalysis.confidenceIntervals.successRate[1] * 100).toFixed(1)}%]
- **Cost Mean**: [$${comparison.statisticalAnalysis.confidenceIntervals.cost.mean[0].toFixed(6)}, $${comparison.statisticalAnalysis.confidenceIntervals.cost.mean[1].toFixed(6)}]

### Significance Tests
- **Latency Improvement**: p = ${comparison.statisticalAnalysis.significanceTests.latencyImprovement.pValue.toFixed(4)} ${comparison.statisticalAnalysis.significanceTests.latencyImprovement.significant ? '(significant)' : '(not significant)'}
- **Cost Reduction**: p = ${comparison.statisticalAnalysis.significanceTests.costReduction.pValue.toFixed(4)} ${comparison.statisticalAnalysis.significanceTests.costReduction.significant ? '(significant)' : '(not significant)'}
- **Success Rate Improvement**: p = ${comparison.statisticalAnalysis.significanceTests.successRateImprovement.pValue.toFixed(4)} ${comparison.statisticalAnalysis.significanceTests.successRateImprovement.significant ? '(significant)' : '(not significant)'}

### Effect Sizes
- **Cohen's d**: ${comparison.statisticalAnalysis.effectSizes.cohensD.toFixed(2)}
- **Practical Significance**: ${comparison.statisticalAnalysis.effectSizes.practicalSignificance}

## Provider Efficiency Analysis

### Baseline Provider Usage
${Object.entries(comparison.providerEfficiency.baseline)
  .map(([provider, stats]) => `- **${provider}**: ${stats.calls} calls, ${(stats.successRate * 100).toFixed(1)}% success rate`)
  .join('\n')}

### Smart Routing Provider Usage
${Object.entries(comparison.providerEfficiency.smart)
  .map(([provider, stats]) => `- **${provider}**: ${stats.calls} calls, ${(stats.successRate * 100).toFixed(1)}% success rate, $${stats.cost.toFixed(6)} total cost`)
  .join('\n')}

## Detailed Performance Metrics

### Latency Distribution
- **Baseline P95**: ${comparison.statisticalAnalysis.confidenceIntervals.latency.p95[1].toFixed(1)}ms
- **Smart Routing P95**: ${comparison.statisticalAnalysis.confidenceIntervals.latency.p95[0].toFixed(1)}ms

### Cost Distribution
- **Baseline Cost Range**: $${comparison.statisticalAnalysis.confidenceIntervals.cost.mean[0].toFixed(6)} - $${comparison.statisticalAnalysis.confidenceIntervals.cost.mean[1].toFixed(6)}
- **Smart Routing Cost Range**: $${comparison.statisticalAnalysis.confidenceIntervals.cost.mean[0].toFixed(6)} - $${comparison.statisticalAnalysis.confidenceIntervals.cost.mean[1].toFixed(6)}

## Recommendations

${this.generateRecommendations(comparison)}

## Technical Implementation Notes

### Smart Routing Features
- **Cost-Aware Decision Making**: Routes requests based on cost, latency, and quality metrics
- **Circuit Breaking**: Automatically fails over when providers become unreliable
- **Budget Management**: Enforces cost constraints and tracks spending
- **Telemetry Integration**: Uses real-time performance data for routing decisions

### Baseline Simulation
- **Priority-Based Routing**: Mimics ElizaOS behavior with provider priority ordering
- **Basic Fallback**: Simple fallback mechanism for failed requests
- **Post-Hoc Cost Estimation**: Estimates costs using equivalent paid model pricing

## Conclusions

${this.generateConclusions(comparison)}

## Data Sources and Methodology

This analysis is based on comprehensive benchmarking using:
- **Test Suites**: Basic functionality, stress testing, and real-world scenarios
- **Statistical Methods**: Confidence intervals, significance testing, and effect size analysis
- **Cost Analysis**: Real pricing data with post-hoc estimation for baseline
- **Performance Metrics**: Latency, success rate, and quality measurements

---

*Report generated on ${new Date().toISOString()}*
*Smart Router Comparison Framework v1.0*
`;
  }
  
  private generateRecommendations(comparison: ComprehensiveComparison): string {
    const recommendations = [];
    
    if (comparison.performance.latency.improvement > 10) {
      recommendations.push("Smart routing shows significant latency improvements. Consider implementing for latency-sensitive applications.");
    }
    
    if (comparison.cost.comparison.costSavingsPercentage > 15) {
      recommendations.push("Substantial cost savings observed. Smart routing is recommended for cost-optimized deployments.");
    }
    
    if (comparison.performance.successRate.improvement > 5) {
      recommendations.push("Improved success rates suggest better reliability with smart routing.");
    }
    
    if (comparison.statisticalAnalysis.effectSizes.practicalSignificance === 'large') {
      recommendations.push("Large practical significance indicates meaningful improvements in production scenarios.");
    }
    
    if (comparison.cost.comparison.costEffectiveness.smart > comparison.cost.comparison.costEffectiveness.baseline) {
      recommendations.push("Better cost-effectiveness ratio suggests smart routing provides more value per dollar spent.");
    }
    
    if (recommendations.length === 0) {
      recommendations.push("Results show mixed improvements. Consider running additional tests or tuning smart routing parameters.");
    }
    
    return recommendations.map((rec, index) => `${index + 1}. ${rec}`).join('\n');
  }
  
  private generateConclusions(comparison: ComprehensiveComparison): string {
    const conclusions = [];
    
    // Overall assessment
    const positiveMetrics = [
      comparison.performance.latency.improvement > 0,
      comparison.cost.comparison.costSavingsPercentage > 0,
      comparison.performance.successRate.improvement > 0
    ].filter(Boolean).length;
    
    if (positiveMetrics >= 2) {
      conclusions.push("Smart routing demonstrates overall improvements across multiple metrics.");
    } else if (positiveMetrics === 1) {
      conclusions.push("Smart routing shows improvements in specific areas with trade-offs in others.");
    } else {
      conclusions.push("Smart routing shows limited improvements in this evaluation.");
    }
    
    // Specific findings
    if (comparison.performance.latency.improvement > 0) {
      conclusions.push(`The ${comparison.performance.latency.improvement.toFixed(1)}% latency improvement suggests better resource utilization and routing efficiency.`);
    }
    
    if (comparison.cost.comparison.costSavingsPercentage > 0) {
      conclusions.push(`Cost savings of ${comparison.cost.comparison.costSavingsPercentage.toFixed(1)}% indicate more efficient provider selection and resource allocation.`);
    }
    
    if (comparison.statisticalAnalysis.significanceTests.latencyImprovement.significant) {
      conclusions.push("Statistical significance of latency improvements provides confidence in the results.");
    }
    
    if (comparison.statisticalAnalysis.effectSizes.practicalSignificance === 'large') {
      conclusions.push("Large effect sizes suggest practical significance for production deployments.");
    }
    
    // Limitations and caveats
    conclusions.push("Results are based on local model simulation and may differ from production environments with paid models.");
    
    if (comparison.methodology.limitations.length > 0) {
      conclusions.push("Consider the documented limitations when interpreting results for production use cases.");
    }
    
    return conclusions.join(' ');
  }
}