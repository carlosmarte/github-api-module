/**
 * Pagination utilities for GitHub Issues API
 */

/**
 * Parse Link header to extract pagination URLs
 * @param {string} linkHeader - Link header from response
 * @returns {Object} Object with pagination URLs
 */
export function parseLinkHeader(linkHeader) {
  if (!linkHeader) return {};
  
  const links = {};
  const parts = linkHeader.split(',');
  
  for (const part of parts) {
    const match = part.match(/<([^>]+)>;\s*rel="([^"]+)"/);
    if (match) {
      links[match[2]] = match[1];
    }
  }
  
  return links;
}

/**
 * Extract page number from URL
 * @param {string} url - URL containing page parameter
 * @returns {number|null} Page number or null
 */
export function extractPageNumber(url) {
  if (!url) return null;
  const match = url.match(/[?&]page=(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Paginate through API results
 * @param {Function} fetchFunction - Function to fetch a page
 * @param {Object} options - Initial options
 * @param {number} [maxPages] - Maximum number of pages to fetch
 * @returns {AsyncGenerator} Async generator yielding items
 */
export async function* paginate(fetchFunction, options = {}, maxPages = Infinity) {
  let page = options.page || 1;
  let pagesRetrieved = 0;
  
  while (pagesRetrieved < maxPages) {
    const response = await fetchFunction({ ...options, page, per_page: options.per_page || 100 });
    
    if (!response || !Array.isArray(response.data)) {
      break;
    }
    
    for (const item of response.data) {
      yield item;
    }
    
    pagesRetrieved++;
    
    // Check if there's a next page
    if (!response.links?.next || response.data.length === 0) {
      break;
    }
    
    page++;
  }
}

/**
 * Collect all pages into a single array
 * @param {Function} fetchFunction - Function to fetch a page
 * @param {Object} options - Initial options
 * @param {number} [maxItems] - Maximum number of items to collect
 * @returns {Promise<Array>} All items from all pages
 */
export async function collectAllPages(fetchFunction, options = {}, maxItems = Infinity) {
  const items = [];
  let page = options.page || 1;
  
  while (items.length < maxItems) {
    const response = await fetchFunction({ ...options, page, per_page: Math.min(100, maxItems - items.length) });
    
    if (!response || !Array.isArray(response.data)) {
      break;
    }
    
    items.push(...response.data);
    
    // Check if there's a next page
    if (!response.links?.next || response.data.length === 0) {
      break;
    }
    
    page++;
  }
  
  return items.slice(0, maxItems);
}

/**
 * Create a paginated response object
 * @param {Array} data - Data for current page
 * @param {Object} headers - Response headers
 * @param {Object} options - Request options
 * @returns {Object} Paginated response
 */
export function createPaginatedResponse(data, headers, options = {}) {
  const links = parseLinkHeader(headers.link || headers.Link);
  const currentPage = options.page || 1;
  
  return {
    data,
    pagination: {
      page: currentPage,
      per_page: options.per_page || 30,
      total: headers['x-total-count'] ? parseInt(headers['x-total-count'], 10) : null,
      hasNext: !!links.next,
      hasPrev: !!links.prev,
      firstPage: extractPageNumber(links.first) || 1,
      lastPage: extractPageNumber(links.last),
      nextPage: extractPageNumber(links.next),
      prevPage: extractPageNumber(links.prev)
    },
    links,
    headers: {
      rateLimit: headers['x-ratelimit-limit'] ? parseInt(headers['x-ratelimit-limit'], 10) : null,
      rateLimitRemaining: headers['x-ratelimit-remaining'] ? parseInt(headers['x-ratelimit-remaining'], 10) : null,
      rateLimitReset: headers['x-ratelimit-reset'] ? parseInt(headers['x-ratelimit-reset'], 10) : null
    }
  };
}