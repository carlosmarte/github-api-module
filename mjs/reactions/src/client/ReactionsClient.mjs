/**
 * GitHub Reactions API Client
 * @module client/ReactionsClient
 */

import { ValidationError } from '../core/errors.mjs';
import { REACTION_CONTENT, RELEASE_REACTION_CONTENT } from '../core/types.mjs';

export class ReactionsClient {
  #httpService;
  #logger;

  constructor(httpService, logger) {
    this.#httpService = httpService;
    this.#logger = logger;
  }

  // Team Discussion Comment Reactions

  /**
   * List reactions for a team discussion comment
   * @param {string} org - Organization name
   * @param {string} teamSlug - Team slug
   * @param {number} discussionNumber - Discussion number
   * @param {number} commentNumber - Comment number
   * @param {Object} [options] - List options
   * @returns {Promise<Object>} Response with reactions
   */
  async listForTeamDiscussionComment(org, teamSlug, discussionNumber, commentNumber, options = {}) {
    this.#validateRequired({ org, teamSlug, discussionNumber, commentNumber });
    
    const url = `/orgs/${org}/teams/${teamSlug}/discussions/${discussionNumber}/comments/${commentNumber}/reactions`;
    const params = this.#buildListParams(options);
    
    const response = await this.#httpService.get(`${url}${params ? `?${params}` : ''}`);
    
    if (options.autoPage) {
      return this.#fetchAllPages(response, url, options);
    }
    
    return this.#formatListResponse(response);
  }

  /**
   * Create reaction for a team discussion comment
   * @param {string} org - Organization name
   * @param {string} teamSlug - Team slug
   * @param {number} discussionNumber - Discussion number
   * @param {number} commentNumber - Comment number
   * @param {Object} options - Creation options
   * @param {string} options.content - Reaction content
   * @returns {Promise<Object>} Created reaction
   */
  async createForTeamDiscussionComment(org, teamSlug, discussionNumber, commentNumber, options) {
    this.#validateRequired({ org, teamSlug, discussionNumber, commentNumber });
    this.#validateReactionContent(options?.content);
    
    const url = `/orgs/${org}/teams/${teamSlug}/discussions/${discussionNumber}/comments/${commentNumber}/reactions`;
    
    const response = await this.#httpService.post(url, { content: options.content });
    return response.data;
  }

  /**
   * Delete team discussion comment reaction
   * @param {string} org - Organization name
   * @param {string} teamSlug - Team slug
   * @param {number} discussionNumber - Discussion number
   * @param {number} commentNumber - Comment number
   * @param {number} reactionId - Reaction ID
   * @returns {Promise<void>}
   */
  async deleteForTeamDiscussionComment(org, teamSlug, discussionNumber, commentNumber, reactionId) {
    this.#validateRequired({ org, teamSlug, discussionNumber, commentNumber, reactionId });
    
    const url = `/orgs/${org}/teams/${teamSlug}/discussions/${discussionNumber}/comments/${commentNumber}/reactions/${reactionId}`;
    await this.#httpService.delete(url);
  }

  // Team Discussion Reactions

  /**
   * List reactions for a team discussion
   * @param {string} org - Organization name
   * @param {string} teamSlug - Team slug
   * @param {number} discussionNumber - Discussion number
   * @param {Object} [options] - List options
   * @returns {Promise<Object>} Response with reactions
   */
  async listForTeamDiscussion(org, teamSlug, discussionNumber, options = {}) {
    this.#validateRequired({ org, teamSlug, discussionNumber });
    
    const url = `/orgs/${org}/teams/${teamSlug}/discussions/${discussionNumber}/reactions`;
    const params = this.#buildListParams(options);
    
    const response = await this.#httpService.get(`${url}${params ? `?${params}` : ''}`);
    
    if (options.autoPage) {
      return this.#fetchAllPages(response, url, options);
    }
    
    return this.#formatListResponse(response);
  }

