/**
 * @fileoverview Main Git Repository Management Client using simple-git
 * @module GitClient
 */

import simpleGit from 'simple-git';
import { join, resolve, basename } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { GitError, AuthError, ValidationError } from '../utils/errors.mjs';
import { validateRepository, validatePath } from '../utils/validation.mjs';
import { createSilentProgressManager, CLONE_STAGES } from '../utils/progress.mjs';

/**
 * Main Git Repository Management Client
 * 
 * @example
 * ```javascript
 * import { GitClient } from '@thinkeloquent/clone';
 * 
 * const client = new GitClient({
 *   baseDir: './repositories',
 *   token: process.env.GITHUB_TOKEN
 * });
 * 
 * // Clone repository
 * await client.clone('https://github.com/octocat/Hello-World.git', 'hello-world');
 * 
 * // Pull latest changes
 * await client.pull('hello-world');
 * 
 * // Push changes
 * await client.push('hello-world');
 * ```
 */
export class GitClient {
  /**
   * Create a new Git repository management client
   * 
   * @param {Object} options - Configuration options
   * @param {string} [options.baseDir='./repositories'] - Base directory for repositories
   * @param {string} [options.token] - GitHub personal access token for private repos
   * @param {Object} [options.gitOptions] - Additional simple-git options
   * @param {boolean} [options.verbose] - Enable verbose logging
   * @param {number} [options.timeout] - Operation timeout in milliseconds
   */
  constructor(options = {}) {
    this.baseDir = resolve(options.baseDir || './repositories');
    this.token = options.token || process.env.GITHUB_TOKEN;
    this.verbose = options.verbose || false;
    this.timeout = options.timeout || 300000; // 5 minutes default
    
    // Ensure base directory exists
    if (!existsSync(this.baseDir)) {
      mkdirSync(this.baseDir, { recursive: true });
    }
    
    // Configure simple-git with base directory
    this.git = simpleGit({
      baseDir: this.baseDir,
      binary: 'git',
      maxConcurrentProcesses: 6,
      timeout: {
        block: this.timeout
      },
      ...options.gitOptions
    });

    // Configure authentication if token is provided
    if (this.token) {
      this._configureAuth();
    }
  }

  /**
   * Configure Git authentication using GitHub token
   * @private
   */
  _configureAuth() {
    // Set up credential helper for GitHub authentication
    this.git.addConfig('credential.helper', 'store --file=.git-credentials');
  }

  /**
   * Get authenticated repository URL
   * @private
   * @param {string} repoUrl - Repository URL
   * @returns {string} Authenticated URL
   */
  _getAuthenticatedUrl(repoUrl) {
    if (!this.token || !repoUrl.includes('github.com')) {
      return repoUrl;
    }

    // Convert to authenticated HTTPS URL
    const url = new URL(repoUrl.replace('git@github.com:', 'https://github.com/').replace('.git', ''));
    url.username = this.token;
    url.password = 'x-oauth-basic';
    
    return url.toString() + '.git';
  }

  /**
   * Get repository path
   * @private
   * @param {string} repoName - Repository name or path
   * @returns {string} Full repository path
   */
  _getRepoPath(repoName) {
    if (repoName.startsWith('/') || repoName.includes(':')) {
      return resolve(repoName);
    }
    return join(this.baseDir, repoName);
  }

