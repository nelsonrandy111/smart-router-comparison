import fs from 'fs';

export function generateReport(baselinePath: string, smartPath: string, outPath: string) {
	const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf-8')) as any;
	const smart = JSON.parse(fs.readFileSync(smartPath, 'utf-8')) as any;

	function pct(n: number | null | undefined) {
		if (n == null) return 'n/a';
		return (n * 100).toFixed(1) + '%';
	}

	const groups = new Set<string>([
		...Object.keys(baseline.summary || {}),
		...Object.keys(smart.summary || {}),
	]);

	let md = '# Smart Router Benchmark Report\n\n';
	md += `Baseline file: ${baselinePath}  \n`;
	md += `Smart file: ${smartPath}  \n\n`;

	md += '## Overall\n\n';
	md += `- Count: baseline ${baseline.total.count}, smart ${smart.total.count}\n`;
	md += `- Success rate: baseline ${pct(baseline.total.successRate)}, smart ${pct(smart.total.successRate)}\n`;
	md += `- Mean latency: baseline ${baseline.total.meanLatency?.toFixed(1)}ms, smart ${smart.total.meanLatency?.toFixed(1)}ms\n`;
	md += `- P95 latency: baseline ${baseline.total.p95Latency?.toFixed(1)}ms, smart ${smart.total.p95Latency?.toFixed(1)}ms\n`;
	if (baseline.total.jsonValidityRate != null || smart.total.jsonValidityRate != null) {
		md += `- JSON validity: baseline ${pct(baseline.total.jsonValidityRate)}, smart ${pct(smart.total.jsonValidityRate)}\n`;
	}
	md += '\n';

	md += '## By Group\n\n';
	for (const g of groups) {
		const b = baseline.summary[g];
		const s = smart.summary[g];
		if (!b || !s) continue;
		md += `### ${g}\n`;
		md += `- Count: baseline ${b.count}, smart ${s.count}\n`;
		md += `- Success rate: baseline ${pct(b.successRate)}, smart ${pct(s.successRate)}\n`;
		md += `- Mean latency: baseline ${b.meanLatency?.toFixed(1)}ms, smart ${s.meanLatency?.toFixed(1)}ms\n`;
		if (b.jsonValidityRate != null || s.jsonValidityRate != null) {
			md += `- JSON validity: baseline ${pct(b.jsonValidityRate)}, smart ${pct(s.jsonValidityRate)}\n`;
		}
		md += '\n';
	}

	fs.writeFileSync(outPath, md);
	console.log(`Wrote ${outPath}`);
}

const isDirectRun = typeof process !== 'undefined' && Array.isArray(process.argv) && process.argv[1] && process.argv[1].endsWith('report.ts');
if (isDirectRun) {
	const b = process.argv[2];
	const s = process.argv[3];
	const out = process.argv[4] || 'results/report.md';
	if (!b || !s) {
		console.error('Usage: tsx src/bench/report.ts <baseline.json> <smart.json> [out.md]');
		process.exit(1);
	}
	generateReport(b, s, out);
}