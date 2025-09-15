# AI-Powered Dynamic Keyword Search Feature

## Overview

This feature enhances the existing recipe automation system with AI-powered keyword generation that automatically creates contextually relevant keywords for every search. The system intelligently combines optional user themes with website-specific themes to generate diverse, targeted search terms behind the scenes.

## Features

### 1. Dynamic Keyword Generation
- **Contextual Intelligence**: Generates keywords based on each website's specific theme, dietary focus, and cooking methods
- **Multi-Variation Support**: Creates 3+ keyword variations per website with confidence scoring
- **Seasonal Awareness**: Automatically incorporates seasonal and holiday keywords for timely relevance

### 2. Optional Recipe Theme
- **Simple Input**: One optional text field for recipe themes (e.g., "thanksgiving", "summer BBQ", "healthy breakfast")
- **Automatic Integration**: When empty, AI generates general recipe keywords; when filled, AI uses the theme to guide generation
- **Seamless Experience**: Works with existing website selection and search workflow

### 3. Keyword Rotation System
- **Automatic Rotation**: Cycles through generated keywords to ensure variety in search results
- **Configurable Intervals**: Set rotation frequency (default: 24 hours)
- **History Tracking**: Maintains rotation history for analytics and optimization

### 4. Analytics & Performance Tracking
- **Keyword Performance**: Track which keywords generate the most results
- **Prompt Effectiveness**: Analyze which prompts work best for different websites
- **Search Success Rates**: Monitor overall automation success and failure rates
- **Time-based Analytics**: View performance over different time periods (7, 30, 90 days)

## Technical Implementation

### Core Components

#### 1. AI Keyword Service (`src/services/ai-keyword-service.ts`)
```typescript
class AIKeywordService {
  // Generate keyword variations for a website + prompt combination
  async generateKeywordVariations(websiteDomain: string, targetPrompt: string, count: number): Promise<KeywordVariation[]>
  
  // Get next keyword in rotation sequence
  getNextKeyword(websiteDomain: string, targetPrompt?: string): string
  
  // Record keyword usage for analytics
  recordKeywordUsage(websiteDomain: string, keywords: string[], targetPrompt?: string, resultsCount?: number): void
  
  // Get performance analytics
  getKeywordAnalytics(websiteDomain: string, days: number): AnalyticsData
}
```

#### 2. Enhanced Automation Service (`src/services/enhanced-automation-service.ts`)
```typescript
class EnhancedAutomationService {
  // Start automation with AI-powered keywords
  async startAutomation(config: AutomationConfig): Promise<AutomationResult[]>
  
  // Set up keyword rotation
  private setupKeywordRotation(domain: string, variations: KeywordVariation[], intervalHours: number): void
  
  // Get analytics for all websites
  getAllAnalytics(days: number): Map<string, any>
}
```

#### 3. AI Search Interface (`src/components/ai-search-interface.tsx`)
- Modern, intuitive UI for configuring AI-powered searches
- Real-time keyword generation and preview
- Website selection with visual feedback
- Search mode toggle (AI-powered vs Traditional)

#### 4. Analytics Dashboard (`src/components/analytics-dashboard.tsx`)
- Comprehensive performance metrics
- Keyword effectiveness tracking
- Prompt usage analysis
- Visual charts and progress indicators

### API Endpoints

#### Generate Keywords
```http
POST /api/automation/generate-keywords
Content-Type: application/json

{
  "targetPrompt": "thanksgiving",
  "websiteDomains": ["bluezonefeast.com", "ketoterraneantable.com"],
  "keywordsPerWebsite": 3
}
```

#### Enhanced Automation
```http
POST /api/automation/enhanced
Content-Type: application/json

{
  "targetPrompt": "summer BBQ",
  "searchMode": "ai-powered",
  "websites": [...],
  "enableRotation": true,
  "rotationInterval": 24
}
```

#### Analytics
```http
GET /api/automation/enhanced?action=analytics&domain=bluezonefeast.com&days=30
```

## Usage Examples

### Example 1: Thanksgiving Theme
**Input**: Target prompt "thanksgiving" for multiple websites

