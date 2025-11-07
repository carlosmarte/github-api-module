import { describe, it } from 'node:test';
import assert from 'node:assert';
import * as searchModule from '../index.mjs';

describe('Search Module Exports', () => {
  it('should export BaseSearchClient', () => {
    assert(searchModule.BaseSearchClient);
    assert.strictEqual(typeof searchModule.BaseSearchClient, 'function');
  });

  it('should export SafeSearchClient', () => {
    assert(searchModule.SafeSearchClient);
    assert.strictEqual(typeof searchModule.SafeSearchClient, 'function');
  });

  it('should export RateLimitedSearchClient', () => {
    assert(searchModule.RateLimitedSearchClient);
    assert.strictEqual(typeof searchModule.RateLimitedSearchClient, 'function');
  });

  it('should export CachedSearchClient', () => {
    assert(searchModule.CachedSearchClient);
    assert.strictEqual(typeof searchModule.CachedSearchClient, 'function');
  });

  it('should export BatchedSearchClient', () => {
    assert(searchModule.BatchedSearchClient);
    assert.strictEqual(typeof searchModule.BatchedSearchClient, 'function');
  });

  it('should export createSafeSearchClient factory', () => {
    assert(searchModule.createSafeSearchClient);
    assert.strictEqual(typeof searchModule.createSafeSearchClient, 'function');
  });

  it('should export search object with methods', () => {
    assert(searchModule.search);
    assert.strictEqual(typeof searchModule.search.repositories, 'function');
    assert.strictEqual(typeof searchModule.search.code, 'function');
    assert.strictEqual(typeof searchModule.search.issues, 'function');
    assert.strictEqual(typeof searchModule.search.users, 'function');
  });

  it('should have SafeSearchClient as default export', () => {
    assert(searchModule.default);
    assert.strictEqual(searchModule.default, searchModule.SafeSearchClient);
  });
});