import { Router } from './core/router';
import { registerDefaultOllamaTextProviders } from './providers/ollama/text';
import { registerDefaultOllamaEmbeddingProviders } from './providers/ollama/embedding';
import { ModelType } from './types/model';

/**
 * Example demonstrating cost-aware smart routing
 * 
 * This example shows how the router can balance cost, latency, and quality
 * based on different policy configurations.
 */
async function demonstrateCostAwareRouting() {
	console.log('Cost-Aware Smart Router Demo\n');

	// Register providers with cost capabilities
	registerDefaultOllamaTextProviders();
	registerDefaultOllamaEmbeddingProviders();

	// Create router with a $0.50 budget
	const router = new Router({ 
		perCallTimeoutMs: 30_000,
		sessionBudget: 0.50
	});

	const testPrompts = [
		"Write a haiku about coding.",
		"Explain quantum computing in simple terms.",
		"Create a JSON schema for a user profile with name, email, and age fields."
	];

  console.log('Test Prompts:');
	testPrompts.forEach((prompt, i) => {
		console.log(`  ${i + 1}. "${prompt}"`);
	});

	// Test different routing modes
	const modes = [
		{ name: 'Quality-First', costWeight: 0.1, description: 'Prioritizes quality over cost' },
		{ name: 'Balanced', costWeight: 1.0, description: 'Balances cost and quality' },
		{ name: 'Cost-First', costWeight: 5.0, description: 'Prioritizes cost savings' }
	];

	for (const mode of modes) {
    console.log(`\n${mode.name} Mode (${mode.description})`);
		console.log('=' .repeat(50));
		
		// Reset session for each mode
		router.resetSession();
		
		for (let i = 0; i < testPrompts.length; i++) {
			const prompt = testPrompts[i];
      console.log(`\nPrompt ${i + 1}: "${prompt}"`);
			
			try {
				const { result, provider, costEstimate } = await router.useModelWithInfo(
					ModelType.TEXT_SMALL,
					{ prompt },
					{ 
						promptLength: prompt.length,
						costWeight: mode.costWeight,
						expectedOutputTokens: 50
					}
				);
				
        console.log(`  Provider: ${provider}`);
        console.log(`  Cost: $${costEstimate?.totalUSD.toFixed(6) || 'N/A'}`);
        console.log(`  Tokens: ${costEstimate?.inputTokens || 0} in, ${costEstimate?.outputTokens || 0} out`);
        console.log(`  Response: "${typeof result === 'string' ? result.substring(0, 100) + '...' : 'N/A'}"`);
				
			} catch (error) {
        console.log(`  Error: ${error}`);
			}
		}
		
		// Show budget status for this mode
		const budgetStatus = router.getBudgetStatus();
    console.log(`\nBudget Status: $${budgetStatus?.spent?.toFixed(4) || 0} spent of $${budgetStatus?.totalBudget || 0}`);
	}

	// Test budget enforcement
    console.log('\nTesting Budget Enforcement');
	console.log('=' .repeat(50));
	
	// Reset and set a very low budget
	router.resetSession();
	router.setBudget(0.001); // $0.001 - very low budget
	
	console.log('Budget set to $0.001 (very low)');
	
	try {
		const { result, provider, costEstimate } = await router.useModelWithInfo(
			ModelType.TEXT_SMALL,
			{ prompt: "This should be rejected due to budget constraints." },
			{ 
				promptLength: 50,
				costWeight: 1.0,
				expectedOutputTokens: 20
			}
		);
		console.log(`Unexpected success: ${provider} - $${costEstimate?.totalUSD}`);
	} catch (error) {
    console.log(`Expected rejection due to budget: ${error}`);
	}

  console.log('\nDemo completed!');
}

// Run the demo
demonstrateCostAwareRouting().catch(console.error);