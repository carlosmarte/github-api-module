import { request } from './utils/http.mjs';
import { buildQueryString } from './utils/query.mjs';
import { validateOptions } from './utils/validation.mjs';

class TeamsClient {
  constructor(options = {}) {
    // Validate token requirement - be strict about requiring a token in options
    if (!options.token) {
      throw new Error('GitHub token is required. Provide token in options or set GITHUB_TOKEN environment variable.');
    }

    // Validate token type
    if (options.token !== undefined && typeof options.token !== 'string') {
      throw new Error('Token must be a string');
    }

    this.token = options.token;
    this.baseURL = options.baseURL || 'https://api.github.com';  // Change baseUrl to baseURL to match tests
    this.baseUrl = this.baseURL;  // Keep backwards compatibility
    this.headers = {
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...options.headers
    };
    
    if (this.token) {
      this.headers['Authorization'] = `Bearer ${this.token}`;
    }
  }

  async listTeams(org, options = {}) {
    validateOptions(options, ['per_page', 'page']);
    const query = buildQueryString(options);
    return request({
      method: 'GET',
      url: `${this.baseURL}/orgs/${org}/teams${query}`,
      headers: this.headers
    });
  }

  async createTeam(org, data) {
    return request({
      method: 'POST',
      url: `${this.baseURL}/orgs/${org}/teams`,
      headers: this.headers,
      body: data
    });
  }

  async getTeam(org, teamSlug) {
    if (!org || !teamSlug) {
      throw new Error('Both org and team parameters are required');
    }
    return request({
      method: 'GET',
      url: `${this.baseURL}/orgs/${org}/teams/${teamSlug}`,
      headers: this.headers
    });
  }

  async updateTeam(org, teamSlug, data) {
    if (!org || !teamSlug) {
      throw new Error('Both org and team parameters are required');
    }
    if (!data) {
      throw new Error('Data parameter is required');
    }
    return request({
      method: 'PATCH',
      url: `${this.baseURL}/orgs/${org}/teams/${teamSlug}`,
      headers: this.headers,
      body: data
    });
  }

  async deleteTeam(org, teamSlug) {
    if (!org || !teamSlug) {
      throw new Error('Both org and team parameters are required');
    }
    return request({
      method: 'DELETE',
      url: `${this.baseURL}/orgs/${org}/teams/${teamSlug}`,
      headers: this.headers
    });
  }

  async listTeamMembers(org, teamSlug, options = {}) {
    if (!org || !teamSlug) {
      throw new Error('Both org and team parameters are required');
    }
    validateOptions(options, ['role', 'per_page', 'page']);
    const query = buildQueryString(options);
    return request({
      method: 'GET',
      url: `${this.baseURL}/orgs/${org}/teams/${teamSlug}/members${query}`,
      headers: this.headers
    });
  }

  async addTeamMember(org, teamSlug, username, options = {}) {
    if (!org || !teamSlug) {
      throw new Error('Both org and team parameters are required');
    }
    if (!username) {
      throw new Error('Username parameter is required');
    }
    return request({
      method: 'PUT',
      url: `${this.baseURL}/orgs/${org}/teams/${teamSlug}/memberships/${username}`,
      headers: this.headers,
      body: options
    });
  }

  async removeTeamMember(org, teamSlug, username) {
    if (!org || !teamSlug) {
      throw new Error('Both org and team parameters are required');
    }
    if (!username) {
      throw new Error('Username parameter is required');
    }
    return request({
      method: 'DELETE',
      url: `${this.baseURL}/orgs/${org}/teams/${teamSlug}/memberships/${username}`,
      headers: this.headers
    });
  }

  async getTeamMembership(org, teamSlug, username) {
    if (!org || !teamSlug) {
      throw new Error('Both org and team parameters are required');
    }
    if (!username) {
      throw new Error('Username parameter is required');
    }
    return request({
      method: 'GET',
      url: `${this.baseURL}/orgs/${org}/teams/${teamSlug}/memberships/${username}`,
      headers: this.headers
    });
  }

  async listTeamRepos(org, teamSlug, options = {}) {
    validateOptions(options, ['per_page', 'page']);
    const query = buildQueryString(options);
    return request({
      method: 'GET',
      url: `${this.baseURL}/orgs/${org}/teams/${teamSlug}/repos${query}`,
      headers: this.headers
    });
  }

  async addTeamRepo(org, teamSlug, owner, repo, options = {}) {
    return request({
      method: 'PUT',
      url: `${this.baseURL}/orgs/${org}/teams/${teamSlug}/repos/${owner}/${repo}`,
      headers: this.headers,
      body: options
    });
  }

  async removeTeamRepo(org, teamSlug, owner, repo) {
    return request({
      method: 'DELETE',
      url: `${this.baseURL}/orgs/${org}/teams/${teamSlug}/repos/${owner}/${repo}`,
      headers: this.headers
    });
  }

  async checkTeamRepo(org, teamSlug, owner, repo) {
    return request({
      method: 'GET',
      url: `${this.baseURL}/orgs/${org}/teams/${teamSlug}/repos/${owner}/${repo}`,
      headers: this.headers
    });
  }

  async listTeamProjects(org, teamSlug, options = {}) {
    validateOptions(options, ['per_page', 'page']);
    const query = buildQueryString(options);
    return request({
      method: 'GET',
      url: `${this.baseURL}/orgs/${org}/teams/${teamSlug}/projects${query}`,
      headers: {
        ...this.headers,
        'Accept': 'application/vnd.github.inertia-preview+json'
      }
    });
  }

