/**
 * @fileoverview GitHub Users API Client
 * @module UsersClient
 */

import { HttpClient } from './http.mjs';
import { ProfileAPI } from '../api/profile.mjs';
import { EmailsAPI } from '../api/emails.mjs';
import { DiscoveryAPI } from '../api/discovery.mjs';
import { ContextAPI } from '../api/context.mjs';
import { AuthError, UsersError } from '../utils/errors.mjs';

/**
 * GitHub Users API Client
 * Main client class that orchestrates all user-related operations
 */
export class UsersClient {
  /**
   * Create a new UsersClient instance
   * @param {Object} options - Configuration options
   * @param {string} options.token - GitHub personal access token
   * @param {string} [options.baseUrl='https://api.github.com'] - GitHub API base URL
   * @param {Object} [options.rateLimiting] - Rate limiting configuration
   * @param {boolean} [options.rateLimiting.enabled=true] - Enable rate limiting
   * @param {number} [options.rateLimiting.maxRequests=5000] - Maximum requests per hour
   * @param {number} [options.timeout=10000] - Request timeout in milliseconds
   * @param {Object} [options.headers] - Additional headers
   */
  constructor(options = {}) {
    this.options = {
      baseUrl: 'https://api.github.com',
      timeout: 10000,
      rateLimiting: {
        enabled: true,
        maxRequests: 5000
      },
      ...options
    };

    // Validate required token
    if (!this.options.token) {
      throw new AuthError('GitHub token is required. Set GITHUB_TOKEN environment variable or pass token in options.');
    }

    // Initialize HTTP client
    this.http = new HttpClient(this.options);

    // Initialize API modules
    this.profile = new ProfileAPI(this.http);
    this.emails = new EmailsAPI(this.http);
    this.discovery = new DiscoveryAPI(this.http);
    this.context = new ContextAPI(this.http);
  }

  /**
   * Test authentication and get rate limit status
   * @returns {Promise<Object>} Rate limit information
   */
  async testAuth() {
    try {
      const response = await this.http.get('/rate_limit');
      return response;
    } catch (error) {
      if (error.status === 401) {
        throw new AuthError('Invalid GitHub token provided');
      }
      throw error;
    }
  }

  /**
   * Get current rate limit status
   * @returns {Promise<Object>} Rate limit information
   */
  async getRateLimit() {
    return await this.http.get('/rate_limit');
  }

  /**
   * Update client configuration
   * @param {Object} options - New configuration options
   */
  updateConfig(options = {}) {
    this.options = { ...this.options, ...options };
    this.http.updateConfig(this.options);
  }

  /**
   * Close the client and cleanup resources
   */
  close() {
    if (this.http && this.http.close) {
      this.http.close();
    }
  }
}