  /**
   * Clone a repository
   * 
   * @param {string} repoUrl - Repository URL to clone
   * @param {string} [targetDir] - Target directory name (defaults to repo name)
   * @param {Object} [options] - Clone options
   * @param {boolean} [options.bare=false] - Create bare repository
   * @param {string} [options.branch] - Specific branch to clone
   * @param {number} [options.depth] - Clone depth for shallow clone
   * @param {Function} [options.progress] - Progress callback (deprecated, use progressManager)
   * @param {Object} [options.progressManager] - Progress manager instance
   * @param {Function} [options.onProgress] - Progress event callback
   * @param {Function} [options.onStageChange] - Stage change event callback
   * @param {Function} [options.onComplete] - Completion event callback
   * @returns {Promise<Object>} Repository information
   * 
   * @example
   * ```javascript
   * // Clone with progress tracking
   * const repo = await client.clone(
   *   'https://github.com/octocat/Hello-World.git',
   *   'my-hello-world',
   *   {
   *     branch: 'main',
   *     depth: 1,
   *     onProgress: (data) => console.log(`${data.percentage}%: ${data.message}`),
   *     onStageChange: (data) => console.log(`Stage: ${data.stage}`)
   *   }
   * );
   * ```
   */
  async clone(repoUrl, targetDir, options = {}) {
    let progressManager = null;
    
    try {
      validateRepository(repoUrl);
      
      // Extract repo name if targetDir not provided
      if (!targetDir) {
        targetDir = basename(repoUrl.replace('.git', ''));
      }
      
      const repoPath = this._getRepoPath(targetDir);
      
      // Check if directory already exists
      if (existsSync(repoPath)) {
        throw new ValidationError(`Directory '${targetDir}' already exists`);
      }

      // Set up progress tracking
      progressManager = options.progressManager || createSilentProgressManager({
        onProgress: options.onProgress,
        onStageChange: options.onStageChange,
        onComplete: options.onComplete
      });

      const operationId = `clone-${targetDir}-${Date.now()}`;
      progressManager.start(operationId, `Cloning ${targetDir}`, 100);

      const authUrl = this._getAuthenticatedUrl(repoUrl);
      const cloneOptions = [];

      // Add clone options
      if (options.bare) cloneOptions.push('--bare');
      if (options.branch) cloneOptions.push('--branch', options.branch);
      if (options.depth) cloneOptions.push('--depth', options.depth.toString());

      // Add progress reporting if git supports it
      cloneOptions.push('--progress');

      progressManager.setStage(CLONE_STAGES.INITIALIZING, 'Preparing clone operation...');
      progressManager.update(10);

      if (this.verbose) {
        console.log(`Cloning ${repoUrl} to ${targetDir}...`);
      }

      progressManager.setStage(CLONE_STAGES.CLONING, 'Cloning repository...');
      progressManager.update(20);

      // Create git instance with progress handler
      const gitWithProgress = simpleGit({
        baseDir: this.baseDir,
        binary: 'git',
        progress: progressManager.createGitProgressCallback()
      });

      // Perform clone
      await gitWithProgress.clone(authUrl, targetDir, cloneOptions);

      progressManager.setStage(CLONE_STAGES.CHECKING_OUT, 'Finalizing...');
      progressManager.update(90);

      // Get repository information
      const repoGit = simpleGit(repoPath);
      const [status, remotes, branches] = await Promise.all([
        repoGit.status(),
        repoGit.getRemotes(true),
        repoGit.branch(['-a'])
      ]);

      const result = {
        name: targetDir,
        path: repoPath,
        url: repoUrl,
        branch: status.current,
        status: status,
        remotes: remotes,
        branches: branches,
        clonedAt: new Date().toISOString()
      };

      progressManager.complete(result);

      // Support legacy progress callback
      if (options.progress && typeof options.progress === 'function') {
        options.progress('Clone completed successfully');
      }

      return result;

    } catch (error) {
      if (progressManager) {
        progressManager.error(error);
      }
      
      // Support legacy progress callback for errors
      if (options.progress && typeof options.progress === 'function') {
        options.progress(`Clone failed: ${error.message}`);
      }
      
      throw new GitError(`Clone failed: ${error.message}`, error);
    }
  }

  /**
   * Pull latest changes from remote
   * 
   * @param {string} repoName - Repository name or path
   * @param {Object} [options] - Pull options
   * @param {string} [options.remote='origin'] - Remote name
   * @param {string} [options.branch] - Branch name (defaults to current)
   * @param {boolean} [options.rebase=false] - Use rebase instead of merge
   * @returns {Promise<Object>} Pull result
   */
  async pull(repoName, options = {}) {
    try {
      const repoPath = this._getRepoPath(repoName);
      validatePath(repoPath);

      const repoGit = simpleGit(repoPath);
      const remote = options.remote || 'origin';
      const branch = options.branch;

      if (this.verbose) {
        console.log(`Pulling changes for ${repoName}...`);
      }

      // Perform pull
      const pullOptions = [];
      if (options.rebase) pullOptions.push('--rebase');
      
      const result = branch 
        ? await repoGit.pull(remote, branch, pullOptions)
        : await repoGit.pull(remote, pullOptions);

      // Get updated status
      const status = await repoGit.status();

      return {
        name: basename(repoPath),
        path: repoPath,
        result: result,
        status: status,
        pulledAt: new Date().toISOString()
      };

    } catch (error) {
      throw new GitError(`Pull failed: ${error.message}`, error);
    }
  }

