/**
 * @fileoverview GitHub Users Discovery API
 * @module DiscoveryAPI
 */

import { validateUsername, validateUserId, validatePagination } from '../utils/validation.mjs';
import { NotFoundError, ValidationError, UsersError } from '../utils/errors.mjs';
import { buildPaginationParams } from '../utils/pagination.mjs';

/**
 * Discovery API for public user operations
 */
export class DiscoveryAPI {
  /**
   * Create DiscoveryAPI instance
   * @param {HttpClient} http - HTTP client instance
   */
  constructor(http) {
    this.http = http;
  }

  /**
   * List users
   * Lists all users, in the order that they signed up on GitHub.
   * This list includes personal user accounts and organization accounts.
   * 
   * @param {Object} [options] - Request options
   * @param {number} [options.since] - A user ID. Only return users with an ID greater than this ID.
   * @param {number} [options.per_page=30] - Results per page (max 100)
   * @returns {Promise<Array>} Array of user objects
   * 
   * @example
   * ```javascript
   * // List first 30 users
   * const users = await client.discovery.list();
   * 
   * // List users starting from ID 1000
   * const users = await client.discovery.list({ since: 1000, per_page: 50 });
   * ```
   */
  async list(options = {}) {
    const params = buildPaginationParams(validatePagination(options));

    try {
      const response = await this.http.get('/users', { params, ...options });
      return Array.isArray(response) ? response : [response];
    } catch (error) {
      throw new UsersError(`Failed to list users: ${error.message}`);
    }
  }

  /**
   * Get a user by username
   * Provides publicly available information about someone with a GitHub account.
   * 
   * @param {string} username - The handle for the GitHub user account
   * @param {Object} [options] - Request options
   * @returns {Promise<Object>} User object
   * 
   * @example
   * ```javascript
   * const user = await client.discovery.getByUsername('octocat');
   * console.log(`User: ${user.login} (${user.name})`);
   * ```
   */
  async getByUsername(username, options = {}) {
    if (!validateUsername(username)) {
      throw new ValidationError('Invalid username format');
    }

    try {
      const response = await this.http.get(`/users/${username}`, options);
      return response;
    } catch (error) {
      if (error.status === 404) {
        throw new NotFoundError(`User '${username}' not found`);
      }
      throw error;
    }
  }

  /**
   * Get a user by ID
   * Provides publicly available information about a GitHub user account.
   * This method uses the user's durable ID instead of username.
   * 
   * @param {number} accountId - The unique identifier of the account
   * @param {Object} [options] - Request options
   * @returns {Promise<Object>} User object
   * 
   * @example
   * ```javascript
   * const user = await client.discovery.getById(583231);
   * console.log(`User: ${user.login} (ID: ${user.id})`);
   * ```
   */
  async getById(accountId, options = {}) {
    if (!validateUserId(accountId)) {
      throw new ValidationError('Invalid user ID. Must be a positive integer.');
    }

    try {
      const response = await this.http.get(`/user/${accountId}`, options);
      return response;
    } catch (error) {
      if (error.status === 404) {
        throw new NotFoundError(`User with ID '${accountId}' not found`);
      }
      throw error;
    }
  }

  /**
   * Search for users by various criteria
   * This is a convenience method that uses the list endpoint with filtering
   * 
   * @param {Object} criteria - Search criteria
   * @param {string} [criteria.type] - User type filter ('User' or 'Organization')
   * @param {number} [criteria.minId] - Minimum user ID
   * @param {number} [criteria.maxId] - Maximum user ID (requires pagination)
   * @param {Object} [options] - Request options
   * @returns {Promise<Array>} Array of matching users
   */
  async search(criteria = {}, options = {}) {
    const searchOptions = { ...options };
    
    if (criteria.minId) {
      searchOptions.since = criteria.minId - 1;
    }

    let users = await this.list(searchOptions);

    // Apply client-side filtering
    if (criteria.type) {
      users = users.filter(user => user.type === criteria.type);
    }

    if (criteria.maxId) {
      users = users.filter(user => user.id <= criteria.maxId);
    }

    return users;
  }

