/**
 * GitHub Stars API
 * @module api/stars
 */

import { buildPaginationParams, Paginator } from '../utils/pagination.mjs';

/**
 * Stars API endpoints
 */
export class StarsAPI {
  /**
   * @param {HttpClient} http - HTTP client instance
   */
  constructor(http) {
    this.http = http;
  }

  /**
   * List stargazers for a repository
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {Object} options - Query options
   * @param {number} [options.page] - Page number
   * @param {number} [options.per_page] - Items per page
   * @param {boolean} [options.withTimestamps] - Include star creation timestamps
   * @returns {Promise<Object>} Stargazers response
   */
  async listStargazers(owner, repo, options = {}) {
    const params = buildPaginationParams(options);
    const headers = {};
    
    // Request star creation timestamps
    if (options.withTimestamps) {
      headers['Accept'] = 'application/vnd.github.star+json';
    }
    
    const response = await this.http.client.get(
      `/repos/${owner}/${repo}/stargazers`,
      { params, headers }
    );
    
    return {
      data: response.data,
      pagination: response.pagination,
      rateLimit: response.rateLimit
    };
  }

  /**
   * List repositories starred by a user
   * @param {string} username - GitHub username
   * @param {Object} options - Query options
   * @param {string} [options.sort] - Sort by 'created' or 'updated'
   * @param {string} [options.direction] - Sort direction 'asc' or 'desc'
   * @param {number} [options.page] - Page number
   * @param {number} [options.per_page] - Items per page
   * @param {boolean} [options.withTimestamps] - Include star creation timestamps
   * @returns {Promise<Object>} Starred repositories response
   */
  async listStarredByUser(username, options = {}) {
    const params = buildPaginationParams(options);
    const headers = {};
    
    // Request star creation timestamps
    if (options.withTimestamps) {
      headers['Accept'] = 'application/vnd.github.star+json';
    }
    
    const response = await this.http.client.get(
      `/users/${username}/starred`,
      { params, headers }
    );
    
    return {
      data: response.data,
      pagination: response.pagination,
      rateLimit: response.rateLimit
    };
  }

  /**
   * List repositories starred by authenticated user
   * @param {Object} options - Query options
   * @param {string} [options.sort] - Sort by 'created' or 'updated'
   * @param {string} [options.direction] - Sort direction 'asc' or 'desc'
   * @param {number} [options.page] - Page number
   * @param {number} [options.per_page] - Items per page
   * @param {boolean} [options.withTimestamps] - Include star creation timestamps
   * @returns {Promise<Object>} Starred repositories response
   */
  async listStarredByAuthUser(options = {}) {
    const params = buildPaginationParams(options);
    const headers = {};
    
    // Request star creation timestamps
    if (options.withTimestamps) {
      headers['Accept'] = 'application/vnd.github.star+json';
    }
    
    const response = await this.http.client.get(
      '/user/starred',
      { params, headers }
    );
    
    return {
      data: response.data,
      pagination: response.pagination,
      rateLimit: response.rateLimit
    };
  }

