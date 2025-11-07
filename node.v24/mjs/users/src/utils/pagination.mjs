/**
 * @fileoverview Pagination utilities for GitHub Users API
 * @module pagination
 */

import { validatePagination } from './validation.mjs';
import { UsersError } from './errors.mjs';

/**
 * Extract pagination info from response
 * @param {Object} response - HTTP response with Link header
 * @returns {Object} Pagination information
 */
export function extractPaginationInfo(response) {
  const linkHeader = response.headers?.get('link');
  const totalCountHeader = response.headers?.get('x-total-count');
  
  const info = {
    hasNext: false,
    hasPrev: false,
    nextUrl: null,
    prevUrl: null,
    firstUrl: null,
    lastUrl: null,
    totalCount: totalCountHeader ? parseInt(totalCountHeader) : null
  };

  if (!linkHeader) {
    return info;
  }

  // Parse Link header
  const links = parseLinkHeader(linkHeader);
  
  if (links.next) {
    info.hasNext = true;
    info.nextUrl = links.next;
  }
  
  if (links.prev) {
    info.hasPrev = true;
    info.prevUrl = links.prev;
  }
  
  if (links.first) {
    info.firstUrl = links.first;
  }
  
  if (links.last) {
    info.lastUrl = links.last;
  }

  return info;
}

/**
 * Parse Link header into object
 * @param {string} linkHeader - Link header value
 * @returns {Object} Parsed links
 */
export function parseLinkHeader(linkHeader) {
  const links = {};
  
  if (!linkHeader) {
    return links;
  }

  // Split by commas and parse each link
  const parts = linkHeader.split(',');
  
  for (const part of parts) {
    const match = part.match(/<([^>]+)>;\s*rel="([^"]+)"/);
    if (match) {
      const [, url, rel] = match;
      links[rel] = url.trim();
    }
  }
  
  return links;
}

/**
 * Create pagination iterator
 * @param {Function} apiCall - Function to make API calls
 * @param {Object} [options] - Pagination options
 * @returns {AsyncIterator} Pagination iterator
 */
export function paginate(apiCall, options = {}) {
  const validatedOptions = validatePagination(options);
  
  return {
    async *[Symbol.asyncIterator]() {
      let currentPage = validatedOptions.page || 1;
      let hasMore = true;
      
      while (hasMore) {
        const response = await apiCall({
          ...validatedOptions,
          page: currentPage
        });
        
        // Yield the data
        if (Array.isArray(response)) {
          yield* response;
        } else {
          yield response;
        }
        
        // Check if there's more data
        const pagination = response._pagination;
        hasMore = pagination && pagination.next;
        
        if (hasMore) {
          currentPage++;
        }
      }
    }
  };
}

/**
 * Collect all pages into a single array
 * @param {Function} apiCall - Function to make API calls
 * @param {Object} [options] - Pagination options
 * @returns {Promise<Array>} All results
 */
export async function paginateAll(apiCall, options = {}) {
  const results = [];
  const validatedOptions = validatePagination(options);
  
  let currentPage = validatedOptions.page || 1;
  let hasMore = true;
  let requestCount = 0;
  const maxRequests = options.maxRequests || 100; // Safety limit
  
  while (hasMore && requestCount < maxRequests) {
    const response = await apiCall({
      ...validatedOptions,
      page: currentPage
    });
    
    // Add results
    if (Array.isArray(response)) {
      results.push(...response);
    } else if (response && Array.isArray(response.data)) {
      results.push(...response.data);
    } else {
      results.push(response);
    }
    
    // Check pagination
    const pagination = response._pagination;
    hasMore = pagination && pagination.next;
    
    if (hasMore) {
      currentPage++;
      requestCount++;
    }
  }
  
  if (requestCount >= maxRequests) {
    console.warn(`Reached maximum request limit (${maxRequests}). Some results may be missing.`);
  }
  
  return results;
}

/**
 * Get page info from URL
 * @param {string} url - URL with pagination parameters
 * @returns {Object} Page information
 */