  /**
   * Push changes to remote
   * 
   * @param {string} repoName - Repository name or path
   * @param {Object} [options] - Push options
   * @param {string} [options.remote='origin'] - Remote name
   * @param {string} [options.branch] - Branch name (defaults to current)
   * @param {boolean} [options.force=false] - Force push
   * @param {boolean} [options.setUpstream=false] - Set upstream tracking
   * @returns {Promise<Object>} Push result
   */
  async push(repoName, options = {}) {
    try {
      const repoPath = this._getRepoPath(repoName);
      validatePath(repoPath);

      const repoGit = simpleGit(repoPath);
      const remote = options.remote || 'origin';
      const branch = options.branch;

      if (this.verbose) {
        console.log(`Pushing changes for ${repoName}...`);
      }

      // Build push arguments
      const pushArgs = [remote];
      if (branch) pushArgs.push(branch);
      
      const pushOptions = [];
      if (options.force) pushOptions.push('--force');
      if (options.setUpstream) pushOptions.push('--set-upstream');
      
      // Perform push
      const result = await repoGit.push(pushArgs, pushOptions);

      // Get updated status
      const status = await repoGit.status();

      return {
        name: basename(repoPath),
        path: repoPath,
        result: result,
        status: status,
        pushedAt: new Date().toISOString()
      };

    } catch (error) {
      throw new GitError(`Push failed: ${error.message}`, error);
    }
  }

  /**
   * Get repository status
   * 
   * @param {string} repoName - Repository name or path
   * @returns {Promise<Object>} Repository status and information
   */
  async status(repoName) {
    try {
      const repoPath = this._getRepoPath(repoName);
      validatePath(repoPath);

      const repoGit = simpleGit(repoPath);
      
      const [status, remotes, branches, log] = await Promise.all([
        repoGit.status(),
        repoGit.getRemotes(true),
        repoGit.branch(['-a']),
        repoGit.log({ maxCount: 5 })
      ]);

      return {
        name: basename(repoPath),
        path: repoPath,
        branch: status.current,
        status: status,
        remotes: remotes,
        branches: branches,
        recentCommits: log.all,
        lastUpdated: new Date().toISOString()
      };

    } catch (error) {
      throw new GitError(`Status check failed: ${error.message}`, error);
    }
  }

  /**
   * List all managed repositories
   * 
   * @returns {Promise<Array>} Array of repository information
   */
  async listRepositories() {
    try {
      const { readdir, stat } = await import('fs/promises');
      
      if (!existsSync(this.baseDir)) {
        return [];
      }

      const entries = await readdir(this.baseDir);
      const repositories = [];

      for (const entry of entries) {
        const entryPath = join(this.baseDir, entry);
        const stats = await stat(entryPath);
        
        if (stats.isDirectory()) {
          const gitDir = join(entryPath, '.git');
          if (existsSync(gitDir)) {
            try {
              const repoInfo = await this.status(entry);
              repositories.push(repoInfo);
            } catch (error) {
              // Skip invalid repositories
              if (this.verbose) {
                console.warn(`Skipping invalid repository: ${entry}`);
              }
            }
          }
        }
      }

      return repositories;
    } catch (error) {
      throw new GitError(`Failed to list repositories: ${error.message}`, error);
    }
  }

  /**
   * Initialize a new repository
   * 
   * @param {string} repoName - Repository name
   * @param {Object} [options] - Init options
   * @param {boolean} [options.bare=false] - Create bare repository
   * @returns {Promise<Object>} Repository information
   */
  async init(repoName, options = {}) {
    try {
      const repoPath = this._getRepoPath(repoName);
      
      if (existsSync(repoPath)) {
        throw new ValidationError(`Directory '${repoName}' already exists`);
      }

      mkdirSync(repoPath, { recursive: true });
      
      const repoGit = simpleGit(repoPath);
      const initOptions = options.bare ? ['--bare'] : [];
      
      await repoGit.init(initOptions);

      if (this.verbose) {
        console.log(`Initialized repository: ${repoName}`);
      }

      return {
        name: repoName,
        path: repoPath,
        bare: options.bare || false,
        initializedAt: new Date().toISOString()
      };

    } catch (error) {
      throw new GitError(`Init failed: ${error.message}`, error);
    }
  }
}