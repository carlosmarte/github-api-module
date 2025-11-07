/**
 * @fileoverview Test setup for GitHub Users API module
 */

import { jest } from '@jest/globals';
import nock from 'nock';

// Setup test environment
beforeEach(() => {
  // Clear any existing HTTP mocks
  nock.cleanAll();
  
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.GITHUB_TOKEN = 'test-token-123';
});

afterEach(() => {
  // Clean up HTTP mocks
  if (!nock.isDone()) {
    console.warn('Pending HTTP mocks:', nock.pendingMocks());
    nock.cleanAll();
  }
});

// Global test utilities
global.mockGitHubAPI = (baseUrl = 'https://api.github.com') => {
  return nock(baseUrl)
    .defaultReplyHeaders({
      'content-type': 'application/json',
      'x-ratelimit-limit': '5000',
      'x-ratelimit-remaining': '4999',
      'x-ratelimit-reset': Math.floor(Date.now() / 1000) + 3600,
      'x-oauth-scopes': 'user, user:email, repo'
    });
};

// Mock user data
global.mockUserData = {
  simple: {
    id: 1,
    login: 'octocat',
    node_id: 'MDQ6VXNlcjE=',
    avatar_url: 'https://github.com/images/error/octocat_happy.gif',
    gravatar_id: '',
    url: 'https://api.github.com/users/octocat',
    html_url: 'https://github.com/octocat',
    followers_url: 'https://api.github.com/users/octocat/followers',
    following_url: 'https://api.github.com/users/octocat/following{/other_user}',
    gists_url: 'https://api.github.com/users/octocat/gists{/gist_id}',
    starred_url: 'https://api.github.com/users/octocat/starred{/owner}{/repo}',
    subscriptions_url: 'https://api.github.com/users/octocat/subscriptions',
    organizations_url: 'https://api.github.com/users/octocat/orgs',
    repos_url: 'https://api.github.com/users/octocat/repos',
    events_url: 'https://api.github.com/users/octocat/events{/privacy}',
    received_events_url: 'https://api.github.com/users/octocat/received_events',
    type: 'User',
    site_admin: false
  },
  
  public: {
    login: 'octocat',
    id: 1,
    node_id: 'MDQ6VXNlcjE=',
    avatar_url: 'https://github.com/images/error/octocat_happy.gif',
    gravatar_id: '',
    url: 'https://api.github.com/users/octocat',
    html_url: 'https://github.com/octocat',
    followers_url: 'https://api.github.com/users/octocat/followers',
    following_url: 'https://api.github.com/users/octocat/following{/other_user}',
    gists_url: 'https://api.github.com/users/octocat/gists{/gist_id}',
    starred_url: 'https://api.github.com/users/octocat/starred{/owner}{/repo}',
    subscriptions_url: 'https://api.github.com/users/octocat/subscriptions',
    organizations_url: 'https://api.github.com/users/octocat/orgs',
    repos_url: 'https://api.github.com/users/octocat/repos',
    events_url: 'https://api.github.com/users/octocat/events{/privacy}',
    received_events_url: 'https://api.github.com/users/octocat/received_events',
    type: 'User',
    site_admin: false,
    name: 'The Octocat',
    company: 'GitHub',
    blog: 'https://github.com/blog',
    location: 'San Francisco',
    email: 'octocat@github.com',
    hireable: true,
    bio: 'There once was...',
    twitter_username: 'octocat',
    public_repos: 2,
    public_gists: 1,
    followers: 20,
    following: 0,
    created_at: '2008-01-14T04:33:35Z',
    updated_at: '2008-01-14T04:33:35Z'
  },
  
  private: {
    login: 'octocat',
    id: 1,
    node_id: 'MDQ6VXNlcjE=',
    avatar_url: 'https://github.com/images/error/octocat_happy.gif',
    gravatar_id: '',
    url: 'https://api.github.com/users/octocat',
    html_url: 'https://github.com/octocat',
    followers_url: 'https://api.github.com/users/octocat/followers',
    following_url: 'https://api.github.com/users/octocat/following{/other_user}',
    gists_url: 'https://api.github.com/users/octocat/gists{/gist_id}',
    starred_url: 'https://api.github.com/users/octocat/starred{/owner}{/repo}',
    subscriptions_url: 'https://api.github.com/users/octocat/subscriptions',
    organizations_url: 'https://api.github.com/users/octocat/orgs',
    repos_url: 'https://api.github.com/users/octocat/repos',
    events_url: 'https://api.github.com/users/octocat/events{/privacy}',
    received_events_url: 'https://api.github.com/users/octocat/received_events',
    type: 'User',
    site_admin: false,
    name: 'The Octocat',
    company: 'GitHub',
    blog: 'https://github.com/blog',
    location: 'San Francisco',
    email: 'octocat@github.com',
    hireable: true,
    bio: 'There once was...',
    twitter_username: 'octocat',
    public_repos: 2,
    public_gists: 1,
    followers: 20,
    following: 0,
    created_at: '2008-01-14T04:33:35Z',
    updated_at: '2008-01-14T04:33:35Z',
    private_gists: 81,
    total_private_repos: 100,
    owned_private_repos: 100,
    disk_usage: 10000,
    collaborators: 8,
    two_factor_authentication: true,
    plan: {
      name: 'Medium',
      space: 400,
      private_repos: 20,
      collaborators: 0
    }
  }
};

global.mockEmailData = [
  {
    email: 'user@example.com',
    verified: true,
    primary: true,
    visibility: 'public'
  },
  {
    email: 'private@example.com',
    verified: true,
    primary: false,
    visibility: 'private'
  },
  {
    email: 'unverified@example.com',
    verified: false,
    primary: false,
    visibility: null
  }
];

global.mockContextData = {
  contexts: [
    {
      message: 'Owns this repository',
      octicon: 'repo'
    }
  ]
};

global.mockRateLimitData = {
  resources: {
    core: {
      limit: 5000,
      remaining: 4999,
      reset: Math.floor(Date.now() / 1000) + 3600,
      used: 1
    },
    search: {
      limit: 30,
      remaining: 29,
      reset: Math.floor(Date.now() / 1000) + 60,
      used: 1
    }
  },
  rate: {
    limit: 5000,
    remaining: 4999,
    reset: Math.floor(Date.now() / 1000) + 3600,
    used: 1
  }
};

// Helper to create error responses
global.mockErrorResponse = (status, message, errors = []) => ({
  message,
  errors,
  documentation_url: 'https://docs.github.com/rest'
});