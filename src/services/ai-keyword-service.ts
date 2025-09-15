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

  constructor() {
    this.initializeWebsiteThemes();
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

  private createFallbackTheme(domain: string): WebsiteTheme {
    // Extract potential theme from domain name
    const domainParts = domain.replace('.com', '').split(/[-_]/);
    const lastPart = domainParts[domainParts.length - 1];
    
    // Try to infer theme from domain name
    let primaryTheme = 'recipes';
    let secondaryThemes = ['cooking', 'food'];
    
    if (lastPart.includes('keto')) {
      primaryTheme = 'keto recipes';
      secondaryThemes = ['low-carb', 'ketogenic'];
    } else if (lastPart.includes('paleo')) {
      primaryTheme = 'paleo recipes';
      secondaryThemes = ['ancestral', 'whole foods'];
    } else if (lastPart.includes('vegan')) {
      primaryTheme = 'vegan recipes';
      secondaryThemes = ['plant-based', 'dairy-free'];
    } else if (lastPart.includes('healthy')) {
      primaryTheme = 'healthy recipes';
      secondaryThemes = ['nutritious', 'wellness'];
    } else if (lastPart.includes('quick')) {
      primaryTheme = 'quick recipes';
      secondaryThemes = ['fast', 'easy'];
    } else if (lastPart.includes('comfort')) {
      primaryTheme = 'comfort food';
      secondaryThemes = ['hearty', 'cozy'];
    }
    
    return {
      domain,
      name: domain,
      primaryTheme,
      secondaryThemes,
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
      }
    ];

    themes.forEach(theme => {
      this.websiteThemes.set(theme.domain, theme);
    });
  }

  /**
   * Generate AI-powered keyword variations for a website based on a target prompt
   * Now with true rotation and variety to avoid repeated keywords
   */
  async generateKeywordVariations(
    websiteDomain: string, 
    targetPrompt: string, 
    count: number = 3
  ): Promise<KeywordVariation[]> {
    let theme = this.websiteThemes.get(websiteDomain);
    
    // If no theme found, create a fallback theme based on domain name
    if (!theme) {
      theme = this.createFallbackTheme(websiteDomain);
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
      const themedVariations = this.generateThemedVariations(targetPrompt, theme, count, recentKeywords);
      variations.push(...themedVariations);
    }

    // Record the generated keywords to avoid repetition in future calls
    const generatedKeywords = variations.map(v => v.keyword);
    this.updateRecentKeywords(websiteDomain, generatedKeywords);

    // Sort by confidence and return requested count
    return variations
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
      // Create variations combining category with website theme
      const variations_for_category = this.createCategoryVariations(category, theme);
      variations.push(...variations_for_category.slice(0, 1)); // Take one per category
    });
    
    // Update rotation index
    this.categoryRotationIndex.set(websiteDomain, (currentIndex + selectedCategories.length) % this.recipeCategories.length);
    
    return variations.slice(0, count);
  }

  /**
   * Generate themed variations for specific recipe themes
   */
  private generateThemedVariations(
    targetPrompt: string, 
    theme: WebsiteTheme, 
    count: number, 
    recentKeywords: string[]
  ): KeywordVariation[] {
    const variations: KeywordVariation[] = [];
    const prompt = targetPrompt.toLowerCase().trim();

    // Generate primary variations that combine target prompt with website theme
    const primaryVariations = this.generatePrimaryVariations(targetPrompt, theme);
    variations.push(...primaryVariations.slice(0, Math.ceil(count * 0.6)));

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
    
    // Direct combination with primary theme
    variations.push({
      keyword: `${category} ${theme.primaryTheme}`,
      confidence: 0.95,
      reasoning: `Combines recipe category "${category}" with website's primary theme "${theme.primaryTheme}"`,
      category: 'primary'
    });

    // With secondary themes
    theme.secondaryThemes.forEach(secondaryTheme => {
      variations.push({
        keyword: `${category} ${secondaryTheme}`,
        confidence: 0.85,
        reasoning: `Combines recipe category with secondary theme "${secondaryTheme}"`,
        category: 'primary'
      });
    });

    // With cooking method
    if (theme.cookingMethod) {
      variations.push({
        keyword: `${theme.cookingMethod} ${category}`,
        confidence: 0.88,
        reasoning: `Uses cooking method "${theme.cookingMethod}" with recipe category`,
        category: 'primary'
      });
    }

    // Add some cooking styles for variety
    const randomStyles = this.cookingStyles
      .sort(() => Math.random() - 0.5)
      .slice(0, 2);
    
    randomStyles.forEach(style => {
      variations.push({
        keyword: `${style} ${category} ${theme.primaryTheme}`,
        confidence: 0.75,
        reasoning: `Adds cooking style "${style}" for variety`,
        category: 'secondary'
      });
    });

    return variations;
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
        
        // Add some variety even to fallback keywords
        if (targetPrompt.toLowerCase().trim() === 'recipes' || targetPrompt.toLowerCase().trim() === '') {
          const randomCategory = this.recipeCategories[Math.floor(Math.random() * this.recipeCategories.length)];
          fallbackKeyword = theme ? `${randomCategory} ${theme.primaryTheme}` : randomCategory;
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
export type { KeywordVariation, KeywordRotationHistory, WebsiteTheme };
