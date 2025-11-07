/**
 * Main GitHub Activity API Client
 * @module client/ActivityClient
 */

import { HttpClient } from './http.mjs';
import { createAuthConfig } from './auth.mjs';
import { EventsAPI } from '../api/events.mjs';
import { NotificationsAPI } from '../api/notifications.mjs';
import { FeedsAPI } from '../api/feeds.mjs';
import { StarsAPI } from '../api/stars.mjs';
import { WatchingAPI } from '../api/watching.mjs';

/**
 * Main client for GitHub Activity API
 */
export class ActivityClient {
  /**
   * @param {Object} options - Client configuration options
   * @param {string} [options.token] - GitHub personal access token
   * @param {string} [options.baseURL] - Base URL for GitHub API
   * @param {number} [options.timeout] - Request timeout in milliseconds
   * @param {number} [options.perPage] - Default items per page
   * @param {boolean} [options.debug] - Enable debug mode
   */
  constructor(options = {}) {
    this.options = {
      baseURL: options.baseURL || process.env.GITHUB_API_URL || 'https://api.github.com',
      timeout: options.timeout || 30000,
      perPage: options.perPage || 30,
      debug: options.debug || process.env.DEBUG === 'true',
      ...options
    };

    // Initialize auth config
    this.authConfig = null;
    this.initAuth(options);

    // Initialize HTTP client
    this.http = new HttpClient({
      baseURL: this.options.baseURL,
      token: this.options.token,
      timeout: this.options.timeout
    });

    // Initialize API modules
    this.events = new EventsAPI(this.http);
    this.notifications = new NotificationsAPI(this.http);
    this.feeds = new FeedsAPI(this.http);
    this.stars = new StarsAPI(this.http);
    this.watching = new WatchingAPI(this.http);
  }

  /**
   * Initialize authentication
   * @param {Object} options - Auth options
   */
  async initAuth(options) {
    this.authConfig = await createAuthConfig(options);
    const token = await this.authConfig.getToken();
    
    if (token) {
      this.options.token = token;
      if (this.http) {
        this.http.setAuthToken(token);
      }
    }
  }

  /**
   * Set authentication token
   * @param {string} token - GitHub personal access token
   */
  setToken(token) {
    this.options.token = token;
    this.http.setAuthToken(token);
  }

  /**
   * Get current rate limit status
   * @returns {Promise<Object>} Rate limit information
   */
  async getRateLimit() {
    const response = await this.http.get('/rate_limit');
    return response.data;
  }

  /**
   * Get authenticated user
   * @returns {Promise<Object>} User information
   */
  async getAuthenticatedUser() {
    const response = await this.http.get('/user');
    return response.data;
  }

  /**
   * Check if client is authenticated
   * @returns {boolean}
   */
  isAuthenticated() {
    return !!this.options.token;
  }

  /**
   * Get API meta information
   * @returns {Promise<Object>} Meta information
   */
  async getMeta() {
    const response = await this.http.get('/meta');
    return response.data;
  }

  /**
   * Create a new client with different configuration
   * @param {Object} options - New options
   * @returns {ActivityClient} New client instance
   */
  withOptions(options) {
    return new ActivityClient({
      ...this.options,
      ...options
    });
  }

  /**
   * Factory method to create client from environment
   * @param {Object} options - Additional options
   * @returns {Promise<ActivityClient>} Client instance
   */
  static async fromEnvironment(options = {}) {
    const authConfig = await createAuthConfig();
    const token = await authConfig.getToken();

    return new ActivityClient({
      token,
      baseURL: process.env.GITHUB_API_URL,
      timeout: process.env.GITHUB_API_TIMEOUT ? parseInt(process.env.GITHUB_API_TIMEOUT) : undefined,
      debug: process.env.DEBUG === 'true',
      ...options
    });
  }

  /**
   * Factory method to create client from config file
   * @param {string} configPath - Path to config file
   * @param {Object} options - Additional options
   * @returns {Promise<ActivityClient>} Client instance
   */
  static async fromConfig(configPath, options = {}) {
    const authConfig = await createAuthConfig({ configPath });
    const config = await authConfig.constructor.loadConfig(configPath);
    
    return new ActivityClient({
      ...config,
      ...options
    });
  }
}

export default ActivityClient;