/**
 * GitHub Watching API
 * @module api/watching
 */

import { buildPaginationParams, Paginator } from '../utils/pagination.mjs';

/**
 * Watching API endpoints
 */
export class WatchingAPI {
  /**
   * @param {HttpClient} http - HTTP client instance
   */
  constructor(http) {
    this.http = http;
  }

  /**
   * List watchers for a repository
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {Object} options - Query options
   * @param {number} [options.page] - Page number
   * @param {number} [options.per_page] - Items per page
   * @returns {Promise<Object>} Watchers response
   */
  async listWatchers(owner, repo, options = {}) {
    const params = buildPaginationParams(options);
    return this.http.get(`/repos/${owner}/${repo}/subscribers`, params);
  }

  /**
   * List repositories watched by a user
   * @param {string} username - GitHub username
   * @param {Object} options - Query options
   * @param {number} [options.page] - Page number
   * @param {number} [options.per_page] - Items per page
   * @returns {Promise<Object>} Watched repositories response
   */
  async listWatchedByUser(username, options = {}) {
    const params = buildPaginationParams(options);
    return this.http.get(`/users/${username}/subscriptions`, params);
  }

  /**
   * List repositories watched by authenticated user
   * @param {Object} options - Query options
   * @param {number} [options.page] - Page number
   * @param {number} [options.per_page] - Items per page
   * @returns {Promise<Object>} Watched repositories response
   */
  async listWatchedByAuthUser(options = {}) {
    const params = buildPaginationParams(options);
    return this.http.get('/user/subscriptions', params);
  }

  /**
   * Get repository subscription for authenticated user
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @returns {Promise<Object>} Subscription details
   */
  async getRepoSubscription(owner, repo) {
    try {
      const response = await this.http.get(`/repos/${owner}/${repo}/subscription`);
      return response.data;
    } catch (error) {
      if (error.statusCode === 404) {
        return {
          subscribed: false,
          ignored: false,
          reason: null,
          created_at: null,
          url: null,
          repository_url: `https://api.github.com/repos/${owner}/${repo}`
        };
      }
      throw error;
    }
  }

  /**
   * Set repository subscription
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {Object} options - Subscription options
   * @param {boolean} [options.subscribed] - Whether to subscribe
   * @param {boolean} [options.ignored] - Whether to ignore
   * @returns {Promise<Object>} Subscription details
   */
  async setRepoSubscription(owner, repo, options = {}) {
    const response = await this.http.put(
      `/repos/${owner}/${repo}/subscription`,
      {
        subscribed: options.subscribed !== false,
        ignored: options.ignored || false
      }
    );
    return response.data;
  }

  /**
   * Delete repository subscription
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @returns {Promise<Object>} Response
   */
  async deleteRepoSubscription(owner, repo) {
    return this.http.delete(`/repos/${owner}/${repo}/subscription`);
  }

  /**
   * Watch a repository (subscribe)
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @returns {Promise<Object>} Subscription details
   */
  async watchRepo(owner, repo) {
    return this.setRepoSubscription(owner, repo, { subscribed: true, ignored: false });
  }

  /**
   * Unwatch a repository (unsubscribe)
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @returns {Promise<Object>} Response
   */
  async unwatchRepo(owner, repo) {
    return this.deleteRepoSubscription(owner, repo);
  }

  /**
   * Ignore a repository
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @returns {Promise<Object>} Subscription details
   */
  async ignoreRepo(owner, repo) {
    return this.setRepoSubscription(owner, repo, { subscribed: false, ignored: true });
  }

  /**
   * Check if watching a repository
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @returns {Promise<boolean>} True if watching
   */
  async isWatching(owner, repo) {
    const subscription = await this.getRepoSubscription(owner, repo);
    return subscription.subscribed === true;
  }

  /**
   * Check if ignoring a repository
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @returns {Promise<boolean>} True if ignoring
   */
  async isIgnoring(owner, repo) {
    const subscription = await this.getRepoSubscription(owner, repo);
    return subscription.ignored === true;
  }

  /**
   * Get paginator for watchers
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {Object} options - Query options
   * @returns {Paginator} Paginator instance
   */
  getWatchersPaginator(owner, repo, options = {}) {
    return new Paginator(
      (params) => this.listWatchers(owner, repo, params),
      options
    );
  }

