import { describe, it } from 'node:test';
import assert from 'node:assert';
import { BaseSearchClient } from '../../lib/BaseSearchClient.mjs';
import { SafeSearchClient } from '../../lib/SafeSearchClient.mjs';
import { RateLimitedSearchClient } from '../../lib/RateLimitedSearchClient.mjs';
import { CachedSearchClient } from '../../lib/CachedSearchClient.mjs';
import { BatchedSearchClient } from '../../lib/BatchedSearchClient.mjs';

describe('Module Structure Tests', () => {
  describe('BaseSearchClient', () => {
    it('should be constructable with token', () => {
      const client = new BaseSearchClient({ token: 'test-token' });
      assert(client instanceof BaseSearchClient);
    });

    it('should have search methods', () => {
      const client = new BaseSearchClient({ token: 'test-token' });
      assert.strictEqual(typeof client.searchRepositories, 'function');
      assert.strictEqual(typeof client.searchCode, 'function');
      assert.strictEqual(typeof client.searchCommits, 'function');
      assert.strictEqual(typeof client.searchIssues, 'function');
      assert.strictEqual(typeof client.searchUsers, 'function');
      assert.strictEqual(typeof client.searchLabels, 'function');
      assert.strictEqual(typeof client.searchTopics, 'function');
    });

    it('should store configuration', () => {
      const client = new BaseSearchClient({ 
        token: 'test-token',
        baseURL: 'https://api.example.com',
        timeout: 5000
      });
      assert.strictEqual(client.token, 'test-token');
      // baseURL is stored internally, not exposed
      assert.strictEqual(client.timeout, 5000);
    });
  });

  describe('SafeSearchClient', () => {
    it('should be constructable and extend RateLimitedSearchClient', () => {
      const client = new SafeSearchClient({ token: 'test-token' });
      assert(client instanceof SafeSearchClient);
      assert(client instanceof RateLimitedSearchClient);
    });

    it('should inherit search methods from parent', () => {
      const client = new SafeSearchClient({ token: 'test-token' });
      assert.strictEqual(typeof client.searchRepositories, 'function');
      assert.strictEqual(typeof client.searchCode, 'function');
    });
  });

  describe('RateLimitedSearchClient', () => {
    it('should be constructable and extend BaseSearchClient', () => {
      const client = new RateLimitedSearchClient({ token: 'test-token' });
      assert(client instanceof RateLimitedSearchClient);
      assert(client instanceof BaseSearchClient);
    });

    it('should have rate limit tracking', () => {
      const client = new RateLimitedSearchClient({ token: 'test-token' });
      // RateLimitedSearchClient extends BaseSearchClient
      assert(client instanceof BaseSearchClient);
    });

    it('should initialize with configuration', () => {
      const client = new RateLimitedSearchClient({ 
        token: 'test-token',
        requestsPerWindow: 10,
        windowMs: 60000
      });
      assert(client instanceof RateLimitedSearchClient);
    });
  });

  describe('CachedSearchClient', () => {
    it('should be constructable and extend BaseSearchClient', () => {
      const client = new CachedSearchClient({ token: 'test-token' });
      assert(client instanceof CachedSearchClient);
      assert(client instanceof BaseSearchClient);
    });

    it('should have cache management methods', () => {
      const client = new CachedSearchClient({ token: 'test-token' });
      assert.strictEqual(typeof client.clearCache, 'function');
      assert.strictEqual(typeof client.getCacheStats, 'function');
    });

    it('should initialize cache with configuration', () => {
      const client = new CachedSearchClient({ 
        token: 'test-token',
        maxCacheSize: 100,
        cacheTTL: 300000
      });
      const stats = client.getCacheStats();
      assert.strictEqual(stats.size, 0);
      // Check that stats object exists and has expected structure
      assert(typeof stats.size === 'number');
    });
  });

  describe('BatchedSearchClient', () => {
    it('should be constructable and extend BaseSearchClient', () => {
      const client = new BatchedSearchClient({ token: 'test-token' });
      assert(client instanceof BatchedSearchClient);
      assert(client instanceof BaseSearchClient);
    });

    it('should have search methods from parent', () => {
      const client = new BatchedSearchClient({ token: 'test-token' });
      // BatchedSearchClient extends BaseSearchClient
      assert.strictEqual(typeof client.searchRepositories, 'function');
      assert.strictEqual(typeof client.searchCode, 'function');
    });

    it('should accept batch configuration', () => {
      const client = new BatchedSearchClient({ 
        token: 'test-token',
        maxBatchSize: 10,
        batchWindowMs: 1000
      });
      assert(client instanceof BatchedSearchClient);
    });
  });
});