  /**
   * Create reaction for a team discussion
   * @param {string} org - Organization name
   * @param {string} teamSlug - Team slug
   * @param {number} discussionNumber - Discussion number
   * @param {Object} options - Creation options
   * @param {string} options.content - Reaction content
   * @returns {Promise<Object>} Created reaction
   */
  async createForTeamDiscussion(org, teamSlug, discussionNumber, options) {
    this.#validateRequired({ org, teamSlug, discussionNumber });
    this.#validateReactionContent(options?.content);
    
    const url = `/orgs/${org}/teams/${teamSlug}/discussions/${discussionNumber}/reactions`;
    
    const response = await this.#httpService.post(url, { content: options.content });
    return response.data;
  }

  /**
   * Delete team discussion reaction
   * @param {string} org - Organization name
   * @param {string} teamSlug - Team slug
   * @param {number} discussionNumber - Discussion number
   * @param {number} reactionId - Reaction ID
   * @returns {Promise<void>}
   */
  async deleteForTeamDiscussion(org, teamSlug, discussionNumber, reactionId) {
    this.#validateRequired({ org, teamSlug, discussionNumber, reactionId });
    
    const url = `/orgs/${org}/teams/${teamSlug}/discussions/${discussionNumber}/reactions/${reactionId}`;
    await this.#httpService.delete(url);
  }

  // Commit Comment Reactions

  /**
   * List reactions for a commit comment
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {number} commentId - Comment ID
   * @param {Object} [options] - List options
   * @returns {Promise<Object>} Response with reactions
   */
  async listForCommitComment(owner, repo, commentId, options = {}) {
    this.#validateRequired({ owner, repo, commentId });
    
    const url = `/repos/${owner}/${repo}/comments/${commentId}/reactions`;
    const params = this.#buildListParams(options);
    
    const response = await this.#httpService.get(`${url}${params ? `?${params}` : ''}`);
    
    if (options.autoPage) {
      return this.#fetchAllPages(response, url, options);
    }
    
    return this.#formatListResponse(response);
  }

  /**
   * Create reaction for a commit comment
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {number} commentId - Comment ID
   * @param {Object} options - Creation options
   * @param {string} options.content - Reaction content
   * @returns {Promise<Object>} Created reaction
   */
  async createForCommitComment(owner, repo, commentId, options) {
    this.#validateRequired({ owner, repo, commentId });
    this.#validateReactionContent(options?.content);
    
    const url = `/repos/${owner}/${repo}/comments/${commentId}/reactions`;
    
    const response = await this.#httpService.post(url, { content: options.content });
    return response.data;
  }

  /**
   * Delete a commit comment reaction
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {number} commentId - Comment ID
   * @param {number} reactionId - Reaction ID
   * @returns {Promise<void>}
   */
  async deleteForCommitComment(owner, repo, commentId, reactionId) {
    this.#validateRequired({ owner, repo, commentId, reactionId });
    
    const url = `/repos/${owner}/${repo}/comments/${commentId}/reactions/${reactionId}`;
    await this.#httpService.delete(url);
  }

  // Issue Comment Reactions

  /**
   * List reactions for an issue comment
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {number} commentId - Comment ID
   * @param {Object} [options] - List options
   * @returns {Promise<Object>} Response with reactions
   */
  async listForIssueComment(owner, repo, commentId, options = {}) {
    this.#validateRequired({ owner, repo, commentId });
    
    const url = `/repos/${owner}/${repo}/issues/comments/${commentId}/reactions`;
    const params = this.#buildListParams(options);
    
    const response = await this.#httpService.get(`${url}${params ? `?${params}` : ''}`);
    
    if (options.autoPage) {
      return this.#fetchAllPages(response, url, options);
    }
    
    return this.#formatListResponse(response);
  }

  /**
   * Create reaction for an issue comment
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {number} commentId - Comment ID
   * @param {Object} options - Creation options
   * @param {string} options.content - Reaction content
   * @returns {Promise<Object>} Created reaction
   */
  async createForIssueComment(owner, repo, commentId, options) {
    this.#validateRequired({ owner, repo, commentId });
    this.#validateReactionContent(options?.content);
    
    const url = `/repos/${owner}/${repo}/issues/comments/${commentId}/reactions`;
    
    const response = await this.#httpService.post(url, { content: options.content });
    return response.data;
  }

