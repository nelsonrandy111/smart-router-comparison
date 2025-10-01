import fs from 'fs';
import path from 'path';
import Ajv from 'ajv';
import { Router } from '../core/router';
import { registerDefaultOllamaTextProviders } from '../providers/ollama/text';
import { registerDefaultOllamaEmbeddingProviders } from '../providers/ollama/embedding';
import { ModelType } from '../types/model';
import { aggregate, type CallRecord } from './metrics';
import type { CostEstimate } from '../core/costs';

const ajv = new Ajv();

interface RunnerOptions {
	mode: 'baseline' | 'smart';
	outPath: string;
}

function loadJSON<T>(rel: string): T {
	const file = path.join(process.cwd(), rel);
	return JSON.parse(fs.readFileSync(file, 'utf-8')) as T;
}

async function runTextSmall(router: Router, mode: 'baseline' | 'smart'): Promise<CallRecord[]> {
	const tasks = loadJSON<{ prompt: string; minChars: number }[]>('bench/tasks/text_small.json');
	const out: CallRecord[] = [];
	for (const t of tasks) {
		const start = Date.now();
		try {
			const providerHint = mode === 'baseline' ? 'ollama-phi3-mini' : undefined;
			const { result: text, provider, costEstimate } = await (router as any).useModelWithInfo(ModelType.TEXT_SMALL, { prompt: t.prompt }, { promptLength: t.prompt.length }, providerHint);
			const latencyMs = Date.now() - start;
			out.push({ 
				group: 'TEXT_SMALL', 
				provider, 
				latencyMs, 
				success: typeof text === 'string' && text.length >= t.minChars,
				costEstimate
			});
		} catch {
			out.push({ group: 'TEXT_SMALL', provider: 'error', latencyMs: Date.now() - start, success: false });
		}
	}
	return out;
}

async function runTextLarge(router: Router, mode: 'baseline' | 'smart'): Promise<CallRecord[]> {
	const tasks = loadJSON<{ prompt: string; minChars: number }[]>('bench/tasks/text_large.json');
	const out: CallRecord[] = [];
	for (const t of tasks) {
		const start = Date.now();
		try {
			const providerHint = mode === 'baseline' ? 'ollama-llama3-8b' : undefined;
			const { result: text, provider, costEstimate } = await (router as any).useModelWithInfo(ModelType.TEXT_LARGE, { prompt: t.prompt }, { promptLength: t.prompt.length }, providerHint);
			const latencyMs = Date.now() - start;
			out.push({ 
				group: 'TEXT_LARGE', 
				provider, 
				latencyMs, 
				success: typeof text === 'string' && text.length >= t.minChars,
				costEstimate
			});
		} catch {
			out.push({ group: 'TEXT_LARGE', provider: 'error', latencyMs: Date.now() - start, success: false });
		}
	}
	return out;
}

async function runObject(router: Router, mode: 'baseline' | 'smart', relPath: string, group: string): Promise<CallRecord[]> {
	const spec = loadJSON<{ schema: any; prompts: string[] }>(relPath);
	const validate = ajv.compile(spec.schema);
	const out: CallRecord[] = [];
	for (const prompt of spec.prompts) {
		const start = Date.now();
		try {
			const providerHint = mode === 'baseline' ? 'ollama-llama3-8b' : undefined;
			const { result: text, provider, costEstimate } = await (router as any).useModelWithInfo(ModelType.TEXT_LARGE, { prompt, schema: spec.schema }, { promptLength: prompt.length, hasSchema: true }, providerHint);
			const latencyMs = Date.now() - start;
			let jsonValid = false;
			try {
				const obj = JSON.parse(String(text));
				jsonValid = validate(obj) as boolean;
			} catch {
				jsonValid = false;
			}
			out.push({ 
				group, 
				provider, 
				latencyMs, 
				success: jsonValid, 
				jsonValid,
				costEstimate
			});
		} catch {
			out.push({ group, provider: 'error', latencyMs: Date.now() - start, success: false, jsonValid: false });
		}
	}
	return out;
}

async function runEmbeddings(router: Router, mode: 'baseline' | 'smart'): Promise<CallRecord[]> {
	const inputs = loadJSON<string[]>('bench/tasks/embeddings.json');
	const out: CallRecord[] = [];
	for (const text of inputs) {
		const start = Date.now();
		try {
			const providerHint = mode === 'baseline' ? 'ollama-nomic-embed-text' : undefined;
			const { result: emb, provider, costEstimate } = await (router as any).useModelWithInfo(ModelType.TEXT_EMBEDDING, { text }, {}, providerHint);
			const latencyMs = Date.now() - start;
			out.push({ 
				group: 'TEXT_EMBEDDING', 
				provider, 
				latencyMs, 
				success: Array.isArray(emb) && emb.length > 0,
				costEstimate
			});
		} catch {
			out.push({ group: 'TEXT_EMBEDDING', provider: 'error', latencyMs: Date.now() - start, success: false });
		}
	}
	return out;
}

export async function main() {
	// Ensure IPv4 for Ollama to avoid IPv6 localhost issues
	if (!process.env.OLLAMA_BASE_URL) {
		process.env.OLLAMA_BASE_URL = 'http://127.0.0.1:11434';
	}

	const mode = (process.argv.includes('--mode=baseline') ? 'baseline' : (process.argv.includes('--mode=smart') ? 'smart' : 'smart')) as 'baseline' | 'smart';
	const outIndex = process.argv.findIndex((a) => a === '--out');
	const outPath = outIndex !== -1 ? process.argv[outIndex + 1] : 'results.json';

	registerDefaultOllamaTextProviders();
	registerDefaultOllamaEmbeddingProviders();
	const router = new Router({ 
		perCallTimeoutMs: 300_000,
		sessionBudget: 1.0 // $1 budget for cost simulation
	});

	const all: CallRecord[] = [];
	all.push(...(await runTextSmall(router, mode)));
	all.push(...(await runTextLarge(router, mode)));
	all.push(...(await runObject(router, mode, 'bench/tasks/object_small.json', 'OBJECT_SMALL')));
	all.push(...(await runObject(router, mode, 'bench/tasks/object_large.json', 'OBJECT_LARGE')));
	all.push(...(await runEmbeddings(router, mode)));

	const byGroup: Record<string, CallRecord[]> = {};
	for (const r of all) {
		(byGroup[r.group] = byGroup[r.group] || []).push(r);
	}
	const summary = Object.fromEntries(Object.entries(byGroup).map(([k, v]) => [k, aggregate(v)]));
	const total = aggregate(all);
	const budgetStatus = router.getBudgetStatus();
	const output = { 
		mode, 
		summary, 
		total, 
		all,
		budgetStatus,
		costSummary: {
			totalSpent: budgetStatus?.spent || 0,
			remainingBudget: budgetStatus?.remaining || 0,
			utilizationRatio: budgetStatus?.utilizationRatio || 0,
		}
	};
	fs.mkdirSync(path.dirname(outPath), { recursive: true });
	fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
	console.log(`Wrote ${outPath}`);
	console.log(`Budget Status: $${budgetStatus?.spent?.toFixed(4) || 0} spent of $${budgetStatus?.totalBudget || 0} (${((budgetStatus?.utilizationRatio || 0) * 100).toFixed(1)}% used)`);
}

// ESM-compatible entrypoint check
const isDirectRun = typeof process !== 'undefined' && Array.isArray(process.argv) && process.argv[1] && process.argv[1].endsWith('runner.ts');
if (isDirectRun) {
	main().catch((e) => {
		console.error(e);
		process.exit(1);
	});
}