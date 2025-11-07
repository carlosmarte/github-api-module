/**
 * @fileoverview Pagination utilities for GitHub API
 * @module pagination
 */

import { ValidationError } from './errors.mjs';

/**
 * Parse pagination links from GitHub API response headers
 */
export function parsePaginationLinks(linkHeader) {
  if (!linkHeader) {
    return {};
  }
  
  const links = {};
  const parts = linkHeader.split(',');
  
  for (const part of parts) {
    const match = part.match(/<([^>]+)>;\s*rel="([^"]+)"/);
    if (match) {
      const [, url, rel] = match;
      links[rel] = url;
    }
  }
  
  return links;
}

/**
 * Extract page number from URL
 */
export function extractPageFromUrl(url) {
  if (!url) return null;
  
  try {
    const urlObj = new URL(url);
    const page = urlObj.searchParams.get('page');
    return page ? parseInt(page, 10) : null;
  } catch (error) {
    return null;
  }
}

/**
 * Get pagination info from response headers
 */
export function getPaginationInfo(response) {
  const linkHeader = response.headers?.get('link');
  const links = parsePaginationLinks(linkHeader);
  
  return {
    first: links.first ? extractPageFromUrl(links.first) : null,
    prev: links.prev ? extractPageFromUrl(links.prev) : null,
    next: links.next ? extractPageFromUrl(links.next) : null,
    last: links.last ? extractPageFromUrl(links.last) : null,
    hasNext: !!links.next,
    hasPrev: !!links.prev,
    links
  };
}

/**
 * Create paginated request iterator
 */
export function createPaginatedIterator(httpClient, endpoint, options = {}) {
  const defaultOptions = {
    per_page: 30,
    page: 1,
    ...options
  };
  
  return {
    async *[Symbol.asyncIterator]() {
      let currentPage = defaultOptions.page;
      let hasMore = true;
      
      while (hasMore) {
        const params = new URLSearchParams({
          ...defaultOptions,
          page: currentPage.toString(),
          per_page: defaultOptions.per_page.toString()
        });
        
        // Add other query parameters
        Object.entries(defaultOptions).forEach(([key, value]) => {
          if (!['page', 'per_page'].includes(key) && value !== undefined) {
            params.set(key, value.toString());
          }
        });
        
        const url = `${endpoint}?${params.toString()}`;
        const response = await httpClient.request(url);
        
        // For most GitHub API endpoints, the response is an array
        if (Array.isArray(response)) {
          for (const item of response) {
            yield item;
          }
          
          // Check if we should continue
          hasMore = response.length === defaultOptions.per_page;
        } else {
          // Some endpoints return objects with items array
          if (response.items && Array.isArray(response.items)) {
            for (const item of response.items) {
              yield item;
            }
            hasMore = response.items.length === defaultOptions.per_page;
          } else {
            // Single item response
            yield response;
            hasMore = false;
          }
        }
        
        currentPage++;
        
        // Safety check to prevent infinite loops
        if (currentPage > 1000) {
          break;
        }
      }
    },
    
    async all(limit = Infinity) {
      const results = [];
      let count = 0;
      
      for await (const item of this) {
        if (count >= limit) break;
        results.push(item);
        count++;
      }
      
      return results;
    },
    
    async first(count = 1) {
      const results = [];
      let collected = 0;
      
      for await (const item of this) {
        if (collected >= count) break;
        results.push(item);
        collected++;
      }
      
      return count === 1 ? results[0] : results;
    }
  };
}

/**
 * Paginate through all pages and collect results
 */
export async function paginateAll(httpClient, endpoint, options = {}) {
  const iterator = createPaginatedIterator(httpClient, endpoint, options);
  return await iterator.all();
}

/**
 * Get a single page of results
 */
export async function paginate(httpClient, endpoint, options = {}) {
  const params = new URLSearchParams({
    page: options.page || 1,
    per_page: options.per_page || 30,
    ...options
  });
  
  const url = `${endpoint}?${params.toString()}`;
  const response = await httpClient.request(url);
  
  return {
    data: response,
    pagination: getPaginationInfo(response)
  };
}

/**
 * Page info utility class
 */
export class PageInfo {
  constructor(response) {
    const paginationInfo = getPaginationInfo(response);
    Object.assign(this, paginationInfo);
  }
  
  /**
   * Get total number of pages (if last page is known)
   */
  getTotalPages() {
    return this.last || null;
  }
  
  /**
   * Check if this is the first page
   */
  isFirstPage() {
    return !this.hasPrev;
  }
  
  /**
   * Check if this is the last page
   */
  isLastPage() {
    return !this.hasNext;
  }
  
  /**
   * Get current page number (estimated from prev/next)
   */
  getCurrentPage() {
    if (this.next) {
      return this.next - 1;
    }
    if (this.prev) {
      return this.prev + 1;
    }
    return 1;
  }
}

/**
 * Pagination helper for CLI/display purposes
 */
export class PaginationHelper {
  constructor(options = {}) {
    this.pageSize = options.pageSize || 30;
    this.maxPages = options.maxPages || 10;
  }
  
  /**
   * Create pagination display for CLI
   */
  createDisplay(currentPage, totalPages) {
    if (totalPages <= 1) {
      return '';
    }
    
    const parts = [];
    
    // Previous page link
    if (currentPage > 1) {
      parts.push(`← Prev (${currentPage - 1})`);
    }
    
    // Page numbers
    const startPage = Math.max(1, currentPage - Math.floor(this.maxPages / 2));
    const endPage = Math.min(totalPages, startPage + this.maxPages - 1);
    
    if (startPage > 1) {
      parts.push('1');
      if (startPage > 2) {
        parts.push('...');
      }
    }
    
    for (let i = startPage; i <= endPage; i++) {
      if (i === currentPage) {
        parts.push(`[${i}]`);
      } else {
        parts.push(i.toString());
      }
    }
    
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        parts.push('...');
      }
      parts.push(totalPages.toString());
    }
    
    // Next page link
    if (currentPage < totalPages) {
      parts.push(`Next (${currentPage + 1}) →`);
    }
    
    return parts.join(' ');
  }
  
  /**
   * Calculate pagination info for array of items
   */
  paginateArray(items, page = 1) {
    const totalItems = items.length;
    const totalPages = Math.ceil(totalItems / this.pageSize);
    const startIndex = (page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    
    return {
      items: items.slice(startIndex, endIndex),
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        startIndex,
        endIndex: Math.min(endIndex, totalItems)
      }
    };
  }
}

/**
 * Validate pagination options
 */
export function validatePaginationOptions(options = {}) {
  const errors = [];
  
  if (options.page !== undefined) {
    if (!Number.isInteger(options.page) || options.page < 1) {
      errors.push('Page must be a positive integer');
    }
    if (options.page > 1000) {
      errors.push('Page cannot be greater than 1000');
    }
  }
  
  if (options.per_page !== undefined) {
    if (!Number.isInteger(options.per_page) || options.per_page < 1) {
      errors.push('per_page must be a positive integer');
    }
    if (options.per_page > 100) {
      errors.push('per_page cannot be greater than 100');
    }
  }
  
  if (errors.length > 0) {
    throw new ValidationError(`Pagination validation failed: ${errors.join(', ')}`);
  }
  
  return true;
}