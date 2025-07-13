import { GistClient } from './lib/client.mjs';
import { GistsEndpoint } from './lib/endpoints/gists.mjs';
import { CommentsEndpoint } from './lib/endpoints/comments.mjs';
import { CommitsEndpoint } from './lib/endpoints/commits.mjs';
import { ForksEndpoint } from './lib/endpoints/forks.mjs';
import { StarsEndpoint } from './lib/endpoints/stars.mjs';

export * from './lib/utils/errors.mjs';
export * from './lib/utils/pagination.mjs';
export * from './lib/utils/formatter.mjs';
export { AuthManager } from './lib/utils/auth.mjs';
export { ConfigManager } from './lib/utils/config.mjs';

/**
 * GitHub Gist API Client
 * 
 * @example
 * ```javascript
 * import GistAPI from '@github-api/gist';
 * 
 * const client = new GistAPI({ token: 'your-token' });
 * 
 * // List gists
 * const gists = await client.gists.list();
 * 
 * // Create a gist
 * const newGist = await client.gists.create({
 *   description: 'My gist',
 *   public: true,
 *   files: {
 *     'hello.js': { content: 'console.log("Hello World");' }
 *   }
 * });
 * 
 * // Work with comments
 * const comments = await client.comments.list(gistId);
 * ```
 */
export default class GistAPI {
  constructor(options = {}) {
    this.client = new GistClient(options);
    
    // Initialize endpoints
    this.gists = new GistsEndpoint(this.client);
    this.comments = new CommentsEndpoint(this.client);
    this.commits = new CommitsEndpoint(this.client);
    this.forks = new ForksEndpoint(this.client);
    this.stars = new StarsEndpoint(this.client);
  }
  
  /**
   * Get rate limit information
   */
  async getRateLimit() {
    const response = await this.client.get('/rate_limit');
    return response.data;
  }
  
  /**
   * Get authenticated user information
   */
  async getUser() {
    this.client.auth.requireAuth();
    const response = await this.client.get('/user');
    return response.data;
  }
  
  /**
   * Create a new instance with different options
   */
  withOptions(options) {
    return new GistAPI({ ...this.client.auth, ...options });
  }
}

// Export the class as both default and named export
export { GistAPI };

// Export a pre-configured instance for quick use
export const gistAPI = new GistAPI();