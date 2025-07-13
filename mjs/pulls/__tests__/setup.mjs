import { beforeEach, afterEach } from '@jest/globals';

// Make sure we don't make real HTTP requests during tests
beforeEach(() => {
  // Clean up environment variables that might affect tests
  const originalEnv = process.env;
  
  // Reset specific test-related environment variables
  delete process.env.GITHUB_TOKEN;
  delete process.env.GH_TOKEN;
  delete process.env.GITHUB_PAT;
  delete process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
  delete process.env.GITHUB_API_URL;
  delete process.env.GITHUB_OWNER;
  delete process.env.GITHUB_REPO;
  delete process.env.GH_PR_OUTPUT_FORMAT;
  delete process.env.GH_PR_PER_PAGE;
  delete process.env.GH_PR_NO_COLOR;
  delete process.env.GH_PR_INTERACTIVE;
});

afterEach(() => {
  // Clean up after each test - placeholder for future cleanup
});

// Sample test data
global.mockPullRequest = {
  id: 1,
  number: 1,
  title: 'Test PR',
  body: 'Test description',
  state: 'open',
  head: {
    ref: 'feature-branch',
    sha: 'abc123'
  },
  base: {
    ref: 'main',
    sha: 'def456'
  },
  user: {
    login: 'testuser',
    id: 123
  },
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T01:00:00Z',
  html_url: 'https://github.com/owner/repo/pull/1',
  comments: 2,
  review_comments: 1,
  additions: 10,
  deletions: 5,
  labels: [
    {
      name: 'bug',
      color: 'ff0000'
    }
  ]
};

global.mockUser = {
  login: 'testuser',
  id: 123,
  name: 'Test User',
  email: 'test@example.com'
};

global.mockReview = {
  id: 1,
  user: global.mockUser,
  body: 'LGTM',
  state: 'APPROVED',
  submitted_at: '2023-01-01T02:00:00Z'
};

global.mockComment = {
  id: 1,
  user: global.mockUser,
  body: 'Test comment',
  created_at: '2023-01-01T02:00:00Z',
  path: 'test.js',
  line: 10,
  commit_id: 'abc123'
};

global.mockCommit = {
  sha: 'abc123',
  commit: {
    author: {
      name: 'Test User',
      email: 'test@example.com',
      date: '2023-01-01T00:00:00Z'
    },
    message: 'Test commit'
  },
  author: global.mockUser
};

global.mockFile = {
  filename: 'test.js',
  status: 'modified',
  additions: 10,
  deletions: 5,
  changes: 15,
  patch: '@@ -1,3 +1,3 @@\n-old\n+new'
};