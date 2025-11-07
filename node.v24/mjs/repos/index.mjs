#!/usr/bin/env node

/**
 * @fileoverview GitHub Repository SDK - Main entry point for library usage
 * @module @github-api/repos
 * @version 1.0.0
 */

import { RepoClient } from './src/client/RepoClient.mjs';
import * as repositories from './src/api/repositories.mjs';
import * as collaborators from './src/api/collaborators.mjs';
import * as branches from './src/api/branches.mjs';
import * as tags from './src/api/tags.mjs';
import * as webhooks from './src/api/webhooks.mjs';
import * as security from './src/api/security.mjs';
import * as rules from './src/api/rules.mjs';
import { RepoError, AuthError, ValidationError, RateLimitError } from './src/utils/errors.mjs';
import { paginate, paginateAll } from './src/utils/pagination.mjs';
import { validateInput, validateRepository } from './src/utils/validation.mjs';

/**
 * Create a new GitHub Repository API client
 * @param {Object} options - Configuration options
 * @param {string} options.token - GitHub personal access token
 * @param {string} [options.baseUrl] - GitHub API base URL (default: https://api.github.com)
 * @param {Object} [options.rateLimiting] - Rate limiting configuration
 * @param {number} [options.timeout] - Request timeout in milliseconds
 * @returns {RepoClient} Configured repository client
 * 
 * @example
 * ```javascript
 * import { createClient } from '@github-api/repos';
 * 
 * const client = createClient({
 *   token: process.env.GITHUB_TOKEN,
 *   rateLimiting: { enabled: true }
 * });
 * 
 * // Get repository information
 * const repo = await client.repositories.get('octocat', 'Hello-World');
 * console.log(`Repository: ${repo.full_name}`);
 * ```
 */
export function createClient(options = {}) {
  return new RepoClient(options);
}

/**
 * Default export - RepoClient class
 */
export default RepoClient;

/**
 * Named exports for direct API usage
 */
export {
  // Client
  RepoClient,
  
  // API modules
  repositories,
  collaborators,
  branches,
  tags,
  webhooks,
  security,
  rules,
  
  // Error classes
  RepoError,
  AuthError,
  ValidationError,
  RateLimitError,
  
  // Utility functions
  paginate,
  paginateAll,
  validateInput,
  validateRepository
};

/**
 * Convenience method to quickly get a repository
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {Object} options - Client options
 * @returns {Promise<Object>} Repository data
 * 
 * @example
 * ```javascript
 * import { getRepository } from '@github-api/repos';
 * 
 * const repo = await getRepository('octocat', 'Hello-World', {
 *   token: process.env.GITHUB_TOKEN
 * });
 * ```
 */
export async function getRepository(owner, repo, options = {}) {
  const client = createClient(options);
  return await client.repositories.get(owner, repo);
}

/**
 * Convenience method to list user repositories
 * @param {string} [username] - GitHub username (optional, uses authenticated user if not provided)
 * @param {Object} options - Client and query options
 * @returns {Promise<Array>} Array of repositories
 * 
 * @example
 * ```javascript
 * import { listRepositories } from '@github-api/repos';
 * 
 * const repos = await listRepositories('octocat', {
 *   token: process.env.GITHUB_TOKEN,
 *   type: 'public',
 *   sort: 'updated'
 * });
 * ```
 */
export async function listRepositories(username, options = {}) {
  const client = createClient(options);
  if (username) {
    return await client.repositories.listForUser(username, options);
  }
  return await client.repositories.listForAuthenticatedUser(options);
}

/**
 * Convenience method to create a repository
 * @param {Object} repoData - Repository creation data
 * @param {Object} options - Client options
 * @returns {Promise<Object>} Created repository data
 * 
 * @example
 * ```javascript
 * import { createRepository } from '@github-api/repos';
 * 
 * const repo = await createRepository({
 *   name: 'my-new-repo',
 *   description: 'A test repository',
 *   private: false
 * }, {
 *   token: process.env.GITHUB_TOKEN
 * });
 * ```
 */
export async function createRepository(repoData, options = {}) {
  const client = createClient(options);
  return await client.repositories.create(repoData);
}

/**
 * Package metadata
 */
export const packageInfo = {
  name: '@github-api/repos',
  version: '1.0.0',
  description: 'GitHub Repository API client and CLI',
  homepage: 'https://github.com/github-api-module/repos'
};