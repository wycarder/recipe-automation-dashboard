// Test script to demonstrate keyword rotation and variety
const AIKeywordService = require('./src/services/ai-keyword-service.ts');

async function testKeywordRotation() {
  console.log('🧪 Testing Keyword Rotation and Variety\n');
  
  const aiService = new AIKeywordService();
  const testDomain = 'airfryerauthority.com';
  const testPrompt = 'recipes'; // No specific theme
  
  console.log(`Testing with domain: ${testDomain}`);
  console.log(`Test prompt: "${testPrompt}" (no specific theme)\n`);
  
  // Generate keywords 5 times to show rotation
  for (let i = 1; i <= 5; i++) {
    console.log(`--- Test Run ${i} ---`);
    
    try {
      const variations = await aiService.generateKeywordVariations(testDomain, testPrompt, 3);
      
      console.log('Generated keywords:');
      variations.forEach((variation, index) => {
        console.log(`  ${index + 1}. "${variation.keyword}" (confidence: ${variation.confidence}, category: ${variation.category})`);
        console.log(`     Reasoning: ${variation.reasoning}`);
      });
      
      console.log(''); // Empty line for readability
      
    } catch (error) {
      console.error(`Error in test run ${i}:`, error.message);
    }
  }
  
  console.log('✅ Test completed! You should see different keywords in each run.');
  console.log('The system now rotates through different recipe categories and cooking styles.');
}

// Run the test
testKeywordRotation().catch(console.error);
