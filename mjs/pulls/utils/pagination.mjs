/**
 * Pagination utilities for GitHub API
 */

/**
 * Parse Link header for pagination
 * @param {string} linkHeader - Link header value
 * @returns {Object} Pagination links
 */
export function parseLinkHeader(linkHeader) {
  if (!linkHeader) {
    return {};
  }
  
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
 * @param {string} url - URL with page parameter
 * @returns {number|null} Page number
 */
export function extractPageNumber(url) {
  if (!url) return null;
  
  try {
    const urlObj = new URL(url);
    const page = urlObj.searchParams.get('page');
    return page ? parseInt(page, 10) : null;
  } catch {
    return null;
  }
}

/**
 * Get pagination info from response headers
 * @param {Response} response - Fetch response
 * @returns {Object} Pagination information
 */
export function getPaginationInfo(response) {
  const linkHeader = response.headers.get('link');
  const links = parseLinkHeader(linkHeader);
  
  return {
    first: extractPageNumber(links.first),
    prev: extractPageNumber(links.prev),
    next: extractPageNumber(links.next),
    last: extractPageNumber(links.last),
    hasNext: !!links.next,
    hasPrev: !!links.prev
  };
}

/**
 * Paginate through all results
 * @param {Function} fetcher - Function that fetches a page
 * @param {Object} [options] - Pagination options
 * @param {number} [options.maxPages] - Maximum pages to fetch
 * @param {number} [options.perPage=30] - Items per page
 * @returns {AsyncGenerator} Async generator of items
 */
export async function* paginate(fetcher, options = {}) {
  const maxPages = options.maxPages || Infinity;
  const perPage = options.perPage || 30;
  let page = 1;
  
  while (page <= maxPages) {
    const results = await fetcher(page);
    
    if (!results || !Array.isArray(results) || results.length === 0) {
      break;
    }
    
    for (const item of results) {
      yield item;
    }
    
    // Stop pagination if we get fewer results than expected
    // This typically indicates we've reached the last page
    if (results.length < perPage) {
      break;
    }
    
    page++;
  }
}

/**
 * Collect all pages into a single array
 * @param {Function} fetcher - Function that fetches a page
 * @param {Object} [options] - Pagination options
 * @returns {Promise<Array>} All results
 */
export async function collectAllPages(fetcher, options = {}) {
  const results = [];
  
  for await (const item of paginate(fetcher, options)) {
    results.push(item);
  }
  
  return results;
}

/**
 * Create a paginated fetcher with rate limit handling
 * @param {Function} apiCall - API call function
 * @param {Object} [options] - Options
 * @returns {Function} Paginated fetcher
 */
export function createPaginatedFetcher(apiCall, options = {}) {
  return async function fetchPage(page) {
    const params = {
      ...options,
      page,
      per_page: options.perPage || 30
    };
    
    try {
      return await apiCall(params);
    } catch (error) {
      // If rate limited, wait and retry
      if (error.name === 'RateLimitError' && options.waitForRateLimit) {
        const waitTime = error.getTimeUntilReset();
        if (waitTime > 0) {
          console.log(`Rate limited. Waiting ${waitTime} seconds...`);
          await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
          return fetchPage(page);
        }
      }
      throw error;
    }
  };
}

/**
 * Paginate with cursor-based pagination
 * @param {Function} fetcher - Function that fetches with cursor
 * @param {Object} [options] - Options
 * @returns {AsyncGenerator} Async generator of items
 */
export async function* paginateWithCursor(fetcher, options = {}) {
  let cursor = options.cursor || null;
  const maxPages = options.maxPages || Infinity;
  let pageCount = 0;
  
  while (pageCount < maxPages) {
    const response = await fetcher(cursor);
    
    if (!response || !response.items || response.items.length === 0) {
      break;
    }
    
    for (const item of response.items) {
      yield item;
    }
    
    cursor = response.nextCursor || response.endCursor;
    if (!cursor) {
      break;
    }
    
    pageCount++;
  }
}

/**
 * Calculate total pages
 * @param {number} totalItems - Total number of items
 * @param {number} perPage - Items per page
 * @returns {number} Total pages
 */
export function calculateTotalPages(totalItems, perPage) {
  return Math.ceil(totalItems / perPage);
}

/**
 * Build pagination query parameters
 * @param {Object} options - Pagination options
 * @returns {URLSearchParams} Query parameters
 */
export function buildPaginationParams(options = {}) {
  const params = new URLSearchParams();
  
  if (options.page) {
    params.append('page', options.page);
  }
  
  if (options.perPage || options.per_page) {
    params.append('per_page', options.perPage || options.per_page);
  }
  
  if (options.sort) {
    params.append('sort', options.sort);
  }
  
  if (options.direction || options.order) {
    params.append('direction', options.direction || options.order);
  }
  
  return params;
}

export default {
  parseLinkHeader,
  extractPageNumber,
  getPaginationInfo,
  paginate,
  collectAllPages,
  createPaginatedFetcher,
  paginateWithCursor,
  calculateTotalPages,
  buildPaginationParams
};