  async addTeamProject(org, teamSlug, projectId, options = {}) {
    return request({
      method: 'PUT',
      url: `${this.baseURL}/orgs/${org}/teams/${teamSlug}/projects/${projectId}`,
      headers: {
        ...this.headers,
        'Accept': 'application/vnd.github.inertia-preview+json'
      },
      body: options
    });
  }

  async removeTeamProject(org, teamSlug, projectId) {
    return request({
      method: 'DELETE',
      url: `${this.baseURL}/orgs/${org}/teams/${teamSlug}/projects/${projectId}`,
      headers: {
        ...this.headers,
        'Accept': 'application/vnd.github.inertia-preview+json'
      }
    });
  }

  async checkTeamProject(org, teamSlug, projectId) {
    return request({
      method: 'GET',
      url: `${this.baseURL}/orgs/${org}/teams/${teamSlug}/projects/${projectId}`,
      headers: {
        ...this.headers,
        'Accept': 'application/vnd.github.inertia-preview+json'
      }
    });
  }

  async listTeamDiscussions(org, teamSlug, options = {}) {
    validateOptions(options, ['direction', 'per_page', 'page']);
    const query = buildQueryString(options);
    return request({
      method: 'GET',
      url: `${this.baseURL}/orgs/${org}/teams/${teamSlug}/discussions${query}`,
      headers: this.headers
    });
  }

  async createTeamDiscussion(org, teamSlug, data) {
    return request({
      method: 'POST',
      url: `${this.baseURL}/orgs/${org}/teams/${teamSlug}/discussions`,
      headers: this.headers,
      body: data
    });
  }

  async getTeamDiscussion(org, teamSlug, discussionNumber) {
    return request({
      method: 'GET',
      url: `${this.baseURL}/orgs/${org}/teams/${teamSlug}/discussions/${discussionNumber}`,
      headers: this.headers
    });
  }

  async updateTeamDiscussion(org, teamSlug, discussionNumber, data) {
    return request({
      method: 'PATCH',
      url: `${this.baseURL}/orgs/${org}/teams/${teamSlug}/discussions/${discussionNumber}`,
      headers: this.headers,
      body: data
    });
  }

  async deleteTeamDiscussion(org, teamSlug, discussionNumber) {
    return request({
      method: 'DELETE',
      url: `${this.baseURL}/orgs/${org}/teams/${teamSlug}/discussions/${discussionNumber}`,
      headers: this.headers
    });
  }

  async listDiscussionComments(org, teamSlug, discussionNumber, options = {}) {
    validateOptions(options, ['direction', 'per_page', 'page']);
    const query = buildQueryString(options);
    return request({
      method: 'GET',
      url: `${this.baseURL}/orgs/${org}/teams/${teamSlug}/discussions/${discussionNumber}/comments${query}`,
      headers: this.headers
    });
  }

  async createDiscussionComment(org, teamSlug, discussionNumber, data) {
    return request({
      method: 'POST',
      url: `${this.baseURL}/orgs/${org}/teams/${teamSlug}/discussions/${discussionNumber}/comments`,
      headers: this.headers,
      body: data
    });
  }

  async getDiscussionComment(org, teamSlug, discussionNumber, commentNumber) {
    return request({
      method: 'GET',
      url: `${this.baseURL}/orgs/${org}/teams/${teamSlug}/discussions/${discussionNumber}/comments/${commentNumber}`,
      headers: this.headers
    });
  }

  async updateDiscussionComment(org, teamSlug, discussionNumber, commentNumber, data) {
    return request({
      method: 'PATCH',
      url: `${this.baseURL}/orgs/${org}/teams/${teamSlug}/discussions/${discussionNumber}/comments/${commentNumber}`,
      headers: this.headers,
      body: data
    });
  }

  async deleteDiscussionComment(org, teamSlug, discussionNumber, commentNumber) {
    return request({
      method: 'DELETE',
      url: `${this.baseURL}/orgs/${org}/teams/${teamSlug}/discussions/${discussionNumber}/comments/${commentNumber}`,
      headers: this.headers
    });
  }

  async listChildTeams(org, teamSlug, options = {}) {
    validateOptions(options, ['per_page', 'page']);
    const query = buildQueryString(options);
    return request({
      method: 'GET',
      url: `${this.baseURL}/orgs/${org}/teams/${teamSlug}/teams${query}`,
      headers: this.headers
    });
  }

  async listTeamsForUser(username, options = {}) {
    validateOptions(options, ['per_page', 'page']);
    const query = buildQueryString(options);
    return request({
      method: 'GET',
      url: `${this.baseURL}/users/${username}/teams${query}`,
      headers: this.headers
    });
  }

  async listPendingInvitations(org, teamSlug, options = {}) {
    validateOptions(options, ['per_page', 'page']);
    const query = buildQueryString(options);
    return request({
      method: 'GET',
      url: `${this.baseURL}/orgs/${org}/teams/${teamSlug}/invitations${query}`,
      headers: this.headers
    });
  }
}

export default TeamsClient;

export const {
  listTeams,
  createTeam,
  getTeam,
  updateTeam,
  deleteTeam,
  listTeamMembers,
  addTeamMember,
  removeTeamMember,
  getTeamMembership,
  listTeamRepos,
  addTeamRepo,
  removeTeamRepo,
  checkTeamRepo,
  listTeamProjects,
  addTeamProject,
  removeTeamProject,
  checkTeamProject,
  listTeamDiscussions,
  createTeamDiscussion,
  getTeamDiscussion,
  updateTeamDiscussion,
  deleteTeamDiscussion,
  listDiscussionComments,
  createDiscussionComment,
  getDiscussionComment,
  updateDiscussionComment,
  deleteDiscussionComment,
  listChildTeams,
  listTeamsForUser,
  listPendingInvitations
} = TeamsClient.prototype;