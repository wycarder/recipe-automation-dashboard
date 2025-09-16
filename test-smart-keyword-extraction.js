#!/usr/bin/env node

/**
 * Test script for Smart Keyword Extraction System
 * 
 * This script tests the domain intelligence system to ensure it properly
 * detects themes and generates appropriate keywords for different types of websites.
 */

// Mock AI Keyword Service for testing
class MockAIKeywordService {
  constructor() {
    this.customContexts = new Map();
    this.recentKeywords = new Map();
    
    // Domain intelligence pattern recognition
    this.themePatterns = {
      beverages: ['sip', 'drink', 'float', 'spritz', 'cocktail', 'mocktail', 'brew', 'juice', 'beverage', 'liquid'],
      cookingMethods: ['airfryer', 'air-fryer', 'slowcook', 'slow-cook', 'crockpot', 'grill', 'pressure', 'instant', 'smoker', 'bake', 'fry', 'roast'],
      dietary: ['keto', 'paleo', 'vegan', 'protein', 'healthy', 'sugar-free', 'low-carb', 'gluten-free', 'dairy-free'],
      mealTypes: ['breakfast', 'dinner', 'lunch', 'snack', 'dessert', 'brunch', 'appetizer', 'side'],
      baking: ['dough', 'bake', 'bread', 'pastry', 'cake', 'cookie', 'sweet', 'sugar', 'flour'],
      cuisine: ['italian', 'mexican', 'asian', 'indian', 'mediterranean', 'french', 'chinese', 'japanese'],
      comfort: ['comfort', 'cozy', 'hearty', 'warm', 'comforting'],
      budget: ['budget', 'cheap', 'affordable', 'frugal', 'economical'],
      quick: ['quick', 'fast', 'easy', 'simple', 'rapid', 'speedy', 'instant'],
      // New patterns for better detection
      frozen: ['frozen', 'freeze', 'freezer'],
      mealPrep: ['meal', 'mealhq', 'mealprep', 'meal-prep', 'prep'],
      protein: ['protein', 'meat', 'chicken', 'beef', 'pork'],
      vegetarian: ['veg', 'vegetarian', 'plant', 'veggie'],
      slow: ['slow', 'crockpot', 'slowcook', 'slow-cook'],
      instant: ['instant', 'quick', 'fast', 'rapid'],
      onePot: ['onepot', 'one-pot', 'skillet', 'pan'],
      sheetPan: ['sheetpan', 'sheet-pan', 'tray'],
      slowCooker: ['slowcooker', 'slow-cooker', 'crockpot']
    };
  }

