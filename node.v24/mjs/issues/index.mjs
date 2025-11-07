#!/usr/bin/env node

/**
 * GitHub Issues SDK
 * 
 * Main entry point for the GitHub Issues API module
 */

import IssuesClient from './lib/client.mjs';
import RateLimitedIssuesClient from './lib/rateLimitedClient.mjs';
import { getAuth } from './lib/auth.mjs';
import { loadConfig, resolveRepository } from './lib/config.mjs';

// Export main classes and utilities
export { IssuesClient };
export { RateLimitedIssuesClient };
export { getAuth } from './lib/auth.mjs';
export { loadConfig, saveConfig, initConfig, resolveRepository } from './lib/config.mjs';
export * from './utils/errors.mjs';
export { paginate, collectAllPages } from './utils/pagination.mjs';
export * as format from './utils/format.mjs';

/**
 * Create a new GitHub Issues client
 * @param {Object} options - Configuration options
 * @param {string} [options.auth] - GitHub token
 * @param {string} [options.baseUrl] - Base URL for GitHub API
 * @param {string} [options.owner] - Default repository owner
 * @param {string} [options.repo] - Default repository name
 * @param {boolean} [options.enableRateLimiting] - Enable rate limiting (default: true in production)
 * @returns {IssuesClient} Issues client instance
 */
export function createClient(options = {}) {
  const auth = options.auth || getAuth();
  
  const clientOptions = {
    auth,
    baseUrl: options.baseUrl || 'https://api.github.com',
    owner: options.owner,
    repo: options.repo,
    ...options
  };
  
  // Use rate-limited client by default unless explicitly disabled
  if (options.enableRateLimiting !== false && process.env.NODE_ENV !== 'test') {
    return new RateLimitedIssuesClient(clientOptions);
  }
  
  return new IssuesClient(clientOptions);
}

/**
 * Quick access methods for common operations
 */

/**
 * List issues
 * @param {Object} options - List options
 * @returns {Promise<Array>} List of issues
 */
export async function listIssues(options = {}) {
  const client = createClient(options);
  
  if (options.org) {
    return client.listForOrg(options.org, options);
  }
  
  if (options.owner && options.repo) {
    return client.listForRepo(options);
  }
  
  return client.list(options);
}

/**
 * Get a specific issue
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {number} issueNumber - Issue number
 * @param {Object} [options] - Additional options
 * @returns {Promise<Object>} Issue details
 */
export async function getIssue(owner, repo, issueNumber, options = {}) {
  const client = createClient({ owner, repo, ...options });
  return client.get(issueNumber);
}

/**
 * Create a new issue
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {Object} data - Issue data
 * @param {Object} [options] - Additional options
 * @returns {Promise<Object>} Created issue
 */
export async function createIssue(owner, repo, data, options = {}) {
  const client = createClient({ owner, repo, ...options });
  return client.create(data);
}

/**
 * Update an issue
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {number} issueNumber - Issue number
 * @param {Object} data - Update data
 * @param {Object} [options] - Additional options
 * @returns {Promise<Object>} Updated issue
 */
export async function updateIssue(owner, repo, issueNumber, data, options = {}) {
  const client = createClient({ owner, repo, ...options });
  return client.update(issueNumber, data);
}

/**
 * Close an issue
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {number} issueNumber - Issue number
 * @param {Object} [options] - Additional options
 * @returns {Promise<Object>} Updated issue
 */
export async function closeIssue(owner, repo, issueNumber, options = {}) {
  const client = createClient({ owner, repo, ...options });
  return client.update(issueNumber, { state: 'closed', state_reason: options.reason || 'completed' });
}

/**
 * Reopen an issue
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {number} issueNumber - Issue number
 * @param {Object} [options] - Additional options
 * @returns {Promise<Object>} Updated issue
 */
export async function reopenIssue(owner, repo, issueNumber, options = {}) {
  const client = createClient({ owner, repo, ...options });
  return client.update(issueNumber, { state: 'open' });
}