export function getPageInfo(url) {
  if (!url) {
    return {};
  }
  
  try {
    const urlObj = new URL(url);
    const params = urlObj.searchParams;
    
    return {
      page: params.get('page') ? parseInt(params.get('page')) : null,
      per_page: params.get('per_page') ? parseInt(params.get('per_page')) : null,
      since: params.get('since') ? parseInt(params.get('since')) : null
    };
  } catch (error) {
    return {};
  }
}

/**
 * Build pagination parameters for API request
 * @param {Object} options - Pagination options
 * @returns {Object} URL parameters
 */
export function buildPaginationParams(options = {}) {
  const params = {};
  
  if (options.page) {
    params.page = options.page;
  }
  
  if (options.per_page) {
    params.per_page = options.per_page;
  }
  
  if (options.since) {
    params.since = options.since;
  }
  
  return params;
}

/**
 * Create a paginated response wrapper
 * @param {Array|Object} data - Response data
 * @param {Object} pagination - Pagination info
 * @returns {Object} Paginated response
 */
export function createPaginatedResponse(data, pagination = {}) {
  return {
    data: Array.isArray(data) ? data : [data],
    pagination: {
      hasNext: pagination.hasNext || false,
      hasPrev: pagination.hasPrev || false,
      nextUrl: pagination.nextUrl || null,
      prevUrl: pagination.prevUrl || null,
      firstUrl: pagination.firstUrl || null,
      lastUrl: pagination.lastUrl || null,
      totalCount: pagination.totalCount || null
    }
  };
}

/**
 * Auto-paginate helper that yields individual items
 * @param {Function} apiCall - Function to make API calls
 * @param {Object} [options] - Options
 * @returns {AsyncIterator} Iterator that yields individual items
 */
export async function* autoPaginate(apiCall, options = {}) {
  const validatedOptions = validatePagination(options);
  let currentPage = validatedOptions.page || 1;
  let hasMore = true;
  let requestCount = 0;
  const maxRequests = options.maxRequests || 100;
  
  while (hasMore && requestCount < maxRequests) {
    try {
      const response = await apiCall({
        ...validatedOptions,
        page: currentPage
      });
      
      // Yield individual items
      const items = Array.isArray(response) ? response : 
                   response.data ? response.data : [response];
      
      for (const item of items) {
        yield item;
      }
      
      // Check for more pages
      const pagination = response._pagination;
      hasMore = pagination && pagination.next;
      
      if (hasMore) {
        currentPage++;
        requestCount++;
      }
      
    } catch (error) {
      throw new UsersError(`Pagination failed at page ${currentPage}: ${error.message}`);
    }
  }
  
  if (requestCount >= maxRequests) {
    console.warn(`Auto-pagination stopped at maximum request limit (${maxRequests})`);
  }
}

/**
 * Calculate total pages from pagination info
 * @param {Object} pagination - Pagination info
 * @param {number} perPage - Items per page
 * @returns {number|null} Total pages or null if unknown
 */
export function calculateTotalPages(pagination, perPage = 30) {
  if (pagination.totalCount) {
    return Math.ceil(pagination.totalCount / perPage);
  }
  
  // Try to extract from last URL
  if (pagination.lastUrl) {
    const pageInfo = getPageInfo(pagination.lastUrl);
    return pageInfo.page || null;
  }
  
  return null;
}

/**
 * Create pagination summary
 * @param {number} currentPage - Current page number
 * @param {number} perPage - Items per page
 * @param {Object} pagination - Pagination info
 * @returns {string} Human-readable pagination summary
 */
export function createPaginationSummary(currentPage, perPage, pagination) {
  if (!pagination.totalCount) {
    return `Page ${currentPage}`;
  }
  
  const startItem = ((currentPage - 1) * perPage) + 1;
  const endItem = Math.min(currentPage * perPage, pagination.totalCount);
  
  return `Items ${startItem}-${endItem} of ${pagination.totalCount}`;
}