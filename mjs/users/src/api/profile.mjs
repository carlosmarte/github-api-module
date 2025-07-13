/**
 * @fileoverview GitHub Users Profile API
 * @module ProfileAPI
 */

import { validateUserUpdate } from '../utils/validation.mjs';
import { UsersError, AuthError } from '../utils/errors.mjs';

/**
 * Profile API for authenticated user operations
 */
export class ProfileAPI {
  /**
   * Create ProfileAPI instance
   * @param {HttpClient} http - HTTP client instance
   */
  constructor(http) {
    this.http = http;
  }

  /**
   * Get the authenticated user
   * OAuth app tokens and personal access tokens need the `user` scope 
   * for the response to include private profile information.
   * 
   * @param {Object} [options] - Request options
   * @returns {Promise<Object>} User object
   * 
   * @example
   * ```javascript
   * const user = await client.profile.getAuthenticated();
   * console.log(`Authenticated as: ${user.login}`);
   * ```
   */
  async getAuthenticated(options = {}) {
    try {
      const response = await this.http.get('/user', options);
      return response;
    } catch (error) {
      if (error.status === 401) {
        throw new AuthError('Authentication required. Please provide a valid GitHub token.');
      }
      throw error;
    }
  }

  /**
   * Update the authenticated user
   * If your email is set to private and you send an `email` parameter,
   * your privacy settings are still enforced.
   * 
   * @param {Object} userData - User data to update
   * @param {string} [userData.name] - The new name of the user
   * @param {string} [userData.email] - The publicly visible email address of the user
   * @param {string} [userData.blog] - The new blog URL of the user
   * @param {string} [userData.twitter_username] - The new Twitter username of the user
   * @param {string} [userData.company] - The new company of the user
   * @param {string} [userData.location] - The new location of the user
   * @param {boolean} [userData.hireable] - The new hiring availability of the user
   * @param {string} [userData.bio] - The new short biography of the user
   * @param {Object} [options] - Request options
   * @returns {Promise<Object>} Updated user object
   * 
   * @example
   * ```javascript
   * const updatedUser = await client.profile.updateAuthenticated({
   *   name: 'John Doe',
   *   bio: 'Software developer',
   *   location: 'San Francisco, CA',
   *   hireable: true
   * });
   * console.log('Profile updated:', updatedUser.login);
   * ```
   */
  async updateAuthenticated(userData, options = {}) {
    // Validate user data
    const validatedData = validateUserUpdate(userData);

    try {
      const response = await this.http.patch('/user', validatedData, options);
      return response;
    } catch (error) {
      if (error.status === 401) {
        throw new AuthError('Authentication required. Please provide a valid GitHub token.');
      }
      if (error.status === 403) {
        throw new AuthError('Insufficient permissions. This operation requires the `user` scope.');
      }
      throw error;
    }
  }

  /**
   * Get authenticated user's public profile information
   * This method returns the same information as getAuthenticated() but filtered
   * to only include publicly visible fields.
   * 
   * @param {Object} [options] - Request options
   * @returns {Promise<Object>} Public user object
   */
  async getPublicProfile(options = {}) {
    const user = await this.getAuthenticated(options);
    
    // Filter to public fields only
    const publicFields = [
      'login', 'id', 'node_id', 'avatar_url', 'gravatar_id', 'url', 'html_url',
      'followers_url', 'following_url', 'gists_url', 'starred_url', 'subscriptions_url',
      'organizations_url', 'repos_url', 'events_url', 'received_events_url', 'type',
      'site_admin', 'name', 'company', 'blog', 'location', 'email', 'hireable',
      'bio', 'twitter_username', 'public_repos', 'public_gists', 'followers',
      'following', 'created_at', 'updated_at'
    ];

    const publicUser = {};
    publicFields.forEach(field => {
      if (user[field] !== undefined) {
        publicUser[field] = user[field];
      }
    });

    return publicUser;
  }

  /**
   * Check if the authenticated user has specific permissions
   * @param {Array<string>} scopes - Required scopes to check
   * @returns {Promise<Object>} Permission check result
   */
  async checkPermissions(scopes = []) {
    try {
      // Make a request to get rate limit info which includes scope information
      const response = await this.http.get('/rate_limit');
      
      // Extract scopes from headers if available
      const headers = response.headers || {};
      const tokenScopes = (headers['x-oauth-scopes'] || '').split(',').map(s => s.trim());
      
      const hasScopes = scopes.every(scope => tokenScopes.includes(scope));
      
      return {
        hasPermissions: hasScopes,
        requiredScopes: scopes,
        availableScopes: tokenScopes,
        missingScopes: scopes.filter(scope => !tokenScopes.includes(scope))
      };
    } catch (error) {
      throw new UsersError(`Failed to check permissions: ${error.message}`);
    }
  }

  /**
   * Get user's plan information (if available)
   * This is only available for certain token types and may return null
   * 
   * @param {Object} [options] - Request options
   * @returns {Promise<Object|null>} Plan information or null
   */
  async getPlan(options = {}) {
    try {
      const user = await this.getAuthenticated(options);
      return user.plan || null;
    } catch (error) {
      // If we can't get the authenticated user, we can't get plan info
      return null;
    }
  }

  /**
   * Get user's disk usage information (if available)
   * This information is only available with certain scopes
   * 
   * @param {Object} [options] - Request options
   * @returns {Promise<Object>} Disk usage information
   */
  async getDiskUsage(options = {}) {
    try {
      const user = await this.getAuthenticated(options);
      return {
        diskUsage: user.disk_usage || 0,
        privateRepos: user.owned_private_repos || 0,
        totalPrivateRepos: user.total_private_repos || 0,
        collaborators: user.collaborators || 0
      };
    } catch (error) {
      throw new UsersError(`Failed to get disk usage: ${error.message}`);
    }
  }
}

/**
 * Export profile API functions for direct usage
 */

/**
 * Get the authenticated user
 * @param {HttpClient} http - HTTP client instance
 * @param {Object} [options] - Request options
 * @returns {Promise<Object>} User object
 */
export async function getAuthenticated(http, options = {}) {
  const api = new ProfileAPI(http);
  return api.getAuthenticated(options);
}

/**
 * Update the authenticated user
 * @param {HttpClient} http - HTTP client instance
 * @param {Object} userData - User data to update
 * @param {Object} [options] - Request options
 * @returns {Promise<Object>} Updated user object
 */
export async function updateAuthenticated(http, userData, options = {}) {
  const api = new ProfileAPI(http);
  return api.updateAuthenticated(userData, options);
}