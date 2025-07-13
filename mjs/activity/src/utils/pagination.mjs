/**
 * Pagination utilities
 * @module utils/pagination
 */

/**
 * Parse GitHub Link header for pagination
 * @param {string} linkHeader - Link header value
 * @returns {Object} Parsed links object
 */
export function parseLinkHeader(linkHeader) {
  if (!linkHeader) {
    return null;
  }

  const links = {};
  const parts = linkHeader.split(',');

  for (const part of parts) {
    const match = part.match(/<([^>]+)>;\s*rel="([^"]+)"/);
    if (match) {
      const [, url, rel] = match;
      links[rel] = url;
      
      // Extract page number from URL
      const pageMatch = url.match(/[?&]page=(\d+)/);
      if (pageMatch) {
        links[`${rel}_page`] = parseInt(pageMatch[1]);
      }
    }
  }

  return links;
}

/**
 * Build pagination query parameters
 * @param {Object} options - Pagination options
 * @param {number} [options.page] - Page number (1-based)
 * @param {number} [options.per_page] - Items per page (max 100)
 * @param {string} [options.sort] - Sort field
 * @param {string} [options.direction] - Sort direction (asc/desc)
 * @param {string} [options.since] - Only items updated after this time
 * @param {string} [options.before] - Only items updated before this time
 * @returns {Object} Query parameters
 */
export function buildPaginationParams(options = {}) {
  const params = {};
  
  if (options.page !== undefined) {
    params.page = Math.max(1, options.page);
  }
  
  if (options.per_page !== undefined) {
    params.per_page = Math.min(100, Math.max(1, options.per_page));
  }
  
  if (options.sort) {
    params.sort = options.sort;
  }
  
  if (options.direction) {
    params.direction = options.direction;
  }
  
  if (options.since) {
    params.since = options.since;
  }
  
  if (options.before) {
    params.before = options.before;
  }
  
  return params;
}

/**
 * Paginator class for iterating through pages
 */
export class Paginator {
  /**
   * @param {Function} fetchFunction - Function to fetch a page
   * @param {Object} options - Pagination options
   */
  constructor(fetchFunction, options = {}) {
    this.fetchFunction = fetchFunction;
    this.options = options;
    this.currentPage = options.page || 1;
    this.perPage = options.per_page || 30;
    this.hasMore = true;
    this.items = [];
    this.totalFetched = 0;
  }

  /**
   * Fetch next page
   * @returns {Promise<Object>} Page result
   */
  async fetchNextPage() {
    if (!this.hasMore) {
      return { items: [], hasMore: false };
    }

    const params = {
      ...this.options,
      page: this.currentPage,
      per_page: this.perPage
    };

    const response = await this.fetchFunction(params);
    
    this.items = response.data;
    this.totalFetched += this.items.length;
    
    // Check if there are more pages
    if (response.pagination) {
      this.hasMore = !!response.pagination.next;
      if (response.pagination.next_page) {
        this.currentPage = response.pagination.next_page;
      } else {
        this.currentPage++;
      }
    } else {
      // No pagination info, check if we got a full page
      this.hasMore = this.items.length === this.perPage;
      this.currentPage++;
    }

    return {
      items: this.items,
      hasMore: this.hasMore,
      page: this.currentPage - 1,
      totalFetched: this.totalFetched,
      rateLimit: response.rateLimit
    };
  }

  /**
   * Async iterator implementation
   * @returns {AsyncIterator}
   */
  async *[Symbol.asyncIterator]() {
    while (this.hasMore) {
      const result = await this.fetchNextPage();
      
      for (const item of result.items) {
        yield item;
      }

      if (!result.hasMore) {
        break;
      }
    }
  }

  /**
   * Fetch all items
   * @param {number} [maxItems] - Maximum items to fetch
   * @returns {Promise<Array>} All items
   */
  async fetchAll(maxItems = Infinity) {
    const allItems = [];
    
    for await (const item of this) {
      allItems.push(item);
      
      if (allItems.length >= maxItems) {
        break;
      }
    }
    
    return allItems;
  }

  /**
   * Reset paginator to first page
   */
  reset() {
    this.currentPage = this.options.page || 1;
    this.hasMore = true;
    this.items = [];
    this.totalFetched = 0;
  }
}

/**
 * Create a paginated response object
 * @param {Array} items - Items for current page
 * @param {Object} pagination - Pagination metadata
 * @returns {Object} Paginated response
 */
export function createPaginatedResponse(items, pagination) {
  return {
    items,
    pagination: {
      page: pagination.page || 1,
      per_page: pagination.per_page || items.length,
      total: pagination.total || null,
      has_next: pagination.has_next || false,
      has_previous: pagination.has_previous || false,
      first_page: pagination.first_page || 1,
      last_page: pagination.last_page || null,
      next_page: pagination.next_page || null,
      previous_page: pagination.previous_page || null
    }
  };
}