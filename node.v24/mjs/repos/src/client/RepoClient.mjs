/**
 * @fileoverview Main GitHub Repository API Client
 * @module RepoClient
 */

import { AuthManager, createAuth, getTokenFromEnvironment } from './auth.mjs';
import { HTTPClient } from './http.mjs';
import { AuthError } from '../utils/errors.mjs';

// Import API modules
import * as repositories from '../api/repositories.mjs';
import * as collaborators from '../api/collaborators.mjs';
import * as branches from '../api/branches.mjs';
import * as tags from '../api/tags.mjs';
import * as webhooks from '../api/webhooks.mjs';
import * as security from '../api/security.mjs';
import * as rules from '../api/rules.mjs';

/**
 * Main GitHub Repository API Client
 * 
 * @example
 * ```javascript
 * import { RepoClient } from '@github-api/repos';
 * 
 * const client = new RepoClient({
 *   token: process.env.GITHUB_TOKEN
 * });
 * 
 * // Get repository
 * const repo = await client.repositories.get('octocat', 'Hello-World');
 * 
 * // List branches
 * const branches = await client.branches.list('octocat', 'Hello-World');
 * ```
 */
export class RepoClient {
  /**
   * Create a new repository client
   * 
   * @param {Object} options - Configuration options
   * @param {string} [options.token] - GitHub personal access token
   * @param {string} [options.baseUrl] - GitHub API base URL
   * @param {number} [options.timeout] - Request timeout in milliseconds
   * @param {Object} [options.rateLimiting] - Rate limiting configuration
   * @param {boolean} [options.rateLimiting.enabled] - Enable rate limiting
   * @param {number} [options.rateLimiting.padding] - Padding between requests (ms)
   * @param {Object} [options.auth] - Authentication configuration
   * @param {boolean} [options.verbose] - Enable verbose logging
   */
  constructor(options = {}) {
    // Set up authentication
    this.auth = this.setupAuth(options);
    
    // Create HTTP client
    this.http = new HTTPClient({
      baseUrl: options.baseUrl || 'https://api.github.com',
      timeout: options.timeout || 10000,
      rateLimiting: {
        enabled: true,
        padding: 100,
        ...options.rateLimiting
      },
      userAgent: options.userAgent || '@github-api/repos/1.0.0',
      authManager: this.auth,
      verbose: options.verbose || false
    });
    
    // Initialize API modules
    this.repositories = this.createAPIModule(repositories);
    this.collaborators = this.createAPIModule(collaborators);
    this.branches = this.createAPIModule(branches);
    this.tags = this.createAPIModule(tags);
    this.webhooks = this.createAPIModule(webhooks);
    this.security = this.createAPIModule(security);
    this.rules = this.createAPIModule(rules);
    
    // Store options for debugging
    this.options = options;
    this._initialized = false;
  }
  
  /**
   * Set up authentication
   */
  setupAuth(options) {
    // If token is explicitly provided, use it
    if (options.token) {
      return createAuth(options.token);
    }
    
    // If auth object is provided, use it
    if (options.auth) {
      if (typeof options.auth === 'object') {
        return new AuthManager(options.auth);
      }
      return createAuth(options.auth);
    }
    
    // If no explicit authentication options provided, check environment
    const envToken = getTokenFromEnvironment();
    if (!envToken) {
      throw new AuthError(
        'Authentication required. Provide token via options.token, ' +
        'options.auth, or GITHUB_TOKEN environment variable'
      );
    }
    
    // Use environment token if available
    return createAuth(envToken);
  }
  
  /**
   * Create API module with bound HTTP client
   */
  createAPIModule(module) {
    const boundMethods = {};
    
    for (const [name, method] of Object.entries(module)) {
      if (typeof method === 'function') {
        boundMethods[name] = (...args) => method(this.http, ...args);
      }
    }
    
    return boundMethods;
  }
  
