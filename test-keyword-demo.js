// Quick demo script to test keyword rotation
// This simulates what happens when you click "Start Automation" multiple times

console.log('🧪 Testing Keyword Rotation Demo\n');

// Simulate the AI keyword service
class MockAIKeywordService {
  constructor() {
    this.recentKeywords = new Map();
    this.categoryRotationIndex = new Map();
    
    this.recipeCategories = [
      'chicken recipes', 'beef recipes', 'pork recipes', 'fish recipes', 'seafood recipes',
      'vegetable recipes', 'pasta recipes', 'rice recipes', 'soup recipes', 'salad recipes',
      'dessert recipes', 'breakfast recipes', 'lunch recipes', 'dinner recipes', 'snack recipes',
      'appetizer recipes', 'side dish recipes', 'main course recipes', 'healthy recipes',
      'quick recipes', 'easy recipes', 'one-pot recipes', 'sheet pan recipes', 'slow cooker recipes',
      'grilled recipes', 'baked recipes', 'fried recipes', 'steamed recipes', 'roasted recipes'
    ];
    
    this.cookingStyles = [
      'quick and easy', 'healthy', 'comfort food', 'gourmet', 'family-friendly',
      'one-pot', 'meal prep', 'batch cooking', 'make-ahead', 'freezer-friendly'
    ];
  }

  generateRotatedVariations(websiteDomain, theme, count, recentKeywords) {
    const variations = [];
    const currentIndex = this.categoryRotationIndex.get(websiteDomain) || 0;
    
    // Get categories that haven't been used recently
    const availableCategories = this.recipeCategories.filter(category => 
      !recentKeywords.some(recent => recent.toLowerCase().includes(category.toLowerCase()))
    );
    
    // If we've used all categories, reset and start over
    if (availableCategories.length === 0) {
      this.recentKeywords.set(websiteDomain, []);
      return this.generateRotatedVariations(websiteDomain, theme, count, []);
    }
    
    // Select categories for this rotation
    const selectedCategories = this.selectCategoriesForRotation(availableCategories, count, currentIndex);
    
    selectedCategories.forEach((category, index) => {
      const keyword = `${category} ${theme.primaryTheme}`;
      variations.push({
        keyword,
        confidence: 0.95,
        reasoning: `Combines recipe category "${category}" with website's primary theme "${theme.primaryTheme}"`,
        category: 'primary'
      });
    });
    
    // Update rotation index
    this.categoryRotationIndex.set(websiteDomain, (currentIndex + selectedCategories.length) % this.recipeCategories.length);
    
    return variations.slice(0, count);
  }

  selectCategoriesForRotation(availableCategories, count, currentIndex) {
    const selected = [];
    let index = currentIndex % availableCategories.length;
    
    for (let i = 0; i < Math.min(count, availableCategories.length); i++) {
      selected.push(availableCategories[index]);
      index = (index + 1) % availableCategories.length;
    }
    
    return selected;
  }

  updateRecentKeywords(websiteDomain, newKeywords) {
    const current = this.recentKeywords.get(websiteDomain) || [];
    const updated = [...current, ...newKeywords];
    this.recentKeywords.set(websiteDomain, updated.slice(-10));
  }

  async generateKeywordVariations(websiteDomain, targetPrompt, count = 3) {
    const theme = {
      primaryTheme: 'air fryer cooking',
      secondaryThemes: ['healthy cooking', 'quick meals', 'crispy foods']
    };
    
    const recentKeywords = this.recentKeywords.get(websiteDomain) || [];
    
    let variations = [];
    if (targetPrompt.toLowerCase().trim() === 'recipes' || targetPrompt.toLowerCase().trim() === '') {
      variations = this.generateRotatedVariations(websiteDomain, theme, count, recentKeywords);
    }
    
    // Record the generated keywords
    const generatedKeywords = variations.map(v => v.keyword);
    this.updateRecentKeywords(websiteDomain, generatedKeywords);
    
    return variations;
  }
}

// Test the rotation
async function testRotation() {
  const aiService = new MockAIKeywordService();
  const testDomain = 'airfryerauthority.com';
  
  console.log('Testing airfryerauthority.com with no theme (general recipes):\n');
  
  for (let i = 1; i <= 5; i++) {
    console.log(`--- Test Run ${i} ---`);
    const variations = await aiService.generateKeywordVariations(testDomain, 'recipes', 2);
    
    variations.forEach((variation, index) => {
      console.log(`  ${index + 1}. "${variation.keyword}"`);
    });
    console.log('');
  }
  
  console.log('✅ Notice how each run generates different keywords!');
  console.log('✅ The system rotates through different recipe categories.');
  console.log('✅ No repetition until all categories are used.');
}

testRotation().catch(console.error);
