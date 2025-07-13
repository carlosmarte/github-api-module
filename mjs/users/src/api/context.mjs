/**
 * @fileoverview GitHub Users Context API (Hovercard)
 * @module ContextAPI
 */

import { validateUsername } from '../utils/validation.mjs';
import { NotFoundError, ValidationError, AuthError } from '../utils/errors.mjs';

/**
 * Context API for user hovercard information
 */
export class ContextAPI {
  /**
   * Create ContextAPI instance
   * @param {HttpClient} http - HTTP client instance
   */
  constructor(http) {
    this.http = http;
  }

  /**
   * Get contextual information for a user
   * Provides hovercard information. You can find out more about someone in relation
   * to their pull requests, issues, repositories, and organizations.
   * 
   * The `subject_type` and `subject_id` parameters provide context for the person's
   * hovercard, which returns more information than without the parameters.
   * 
   * @param {string} username - The handle for the GitHub user account
   * @param {Object} [options] - Request options
   * @param {string} [options.subject_type] - Identifies which additional information you'd like to receive about the person's hovercard
   * @param {string} [options.subject_id] - Uses the ID for the `subject_type` you specified
   * @returns {Promise<Object>} Context object with hovercard information
   * 
   * @example
   * ```javascript
   * // Basic context without additional information
   * const context = await client.context.getForUser('octocat');
   * 
   * // Context in relation to a repository
   * const context = await client.context.getForUser('octocat', {
   *   subject_type: 'repository',
   *   subject_id: '1296269'
   * });
   * 
   * // Context in relation to an organization
   * const context = await client.context.getForUser('octocat', {
   *   subject_type: 'organization',
   *   subject_id: 'github'
   * });
   * ```
   */
  async getForUser(username, options = {}) {
    if (!validateUsername(username)) {
      throw new ValidationError('Invalid username format');
    }

    const params = {};
    
    // Add subject context if provided
    if (options.subject_type) {
      const validSubjectTypes = ['repository', 'issue', 'pull_request', 'organization'];
      if (!validSubjectTypes.includes(options.subject_type)) {
        throw new ValidationError(`Invalid subject_type. Must be one of: ${validSubjectTypes.join(', ')}`);
      }
      params.subject_type = options.subject_type;
      
      if (options.subject_id) {
        params.subject_id = options.subject_id;
      }
    }

    try {
      const response = await this.http.get(`/users/${username}/hovercard`, {
        params,
        ...options
      });
      
      return response;
    } catch (error) {
      if (error.status === 404) {
        throw new NotFoundError(`User '${username}' not found or hovercard not available`);
      }
      if (error.status === 401) {
        throw new AuthError('Authentication required for hovercard information');
      }
      throw error;
    }
  }

  /**
   * Get context for user in relation to a repository
   * @param {string} username - Username
   * @param {string|number} repositoryId - Repository ID or full name (owner/repo)
   * @param {Object} [options] - Request options
   * @returns {Promise<Object>} Context object
   */
  async getForUserInRepository(username, repositoryId, options = {}) {
    return this.getForUser(username, {
      ...options,
      subject_type: 'repository',
      subject_id: repositoryId.toString()
    });
  }

  /**
   * Get context for user in relation to an organization
   * @param {string} username - Username
   * @param {string} organizationId - Organization ID or login
   * @param {Object} [options] - Request options
   * @returns {Promise<Object>} Context object
   */
  async getForUserInOrganization(username, organizationId, options = {}) {
    return this.getForUser(username, {
      ...options,
      subject_type: 'organization',
      subject_id: organizationId.toString()
    });
  }

  /**
   * Get context for user in relation to an issue
   * @param {string} username - Username
   * @param {string|number} issueId - Issue ID
   * @param {Object} [options] - Request options
   * @returns {Promise<Object>} Context object
   */
  async getForUserInIssue(username, issueId, options = {}) {
    return this.getForUser(username, {
      ...options,
      subject_type: 'issue',
      subject_id: issueId.toString()
    });
  }

  /**
   * Get context for user in relation to a pull request
   * @param {string} username - Username
   * @param {string|number} pullRequestId - Pull request ID
   * @param {Object} [options] - Request options
   * @returns {Promise<Object>} Context object
   */
  async getForUserInPullRequest(username, pullRequestId, options = {}) {
    return this.getForUser(username, {
      ...options,
      subject_type: 'pull_request',
      subject_id: pullRequestId.toString()
    });
  }

