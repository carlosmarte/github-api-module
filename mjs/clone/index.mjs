#!/usr/bin/env node

/**
 * @fileoverview Git Repository Management SDK - Main entry point for library usage
 * @module @thinkeloquent/clone
 * @version 1.0.0
 */

import { GitClient } from './src/client/GitClient.mjs';
import * as operations from './src/api/operations.mjs';
import { 
  GitError, 
  AuthError, 
  ValidationError, 
  RepositoryError, 
  CloneError, 
  NetworkError, 
  FileSystemError, 
  ConfigError,
  wrapError,
  isErrorType,
  getErrorInfo
} from './src/utils/errors.mjs';
import { 
  validateRepository, 
  validatePath, 
  validateDirectoryName, 
  validateGitRef, 
  validateGitHubToken, 
  validateCloneOptions, 
  validateRepositoryOperation 
} from './src/utils/validation.mjs';
import {
  GitProgressManager,
  createProgressManager,
  createSilentProgressManager,
  createCLIProgressManager,
  CLONE_STAGES
} from './src/utils/progress.mjs';

/**
 * Create a new Git Repository Management client
 * @param {Object} options - Configuration options
 * @param {string} [options.baseDir='./repositories'] - Base directory for repositories
 * @param {string} [options.token] - GitHub personal access token
 * @param {Object} [options.gitOptions] - Additional simple-git options
 * @param {boolean} [options.verbose] - Enable verbose logging
 * @param {number} [options.timeout] - Operation timeout in milliseconds
 * @returns {GitClient} Configured Git client
 * 
 * @example
 * ```javascript
 * import { createClient } from '@thinkeloquent/clone';
 * 
 * const client = createClient({
 *   baseDir: './my-repos',
 *   token: process.env.GITHUB_TOKEN,
 *   verbose: true
 * });
 * 
 * // Clone a repository
 * const repo = await client.clone('https://github.com/octocat/Hello-World.git', 'hello-world');
 * console.log(`Cloned: ${repo.name}`);
 * 
 * // Pull latest changes
 * const pullResult = await client.pull('hello-world');
 * console.log(`Pull result: ${pullResult.result.summary.changes} changes`);
 * 
 * // Push changes
 * const pushResult = await client.push('hello-world');
 * console.log(`Push completed: ${pushResult.name}`);
 * ```
 */
export function createClient(options = {}) {
  return new GitClient(options);
}

/**
 * Default export - GitClient class
 */
export default GitClient;

/**
 * Named exports for direct usage
 */
export {
  // Client
  GitClient,
  
  // API operations
  operations,
  
  // Progress management
  GitProgressManager,
  createProgressManager,
  createSilentProgressManager,
  createCLIProgressManager,
  CLONE_STAGES,
  
  // Error classes
  GitError,
  AuthError,
  ValidationError,
  RepositoryError,
  CloneError,
  NetworkError,
  FileSystemError,
  ConfigError,
  
  // Error utilities
  wrapError,
  isErrorType,
  getErrorInfo,
  
  // Validation functions
  validateRepository,
  validatePath,
  validateDirectoryName,
  validateGitRef,
  validateGitHubToken,
  validateCloneOptions,
  validateRepositoryOperation
};

/**
 * Re-export high-level operations for convenience
 */
export const {
  cloneRepository,
  pullRepository,
  pushRepository,
  getRepositoryStatus,
  listRepositories,
  initRepository,
  syncRepository,
  batchClone,
  batchSync,
  getRepositoryHealth
} = operations;

/**
 * Convenience method to quickly clone a repository
 * @param {string} repoUrl - Repository URL
 * @param {string} [targetDir] - Target directory name
 * @param {Object} options - Client and clone options
 * @returns {Promise<Object>} Repository data
 * 
 * @example
 * ```javascript
 * import { clone } from '@thinkeloquent/clone';
 * 
 * // Basic clone with progress callbacks
 * const repo = await clone(
 *   'https://github.com/octocat/Hello-World.git',
 *   'hello-world',
 *   {
 *     token: process.env.GITHUB_TOKEN,
 *     depth: 1,
 *     branch: 'main',
 *     onProgress: (data) => console.log(`${data.percentage}% - ${data.message}`),
 *     onStageChange: (data) => console.log(`Stage: ${data.stage}`)
 *   }
 * );
 * 
 * // Clone with CLI progress bar
 * const repo2 = await clone(
 *   'https://github.com/octocat/Hello-World.git',
 *   'hello-world-2',
 *   {
 *     token: process.env.GITHUB_TOKEN,
 *     showProgress: true
 *   }
 * );
 * ```
 */
export async function clone(repoUrl, targetDir, options = {}) {
  return await cloneRepository(repoUrl, targetDir, {
    client: { 
      token: options.token,
      baseDir: options.baseDir,
      verbose: options.verbose 
    },
    clone: {
      branch: options.branch,
      depth: options.depth,
      bare: options.bare
    },
    onProgress: options.onProgress,
    onStageChange: options.onStageChange,
    onComplete: options.onComplete,
    showProgress: options.showProgress,
    progressManager: options.progressManager
  });
}