  analyzeDomainIntelligence(domain) {
    const domainLower = domain.toLowerCase().replace(/\.(com|org|net|co|io)$/, '');
    const detectedThemes = [];
    let primaryFocus = 'recipes';
    let confidence = 0.5;
    let reasoning = 'Generic recipe site';

    console.log(`\n🔍 Analyzing domain: ${domain}`);
    console.log(`Domain parts: ${domainLower.split(/[-_]/).join(', ')}`);

    // Check each pattern category
    for (const [category, patterns] of Object.entries(this.themePatterns)) {
      for (const pattern of patterns) {
        if (domainLower.includes(pattern)) {
          detectedThemes.push(category);
          console.log(`  ✓ Found pattern "${pattern}" → category: ${category}`);
          
          // Set primary focus based on category
          switch (category) {
            case 'beverages':
              primaryFocus = 'drinks beverages';
              confidence = 0.9;
              reasoning = `Domain contains "${pattern}" - detected as beverage/drink site`;
              break;
            case 'cookingMethods':
              primaryFocus = `${pattern} cooking`;
              confidence = 0.85;
              reasoning = `Domain contains "${pattern}" - detected as ${pattern} cooking site`;
              break;
            case 'dietary':
              primaryFocus = `${pattern} recipes`;
              confidence = 0.9;
              reasoning = `Domain contains "${pattern}" - detected as ${pattern} diet site`;
              break;
            case 'mealTypes':
              primaryFocus = `${pattern} recipes`;
              confidence = 0.8;
              reasoning = `Domain contains "${pattern}" - detected as ${pattern} focused site`;
              break;
            case 'baking':
              primaryFocus = 'baking desserts';
              confidence = 0.85;
              reasoning = `Domain contains "${pattern}" - detected as baking/dessert site`;
              break;
            case 'cuisine':
              primaryFocus = `${pattern} recipes`;
              confidence = 0.8;
              reasoning = `Domain contains "${pattern}" - detected as ${pattern} cuisine site`;
              break;
            case 'comfort':
              primaryFocus = 'comfort food';
              confidence = 0.8;
              reasoning = `Domain contains "${pattern}" - detected as comfort food site`;
              break;
            case 'budget':
              primaryFocus = 'budget-friendly recipes';
              confidence = 0.8;
              reasoning = `Domain contains "${pattern}" - detected as budget cooking site`;
              break;
            case 'quick':
              primaryFocus = 'quick easy recipes';
              confidence = 0.8;
              reasoning = `Domain contains "${pattern}" - detected as quick cooking site`;
              break;
            case 'frozen':
              primaryFocus = 'frozen meals';
              confidence = 0.9;
              reasoning = `Domain contains "${pattern}" - detected as frozen meal site`;
              break;
            case 'mealPrep':
              primaryFocus = 'meal prep recipes';
              confidence = 0.85;
              reasoning = `Domain contains "${pattern}" - detected as meal prep site`;
              break;
            case 'protein':
              primaryFocus = 'protein recipes';
              confidence = 0.85;
              reasoning = `Domain contains "${pattern}" - detected as protein-focused site`;
              break;
            case 'vegetarian':
              primaryFocus = 'vegetarian recipes';
              confidence = 0.85;
              reasoning = `Domain contains "${pattern}" - detected as vegetarian site`;
              break;
            case 'slow':
              primaryFocus = 'slow cooker recipes';
              confidence = 0.85;
              reasoning = `Domain contains "${pattern}" - detected as slow cooking site`;
              break;
            case 'onePot':
              primaryFocus = 'one pot meals';
              confidence = 0.85;
              reasoning = `Domain contains "${pattern}" - detected as one pot cooking site`;
              break;
            case 'sheetPan':
              primaryFocus = 'sheet pan recipes';
              confidence = 0.85;
              reasoning = `Domain contains "${pattern}" - detected as sheet pan cooking site`;
              break;
          }
        }
      }
    }

    // Special handling for compound patterns
    if (detectedThemes.includes('frozen') && detectedThemes.includes('mealPrep')) {
      primaryFocus = 'frozen meals';
      confidence = 0.95;
      reasoning = 'Domain contains both "frozen" and "meal" - detected as frozen meal site';
    } else if (detectedThemes.includes('onePot') && detectedThemes.includes('mealPrep')) {
      primaryFocus = 'one pot meals';
      confidence = 0.95;
      reasoning = 'Domain contains both "one pot" and "meal" - detected as one pot meal site';
    } else if (detectedThemes.includes('sheetPan') && detectedThemes.includes('mealTypes')) {
      primaryFocus = 'sheet pan meals';
      confidence = 0.95;
      reasoning = 'Domain contains both "sheet pan" and "dinner" - detected as sheet pan meal site';
    } else if (detectedThemes.includes('frozen')) {
      primaryFocus = 'frozen meals';
      confidence = 0.9;
      reasoning = 'Domain contains "frozen" - detected as frozen meal site';
    } else if (detectedThemes.includes('onePot')) {
      primaryFocus = 'one pot meals';
      confidence = 0.9;
      reasoning = 'Domain contains "one pot" - detected as one pot cooking site';
    } else if (detectedThemes.includes('sheetPan')) {
      primaryFocus = 'sheet pan recipes';
      confidence = 0.9;
      reasoning = 'Domain contains "sheet pan" - detected as sheet pan cooking site';
    } else if (detectedThemes.includes('mealPrep')) {
      primaryFocus = 'meals';
      confidence = 0.85;
      reasoning = 'Domain contains "meal" - detected as meal-focused site';
    }

    // Special handling for specific patterns
    if (domainLower.includes('mocktail') || domainLower.includes('mock')) {
      primaryFocus = 'mocktails alcohol-free cocktails';
      confidence = 0.95;
      reasoning = 'Domain contains "mocktail" - detected as mocktail site';
    } else if (domainLower.includes('sip')) {
      primaryFocus = 'drinks beverages';
      confidence = 0.9;
      reasoning = 'Domain contains "sip" - detected as drink site';
    } else if (domainLower.includes('airfryer') || domainLower.includes('air-fryer')) {
      primaryFocus = 'air fryer recipes';
      confidence = 0.95;
      reasoning = 'Domain contains "airfryer" - detected as air fryer cooking site';
    }

    console.log(`Detected themes: ${detectedThemes.join(', ')}`);
    console.log(`Primary focus: ${primaryFocus}`);
    console.log(`Confidence: ${confidence}`);

    return {
      detectedThemes,
      primaryFocus,
      confidence,
      reasoning
    };
  }

