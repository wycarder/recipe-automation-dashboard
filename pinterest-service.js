const fetch = require('node-fetch');
const logger = require('../utils/logger');

class PinterestService {
  constructor() {
    this.accessToken = process.env.PINTEREST_ACCESS_TOKEN;
    this.baseUrl = 'https://api.pinterest.com/v5';
    this.headers = {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json'
    };
  }

  async searchPins(keyword, options = {}) {
    logger.info(`Searching Pinterest for keyword: ${keyword}`);
    
    try {
      const params = new URLSearchParams({
        query: keyword,
        limit: options.limit || 25,
        bookmark: options.bookmark || ''
      });

      if (options.sort) {
        params.append('sort', options.sort);
      }

      const response = await fetch(`${this.baseUrl}/pins?${params}`, {
        headers: this.headers
      });

      if (!response.ok) {
        throw new Error(`Pinterest API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      logger.info(`Found ${data.items?.length || 0} pins for keyword: ${keyword}`);
      
      return this.processPins(data.items || [], keyword);
      
    } catch (error) {
      logger.error(`Error searching Pinterest for ${keyword}:`, error.message);
      throw error;
    }
  }

  processPins(pins, keyword) {
    return pins.map(pin => ({
      title: pin.title || pin.description || 'Untitled Recipe',
      url: pin.link || pin.url,
      pinUrl: pin.pin_url,
      imageUrl: pin.media?.images?.['564x']?.url || pin.media?.images?.['736x']?.url,
      description: pin.description,
      engagement: {
        saves: pin.save_count || 0,
        comments: pin.comment_count || 0,
        clicks: pin.click_count || 0
      },
      metrics: {
        engagementRate: this.calculateEngagementRate(pin),
        popularityScore: this.calculatePopularityScore(pin)
      },
      keyword: keyword,
      createdAt: pin.created_at,
      boardName: pin.board_name,
      creator: pin.creator
    }));
  }

  calculateEngagementRate(pin) {
    const saves = pin.save_count || 0;
    const comments = pin.comment_count || 0;
    const clicks = pin.click_count || 0;
    const totalEngagement = saves + comments + (clicks * 0.1);
    return Math.round(totalEngagement);
  }

  calculatePopularityScore(pin) {
    const saves = pin.save_count || 0;
    const comments = pin.comment_count || 0;
    const clicks = pin.click_count || 0;
    const score = (saves * 3) + (comments * 2) + (clicks * 1);
    return Math.min(100, Math.round(score / 10));
  }

  async getTopPins(keyword, criteria = {}) {
    logger.info(`Getting top pins for ${keyword} with criteria:`, criteria);
    
    try {
      const searches = [
        { sort: 'popular', limit: 10 },
        { sort: 'relevance', limit: 10 },
        { sort: 'time', limit: 5 }
      ];

      const allPins = [];
      
      for (const search of searches) {
        try {
          const pins = await this.searchPins(keyword, search);
          allPins.push(...pins);
        } catch (error) {
          logger.warn(`Failed to search with sort ${search.sort}:`, error.message);
        }
      }

      const uniquePins = this.removeDuplicates(allPins, 'pinUrl');
      
      let filteredPins = uniquePins;

      if (criteria.minSaves) {
        filteredPins = filteredPins.filter(pin => pin.engagement.saves >= criteria.minSaves);
      }

      if (criteria.minClicks) {
        filteredPins = filteredPins.filter(pin => pin.engagement.clicks >= criteria.minClicks);
      }

      if (criteria.dateFrom) {
        const dateFrom = new Date(criteria.dateFrom);
        filteredPins = filteredPins.filter(pin => new Date(pin.createdAt) >= dateFrom);
      }

      filteredPins.sort((a, b) => b.metrics.popularityScore - a.metrics.popularityScore);

      const topPins = filteredPins.slice(0, criteria.limit || 20);

      logger.info(`Filtered to ${topPins.length} top pins for ${keyword}`);
      
      return topPins;
      
    } catch (error) {
      logger.error(`Error getting top pins for ${keyword}:`, error.message);
      throw error;
    }
  }

  removeDuplicates(pins, key) {
    const seen = new Set();
    return pins.filter(pin => {
      const value = pin[key];
      if (seen.has(value)) {
        return false;
      }
      seen.add(value);
      return true;
    });
  }

  async testConnection() {
    try {
      const response = await fetch(`${this.baseUrl}/user_account`, {
        headers: this.headers
      });

      if (!response.ok) {
        throw new Error(`API test failed: ${response.status}`);
      }

      const data = await response.json();
      logger.info('Pinterest API connection successful:', data.username);
      return true;
      
    } catch (error) {
      logger.error('Pinterest API connection failed:', error.message);
      return false;
    }
  }
}

module.exports = PinterestService;