  /**
   * Initialize client and validate authentication
   */
  async initialize() {
    if (this._initialized) {
      return;
    }
    
    try {
      // Validate authentication by making a test request
      const user = await this.auth.getUserInfo(this.http);
      this.authenticatedUser = user;
      
      // Check token scopes
      const scopes = await this.auth.checkScopes(this.http, ['repo']);
      this.tokenScopes = scopes;
      
      // Get rate limit status
      const rateLimit = await this.auth.getRateLimit(this.http);
      this.rateLimit = rateLimit;
      
      this._initialized = true;
      
      if (this.options.verbose) {
        console.log(`✓ Authenticated as ${user.login} (${user.name || 'no name'})`);
        console.log(`✓ Token scopes: ${scopes.join(', ')}`);
        if (rateLimit) {
          console.log(`✓ Rate limit: ${rateLimit.resources.core.remaining}/${rateLimit.resources.core.limit}`);
        }
      }
    } catch (error) {
      throw new AuthError(`Authentication failed: ${error.message}`);
    }
  }
  
  /**
   * Get authenticated user information
   */
  async getAuthenticatedUser() {
    await this.initialize();
    return this.authenticatedUser;
  }
  
  /**
   * Get current rate limit status
   */
  async getRateLimit() {
    return this.http.getRateLimitStatus();
  }
  
  /**
   * Test API connectivity
   */
  async ping() {
    try {
      const response = await this.http.get('/');
      return { 
        success: true, 
        message: 'GitHub API is reachable',
        rateLimit: this.http.getRateLimitStatus()
      };
    } catch (error) {
      return { 
        success: false, 
        message: error.message,
        error: error.name 
      };
    }
  }
  
  /**
   * Get client configuration
   */
  getConfig() {
    return {
      baseUrl: this.http.config.baseUrl,
      timeout: this.http.config.timeout,
      rateLimiting: this.http.config.rateLimiting,
      userAgent: this.http.config.userAgent,
      authenticated: !!this.auth,
      initialized: this._initialized
    };
  }
  
  /**
   * Update client configuration
   */
  updateConfig(updates) {
    if (updates.token) {
      this.auth = createAuth(updates.token);
      this.http.authManager = this.auth;
      this._initialized = false; // Force re-initialization
    }
    
    if (updates.baseUrl) {
      this.http.config.baseUrl = updates.baseUrl;
    }
    
    if (updates.timeout) {
      this.http.config.timeout = updates.timeout;
    }
    
    if (updates.rateLimiting) {
      Object.assign(this.http.config.rateLimiting, updates.rateLimiting);
    }
  }
  
  /**
   * Create a paginated request helper
   */
  paginate(method, ...args) {
    return {
      async *[Symbol.asyncIterator]() {
        let page = 1;
        let hasMore = true;
        
        while (hasMore) {
          const options = args[args.length - 1] || {};
          const params = { ...options, page, per_page: options.per_page || 30 };
          const newArgs = [...args.slice(0, -1), params];
          
          const results = await method(...newArgs);
          
          if (Array.isArray(results)) {
            for (const item of results) {
              yield item;
            }
            hasMore = results.length === params.per_page;
          } else {
            yield results;
            hasMore = false;
          }
          
          page++;
          
          // Safety break to prevent infinite loops
          if (page > 1000) {
            break;
          }
        }
      },
      
      async all() {
        const results = [];
        for await (const item of this) {
          results.push(item);
        }
        return results;
      }
    };
  }
  
  /**
   * Destroy client and cleanup resources
   */
  destroy() {
    this.auth = null;
    this.http = null;
    this.repositories = null;
    this.collaborators = null;
    this.branches = null;
    this.tags = null;
    this.webhooks = null;
    this.security = null;
    this.rules = null;
    this._initialized = false;
  }
}

/**
 * Create a new RepoClient instance
 */
export function createClient(options = {}) {
  return new RepoClient(options);
}

export default RepoClient;