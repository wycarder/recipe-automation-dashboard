interface WebsiteTheme {
  domain: string;
  name: string;
  primaryTheme: string;
  secondaryThemes: string[];
  cuisineType?: string;
  dietaryFocus?: string;
  cookingMethod?: string;
  targetAudience?: string;
}

interface CustomContext {
  primaryTheme: string;
  customKeywords: string[];
  seasonalModifiers: {
    fall: string[];
    winter: string[];
    summer: string[];
    spring: string[];
  };
  notes: string;
}

interface DomainIntelligence {
  detectedThemes: string[];
  primaryFocus: string;
  confidence: number;
  reasoning: string;
}

interface KeywordVariation {
  keyword: string;
  confidence: number;
  reasoning: string;
  category: 'primary' | 'secondary' | 'seasonal' | 'trending';
}

interface KeywordRotationHistory {
  website: string;
  keywords: string[];
  timestamp: Date;
  prompt?: string;
  resultsCount?: number;
}

class AIKeywordService {
  private websiteThemes: Map<string, WebsiteTheme> = new Map();
  private keywordHistory: KeywordRotationHistory[] = [];
  private rotationIndex: Map<string, number> = new Map();
  private recentKeywords: Map<string, string[]> = new Map(); // Track recent keywords per website
  private categoryRotationIndex: Map<string, number> = new Map(); // Track category rotation
  private customContexts: Map<string, CustomContext> = new Map(); // Store custom contexts

  constructor() {
    this.initializeWebsiteThemes();
    this.loadCustomContexts();
  }

  // Recipe categories for variety when no theme is provided
  private recipeCategories = [
    'chicken recipes', 'beef recipes', 'pork recipes', 'fish recipes', 'seafood recipes',
    'vegetable recipes', 'pasta recipes', 'rice recipes', 'soup recipes', 'salad recipes',
    'dessert recipes', 'breakfast recipes', 'lunch recipes', 'dinner recipes', 'snack recipes',
    'appetizer recipes', 'side dish recipes', 'main course recipes', 'healthy recipes',
    'quick recipes', 'easy recipes', 'one-pot recipes', 'sheet pan recipes', 'slow cooker recipes',
    'grilled recipes', 'baked recipes', 'fried recipes', 'steamed recipes', 'roasted recipes'
  ];

  // Cooking styles and techniques for variety
  private cookingStyles = [
    'quick and easy', 'healthy', 'comfort food', 'gourmet', 'family-friendly',
    'one-pot', 'meal prep', 'batch cooking', 'make-ahead', 'freezer-friendly',
    'low-carb', 'high-protein', 'vegetarian', 'vegan', 'gluten-free',
    'dairy-free', 'keto-friendly', 'paleo-friendly', 'mediterranean-style'
  ];

  // Domain intelligence pattern recognition
  private themePatterns = {
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
    slowCooker: ['slowcooker', 'slow-cooker', 'crockpot'],
    // Candy and sweets patterns
    candy: ['candy', 'sweet', 'sweets', 'treats', 'crunch', 'cloud'],
    desserts: ['dessert', 'desserts', 'sugar', 'sweet', 'cake', 'cookie', 'chocolate'],
    // Enhanced patterns for compound domain analysis
    gardenThemes: ['balcony', 'harvest', 'garden', 'farm', 'homegrown', 'organic', 'fresh', 'grow'],
    seasonalThemes: ['harvest', 'seasonal', 'fresh', 'spring', 'summer', 'fall', 'autumn', 'winter'],
    locationThemes: ['balcony', 'backyard', 'patio', 'indoor', 'outdoor', 'home', 'kitchen'],
    kitchenStyles: ['kitchen', 'cook', 'chef', 'homemade', 'scratch', 'cooking', 'recipes'],
    qualityThemes: ['premium', 'artisan', 'gourmet', 'handcrafted', 'authentic', 'traditional'],
    sizeThemes: ['mini', 'small', 'bite', 'bites', 'hq', 'hub', 'spot', 'corner']
  };

  /**
   * Build enhanced keywords by combining detected themes intelligently
   */
  private buildEnhancedKeyword(targetPrompt: string, theme: WebsiteTheme, intelligence: DomainIntelligence | null): string {
    const prompt = targetPrompt.toLowerCase().trim();
    
    // If we have intelligence data, use it to build more specific keywords
    if (intelligence && intelligence.detectedThemes.length > 0) {
      const detectedThemes = intelligence.detectedThemes;
      
      // Special combinations for compound themes - preserve domain context with themes
      if (detectedThemes.includes('gardenThemes') && detectedThemes.includes('seasonalThemes')) {
        return `harvest recipes`;
      }
      if (detectedThemes.includes('gardenThemes') && detectedThemes.includes('kitchenStyles')) {
        return `garden kitchen recipes`;
      }
      if (detectedThemes.includes('locationThemes') && detectedThemes.includes('gardenThemes')) {
        return `home garden recipes`;
      }
      if (detectedThemes.includes('frozen') && detectedThemes.includes('mealPrep')) {
        return `frozen meals`;
      }
      if (detectedThemes.includes('onePot') && detectedThemes.includes('mealPrep')) {
        return `one pot meals`;
      }
      if (detectedThemes.includes('sheetPan') && detectedThemes.includes('mealTypes')) {
        return `sheet pan meals`;
      }
      
      // Handle garden themes specifically - preserve garden/harvest context
      if (detectedThemes.includes('gardenThemes')) {
        // For garden sites, always include garden/harvest context
        if (detectedThemes.includes('seasonalThemes')) {
          return prompt === 'recipes' || prompt === '' ? `harvest recipes` : `${prompt} harvest recipes`;
        } else {
          return prompt === 'recipes' || prompt === '' ? `garden recipes` : `${prompt} garden recipes`;
        }
      }
      
      // Handle candy themes specifically - preserve candy context
      if (detectedThemes.includes('candy')) {
        return prompt === 'recipes' || prompt === '' ? `candy recipes` : `${prompt} candy recipes`;
      }
      
      // Handle brunch themes specifically - preserve brunch context
      if (detectedThemes.includes('mealTypes') && intelligence.primaryFocus.includes('brunch')) {
        return prompt === 'recipes' || prompt === '' ? `brunch recipes` : `${prompt} brunch recipes`;
      }
      
      // Handle beverage themes specifically - preserve drink context
      if (detectedThemes.includes('beverages')) {
        return prompt === 'recipes' || prompt === '' ? `drinks` : `${prompt} drinks`;
      }
      
      // Use the most relevant detected theme
      const mostRelevantTheme = this.getMostRelevantTheme(detectedThemes);
      if (mostRelevantTheme) {
        return prompt === 'recipes' || prompt === '' ? `${mostRelevantTheme} recipes` : `${prompt} ${mostRelevantTheme} recipes`;
      }
    }
    
    // Fallback to standard combination - avoid duplication
    if (prompt === 'recipes' || prompt === '') {
      return theme.primaryTheme;
    }
    return `${prompt} ${theme.primaryTheme}`;
  }

