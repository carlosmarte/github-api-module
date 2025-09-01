/**
 * @fileoverview High-level Git operations API built on GitClient
 * @module operations
 */

import { GitClient } from '../client/GitClient.mjs';
import { GitError, ValidationError } from '../utils/errors.mjs';
import { validateRepository, validatePath } from '../utils/validation.mjs';
import { createSilentProgressManager, createCLIProgressManager } from '../utils/progress.mjs';

/**
 * Create a GitClient instance with provided options
 * @param {Object} options - Client configuration options
 * @returns {GitClient} Configured GitClient instance
 */
function createClient(options = {}) {
  return new GitClient(options);
}

/**
 * Clone a repository with progress tracking and error handling
 * 
 * @param {string} repoUrl - Repository URL to clone
 * @param {string} [targetDir] - Target directory name
 * @param {Object} [options] - Operation options
 * @param {Object} [options.client] - Client configuration
 * @param {Object} [options.clone] - Clone-specific options
 * @param {Function} [options.onProgress] - Progress callback (receives detailed progress data)
 * @param {Function} [options.onStageChange] - Stage change callback
 * @param {Function} [options.onComplete] - Completion callback
 * @param {boolean} [options.showProgress=false] - Show CLI progress bar
 * @param {Object} [options.progressManager] - Custom progress manager instance
 * @returns {Promise<Object>} Repository information
 * 
 * @example
 * ```javascript
 * import { cloneRepository } from '@thinkeloquent/clone/api/operations';
 * 
 * const repo = await cloneRepository(
 *   'https://github.com/octocat/Hello-World.git',
 *   'hello-world',
 *   {
 *     client: { token: process.env.GITHUB_TOKEN },
 *     clone: { depth: 1, branch: 'main' },
 *     onProgress: (data) => console.log(`${data.percentage}%: ${data.message}`),
 *     onStageChange: (data) => console.log(`Stage: ${data.stage}`)
 *   }
 * );
 * ```
 */
export async function cloneRepository(repoUrl, targetDir, options = {}) {
  try {
    const client = createClient(options.client);
    
    // Create appropriate progress manager
    let progressManager;
    if (options.progressManager) {
      progressManager = options.progressManager;
    } else if (options.showProgress) {
      progressManager = createCLIProgressManager({
        onProgress: options.onProgress,
        onStageChange: options.onStageChange,
        onComplete: options.onComplete
      });
    } else {
      progressManager = createSilentProgressManager({
        onProgress: options.onProgress,
        onStageChange: options.onStageChange,
        onComplete: options.onComplete
      });
    }

    const result = await client.clone(repoUrl, targetDir, {
      ...options.clone,
      progressManager,
      onProgress: options.onProgress,
      onStageChange: options.onStageChange,
      onComplete: options.onComplete
    });

    return result;
  } catch (error) {
    throw new GitError(`Clone operation failed: ${error.message}`, error);
  }
}

/**
 * Pull updates for a repository
 * 
 * @param {string} repoName - Repository name or path
 * @param {Object} [options] - Operation options
 * @param {Object} [options.client] - Client configuration
 * @param {Object} [options.pull] - Pull-specific options
 * @returns {Promise<Object>} Pull result
 */
export async function pullRepository(repoName, options = {}) {
  try {
    const client = createClient(options.client);
    return await client.pull(repoName, options.pull);
  } catch (error) {
    throw new GitError(`Pull operation failed: ${error.message}`, error);
  }
}

/**
 * Push changes for a repository
 * 
 * @param {string} repoName - Repository name or path
 * @param {Object} [options] - Operation options
 * @param {Object} [options.client] - Client configuration
 * @param {Object} [options.push] - Push-specific options
 * @returns {Promise<Object>} Push result
 */
export async function pushRepository(repoName, options = {}) {
  try {
    const client = createClient(options.client);
    return await client.push(repoName, options.push);
  } catch (error) {
    throw new GitError(`Push operation failed: ${error.message}`, error);
  }
}

/**
 * Get repository status and information
 * 
 * @param {string} repoName - Repository name or path
 * @param {Object} [options] - Operation options
 * @param {Object} [options.client] - Client configuration
 * @returns {Promise<Object>} Repository status
 */
export async function getRepositoryStatus(repoName, options = {}) {
  try {
    const client = createClient(options.client);
    return await client.status(repoName);
  } catch (error) {
    throw new GitError(`Status operation failed: ${error.message}`, error);
  }
}

/**
 * List all managed repositories
 * 
 * @param {Object} [options] - Operation options
 * @param {Object} [options.client] - Client configuration
 * @returns {Promise<Array>} Array of repository information
 */
export async function listRepositories(options = {}) {
  try {
    const client = createClient(options.client);
    return await client.listRepositories();
  } catch (error) {
    throw new GitError(`List operation failed: ${error.message}`, error);
  }
}

/**
 * Initialize a new repository
 * 
 * @param {string} repoName - Repository name
 * @param {Object} [options] - Operation options
 * @param {Object} [options.client] - Client configuration
 * @param {Object} [options.init] - Init-specific options
 * @returns {Promise<Object>} Repository information
 */
export async function initRepository(repoName, options = {}) {
  try {
    const client = createClient(options.client);
    return await client.init(repoName, options.init);
  } catch (error) {
    throw new GitError(`Init operation failed: ${error.message}`, error);
  }
}

/**
 * Sync repository (pull then optionally push)
 * 
 * @param {string} repoName - Repository name or path
 * @param {Object} [options] - Operation options
 * @param {Object} [options.client] - Client configuration
 * @param {Object} [options.pull] - Pull-specific options
 * @param {Object} [options.push] - Push-specific options
 * @param {boolean} [options.autoPush=false] - Automatically push after pull
 * @returns {Promise<Object>} Sync result
 */
