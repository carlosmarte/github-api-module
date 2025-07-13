/**
 * HTTP client service for GitHub API requests
 * @module services/http
 */

import { ErrorHandler, TimeoutError, RateLimitError } from '../core/errors.mjs';

export class HttpService {
  #config;
  #logger;
  #baseHeaders;

  constructor(config, logger) {
    this.#config = config;
    this.#logger = logger;
    this.#baseHeaders = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': '@github-api/reactions',
      'Authorization': `token ${config.token}`,
    };
  }

  /**
   * Make an HTTP request
   * @param {Object} options - Request options
   * @param {string} options.method - HTTP method
   * @param {string} options.url - Request URL
   * @param {Object} [options.headers] - Additional headers
   * @param {any} [options.body] - Request body
   * @param {number} [options.timeout] - Request timeout
   * @returns {Promise<Object>} Response object
   */
  async request(options) {
    const { method, url, headers = {}, body, timeout = this.#config.timeout } = options;

    const fullUrl = url.startsWith('http') ? url : `${this.#config.baseUrl}${url}`;
    
    const requestOptions = {
      method: method.toUpperCase(),
      headers: { ...this.#baseHeaders, ...headers },
    };

    if (body) {
      requestOptions.body = JSON.stringify(body);
      requestOptions.headers['Content-Type'] = 'application/json';
    }

    this.#logger.debug(`${method.toUpperCase()} ${fullUrl}`, { body });

    let attempt = 0;
    const maxAttempts = this.#config.retries + 1;

    while (attempt < maxAttempts) {
      attempt++;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(fullUrl, {
          ...requestOptions,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Handle rate limiting
        if (response.status === 429) {
          const resetTime = parseInt(response.headers.get('x-ratelimit-reset'));
          if (attempt < maxAttempts && resetTime) {
            const waitTime = (resetTime * 1000) - Date.now() + 1000; // Add 1 second buffer
            this.#logger.warn(`Rate limited, waiting ${waitTime}ms`);
            await new Promise(resolve => setTimeout(resolve, Math.max(0, waitTime)));
            continue;
          }
          throw new RateLimitError(resetTime);
        }

        let data;
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else {
          data = await response.text();
        }

        if (!response.ok) {
          const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
          error.response = { status: response.status, data, headers: response.headers };
          throw error;
        }

        const result = {
          data,
          status: response.status,
          headers: Object.fromEntries(response.headers.entries()),
          url: fullUrl,
        };

        this.#logger.debug(`Response ${response.status}`, { url: fullUrl });

        return result;

      } catch (error) {
        if (error.name === 'AbortError') {
          const timeoutError = new TimeoutError(timeout);
          if (attempt < maxAttempts && ErrorHandler.isRetryable(timeoutError)) {
            this.#logger.warn(`Request timeout, retrying (${attempt}/${maxAttempts})`);
            continue;
          }
          throw timeoutError;
        }

        const handledError = ErrorHandler.handle(error);
        
        if (attempt < maxAttempts && ErrorHandler.isRetryable(handledError)) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Exponential backoff
          this.#logger.warn(`Request failed, retrying in ${delay}ms (${attempt}/${maxAttempts}): ${handledError.message}`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        throw handledError;
      }
    }
  }

  /**
   * Make a GET request
   * @param {string} url - Request URL
   * @param {Object} [options] - Request options
   * @returns {Promise<Object>} Response object
   */
  async get(url, options = {}) {
    return this.request({ method: 'GET', url, ...options });
  }

  /**
   * Make a POST request
   * @param {string} url - Request URL
   * @param {any} [body] - Request body
   * @param {Object} [options] - Request options
   * @returns {Promise<Object>} Response object
   */
  async post(url, body, options = {}) {
    return this.request({ method: 'POST', url, body, ...options });
  }

  /**
   * Make a DELETE request
   * @param {string} url - Request URL
   * @param {Object} [options] - Request options
   * @returns {Promise<Object>} Response object
   */
  async delete(url, options = {}) {
    return this.request({ method: 'DELETE', url, ...options });
  }

  /**
   * Parse pagination info from Link header
   * @param {string} linkHeader - Link header value
   * @returns {Object} Pagination info
   */
  parsePagination(linkHeader) {
    const pagination = {};
    
    if (!linkHeader) {
      return pagination;
    }

    const links = linkHeader.split(',');
    
    for (const link of links) {
      const [url, rel] = link.split(';');
      const cleanUrl = url.trim().slice(1, -1); // Remove < >
      const cleanRel = rel.trim().match(/rel="(.+)"/)?.[1];
      
      if (cleanRel) {
        pagination[`${cleanRel}Url`] = cleanUrl;
        
        // Extract page number from URL
        const pageMatch = cleanUrl.match(/[?&]page=(\d+)/);
        if (pageMatch) {
          const pageNum = parseInt(pageMatch[1]);
          if (cleanRel === 'last') {
            pagination.totalPages = pageNum;
          }
        }
      }
    }
    
    return pagination;
  }
}