  /**
   * Get the most relevant theme from detected themes
   */
  private getMostRelevantTheme(detectedThemes: string[]): string | null {
    const priorityOrder = [
      'gardenThemes', 'seasonalThemes', 'candy', 'desserts', 'beverages', 'mealTypes',
      'frozen', 'mealPrep', 'onePot', 'sheetPan', 'cookingMethods',
      'dietary', 'comfort', 'budget', 'quick', 'kitchenStyles'
    ];
    
    for (const priority of priorityOrder) {
      if (detectedThemes.includes(priority)) {
        switch (priority) {
          case 'gardenThemes': return 'harvest';
          case 'seasonalThemes': return 'seasonal';
          case 'candy': return 'candy';
          case 'desserts': return 'dessert';
          case 'beverages': return 'drinks';
          case 'mealTypes': return 'brunch';
          case 'frozen': return 'frozen meals';
          case 'mealPrep': return 'meals';
          case 'onePot': return 'one pot';
          case 'sheetPan': return 'sheet pan';
          case 'cookingMethods': return 'cooking';
          case 'dietary': return 'diet';
          case 'comfort': return 'comfort food';
          case 'budget': return 'budget-friendly';
          case 'quick': return 'quick';
          case 'kitchenStyles': return 'kitchen';
          default: return priority;
        }
      }
    }
    
    return null;
  }

  /**
   * Split compound domain names into meaningful words
   */
  private splitCompoundDomain(domainLower: string): string[] {
    // Common word boundaries and patterns
    const commonWords = [
      'kitchen', 'cook', 'cooking', 'recipes', 'food', 'meals', 'dinner', 'lunch', 'breakfast',
      'harvest', 'garden', 'farm', 'fresh', 'organic', 'homegrown', 'seasonal',
      'balcony', 'backyard', 'patio', 'indoor', 'outdoor', 'home',
      'comfort', 'cozy', 'hearty', 'warm', 'comforting',
      'budget', 'cheap', 'affordable', 'frugal', 'economical',
      'quick', 'fast', 'easy', 'simple', 'rapid', 'speedy', 'instant',
      'frozen', 'freeze', 'freezer', 'meal', 'mealhq', 'mealprep', 'prep',
      'airfryer', 'air-fryer', 'grill', 'bake', 'fry', 'roast', 'slowcook',
      'onepot', 'one-pot', 'sheetpan', 'sheet-pan', 'skillet', 'pan',
      'keto', 'paleo', 'vegan', 'protein', 'healthy', 'sugar-free',
      'dessert', 'desserts', 'sugar', 'sweet', 'cake', 'cookie', 'chocolate',
      'candy', 'sweets', 'treats', 'crunch', 'cloud',
      'beverages', 'drinks', 'cocktails', 'mocktails', 'juice', 'brew',
      'hq', 'hub', 'spot', 'corner', 'authority', 'master', 'expert'
    ];
    
    const words: string[] = [];
    let remaining = domainLower;
    
    // Try to find common words first
    for (const word of commonWords) {
      if (remaining.includes(word)) {
        words.push(word);
        remaining = remaining.replace(word, '');
      }
    }
    
    // Split remaining characters into potential words
    const remainingWords = remaining.split(/(?=[A-Z])|(?<=[a-z])(?=[A-Z])|[-_]/)
      .filter(w => w.length > 2)
      .map(w => w.toLowerCase());
    
    words.push(...remainingWords);
    
    return [...new Set(words)]; // Remove duplicates
  }

