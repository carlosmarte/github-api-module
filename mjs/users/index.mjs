#!/usr/bin/env node

/**
 * @fileoverview GitHub Users SDK - Main entry point for library usage
 * @module @github-api/users
 * @version 1.0.0
 */

import { UsersClient } from './src/client/UsersClient.mjs';
import * as profile from './src/api/profile.mjs';
import * as emails from './src/api/emails.mjs';
import * as discovery from './src/api/discovery.mjs';
import * as context from './src/api/context.mjs';
import { UsersError, AuthError, ValidationError, RateLimitError } from './src/utils/errors.mjs';
import { paginate, paginateAll } from './src/utils/pagination.mjs';
import { validateInput, validateEmail } from './src/utils/validation.mjs';

/**
 * Create a new GitHub Users API client
 * @param {Object} options - Configuration options
 * @param {string} options.token - GitHub personal access token
 * @param {string} [options.baseUrl] - GitHub API base URL (default: https://api.github.com)
 * @param {Object} [options.rateLimiting] - Rate limiting configuration
 * @param {number} [options.timeout] - Request timeout in milliseconds
 * @returns {UsersClient} Configured users client
 * 
 * @example
 * ```javascript
 * import { createClient } from '@github-api/users';
 * 
 * const client = createClient({
 *   token: process.env.GITHUB_TOKEN,
 *   rateLimiting: { enabled: true }
 * });
 * 
 * // Get authenticated user information
 * const user = await client.profile.getAuthenticated();
 * console.log(`User: ${user.login}`);
 * ```
 */
export function createClient(options = {}) {
  return new UsersClient(options);
}

/**
 * Default export - UsersClient class
 */
export default UsersClient;

/**
 * Named exports for direct API usage
 */
export {
  // Client
  UsersClient,
  
  // API modules
  profile,
  emails,
  discovery,
  context,
  
  // Error classes
  UsersError,
  AuthError,
  ValidationError,
  RateLimitError,
  
  // Utility functions
  paginate,
  paginateAll,
  validateInput,
  validateEmail
};

/**
 * Convenience method to get authenticated user
 * @param {Object} options - Client options
 * @returns {Promise<Object>} User data
 * 
 * @example
 * ```javascript
 * import { getAuthenticatedUser } from '@github-api/users';
 * 
 * const user = await getAuthenticatedUser({
 *   token: process.env.GITHUB_TOKEN
 * });
 * ```
 */
export async function getAuthenticatedUser(options = {}) {
  const client = createClient(options);
  return await client.profile.getAuthenticated();
}

/**
 * Convenience method to get user by username
 * @param {string} username - GitHub username
 * @param {Object} options - Client options
 * @returns {Promise<Object>} User data
 * 
 * @example
 * ```javascript
 * import { getUser } from '@github-api/users';
 * 
 * const user = await getUser('octocat', {
 *   token: process.env.GITHUB_TOKEN
 * });
 * ```
 */
export async function getUser(username, options = {}) {
  const client = createClient(options);
  return await client.discovery.getByUsername(username);
}

/**
 * Convenience method to list users
 * @param {Object} options - Client and query options
 * @returns {Promise<Array>} Array of users
 * 
 * @example
 * ```javascript
 * import { listUsers } from '@github-api/users';
 * 
 * const users = await listUsers({
 *   token: process.env.GITHUB_TOKEN,
 *   per_page: 50
 * });
 * ```
 */
export async function listUsers(options = {}) {
  const client = createClient(options);
  return await client.discovery.list(options);
}

/**
 * Convenience method to list authenticated user's emails
 * @param {Object} options - Client options
 * @returns {Promise<Array>} Array of email addresses
 * 
 * @example
 * ```javascript
 * import { listEmails } from '@github-api/users';
 * 
 * const emails = await listEmails({
 *   token: process.env.GITHUB_TOKEN
 * });
 * ```
 */
export async function listEmails(options = {}) {
  const client = createClient(options);
  return await client.emails.list();
}

/**
 * Package metadata
 */
export const packageInfo = {
  name: '@github-api/users',
  version: '1.0.0',
  description: 'GitHub Users API client and CLI',
  homepage: 'https://github.com/github-api-module/users'
};