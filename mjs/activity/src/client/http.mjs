/**
 * HTTP Client for GitHub Activity API
 * @module client/http
 */

import axios from 'axios';
import { parseLinkHeader } from '../utils/pagination.mjs';
import { APIError, RateLimitError } from '../utils/errors.mjs';

/**
 * HTTP Client class for making API requests
 */
export class HttpClient {
  /**
   * @param {Object} config - Configuration options
   * @param {string} [config.baseURL] - Base URL for API
   * @param {string} [config.token] - GitHub personal access token
   * @param {number} [config.timeout] - Request timeout in ms
   * @param {Object} [config.headers] - Additional headers
   */
  constructor(config = {}) {
    this.client = axios.create({
      baseURL: config.baseURL || 'https://api.github.com',
      timeout: config.timeout || 30000,
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'GitHub-Activity-SDK/1.0.0',
        ...config.headers
      }
    });

    // Set authorization header if token provided
    if (config.token) {
      this.setAuthToken(config.token);
    }

    // Request interceptor
    this.client.interceptors.request.use(
      (request) => {
        // Log request in debug mode
        if (process.env.DEBUG === 'true') {
          console.log(`[HTTP] ${request.method?.toUpperCase()} ${request.url}`);
        }
        return request;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        // Add pagination info to response
        if (response.headers.link) {
          response.pagination = parseLinkHeader(response.headers.link);
        }

        // Add rate limit info
        response.rateLimit = {
          limit: parseInt(response.headers['x-ratelimit-limit']) || 0,
          remaining: parseInt(response.headers['x-ratelimit-remaining']) || 0,
          reset: parseInt(response.headers['x-ratelimit-reset']) || 0,
          used: parseInt(response.headers['x-ratelimit-used']) || 0,
          resource: response.headers['x-ratelimit-resource'] || 'core'
        };

        return response;
      },
      async (error) => {
        return this.handleError(error);
      }
    );
  }

  /**
   * Set authentication token
   * @param {string} token - GitHub personal access token
   */
  setAuthToken(token) {
    if (token) {
      this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.client.defaults.headers.common['Authorization'];
    }
  }

  /**
   * Handle API errors
   * @param {Error} error - Axios error
   * @returns {Promise}
   */
  async handleError(error) {
    if (error.response) {
      const { status, data, headers } = error.response;

      // Rate limit exceeded
      if (status === 403 && headers['x-ratelimit-remaining'] === '0') {
        const resetTime = parseInt(headers['x-ratelimit-reset']) * 1000;
        const retryAfter = resetTime - Date.now();
        
        throw new RateLimitError(
          `Rate limit exceeded. Resets at ${new Date(resetTime).toISOString()}`,
          retryAfter,
          resetTime
        );
      }

      // Other API errors
      throw new APIError(
        data.message || `Request failed with status ${status}`,
        status,
        data.errors || [],
        data.documentation_url
      );
    }

    // Network or other errors
    throw error;
  }

  /**
   * Make GET request
   * @param {string} path - API endpoint path
   * @param {Object} [params] - Query parameters
   * @returns {Promise<Object>} Response data with pagination info
   */
  async get(path, params = {}) {
    const response = await this.client.get(path, { params });
    return {
      data: response.data,
      pagination: response.pagination,
      rateLimit: response.rateLimit
    };
  }

  /**
   * Make POST request
   * @param {string} path - API endpoint path
   * @param {Object} [data] - Request body
   * @param {Object} [params] - Query parameters
   * @returns {Promise<Object>} Response data
   */
  async post(path, data = {}, params = {}) {
    const response = await this.client.post(path, data, { params });
    return {
      data: response.data,
      rateLimit: response.rateLimit
    };
  }

  /**
   * Make PUT request
   * @param {string} path - API endpoint path
   * @param {Object} [data] - Request body
   * @param {Object} [params] - Query parameters
   * @returns {Promise<Object>} Response data
   */
  async put(path, data = {}, params = {}) {
    const response = await this.client.put(path, data, { params });
    return {
      data: response.data,
      rateLimit: response.rateLimit
    };
  }

  /**
   * Make PATCH request
   * @param {string} path - API endpoint path
   * @param {Object} [data] - Request body
   * @param {Object} [params] - Query parameters
   * @returns {Promise<Object>} Response data
   */
  async patch(path, data = {}, params = {}) {
    const response = await this.client.patch(path, data, { params });
    return {
      data: response.data,
      rateLimit: response.rateLimit
    };
  }

  /**
   * Make DELETE request
   * @param {string} path - API endpoint path
   * @param {Object} [params] - Query parameters
   * @returns {Promise<Object>} Response data
   */
  async delete(path, params = {}) {
    const response = await this.client.delete(path, { params });
    return {
      data: response.data,
      rateLimit: response.rateLimit
    };
  }

  /**
   * Get all pages of a paginated endpoint
   * @param {string} path - API endpoint path
   * @param {Object} [params] - Query parameters
   * @param {number} [maxPages] - Maximum number of pages to fetch
   * @returns {AsyncGenerator} Yields items from each page
   */
  async *getAllPages(path, params = {}, maxPages = Infinity) {
    let page = params.page || 1;
    let pagesRetrieved = 0;

    while (pagesRetrieved < maxPages) {
      const response = await this.get(path, { ...params, page });
      
      // Yield items from current page
      for (const item of response.data) {
        yield item;
      }

      pagesRetrieved++;

      // Check if there are more pages
      if (!response.pagination?.next || pagesRetrieved >= maxPages) {
        break;
      }

      page++;
    }
  }

  /**
   * Fetch all items from a paginated endpoint
   * @param {string} path - API endpoint path
   * @param {Object} [params] - Query parameters
   * @param {number} [maxPages] - Maximum number of pages to fetch
   * @returns {Promise<Array>} All items
   */
  async fetchAllPages(path, params = {}, maxPages = Infinity) {
    const items = [];
    for await (const item of this.getAllPages(path, params, maxPages)) {
      items.push(item);
    }
    return items;
  }
}

export default HttpClient;