  /**
   * Analyze domain name to detect themes and focus areas
   */
  private analyzeDomainIntelligence(domain: string): DomainIntelligence {
    const domainLower = domain.toLowerCase().replace(/\.(com|org|net|co|io)$/, '');
    const domainParts = domainLower.split(/[-_]/);
    const detectedThemes: string[] = [];
    let primaryFocus = 'recipes';
    let confidence = 0.5;
    let reasoning = 'Generic recipe site';

    console.log(`\n🔍 Analyzing domain: ${domain}`);
    console.log(`Domain parts: ${domainParts.join(', ')}`);
    
    // Enhanced word splitting for compound domains
    const splitWords = this.splitCompoundDomain(domainLower);
    console.log(`Split words: [${splitWords.map(w => `"${w}"`).join(', ')}]`);

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
            case 'candy':
              primaryFocus = 'candy recipes';
              confidence = 0.95;
              reasoning = `Domain contains "${pattern}" - detected as candy site`;
              break;
            case 'desserts':
              primaryFocus = 'dessert recipes';
              confidence = 0.9;
              reasoning = `Domain contains "${pattern}" - detected as dessert site`;
              break;
            case 'gardenThemes':
              primaryFocus = 'garden recipes';
              confidence = 0.9;
              reasoning = `Domain contains "${pattern}" - detected as garden/harvest site`;
              break;
            case 'seasonalThemes':
              primaryFocus = 'seasonal recipes';
              confidence = 0.85;
              reasoning = `Domain contains "${pattern}" - detected as seasonal cooking site`;
              break;
            case 'locationThemes':
              primaryFocus = 'home cooking';
              confidence = 0.8;
              reasoning = `Domain contains "${pattern}" - detected as home cooking site`;
              break;
            case 'kitchenStyles':
              primaryFocus = 'kitchen recipes';
              confidence = 0.8;
              reasoning = `Domain contains "${pattern}" - detected as kitchen-focused site`;
              break;
            case 'qualityThemes':
              primaryFocus = 'gourmet recipes';
              confidence = 0.85;
              reasoning = `Domain contains "${pattern}" - detected as premium cooking site`;
              break;
            case 'sizeThemes':
              primaryFocus = 'bite-sized recipes';
              confidence = 0.8;
              reasoning = `Domain contains "${pattern}" - detected as small portion site`;
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
    } else if (detectedThemes.includes('gardenThemes') && detectedThemes.includes('seasonalThemes')) {
      primaryFocus = 'harvest recipes';
      confidence = 0.95;
      reasoning = 'Domain contains both garden and seasonal themes - detected as harvest cooking site';
    } else if (detectedThemes.includes('gardenThemes') && detectedThemes.includes('kitchenStyles')) {
      primaryFocus = 'garden kitchen recipes';
      confidence = 0.95;
      reasoning = 'Domain contains both garden and kitchen themes - detected as garden kitchen site';
    } else if (detectedThemes.includes('locationThemes') && detectedThemes.includes('gardenThemes')) {
      primaryFocus = 'home garden recipes';
      confidence = 0.9;
      reasoning = 'Domain contains both location and garden themes - detected as home garden site';
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
    } else if (detectedThemes.includes('gardenThemes')) {
      primaryFocus = 'garden recipes';
      confidence = 0.9;
      reasoning = 'Domain contains garden themes - detected as garden cooking site';
    } else if (detectedThemes.includes('seasonalThemes')) {
      primaryFocus = 'seasonal recipes';
      confidence = 0.85;
      reasoning = 'Domain contains seasonal themes - detected as seasonal cooking site';
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
    } else if (domainLower.includes('candy') || domainLower.includes('crunch') || domainLower.includes('cloud')) {
      primaryFocus = 'candy recipes';
      confidence = 0.95;
      reasoning = 'Domain contains candy-related terms - detected as candy site';
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

  private createFallbackTheme(domain: string): WebsiteTheme {
    // Use domain intelligence analysis
    const intelligence = this.analyzeDomainIntelligence(domain);
    
    return {
      domain,
      name: domain,
      primaryTheme: intelligence.primaryFocus,
      secondaryThemes: intelligence.detectedThemes,
      targetAudience: 'recipe enthusiasts'
    };
  }

  private initializeWebsiteThemes() {
    // Define themes for each website based on their current keywords and domain names
    const themes: WebsiteTheme[] = [
      {
        domain: "airfryerauthority.com",
        name: "Air Fryer Authority",
        primaryTheme: "air fryer cooking",
        secondaryThemes: ["healthy cooking", "quick meals", "crispy foods"],
        cookingMethod: "air frying",
        targetAudience: "health-conscious home cooks"
      },
      {
        domain: "antiinflammatorytable.com",
        name: "Anti-Inflammatory Table",
        primaryTheme: "anti-inflammatory foods",
        secondaryThemes: ["healing foods", "wellness", "chronic pain relief"],
        dietaryFocus: "anti-inflammatory",
        targetAudience: "people with inflammation issues"
      },
      {
        domain: "bluezonefeast.com",
        name: "Blue Zone Feast",
        primaryTheme: "longevity foods",
        secondaryThemes: ["Mediterranean diet", "plant-based", "healthy aging"],
        dietaryFocus: "longevity",
        targetAudience: "longevity-focused individuals"
      },
      {
        domain: "ketoterraneantable.com",
        name: "Keto-terranean Table",
        primaryTheme: "keto Mediterranean",
        secondaryThemes: ["low-carb", "Mediterranean flavors", "healthy fats"],
        dietaryFocus: "keto",
        cuisineType: "Mediterranean"
      },
      {
        domain: "oliveketokitchen.com",
        name: "Olive Keto Kitchen",
        primaryTheme: "keto recipes",
        secondaryThemes: ["low-carb", "high-fat", "ketogenic"],
        dietaryFocus: "keto",
        targetAudience: "keto dieters"
      },
      {
        domain: "primalfeastkitchen.com",
        name: "Primal Feast Kitchen",
        primaryTheme: "paleo recipes",
        secondaryThemes: ["ancestral eating", "whole foods", "grain-free"],
        dietaryFocus: "paleo",
        targetAudience: "paleo followers"
      },
      {
        domain: "budgertbiteshq.com",
        name: "Budget Bites HQ",
        primaryTheme: "budget-friendly meals",
        secondaryThemes: ["affordable cooking", "meal planning", "frugal living"],
        targetAudience: "budget-conscious families"
      },
      {
        domain: "quickdinnerhub.com",
        name: "Quick Dinner Hub",
        primaryTheme: "quick dinner recipes",
        secondaryThemes: ["30-minute meals", "weeknight dinners", "time-saving"],
        cookingMethod: "quick cooking",
        targetAudience: "busy families"
      },
      {
        domain: "comfortfoodcozy.com",
        name: "Comfort Food Cozy",
        primaryTheme: "comfort food",
        secondaryThemes: ["hearty meals", "family favorites", "cozy cooking"],
        targetAudience: "comfort food lovers"
      },
      {
        domain: "grillandchillkitchen.com",
        name: "Grill and Chill Kitchen",
        primaryTheme: "grilling recipes",
        secondaryThemes: ["outdoor cooking", "BBQ", "summer foods"],
        cookingMethod: "grilling",
        targetAudience: "grilling enthusiasts"
      },
      {
        domain: "soupandstewhq.com",
        name: "Soup and Stew HQ",
        primaryTheme: "soup and stew recipes",
        secondaryThemes: ["one-pot meals", "hearty soups", "comfort food"],
        cookingMethod: "simmering",
        targetAudience: "soup lovers"
      },
      {
        domain: "saladsavy.com",
        name: "Salad Savy",
        primaryTheme: "salad recipes",
        secondaryThemes: ["healthy eating", "fresh ingredients", "light meals"],
        dietaryFocus: "healthy",
        targetAudience: "health-conscious eaters"
      },
      {
        domain: "doughwhisperer.com",
        name: "Dough Whisperer",
        primaryTheme: "bread and baking",
        secondaryThemes: ["artisan bread", "homemade baking", "yeast recipes"],
        cookingMethod: "baking",
        targetAudience: "baking enthusiasts"
      },
      {
        domain: "sugarrushkitchen.com",
        name: "Sugar Rush Kitchen",
        primaryTheme: "dessert recipes",
        secondaryThemes: ["sweet treats", "baking", "indulgent desserts"],
        cookingMethod: "baking",
        targetAudience: "dessert lovers"
      },
      {
        domain: "thesipspot.com",
        name: "The Sip Spot",
        primaryTheme: "drink recipes",
        secondaryThemes: ["beverages", "cocktails", "mocktails"],
        targetAudience: "drink enthusiasts"
      },
      {
        domain: "crunchcloudcandy.com",
        name: "Crunch Cloud Candy",
        primaryTheme: "candy recipes",
        secondaryThemes: ["sweet treats", "homemade candy", "desserts"],
        targetAudience: "candy lovers"
      },
      {
        domain: "balconyharvestkitchen.com",
        name: "Balcony Harvest Kitchen",
        primaryTheme: "garden recipes",
        secondaryThemes: ["harvest cooking", "fresh vegetable recipes", "homegrown meals"],
        targetAudience: "garden enthusiasts"
      }
    ];

    themes.forEach(theme => {
      this.websiteThemes.set(theme.domain, theme);
    });
  }

  /**
   * Load custom contexts from localStorage
   */
  private loadCustomContexts(): void {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('recipe-automation-custom-contexts');
        if (stored) {
          const contexts = JSON.parse(stored);
          this.customContexts = new Map(Object.entries(contexts));
        }
      } catch (error) {
        console.error('Failed to load custom contexts:', error);
      }
    }
  }

  /**
   * Save custom contexts to localStorage
   */
  private saveCustomContexts(): void {
    if (typeof window !== 'undefined') {
      try {
        const contexts = Object.fromEntries(this.customContexts);
        localStorage.setItem('recipe-automation-custom-contexts', JSON.stringify(contexts));
      } catch (error) {
        console.error('Failed to save custom contexts:', error);
      }
    }
  }

  /**
   * Add or update custom context for a domain
   */
  setCustomContext(domain: string, context: CustomContext): void {
    this.customContexts.set(domain, context);
    this.saveCustomContexts();
  }

  /**
   * Get custom context for a domain
   */
  getCustomContext(domain: string): CustomContext | null {
    return this.customContexts.get(domain) || null;
  }

  /**
   * Remove custom context for a domain
   */
  removeCustomContext(domain: string): void {
    this.customContexts.delete(domain);
    this.saveCustomContexts();
  }

  /**
   * Generate AI-powered keyword variations for a website based on a target prompt
   * Now with smart domain intelligence and custom context support
   */
  async generateKeywordVariations(
    websiteDomain: string, 
    targetPrompt: string, 
    count: number = 3
  ): Promise<KeywordVariation[]> {
    // Debug logging
    console.log(`\n🔍 Domain Intelligence Analysis:`);
    console.log(`Domain: ${websiteDomain}`);
    console.log(`Target Prompt: "${targetPrompt}"`);
    
    // CRITICAL CHECK: Ensure candy sites never get meat keywords
    if (websiteDomain.includes('candy') || websiteDomain.includes('crunch') || websiteDomain.includes('cloud')) {
      console.log(`🚨 CANDY SITE DETECTED: ${websiteDomain} - Ensuring candy-appropriate keywords only`);
    }
    
    // Check for custom context first
    const customContext = this.getCustomContext(websiteDomain);
    let theme = this.websiteThemes.get(websiteDomain);
    let intelligence: DomainIntelligence | null = null;
    
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
      
      // If no theme found, create a fallback theme based on domain intelligence
      if (!theme) {
        theme = this.createFallbackTheme(websiteDomain);
      }
    }

    // Get recent keywords for this website to avoid repetition
    const recentKeywords = this.recentKeywords.get(websiteDomain) || [];
    
    // Generate variations with rotation and variety
    const variations: KeywordVariation[] = [];

    // If no specific theme provided (targetPrompt is "recipes"), use category rotation
    if (targetPrompt.toLowerCase().trim() === 'recipes' || targetPrompt.toLowerCase().trim() === '') {
      const rotatedVariations = this.generateRotatedVariations(websiteDomain, theme, count, recentKeywords);
      variations.push(...rotatedVariations);
    } else {
      // For specific themes, still add some variety
      const themedVariations = this.generateThemedVariations(targetPrompt, theme, count, recentKeywords, intelligence || null);
      variations.push(...themedVariations);
    }

    // Apply redundancy prevention
    const cleanedVariations = this.preventRedundancy(variations);

    // CRITICAL SAFETY CHECK: Prevent candy sites from getting meat keywords
    const domainLower = websiteDomain.toLowerCase();
    if (domainLower.includes('candy') || domainLower.includes('sweet') || domainLower.includes('crunch')) {
      const meatKeywords = ['pork', 'beef', 'chicken', 'meat', 'protein'];
      const hasMeatKeywords = cleanedVariations.some(v => 
        meatKeywords.some(meat => v.keyword.toLowerCase().includes(meat))
      );
      
      if (hasMeatKeywords) {
        console.error(`🚨 CRITICAL MISMATCH: Candy site ${websiteDomain} getting meat keywords!`);
        console.error(`Generated keywords: ${cleanedVariations.map(v => v.keyword).join(', ')}`);
        
        // Replace with appropriate candy keywords
        cleanedVariations.length = 0;
        cleanedVariations.push({
          keyword: `${targetPrompt} candy recipes`,
          confidence: 0.95,
          reasoning: 'Candy site - generated appropriate candy keywords instead of meat',
          category: 'primary'
        });
        cleanedVariations.push({
          keyword: `${targetPrompt} sweet treats`,
          confidence: 0.9,
          reasoning: 'Candy site - generated sweet treat keywords',
          category: 'primary'
        });
        cleanedVariations.push({
          keyword: `${targetPrompt} homemade candy`,
          confidence: 0.85,
          reasoning: 'Candy site - generated homemade candy keywords',
          category: 'primary'
        });
      }
    }

    // Record the generated keywords to avoid repetition in future calls
    const generatedKeywords = cleanedVariations.map(v => v.keyword);
    this.updateRecentKeywords(websiteDomain, generatedKeywords);

    // Debug output
    console.log(`Generated keywords: ${generatedKeywords.join(', ')}`);

    // Sort by confidence and return requested count
    return cleanedVariations
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, count);
  }

  /**
   * Generate rotated variations for general recipe searches (no specific theme)
   */
  private generateRotatedVariations(
    websiteDomain: string, 
    theme: WebsiteTheme, 
    count: number, 
    recentKeywords: string[]
  ): KeywordVariation[] {
    const variations: KeywordVariation[] = [];
    const currentIndex = this.categoryRotationIndex.get(websiteDomain) || 0;
    
    // Get domain-appropriate categories based on the website's theme
    const domainAppropriateCategories = this.getDomainAppropriateCategories(websiteDomain, theme);
    
    // Get categories that haven't been used recently
    const availableCategories = domainAppropriateCategories.filter(category => 
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
      // Create variations combining category with website theme
      const variations_for_category = this.createCategoryVariations(category, theme);
      variations.push(...variations_for_category.slice(0, 1)); // Take one per category
    });
    
    // Update rotation index
    this.categoryRotationIndex.set(websiteDomain, (currentIndex + selectedCategories.length) % domainAppropriateCategories.length);
    
    return variations.slice(0, count);
  }

  /**
   * Generate themed variations for specific recipe themes
   */
  private generateThemedVariations(
    targetPrompt: string, 
    theme: WebsiteTheme, 
    count: number, 
    recentKeywords: string[],
    intelligence?: DomainIntelligence | null
  ): KeywordVariation[] {
    const variations: KeywordVariation[] = [];
    const prompt = targetPrompt.toLowerCase().trim();

    // Generate enhanced primary variations that combine target prompt with website theme
    const enhancedKeyword = this.buildEnhancedKeyword(targetPrompt, theme, intelligence || null);
    variations.push({
      keyword: enhancedKeyword,
      confidence: 0.95,
      reasoning: `Enhanced keyword combining "${targetPrompt}" with detected themes: ${intelligence?.detectedThemes.join(', ') || 'none'}`,
      category: 'primary'
    });
    
    // Add additional primary variations
    const primaryVariations = this.generatePrimaryVariations(targetPrompt, theme);
    variations.push(...primaryVariations.slice(0, Math.ceil(count * 0.4)));

    // Generate secondary variations with different approaches
    const secondaryVariations = this.generateSecondaryVariations(targetPrompt, theme);
    variations.push(...secondaryVariations.slice(0, Math.ceil(count * 0.3)));

    // Generate seasonal/trending variations
    const seasonalVariations = this.generateSeasonalVariations(targetPrompt, theme);
    variations.push(...seasonalVariations.slice(0, Math.ceil(count * 0.1)));

    // Filter out recently used keywords
    const filteredVariations = variations.filter(v => 
      !recentKeywords.some(recent => 
        recent.toLowerCase().includes(v.keyword.toLowerCase()) ||
        v.keyword.toLowerCase().includes(recent.toLowerCase())
      )
    );

    return filteredVariations.length > 0 ? filteredVariations : variations;
  }

  /**
   * Get domain-appropriate categories based on the website's theme and domain
   */
  private getDomainAppropriateCategories(websiteDomain: string, theme: WebsiteTheme): string[] {
    const domainLower = websiteDomain.toLowerCase();
    
    // Candy/sweet sites - only sweet categories
    if (domainLower.includes('candy') || domainLower.includes('sweet') || domainLower.includes('crunch') || domainLower.includes('cloud')) {
      return [
        'dessert recipes', 'sweet treats', 'homemade candy', 'chocolate recipes',
        'baking recipes', 'sugar recipes', 'candy recipes', 'treat recipes'
      ];
    }
    
    // Garden/harvest sites - only plant-based categories
    if (domainLower.includes('garden') || domainLower.includes('harvest') || domainLower.includes('balcony') || domainLower.includes('farm')) {
      return [
        'vegetable recipes', 'garden recipes', 'harvest recipes', 'fresh produce recipes',
        'plant-based recipes', 'organic recipes', 'homegrown recipes', 'seasonal recipes'
      ];
    }
    
    // Beverage sites - only drink categories
    if (domainLower.includes('sip') || domainLower.includes('drink') || domainLower.includes('beverage') || domainLower.includes('mocktail')) {
      return [
        'drink recipes', 'beverage recipes', 'cocktail recipes', 'mocktail recipes',
        'juice recipes', 'smoothie recipes', 'tea recipes', 'coffee recipes'
      ];
    }
    
    // Air fryer sites - only air fryer appropriate categories
    if (domainLower.includes('airfryer') || domainLower.includes('air-fryer')) {
      return [
        'air fryer recipes', 'crispy recipes', 'healthy fried recipes', 'quick air fryer meals',
        'air fryer chicken', 'air fryer vegetables', 'air fryer snacks', 'air fryer desserts'
      ];
    }
    
    // Keto sites - only keto appropriate categories
    if (domainLower.includes('keto')) {
      return [
        'keto recipes', 'low-carb recipes', 'keto meals', 'keto snacks',
        'keto desserts', 'keto breakfast', 'keto dinner', 'keto lunch'
      ];
    }
    
    // Vegetarian sites - only vegetarian categories
    if (domainLower.includes('veg') || domainLower.includes('vegetarian') || domainLower.includes('plant')) {
      return [
        'vegetarian recipes', 'plant-based recipes', 'veggie recipes', 'meatless recipes',
        'vegetable recipes', 'vegan recipes', 'plant protein recipes', 'green recipes'
      ];
    }
    
    // Budget sites - only budget appropriate categories
    if (domainLower.includes('budget') || domainLower.includes('cheap') || domainLower.includes('affordable')) {
      return [
        'budget recipes', 'cheap meals', 'affordable recipes', 'frugal recipes',
        'budget-friendly recipes', 'economical recipes', 'low-cost recipes', 'value recipes'
      ];
    }
    
    // Quick cooking sites - only quick appropriate categories
    if (domainLower.includes('quick') || domainLower.includes('fast') || domainLower.includes('easy')) {
      return [
        'quick recipes', 'fast meals', 'easy recipes', '30-minute recipes',
        'quick dinner', 'fast lunch', 'easy breakfast', 'speedy recipes'
      ];
    }
    
    // Brunch sites - only brunch appropriate categories
    if (domainLower.includes('brunch') || domainLower.includes('bright')) {
      return [
        'brunch recipes', 'breakfast recipes', 'morning recipes', 'brunch ideas',
        'breakfast casseroles', 'pancake recipes', 'waffle recipes', 'egg recipes',
        'brunch cocktails', 'morning smoothies', 'breakfast pastries', 'brunch sides'
      ];
    }
    
    // Comfort food sites - only comfort appropriate categories
    if (domainLower.includes('comfort') || domainLower.includes('cozy') || domainLower.includes('hearty')) {
      return [
        'comfort food', 'hearty recipes', 'cozy recipes', 'comforting meals',
        'warm recipes', 'soul food', 'comforting dishes', 'homey recipes'
      ];
    }
    
    // Default to general categories if no specific pattern matches
    return this.recipeCategories;
  }

  /**
   * Select categories for rotation based on current index and available categories
   */
  private selectCategoriesForRotation(availableCategories: string[], count: number, currentIndex: number): string[] {
    const selected: string[] = [];
    let index = currentIndex % availableCategories.length;
    
    for (let i = 0; i < Math.min(count, availableCategories.length); i++) {
      selected.push(availableCategories[index]);
      index = (index + 1) % availableCategories.length;
    }
    
    return selected;
  }

  /**
   * Create variations for a specific recipe category
   */
  private createCategoryVariations(category: string, theme: WebsiteTheme): KeywordVariation[] {
    const variations: KeywordVariation[] = [];
    
    // For normal runs (no theme), just use the category as-is to avoid duplication
    // The category should already be domain-appropriate
    variations.push({
      keyword: category,
      confidence: 0.95,
      reasoning: `Domain-appropriate category "${category}" for normal recipe search`,
      category: 'primary'
    });

    // Add variations with secondary themes only if they don't create duplication
    theme.secondaryThemes.slice(0, 2).forEach(secondaryTheme => {
      // Only add if it doesn't duplicate the category
      if (!category.toLowerCase().includes(secondaryTheme.toLowerCase()) && 
          !secondaryTheme.toLowerCase().includes(category.toLowerCase())) {
        variations.push({
          keyword: `${category} ${secondaryTheme}`,
          confidence: 0.85,
          reasoning: `Combines recipe category with secondary theme "${secondaryTheme}"`,
          category: 'primary'
        });
      }
    });

    // With cooking method only if it adds value
    if (theme.cookingMethod && !category.toLowerCase().includes(theme.cookingMethod.toLowerCase())) {
      variations.push({
        keyword: `${theme.cookingMethod} ${category}`,
        confidence: 0.88,
        reasoning: `Uses cooking method "${theme.cookingMethod}" with recipe category`,
        category: 'primary'
      });
    }

    return variations;
  }

  /**
   * Prevent redundancy in keywords (e.g., "recipes recipes")
   */
  private preventRedundancy(variations: KeywordVariation[]): KeywordVariation[] {
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

  /**
   * Update recent keywords for a website to track usage
   */
  private updateRecentKeywords(websiteDomain: string, newKeywords: string[]): void {
    const current = this.recentKeywords.get(websiteDomain) || [];
    const updated = [...current, ...newKeywords];
    
    // Keep only the last 10 keywords to prevent memory bloat
    this.recentKeywords.set(websiteDomain, updated.slice(-10));
  }

  private generatePrimaryVariations(targetPrompt: string, theme: WebsiteTheme): KeywordVariation[] {
    const variations: KeywordVariation[] = [];
    const prompt = targetPrompt.toLowerCase().trim();

    // Direct combination with primary theme
    variations.push({
      keyword: `${prompt} ${theme.primaryTheme}`,
      confidence: 0.95,
      reasoning: `Combines target prompt "${targetPrompt}" with website's primary theme "${theme.primaryTheme}"`,
      category: 'primary'
    });

    // With secondary themes
    theme.secondaryThemes.forEach(secondaryTheme => {
      variations.push({
        keyword: `${prompt} ${secondaryTheme}`,
        confidence: 0.85,
        reasoning: `Combines target prompt with secondary theme "${secondaryTheme}"`,
        category: 'primary'
      });
    });

    // With dietary focus
    if (theme.dietaryFocus) {
      variations.push({
        keyword: `${prompt} ${theme.dietaryFocus}`,
        confidence: 0.90,
        reasoning: `Combines target prompt with dietary focus "${theme.dietaryFocus}"`,
        category: 'primary'
      });
    }

    // With cooking method
    if (theme.cookingMethod) {
      variations.push({
        keyword: `${theme.cookingMethod} ${prompt}`,
        confidence: 0.88,
        reasoning: `Uses cooking method "${theme.cookingMethod}" with target prompt`,
        category: 'primary'
      });
    }

    return variations;
  }

  private generateSecondaryVariations(targetPrompt: string, theme: WebsiteTheme): KeywordVariation[] {
    const variations: KeywordVariation[] = [];
    const prompt = targetPrompt.toLowerCase().trim();

    // Add descriptive adjectives
    const adjectives = ['easy', 'quick', 'healthy', 'delicious', 'best', 'simple', 'amazing'];
    adjectives.forEach(adj => {
      variations.push({
        keyword: `${adj} ${prompt} ${theme.primaryTheme}`,
        confidence: 0.75,
        reasoning: `Adds descriptive adjective "${adj}" to enhance search appeal`,
        category: 'secondary'
      });
    });

    // Add meal types
    const mealTypes = ['recipes', 'ideas', 'dishes', 'meals', 'food'];
    mealTypes.forEach(mealType => {
      variations.push({
        keyword: `${prompt} ${mealType} ${theme.primaryTheme}`,
        confidence: 0.80,
        reasoning: `Specifies meal type "${mealType}" for better targeting`,
        category: 'secondary'
      });
    });

    // Add preparation styles
    const prepStyles = ['homemade', 'quick', 'easy', 'healthy', 'traditional'];
    prepStyles.forEach(style => {
      variations.push({
        keyword: `${style} ${prompt} ${theme.primaryTheme}`,
        confidence: 0.70,
        reasoning: `Adds preparation style "${style}" for variety`,
        category: 'secondary'
      });
    });

    return variations;
  }

  private generateSeasonalVariations(targetPrompt: string, theme: WebsiteTheme): KeywordVariation[] {
    const variations: KeywordVariation[] = [];
    const prompt = targetPrompt.toLowerCase().trim();
    const currentMonth = new Date().getMonth();

    // Seasonal keywords
    const seasonalKeywords = this.getSeasonalKeywords(currentMonth);
    
    seasonalKeywords.forEach(seasonal => {
      variations.push({
        keyword: `${seasonal} ${prompt} ${theme.primaryTheme}`,
        confidence: 0.65,
        reasoning: `Adds seasonal context "${seasonal}" for timely relevance`,
        category: 'seasonal'
      });
    });

    // Holiday variations
    const holidayKeywords = this.getHolidayKeywords();
    holidayKeywords.forEach(holiday => {
      if (prompt.toLowerCase().includes(holiday.toLowerCase()) || 
          holiday.toLowerCase().includes(prompt.toLowerCase())) {
        variations.push({
          keyword: `${holiday} ${theme.primaryTheme}`,
          confidence: 0.85,
          reasoning: `Matches holiday theme "${holiday}" with website focus`,
          category: 'seasonal'
        });
      }
    });

    return variations;
  }

  private getSeasonalKeywords(month: number): string[] {
    const seasons = {
      winter: ['winter', 'cozy', 'warming', 'comforting'],
      spring: ['spring', 'fresh', 'light', 'renewing'],
      summer: ['summer', 'refreshing', 'cool', 'bright'],
      fall: ['fall', 'autumn', 'harvest', 'warming']
    };

    if (month >= 11 || month <= 1) return seasons.winter;
    if (month >= 2 && month <= 4) return seasons.spring;
    if (month >= 5 && month <= 7) return seasons.summer;
    return seasons.fall;
  }

  private getHolidayKeywords(): string[] {
    const currentDate = new Date();
    const month = currentDate.getMonth() + 1;
    const day = currentDate.getDate();

    // Major holidays
    if (month === 12) return ['christmas', 'holiday', 'festive'];
    if (month === 11 && day >= 20) return ['thanksgiving', 'thanksgiving dinner'];
    if (month === 10) return ['halloween', 'spooky'];
    if (month === 2) return ['valentine', 'valentines day'];
    if (month === 7) return ['4th of july', 'independence day'];
    if (month === 3 && day >= 15) return ['easter', 'spring celebration'];

    return [];
  }

  /**
   * Get the next keyword in rotation for a website
   */
  getNextKeyword(websiteDomain: string, targetPrompt?: string): string {
    const historyKey = `${websiteDomain}_${targetPrompt || 'default'}`;
    const currentIndex = this.rotationIndex.get(historyKey) || 0;
    
    // Get recent keyword history for this website/prompt combination
    const recentHistory = this.keywordHistory
      .filter(h => h.website === websiteDomain && (h.prompt === targetPrompt || (!h.prompt && !targetPrompt)))
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);

    if (recentHistory.length === 0) {
      // No history, return a default keyword
      const theme = this.websiteThemes.get(websiteDomain);
      return theme ? `${targetPrompt || 'recipes'} ${theme.primaryTheme}` : 'recipes';
    }

    // Get the most recent set of keywords
    const latestKeywords = recentHistory[0].keywords;
    const nextIndex = currentIndex % latestKeywords.length;
    
    // Update rotation index
    this.rotationIndex.set(historyKey, currentIndex + 1);
    
    return latestKeywords[nextIndex];
  }

  /**
   * Record keyword usage for analytics and rotation
   */
  recordKeywordUsage(
    websiteDomain: string, 
    keywords: string[], 
    targetPrompt?: string, 
    resultsCount?: number
  ): void {
    this.keywordHistory.push({
      website: websiteDomain,
      keywords,
      timestamp: new Date(),
      prompt: targetPrompt,
      resultsCount
    });

    // Keep only last 100 entries per website to prevent memory bloat
    this.keywordHistory = this.keywordHistory
      .filter(h => h.website === websiteDomain)
      .slice(-100);
  }

  /**
   * Get analytics for keyword performance
   */
  getKeywordAnalytics(websiteDomain: string, days: number = 30): {
    totalSearches: number;
    averageResults: number;
    topKeywords: { keyword: string; count: number; avgResults: number }[];
    promptBreakdown: { prompt: string; count: number }[];
  } {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const recentHistory = this.keywordHistory
      .filter(h => h.website === websiteDomain && h.timestamp >= cutoffDate);

    const totalSearches = recentHistory.length;
    const averageResults = recentHistory.reduce((sum, h) => sum + (h.resultsCount || 0), 0) / totalSearches || 0;

    // Count keyword usage
    const keywordCounts = new Map<string, { count: number; totalResults: number }>();
    recentHistory.forEach(h => {
      h.keywords.forEach(keyword => {
        const existing = keywordCounts.get(keyword) || { count: 0, totalResults: 0 };
        keywordCounts.set(keyword, {
          count: existing.count + 1,
          totalResults: existing.totalResults + (h.resultsCount || 0)
        });
      });
    });

    const topKeywords = Array.from(keywordCounts.entries())
      .map(([keyword, data]) => ({
        keyword,
        count: data.count,
        avgResults: data.totalResults / data.count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Count prompt usage
    const promptCounts = new Map<string, number>();
    recentHistory.forEach(h => {
      if (h.prompt) {
        promptCounts.set(h.prompt, (promptCounts.get(h.prompt) || 0) + 1);
      }
    });

    const promptBreakdown = Array.from(promptCounts.entries())
      .map(([prompt, count]) => ({ prompt, count }))
      .sort((a, b) => b.count - a.count);

    return {
      totalSearches,
      averageResults,
      topKeywords,
      promptBreakdown
    };
  }

  /**
   * Generate keywords for multiple websites with a target prompt
   * Now with true rotation to ensure variety across multiple calls
   */
  async generateMultiWebsiteKeywords(
    websiteDomains: string[], 
    targetPrompt: string, 
    keywordsPerWebsite: number = 3
  ): Promise<Map<string, KeywordVariation[]>> {
    const results = new Map<string, KeywordVariation[]>();

    for (const domain of websiteDomains) {
      try {
        const variations = await this.generateKeywordVariations(domain, targetPrompt, keywordsPerWebsite);
        results.set(domain, variations);
        
        // Record keyword usage for analytics
        this.recordKeywordUsage(domain, variations.map(v => v.keyword), targetPrompt);
      } catch (error) {
        console.error(`Failed to generate keywords for ${domain}:`, error);
        // Fallback to basic keyword with some variety
        const theme = this.websiteThemes.get(domain);
        let fallbackKeyword = theme ? `${targetPrompt} ${theme.primaryTheme}` : targetPrompt;
        
        // Add some variety even to fallback keywords - but respect domain identity
        if (targetPrompt.toLowerCase().trim() === 'recipes' || targetPrompt.toLowerCase().trim() === '') {
          // Use domain-appropriate categories instead of random ones
          if (theme) {
            const domainAppropriateCategories = this.getDomainAppropriateCategories(domain, theme);
            const randomCategory = domainAppropriateCategories[Math.floor(Math.random() * domainAppropriateCategories.length)];
            fallbackKeyword = `${randomCategory} ${theme.primaryTheme}`;
          } else {
            // If no theme, just use the target prompt
            fallbackKeyword = targetPrompt;
          }
        }
        
        results.set(domain, [{
          keyword: fallbackKeyword,
          confidence: 0.5,
          reasoning: 'Fallback keyword due to generation error',
          category: 'primary'
        }]);
      }
    }

    return results;
  }
}

export default AIKeywordService;
export type { KeywordVariation, KeywordRotationHistory, WebsiteTheme, CustomContext, DomainIntelligence };
