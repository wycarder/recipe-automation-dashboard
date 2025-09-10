export interface Recipe {
  id: string;
  recipeName: string;
  websiteDomain: string;
  searchKeyword: string;
  imageUrl?: string;
  tiktokSelected: boolean;
  createdAt: Date;
}

export interface AutomationStatus {
  isRunning: boolean;
  totalRecipes: number;
  successCount: number;
  failureCount: number;
  startTime?: Date;
  endTime?: Date;
  currentWebsite?: string;
  progress?: number;
}

export interface WebsiteConfig {
  id: string;
  domain: string;
  name?: string;
  searchKeyword: string;
  recipesPerWeek: number;
  tiktokPerWeek: number;
  isActive: boolean;
  notionRelationId?: string;
  lastUsedKeyword?: string;
  keywordStrategy: 'rotation' | 'seasonal' | 'trending' | 'random';
  createdAt: Date;
  updatedAt: Date;
}

export interface WebsiteData {
  domain: string;
  keyword: string;
  quota: number;
  active: boolean;
}