/**
 * Convenience method to quickly pull repository updates
 * @param {string} repoName - Repository name or path
 * @param {Object} options - Client and pull options
 * @returns {Promise<Object>} Pull result
 * 
 * @example
 * ```javascript
 * import { pull } from '@thinkeloquent/clone';
 * 
 * const result = await pull('hello-world', {
 *   token: process.env.GITHUB_TOKEN,
 *   remote: 'origin',
 *   branch: 'main',
 *   rebase: true
 * });
 * ```
 */
export async function pull(repoName, options = {}) {
  return await pullRepository(repoName, {
    client: { 
      token: options.token,
      baseDir: options.baseDir,
      verbose: options.verbose 
    },
    pull: {
      remote: options.remote,
      branch: options.branch,
      rebase: options.rebase
    }
  });
}

/**
 * Convenience method to quickly push repository changes
 * @param {string} repoName - Repository name or path
 * @param {Object} options - Client and push options
 * @returns {Promise<Object>} Push result
 * 
 * @example
 * ```javascript
 * import { push } from '@thinkeloquent/clone';
 * 
 * const result = await push('hello-world', {
 *   token: process.env.GITHUB_TOKEN,
 *   remote: 'origin',
 *   branch: 'main',
 *   force: false
 * });
 * ```
 */
export async function push(repoName, options = {}) {
  return await pushRepository(repoName, {
    client: { 
      token: options.token,
      baseDir: options.baseDir,
      verbose: options.verbose 
    },
    push: {
      remote: options.remote,
      branch: options.branch,
      force: options.force,
      setUpstream: options.setUpstream
    }
  });
}

/**
 * Convenience method to get repository status
 * @param {string} repoName - Repository name or path
 * @param {Object} options - Client options
 * @returns {Promise<Object>} Repository status
 * 
 * @example
 * ```javascript
 * import { status } from '@thinkeloquent/clone';
 * 
 * const repoStatus = await status('hello-world', {
 *   baseDir: './my-repos'
 * });
 * ```
 */
export async function status(repoName, options = {}) {
  return await getRepositoryStatus(repoName, {
    client: { 
      token: options.token,
      baseDir: options.baseDir,
      verbose: options.verbose 
    }
  });
}

/**
 * Convenience method to list all repositories
 * @param {Object} options - Client options
 * @returns {Promise<Array>} Array of repository information
 * 
 * @example
 * ```javascript
 * import { list } from '@thinkeloquent/clone';
 * 
 * const repos = await list({
 *   baseDir: './my-repos'
 * });
 * console.log(`Found ${repos.length} repositories`);
 * ```
 */
export async function list(options = {}) {
  return await listRepositories({
    client: { 
      token: options.token,
      baseDir: options.baseDir,
      verbose: options.verbose 
    }
  });
}

/**
 * Convenience method to initialize a new repository
 * @param {string} repoName - Repository name
 * @param {Object} options - Client and init options
 * @returns {Promise<Object>} Repository information
 * 
 * @example
 * ```javascript
 * import { init } from '@thinkeloquent/clone';
 * 
 * const repo = await init('my-new-repo', {
 *   baseDir: './my-repos',
 *   bare: false
 * });
 * ```
 */
export async function init(repoName, options = {}) {
  return await initRepository(repoName, {
    client: { 
      token: options.token,
      baseDir: options.baseDir,
      verbose: options.verbose 
    },
    init: {
      bare: options.bare
    }
  });
}

/**
 * Convenience method to sync repository (pull + optional push)
 * @param {string} repoName - Repository name or path
 * @param {Object} options - Client and sync options
 * @returns {Promise<Object>} Sync result
 * 
 * @example
 * ```javascript
 * import { sync } from '@thinkeloquent/clone';
 * 
 * const result = await sync('hello-world', {
 *   token: process.env.GITHUB_TOKEN,
 *   autoPush: true
 * });
 * ```
 */
export async function sync(repoName, options = {}) {
  return await syncRepository(repoName, {
    client: { 
      token: options.token,
      baseDir: options.baseDir,
      verbose: options.verbose 
    },
    pull: {
      remote: options.remote,
      branch: options.branch,
      rebase: options.rebase
    },
    push: {
      remote: options.remote,
      branch: options.branch,
      force: options.force
    },
    autoPush: options.autoPush
  });
}

/**
 * Package metadata
 */
export const packageInfo = {
  name: '@thinkeloquent/clone',
  version: '1.0.0',
  description: 'Git Repository Management SDK and CLI - Local git operations with simple-git',
  homepage: 'https://github.com/github-api-module/monorepo/tree/main/mjs/clone'
};