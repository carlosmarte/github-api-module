/**
 * GitHub Events API
 * @module api/events
 */

import { buildPaginationParams, Paginator } from '../utils/pagination.mjs';

/**
 * Events API endpoints
 */
export class EventsAPI {
  /**
   * @param {HttpClient} http - HTTP client instance
   */
  constructor(http) {
    this.http = http;
  }

  /**
   * List public events
   * @param {Object} options - Query options
   * @param {number} [options.page] - Page number
   * @param {number} [options.per_page] - Items per page
   * @returns {Promise<Object>} Events response
   */
  async listPublic(options = {}) {
    const params = buildPaginationParams(options);
    return this.http.get('/events', params);
  }

  /**
   * List repository events
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {Object} options - Query options
   * @param {number} [options.page] - Page number
   * @param {number} [options.per_page] - Items per page
   * @returns {Promise<Object>} Events response
   */
  async listForRepo(owner, repo, options = {}) {
    const params = buildPaginationParams(options);
    return this.http.get(`/repos/${owner}/${repo}/events`, params);
  }

  /**
   * List public events for a network of repositories
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {Object} options - Query options
   * @param {number} [options.page] - Page number
   * @param {number} [options.per_page] - Items per page
   * @returns {Promise<Object>} Events response
   */
  async listForRepoNetwork(owner, repo, options = {}) {
    const params = buildPaginationParams(options);
    return this.http.get(`/networks/${owner}/${repo}/events`, params);
  }

  /**
   * List organization events
   * @param {string} org - Organization name
   * @param {Object} options - Query options
   * @param {number} [options.page] - Page number
   * @param {number} [options.per_page] - Items per page
   * @returns {Promise<Object>} Events response
   */
  async listForOrg(org, options = {}) {
    const params = buildPaginationParams(options);
    return this.http.get(`/orgs/${org}/events`, params);
  }

  /**
   * List events for a user
   * @param {string} username - GitHub username
   * @param {Object} options - Query options
   * @param {number} [options.page] - Page number
   * @param {number} [options.per_page] - Items per page
   * @returns {Promise<Object>} Events response
   */
  async listForUser(username, options = {}) {
    const params = buildPaginationParams(options);
    return this.http.get(`/users/${username}/events`, params);
  }

  /**
   * List public events for a user
   * @param {string} username - GitHub username
   * @param {Object} options - Query options
   * @param {number} [options.page] - Page number
   * @param {number} [options.per_page] - Items per page
   * @returns {Promise<Object>} Events response
   */
  async listPublicForUser(username, options = {}) {
    const params = buildPaginationParams(options);
    return this.http.get(`/users/${username}/events/public`, params);
  }

  /**
   * List events for a user's organization
   * @param {string} username - GitHub username
   * @param {string} org - Organization name
   * @param {Object} options - Query options
   * @param {number} [options.page] - Page number
   * @param {number} [options.per_page] - Items per page
   * @returns {Promise<Object>} Events response
   */
  async listForUserOrg(username, org, options = {}) {
    const params = buildPaginationParams(options);
    return this.http.get(`/users/${username}/events/orgs/${org}`, params);
  }

  /**
   * List events received by a user
   * @param {string} username - GitHub username
   * @param {Object} options - Query options
   * @param {number} [options.page] - Page number
   * @param {number} [options.per_page] - Items per page
   * @returns {Promise<Object>} Events response
   */
  async listReceivedByUser(username, options = {}) {
    const params = buildPaginationParams(options);
    return this.http.get(`/users/${username}/received_events`, params);
  }

  /**
   * List public events received by a user
   * @param {string} username - GitHub username
   * @param {Object} options - Query options
   * @param {number} [options.page] - Page number
   * @param {number} [options.per_page] - Items per page
   * @returns {Promise<Object>} Events response
   */
  async listPublicReceivedByUser(username, options = {}) {
    const params = buildPaginationParams(options);
    return this.http.get(`/users/${username}/received_events/public`, params);
  }

