/**
 * Unit tests for ReactionsClient using Jest
 */
import { ReactionsClient } from '../../src/client/ReactionsClient.mjs';

// Mock HTTP service
class MockHttpService {
  constructor() {
    this.reset();
  }

  reset() {
    this.lastRequest = null;
    this.response = {
      data: [],
      status: 200,
      headers: {},
      url: 'https://api.github.com/test'
    };
  }

  async get(url, options) {
    this.lastRequest = { method: 'GET', url, ...options };
    return this.response;
  }

  async post(url, body, options) {
    this.lastRequest = { method: 'POST', url, body, ...options };
    return this.response;
  }

  async delete(url, options) {
    this.lastRequest = { method: 'DELETE', url, ...options };
    return this.response;
  }

  parsePagination(linkHeader) {
    if (!linkHeader) return {};
    return {
      nextUrl: 'https://api.github.com/test?page=2',
      lastUrl: 'https://api.github.com/test?page=5',
      totalPages: 5
    };
  }
}

// Mock logger
const mockLogger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {}
};

describe('ReactionsClient', () => {
  let client;
  let mockHttp;

  beforeEach(() => {
    mockHttp = new MockHttpService();
    client = new ReactionsClient(mockHttp, mockLogger);
  });

  describe('Issue Reactions', () => {
    it('should list reactions for an issue', async () => {
      const mockReactions = [
        { id: 1, content: 'heart', user: { login: 'octocat' }, created_at: '2023-01-01T00:00:00Z' }
      ];
      mockHttp.response.data = mockReactions;

      const result = await client.listForIssue('octocat', 'Hello-World', 1);

      expect(mockHttp.lastRequest.method).toBe('GET');
      expect(mockHttp.lastRequest.url).toBe('/repos/octocat/Hello-World/issues/1/reactions');
      expect(result.data).toEqual(mockReactions);
      expect(result.pagination).toBeTruthy();
    });

    it('should create reaction for an issue', async () => {
      const mockReaction = {
        id: 1,
        content: 'heart',
        user: { login: 'octocat' },
        created_at: '2023-01-01T00:00:00Z'
      };
      mockHttp.response.data = mockReaction;

      const result = await client.createForIssue('octocat', 'Hello-World', 1, { content: 'heart' });

      expect(mockHttp.lastRequest.method).toBe('POST');
      expect(mockHttp.lastRequest.url).toBe('/repos/octocat/Hello-World/issues/1/reactions');
      expect(mockHttp.lastRequest.body).toEqual({ content: 'heart' });
      expect(result).toEqual(mockReaction);
    });

    it('should delete reaction for an issue', async () => {
      await client.deleteForIssue('octocat', 'Hello-World', 1, 123);

      expect(mockHttp.lastRequest.method).toBe('DELETE');
      expect(mockHttp.lastRequest.url).toBe('/repos/octocat/Hello-World/issues/1/reactions/123');
    });
  });

  describe('Validation', () => {
    it('should validate required parameters', async () => {
      await expect(
        client.listForIssue('', 'Hello-World', 1)
      ).rejects.toThrow(/Required parameter missing: owner/);

      await expect(
        client.listForIssue('octocat', '', 1)
      ).rejects.toThrow(/Required parameter missing: repo/);

      await expect(
        client.listForIssue('octocat', 'Hello-World', null)
      ).rejects.toThrow(/Required parameter missing: issueNumber/);
    });

    it('should validate reaction content', async () => {
      await expect(
        client.createForIssue('octocat', 'Hello-World', 1, { content: 'invalid' })
      ).rejects.toThrow(/Invalid reaction content: invalid/);

      await expect(
        client.createForIssue('octocat', 'Hello-World', 1, { content: '' })
      ).rejects.toThrow(/Invalid reaction content/);
    });

    it('should validate release reaction content', async () => {
      await expect(
        client.createForRelease('octocat', 'Hello-World', 1, { content: '-1' })
      ).rejects.toThrow(/Invalid release reaction content: -1/);

      await expect(
        client.createForRelease('octocat', 'Hello-World', 1, { content: 'confused' })
      ).rejects.toThrow(/Invalid release reaction content: confused/);

      // Should work with valid release reaction
      await client.createForRelease('octocat', 'Hello-World', 1, { content: 'heart' });
      expect(mockHttp.lastRequest.body).toEqual({ content: 'heart' });
    });
  });

  describe('Pagination', () => {
    it('should build pagination parameters', async () => {
      await client.listForIssue('octocat', 'Hello-World', 1, {
        content: 'heart',
        perPage: 50,
        page: 2
      });

      expect(mockHttp.lastRequest.url).toContain('content=heart');
      expect(mockHttp.lastRequest.url).toContain('per_page=50');
      expect(mockHttp.lastRequest.url).toContain('page=2');
    });

    it('should not include default pagination parameters', async () => {
      await client.listForIssue('octocat', 'Hello-World', 1, {
        perPage: 30,  // default
        page: 1       // default
      });

      expect(mockHttp.lastRequest.url).not.toContain('per_page=30');
      expect(mockHttp.lastRequest.url).not.toContain('page=1');
    });
  });
});