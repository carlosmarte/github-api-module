/**
 * GitHub Notifications API
 * @module api/notifications
 */

import { buildPaginationParams, Paginator } from '../utils/pagination.mjs';

/**
 * Notifications API endpoints
 */
export class NotificationsAPI {
  /**
   * @param {HttpClient} http - HTTP client instance
   */
  constructor(http) {
    this.http = http;
  }

  /**
   * List notifications for authenticated user
   * @param {Object} options - Query options
   * @param {boolean} [options.all] - Show all notifications
   * @param {boolean} [options.participating] - Show only participating notifications
   * @param {string} [options.since] - Only show notifications updated after this time
   * @param {string} [options.before] - Only show notifications updated before this time
   * @param {number} [options.page] - Page number
   * @param {number} [options.per_page] - Items per page (max 50)
   * @returns {Promise<Object>} Notifications response
   */
  async list(options = {}) {
    const params = {
      ...buildPaginationParams(options),
      all: options.all,
      participating: options.participating,
      since: options.since,
      before: options.before
    };
    
    // Notifications API has max 50 per page
    if (params.per_page) {
      params.per_page = Math.min(50, params.per_page);
    }
    
    return this.http.get('/notifications', params);
  }

  /**
   * List repository notifications for authenticated user
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {Object} options - Query options
   * @param {boolean} [options.all] - Show all notifications
   * @param {boolean} [options.participating] - Show only participating notifications
   * @param {string} [options.since] - Only show notifications updated after this time
   * @param {string} [options.before] - Only show notifications updated before this time
   * @param {number} [options.page] - Page number
   * @param {number} [options.per_page] - Items per page
   * @returns {Promise<Object>} Notifications response
   */
  async listForRepo(owner, repo, options = {}) {
    const params = {
      ...buildPaginationParams(options),
      all: options.all,
      participating: options.participating,
      since: options.since,
      before: options.before
    };
    
    return this.http.get(`/repos/${owner}/${repo}/notifications`, params);
  }

  /**
   * Mark notifications as read
   * @param {Object} options - Mark options
   * @param {string} [options.last_read_at] - Mark notifications as read up to this time
   * @param {boolean} [options.read] - Whether to mark as read
   * @returns {Promise<Object>} Response
   */
  async markAsRead(options = {}) {
    return this.http.put('/notifications', {
      last_read_at: options.last_read_at || new Date().toISOString(),
      read: options.read !== false
    });
  }

  /**
   * Mark repository notifications as read
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {Object} options - Mark options
   * @param {string} [options.last_read_at] - Mark notifications as read up to this time
   * @returns {Promise<Object>} Response
   */
  async markRepoAsRead(owner, repo, options = {}) {
    return this.http.put(`/repos/${owner}/${repo}/notifications`, {
      last_read_at: options.last_read_at || new Date().toISOString()
    });
  }

  /**
   * Get a thread
   * @param {number} threadId - Thread ID
   * @returns {Promise<Object>} Thread
   */
  async getThread(threadId) {
    const response = await this.http.get(`/notifications/threads/${threadId}`);
    return response.data;
  }

  /**
   * Mark a thread as read
   * @param {number} threadId - Thread ID
   * @returns {Promise<Object>} Response
   */
  async markThreadAsRead(threadId) {
    return this.http.patch(`/notifications/threads/${threadId}`);
  }

  /**
   * Mark a thread as done
   * @param {number} threadId - Thread ID
   * @returns {Promise<Object>} Response
   */
  async markThreadAsDone(threadId) {
    return this.http.delete(`/notifications/threads/${threadId}`);
  }

  /**
   * Get thread subscription
   * @param {number} threadId - Thread ID
   * @returns {Promise<Object>} Subscription
   */
  async getThreadSubscription(threadId) {
    const response = await this.http.get(`/notifications/threads/${threadId}/subscription`);
    return response.data;
  }

  /**
   * Set thread subscription
   * @param {number} threadId - Thread ID
   * @param {Object} options - Subscription options
   * @param {boolean} [options.ignored] - Whether to ignore the thread
   * @returns {Promise<Object>} Subscription
   */
  async setThreadSubscription(threadId, options = {}) {
    const response = await this.http.put(
      `/notifications/threads/${threadId}/subscription`,
      { ignored: options.ignored || false }
    );
    return response.data;
  }