/**
 * Add a comment to an issue
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {number} issueNumber - Issue number
 * @param {string} body - Comment body
 * @param {Object} [options] - Additional options
 * @returns {Promise<Object>} Created comment
 */
export async function addComment(owner, repo, issueNumber, body, options = {}) {
  const client = createClient({ owner, repo, ...options });
  return client.createComment(issueNumber, body);
}

/**
 * Update a comment
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {number} commentId - Comment ID
 * @param {string} body - New comment body
 * @param {Object} [options] - Additional options
 * @returns {Promise<Object>} Updated comment
 */
export async function updateComment(owner, repo, commentId, body, options = {}) {
  const client = createClient({ owner, repo, ...options });
  return client.updateComment(commentId, body);
}

/**
 * Delete a comment
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {number} commentId - Comment ID
 * @param {Object} [options] - Additional options
 * @returns {Promise<void>}
 */
export async function deleteComment(owner, repo, commentId, options = {}) {
  const client = createClient({ owner, repo, ...options });
  return client.deleteComment(commentId);
}

/**
 * Add labels to an issue
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {number} issueNumber - Issue number
 * @param {Array<string>} labels - Labels to add
 * @param {Object} [options] - Additional options
 * @returns {Promise<Array>} Updated labels
 */
export async function addLabels(owner, repo, issueNumber, labels, options = {}) {
  const client = createClient({ owner, repo, ...options });
  return client.addLabels(issueNumber, labels);
}

/**
 * Remove a label from an issue
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {number} issueNumber - Issue number
 * @param {string} label - Label to remove
 * @param {Object} [options] - Additional options
 * @returns {Promise<Array>} Updated labels
 */
export async function removeLabel(owner, repo, issueNumber, label, options = {}) {
  const client = createClient({ owner, repo, ...options });
  return client.removeLabel(issueNumber, label);
}

/**
 * Add assignees to an issue
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {number} issueNumber - Issue number
 * @param {Array<string>} assignees - Usernames to assign
 * @param {Object} [options] - Additional options
 * @returns {Promise<Object>} Updated issue
 */
export async function addAssignees(owner, repo, issueNumber, assignees, options = {}) {
  const client = createClient({ owner, repo, ...options });
  return client.addAssignees(issueNumber, assignees);
}

/**
 * Remove assignees from an issue
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {number} issueNumber - Issue number
 * @param {Array<string>} assignees - Usernames to remove
 * @param {Object} [options] - Additional options
 * @returns {Promise<Object>} Updated issue
 */
export async function removeAssignees(owner, repo, issueNumber, assignees, options = {}) {
  const client = createClient({ owner, repo, ...options });
  return client.removeAssignees(issueNumber, assignees);
}

/**
 * Lock an issue
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {number} issueNumber - Issue number
 * @param {string} [lockReason] - Lock reason
 * @param {Object} [options] - Additional options
 * @returns {Promise<void>}
 */
export async function lockIssue(owner, repo, issueNumber, lockReason = null, options = {}) {
  const client = createClient({ owner, repo, ...options });
  return client.lock(issueNumber, lockReason);
}

/**
 * Unlock an issue
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {number} issueNumber - Issue number
 * @param {Object} [options] - Additional options
 * @returns {Promise<void>}
 */
export async function unlockIssue(owner, repo, issueNumber, options = {}) {
  const client = createClient({ owner, repo, ...options });
  return client.unlock(issueNumber);
}

// Default export
export default {
  createClient,
  IssuesClient,
  RateLimitedIssuesClient,
  listIssues,
  getIssue,
  createIssue,
  updateIssue,
  closeIssue,
  reopenIssue,
  addComment,
  updateComment,
  deleteComment,
  addLabels,
  removeLabel,
  addAssignees,
  removeAssignees,
  lockIssue,
  unlockIssue
};