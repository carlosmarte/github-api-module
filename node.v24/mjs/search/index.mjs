/**
 * GitHub Search API Module
 * Enterprise-grade search client with scalability features
 */

export { BaseSearchClient } from './lib/BaseSearchClient.mjs';
export { RateLimitedSearchClient } from './lib/RateLimitedSearchClient.mjs';
export { CachedSearchClient } from './lib/CachedSearchClient.mjs';
export { BatchedSearchClient } from './lib/BatchedSearchClient.mjs';
export { SafeSearchClient, createSafeSearchClient } from './lib/SafeSearchClient.mjs';

// Default export is the safe production client
export { SafeSearchClient as default } from './lib/SafeSearchClient.mjs';

/**
 * Quick search functions using SafeSearchClient
 */
const defaultClient = null;

async function getDefaultClient() {
  if (!defaultClient) {
    const { createSafeSearchClient } = await import('./lib/SafeSearchClient.mjs');
    return createSafeSearchClient();
  }
  return defaultClient;
}

export const search = {
  async repositories(query, options = {}) {
    const client = await getDefaultClient();
    return client.searchRepositories({ q: query, ...options });
  },
  
  async code(query, options = {}) {
    const client = await getDefaultClient();
    return client.searchCode({ q: query, ...options });
  },
  
  async commits(query, options = {}) {
    const client = await getDefaultClient();
    return client.searchCommits({ q: query, ...options });
  },
  
  async issues(query, options = {}) {
    const client = await getDefaultClient();
    return client.searchIssues({ q: query, ...options });
  },
  
  async users(query, options = {}) {
    const client = await getDefaultClient();
    return client.searchUsers({ q: query, ...options });
  },
  
  async labels(repositoryId, query, options = {}) {
    const client = await getDefaultClient();
    return client.searchLabels({ repository_id: repositoryId, q: query, ...options });
  },
  
  async topics(query, options = {}) {
    const client = await getDefaultClient();
    return client.searchTopics({ q: query, ...options });
  }
};