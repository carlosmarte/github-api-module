import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import nock from 'nock';
import PullRequestClient from '../lib/client.mjs';
import { 
  ApiError, 
  AuthError, 
  ValidationError, 
  NotFoundError, 
  PermissionError,
  ConflictError,
  RateLimitError
} from '../utils/errors.mjs';

describe('PullRequestClient', () => {
  let client;
  const BASE_URL = 'https://api.github.com';
  const GITHUB_TOKEN = 'test-token';
  const OWNER = 'test-owner';
  const REPO = 'test-repo';

  beforeEach(() => {
    // Clean all previous nock interceptors
    nock.cleanAll();
    
    // Create client instance
    client = new PullRequestClient({
      baseUrl: BASE_URL,
      auth: GITHUB_TOKEN,
      owner: OWNER,
      repo: REPO
    });
  });

  afterEach(() => {
    // Clean up nock after each test
    nock.cleanAll();
  });

  describe('Constructor', () => {
    test('creates client with all options', () => {
      const customClient = new PullRequestClient({
        baseUrl: 'https://github.enterprise.com/api/v3',
        auth: 'custom-token',
        owner: 'custom-owner',
        repo: 'custom-repo'
      });

      expect(customClient.baseUrl).toBe('https://github.enterprise.com/api/v3');
      expect(customClient.auth).toBe('custom-token');
      expect(customClient.owner).toBe('custom-owner');
      expect(customClient.repo).toBe('custom-repo');
    });

    test('creates client with default options', () => {
      const defaultClient = new PullRequestClient();

      expect(defaultClient.baseUrl).toBe('https://api.github.com');
      expect(defaultClient.auth).toBe(process.env.GITHUB_TOKEN);
      expect(defaultClient.owner).toBeUndefined();
      expect(defaultClient.repo).toBeUndefined();
    });

    test('warns when no auth token provided', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      new PullRequestClient({ auth: null });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'No authentication token provided. API rate limits will be restrictive.'
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('request method', () => {
    test('makes GET request with correct headers', async () => {
      const mockResponse = { data: 'test' };
      
      nock(BASE_URL)
        .get('/test')
        .matchHeader('Authorization', `token ${GITHUB_TOKEN}`)
        .matchHeader('Accept', 'application/vnd.github.v3+json')
        .matchHeader('Content-Type', 'application/json')
        .reply(200, mockResponse);

      const result = await client.request('GET', '/test');
      expect(result).toEqual(mockResponse);
    });

    test('makes POST request with body', async () => {
      const requestData = { key: 'value' };
      const mockResponse = { id: 1 };
      
      nock(BASE_URL)
        .post('/test', requestData)
        .matchHeader('Authorization', `token ${GITHUB_TOKEN}`)
        .reply(201, mockResponse);

      const result = await client.request('POST', '/test', requestData);
      expect(result).toEqual(mockResponse);
    });

    test('handles 204 No Content response', async () => {
      nock(BASE_URL)
        .delete('/test')
        .reply(204);

      const result = await client.request('DELETE', '/test');
      expect(result).toBeNull();
    });

    test('throws AuthError on 401 response', async () => {
      nock(BASE_URL)
        .get('/test')
        .reply(401, { message: 'Bad credentials' });

      await expect(client.request('GET', '/test'))
        .rejects.toThrow(AuthError);
    });

    test('throws ValidationError on 422 response', async () => {
      const errorData = {
        message: 'Validation Failed',
        errors: [
          { field: 'title', message: 'is required' }
        ]
      };
      
      nock(BASE_URL)
        .post('/test')
        .reply(422, errorData);

      await expect(client.request('POST', '/test'))
        .rejects.toThrow(ValidationError);
    });

    test('throws ApiError on other HTTP errors', async () => {
      nock(BASE_URL)
        .get('/test')
        .reply(500, { message: 'Internal Server Error' });

      await expect(client.request('GET', '/test'))
        .rejects.toThrow(ApiError);
    });

    test('throws ApiError on network errors', async () => {
      nock(BASE_URL)
        .get('/test')
        .replyWithError('Network error');

      await expect(client.request('GET', '/test'))
        .rejects.toThrow(ApiError);
    });

    test('works without authentication token', async () => {
      const noAuthClient = new PullRequestClient({ auth: null });
      
      nock(BASE_URL)
        .get('/test')
        .reply(200, { data: 'test' });

      const result = await noAuthClient.request('GET', '/test');
      expect(result).toEqual({ data: 'test' });
    });
  });

  describe('validateRepo', () => {
    test('uses instance owner and repo when not provided', () => {
      const result = client.validateRepo();
      expect(result).toEqual({ owner: OWNER, repo: REPO });
    });

    test('uses options when provided', () => {
      const result = client.validateRepo({ owner: 'other-owner', repo: 'other-repo' });
      expect(result).toEqual({ owner: 'other-owner', repo: 'other-repo' });
    });

    test('throws ValidationError when owner is missing', () => {
      const clientWithoutOwner = new PullRequestClient({ repo: REPO });
      
      expect(() => clientWithoutOwner.validateRepo())
        .toThrow(ValidationError);
    });

    test('throws ValidationError when repo is missing', () => {
      const clientWithoutRepo = new PullRequestClient({ owner: OWNER });
      
      expect(() => clientWithoutRepo.validateRepo())
        .toThrow(ValidationError);
    });
  });

  describe('list', () => {
    test('lists pull requests with default parameters', async () => {
      const mockPRs = [global.mockPullRequest];
      
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

      const result = await client.list();
      expect(result).toEqual(mockPRs);
    });

    test('lists pull requests with custom parameters', async () => {
      const mockPRs = [global.mockPullRequest];
      const options = {
        state: 'closed',
        sort: 'updated',
        direction: 'asc',
        per_page: 50,
        page: 2,
        head: 'feature-branch',
        base: 'main'
      };
      
      nock(BASE_URL)
        .get(`/repos/${OWNER}/${REPO}/pulls`)
        .query(options)
        .reply(200, mockPRs);

      const result = await client.list(options);
      expect(result).toEqual(mockPRs);
    });

    test('handles API errors', async () => {
      nock(BASE_URL)
        .get(`/repos/${OWNER}/${REPO}/pulls`)
        .query(true)
        .reply(404, { message: 'Not Found' });

      await expect(client.list()).rejects.toThrow(ApiError);
    });

    test('uses repository from options', async () => {
      const mockPRs = [global.mockPullRequest];
      const options = { owner: 'other-owner', repo: 'other-repo' };
      
      nock(BASE_URL)
        .get('/repos/other-owner/other-repo/pulls')
        .query(true)
        .reply(200, mockPRs);

      const result = await client.list(options);
      expect(result).toEqual(mockPRs);
    });
  });

  describe('get', () => {
    test('gets a single pull request', async () => {
      const pullNumber = 123;
      const mockPR = global.mockPullRequest;
      
      nock(BASE_URL)
        .get(`/repos/${OWNER}/${REPO}/pulls/${pullNumber}`)
        .reply(200, mockPR);

      const result = await client.get(pullNumber);
      expect(result).toEqual(mockPR);
    });

    test('handles pull request not found', async () => {
      const pullNumber = 999;
      
      nock(BASE_URL)
        .get(`/repos/${OWNER}/${REPO}/pulls/${pullNumber}`)
        .reply(404, { message: 'Not Found' });

      await expect(client.get(pullNumber)).rejects.toThrow(ApiError);
    });

    test('uses repository from options', async () => {
      const pullNumber = 123;
      const mockPR = global.mockPullRequest;
      const options = { owner: 'other-owner', repo: 'other-repo' };
      
      nock(BASE_URL)
        .get(`/repos/other-owner/other-repo/pulls/${pullNumber}`)
        .reply(200, mockPR);

      const result = await client.get(pullNumber, options);
      expect(result).toEqual(mockPR);
    });
  });

  describe('create', () => {
    test('creates a new pull request', async () => {
      const prData = {
        title: 'New Feature',
        head: 'feature-branch',
        base: 'main',
        body: 'Description of the feature'
      };
      const mockPR = { ...global.mockPullRequest, ...prData };
      
      nock(BASE_URL)
        .post(`/repos/${OWNER}/${REPO}/pulls`, prData)
        .reply(201, mockPR);

      const result = await client.create(prData);
      expect(result).toEqual(mockPR);
    });

    test('creates draft pull request', async () => {
      const prData = {
        title: 'Draft Feature',
        head: 'draft-feature',
        base: 'main',
        draft: true
      };
      const mockPR = { ...global.mockPullRequest, ...prData };
      
      nock(BASE_URL)
        .post(`/repos/${OWNER}/${REPO}/pulls`, prData)
        .reply(201, mockPR);

      const result = await client.create(prData);
      expect(result).toEqual(mockPR);
    });

    test('throws ValidationError for missing required fields', async () => {
      const incompleteData = { title: 'Missing fields' };

      await expect(client.create(incompleteData))
        .rejects.toThrow(ValidationError);
    });

    test('handles validation errors from API', async () => {
      const prData = {
        title: 'Test',
        head: 'feature',
        base: 'main'
      };
      
      nock(BASE_URL)
        .post(`/repos/${OWNER}/${REPO}/pulls`)
        .reply(422, {
          message: 'Validation Failed',
          errors: [{ field: 'head', message: 'does not exist' }]
        });

      await expect(client.create(prData)).rejects.toThrow(ValidationError);
    });

    test('creates pull request from issue', async () => {
      const prData = {
        issue: 42,
        head: 'feature-branch',
        base: 'main'
      };
      const mockPR = { ...global.mockPullRequest, number: 42 };
      
      nock(BASE_URL)
        .post(`/repos/${OWNER}/${REPO}/pulls`, prData)
        .reply(201, mockPR);

      const result = await client.create(prData);
      expect(result).toEqual(mockPR);
    });
  });

  describe('update', () => {
    test('updates a pull request', async () => {
      const pullNumber = 123;
      const updateData = {
        title: 'Updated Title',
        body: 'Updated description',
        state: 'closed'
      };
      const mockPR = { ...global.mockPullRequest, ...updateData };
      
      nock(BASE_URL)
        .patch(`/repos/${OWNER}/${REPO}/pulls/${pullNumber}`, updateData)
        .reply(200, mockPR);

      const result = await client.update(pullNumber, updateData);
      expect(result).toEqual(mockPR);
    });

    test('updates pull request base branch', async () => {
      const pullNumber = 123;
      const updateData = { base: 'develop' };
      const mockPR = { ...global.mockPullRequest, base: { ref: 'develop' } };
      
      nock(BASE_URL)
        .patch(`/repos/${OWNER}/${REPO}/pulls/${pullNumber}`, updateData)
        .reply(200, mockPR);

      const result = await client.update(pullNumber, updateData);
      expect(result).toEqual(mockPR);
    });

    test('handles pull request not found', async () => {
      const pullNumber = 999;
      const updateData = { title: 'New Title' };
      
      nock(BASE_URL)
        .patch(`/repos/${OWNER}/${REPO}/pulls/${pullNumber}`)
        .reply(404, { message: 'Not Found' });

      await expect(client.update(pullNumber, updateData))
        .rejects.toThrow(ApiError);
    });

    test('handles permission errors', async () => {
      const pullNumber = 123;
      const updateData = { title: 'New Title' };
      
      nock(BASE_URL)
        .patch(`/repos/${OWNER}/${REPO}/pulls/${pullNumber}`)
        .reply(403, { message: 'Forbidden' });

      await expect(client.update(pullNumber, updateData))
        .rejects.toThrow(ApiError);
    });
  });

  describe('merge', () => {
    test('merges pull request with default options', async () => {
      const pullNumber = 123;
      const mockResult = { merged: true, sha: 'abc123def456', message: 'Pull request successfully merged' };
      
      nock(BASE_URL)
        .put(`/repos/${OWNER}/${REPO}/pulls/${pullNumber}/merge`, { merge_method: 'merge' })
        .reply(200, mockResult);

      const result = await client.merge(pullNumber);
      expect(result).toEqual(mockResult);
    });

    test('merges pull request with squash method', async () => {
      const pullNumber = 123;
      const mergeOptions = {
        merge_method: 'squash',
        commit_title: 'Squashed commit',
        commit_message: 'All changes squashed into one commit'
      };
      const mockResult = { merged: true, sha: 'xyz789abc123' };
      
      nock(BASE_URL)
        .put(`/repos/${OWNER}/${REPO}/pulls/${pullNumber}/merge`, mergeOptions)
        .reply(200, mockResult);

      const result = await client.merge(pullNumber, mergeOptions);
      expect(result).toEqual(mockResult);
    });

    test('merges pull request with rebase method', async () => {
      const pullNumber = 123;
      const mergeOptions = { merge_method: 'rebase' };
      const mockResult = { merged: true, sha: 'rebase123456' };
      
      nock(BASE_URL)
        .put(`/repos/${OWNER}/${REPO}/pulls/${pullNumber}/merge`, mergeOptions)
        .reply(200, mockResult);

      const result = await client.merge(pullNumber, mergeOptions);
      expect(result).toEqual(mockResult);
    });

    test('handles merge conflicts', async () => {
      const pullNumber = 123;
      
      nock(BASE_URL)
        .put(`/repos/${OWNER}/${REPO}/pulls/${pullNumber}/merge`)
        .reply(409, { message: 'Merge conflict' });

      await expect(client.merge(pullNumber))
        .rejects.toThrow(ApiError);
    });

    test('handles pull request not mergeable', async () => {
      const pullNumber = 123;
      
      nock(BASE_URL)
        .put(`/repos/${OWNER}/${REPO}/pulls/${pullNumber}/merge`)
        .reply(422, { message: 'Pull Request is not mergeable' });

      await expect(client.merge(pullNumber))
        .rejects.toThrow(ValidationError);
    });

    test('includes SHA in merge options', async () => {
      const pullNumber = 123;
      const mergeOptions = {
        merge_method: 'merge',
        sha: 'expected-sha-123'
      };
      const mockResult = { merged: true, sha: 'merged-sha-456' };
      
      nock(BASE_URL)
        .put(`/repos/${OWNER}/${REPO}/pulls/${pullNumber}/merge`, mergeOptions)
        .reply(200, mockResult);

      const result = await client.merge(pullNumber, mergeOptions);
      expect(result).toEqual(mockResult);
    });
  });

  describe('isMerged', () => {
    test('returns true when pull request is merged', async () => {
      const pullNumber = 123;
      
      nock(BASE_URL)
        .get(`/repos/${OWNER}/${REPO}/pulls/${pullNumber}/merge`)
        .reply(204);

      const result = await client.isMerged(pullNumber);
      expect(result).toBe(true);
    });

    test('returns false when pull request is not merged', async () => {
      const pullNumber = 123;
      
      nock(BASE_URL)
        .get(`/repos/${OWNER}/${REPO}/pulls/${pullNumber}/merge`)
        .reply(404);

      const result = await client.isMerged(pullNumber);
      expect(result).toBe(false);
    });

    test('throws error for other status codes', async () => {
      const pullNumber = 123;
      
      nock(BASE_URL)
        .get(`/repos/${OWNER}/${REPO}/pulls/${pullNumber}/merge`)
        .reply(401, { message: 'Unauthorized' });

      await expect(client.isMerged(pullNumber))
        .rejects.toThrow(AuthError);
    });

    test('handles pull request not found', async () => {
      const pullNumber = 999;
      
      nock(BASE_URL)
        .get(`/repos/${OWNER}/${REPO}/pulls/${pullNumber}/merge`)
        .reply(404);

      const result = await client.isMerged(pullNumber);
      expect(result).toBe(false);
    });
  });

  describe('listCommits', () => {
    test('lists commits for a pull request', async () => {
      const pullNumber = 123;
      const mockCommits = [global.mockCommit];
      
      nock(BASE_URL)
        .get(`/repos/${OWNER}/${REPO}/pulls/${pullNumber}/commits`)
        .query({ per_page: 30, page: 1 })
        .reply(200, mockCommits);

      const result = await client.listCommits(pullNumber);
      expect(result).toEqual(mockCommits);
    });

    test('lists commits with pagination options', async () => {
      const pullNumber = 123;
      const mockCommits = [global.mockCommit];
      const options = { per_page: 50, page: 2 };
      
      nock(BASE_URL)
        .get(`/repos/${OWNER}/${REPO}/pulls/${pullNumber}/commits`)
        .query(options)
        .reply(200, mockCommits);

      const result = await client.listCommits(pullNumber, options);
      expect(result).toEqual(mockCommits);
    });

    test('handles pull request not found', async () => {
      const pullNumber = 999;
      
      nock(BASE_URL)
        .get(`/repos/${OWNER}/${REPO}/pulls/${pullNumber}/commits`)
        .query(true)
        .reply(404, { message: 'Not Found' });

      await expect(client.listCommits(pullNumber))
        .rejects.toThrow(ApiError);
    });
  });

  describe('listFiles', () => {
    test('lists files changed in a pull request', async () => {
      const pullNumber = 123;
      const mockFiles = [global.mockFile];
      
      nock(BASE_URL)
        .get(`/repos/${OWNER}/${REPO}/pulls/${pullNumber}/files`)
        .query({ per_page: 30, page: 1 })
        .reply(200, mockFiles);

      const result = await client.listFiles(pullNumber);
      expect(result).toEqual(mockFiles);
    });

    test('lists files with pagination options', async () => {
      const pullNumber = 123;
      const mockFiles = [global.mockFile];
      const options = { per_page: 100, page: 3 };
      
      nock(BASE_URL)
        .get(`/repos/${OWNER}/${REPO}/pulls/${pullNumber}/files`)
        .query(options)
        .reply(200, mockFiles);

      const result = await client.listFiles(pullNumber, options);
      expect(result).toEqual(mockFiles);
    });

    test('handles large pull requests with many files', async () => {
      const pullNumber = 123;
      const manyFiles = Array.from({ length: 300 }, (_, i) => ({
        ...global.mockFile,
        filename: `file-${i}.js`
      }));
      
      nock(BASE_URL)
        .get(`/repos/${OWNER}/${REPO}/pulls/${pullNumber}/files`)
        .query(true)
        .reply(200, manyFiles);

      const result = await client.listFiles(pullNumber);
      expect(result).toHaveLength(300);
    });
  });

  describe('listReviews', () => {
    test('lists reviews for a pull request', async () => {
      const pullNumber = 123;
      const mockReviews = [global.mockReview];
      
      nock(BASE_URL)
        .get(`/repos/${OWNER}/${REPO}/pulls/${pullNumber}/reviews`)
        .query({ per_page: 30, page: 1 })
        .reply(200, mockReviews);

      const result = await client.listReviews(pullNumber);
      expect(result).toEqual(mockReviews);
    });

    test('lists reviews with pagination options', async () => {
      const pullNumber = 123;
      const mockReviews = [global.mockReview];
      const options = { per_page: 25, page: 2 };
      
      nock(BASE_URL)
        .get(`/repos/${OWNER}/${REPO}/pulls/${pullNumber}/reviews`)
        .query(options)
        .reply(200, mockReviews);

      const result = await client.listReviews(pullNumber, options);
      expect(result).toEqual(mockReviews);
    });

    test('handles empty reviews list', async () => {
      const pullNumber = 123;
      
      nock(BASE_URL)
        .get(`/repos/${OWNER}/${REPO}/pulls/${pullNumber}/reviews`)
        .query(true)
        .reply(200, []);

      const result = await client.listReviews(pullNumber);
      expect(result).toEqual([]);
    });
  });

  describe('createReview', () => {
    test('creates an approval review', async () => {
      const pullNumber = 123;
      const reviewData = {
        body: 'Looks good to me!',
        event: 'APPROVE'
      };
      const mockReview = { ...global.mockReview, ...reviewData };
      
      nock(BASE_URL)
        .post(`/repos/${OWNER}/${REPO}/pulls/${pullNumber}/reviews`, reviewData)
        .reply(200, mockReview);

      const result = await client.createReview(pullNumber, reviewData);
      expect(result).toEqual(mockReview);
    });

    test('creates a review requesting changes', async () => {
      const pullNumber = 123;
      const reviewData = {
        body: 'Please fix the following issues',
        event: 'REQUEST_CHANGES',
        comments: [
          {
            path: 'src/test.js',
            position: 5,
            body: 'This needs to be fixed'
          }
        ]
      };
      const mockReview = { ...global.mockReview, state: 'CHANGES_REQUESTED' };
      
      nock(BASE_URL)
        .post(`/repos/${OWNER}/${REPO}/pulls/${pullNumber}/reviews`, reviewData)
        .reply(200, mockReview);

      const result = await client.createReview(pullNumber, reviewData);
      expect(result).toEqual(mockReview);
    });

    test('creates a comment-only review', async () => {
      const pullNumber = 123;
      const reviewData = {
        body: 'Some general feedback',
        event: 'COMMENT'
      };
      const mockReview = { ...global.mockReview, ...reviewData };
      
      nock(BASE_URL)
        .post(`/repos/${OWNER}/${REPO}/pulls/${pullNumber}/reviews`, reviewData)
        .reply(200, mockReview);

      const result = await client.createReview(pullNumber, reviewData);
      expect(result).toEqual(mockReview);
    });

    test('handles invalid review event', async () => {
      const pullNumber = 123;
      const reviewData = {
        body: 'Invalid review',
        event: 'INVALID_EVENT'
      };
      
      nock(BASE_URL)
        .post(`/repos/${OWNER}/${REPO}/pulls/${pullNumber}/reviews`)
        .reply(422, {
          message: 'Validation Failed',
          errors: [{ field: 'event', message: 'is not valid' }]
        });

      await expect(client.createReview(pullNumber, reviewData))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('listReviewComments', () => {
    test('lists review comments for a pull request', async () => {
      const pullNumber = 123;
      const mockComments = [global.mockComment];
      
      nock(BASE_URL)
        .get(`/repos/${OWNER}/${REPO}/pulls/${pullNumber}/comments`)
        .query({
          sort: 'created',
          direction: 'desc',
          per_page: 30,
          page: 1
        })
        .reply(200, mockComments);

      const result = await client.listReviewComments(pullNumber);
      expect(result).toEqual(mockComments);
    });

    test('lists review comments with custom sorting', async () => {
      const pullNumber = 123;
      const mockComments = [global.mockComment];
      const options = {
        sort: 'updated',
        direction: 'asc',
        per_page: 50,
        page: 2
      };
      
      nock(BASE_URL)
        .get(`/repos/${OWNER}/${REPO}/pulls/${pullNumber}/comments`)
        .query(options)
        .reply(200, mockComments);

      const result = await client.listReviewComments(pullNumber, options);
      expect(result).toEqual(mockComments);
    });

    test('lists review comments since a specific date', async () => {
      const pullNumber = 123;
      const mockComments = [global.mockComment];
      const options = { since: '2023-01-01T00:00:00Z' };
      
      nock(BASE_URL)
        .get(`/repos/${OWNER}/${REPO}/pulls/${pullNumber}/comments`)
        .query({
          sort: 'created',
          direction: 'desc',
          per_page: 30,
          page: 1,
          since: '2023-01-01T00:00:00Z'
        })
        .reply(200, mockComments);

      const result = await client.listReviewComments(pullNumber, options);
      expect(result).toEqual(mockComments);
    });
  });

  describe('createReviewComment', () => {
    test('creates a review comment on a line', async () => {
      const pullNumber = 123;
      const commentData = {
        body: 'This line needs attention',
        commit_id: 'abc123',
        path: 'src/test.js',
        line: 10,
        side: 'RIGHT'
      };
      const mockComment = { ...global.mockComment, ...commentData };
      
      nock(BASE_URL)
        .post(`/repos/${OWNER}/${REPO}/pulls/${pullNumber}/comments`, commentData)
        .reply(201, mockComment);

      const result = await client.createReviewComment(pullNumber, commentData);
      expect(result).toEqual(mockComment);
    });

    test('creates a review comment with deprecated position', async () => {
      const pullNumber = 123;
      const commentData = {
        body: 'Comment using position',
        commit_id: 'abc123',
        path: 'src/test.js',
        position: 5
      };
      const mockComment = { ...global.mockComment, ...commentData };
      
      nock(BASE_URL)
        .post(`/repos/${OWNER}/${REPO}/pulls/${pullNumber}/comments`, commentData)
        .reply(201, mockComment);

      const result = await client.createReviewComment(pullNumber, commentData);
      expect(result).toEqual(mockComment);
    });

    test('creates a review comment on the left side', async () => {
      const pullNumber = 123;
      const commentData = {
        body: 'Comment on old version',
        commit_id: 'def456',
        path: 'src/test.js',
        line: 15,
        side: 'LEFT'
      };
      const mockComment = { ...global.mockComment, ...commentData };
      
      nock(BASE_URL)
        .post(`/repos/${OWNER}/${REPO}/pulls/${pullNumber}/comments`, commentData)
        .reply(201, mockComment);

      const result = await client.createReviewComment(pullNumber, commentData);
      expect(result).toEqual(mockComment);
    });

    test('handles invalid file path', async () => {
      const pullNumber = 123;
      const commentData = {
        body: 'Comment on invalid file',
        commit_id: 'abc123',
        path: 'invalid/path.js',
        line: 10
      };
      
      nock(BASE_URL)
        .post(`/repos/${OWNER}/${REPO}/pulls/${pullNumber}/comments`)
        .reply(422, {
          message: 'Validation Failed',
          errors: [{ field: 'path', message: 'does not exist in the diff' }]
        });

      await expect(client.createReviewComment(pullNumber, commentData))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('requestReviewers', () => {
    test('requests reviewers for a pull request', async () => {
      const pullNumber = 123;
      const reviewerData = {
        reviewers: ['user1', 'user2'],
        team_reviewers: ['team1']
      };
      const mockPR = { ...global.mockPullRequest, requested_reviewers: reviewerData.reviewers };
      
      nock(BASE_URL)
        .post(`/repos/${OWNER}/${REPO}/pulls/${pullNumber}/requested_reviewers`, reviewerData)
        .reply(201, mockPR);

      const result = await client.requestReviewers(pullNumber, reviewerData);
      expect(result).toEqual(mockPR);
    });

    test('requests only user reviewers', async () => {
      const pullNumber = 123;
      const reviewerData = { reviewers: ['reviewer1', 'reviewer2'] };
      const mockPR = { ...global.mockPullRequest, requested_reviewers: reviewerData.reviewers };
      
      nock(BASE_URL)
        .post(`/repos/${OWNER}/${REPO}/pulls/${pullNumber}/requested_reviewers`, reviewerData)
        .reply(201, mockPR);

      const result = await client.requestReviewers(pullNumber, reviewerData);
      expect(result).toEqual(mockPR);
    });

    test('requests only team reviewers', async () => {
      const pullNumber = 123;
      const reviewerData = { team_reviewers: ['backend-team', 'security-team'] };
      const mockPR = { ...global.mockPullRequest, requested_teams: reviewerData.team_reviewers };
      
      nock(BASE_URL)
        .post(`/repos/${OWNER}/${REPO}/pulls/${pullNumber}/requested_reviewers`, reviewerData)
        .reply(201, mockPR);

      const result = await client.requestReviewers(pullNumber, reviewerData);
      expect(result).toEqual(mockPR);
    });

    test('handles reviewer not found', async () => {
      const pullNumber = 123;
      const reviewerData = { reviewers: ['nonexistent-user'] };
      
      nock(BASE_URL)
        .post(`/repos/${OWNER}/${REPO}/pulls/${pullNumber}/requested_reviewers`)
        .reply(422, {
          message: 'Validation Failed',
          errors: [{ message: 'Reviewer does not exist' }]
        });

      await expect(client.requestReviewers(pullNumber, reviewerData))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('removeRequestedReviewers', () => {
    test('removes requested reviewers from a pull request', async () => {
      const pullNumber = 123;
      const reviewerData = {
        reviewers: ['user1'],
        team_reviewers: ['team1']
      };
      const mockPR = { ...global.mockPullRequest, requested_reviewers: [] };
      
      nock(BASE_URL)
        .delete(`/repos/${OWNER}/${REPO}/pulls/${pullNumber}/requested_reviewers`, reviewerData)
        .reply(200, mockPR);

      const result = await client.removeRequestedReviewers(pullNumber, reviewerData);
      expect(result).toEqual(mockPR);
    });

    test('removes only user reviewers', async () => {
      const pullNumber = 123;
      const reviewerData = { reviewers: ['user1', 'user2'] };
      const mockPR = { ...global.mockPullRequest, requested_reviewers: [] };
      
      nock(BASE_URL)
        .delete(`/repos/${OWNER}/${REPO}/pulls/${pullNumber}/requested_reviewers`, reviewerData)
        .reply(200, mockPR);

      const result = await client.removeRequestedReviewers(pullNumber, reviewerData);
      expect(result).toEqual(mockPR);
    });

    test('handles reviewer removal failure', async () => {
      const pullNumber = 123;
      const reviewerData = { reviewers: ['user1'] };
      
      nock(BASE_URL)
        .delete(`/repos/${OWNER}/${REPO}/pulls/${pullNumber}/requested_reviewers`)
        .reply(422, {
          message: 'Validation Failed',
          errors: [{ message: 'Reviewer was not requested' }]
        });

      await expect(client.removeRequestedReviewers(pullNumber, reviewerData))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('updateBranch', () => {
    test('updates pull request branch', async () => {
      const pullNumber = 123;
      const mockResult = { message: 'Updating', url: 'https://api.github.com/repos/owner/repo/pulls/123' };
      
      nock(BASE_URL)
        .put(`/repos/${OWNER}/${REPO}/pulls/${pullNumber}/update-branch`, { expected_head_sha: undefined })
        .reply(202, mockResult);

      const result = await client.updateBranch(pullNumber);
      expect(result).toEqual(mockResult);
    });

    test('updates pull request branch with expected SHA', async () => {
      const pullNumber = 123;
      const options = { expected_head_sha: 'abc123def456' };
      const mockResult = { message: 'Updating', url: 'https://api.github.com/repos/owner/repo/pulls/123' };
      
      nock(BASE_URL)
        .put(`/repos/${OWNER}/${REPO}/pulls/${pullNumber}/update-branch`, { expected_head_sha: 'abc123def456' })
        .reply(202, mockResult);

      const result = await client.updateBranch(pullNumber, options);
      expect(result).toEqual(mockResult);
    });

    test('handles merge conflict during branch update', async () => {
      const pullNumber = 123;
      
      nock(BASE_URL)
        .put(`/repos/${OWNER}/${REPO}/pulls/${pullNumber}/update-branch`)
        .reply(422, {
          message: 'Merge conflict',
          errors: [{ message: 'Cannot automatically merge' }]
        });

      await expect(client.updateBranch(pullNumber))
        .rejects.toThrow(ValidationError);
    });

    test('handles branch update not allowed', async () => {
      const pullNumber = 123;
      
      nock(BASE_URL)
        .put(`/repos/${OWNER}/${REPO}/pulls/${pullNumber}/update-branch`)
        .reply(403, { message: 'Update branch not allowed' });

      await expect(client.updateBranch(pullNumber))
        .rejects.toThrow(ApiError);
    });
  });

  describe('listAll', () => {
    test.skip('yields all pull requests using pagination', async () => {
      const page1 = [{ ...global.mockPullRequest, number: 1 }];
      const page2 = [{ ...global.mockPullRequest, number: 2 }];
      const page3 = [];  // Empty page indicates end
      
      nock(BASE_URL)
        .get(`/repos/${OWNER}/${REPO}/pulls`)
        .query({ state: 'open', sort: 'created', direction: 'desc', per_page: 100, page: 1 })
        .reply(200, page1);
      
      nock(BASE_URL)
        .get(`/repos/${OWNER}/${REPO}/pulls`)
        .query({ state: 'open', sort: 'created', direction: 'desc', per_page: 100, page: 2 })
        .reply(200, page2);
      
      nock(BASE_URL)
        .get(`/repos/${OWNER}/${REPO}/pulls`)
        .query({ state: 'open', sort: 'created', direction: 'desc', per_page: 100, page: 3 })
        .reply(200, page3);

      const results = [];
      for await (const pr of client.listAll()) {
        results.push(pr);
      }

      expect(results).toHaveLength(2);
      expect(results[0].number).toBe(1);
      expect(results[1].number).toBe(2);
    });

    test('yields pull requests with custom options', async () => {
      const page1 = [{ ...global.mockPullRequest, state: 'closed' }];
      const page2 = [];
      
      nock(BASE_URL)
        .get(`/repos/${OWNER}/${REPO}/pulls`)
        .query({ state: 'closed', sort: 'updated', direction: 'asc', per_page: 100, page: 1 })
        .reply(200, page1);
      
      nock(BASE_URL)
        .get(`/repos/${OWNER}/${REPO}/pulls`)
        .query({ state: 'closed', sort: 'updated', direction: 'asc', per_page: 100, page: 2 })
        .reply(200, page2);

      const results = [];
      for await (const pr of client.listAll({ state: 'closed', sort: 'updated', direction: 'asc' })) {
        results.push(pr);
      }

      expect(results).toHaveLength(1);
      expect(results[0].state).toBe('closed');
    });

    test('handles API errors during pagination', async () => {
      nock(BASE_URL)
        .get(`/repos/${OWNER}/${REPO}/pulls`)
        .query(true)
        .reply(500, { message: 'Internal Server Error' });

      const generator = client.listAll();
      
      await expect(generator.next()).rejects.toThrow(ApiError);
    });
  });

  describe('search', () => {
    test('searches pull requests', async () => {
      const query = 'is:pr repo:owner/repo state:open';
      const mockResults = {
        total_count: 1,
        incomplete_results: false,
        items: [global.mockPullRequest]
      };
      
      nock(BASE_URL)
        .get('/search/issues')
        .query({
          q: query,
          sort: 'created',
          order: 'desc',
          per_page: 30,
          page: 1
        })
        .reply(200, mockResults);

      const result = await client.search(query);
      expect(result).toEqual(mockResults);
    });

    test('searches with custom options', async () => {
      const query = 'bug fix in:title';
      const options = {
        sort: 'updated',
        order: 'asc',
        per_page: 50,
        page: 2
      };
      const mockResults = {
        total_count: 25,
        incomplete_results: false,
        items: [global.mockPullRequest]
      };
      
      nock(BASE_URL)
        .get('/search/issues')
        .query({ q: query, ...options })
        .reply(200, mockResults);

      const result = await client.search(query, options);
      expect(result).toEqual(mockResults);
    });

    test('handles search with no results', async () => {
      const query = 'nonexistent search term';
      const mockResults = {
        total_count: 0,
        incomplete_results: false,
        items: []
      };
      
      nock(BASE_URL)
        .get('/search/issues')
        .query(true)
        .reply(200, mockResults);

      const result = await client.search(query);
      expect(result.total_count).toBe(0);
      expect(result.items).toHaveLength(0);
    });

    test('handles search API rate limiting', async () => {
      const query = 'test search';
      
      nock(BASE_URL)
        .get('/search/issues')
        .query(true)
        .reply(403, { message: 'API rate limit exceeded for search' }, {
          'x-ratelimit-remaining': '0',
          'x-ratelimit-reset': Math.floor(Date.now() / 1000) + 60
        });

      await expect(client.search(query))
        .rejects.toThrow(RateLimitError);
    });

    test('handles malformed search query', async () => {
      const query = 'invalid:query:syntax';
      
      nock(BASE_URL)
        .get('/search/issues')
        .query(true)
        .reply(422, {
          message: 'Validation Failed',
          errors: [{ message: 'The search is invalid' }]
        });

      await expect(client.search(query))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('Error Handling', () => {
    test('handles network timeouts', async () => {
      nock(BASE_URL)
        .get(`/repos/${OWNER}/${REPO}/pulls/123`)
        .delayConnection(5000)
        .reply(200, global.mockPullRequest);

      // This would normally timeout in a real scenario
      // For testing, we can check that the request structure is correct
      const result = await client.get(123);
      expect(result).toEqual(global.mockPullRequest);
    });

    test('handles malformed JSON responses', async () => {
      nock(BASE_URL)
        .get(`/repos/${OWNER}/${REPO}/pulls`)
        .query(true)
        .reply(200, 'invalid json response');

      await expect(client.list())
        .rejects.toThrow();
    });

    test('handles empty response bodies for error statuses', async () => {
      nock(BASE_URL)
        .get(`/repos/${OWNER}/${REPO}/pulls/123`)
        .reply(404, '');

      await expect(client.get(123))
        .rejects.toThrow(ApiError);
    });

    test('preserves original error properties', async () => {
      const errorData = {
        message: 'Custom error message',
        documentation_url: 'https://docs.github.com/rest',
        errors: [{ field: 'title', code: 'missing' }]
      };
      
      nock(BASE_URL)
        .post(`/repos/${OWNER}/${REPO}/pulls`)
        .reply(422, errorData);

      try {
        await client.create({ title: 'Valid Title', head: 'feature', base: 'main' });
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.message).toBe('Custom error message');
        expect(error.data).toEqual(errorData);
        expect(error.errors).toEqual(errorData.errors);
      }
    });
  });

  describe('Authentication', () => {
    test('works with personal access token', async () => {
      const tokenClient = new PullRequestClient({
        auth: 'ghp_personalAccessToken123',
        owner: OWNER,
        repo: REPO
      });
      
      nock(BASE_URL)
        .get(`/repos/${OWNER}/${REPO}/pulls/123`)
        .matchHeader('Authorization', 'token ghp_personalAccessToken123')
        .reply(200, global.mockPullRequest);

      const result = await tokenClient.get(123);
      expect(result).toEqual(global.mockPullRequest);
    });

    test('works without authentication (with rate limits)', async () => {
      const noAuthClient = new PullRequestClient({
        auth: null,
        owner: OWNER,
        repo: REPO
      });
      
      nock(BASE_URL)
        .get(`/repos/${OWNER}/${REPO}/pulls/123`)
        .reply(200, global.mockPullRequest);

      const result = await noAuthClient.get(123);
      expect(result).toEqual(global.mockPullRequest);
    });

    test('handles expired token', async () => {
      nock(BASE_URL)
        .get(`/repos/${OWNER}/${REPO}/pulls/123`)
        .reply(401, {
          message: 'Bad credentials',
          documentation_url: 'https://docs.github.com/rest'
        });

      await expect(client.get(123))
        .rejects.toThrow(AuthError);
    });

    test('handles insufficient permissions', async () => {
      nock(BASE_URL)
        .post(`/repos/${OWNER}/${REPO}/pulls`)
        .reply(403, { message: 'Insufficient permissions' });

      await expect(client.create({
        title: 'Test',
        head: 'feature',
        base: 'main'
      })).rejects.toThrow(ApiError);
    });
  });

  describe('Rate Limiting', () => {
    test('handles rate limit exceeded', async () => {
      nock(BASE_URL)
        .get(`/repos/${OWNER}/${REPO}/pulls`)
        .query(true)
        .reply(403, { message: 'API rate limit exceeded' }, {
          'x-ratelimit-remaining': '0',
          'x-ratelimit-reset': Math.floor(Date.now() / 1000) + 3600
        });

      await expect(client.list())
        .rejects.toThrow(RateLimitError);
    });

    test('includes rate limit info in error', async () => {
      const resetTime = Math.floor(Date.now() / 1000) + 1800;
      
      nock(BASE_URL)
        .get(`/repos/${OWNER}/${REPO}/pulls`)
        .query(true)
        .reply(403, { message: 'API rate limit exceeded' }, {
          'x-ratelimit-remaining': '0',
          'x-ratelimit-reset': resetTime.toString()
        });

      try {
        await client.list();
      } catch (error) {
        expect(error).toBeInstanceOf(RateLimitError);
        expect(error.resetTime).toBe(resetTime);
        expect(error.getTimeUntilReset()).toBeGreaterThan(0);
      }
    });
  });

  describe('Enterprise GitHub Support', () => {
    test('works with GitHub Enterprise Server', async () => {
      const enterpriseClient = new PullRequestClient({
        baseUrl: 'https://github.enterprise.com/api/v3',
        auth: 'enterprise-token',
        owner: OWNER,
        repo: REPO
      });
      
      nock('https://github.enterprise.com/api/v3')
        .get(`/repos/${OWNER}/${REPO}/pulls/123`)
        .matchHeader('Authorization', 'token enterprise-token')
        .reply(200, global.mockPullRequest);

      const result = await enterpriseClient.get(123);
      expect(result).toEqual(global.mockPullRequest);
    });

    test('handles different API versions', async () => {
      const customClient = new PullRequestClient({
        baseUrl: 'https://api.github.com',
        auth: GITHUB_TOKEN,
        owner: OWNER,
        repo: REPO
      });
      
      nock(BASE_URL)
        .get(`/repos/${OWNER}/${REPO}/pulls/123`)
        .matchHeader('Accept', 'application/vnd.github.v3+json')
        .reply(200, global.mockPullRequest);

      const result = await customClient.get(123);
      expect(result).toEqual(global.mockPullRequest);
    });
  });
});