  /**
   * Check if a username exists
   * @param {string} username - Username to check
   * @param {Object} [options] - Request options
   * @returns {Promise<boolean>} True if username exists
   */
  async exists(username, options = {}) {
    try {
      await this.getByUsername(username, options);
      return true;
    } catch (error) {
      if (error instanceof NotFoundError) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get user's public repositories count
   * @param {string} username - Username
   * @param {Object} [options] - Request options
   * @returns {Promise<number>} Number of public repositories
   */
  async getPublicReposCount(username, options = {}) {
    const user = await this.getByUsername(username, options);
    return user.public_repos || 0;
  }

  /**
   * Get user's follower count
   * @param {string} username - Username
   * @param {Object} [options] - Request options
   * @returns {Promise<number>} Number of followers
   */
  async getFollowerCount(username, options = {}) {
    const user = await this.getByUsername(username, options);
    return user.followers || 0;
  }

  /**
   * Get user's following count
   * @param {string} username - Username
   * @param {Object} [options] - Request options
   * @returns {Promise<number>} Number of users being followed
   */
  async getFollowingCount(username, options = {}) {
    const user = await this.getByUsername(username, options);
    return user.following || 0;
  }

  /**
   * Get multiple users by usernames
   * @param {Array<string>} usernames - Array of usernames
   * @param {Object} [options] - Options
   * @param {boolean} [options.continueOnError=false] - Continue if some users are not found
   * @returns {Promise<Object>} Result with successful and failed lookups
   */
  async getMultipleByUsername(usernames, options = {}) {
    const successful = [];
    const failed = [];

    for (const username of usernames) {
      try {
        const user = await this.getByUsername(username, options);
        successful.push(user);
      } catch (error) {
        if (options.continueOnError) {
          failed.push({
            username,
            error: error.message
          });
        } else {
          throw error;
        }
      }
    }

    return { successful, failed };
  }

  /**
   * Get user statistics
   * @param {string} username - Username
   * @param {Object} [options] - Request options
   * @returns {Promise<Object>} User statistics
   */
  async getStats(username, options = {}) {
    const user = await this.getByUsername(username, options);
    
    return {
      username: user.login,
      name: user.name,
      id: user.id,
      type: user.type,
      siteAdmin: user.site_admin,
      publicRepos: user.public_repos || 0,
      publicGists: user.public_gists || 0,
      followers: user.followers || 0,
      following: user.following || 0,
      accountAge: user.created_at ? this.calculateAccountAge(user.created_at) : null,
      lastActivity: user.updated_at,
      hasCompany: !!user.company,
      hasLocation: !!user.location,
      hasBlog: !!user.blog,
      hasBio: !!user.bio,
      hireable: user.hireable
    };
  }

  /**
   * Calculate account age in days
   * @private
   * @param {string} createdAt - ISO date string
   * @returns {number} Age in days
   */
  calculateAccountAge(createdAt) {
    const created = new Date(createdAt);
    const now = new Date();
    const diffMs = now - created;
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Get users by type (User or Organization)
   * @param {string} type - Type to filter by ('User' or 'Organization')
   * @param {Object} [options] - Request options
   * @returns {Promise<Array>} Array of users of specified type
   */
  async getByType(type, options = {}) {
    if (!['User', 'Organization'].includes(type)) {
      throw new ValidationError('Type must be either "User" or "Organization"');
    }

    return this.search({ type }, options);
  }

  /**
   * Get users in ID range
   * @param {number} minId - Minimum ID (inclusive)
   * @param {number} maxId - Maximum ID (inclusive)
   * @param {Object} [options] - Request options
   * @returns {Promise<Array>} Array of users in range
   */
  async getByIdRange(minId, maxId, options = {}) {
    if (!validateUserId(minId) || !validateUserId(maxId)) {
      throw new ValidationError('Both minId and maxId must be positive integers');
    }

    if (minId > maxId) {
      throw new ValidationError('minId must be less than or equal to maxId');
    }

    return this.search({ minId, maxId }, options);
  }
}

/**
 * Export discovery API functions for direct usage
 */

/**
 * List users
 * @param {HttpClient} http - HTTP client instance
 * @param {Object} [options] - Request options
 * @returns {Promise<Array>} Array of user objects
 */
export async function list(http, options = {}) {
  const api = new DiscoveryAPI(http);
  return api.list(options);
}

/**
 * Get a user by username
 * @param {HttpClient} http - HTTP client instance
 * @param {string} username - Username
 * @param {Object} [options] - Request options
 * @returns {Promise<Object>} User object
 */
export async function getByUsername(http, username, options = {}) {
  const api = new DiscoveryAPI(http);
  return api.getByUsername(username, options);
}

/**
 * Get a user by ID
 * @param {HttpClient} http - HTTP client instance
 * @param {number} accountId - User account ID
 * @param {Object} [options] - Request options
 * @returns {Promise<Object>} User object
 */
export async function getById(http, accountId, options = {}) {
  const api = new DiscoveryAPI(http);
  return api.getById(accountId, options);
}