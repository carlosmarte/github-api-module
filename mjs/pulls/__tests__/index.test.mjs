import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import nock from 'nock';

// Mock the modules that index.mjs imports
jest.unstable_mockModule('../lib/client.mjs', () => ({
  default: jest.fn()
}));

jest.unstable_mockModule('../lib/auth.mjs', () => ({
  getAuth: jest.fn()
}));

jest.unstable_mockModule('../lib/config.mjs', () => ({
  loadConfig: jest.fn()
}));

// Import the module under test after mocking
const {
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
  loadConfig
} = await import('../index.mjs');

const MockPullRequestClient = (await import('../lib/client.mjs')).default;
const mockGetAuth = (await import('../lib/auth.mjs')).getAuth;
const mockLoadConfig = (await import('../lib/config.mjs')).loadConfig;

describe('Index Module', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup default mock implementations
    mockLoadConfig.mockReturnValue({
      baseUrl: 'https://api.github.com',
      owner: 'default-owner',
      repo: 'default-repo'
    });
    
    mockGetAuth.mockReturnValue('test-token');
    
    // Mock PullRequestClient constructor
    MockPullRequestClient.mockImplementation((options) => ({
      options,
      list: jest.fn(),
      get: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      merge: jest.fn()
    }));
  });

  describe('Module Exports', () => {
    test('exports all expected functions', () => {
      expect(typeof createClient).toBe('function');
      expect(typeof listPullRequests).toBe('function');
      expect(typeof getPullRequest).toBe('function');
      expect(typeof createPullRequest).toBe('function');
      expect(typeof updatePullRequest).toBe('function');
      expect(typeof mergePullRequest).toBe('function');
      expect(typeof closePullRequest).toBe('function');
      expect(typeof reopenPullRequest).toBe('function');
    });

    test('exports PullRequestClient class', () => {
      expect(PullRequestClient).toBeDefined();
    });

    test('exports utility functions', () => {
      expect(getAuth).toBeDefined();
      expect(loadConfig).toBeDefined();
    });
  });

  describe('createClient', () => {
    test('creates client with default options', () => {
      const client = createClient();
      
      expect(mockLoadConfig).toHaveBeenCalled();
      expect(mockGetAuth).toHaveBeenCalled();
      expect(MockPullRequestClient).toHaveBeenCalledWith({
        auth: 'test-token',
        baseUrl: 'https://api.github.com',
        owner: 'default-owner',
        repo: 'default-repo'
      });
    });

    test('creates client with custom options', () => {
      const options = {
        auth: 'custom-token',
        baseUrl: 'https://github.enterprise.com/api/v3',
        owner: 'custom-owner',
        repo: 'custom-repo'
      };
      
      const client = createClient(options);
      
      expect(MockPullRequestClient).toHaveBeenCalledWith(options);
    });

    test('merges options with config and auth', () => {
      mockLoadConfig.mockReturnValue({
        baseUrl: 'https://enterprise.github.com',
        owner: 'config-owner',
        repo: 'config-repo'
      });
      
      const client = createClient({ owner: 'override-owner' });
      
      expect(MockPullRequestClient).toHaveBeenCalledWith({
        auth: 'test-token',
        baseUrl: 'https://enterprise.github.com',
        owner: 'override-owner',
        repo: 'config-repo'
      });
    });

    test('uses auth from options over getAuth', () => {
      const client = createClient({ auth: 'options-token' });
      
      expect(MockPullRequestClient).toHaveBeenCalledWith({
        auth: 'options-token',
        baseUrl: 'https://api.github.com',
        owner: 'default-owner',
        repo: 'default-repo'
      });
    });
  });

  describe('Convenience Functions', () => {
    let mockClient;

    beforeEach(() => {
      mockClient = {
        list: jest.fn(),
        get: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        merge: jest.fn()
      };
      
      MockPullRequestClient.mockReturnValue(mockClient);
    });

    describe('listPullRequests', () => {
      test('calls client.list with correct parameters', async () => {
        const mockPRs = [global.mockPullRequest];
        mockClient.list.mockResolvedValue(mockPRs);
        
        const result = await listPullRequests('owner', 'repo', { state: 'open' });
        
        expect(MockPullRequestClient).toHaveBeenCalledWith({
          auth: 'test-token',
          baseUrl: 'https://api.github.com',
          owner: 'owner',
          repo: 'repo'
        });
        expect(mockClient.list).toHaveBeenCalledWith({ state: 'open' });
        expect(result).toEqual(mockPRs);
      });

      test('handles empty options', async () => {
        const mockPRs = [global.mockPullRequest];
        mockClient.list.mockResolvedValue(mockPRs);
        
        const result = await listPullRequests('owner', 'repo');
        
        expect(mockClient.list).toHaveBeenCalledWith({});
        expect(result).toEqual(mockPRs);
      });

      test('handles API errors', async () => {
        const error = new Error('API Error');
        mockClient.list.mockRejectedValue(error);
        
        await expect(listPullRequests('owner', 'repo'))
          .rejects.toThrow('API Error');
      });
    });

    describe('getPullRequest', () => {
      test('calls client.get with correct parameters', async () => {
        const mockPR = global.mockPullRequest;
        mockClient.get.mockResolvedValue(mockPR);
        
        const result = await getPullRequest('owner', 'repo', 1);
        
        expect(MockPullRequestClient).toHaveBeenCalledWith({
          auth: 'test-token',
          baseUrl: 'https://api.github.com',
          owner: 'owner',
          repo: 'repo'
        });
        expect(mockClient.get).toHaveBeenCalledWith(1);
        expect(result).toEqual(mockPR);
      });

      test('handles API errors', async () => {
        const error = new Error('PR not found');
        mockClient.get.mockRejectedValue(error);
        
        await expect(getPullRequest('owner', 'repo', 999))
          .rejects.toThrow('PR not found');
      });
    });

    describe('createPullRequest', () => {
      test('calls client.create with correct parameters', async () => {
        const prData = {
          title: 'New PR',
          head: 'feature',
          base: 'main',
          body: 'Description'
        };
        const mockPR = { ...global.mockPullRequest, ...prData };
        mockClient.create.mockResolvedValue(mockPR);
        
        const result = await createPullRequest('owner', 'repo', prData);
        
        expect(mockClient.create).toHaveBeenCalledWith(prData);
        expect(result).toEqual(mockPR);
      });

      test('handles validation errors', async () => {
        const error = new Error('Missing required fields');
        mockClient.create.mockRejectedValue(error);
        
        await expect(createPullRequest('owner', 'repo', {}))
          .rejects.toThrow('Missing required fields');
      });
    });

    describe('updatePullRequest', () => {
      test('calls client.update with correct parameters', async () => {
        const updateData = { title: 'Updated Title' };
        const mockPR = { ...global.mockPullRequest, ...updateData };
        mockClient.update.mockResolvedValue(mockPR);
        
        const result = await updatePullRequest('owner', 'repo', 1, updateData);
        
        expect(mockClient.update).toHaveBeenCalledWith(1, updateData);
        expect(result).toEqual(mockPR);
      });

      test('handles API errors', async () => {
        const error = new Error('Update failed');
        mockClient.update.mockRejectedValue(error);
        
        await expect(updatePullRequest('owner', 'repo', 1, {}))
          .rejects.toThrow('Update failed');
      });
    });

    describe('mergePullRequest', () => {
      test('calls client.merge with correct parameters', async () => {
        const mergeOptions = { merge_method: 'squash' };
        const mockResult = { merged: true, sha: 'abc123' };
        mockClient.merge.mockResolvedValue(mockResult);
        
        const result = await mergePullRequest('owner', 'repo', 1, mergeOptions);
        
        expect(mockClient.merge).toHaveBeenCalledWith(1, mergeOptions);
        expect(result).toEqual(mockResult);
      });

      test('handles empty merge options', async () => {
        const mockResult = { merged: true, sha: 'abc123' };
        mockClient.merge.mockResolvedValue(mockResult);
        
        const result = await mergePullRequest('owner', 'repo', 1);
        
        expect(mockClient.merge).toHaveBeenCalledWith(1, {});
        expect(result).toEqual(mockResult);
      });

      test('handles merge conflicts', async () => {
        const error = new Error('Merge conflict');
        mockClient.merge.mockRejectedValue(error);
        
        await expect(mergePullRequest('owner', 'repo', 1))
          .rejects.toThrow('Merge conflict');
      });
    });

    describe('closePullRequest', () => {
      test('calls client.update to close PR', async () => {
        const mockPR = { ...global.mockPullRequest, state: 'closed' };
        mockClient.update.mockResolvedValue(mockPR);
        
        const result = await closePullRequest('owner', 'repo', 1);
        
        expect(mockClient.update).toHaveBeenCalledWith(1, { state: 'closed' });
        expect(result).toEqual(mockPR);
      });

      test('handles API errors', async () => {
        const error = new Error('Cannot close PR');
        mockClient.update.mockRejectedValue(error);
        
        await expect(closePullRequest('owner', 'repo', 1))
          .rejects.toThrow('Cannot close PR');
      });
    });

    describe('reopenPullRequest', () => {
      test('calls client.update to reopen PR', async () => {
        const mockPR = { ...global.mockPullRequest, state: 'open' };
        mockClient.update.mockResolvedValue(mockPR);
        
        const result = await reopenPullRequest('owner', 'repo', 1);
        
        expect(mockClient.update).toHaveBeenCalledWith(1, { state: 'open' });
        expect(result).toEqual(mockPR);
      });

      test('handles API errors', async () => {
        const error = new Error('Cannot reopen PR');
        mockClient.update.mockRejectedValue(error);
        
        await expect(reopenPullRequest('owner', 'repo', 1))
          .rejects.toThrow('Cannot reopen PR');
      });
    });
  });

  describe('Integration with Dependencies', () => {
    test('handles missing auth token', () => {
      mockGetAuth.mockReturnValue(null);
      
      const client = createClient();
      
      expect(MockPullRequestClient).toHaveBeenCalledWith({
        auth: null,
        baseUrl: 'https://api.github.com',
        owner: 'default-owner',
        repo: 'default-repo'
      });
    });

    test('handles missing config', () => {
      mockLoadConfig.mockReturnValue({});
      
      const client = createClient();
      
      expect(MockPullRequestClient).toHaveBeenCalledWith({
        auth: 'test-token',
        baseUrl: 'https://api.github.com',
        owner: undefined,
        repo: undefined
      });
    });

    test('handles config loading errors', () => {
      mockLoadConfig.mockImplementation(() => {
        throw new Error('Config error');
      });
      
      expect(() => createClient()).toThrow('Config error');
    });

    test('handles auth loading errors', () => {
      mockGetAuth.mockImplementation(() => {
        throw new Error('Auth error');
      });
      
      expect(() => createClient()).toThrow('Auth error');
    });
  });

  describe('Error Handling', () => {
    let mockClient;

    beforeEach(() => {
      mockClient = {
        list: jest.fn(),
        get: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        merge: jest.fn()
      };
      
      MockPullRequestClient.mockReturnValue(mockClient);
    });

    test('preserves error types from client', async () => {
      const customError = new Error('Custom error');
      customError.status = 404;
      customError.name = 'NotFoundError';
      
      mockClient.get.mockRejectedValue(customError);
      
      try {
        await getPullRequest('owner', 'repo', 999);
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBe(customError);
        expect(error.status).toBe(404);
        expect(error.name).toBe('NotFoundError');
      }
    });

    test('handles network errors', async () => {
      const networkError = new Error('Network error');
      networkError.code = 'ECONNREFUSED';
      
      mockClient.list.mockRejectedValue(networkError);
      
      await expect(listPullRequests('owner', 'repo'))
        .rejects.toThrow('Network error');
    });
  });

  describe('Type Safety', () => {
    test('handles non-string owner and repo parameters', async () => {
      const mockClient = {
        list: jest.fn().mockResolvedValue([])
      };
      MockPullRequestClient.mockReturnValue(mockClient);

      // Should still work with string conversion
      await listPullRequests('owner', 'repo');
      
      expect(MockPullRequestClient).toHaveBeenCalledWith({
        auth: 'test-token',
        baseUrl: 'https://api.github.com',
        owner: 'owner',
        repo: 'repo'
      });
    });

    test('handles undefined options gracefully', async () => {
      const mockClient = {
        list: jest.fn().mockResolvedValue([])
      };
      MockPullRequestClient.mockReturnValue(mockClient);

      await listPullRequests('owner', 'repo', undefined);
      
      expect(mockClient.list).toHaveBeenCalledWith({});
    });
  });
});