  /**
   * Get context for multiple users
   * @param {Array<string>} usernames - Array of usernames
   * @param {Object} [options] - Options
   * @param {string} [options.subject_type] - Subject type for all users
   * @param {string} [options.subject_id] - Subject ID for all users
   * @param {boolean} [options.continueOnError=false] - Continue if some users fail
   * @returns {Promise<Object>} Result with successful and failed lookups
   */
  async getForMultipleUsers(usernames, options = {}) {
    const successful = [];
    const failed = [];

    for (const username of usernames) {
      try {
        const context = await this.getForUser(username, options);
        successful.push({
          username,
          context
        });
      } catch (error) {
        if (options.continueOnError) {
          failed.push({
            username,
            error: error.message
          });
        } else {
          throw error;
        }
      }
    }

    return { successful, failed };
  }

  /**
   * Extract context messages from hovercard response
   * @param {Object} hovercardResponse - Hovercard response object
   * @returns {Array<string>} Array of context messages
   */
  extractMessages(hovercardResponse) {
    if (!hovercardResponse || !hovercardResponse.contexts) {
      return [];
    }

    return hovercardResponse.contexts.map(context => context.message).filter(Boolean);
  }

  /**
   * Check if user has context in specific subject
   * @param {string} username - Username
   * @param {string} subjectType - Subject type
   * @param {string} subjectId - Subject ID
   * @param {Object} [options] - Request options
   * @returns {Promise<boolean>} True if user has context
   */
  async hasContextInSubject(username, subjectType, subjectId, options = {}) {
    try {
      const context = await this.getForUser(username, {
        ...options,
        subject_type: subjectType,
        subject_id: subjectId
      });
      
      return context && context.contexts && context.contexts.length > 0;
    } catch (error) {
      if (error instanceof NotFoundError) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get simplified context summary
   * @param {string} username - Username
   * @param {Object} [options] - Request options
   * @returns {Promise<Object>} Simplified context summary
   */
  async getSummary(username, options = {}) {
    const context = await this.getForUser(username, options);
    
    const messages = this.extractMessages(context);
    
    return {
      username,
      hasContext: messages.length > 0,
      messageCount: messages.length,
      messages,
      subjectType: options.subject_type || null,
      subjectId: options.subject_id || null
    };
  }

  /**
   * Compare user context across different subjects
   * @param {string} username - Username
   * @param {Array<Object>} subjects - Array of subject objects with type and id
   * @param {Object} [options] - Request options
   * @returns {Promise<Object>} Comparison results
   */
  async compareContextAcrossSubjects(username, subjects, options = {}) {
    const results = [];
    
    for (const subject of subjects) {
      try {
        const context = await this.getForUser(username, {
          ...options,
          subject_type: subject.type,
          subject_id: subject.id
        });
        
        results.push({
          subject,
          hasContext: context && context.contexts && context.contexts.length > 0,
          messageCount: context?.contexts?.length || 0,
          messages: this.extractMessages(context)
        });
      } catch (error) {
        results.push({
          subject,
          hasContext: false,
          messageCount: 0,
          messages: [],
          error: error.message
        });
      }
    }
    
    return {
      username,
      subjects: results,
      totalSubjects: results.length,
      subjectsWithContext: results.filter(r => r.hasContext).length
    };
  }
}

/**
 * Export context API functions for direct usage
 */

/**
 * Get contextual information for a user
 * @param {HttpClient} http - HTTP client instance
 * @param {string} username - Username
 * @param {Object} [options] - Request options
 * @returns {Promise<Object>} Context object
 */
export async function getForUser(http, username, options = {}) {
  const api = new ContextAPI(http);
  return api.getForUser(username, options);
}

/**
 * Get context for user in relation to a repository
 * @param {HttpClient} http - HTTP client instance
 * @param {string} username - Username
 * @param {string|number} repositoryId - Repository ID
 * @param {Object} [options] - Request options
 * @returns {Promise<Object>} Context object
 */
export async function getForUserInRepository(http, username, repositoryId, options = {}) {
  const api = new ContextAPI(http);
  return api.getForUserInRepository(username, repositoryId, options);
}

/**
 * Get context for user in relation to an organization
 * @param {HttpClient} http - HTTP client instance
 * @param {string} username - Username
 * @param {string} organizationId - Organization ID
 * @param {Object} [options] - Request options
 * @returns {Promise<Object>} Context object
 */
export async function getForUserInOrganization(http, username, organizationId, options = {}) {
  const api = new ContextAPI(http);
  return api.getForUserInOrganization(username, organizationId, options);
}