  /**
   * Delete thread subscription
   * @param {number} threadId - Thread ID
   * @returns {Promise<Object>} Response
   */
  async deleteThreadSubscription(threadId) {
    return this.http.delete(`/notifications/threads/${threadId}/subscription`);
  }

  /**
   * Get paginator for notifications
   * @param {Object} options - Query options
   * @returns {Paginator} Paginator instance
   */
  getPaginator(options = {}) {
    return new Paginator(
      (params) => this.list(params),
      options
    );
  }

  /**
   * Get paginator for repository notifications
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
   * Get all unread notifications
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Unread notifications
   */
  async getAllUnread(options = {}) {
    const response = await this.list({
      ...options,
      all: false
    });
    return response.data;
  }

  /**
   * Get all participating notifications
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Participating notifications
   */
  async getAllParticipating(options = {}) {
    const response = await this.list({
      ...options,
      participating: true
    });
    return response.data;
  }

  /**
   * Group notifications by repository
   * @param {Array} notifications - Array of notifications
   * @returns {Object} Notifications grouped by repository
   */
  groupByRepository(notifications) {
    return notifications.reduce((groups, notification) => {
      const repoName = notification.repository.full_name;
      if (!groups[repoName]) {
        groups[repoName] = [];
      }
      groups[repoName].push(notification);
      return groups;
    }, {});
  }

  /**
   * Group notifications by reason
   * @param {Array} notifications - Array of notifications
   * @returns {Object} Notifications grouped by reason
   */
  groupByReason(notifications) {
    return notifications.reduce((groups, notification) => {
      const reason = notification.reason;
      if (!groups[reason]) {
        groups[reason] = [];
      }
      groups[reason].push(notification);
      return groups;
    }, {});
  }

  /**
   * Filter notifications by subject type
   * @param {Array} notifications - Array of notifications
   * @param {string|Array<string>} types - Subject type(s) to filter
   * @returns {Array} Filtered notifications
   */
  filterBySubjectType(notifications, types) {
    const typeArray = Array.isArray(types) ? types : [types];
    return notifications.filter(notification => 
      typeArray.includes(notification.subject.type)
    );
  }

  /**
   * Filter unread notifications
   * @param {Array} notifications - Array of notifications
   * @returns {Array} Unread notifications
   */
  filterUnread(notifications) {
    return notifications.filter(notification => notification.unread);
  }

  /**
   * Get notification statistics
   * @param {Array} notifications - Array of notifications
   * @returns {Object} Notification statistics
   */
  getStatistics(notifications) {
    const stats = {
      total: notifications.length,
      unread: 0,
      reasons: {},
      subjectTypes: {},
      repositories: {}
    };

    for (const notification of notifications) {
      // Count unread
      if (notification.unread) {
        stats.unread++;
      }
      
      // Count by reason
      stats.reasons[notification.reason] = (stats.reasons[notification.reason] || 0) + 1;
      
      // Count by subject type
      stats.subjectTypes[notification.subject.type] = 
        (stats.subjectTypes[notification.subject.type] || 0) + 1;
      
      // Count by repository
      const repoName = notification.repository.full_name;
      stats.repositories[repoName] = (stats.repositories[repoName] || 0) + 1;
    }

    // Sort repositories by count
    stats.topRepositories = Object.entries(stats.repositories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    return stats;
  }

  /**
   * Mark multiple threads as read
   * @param {Array<number>} threadIds - Array of thread IDs
   * @returns {Promise<Array>} Results
   */
  async markMultipleAsRead(threadIds) {
    const promises = threadIds.map(id => 
      this.markThreadAsRead(id).catch(error => ({ id, error }))
    );
    return Promise.all(promises);
  }

  /**
   * Subscribe to multiple threads
   * @param {Array<number>} threadIds - Array of thread IDs
   * @param {Object} options - Subscription options
   * @returns {Promise<Array>} Results
   */
  async subscribeToMultiple(threadIds, options = {}) {
    const promises = threadIds.map(id => 
      this.setThreadSubscription(id, options).catch(error => ({ id, error }))
    );
    return Promise.all(promises);
  }
}

export default NotificationsAPI;