import fs from 'fs';
import path from 'path';

interface CallRecord {
  group: string;
  provider: string;
  latencyMs: number;
  success: boolean;
  jsonValid?: boolean;
  costEstimate?: {
    inputTokens: number;
    outputTokens: number;
    inputCostUSD: number;
    outputCostUSD: number;
    fixedFeeUSD: number;
    totalUSD: number;
    simulatedModelName: string;
  };
}

interface Aggregates {
  count: number;
  successRate: number;
  jsonValidityRate?: number;
  meanLatency: number | null;
  p95Latency: number | null;
  totalCostUSD?: number;
  meanCostUSD?: number | null;
  costPerProvider?: Record<string, number>;
}

interface BudgetStatus {
  totalBudget: number;
  spent: number;
  remaining: number;
  utilizationRatio: number;
}

interface BenchmarkResult {
  mode: string;
  summary: Record<string, Aggregates>;
  total: Aggregates;
  all: CallRecord[];
  budgetStatus?: BudgetStatus;
  costSummary?: {
    totalSpent: number;
    remainingBudget: number;
    utilizationRatio: number;
  };
}

function loadResults(filePath: string): BenchmarkResult | null {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    if (!fs.existsSync(fullPath)) {
      console.log(`File not found: ${filePath}`);
      return null;
    }
    const content = fs.readFileSync(fullPath, 'utf-8');
    return JSON.parse(content) as BenchmarkResult;
  } catch (error) {
    console.log(`Error loading ${filePath}:`, error);
    return null;
  }
}

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(6)}`;
}

function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function formatLatency(ms: number | null): string {
  if (ms === null) return 'N/A';
  if (ms < 1000) return `${ms.toFixed(1)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function generateReport(baseline: BenchmarkResult | null, smart: BenchmarkResult | null): string {
  let report = '# Smart Router Benchmark Report - Cost-Aware Analysis\n\n';
  
  report += `**Generated:** ${new Date().toISOString()}\n`;
  report += `**Baseline file:** results/baseline.json\n`;
  report += `**Smart file:** results/smart.json\n\n`;

  if (!baseline || !smart) {
    report += '**Warning:** Some result files could not be loaded.\n\n';
    return report;
  }

  // Overall Summary
  report += '## Overall Performance\n\n';
  report += '| Metric | Baseline | Smart | Difference |\n';
  report += '|--------|----------|-------|------------|\n';
  report += `| **Count** | ${baseline.total.count} | ${smart.total.count} | ${smart.total.count - baseline.total.count} |\n`;
  report += `| **Success Rate** | ${formatPercentage(baseline.total.successRate)} | ${formatPercentage(smart.total.successRate)} | ${formatPercentage(smart.total.successRate - baseline.total.successRate)} |\n`;
  report += `| **Mean Latency** | ${formatLatency(baseline.total.meanLatency)} | ${formatLatency(smart.total.meanLatency)} | ${formatLatency((smart.total.meanLatency || 0) - (baseline.total.meanLatency || 0))} |\n`;
  report += `| **P95 Latency** | ${formatLatency(baseline.total.p95Latency)} | ${formatLatency(smart.total.p95Latency)} | ${formatLatency((smart.total.p95Latency || 0) - (baseline.total.p95Latency || 0))} |\n`;
  report += `| **JSON Validity** | ${formatPercentage(baseline.total.jsonValidityRate || 0)} | ${formatPercentage(smart.total.jsonValidityRate || 0)} | ${formatPercentage((smart.total.jsonValidityRate || 0) - (baseline.total.jsonValidityRate || 0))} |\n\n`;

  // Cost Analysis
  report += '## Cost Analysis\n\n';
  report += '| Metric | Baseline | Smart | Difference |\n';
  report += '|--------|----------|-------|------------|\n';
  report += `| **Total Cost** | ${formatCurrency(baseline.total.totalCostUSD || 0)} | ${formatCurrency(smart.total.totalCostUSD || 0)} | ${formatCurrency((smart.total.totalCostUSD || 0) - (baseline.total.totalCostUSD || 0))} |\n`;
  report += `| **Mean Cost/Call** | ${formatCurrency(baseline.total.meanCostUSD || 0)} | ${formatCurrency(smart.total.meanCostUSD || 0)} | ${formatCurrency((smart.total.meanCostUSD || 0) - (baseline.total.meanCostUSD || 0))} |\n`;
  report += `| **Cost Efficiency** | ${formatCurrency((baseline.total.totalCostUSD || 0) / baseline.total.count)} | ${formatCurrency((smart.total.totalCostUSD || 0) / smart.total.count)} | ${formatCurrency(((smart.total.totalCostUSD || 0) / smart.total.count) - ((baseline.total.totalCostUSD || 0) / baseline.total.count))} |\n\n`;

  // Budget Status
  if (smart.budgetStatus) {
    report += '## Budget Status (Smart Routing)\n\n';
    report += `| Metric | Value |\n`;
    report += `|--------|-------|\n`;
    report += `| **Total Budget** | ${formatCurrency(smart.budgetStatus.totalBudget)} |\n`;
    report += `| **Spent** | ${formatCurrency(smart.budgetStatus.spent)} |\n`;
    report += `| **Remaining** | ${formatCurrency(smart.budgetStatus.remaining)} |\n`;
    report += `| **Utilization** | ${formatPercentage(smart.budgetStatus.utilizationRatio)} |\n\n`;
  }

  // Provider Cost Breakdown
  if (smart.total.costPerProvider) {
    report += '## Provider Cost Breakdown (Smart Routing)\n\n';
    report += '| Provider | Total Cost | Percentage |\n';
    report += '|----------|------------|------------|\n';
    
    const totalCost = smart.total.totalCostUSD || 0;
    for (const [provider, cost] of Object.entries(smart.total.costPerProvider)) {
      const percentage = totalCost > 0 ? (cost / totalCost) * 100 : 0;
      report += `| **${provider}** | ${formatCurrency(cost)} | ${percentage.toFixed(1)}% |\n`;
    }
    report += '\n';
  }

  // By Group Analysis
  report += '## Performance by Group\n\n';
  
  const groups = Object.keys(smart.summary);
  for (const group of groups) {
    const baselineGroup = baseline.summary[group];
    const smartGroup = smart.summary[group];
    
    if (!baselineGroup || !smartGroup) continue;
    
    report += `### ${group}\n\n`;
    report += '| Metric | Baseline | Smart | Difference |\n';
    report += '|--------|----------|-------|------------|\n';
    report += `| **Count** | ${baselineGroup.count} | ${smartGroup.count} | ${smartGroup.count - baselineGroup.count} |\n`;
    report += `| **Success Rate** | ${formatPercentage(baselineGroup.successRate)} | ${formatPercentage(smartGroup.successRate)} | ${formatPercentage(smartGroup.successRate - baselineGroup.successRate)} |\n`;
    report += `| **Mean Latency** | ${formatLatency(baselineGroup.meanLatency)} | ${formatLatency(smartGroup.meanLatency)} | ${formatLatency((smartGroup.meanLatency || 0) - (baselineGroup.meanLatency || 0))} |\n`;
    report += `| **P95 Latency** | ${formatLatency(baselineGroup.p95Latency)} | ${formatLatency(smartGroup.p95Latency)} | ${formatLatency((smartGroup.p95Latency || 0) - (baselineGroup.p95Latency || 0))} |\n`;
    report += `| **JSON Validity** | ${formatPercentage(baselineGroup.jsonValidityRate || 0)} | ${formatPercentage(smartGroup.jsonValidityRate || 0)} | ${formatPercentage((smartGroup.jsonValidityRate || 0) - (baselineGroup.jsonValidityRate || 0))} |\n`;
    report += `| **Total Cost** | ${formatCurrency(baselineGroup.totalCostUSD || 0)} | ${formatCurrency(smartGroup.totalCostUSD || 0)} | ${formatCurrency((smartGroup.totalCostUSD || 0) - (baselineGroup.totalCostUSD || 0))} |\n`;
    report += `| **Mean Cost** | ${formatCurrency(baselineGroup.meanCostUSD || 0)} | ${formatCurrency(smartGroup.meanCostUSD || 0)} | ${formatCurrency((smartGroup.meanCostUSD || 0) - (baselineGroup.meanCostUSD || 0))} |\n\n`;
  }

  // Cost vs Performance Analysis
  report += '## Cost vs Performance Analysis\n\n';
  
  const baselineCostPerSuccess = (baseline.total.totalCostUSD || 0) / (baseline.total.count * baseline.total.successRate);
  const smartCostPerSuccess = (smart.total.totalCostUSD || 0) / (smart.total.count * smart.total.successRate);
  
  report += '| Metric | Baseline | Smart | Improvement |\n';
  report += '|--------|----------|-------|-------------|\n';
  report += `| **Cost per Success** | ${formatCurrency(baselineCostPerSuccess)} | ${formatCurrency(smartCostPerSuccess)} | ${formatCurrency(smartCostPerSuccess - baselineCostPerSuccess)} |\n`;
  report += `| **Latency per $** | ${formatLatency((baseline.total.meanLatency || 0) / Math.max(baseline.total.totalCostUSD || 0.000001, 0.000001))} | ${formatLatency((smart.total.meanLatency || 0) / Math.max(smart.total.totalCostUSD || 0.000001, 0.000001))} | ${formatLatency(((smart.total.meanLatency || 0) / Math.max(smart.total.totalCostUSD || 0.000001, 0.000001)) - ((baseline.total.meanLatency || 0) / Math.max(baseline.total.totalCostUSD || 0.000001, 0.000001)))} |\n\n`;

  // Recommendations
  report += '## Recommendations\n\n';
  
  const costSavings = (baseline.total.totalCostUSD || 0) - (smart.total.totalCostUSD || 0);
  const latencyChange = (smart.total.meanLatency || 0) - (baseline.total.meanLatency || 0);
  const successChange = smart.total.successRate - baseline.total.successRate;
  
  if (costSavings > 0) {
    report += `**Cost Savings:** Smart routing saved ${formatCurrency(costSavings)} (${((costSavings / (baseline.total.totalCostUSD || 0.000001)) * 100).toFixed(1)}% reduction)\n\n`;
  } else if (costSavings < 0) {
    report += `**Cost Increase:** Smart routing increased costs by ${formatCurrency(Math.abs(costSavings))} (${((Math.abs(costSavings) / (baseline.total.totalCostUSD || 0.000001)) * 100).toFixed(1)}% increase)\n\n`;
  }
  
  if (latencyChange < 0) {
    report += `**Latency Improvement:** Smart routing reduced mean latency by ${formatLatency(Math.abs(latencyChange))}\n\n`;
  } else if (latencyChange > 0) {
    report += `**Latency Increase:** Smart routing increased mean latency by ${formatLatency(latencyChange)}\n\n`;
  }
  
  if (successChange > 0) {
    report += `**Success Rate Improvement:** Smart routing improved success rate by ${formatPercentage(successChange)}\n\n`;
  } else if (successChange < 0) {
    report += `**Success Rate Decrease:** Smart routing decreased success rate by ${formatPercentage(Math.abs(successChange))}\n\n`;
  }

  // Summary
  report += '## Summary\n\n';
  report += 'The cost-aware smart routing system provides:\n\n';
  report += '- **Real-time cost tracking** with accurate pricing simulation\n';
  report += '- **Multi-objective optimization** balancing cost, latency, and quality\n';
  report += '- **Budget enforcement** with hard ceilings and pressure adjustment\n';
  report += '- **Provider cost analysis** for informed decision making\n';
  report += '- **Comprehensive reporting** with cost vs performance metrics\n\n';
  
  report += 'This enables intelligent routing decisions that optimize for both performance and cost efficiency.\n';

  return report;
}

// Main execution
function main() {
  console.log('Generating comprehensive cost-aware benchmark report...\n');
  
  // Try to load the most recent results
  const baseline = loadResults('results.json') || loadResults('results/baseline.json');
  const smart = loadResults('results/smart.json');
  
  const report = generateReport(baseline, smart);
  
  const outputPath = 'results/comprehensive-report.md';
  fs.writeFileSync(outputPath, report);
  
  console.log(`Report generated: ${outputPath}`);
  console.log(`Report length: ${report.length} characters`);
}

main();