  /**
   * Get paginator for public events
   * @param {Object} options - Query options
   * @returns {Paginator} Paginator instance
   */
  getPublicPaginator(options = {}) {
    return new Paginator(
      (params) => this.listPublic(params),
      options
    );
  }

  /**
   * Get paginator for repository events
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {Object} options - Query options
   * @returns {Paginator} Paginator instance
   */
  getRepoPaginator(owner, repo, options = {}) {
    return new Paginator(
      (params) => this.listForRepo(owner, repo, params),
      options
    );
  }

  /**
   * Get paginator for user events
   * @param {string} username - GitHub username
   * @param {Object} options - Query options
   * @returns {Paginator} Paginator instance
   */
  getUserPaginator(username, options = {}) {
    return new Paginator(
      (params) => this.listForUser(username, params),
      options
    );
  }

  /**
   * Stream public events
   * @param {Object} options - Stream options
   * @param {number} [options.interval] - Polling interval in milliseconds
   * @param {Function} [options.onEvent] - Callback for each event
   * @returns {AsyncGenerator} Event stream
   */
  async *streamPublic(options = {}) {
    const interval = options.interval || 60000; // Default 1 minute
    const seenIds = new Set();
    
    while (true) {
      try {
        const response = await this.listPublic({ per_page: 100 });
        const events = response.data;
        
        // Process new events
        for (const event of events) {
          if (!seenIds.has(event.id)) {
            seenIds.add(event.id);
            
            if (options.onEvent) {
              options.onEvent(event);
            }
            
            yield event;
          }
        }
        
        // Clean up old IDs to prevent memory leak
        if (seenIds.size > 1000) {
          const idsArray = Array.from(seenIds);
          const toRemove = idsArray.slice(0, idsArray.length - 500);
          toRemove.forEach(id => seenIds.delete(id));
        }
        
      } catch (error) {
        console.error('Error streaming events:', error.message);
      }
      
      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  }

  /**
   * Filter events by type
   * @param {Array} events - Array of events
   * @param {string|Array<string>} types - Event type(s) to filter
   * @returns {Array} Filtered events
   */
  filterByType(events, types) {
    const typeArray = Array.isArray(types) ? types : [types];
    return events.filter(event => typeArray.includes(event.type));
  }

  /**
   * Filter events by repository
   * @param {Array} events - Array of events
   * @param {string} repoFullName - Repository full name (owner/repo)
   * @returns {Array} Filtered events
   */
  filterByRepo(events, repoFullName) {
    return events.filter(event => event.repo.name === repoFullName);
  }

  /**
   * Filter events by actor
   * @param {Array} events - Array of events
   * @param {string} username - Actor's username
   * @returns {Array} Filtered events
   */
  filterByActor(events, username) {
    return events.filter(event => event.actor.login === username);
  }

  /**
   * Group events by type
   * @param {Array} events - Array of events
   * @returns {Object} Events grouped by type
   */
  groupByType(events) {
    return events.reduce((groups, event) => {
      if (!groups[event.type]) {
        groups[event.type] = [];
      }
      groups[event.type].push(event);
      return groups;
    }, {});
  }

  /**
   * Get event statistics
   * @param {Array} events - Array of events
   * @returns {Object} Event statistics
   */
  getStatistics(events) {
    const stats = {
      total: events.length,
      types: {},
      actors: {},
      repos: {},
      publicEvents: 0,
      privateEvents: 0
    };

    for (const event of events) {
      // Count by type
      stats.types[event.type] = (stats.types[event.type] || 0) + 1;
      
      // Count by actor
      stats.actors[event.actor.login] = (stats.actors[event.actor.login] || 0) + 1;
      
      // Count by repo
      stats.repos[event.repo.name] = (stats.repos[event.repo.name] || 0) + 1;
      
      // Count public/private
      if (event.public) {
        stats.publicEvents++;
      } else {
        stats.privateEvents++;
      }
    }

    // Sort and limit top items
    stats.topTypes = Object.entries(stats.types)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    stats.topActors = Object.entries(stats.actors)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    stats.topRepos = Object.entries(stats.repos)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    return stats;
  }
}

export default EventsAPI;