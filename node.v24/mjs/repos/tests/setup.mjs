/**
 * @fileoverview Test setup and configuration
 * @module tests/setup
 */

import { jest } from '@jest/globals';
import dotenv from 'dotenv';

// Load environment variables for testing
dotenv.config({ path: '.env.test' });

// Set default test timeout
jest.setTimeout(30000);

// Mock console methods in tests to reduce noise
const originalConsole = { ...console };

beforeEach(() => {
  // Reset console mocks before each test
  console.log = jest.fn();
  console.info = jest.fn();
  console.warn = jest.fn();
  console.error = originalConsole.error; // Keep error logging for debugging
});

afterEach(() => {
  // Restore console after each test
  Object.assign(console, originalConsole);
});

// Global test utilities
global.testUtils = {
  /**
   * Generate random string for testing
   */
  randomString: (length = 8) => {
    return Math.random().toString(36).substring(2, 2 + length);
  },
  
  /**
   * Wait for a specified time
   */
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  /**
   * Create mock repository data
   */
  createMockRepo: (overrides = {}) => ({
    id: Math.floor(Math.random() * 1000000),
    name: `test-repo-${Math.random().toString(36).substring(2, 8)}`,
    full_name: `testuser/test-repo-${Math.random().toString(36).substring(2, 8)}`,
    description: 'Test repository',
    private: false,
    html_url: 'https://github.com/testuser/test-repo',
    clone_url: 'https://github.com/testuser/test-repo.git',
    ssh_url: 'git@github.com:testuser/test-repo.git',
    language: 'JavaScript',
    stargazers_count: 0,
    forks_count: 0,
    open_issues_count: 0,
    default_branch: 'main',
    topics: [],
    has_issues: true,
    has_projects: true,
    has_wiki: true,
    has_discussions: false,
    archived: false,
    disabled: false,
    visibility: 'public',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    pushed_at: '2023-01-01T00:00:00Z',
    owner: {
      login: 'testuser',
      id: 12345,
      type: 'User',
      avatar_url: 'https://github.com/images/error/octocat_happy.gif'
    },
    license: null,
    ...overrides
  }),
  
  /**
   * Create mock user data
   */
  createMockUser: (overrides = {}) => ({
    login: 'testuser',
    id: 12345,
    name: 'Test User',
    email: 'test@example.com',
    avatar_url: 'https://github.com/images/error/octocat_happy.gif',
    type: 'User',
    site_admin: false,
    ...overrides
  }),
  
  /**
   * Create mock branch data
   */
  createMockBranch: (overrides = {}) => ({
    name: 'main',
    protected: false,
    commit: {
      sha: 'abc1234567890',
      commit: {
        message: 'Initial commit'
      }
    },
    ...overrides
  }),
  
  /**
   * Create mock collaborator data
   */
  createMockCollaborator: (overrides = {}) => ({
    login: 'collaborator',
    id: 67890,
    type: 'User',
    permissions: {
      admin: false,
      maintain: false,
      push: true,
      triage: false,
      pull: true
    },
    ...overrides
  })
};

// Environment variable validation for integration tests
if (process.env.NODE_ENV === 'test' && process.env.RUN_INTEGRATION_TESTS === 'true') {
  if (!process.env.GITHUB_TOKEN_TEST) {
    console.warn('Warning: GITHUB_TOKEN_TEST not set, integration tests will be skipped');
  }
}

export default {};