  /**
   * Get paginator for watched repositories by user
   * @param {string} username - GitHub username
   * @param {Object} options - Query options
   * @returns {Paginator} Paginator instance
   */
  getWatchedPaginator(username, options = {}) {
    return new Paginator(
      (params) => this.listWatchedByUser(username, params),
      options
    );
  }

  /**
   * Get paginator for watched repositories by authenticated user
   * @param {Object} options - Query options
   * @returns {Paginator} Paginator instance
   */
  getAuthWatchedPaginator(options = {}) {
    return new Paginator(
      (params) => this.listWatchedByAuthUser(params),
      options
    );
  }

  /**
   * Watch multiple repositories
   * @param {Array<Object>} repos - Array of {owner, repo} objects
   * @returns {Promise<Array>} Results
   */
  async watchMultiple(repos) {
    const promises = repos.map(({ owner, repo }) =>
      this.watchRepo(owner, repo)
        .then(result => ({ owner, repo, success: true, result }))
        .catch(error => ({ owner, repo, success: false, error }))
    );
    return Promise.all(promises);
  }

  /**
   * Unwatch multiple repositories
   * @param {Array<Object>} repos - Array of {owner, repo} objects
   * @returns {Promise<Array>} Results
   */
  async unwatchMultiple(repos) {
    const promises = repos.map(({ owner, repo }) =>
      this.unwatchRepo(owner, repo)
        .then(() => ({ owner, repo, success: true }))
        .catch(error => ({ owner, repo, success: false, error }))
    );
    return Promise.all(promises);
  }

  /**
   * Get watcher count for a repository
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @returns {Promise<number>} Watcher count
   */
  async getWatcherCount(owner, repo) {
    const response = await this.http.get(`/repos/${owner}/${repo}`);
    return response.data.subscribers_count;
  }

  /**
   * Get all watchers for a repository
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {Object} options - Query options
   * @returns {Promise<Array>} All watchers
   */
  async getAllWatchers(owner, repo, options = {}) {
    return this.http.fetchAllPages(
      `/repos/${owner}/${repo}/subscribers`,
      options
    );
  }

  /**
   * Get all watched repositories for authenticated user
   * @param {Object} options - Query options
   * @returns {Promise<Array>} All watched repositories
   */
  async getAllWatched(options = {}) {
    return this.http.fetchAllPages('/user/subscriptions', options);
  }

  /**
   * Get watch statistics for repositories
   * @param {Array<Object>} repos - Array of {owner, repo} objects
   * @returns {Promise<Object>} Watch statistics
   */
  async getWatchStatistics(repos) {
    const stats = {
      total: repos.length,
      watched: 0,
      ignored: 0,
      notWatching: 0,
      details: []
    };
    
    const promises = repos.map(async ({ owner, repo }) => {
      try {
        const subscription = await this.getRepoSubscription(owner, repo);
        const detail = {
          repository: `${owner}/${repo}`,
          subscribed: subscription.subscribed,
          ignored: subscription.ignored,
          reason: subscription.reason,
          created_at: subscription.created_at
        };
        
        if (subscription.subscribed) stats.watched++;
        else if (subscription.ignored) stats.ignored++;
        else stats.notWatching++;
        
        return detail;
      } catch (error) {
        return {
          repository: `${owner}/${repo}`,
          error: error.message
        };
      }
    });
    
    stats.details = await Promise.all(promises);
    return stats;
  }

  /**
   * Find mutual watchers between repositories
   * @param {Object} repo1 - First repository {owner, repo}
   * @param {Object} repo2 - Second repository {owner, repo}
   * @returns {Promise<Array>} Mutual watchers
   */
  async findMutualWatchers(repo1, repo2) {
    const [watchers1, watchers2] = await Promise.all([
      this.getAllWatchers(repo1.owner, repo1.repo),
      this.getAllWatchers(repo2.owner, repo2.repo)
    ]);
    
    const users1 = new Set(watchers1.map(w => w.login));
    const mutual = watchers2.filter(w => users1.has(w.login));
    
    return mutual;
  }
}

export default WatchingAPI;