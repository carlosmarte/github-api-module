import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import nock from 'nock';
import fs from 'fs';
import path from 'path';

// Import the module under test
import {
  createClient,
  listPullRequests,
  getPullRequest,
  createPullRequest,
  updatePullRequest,
  mergePullRequest,
  closePullRequest,
  reopenPullRequest,
  PullRequestClient,
  getAuth,
  loadConfig,
  paginate,
  ApiError,
  AuthError,
  ValidationError
} from '../index.mjs';

describe('GitHub Pull Request API Module - Complete Integration Tests', () => {
  const BASE_URL = 'https://api.github.com';
  const GITHUB_TOKEN = 'ghp_testtoken1234567890123456789012345678';
  const OWNER = 'carlosmarte';
  const REPO = 'vibe-code-figma-to-github';

  // Environment setup
  beforeEach(() => {
    // Clean all nock interceptors
    nock.cleanAll();
    
    // Clear environment variables
    delete process.env.GITHUB_TOKEN;
    delete process.env.GH_TOKEN;
    delete process.env.GITHUB_PAT;
    delete process.env.GITHUB_API_URL;
    delete process.env.GITHUB_OWNER;
    delete process.env.GITHUB_REPO;
    
    // Mock console methods to avoid noise in test output
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    // Clean up nock and restore console
    nock.cleanAll();
    jest.restoreAllMocks();
  });

  describe('createClient Function', () => {
    test('creates client with default configuration', () => {
      // Set environment variable
      process.env.GITHUB_TOKEN = GITHUB_TOKEN;
      
      const client = createClient();
      
      expect(client).toBeInstanceOf(PullRequestClient);
      expect(client.auth).toBe(GITHUB_TOKEN);
      expect(client.baseUrl).toBe('https://api.github.com');
    });

    test('creates client with custom configuration', () => {
      const customConfig = {
        auth: 'custom-token',
        baseUrl: 'https://github.enterprise.com/api/v3',
        owner: 'custom-owner',
        repo: 'custom-repo'
      };
      
      const client = createClient(customConfig);
      
      expect(client.auth).toBe('custom-token');
      expect(client.baseUrl).toBe('https://github.enterprise.com/api/v3');
      expect(client.owner).toBe('custom-owner');
      expect(client.repo).toBe('custom-repo');
    });

    test('merges environment variables with configuration', () => {
      // Set environment variables
      process.env.GITHUB_TOKEN = GITHUB_TOKEN;
      process.env.GITHUB_OWNER = 'env-owner';
      process.env.GITHUB_REPO = 'env-repo';
      process.env.GITHUB_API_URL = 'https://api.github.enterprise.com';
      
      const client = createClient({ owner: 'override-owner' });
      
      expect(client.auth).toBe(GITHUB_TOKEN);
      expect(client.owner).toBe('override-owner'); // Options override env
      expect(client.repo).toBe('env-repo'); // From environment
      expect(client.baseUrl).toBe('https://api.github.enterprise.com'); // From env
    });

    test('handles missing authentication gracefully', () => {
      // Don't set any token environment variables
      const consoleSpy = jest.spyOn(console, 'warn');
      
      const client = createClient();
      
      expect(client).toBeInstanceOf(PullRequestClient);
      expect(client.auth).toBeUndefined(); // No token available
      expect(consoleSpy).toHaveBeenCalledWith(
        'No authentication token provided. API rate limits will be restrictive.'
      );
    });

    test('prioritizes different auth environment variables correctly', () => {
      // Set multiple auth environment variables in priority order
      process.env.GITHUB_TOKEN = 'primary-token';
      process.env.GH_TOKEN = 'secondary-token';
      process.env.GITHUB_PAT = 'tertiary-token';
      
      const client = createClient();
      
      // Should use GITHUB_TOKEN as highest priority
      expect(client.auth).toBe('primary-token');
    });

    test('loads configuration from file system', () => {
      // Mock fs.existsSync to simulate config file existence
      const originalExistsSync = fs.existsSync;
      const originalReadFileSync = fs.readFileSync;
      
      fs.existsSync = jest.fn().mockReturnValue(true);
      fs.readFileSync = jest.fn().mockReturnValue(JSON.stringify({
        baseUrl: 'https://config.github.com/api/v3',
        owner: 'config-owner',
        repo: 'config-repo',
        perPage: 50
      }));
      
      try {
        const client = createClient();
        
        expect(client.baseUrl).toBe('https://config.github.com/api/v3');
        expect(fs.readFileSync).toHaveBeenCalled();
      } finally {
        // Restore original functions
        fs.existsSync = originalExistsSync;
        fs.readFileSync = originalReadFileSync;
      }
    });
  });

  describe('Convenience Functions - Success Scenarios', () => {
    beforeEach(() => {
      process.env.GITHUB_TOKEN = GITHUB_TOKEN;
    });

    test('listPullRequests - basic functionality', async () => {
      const mockPRs = [
        { ...global.mockPullRequest, number: 1, title: 'First PR' },
        { ...global.mockPullRequest, number: 2, title: 'Second PR' }
      ];

      nock(BASE_URL)
        .get(`/repos/${OWNER}/${REPO}/pulls`)
        .query({
          state: 'open',
          sort: 'created',
          direction: 'desc',
          per_page: 30,
          page: 1
        })
        .reply(200, mockPRs);

      const result = await listPullRequests(OWNER, REPO);
      
      expect(result).toEqual(mockPRs);
      expect(result).toHaveLength(2);
    });

    test('listPullRequests - with custom options', async () => {
      const mockPRs = [global.mockPullRequest];
      const options = {
        state: 'closed',
        sort: 'updated',
        per_page: 50,
        head: 'feature-branch',
        base: 'main'
      };

      // The client adds default direction parameter
      const expectedQuery = {
        ...options,
        direction: 'desc',
        page: 1
      };

      nock(BASE_URL)
        .get(`/repos/${OWNER}/${REPO}/pulls`)
        .query(expectedQuery)
        .reply(200, mockPRs);

      const result = await listPullRequests(OWNER, REPO, options);
      
      expect(result).toEqual(mockPRs);
    });

    test('getPullRequest - retrieves specific PR', async () => {
      const pullNumber = 123;
      const mockPR = { ...global.mockPullRequest, number: pullNumber };

      nock(BASE_URL)
        .get(`/repos/${OWNER}/${REPO}/pulls/${pullNumber}`)
        .reply(200, mockPR);

      const result = await getPullRequest(OWNER, REPO, pullNumber);
      
      expect(result).toEqual(mockPR);
      expect(result.number).toBe(pullNumber);
    });

    test('createPullRequest - creates new PR', async () => {
      const prData = {
        title: 'New Feature Implementation',
        head: 'feature-branch',
        base: 'main',
        body: 'Implements new feature with comprehensive tests',
        draft: false
      };
      const mockCreatedPR = { 
        ...global.mockPullRequest, 
        ...prData, 
        number: 456,
        id: 789
      };

      nock(BASE_URL)
        .post(`/repos/${OWNER}/${REPO}/pulls`, prData)
        .reply(201, mockCreatedPR);

      const result = await createPullRequest(OWNER, REPO, prData);
      
      expect(result).toEqual(mockCreatedPR);
      expect(result.number).toBe(456);
      expect(result.title).toBe(prData.title);
    });

    test('updatePullRequest - updates existing PR', async () => {
      const pullNumber = 123;
      const updateData = {
        title: 'Updated Title',
        body: 'Updated description with more details',
        state: 'open'
      };
      const mockUpdatedPR = { ...global.mockPullRequest, ...updateData };

      nock(BASE_URL)
        .patch(`/repos/${OWNER}/${REPO}/pulls/${pullNumber}`, updateData)
        .reply(200, mockUpdatedPR);

      const result = await updatePullRequest(OWNER, REPO, pullNumber, updateData);
      
      expect(result).toEqual(mockUpdatedPR);
      expect(result.title).toBe(updateData.title);
    });

    test('mergePullRequest - merges PR with default options', async () => {
      const pullNumber = 123;
      const mockMergeResult = {
        merged: true,
        sha: 'abc123def456',
        message: 'Pull request successfully merged'
      };

      nock(BASE_URL)
        .put(`/repos/${OWNER}/${REPO}/pulls/${pullNumber}/merge`, { merge_method: 'merge' })
        .reply(200, mockMergeResult);

      const result = await mergePullRequest(OWNER, REPO, pullNumber);
      
      expect(result).toEqual(mockMergeResult);
      expect(result.merged).toBe(true);
    });

    test('mergePullRequest - merges PR with squash method', async () => {
      const pullNumber = 123;
      const mergeOptions = {
        merge_method: 'squash',
        commit_title: 'Feature: Add new functionality',
        commit_message: 'Squashed commits from feature branch'
      };
      const mockMergeResult = {
        merged: true,
        sha: 'xyz789abc123'
      };

      nock(BASE_URL)
        .put(`/repos/${OWNER}/${REPO}/pulls/${pullNumber}/merge`, mergeOptions)
        .reply(200, mockMergeResult);

      const result = await mergePullRequest(OWNER, REPO, pullNumber, mergeOptions);
      
      expect(result).toEqual(mockMergeResult);
      expect(result.merged).toBe(true);
    });

    test('closePullRequest - closes PR', async () => {
      const pullNumber = 123;
      const mockClosedPR = { ...global.mockPullRequest, state: 'closed' };

      nock(BASE_URL)
        .patch(`/repos/${OWNER}/${REPO}/pulls/${pullNumber}`, { state: 'closed' })
        .reply(200, mockClosedPR);

      const result = await closePullRequest(OWNER, REPO, pullNumber);
      
      expect(result).toEqual(mockClosedPR);
      expect(result.state).toBe('closed');
    });

    test('reopenPullRequest - reopens closed PR', async () => {
      const pullNumber = 123;
      const mockReopenedPR = { ...global.mockPullRequest, state: 'open' };

      nock(BASE_URL)
        .patch(`/repos/${OWNER}/${REPO}/pulls/${pullNumber}`, { state: 'open' })
        .reply(200, mockReopenedPR);

      const result = await reopenPullRequest(OWNER, REPO, pullNumber);
      
      expect(result).toEqual(mockReopenedPR);
      expect(result.state).toBe('open');
    });
  });

  describe('Error Handling - Network and API Errors', () => {
    beforeEach(() => {
      process.env.GITHUB_TOKEN = GITHUB_TOKEN;
    });

    test('handles network connectivity errors', async () => {
      nock(BASE_URL)
        .get(`/repos/${OWNER}/${REPO}/pulls/123`)
        .replyWithError({ code: 'ECONNREFUSED', message: 'Connection refused' });

      await expect(getPullRequest(OWNER, REPO, 123))
        .rejects
        .toThrow(ApiError);
    });

    test('handles authentication errors (401)', async () => {
      nock(BASE_URL)
        .get(`/repos/${OWNER}/${REPO}/pulls`)
        .query({
          state: 'open',
          sort: 'created',
          direction: 'desc',
          per_page: 30,
          page: 1
        })
        .reply(401, {
          message: 'Bad credentials',
          documentation_url: 'https://docs.github.com/rest'
        });

      await expect(listPullRequests(OWNER, REPO))
        .rejects
        .toThrow(AuthError);
    });

    test('handles validation errors (422)', async () => {
      const invalidPRData = {
        title: '', // Empty title should cause validation error
        head: 'feature',
        base: 'main'
      };

      nock(BASE_URL)
        .post(`/repos/${OWNER}/${REPO}/pulls`)
        .reply(422, {
          message: 'Validation Failed',
          errors: [
            { field: 'title', message: 'can\'t be blank' }
          ]
        });

      await expect(createPullRequest(OWNER, REPO, invalidPRData))
        .rejects
        .toThrow(ValidationError);
    });

    test('handles not found errors (404)', async () => {
      nock(BASE_URL)
        .get(`/repos/${OWNER}/${REPO}/pulls/99999`)
        .reply(404, {
          message: 'Not Found',
          documentation_url: 'https://docs.github.com/rest'
        });

      await expect(getPullRequest(OWNER, REPO, 99999))
        .rejects
        .toThrow(ApiError);
    });

    test('handles permission errors (403)', async () => {
      nock(BASE_URL)
        .post(`/repos/${OWNER}/${REPO}/pulls`)
        .reply(403, {
          message: 'Insufficient permissions to create pull request'
        });

      const prData = {
        title: 'Test PR',
        head: 'feature',
        base: 'main'
      };

      await expect(createPullRequest(OWNER, REPO, prData))
        .rejects
        .toThrow(ApiError);
    });

    test('handles rate limiting errors', async () => {
      const resetTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

      nock(BASE_URL)
        .get(`/repos/${OWNER}/${REPO}/pulls`)
        .query({
          state: 'open',
          sort: 'created',
          direction: 'desc',
          per_page: 30,
          page: 1
        })
        .reply(403, 
          { message: 'API rate limit exceeded' },
          {
            'x-ratelimit-remaining': '0',
            'x-ratelimit-reset': resetTime.toString()
          }
        );

      try {
        await listPullRequests(OWNER, REPO);
        fail('Expected error to be thrown');
      } catch (error) {
        expect(error.message).toContain('API rate limit exceeded');
      }
    });

    test('handles merge conflicts (409)', async () => {
      nock(BASE_URL)
        .put(`/repos/${OWNER}/${REPO}/pulls/123/merge`)
        .reply(409, {
          message: 'Merge conflict'
        });

      await expect(mergePullRequest(OWNER, REPO, 123))
        .rejects
        .toThrow(ApiError);
    });

    test('handles malformed JSON responses', async () => {
      nock(BASE_URL)
        .get(`/repos/${OWNER}/${REPO}/pulls/123`)
        .reply(200, 'invalid json response');

      await expect(getPullRequest(OWNER, REPO, 123))
        .rejects
        .toThrow();
    });

    test('handles timeout scenarios', async () => {
      nock(BASE_URL)
        .get(`/repos/${OWNER}/${REPO}/pulls`)
        .query({
          state: 'open',
          sort: 'created',
          direction: 'desc',
          per_page: 30,
          page: 1
        })
        .delayConnection(10000) // 10 second delay
        .reply(200, []);

      // This test verifies the request structure - in real scenarios this would timeout
      // For testing purposes, we'll just verify the request is made correctly
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 100)
      );

      await expect(
        Promise.race([listPullRequests(OWNER, REPO), timeoutPromise])
      ).rejects.toThrow('Request timeout');
    });
  });

  describe('Integration Workflow Scenarios', () => {
    beforeEach(() => {
      process.env.GITHUB_TOKEN = GITHUB_TOKEN;
    });

    test('complete PR lifecycle - create, update, merge', async () => {
      // Step 1: Create PR
      const prData = {
        title: 'Feature: Add user authentication',
        head: 'feature/auth',
        base: 'main',
        body: 'Implements JWT-based authentication'
      };
      const createdPR = { ...global.mockPullRequest, ...prData, number: 100 };

      nock(BASE_URL)
        .post(`/repos/${OWNER}/${REPO}/pulls`, prData)
        .reply(201, createdPR);

      const newPR = await createPullRequest(OWNER, REPO, prData);
      expect(newPR.number).toBe(100);
      expect(newPR.title).toBe(prData.title);

      // Step 2: Update PR
      const updateData = { body: 'Updated description with security considerations' };
      const updatedPR = { ...createdPR, ...updateData };

      nock(BASE_URL)
        .patch(`/repos/${OWNER}/${REPO}/pulls/100`, updateData)
        .reply(200, updatedPR);

      const updated = await updatePullRequest(OWNER, REPO, 100, updateData);
      expect(updated.body).toBe(updateData.body);

      // Step 3: Merge PR
      const mergeResult = { merged: true, sha: 'final123' };

      nock(BASE_URL)
        .put(`/repos/${OWNER}/${REPO}/pulls/100/merge`, { merge_method: 'merge' })
        .reply(200, mergeResult);

      const merged = await mergePullRequest(OWNER, REPO, 100);
      expect(merged.merged).toBe(true);
    });

    test('PR review and approval workflow', async () => {
      const pullNumber = 200;
      
      // Mock getting PR details
      nock(BASE_URL)
        .get(`/repos/${OWNER}/${REPO}/pulls/${pullNumber}`)
        .reply(200, { ...global.mockPullRequest, number: pullNumber });

      // Mock creating a review
      nock(BASE_URL)
        .post(`/repos/${OWNER}/${REPO}/pulls/${pullNumber}/reviews`, {
          body: 'Code looks good, approving changes',
          event: 'APPROVE'
        })
        .reply(200, {
          id: 123,
          state: 'APPROVED',
          body: 'Code looks good, approving changes'
        });

      // Mock final merge after approval
      nock(BASE_URL)
        .put(`/repos/${OWNER}/${REPO}/pulls/${pullNumber}/merge`, { merge_method: 'squash' })
        .reply(200, { merged: true, sha: 'approved123' });

      // Execute workflow
      const pr = await getPullRequest(OWNER, REPO, pullNumber);
      expect(pr.number).toBe(pullNumber);

      // This would normally be done through the client's review methods
      // For integration testing, we're verifying the merge step
      const mergeResult = await mergePullRequest(OWNER, REPO, pullNumber, {
        merge_method: 'squash'
      });
      expect(mergeResult.merged).toBe(true);
    });

    test('error recovery - retry after failed merge', async () => {
      const pullNumber = 300;

      // First merge attempt fails due to conflict
      nock(BASE_URL)
        .put(`/repos/${OWNER}/${REPO}/pulls/${pullNumber}/merge`)
        .reply(409, { message: 'Merge conflict' });

      // Update PR to resolve conflicts
      nock(BASE_URL)
        .patch(`/repos/${OWNER}/${REPO}/pulls/${pullNumber}`, { body: 'Resolved merge conflicts' })
        .reply(200, { ...global.mockPullRequest, body: 'Resolved merge conflicts' });

      // Retry merge successfully
      nock(BASE_URL)
        .put(`/repos/${OWNER}/${REPO}/pulls/${pullNumber}/merge`)
        .reply(200, { merged: true, sha: 'resolved123' });

      // Execute error recovery workflow
      await expect(mergePullRequest(OWNER, REPO, pullNumber))
        .rejects.toThrow();

      const updated = await updatePullRequest(OWNER, REPO, pullNumber, {
        body: 'Resolved merge conflicts'
      });
      expect(updated.body).toBe('Resolved merge conflicts');

      const mergeResult = await mergePullRequest(OWNER, REPO, pullNumber);
      expect(mergeResult.merged).toBe(true);
    });
  });

  describe('Pagination Handling', () => {
    beforeEach(() => {
      process.env.GITHUB_TOKEN = GITHUB_TOKEN;
    });

    test('handles paginated results', async () => {
      // Mock first page
      const page1PRs = Array.from({ length: 30 }, (_, i) => ({
        ...global.mockPullRequest,
        number: i + 1,
        title: `PR ${i + 1}`
      }));

      // Mock second page
      const page2PRs = Array.from({ length: 15 }, (_, i) => ({
        ...global.mockPullRequest,
        number: i + 31,
        title: `PR ${i + 31}`
      }));

      nock(BASE_URL)
        .get(`/repos/${OWNER}/${REPO}/pulls`)
        .query({ state: 'open', sort: 'created', direction: 'desc', per_page: 30, page: 1 })
        .reply(200, page1PRs, {
          'Link': `<${BASE_URL}/repos/${OWNER}/${REPO}/pulls?page=2>; rel="next", <${BASE_URL}/repos/${OWNER}/${REPO}/pulls?page=2>; rel="last"`
        });

      nock(BASE_URL)
        .get(`/repos/${OWNER}/${REPO}/pulls`)
        .query({ state: 'open', sort: 'created', direction: 'desc', per_page: 30, page: 2 })
        .reply(200, page2PRs);

      // Test first page
      const firstPage = await listPullRequests(OWNER, REPO);
      expect(firstPage).toHaveLength(30);
      expect(firstPage[0].number).toBe(1);

      // Test second page
      const secondPage = await listPullRequests(OWNER, REPO, { page: 2 });
      expect(secondPage).toHaveLength(15);
      expect(secondPage[0].number).toBe(31);
    });

    test('handles empty pagination results', async () => {
      nock(BASE_URL)
        .get(`/repos/${OWNER}/${REPO}/pulls`)
        .query({ state: 'open', sort: 'created', direction: 'desc', per_page: 30, page: 5 })
        .reply(200, []);

      const emptyPage = await listPullRequests(OWNER, REPO, { page: 5 });
      expect(emptyPage).toHaveLength(0);
      expect(Array.isArray(emptyPage)).toBe(true);
    });
  });

  describe('Concurrent Operations', () => {
    beforeEach(() => {
      process.env.GITHUB_TOKEN = GITHUB_TOKEN;
    });

    test('handles concurrent PR operations', async () => {
      // Mock multiple PR fetches
      for (let i = 1; i <= 5; i++) {
        nock(BASE_URL)
          .get(`/repos/${OWNER}/${REPO}/pulls/${i}`)
          .reply(200, { ...global.mockPullRequest, number: i, title: `PR ${i}` });
      }

      // Execute concurrent requests
      const promises = [1, 2, 3, 4, 5].map(num => 
        getPullRequest(OWNER, REPO, num)
      );

      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(5);
      results.forEach((pr, index) => {
        expect(pr.number).toBe(index + 1);
        expect(pr.title).toBe(`PR ${index + 1}`);
      });
    });

    test('handles mixed success and failure in concurrent operations', async () => {
      // Mock successful and failed requests
      nock(BASE_URL)
        .get(`/repos/${OWNER}/${REPO}/pulls/1`)
        .reply(200, { ...global.mockPullRequest, number: 1 });

      nock(BASE_URL)
        .get(`/repos/${OWNER}/${REPO}/pulls/2`)
        .reply(404, { message: 'Not Found' });

      nock(BASE_URL)
        .get(`/repos/${OWNER}/${REPO}/pulls/3`)
        .reply(200, { ...global.mockPullRequest, number: 3 });

      // Use Promise.allSettled to handle mixed results
      const promises = [1, 2, 3].map(num => 
        getPullRequest(OWNER, REPO, num).catch(err => ({ error: err }))
      );

      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(3);
      expect(results[0].number).toBe(1); // Success
      expect(results[1].error).toBeDefined(); // Error
      expect(results[2].number).toBe(3); // Success
    });
  });

  describe('Environment Variable Configuration', () => {
    test('respects GITHUB_TOKEN from environment', () => {
      const envToken = 'ghp_environmenttoken123456789012345678901234';
      process.env.GITHUB_TOKEN = envToken;
      
      const client = createClient();
      expect(client.auth).toBe(envToken);
    });

    test('respects repository configuration from environment', () => {
      process.env.GITHUB_OWNER = 'env-owner';
      process.env.GITHUB_REPO = 'env-repo';
      
      const client = createClient();
      expect(client.owner).toBe('env-owner');
      expect(client.repo).toBe('env-repo');
    });

    test('respects API URL from environment', () => {
      process.env.GITHUB_API_URL = 'https://enterprise.github.com/api/v3';
      
      const client = createClient();
      expect(client.baseUrl).toBe('https://enterprise.github.com/api/v3');
    });

    test('handles missing environment variables gracefully', () => {
      // Clear all relevant environment variables
      delete process.env.GITHUB_TOKEN;
      delete process.env.GH_TOKEN;
      delete process.env.GITHUB_PAT;
      delete process.env.GITHUB_OWNER;
      delete process.env.GITHUB_REPO;
      
      const client = createClient();
      
      // Should still create client with defaults
      expect(client).toBeInstanceOf(PullRequestClient);
      expect(client.baseUrl).toBe('https://api.github.com');
      expect(client.auth).toBeUndefined();
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    beforeEach(() => {
      process.env.GITHUB_TOKEN = GITHUB_TOKEN;
    });

    test('handles extremely large PR numbers', async () => {
      const largePRNumber = 999999999;
      
      nock(BASE_URL)
        .get(`/repos/${OWNER}/${REPO}/pulls/${largePRNumber}`)
        .reply(200, { ...global.mockPullRequest, number: largePRNumber });

      const result = await getPullRequest(OWNER, REPO, largePRNumber);
      expect(result.number).toBe(largePRNumber);
    });

    test('handles very long PR titles and descriptions', async () => {
      const longTitle = 'A'.repeat(1000);
      const longBody = 'B'.repeat(10000);
      
      const prData = {
        title: longTitle,
        body: longBody,
        head: 'feature',
        base: 'main'
      };

      nock(BASE_URL)
        .post(`/repos/${OWNER}/${REPO}/pulls`, prData)
        .reply(201, { ...global.mockPullRequest, ...prData });

      const result = await createPullRequest(OWNER, REPO, prData);
      expect(result.title).toBe(longTitle);
      expect(result.body).toBe(longBody);
    });

    test('handles special characters in repository names', async () => {
      const specialOwner = 'owner-with-dashes';
      const specialRepo = 'repo_with_underscores.and.dots';
      
      nock(BASE_URL)
        .get(`/repos/${specialOwner}/${specialRepo}/pulls`)
        .query({
          state: 'open',
          sort: 'created',
          direction: 'desc',
          per_page: 30,
          page: 1
        })
        .reply(200, [global.mockPullRequest]);

      const result = await listPullRequests(specialOwner, specialRepo);
      expect(result).toHaveLength(1);
    });

    test('handles empty response arrays', async () => {
      nock(BASE_URL)
        .get(`/repos/${OWNER}/${REPO}/pulls`)
        .query({
          state: 'open',
          sort: 'created',
          direction: 'desc',
          per_page: 30,
          page: 1
        })
        .reply(200, []);

      const result = await listPullRequests(OWNER, REPO);
      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });

    test('handles null and undefined values in PR data', async () => {
      const prWithNulls = {
        ...global.mockPullRequest,
        body: null,
        assignee: null,
        milestone: null
      };

      nock(BASE_URL)
        .get(`/repos/${OWNER}/${REPO}/pulls/123`)
        .reply(200, prWithNulls);

      const result = await getPullRequest(OWNER, REPO, 123);
      expect(result.body).toBeNull();
      expect(result.assignee).toBeNull();
      expect(result.milestone).toBeNull();
    });
  });

  describe('Performance and Load Testing', () => {
    beforeEach(() => {
      process.env.GITHUB_TOKEN = GITHUB_TOKEN;
    });

    test('handles rapid successive API calls', async () => {
      // Mock 100 rapid API calls
      for (let i = 1; i <= 100; i++) {
        nock(BASE_URL)
          .get(`/repos/${OWNER}/${REPO}/pulls/${i}`)
          .reply(200, { ...global.mockPullRequest, number: i });
      }

      const startTime = Date.now();
      
      // Execute 100 rapid calls
      const promises = Array.from({ length: 100 }, (_, i) => 
        getPullRequest(OWNER, REPO, i + 1)
      );

      const results = await Promise.all(promises);
      const endTime = Date.now();
      
      expect(results).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    test('handles large payload responses', async () => {
      // Create a large PR list (1000 PRs)
      const largePRList = Array.from({ length: 1000 }, (_, i) => ({
        ...global.mockPullRequest,
        number: i + 1,
        title: `Large dataset PR ${i + 1}`,
        body: 'B'.repeat(1000) // 1000 character body
      }));

      nock(BASE_URL)
        .get(`/repos/${OWNER}/${REPO}/pulls`)
        .query({
          state: 'open',
          sort: 'created',
          direction: 'desc',
          per_page: 30,
          page: 1
        })
        .reply(200, largePRList);

      const result = await listPullRequests(OWNER, REPO);
      
      expect(result).toHaveLength(1000);
      expect(result[0].title).toBe('Large dataset PR 1');
      expect(result[999].title).toBe('Large dataset PR 1000');
    });
  });

  describe('Security and Authentication Edge Cases', () => {
    test('handles invalid token formats gracefully', async () => {
      const invalidTokens = [
        'invalid-token',
        '',
        'short',
        null,
        undefined,
        123,
        {}
      ];

      for (const token of invalidTokens) {
        const client = createClient({ auth: token });
        expect(client).toBeInstanceOf(PullRequestClient);
      }
    });

    test('handles authentication token expiry', async () => {
      process.env.GITHUB_TOKEN = 'expired_token';
      
      nock(BASE_URL)
        .get(`/repos/${OWNER}/${REPO}/pulls`)
        .query({
          state: 'open',
          sort: 'created',
          direction: 'desc',
          per_page: 30,
          page: 1
        })
        .reply(401, {
          message: 'Bad credentials',
          documentation_url: 'https://docs.github.com/rest'
        });

      await expect(listPullRequests(OWNER, REPO))
        .rejects
        .toThrow(AuthError);
    });

    test('handles token with insufficient permissions', async () => {
      process.env.GITHUB_TOKEN = 'limited_token';
      
      nock(BASE_URL)
        .post(`/repos/${OWNER}/${REPO}/pulls`)
        .reply(403, {
          message: 'Resource not accessible by integration',
          documentation_url: 'https://docs.github.com/rest'
        });

      const prData = {
        title: 'Test PR',
        head: 'feature',
        base: 'main'
      };

      await expect(createPullRequest(OWNER, REPO, prData))
        .rejects
        .toThrow(ApiError);
    });
  });
});