  /**
   * Check if a repository is starred by authenticated user
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @returns {Promise<boolean>} True if starred
   */
  async checkIfStarred(owner, repo) {
    try {
      await this.http.get(`/user/starred/${owner}/${repo}`);
      return true;
    } catch (error) {
      if (error.statusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Star a repository for authenticated user
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @returns {Promise<Object>} Response
   */
  async starRepo(owner, repo) {
    return this.http.put(`/user/starred/${owner}/${repo}`);
  }

  /**
   * Unstar a repository for authenticated user
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @returns {Promise<Object>} Response
   */
  async unstarRepo(owner, repo) {
    return this.http.delete(`/user/starred/${owner}/${repo}`);
  }

  /**
   * Get paginator for stargazers
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {Object} options - Query options
   * @returns {Paginator} Paginator instance
   */
  getStargazersPaginator(owner, repo, options = {}) {
    return new Paginator(
      (params) => this.listStargazers(owner, repo, params),
      options
    );
  }

  /**
   * Get paginator for starred repositories by user
   * @param {string} username - GitHub username
   * @param {Object} options - Query options
   * @returns {Paginator} Paginator instance
   */
  getStarredPaginator(username, options = {}) {
    return new Paginator(
      (params) => this.listStarredByUser(username, params),
      options
    );
  }

  /**
   * Get paginator for starred repositories by authenticated user
   * @param {Object} options - Query options
   * @returns {Paginator} Paginator instance
   */
  getAuthStarredPaginator(options = {}) {
    return new Paginator(
      (params) => this.listStarredByAuthUser(params),
      options
    );
  }

  /**
   * Star multiple repositories
   * @param {Array<Object>} repos - Array of {owner, repo} objects
   * @returns {Promise<Array>} Results
   */
  async starMultiple(repos) {
    const promises = repos.map(({ owner, repo }) =>
      this.starRepo(owner, repo)
        .then(() => ({ owner, repo, success: true }))
        .catch(error => ({ owner, repo, success: false, error }))
    );
    return Promise.all(promises);
  }

  /**
   * Unstar multiple repositories
   * @param {Array<Object>} repos - Array of {owner, repo} objects
   * @returns {Promise<Array>} Results
   */
  async unstarMultiple(repos) {
    const promises = repos.map(({ owner, repo }) =>
      this.unstarRepo(owner, repo)
        .then(() => ({ owner, repo, success: true }))
        .catch(error => ({ owner, repo, success: false, error }))
    );
    return Promise.all(promises);
  }

  /**
   * Get star count for a repository
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @returns {Promise<number>} Star count
   */
  async getStarCount(owner, repo) {
    const response = await this.http.get(`/repos/${owner}/${repo}`);
    return response.data.stargazers_count;
  }

  /**
   * Get star history for a repository
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Star history with timestamps
   */
  async getStarHistory(owner, repo, options = {}) {
    const stargazers = [];
    const paginator = this.getStargazersPaginator(owner, repo, {
      ...options,
      withTimestamps: true
    });
    
    for await (const stargazer of paginator) {
      if (stargazer.starred_at) {
        stargazers.push({
          user: stargazer.user,
          starred_at: stargazer.starred_at
        });
      }
    }
    
    return stargazers.sort((a, b) => 
      new Date(a.starred_at) - new Date(b.starred_at)
    );
  }

  /**
   * Get star statistics for a repository
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @returns {Promise<Object>} Star statistics
   */
  async getStarStatistics(owner, repo) {
    const stats = {
      total: 0,
      byMonth: {},
      byYear: {},
      recent: {
        lastDay: 0,
        lastWeek: 0,
        lastMonth: 0
      }
    };
    
    // Get total count
    stats.total = await this.getStarCount(owner, repo);
    
    // Get star history with timestamps
    const history = await this.getStarHistory(owner, repo, {
      per_page: 100
    });
    
    const now = new Date();
    const dayAgo = new Date(now - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    
    for (const star of history) {
      const date = new Date(star.starred_at);
      const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const year = date.getFullYear();
      
      // Count by month
      stats.byMonth[yearMonth] = (stats.byMonth[yearMonth] || 0) + 1;
      
      // Count by year
      stats.byYear[year] = (stats.byYear[year] || 0) + 1;
      
      // Count recent
      if (date > dayAgo) stats.recent.lastDay++;
      if (date > weekAgo) stats.recent.lastWeek++;
      if (date > monthAgo) stats.recent.lastMonth++;
    }
    
    return stats;
  }

  /**
   * Find mutual stargazers between repositories
   * @param {Object} repo1 - First repository {owner, repo}
   * @param {Object} repo2 - Second repository {owner, repo}
   * @returns {Promise<Array>} Mutual stargazers
   */
  async findMutualStargazers(repo1, repo2) {
    const [stargazers1, stargazers2] = await Promise.all([
      this.http.fetchAllPages(`/repos/${repo1.owner}/${repo1.repo}/stargazers`),
      this.http.fetchAllPages(`/repos/${repo2.owner}/${repo2.repo}/stargazers`)
    ]);
    
    const users1 = new Set(stargazers1.map(s => s.login));
    const mutual = stargazers2.filter(s => users1.has(s.login));
    
    return mutual;
  }
}

export default StarsAPI;