  /**
   * Delete an issue comment reaction
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {number} commentId - Comment ID
   * @param {number} reactionId - Reaction ID
   * @returns {Promise<void>}
   */
  async deleteForIssueComment(owner, repo, commentId, reactionId) {
    this.#validateRequired({ owner, repo, commentId, reactionId });
    
    const url = `/repos/${owner}/${repo}/issues/comments/${commentId}/reactions/${reactionId}`;
    await this.#httpService.delete(url);
  }

  // Issue Reactions

  /**
   * List reactions for an issue
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {number} issueNumber - Issue number
   * @param {Object} [options] - List options
   * @returns {Promise<Object>} Response with reactions
   */
  async listForIssue(owner, repo, issueNumber, options = {}) {
    this.#validateRequired({ owner, repo, issueNumber });
    
    const url = `/repos/${owner}/${repo}/issues/${issueNumber}/reactions`;
    const params = this.#buildListParams(options);
    
    const response = await this.#httpService.get(`${url}${params ? `?${params}` : ''}`);
    
    if (options.autoPage) {
      return this.#fetchAllPages(response, url, options);
    }
    
    return this.#formatListResponse(response);
  }

  /**
   * Create reaction for an issue
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {number} issueNumber - Issue number
   * @param {Object} options - Creation options
   * @param {string} options.content - Reaction content
   * @returns {Promise<Object>} Created reaction
   */
  async createForIssue(owner, repo, issueNumber, options) {
    this.#validateRequired({ owner, repo, issueNumber });
    this.#validateReactionContent(options?.content);
    
    const url = `/repos/${owner}/${repo}/issues/${issueNumber}/reactions`;
    
    const response = await this.#httpService.post(url, { content: options.content });
    return response.data;
  }

  /**
   * Delete an issue reaction
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {number} issueNumber - Issue number
   * @param {number} reactionId - Reaction ID
   * @returns {Promise<void>}
   */
  async deleteForIssue(owner, repo, issueNumber, reactionId) {
    this.#validateRequired({ owner, repo, issueNumber, reactionId });
    
    const url = `/repos/${owner}/${repo}/issues/${issueNumber}/reactions/${reactionId}`;
    await this.#httpService.delete(url);
  }

  // Pull Request Review Comment Reactions

  /**
   * List reactions for a pull request review comment
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {number} commentId - Comment ID
   * @param {Object} [options] - List options
   * @returns {Promise<Object>} Response with reactions
   */
  async listForPullRequestReviewComment(owner, repo, commentId, options = {}) {
    this.#validateRequired({ owner, repo, commentId });
    
    const url = `/repos/${owner}/${repo}/pulls/comments/${commentId}/reactions`;
    const params = this.#buildListParams(options);
    
    const response = await this.#httpService.get(`${url}${params ? `?${params}` : ''}`);
    
    if (options.autoPage) {
      return this.#fetchAllPages(response, url, options);
    }
    
    return this.#formatListResponse(response);
  }

  /**
   * Create reaction for a pull request review comment
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {number} commentId - Comment ID
   * @param {Object} options - Creation options
   * @param {string} options.content - Reaction content
   * @returns {Promise<Object>} Created reaction
   */
  async createForPullRequestReviewComment(owner, repo, commentId, options) {
    this.#validateRequired({ owner, repo, commentId });
    this.#validateReactionContent(options?.content);
    
    const url = `/repos/${owner}/${repo}/pulls/comments/${commentId}/reactions`;
    
    const response = await this.#httpService.post(url, { content: options.content });
    return response.data;
  }

  /**
   * Delete a pull request comment reaction
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {number} commentId - Comment ID
   * @param {number} reactionId - Reaction ID
   * @returns {Promise<void>}
   */
  async deleteForPullRequestComment(owner, repo, commentId, reactionId) {
    this.#validateRequired({ owner, repo, commentId, reactionId });
    
    const url = `/repos/${owner}/${repo}/pulls/comments/${commentId}/reactions/${reactionId}`;
    await this.#httpService.delete(url);
  }

  // Release Reactions