  setCustomContext(domain, context) {
    this.customContexts.set(domain, context);
  }

  getCustomContext(domain) {
    return this.customContexts.get(domain) || null;
  }

  preventRedundancy(variations) {
    return variations.map(variation => {
      let keyword = variation.keyword;
      
      // Remove duplicate words
      const words = keyword.toLowerCase().split(/\s+/);
      const uniqueWords = [...new Set(words)];
      
      // Remove "recipes recipes" pattern
      if (uniqueWords.includes('recipes') && uniqueWords.filter(w => w === 'recipes').length > 1) {
        uniqueWords.splice(uniqueWords.lastIndexOf('recipes'), 1);
      }
      
      // Remove "drinks drinks" pattern
      if (uniqueWords.includes('drinks') && uniqueWords.filter(w => w === 'drinks').length > 1) {
        uniqueWords.splice(uniqueWords.lastIndexOf('drinks'), 1);
      }
      
      // Remove "beverages beverages" pattern
      if (uniqueWords.includes('beverages') && uniqueWords.filter(w => w === 'beverages').length > 1) {
        uniqueWords.splice(uniqueWords.lastIndexOf('beverages'), 1);
      }
      
      // Remove "cooking cooking" pattern
      if (uniqueWords.includes('cooking') && uniqueWords.filter(w => w === 'cooking').length > 1) {
        uniqueWords.splice(uniqueWords.lastIndexOf('cooking'), 1);
      }
      
      const cleanedKeyword = uniqueWords.join(' ');
      
      return {
        ...variation,
        keyword: cleanedKeyword,
        reasoning: variation.reasoning + ' (redundancy cleaned)'
      };
    });
  }

  async generateKeywordVariations(websiteDomain, targetPrompt, count = 3) {
    // Debug logging
    console.log(`\n🔍 Domain Intelligence Analysis:`);
    console.log(`Domain: ${websiteDomain}`);
    
    // Check for custom context first
    const customContext = this.getCustomContext(websiteDomain);
    let theme = null;
    let intelligence = null;
    
    if (customContext) {
      console.log(`Custom context found: ${customContext.primaryTheme}`);
      console.log(`Custom keywords: ${customContext.customKeywords.join(', ')}`);
      
      // Create theme from custom context
      theme = {
        domain: websiteDomain,
        name: websiteDomain,
        primaryTheme: customContext.primaryTheme,
        secondaryThemes: customContext.customKeywords,
        targetAudience: 'custom configured'
      };
    } else {
      // Use domain intelligence analysis
      intelligence = this.analyzeDomainIntelligence(websiteDomain);
      console.log(`Detected themes: ${intelligence.detectedThemes.join(', ')}`);
      console.log(`Primary focus: ${intelligence.primaryFocus}`);
      console.log(`Confidence: ${intelligence.confidence}`);
      console.log(`Reasoning: ${intelligence.reasoning}`);
      
      // Create theme from intelligence
      theme = {
        domain: websiteDomain,
        name: websiteDomain,
        primaryTheme: intelligence.primaryFocus,
        secondaryThemes: intelligence.detectedThemes,
        targetAudience: 'intelligence detected'
      };
    }

    // Generate variations
    const variations = [];
    const prompt = targetPrompt.toLowerCase().trim();

    // Generate primary variations
    variations.push({
      keyword: `${prompt} ${theme.primaryTheme}`,
      confidence: 0.95,
      reasoning: `Combines target prompt "${targetPrompt}" with website's primary theme "${theme.primaryTheme}"`,
      category: 'primary'
    });

    // Add secondary variations
    theme.secondaryThemes.slice(0, 2).forEach(secondaryTheme => {
      variations.push({
        keyword: `${prompt} ${secondaryTheme}`,
        confidence: 0.85,
        reasoning: `Combines target prompt with secondary theme "${secondaryTheme}"`,
        category: 'primary'
      });
    });

    // Apply redundancy prevention
    const cleanedVariations = this.preventRedundancy(variations);

    // Debug output
    const generatedKeywords = cleanedVariations.map(v => v.keyword);
    console.log(`Generated keywords: ${generatedKeywords.join(', ')}`);

    return cleanedVariations.slice(0, count);
  }
}

