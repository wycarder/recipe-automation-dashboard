/**
 * URL Converter Utility
 * Converts pinimg.com URLs to proper Pinterest URLs for n8n automation compatibility
 */

class URLConverter {
  /**
   * Converts a pinimg.com URL to a Pinterest pin URL
   * @param {string} imageUrl - The pinimg.com URL
   * @param {string} pinUrl - The Pinterest pin URL (if available)
   * @returns {string} - The appropriate URL to use
   */
  static convertImageUrl(imageUrl, pinUrl = null) {
    // If we have a Pinterest pin URL, use that instead
    if (pinUrl && pinUrl.includes('pinterest.com/pin/')) {
      return pinUrl;
    }

    // If it's a pinimg.com URL, we can't convert it without the pin ID
    // So we'll return the original imageUrl as fallback
    if (imageUrl && imageUrl.includes('pinimg.com')) {
      console.warn('Cannot convert pinimg.com URL to Pinterest URL without pin ID:', imageUrl);
      return imageUrl;
    }

    // Return the imageUrl if it's not a pinimg.com URL
    return imageUrl;
  }

  /**
   * Determines the best URL to use for Notion "Model Image URL" field
   * @param {Object} recipe - The recipe object
   * @returns {string} - The URL to use for the Model Image URL
   */
  static getModelImageUrl(recipe) {
    // Priority order:
    // 1. Pinterest pin URL (if available)
    // 2. Regular URL (if it's not pinimg.com)
    // 3. Image URL (as fallback)

    if (recipe.pinUrl && recipe.pinUrl.includes('pinterest.com/pin/')) {
      return recipe.pinUrl;
    }

    if (recipe.url && !recipe.url.includes('pinimg.com')) {
      return recipe.url;
    }

    if (recipe.imageUrl && !recipe.imageUrl.includes('pinimg.com')) {
      return recipe.imageUrl;
    }

    // Last resort - return whatever we have
    return recipe.pinUrl || recipe.url || recipe.imageUrl || null;
  }

  /**
   * Checks if a URL is a Pinterest pin URL
   * @param {string} url - The URL to check
   * @returns {boolean} - True if it's a Pinterest pin URL
   */
  static isPinterestPinUrl(url) {
    return url && url.includes('pinterest.com/pin/');
  }

  /**
   * Checks if a URL is a pinimg.com URL
   * @param {string} url - The URL to check
   * @returns {boolean} - True if it's a pinimg.com URL
   */
  static isPinimgUrl(url) {
    return url && url.includes('pinimg.com');
  }
}

module.exports = URLConverter;
