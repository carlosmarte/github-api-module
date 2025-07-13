/**
 * @fileoverview HTTP client for GitHub API requests
 * @module http
 */

import fetch from 'node-fetch';
import { ErrorFactory, NetworkError, RateLimitError } from '../utils/errors.mjs';

/**
 * Default configuration
 */
const DEFAULT_CONFIG = {
  baseUrl: 'https://api.github.com',
  timeout: 10000,
  userAgent: '@github-api/repos/1.0.0',
  retryAttempts: 3,
  retryDelay: 1000,
  rateLimiting: {
    enabled: true,
    padding: 100 // ms padding between requests
  }
};

/**
 * HTTP client for GitHub API
 */
export class HTTPClient {
  constructor(options = {}) {
    this.config = { ...DEFAULT_CONFIG, ...options };
    this.authManager = options.authManager;
    this.lastRequestTime = 0;
  }
  
  /**
   * Make HTTP request
   */
  async request(endpoint, options = {}) {
    const url = this.buildUrl(endpoint);
    const requestOptions = this.buildRequestOptions(options);
    
    // Apply rate limiting
    await this.applyRateLimit();
    
    // Retry logic
    let lastError;
    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const response = await this.performRequest(url, requestOptions);
        return await this.handleResponse(response);
      } catch (error) {
        lastError = error;
        
        // Don't retry on certain errors
        if (!this.shouldRetry(error, attempt)) {
          throw error;
        }
        
        // Calculate retry delay
        const delay = this.calculateRetryDelay(error, attempt);
        if (delay > 0) {
          await this.sleep(delay);
        }
      }
    }
    
    throw lastError;
  }
  
  /**
   * Build full URL from endpoint
   */
  buildUrl(endpoint) {
    if (endpoint.startsWith('http')) {
      return endpoint;
    }
    
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${this.config.baseUrl}${cleanEndpoint}`;
  }
  
  /**
   * Build request options
   */
  buildRequestOptions(options = {}) {
    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        'Accept': 'application/vnd.github+json',
        'User-Agent': this.config.userAgent,
        'X-GitHub-Api-Version': '2022-11-28',
        ...options.headers
      },
      timeout: options.timeout || this.config.timeout
    };
    
    // Add authentication
    if (this.authManager) {
      requestOptions.headers['Authorization'] = this.authManager.getAuthHeader();
    }
    
    // Add body for POST/PUT/PATCH requests
    if (options.body && ['POST', 'PUT', 'PATCH'].includes(requestOptions.method)) {
      if (typeof options.body === 'object') {
        requestOptions.body = JSON.stringify(options.body);
        requestOptions.headers['Content-Type'] = 'application/json';
      } else {
        requestOptions.body = options.body;
      }
    }
    
    return requestOptions;
  }
  
  /**
   * Perform the actual HTTP request
   */
  async performRequest(url, options) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), options.timeout);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new NetworkError(`Request timeout after ${options.timeout}ms`);
      }
      throw ErrorFactory.fromNetworkError(error, url);
    }
  }
  
  /**
   * Handle HTTP response
   */
  async handleResponse(response) {
    const contentType = response.headers.get('content-type') || '';
    
    // Parse response body
    let body = null;
    if (contentType.includes('application/json')) {
      try {
        body = await response.json();
      } catch (error) {
        // Response claimed to be JSON but wasn't parseable
        body = await response.text();
      }
    } else if (response.headers.get('content-length') !== '0') {
      body = await response.text();
    }
    
    // Handle error responses
    if (!response.ok) {
      throw ErrorFactory.fromResponse(response, body);
    }
    
    // Update rate limit tracking
    this.updateRateLimitInfo(response);
    
    return body;
  }
  
  /**
   * Apply rate limiting
   */
  async applyRateLimit() {
    if (!this.config.rateLimiting.enabled) {
      return;
    }
    
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.config.rateLimiting.padding) {
      const delay = this.config.rateLimiting.padding - timeSinceLastRequest;
      await this.sleep(delay);
    }
    
    this.lastRequestTime = Date.now();
  }
  
  /**
   * Update rate limit information from response headers
   */
  updateRateLimitInfo(response) {
    const rateLimitRemaining = response.headers.get('x-ratelimit-remaining');
    const rateLimitReset = response.headers.get('x-ratelimit-reset');
    const rateLimitUsed = response.headers.get('x-ratelimit-used');
    
    if (rateLimitRemaining !== null) {
      this.rateLimitRemaining = parseInt(rateLimitRemaining);
      this.rateLimitReset = parseInt(rateLimitReset);
      this.rateLimitUsed = parseInt(rateLimitUsed) || 0;
    }
  }
  
  /**
   * Check if request should be retried
   */
  shouldRetry(error, attempt) {
    // Don't retry on last attempt
    if (attempt >= this.config.retryAttempts) {
      return false;
    }
    
    // Retry on network errors
    if (error instanceof NetworkError) {
      return true;
    }
    
    // Retry on rate limit errors
    if (error instanceof RateLimitError) {
      return true;
    }
    
    // Retry on 5xx errors
    if (error.statusCode >= 500) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Calculate retry delay
   */
  calculateRetryDelay(error, attempt) {
    // Rate limit errors have specific reset times
    if (error instanceof RateLimitError && error.resetTime) {
      const resetTime = new Date(error.resetTime * 1000);
      const now = new Date();
      return Math.max(0, resetTime.getTime() - now.getTime());
    }
    
    // Exponential backoff for other errors
    return this.config.retryDelay * Math.pow(2, attempt - 1);
  }
  
  /**
   * Sleep utility
   */
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Convenience methods for different HTTP verbs
   */
  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }
  
  async post(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'POST', body });
  }
  
  async put(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PUT', body });
  }
  
  async patch(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PATCH', body });
  }
  
  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
  
  async head(endpoint, options = {}) {
    const url = this.buildUrl(endpoint);
    const requestOptions = this.buildRequestOptions({ ...options, method: 'HEAD' });
    
    // Apply rate limiting
    await this.applyRateLimit();
    
    // Perform request with proper header handling for HEAD
    const response = await this.performRequest(url, requestOptions);
    
    if (!response.ok) {
      const body = null; // HEAD requests don't have bodies
      throw ErrorFactory.fromResponse(response, body);
    }
    
    // Update rate limit tracking
    this.updateRateLimitInfo(response);
    
    // Return response object for HEAD requests so headers can be accessed
    return response;
  }
  
  /**
   * Get current rate limit status
   */
  getRateLimitStatus() {
    return {
      remaining: this.rateLimitRemaining,
      reset: this.rateLimitReset ? new Date(this.rateLimitReset * 1000) : null,
      used: this.rateLimitUsed
    };
  }
  
  /**
   * Check if we're approaching rate limit
   */
  isApproachingRateLimit(threshold = 100) {
    return this.rateLimitRemaining !== undefined && this.rateLimitRemaining < threshold;
  }
}

/**
 * Create HTTP client with default configuration
 */
export function createHTTPClient(options = {}) {
  return new HTTPClient(options);
}