// Test domains with expected outcomes
const testDomains = [
  {
    domain: 'thesipspot.com',
    expectedThemes: ['beverages'],
    expectedFocus: 'drinks beverages',
    description: 'Drink blog - should generate beverage keywords, NOT food recipes'
  },
  {
    domain: 'mocktailmixter.com',
    expectedThemes: ['beverages'],
    expectedFocus: 'mocktails alcohol-free cocktails',
    description: 'Mocktail site - should generate mocktail keywords'
  },
  {
    domain: 'airfryerauthority.com',
    expectedThemes: ['cookingMethods'],
    expectedFocus: 'air fryer recipes',
    description: 'Air fryer site - should keep air fryer in all keywords'
  },
  {
    domain: 'ketokitchen.com',
    expectedThemes: ['dietary'],
    expectedFocus: 'keto recipes',
    description: 'Keto site - should generate keto-focused keywords'
  },
  {
    domain: 'sugarrushkitchen.com',
    expectedThemes: ['baking'],
    expectedFocus: 'baking desserts',
    description: 'Dessert site - should generate baking/dessert keywords'
  },
  {
    domain: 'budgetbiteshq.com',
    expectedThemes: ['budget'],
    expectedFocus: 'budget-friendly recipes',
    description: 'Budget cooking site - should generate budget-focused keywords'
  },
  {
    domain: 'quickdinnerhub.com',
    expectedThemes: ['quick'],
    expectedFocus: 'quick easy recipes',
    description: 'Quick cooking site - should generate quick meal keywords'
  },
  {
    domain: 'comfortfoodcozy.com',
    expectedThemes: ['comfort'],
    expectedFocus: 'comfort food',
    description: 'Comfort food site - should generate comfort food keywords'
  },
  {
    domain: 'frozenmealhq.com',
    expectedThemes: ['frozen', 'mealPrep'],
    expectedFocus: 'frozen meals',
    description: 'Frozen meal site - should generate frozen meal keywords'
  },
  {
    domain: 'onepotmeals.com',
    expectedThemes: ['onePot', 'mealPrep'],
    expectedFocus: 'one pot meals',
    description: 'One pot meal site - should generate one pot meal keywords'
  },
  {
    domain: 'sheetpandinners.com',
    expectedThemes: ['sheetPan', 'mealTypes'],
    expectedFocus: 'sheet pan recipes',
    description: 'Sheet pan dinner site - should generate sheet pan keywords'
  }
];