  /**
   * List reactions for a release
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {number} releaseId - Release ID
   * @param {Object} [options] - List options
   * @returns {Promise<Object>} Response with reactions
   */
  async listForRelease(owner, repo, releaseId, options = {}) {
    this.#validateRequired({ owner, repo, releaseId });
    
    const url = `/repos/${owner}/${repo}/releases/${releaseId}/reactions`;
    const params = this.#buildListParams(options, true); // Release reactions have limited content types
    
    const response = await this.#httpService.get(`${url}${params ? `?${params}` : ''}`);
    
    if (options.autoPage) {
      return this.#fetchAllPages(response, url, options);
    }
    
    return this.#formatListResponse(response);
  }

  /**
   * Create reaction for a release
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {number} releaseId - Release ID
   * @param {Object} options - Creation options
   * @param {string} options.content - Reaction content
   * @returns {Promise<Object>} Created reaction
   */
  async createForRelease(owner, repo, releaseId, options) {
    this.#validateRequired({ owner, repo, releaseId });
    this.#validateReleaseReactionContent(options?.content);
    
    const url = `/repos/${owner}/${repo}/releases/${releaseId}/reactions`;
    
    const response = await this.#httpService.post(url, { content: options.content });
    return response.data;
  }

  /**
   * Delete a release reaction
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {number} releaseId - Release ID
   * @param {number} reactionId - Reaction ID
   * @returns {Promise<void>}
   */
  async deleteForRelease(owner, repo, releaseId, reactionId) {
    this.#validateRequired({ owner, repo, releaseId, reactionId });
    
    const url = `/repos/${owner}/${repo}/releases/${releaseId}/reactions/${reactionId}`;
    await this.#httpService.delete(url);
  }

  // Private helper methods

  #validateRequired(params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === '') {
        throw new ValidationError(`Required parameter missing: ${key}`);
      }
    }
  }

  #validateReactionContent(content) {
    if (!content || !Object.values(REACTION_CONTENT).includes(content)) {
      throw new ValidationError(
        `Invalid reaction content: ${content}. Must be one of: ${Object.values(REACTION_CONTENT).join(', ')}`
      );
    }
  }

  #validateReleaseReactionContent(content) {
    if (!content || !Object.values(RELEASE_REACTION_CONTENT).includes(content)) {
      throw new ValidationError(
        `Invalid release reaction content: ${content}. Must be one of: ${Object.values(RELEASE_REACTION_CONTENT).join(', ')}`
      );
    }
  }

  #buildListParams(options, isRelease = false) {
    const params = new URLSearchParams();
    
    if (options.content) {
      if (isRelease) {
        this.#validateReleaseReactionContent(options.content);
      } else {
        this.#validateReactionContent(options.content);
      }
      params.append('content', options.content);
    }
    
    if (options.perPage && options.perPage !== 30) {
      params.append('per_page', options.perPage.toString());
    }
    
    if (options.page && options.page !== 1) {
      params.append('page', options.page.toString());
    }
    
    return params.toString();
  }

  #formatListResponse(response) {
    const pagination = this.#httpService.parsePagination(response.headers.link);
    
    return {
      data: response.data,
      pagination: {
        page: parseInt(new URL(response.url).searchParams.get('page')) || 1,
        perPage: parseInt(new URL(response.url).searchParams.get('per_page')) || 30,
        ...pagination,
      },
    };
  }

  async #fetchAllPages(initialResponse, baseUrl, options) {
    let allData = [...initialResponse.data];
    let currentResponse = initialResponse;
    
    while (currentResponse.headers.link?.includes('rel="next"')) {
      const pagination = this.#httpService.parsePagination(currentResponse.headers.link);
      if (!pagination.nextUrl) break;
      
      this.#logger.debug(`Fetching next page: ${pagination.nextUrl}`);
      currentResponse = await this.#httpService.get(pagination.nextUrl);
      allData.push(...currentResponse.data);
    }
    
    const finalPagination = this.#httpService.parsePagination(currentResponse.headers.link);
    
    return {
      data: allData,
      pagination: {
        page: 1,
        perPage: allData.length,
        totalPages: finalPagination.totalPages,
        totalItems: allData.length,
      },
    };
  }
}