**Generated Keywords**:
- **Blue Zone Feast**: "thanksgiving longevity foods", "thanksgiving Mediterranean diet"
- **Keto-terranean Table**: "thanksgiving keto Mediterranean", "thanksgiving low-carb"
- **Quick Dinner Hub**: "quick thanksgiving recipes", "30-minute thanksgiving dishes"
- **Comfort Food Cozy**: "thanksgiving comfort food", "hearty thanksgiving meals"

### Example 2: Summer BBQ Theme
**Input**: Target prompt "summer BBQ" for grilling-focused websites

**Generated Keywords**:
- **Grill and Chill Kitchen**: "summer BBQ grilling recipes", "outdoor cooking summer BBQ"
- **Salad Savy**: "summer BBQ salad recipes", "fresh summer BBQ sides"
- **The Sip Spot**: "summer BBQ drink recipes", "refreshing summer BBQ beverages"

### Example 3: Healthy Breakfast Theme
**Input**: Target prompt "healthy breakfast" for wellness-focused sites

**Generated Keywords**:
- **Anti-Inflammatory Table**: "healthy breakfast anti-inflammatory", "healing breakfast foods"
- **Blue Zone Feast**: "healthy breakfast longevity", "Mediterranean breakfast recipes"
- **Protein Prep Hub**: "healthy breakfast protein prep", "high-protein breakfast recipes"

## Website Theme Mapping

The system includes intelligent theme mapping for 40+ recipe websites:

| Website | Primary Theme | Secondary Themes | Dietary Focus |
|---------|---------------|------------------|---------------|
| bluezonefeast.com | longevity foods | Mediterranean diet, plant-based | longevity |
| ketoterraneantable.com | keto Mediterranean | low-carb, healthy fats | keto |
| quickdinnerhub.com | quick dinner recipes | 30-minute meals, weeknight dinners | quick cooking |
| comfortfoodcozy.com | comfort food | hearty meals, family favorites | comfort |
| grillandchillkitchen.com | grilling recipes | outdoor cooking, BBQ | grilling |

## Configuration Options

### Search Modes
- **AI-Powered**: Uses generated keywords with rotation
- **Traditional**: Uses static keywords from website configuration

### Rotation Settings
- **Enable/Disable**: Toggle automatic keyword rotation
- **Interval**: Set rotation frequency (hours)
- **Per-Website Control**: Enable/disable rotation per website

### Analytics Settings
- **Time Range**: 7, 30, or 90 days
- **Website Filter**: View analytics for specific websites
- **Keyword Filtering**: Focus on high-performing keywords

## Benefits

### 1. Increased Search Variety
- Prevents repetitive searches with the same keywords
- Ensures fresh content discovery across all websites
- Reduces search result overlap between automation runs

### 2. Contextual Relevance
- Keywords are tailored to each website's specific focus
- Maintains brand consistency while adding variety
- Improves search result quality and relevance

### 3. Performance Optimization
- Analytics help identify the most effective keywords
- Data-driven decisions for keyword selection
- Continuous improvement through performance tracking

### 4. User Experience
- Intuitive interface for non-technical users
- Real-time keyword preview and validation
- Clear analytics and performance feedback

## Future Enhancements

### Planned Features
1. **Machine Learning Integration**: Learn from search results to improve keyword generation
2. **Trend Analysis**: Incorporate trending topics and seasonal patterns
3. **A/B Testing**: Compare different keyword strategies
4. **Custom Themes**: Allow users to define custom website themes
5. **API Integration**: Connect with external trend analysis services

### Technical Improvements
1. **Caching**: Implement keyword caching for better performance
2. **Batch Processing**: Optimize for large-scale keyword generation
3. **Real-time Updates**: Live keyword rotation without service restart
4. **Export/Import**: Save and share keyword configurations

## Getting Started

1. **Access the Feature**: Navigate to the "AI-Powered Search" tab in the dashboard
2. **Enter Target Prompt**: Type your desired theme or prompt
3. **Select Websites**: Choose which websites to generate keywords for
4. **Generate Keywords**: Click "Generate AI Keywords" to see variations
5. **Start Search**: Use the generated keywords for automation
6. **Monitor Analytics**: Check the Analytics tab for performance insights

## Support

For technical support or feature requests, please refer to the main project documentation or contact the development team.
