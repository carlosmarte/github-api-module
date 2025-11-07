#!/usr/bin/env node

import PullRequestClient from './lib/client.mjs';
import RateLimitedPullRequestClient from './lib/rateLimitedClient.mjs';
import { getAuth } from './lib/auth.mjs';
import { loadConfig } from './lib/config.mjs';

export { PullRequestClient };
export { RateLimitedPullRequestClient };
export { getAuth } from './lib/auth.mjs';
export { loadConfig } from './lib/config.mjs';
export * as types from './lib/types.mjs';
export * as utils from './utils/format.mjs';
export { paginate } from './utils/pagination.mjs';
export { ApiError, AuthError, ValidationError, RateLimitError } from './utils/errors.mjs';

/**
 * Create a new GitHub Pull Request client
 * @param {Object} options - Configuration options
 * @param {string} [options.auth] - GitHub token
 * @param {string} [options.baseUrl] - Base URL for GitHub API
 * @param {string} [options.owner] - Default repository owner
 * @param {string} [options.repo] - Default repository name
 * @param {boolean} [options.enableRateLimiting] - Enable rate limiting (default: true in production)
 * @returns {PullRequestClient} Pull Request client instance
 */
export function createClient(options = {}) {
  const config = loadConfig();
  const auth = options.auth || getAuth();
  
  const clientOptions = {
    auth,
    baseUrl: options.baseUrl || config.baseUrl || 'https://api.github.com',
    owner: options.owner || config.owner,
    repo: options.repo || config.repo,
    enableRateLimiting: options.enableRateLimiting
  };
  
  // Use rate-limited client by default unless explicitly disabled
  if (options.enableRateLimiting !== false && process.env.NODE_ENV !== 'test') {
    return new RateLimitedPullRequestClient(clientOptions);
  }
  
  return new PullRequestClient(clientOptions);
}

/**
 * Quick access methods for common operations
 */

/**
 * List pull requests
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {Object} [options] - Filter options
 * @returns {Promise<Array>} List of pull requests
 */
export async function listPullRequests(owner, repo, options = {}) {
  const client = createClient({ owner, repo });
  return client.list(options);
}

/**
 * Get a specific pull request
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {number} pullNumber - Pull request number
 * @returns {Promise<Object>} Pull request details
 */
export async function getPullRequest(owner, repo, pullNumber) {
  const client = createClient({ owner, repo });
  return client.get(pullNumber);
}

/**
 * Create a new pull request
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {Object} data - Pull request data
 * @returns {Promise<Object>} Created pull request
 */
export async function createPullRequest(owner, repo, data) {
  const client = createClient({ owner, repo });
  return client.create(data);
}

/**
 * Update a pull request
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {number} pullNumber - Pull request number
 * @param {Object} data - Update data
 * @returns {Promise<Object>} Updated pull request
 */
export async function updatePullRequest(owner, repo, pullNumber, data) {
  const client = createClient({ owner, repo });
  return client.update(pullNumber, data);
}

/**
 * Merge a pull request
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {number} pullNumber - Pull request number
 * @param {Object} [options] - Merge options
 * @returns {Promise<Object>} Merge result
 */
export async function mergePullRequest(owner, repo, pullNumber, options = {}) {
  const client = createClient({ owner, repo });
  return client.merge(pullNumber, options);
}

/**
 * Close a pull request
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {number} pullNumber - Pull request number
 * @returns {Promise<Object>} Updated pull request
 */
export async function closePullRequest(owner, repo, pullNumber) {
  const client = createClient({ owner, repo });
  return client.update(pullNumber, { state: 'closed' });
}

/**
 * Reopen a pull request
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {number} pullNumber - Pull request number
 * @returns {Promise<Object>} Updated pull request
 */
export async function reopenPullRequest(owner, repo, pullNumber) {
  const client = createClient({ owner, repo });
  return client.update(pullNumber, { state: 'open' });
}

export default {
  createClient,
  listPullRequests,
  getPullRequest,
  createPullRequest,
  updatePullRequest,
  mergePullRequest,
  closePullRequest,
  reopenPullRequest
};