export async function syncRepository(repoName, options = {}) {
  try {
    const client = createClient(options.client);
    
    // Pull first
    const pullResult = await client.pull(repoName, options.pull);
    
    const result = {
      name: pullResult.name,
      path: pullResult.path,
      pull: pullResult,
      syncedAt: new Date().toISOString()
    };

    // Auto-push if enabled and there are local changes
    if (options.autoPush) {
      const status = await client.status(repoName);
      if (status.status.ahead > 0) {
        const pushResult = await client.push(repoName, options.push);
        result.push = pushResult;
      }
    }

    return result;
  } catch (error) {
    throw new GitError(`Sync operation failed: ${error.message}`, error);
  }
}

/**
 * Batch clone multiple repositories
 * 
 * @param {Array<string>} repoUrls - Array of repository URLs
 * @param {Object} [options] - Operation options
 * @param {Object} [options.client] - Client configuration
 * @param {Object} [options.clone] - Clone-specific options
 * @param {Function} [options.onProgress] - Progress callback
 * @param {Function} [options.onComplete] - Completion callback for each repo
 * @param {number} [options.concurrency=3] - Number of concurrent operations
 * @returns {Promise<Array>} Array of clone results
 */
export async function batchClone(repoUrls, options = {}) {
  try {
    const concurrency = options.concurrency || 3;
    const results = [];
    const errors = [];

    // Process repositories in batches
    for (let i = 0; i < repoUrls.length; i += concurrency) {
      const batch = repoUrls.slice(i, i + concurrency);
      const promises = batch.map(async (repoUrl) => {
        try {
          const result = await cloneRepository(repoUrl, undefined, {
            client: options.client,
            clone: options.clone,
            onProgress: options.onProgress ? (progress) => {
              options.onProgress(repoUrl, progress);
            } : undefined
          });
          
          if (options.onComplete) {
            options.onComplete(repoUrl, result, null);
          }
          
          return result;
        } catch (error) {
          const errorInfo = { repoUrl, error: error.message };
          errors.push(errorInfo);
          
          if (options.onComplete) {
            options.onComplete(repoUrl, null, error);
          }
          
          return errorInfo;
        }
      });

      const batchResults = await Promise.all(promises);
      results.push(...batchResults);
    }

    return {
      successful: results.filter(r => !r.error),
      failed: errors,
      total: repoUrls.length,
      successCount: results.length - errors.length,
      errorCount: errors.length
    };
  } catch (error) {
    throw new GitError(`Batch clone failed: ${error.message}`, error);
  }
}

/**
 * Batch sync multiple repositories
 * 
 * @param {Array<string>} repoNames - Array of repository names
 * @param {Object} [options] - Operation options
 * @param {Object} [options.client] - Client configuration
 * @param {Object} [options.pull] - Pull-specific options
 * @param {Object} [options.push] - Push-specific options
 * @param {boolean} [options.autoPush=false] - Auto-push after pull
 * @param {Function} [options.onComplete] - Completion callback for each repo
 * @param {number} [options.concurrency=3] - Number of concurrent operations
 * @returns {Promise<Array>} Array of sync results
 */
export async function batchSync(repoNames, options = {}) {
  try {
    const concurrency = options.concurrency || 3;
    const results = [];
    const errors = [];

    // Process repositories in batches
    for (let i = 0; i < repoNames.length; i += concurrency) {
      const batch = repoNames.slice(i, i + concurrency);
      const promises = batch.map(async (repoName) => {
        try {
          const result = await syncRepository(repoName, {
            client: options.client,
            pull: options.pull,
            push: options.push,
            autoPush: options.autoPush
          });
          
          if (options.onComplete) {
            options.onComplete(repoName, result, null);
          }
          
          return result;
        } catch (error) {
          const errorInfo = { repoName, error: error.message };
          errors.push(errorInfo);
          
          if (options.onComplete) {
            options.onComplete(repoName, null, error);
          }
          
          return errorInfo;
        }
      });

      const batchResults = await Promise.all(promises);
      results.push(...batchResults);
    }

    return {
      successful: results.filter(r => !r.error),
      failed: errors,
      total: repoNames.length,
      successCount: results.length - errors.length,
      errorCount: errors.length
    };
  } catch (error) {
    throw new GitError(`Batch sync failed: ${error.message}`, error);
  }
}

/**
 * Get repository health check
 * 
 * @param {string} repoName - Repository name or path
 * @param {Object} [options] - Operation options
 * @param {Object} [options.client] - Client configuration
 * @returns {Promise<Object>} Health check result
 */
export async function getRepositoryHealth(repoName, options = {}) {
  try {
    const client = createClient(options.client);
    const status = await client.status(repoName);
    
    // Analyze repository health
    const health = {
      name: status.name,
      path: status.path,
      healthy: true,
      issues: [],
      recommendations: [],
      lastChecked: new Date().toISOString()
    };

    // Check for common issues
    if (status.status.conflicted.length > 0) {
      health.healthy = false;
      health.issues.push(`${status.status.conflicted.length} files have merge conflicts`);
      health.recommendations.push('Resolve merge conflicts before proceeding');
    }

    if (status.status.behind > 0) {
      health.issues.push(`${status.status.behind} commits behind remote`);
      health.recommendations.push('Run pull to get latest changes');
    }

    if (status.status.ahead > 0) {
      health.issues.push(`${status.status.ahead} commits ahead of remote`);
      health.recommendations.push('Run push to share your changes');
    }

    if (status.status.modified.length > 0) {
      health.issues.push(`${status.status.modified.length} modified files not staged`);
      health.recommendations.push('Stage and commit your changes');
    }

    return health;
  } catch (error) {
    throw new GitError(`Health check failed: ${error.message}`, error);
  }
}