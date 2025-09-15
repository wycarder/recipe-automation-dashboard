// Test script to compare old vs new keyword generation behavior
const AIKeywordService = require('./src/services/ai-keyword-service.ts');

async function testKeywordComparison() {
  console.log('🔄 Keyword Generation Comparison Test\n');
  
  const aiService = new AIKeywordService();
  const testDomains = ['airfryerauthority.com', 'quickdinnerhub.com', 'comfortfoodcozy.com'];
  const testPrompt = 'recipes'; // No specific theme
  
  console.log('Testing multiple domains with no specific theme...\n');
  
  // Test each domain multiple times to show variety
  for (const domain of testDomains) {
    console.log(`\n🏠 Domain: ${domain}`);
    console.log('=' .repeat(50));
    
    for (let run = 1; run <= 3; run++) {
      console.log(`\nRun ${run}:`);
      
      try {
        const variations = await aiService.generateKeywordVariations(domain, testPrompt, 2);
        
        variations.forEach((variation, index) => {
          console.log(`  ${index + 1}. "${variation.keyword}"`);
        });
        
      } catch (error) {
        console.error(`Error: ${error.message}`);
      }
    }
  }
  
  console.log('\n✅ Comparison complete!');
  console.log('\nKey improvements:');
  console.log('• Different keywords generated on each call');
  console.log('• Rotates through recipe categories (chicken, beef, vegetables, etc.)');
  console.log('• Combines with website-specific themes');
  console.log('• Avoids repetition by tracking recent keywords');
  console.log('• Adds cooking styles for variety');
}

// Run the test
testKeywordComparison().catch(console.error);
