/**
 * @fileoverview HTTP Client with GitHub API integration
 * @module HttpClient
 */

import fetch from 'node-fetch';
import { API_Rate_Limiter } from '@thinkeloquent/npm-api-rate-limiter';
import { UsersError, AuthError, ValidationError, RateLimitError } from '../utils/errors.mjs';

/**
 * HTTP Client for GitHub API requests
 */
export class HttpClient {
  /**
   * Create a new HttpClient instance
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || 'https://api.github.com';
    this.token = options.token;
    this.timeout = options.timeout || 10000;
    this.userAgent = options.userAgent || '@github-api/users/1.0.0';
    
    // Default headers
    this.headers = {
      'Accept': 'application/vnd.github+json',
      'Authorization': `Bearer ${this.token}`,
      'User-Agent': this.userAgent,
      'X-GitHub-Api-Version': '2022-11-28',
      ...options.headers
    };

    // Setup rate limiting if enabled
    if (options.rateLimiting && options.rateLimiting.enabled) {
      this.rateLimiter = new API_Rate_Limiter('core', {
        maxRequests: options.rateLimiting.maxRequests || 5000,
        intervalMs: options.rateLimiting.window || 3600000 // 1 hour in ms
      });
    }
  }

  /**
   * Make an HTTP request
   * @param {string} method - HTTP method
   * @param {string} path - API endpoint path
   * @param {Object} [options] - Request options
   * @returns {Promise<Object>} Response data
   */
  async request(method, path, options = {}) {
    const makeRequest = async () => {
      const url = `${this.baseUrl}${path}`;
      const requestOptions = {
        method,
        headers: { ...this.headers, ...options.headers },
        timeout: this.timeout,
        ...options
      };

      // Add body for POST/PUT/PATCH requests
      if (options.body && ['POST', 'PUT', 'PATCH'].includes(method)) {
        requestOptions.body = JSON.stringify(options.body);
        requestOptions.headers['Content-Type'] = 'application/json';
      }

      const response = await fetch(url, requestOptions);
      return await this.handleResponse(response);
    };

    // Apply rate limiting if enabled
    if (this.rateLimiter) {
      return await this.rateLimiter.schedule(makeRequest);
    }

    try {
      return await makeRequest();
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Make a GET request
   * @param {string} path - API endpoint path
   * @param {Object} [options] - Request options
   * @returns {Promise<Object>} Response data
   */
  async get(path, options = {}) {
    // Convert query parameters to URL search params
    if (options.params) {
      const searchParams = new URLSearchParams();
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
      path += `?${searchParams.toString()}`;
    }

    return this.request('GET', path, options);
  }

  /**
   * Make a POST request
   * @param {string} path - API endpoint path
   * @param {Object} [body] - Request body
   * @param {Object} [options] - Request options
   * @returns {Promise<Object>} Response data
   */
  async post(path, body = {}, options = {}) {
    return this.request('POST', path, { ...options, body });
  }

  /**
   * Make a PUT request
   * @param {string} path - API endpoint path
   * @param {Object} [body] - Request body
   * @param {Object} [options] - Request options
   * @returns {Promise<Object>} Response data
   */
  async put(path, body = {}, options = {}) {
    return this.request('PUT', path, { ...options, body });
  }

  /**
   * Make a PATCH request
   * @param {string} path - API endpoint path
   * @param {Object} [body] - Request body
   * @param {Object} [options] - Request options
   * @returns {Promise<Object>} Response data
   */
  async patch(path, body = {}, options = {}) {
    return this.request('PATCH', path, { ...options, body });
  }

  /**
   * Make a DELETE request
   * @param {string} path - API endpoint path
   * @param {Object} [options] - Request options
   * @returns {Promise<Object>} Response data
   */
  async delete(path, options = {}) {
    return this.request('DELETE', path, options);
  }

  /**
   * Handle HTTP response
   * @param {Response} response - Fetch response object
   * @returns {Promise<Object>} Parsed response data
   */
  async handleResponse(response) {
    const contentType = response.headers.get('content-type');
    
    // Handle different content types
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // Handle error responses
    if (!response.ok) {
      throw this.createError(response, data);
    }

    // Add pagination info if present
    const linkHeader = response.headers.get('link');
    if (linkHeader) {
      data._pagination = this.parseLinkHeader(linkHeader);
    }

    // Add rate limit info
    data._rateLimit = {
      limit: parseInt(response.headers.get('x-ratelimit-limit') || '0'),
      remaining: parseInt(response.headers.get('x-ratelimit-remaining') || '0'),
      reset: new Date(parseInt(response.headers.get('x-ratelimit-reset') || '0') * 1000)
    };

    return data;
  }

  /**
   * Create appropriate error from response
   * @param {Response} response - Fetch response object
   * @param {Object} data - Response data
   * @returns {Error} Appropriate error instance
   */
  createError(response, data) {
    const message = data.message || `HTTP ${response.status}: ${response.statusText}`;
    
    switch (response.status) {
      case 401:
        return new AuthError(message, response.status, data);
      case 403:
        if (message.toLowerCase().includes('rate limit')) {
          return new RateLimitError(message, response.status, data);
        }
        return new AuthError(message, response.status, data);
      case 422:
        return new ValidationError(message, response.status, data);
      default:
        return new UsersError(message, response.status, data);
    }
  }

  /**
   * Handle request errors
   * @param {Error} error - Error object
   * @returns {Error} Appropriate error instance
   */
  handleError(error) {
    if (error instanceof UsersError) {
      return error;
    }
    
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return new UsersError(`Network error: ${error.message}`);
    }
    
    if (error.name === 'AbortError' || error.code === 'ETIMEDOUT') {
      return new UsersError('Request timeout');
    }
    
    return new UsersError(`Request failed: ${error.message}`);
  }

  /**
   * Parse Link header for pagination
   * @param {string} linkHeader - Link header value
   * @returns {Object} Pagination links
   */
  parseLinkHeader(linkHeader) {
    const links = {};
    const parts = linkHeader.split(',');
    
    parts.forEach(part => {
      const match = part.match(/<([^>]+)>;\s*rel="([^"]+)"/);
      if (match) {
        links[match[2]] = match[1];
      }
    });
    
    return links;
  }

  /**
   * Update client configuration
   * @param {Object} options - New configuration options
   */
  updateConfig(options = {}) {
    if (options.token) {
      this.token = options.token;
      this.headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    if (options.baseUrl) {
      this.baseUrl = options.baseUrl;
    }
    
    if (options.timeout) {
      this.timeout = options.timeout;
    }
    
    if (options.headers) {
      this.headers = { ...this.headers, ...options.headers };
    }
  }

  /**
   * Close the client and cleanup resources
   */
  close() {
    if (this.rateLimiter && this.rateLimiter.close) {
      this.rateLimiter.close();
    }
  }
}