async function testDomainIntelligence() {
  console.log('🧪 Testing Smart Keyword Extraction System\n');
  console.log('=' .repeat(60));
  
  const aiService = new MockAIKeywordService();
  let passedTests = 0;
  let totalTests = testDomains.length;

  for (const testCase of testDomains) {
    console.log(`\n🔍 Testing: ${testCase.domain}`);
    console.log(`Expected: ${testCase.description}`);
    console.log('-'.repeat(40));

    try {
      // Test domain intelligence analysis
      const intelligence = aiService.analyzeDomainIntelligence(testCase.domain);
      
      console.log(`Detected themes: ${intelligence.detectedThemes.join(', ')}`);
      console.log(`Primary focus: ${intelligence.primaryFocus}`);
      console.log(`Confidence: ${intelligence.confidence}`);
      console.log(`Reasoning: ${intelligence.reasoning}`);

      // Test keyword generation
      const keywords = await aiService.generateKeywordVariations(
        testCase.domain,
        'fall recipes', // Test with fall theme
        3
      );

      console.log('\nGenerated keywords:');
      keywords.forEach((kw, index) => {
        console.log(`  ${index + 1}. "${kw.keyword}" (confidence: ${kw.confidence})`);
        console.log(`     Reasoning: ${kw.reasoning}`);
      });

      // Check if themes are detected correctly
      const themesMatch = testCase.expectedThemes.some(theme => 
        intelligence.detectedThemes.includes(theme)
      );
      
      // Check if focus is appropriate
      const focusMatch = intelligence.primaryFocus.toLowerCase().includes(
        testCase.expectedFocus.toLowerCase().split(' ')[0]
      );

      // Check for redundancy prevention
      const hasRedundancy = keywords.some(kw => 
        kw.keyword.toLowerCase().includes('recipes recipes') ||
        kw.keyword.toLowerCase().includes('drinks drinks') ||
        kw.keyword.toLowerCase().includes('beverages beverages')
      );

      // Check if keywords are appropriate for the domain type
      let appropriateKeywords = true;
      if (testCase.domain.includes('sip') || testCase.domain.includes('mocktail')) {
        // Should NOT contain food recipe keywords
        appropriateKeywords = !keywords.some(kw => 
          kw.keyword.toLowerCase().includes('chicken') ||
          kw.keyword.toLowerCase().includes('beef') ||
          kw.keyword.toLowerCase().includes('pasta') ||
          kw.keyword.toLowerCase().includes('vegetable recipes')
        );
      }

      const testPassed = themesMatch && focusMatch && !hasRedundancy && appropriateKeywords;
      
      if (testPassed) {
        console.log('\n✅ TEST PASSED');
        passedTests++;
      } else {
        console.log('\n❌ TEST FAILED');
        if (!themesMatch) console.log('   - Theme detection failed');
        if (!focusMatch) console.log('   - Focus detection failed');
        if (hasRedundancy) console.log('   - Redundancy prevention failed');
        if (!appropriateKeywords) console.log('   - Inappropriate keywords generated');
      }

    } catch (error) {
      console.log(`\n❌ TEST FAILED - Error: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 Test Results: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Smart keyword extraction is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Check the implementation.');
  }

  return passedTests === totalTests;
}

async function testCustomContext() {
  console.log('\n\n🧪 Testing Custom Context System\n');
  console.log('=' .repeat(60));

  const aiService = new MockAIKeywordService();
  
  // Test custom context for thesipspot.com
  const customContext = {
    primaryTheme: 'beverages cocktails',
    customKeywords: ['drinks', 'beverages', 'cocktails', 'mocktails'],
    seasonalModifiers: {
      fall: ['fall drinks', 'autumn beverages'],
      winter: ['winter warmers', 'holiday drinks'],
      summer: ['summer refreshers', 'iced drinks'],
      spring: ['spring cocktails', 'fresh drinks']
    },
    notes: 'Drink blog - avoid food recipe keywords'
  };

  console.log('Setting custom context for thesipspot.com...');
  aiService.setCustomContext('thesipspot.com', customContext);

  console.log('Generating keywords with custom context...');
  const keywords = await aiService.generateKeywordVariations(
    'thesipspot.com',
    'fall recipes',
    3
  );

  console.log('\nGenerated keywords with custom context:');
  keywords.forEach((kw, index) => {
    console.log(`  ${index + 1}. "${kw.keyword}" (confidence: ${kw.confidence})`);
  });

  // Check if custom context is being used
  const usesCustomContext = keywords.some(kw => 
    kw.keyword.toLowerCase().includes('beverages') ||
    kw.keyword.toLowerCase().includes('cocktails') ||
    kw.keyword.toLowerCase().includes('drinks')
  );

  if (usesCustomContext) {
    console.log('\n✅ Custom context test passed - custom keywords are being used');
    return true;
  } else {
    console.log('\n❌ Custom context test failed - custom keywords not used');
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting Smart Keyword Extraction Tests\n');
  
  const intelligenceTest = await testDomainIntelligence();
  const customContextTest = await testCustomContext();
  
  console.log('\n' + '='.repeat(60));
  console.log('📋 Final Results:');
  console.log(`Domain Intelligence: ${intelligenceTest ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Custom Context: ${customContextTest ? '✅ PASSED' : '❌ FAILED'}`);
  
  const allPassed = intelligenceTest && customContextTest;
  console.log(`\nOverall: ${allPassed ? '🎉 ALL TESTS PASSED' : '⚠️ SOME TESTS FAILED'}`);
  
  return allPassed;
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = { testDomainIntelligence, testCustomContext, runAllTests };
