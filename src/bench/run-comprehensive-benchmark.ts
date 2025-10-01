import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('Running Comprehensive Cost-Aware Benchmark\n');

// Step 1: Run baseline benchmark
console.log('Running baseline benchmark...');
try {
  execSync('npx tsx src/bench/runner.ts --mode=baseline --out=results/baseline-comprehensive.json', { stdio: 'inherit' });
  console.log('Baseline benchmark completed\n');
} catch (error) {
  console.log('Baseline benchmark failed:', error);
  process.exit(1);
}

// Step 2: Run smart benchmark
console.log('Running smart cost-aware benchmark...');
try {
  execSync('npx tsx src/bench/runner.ts --mode=smart --out=results/smart-comprehensive.json', { stdio: 'inherit' });
  console.log('Smart benchmark completed\n');
} catch (error) {
  console.log('Smart benchmark failed:', error);
  process.exit(1);
}

// Step 3: Generate comprehensive report
console.log('Generating comprehensive report...');
try {
  execSync('npx tsx src/bench/generate-comprehensive-report.ts', { stdio: 'inherit' });
  console.log('Comprehensive report generated\n');
} catch (error) {
  console.log('Report generation failed:', error);
  process.exit(1);
}

console.log('Comprehensive cost-aware benchmark completed!');
console.log('Check results/comprehensive-report.md for the full analysis');