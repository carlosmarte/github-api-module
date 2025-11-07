/**
 * @fileoverview RepoClient tests
 * @module tests/client
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import nock from 'nock';
import { RepoClient } from '../src/client/RepoClient.mjs';
import { AuthError, ValidationError } from '../src/utils/errors.mjs';

describe('RepoClient', () => {
  let client;
  
  beforeEach(() => {
    // Clear any existing nock interceptors
    nock.cleanAll();
    
    // Mock GitHub API base URL
    nock.disableNetConnect();
    
    client = new RepoClient({
      token: 'test-token',
      baseUrl: 'https://api.github.com'
    });
  });
  
  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
    
    if (client) {
      client.destroy();
    }
  });
  
  describe('constructor', () => {
    test('should create client with default options', () => {
      const defaultClient = new RepoClient({
        token: 'test-token'
      });
      
      const config = defaultClient.getConfig();
      expect(config.baseUrl).toBe('https://api.github.com');
      expect(config.timeout).toBe(10000);
      expect(config.rateLimiting.enabled).toBe(true);
    });
    
    test('should create client with custom options', () => {
      const customClient = new RepoClient({
        token: 'test-token',
        baseUrl: 'https://custom.api.com',
        timeout: 5000,
        rateLimiting: { enabled: false }
      });
      
      const config = customClient.getConfig();
      expect(config.baseUrl).toBe('https://custom.api.com');
      expect(config.timeout).toBe(5000);
      expect(config.rateLimiting.enabled).toBe(false);
    });
    
    test('should throw AuthError without token', () => {
      // Mock process.env to remove any GITHUB_TOKEN
      const originalEnv = process.env;
      process.env = { ...originalEnv };
      delete process.env.GITHUB_TOKEN;
      delete process.env.GH_TOKEN;
      delete process.env.GITHUB_ACCESS_TOKEN;
      delete process.env.GITHUB_PAT;
      
      try {
        expect(() => {
          new RepoClient({});
        }).toThrow(AuthError);
      } finally {
        // Restore original environment
        process.env = originalEnv;
      }
    });
  });
  
  describe('authentication', () => {
    test('should initialize successfully with valid token', async () => {
      const mockUser = testUtils.createMockUser();
      
      nock('https://api.github.com')
        .get('/user')
        .reply(200, mockUser)
        .head('/user')
        .reply(200, '', { 'x-oauth-scopes': 'repo, user' })
        .get('/rate_limit')
        .reply(200, {
          resources: {
            core: { limit: 5000, remaining: 4999, reset: 1640995200 }
          }
        });
      
      await client.initialize();
      
      const user = await client.getAuthenticatedUser();
      expect(user.login).toBe(mockUser.login);
    });
    
    test('should handle authentication failure', async () => {
      nock('https://api.github.com')
        .get('/user')
        .reply(401, { message: 'Bad credentials' });
      
      await expect(client.initialize()).rejects.toThrow(AuthError);
    });
  });
  
  describe('repositories API', () => {
    test('should get repository', async () => {
      const mockRepo = testUtils.createMockRepo({
        name: 'test-repo',
        full_name: 'octocat/test-repo'
      });
      
      nock('https://api.github.com')
        .get('/repos/octocat/test-repo')
        .reply(200, mockRepo);
      
      const repo = await client.repositories.get('octocat', 'test-repo');
      
      expect(repo.name).toBe('test-repo');
      expect(repo.full_name).toBe('octocat/test-repo');
    });
    
    test('should handle repository not found', async () => {
      nock('https://api.github.com')
        .get('/repos/octocat/nonexistent')
        .reply(404, { message: 'Not Found' });
      
      await expect(
        client.repositories.get('octocat', 'nonexistent')
      ).rejects.toThrow('Resource not found');
    });
    
    test('should list repositories', async () => {
      const mockRepos = [
        testUtils.createMockRepo({ name: 'repo1' }),
        testUtils.createMockRepo({ name: 'repo2' })
      ];
      
      nock('https://api.github.com')
        .get('/user/repos')
        .query({
          visibility: 'all',
          affiliation: 'owner,collaborator,organization_member',
          type: 'all',
          sort: 'updated',
          direction: 'desc',
          page: '1',
          per_page: '30'
        })
        .reply(200, mockRepos);
      
      const repos = await client.repositories.listForAuthenticatedUser();
      
      expect(repos).toHaveLength(2);
      expect(repos[0].name).toBe('repo1');
      expect(repos[1].name).toBe('repo2');
    });
    
    test('should create repository', async () => {
      const repoData = {
        name: 'new-repo',
        description: 'Test repository',
        private: false
      };
      
      const mockRepo = testUtils.createMockRepo(repoData);
      
      nock('https://api.github.com')
        .post('/user/repos', {
          name: 'new-repo',
          description: 'Test repository',
          homepage: null,
          private: false,
          has_issues: true,
          has_projects: true,
          has_wiki: true,
          has_discussions: false,
          is_template: false,
          auto_init: false,
          gitignore_template: null,
          license_template: null,
          allow_squash_merge: true,
          allow_merge_commit: true,
          allow_rebase_merge: true,
          allow_auto_merge: false,
          delete_branch_on_merge: false,
          allow_update_branch: false,
          squash_merge_commit_title: null,
          squash_merge_commit_message: null,
          merge_commit_title: null,
          merge_commit_message: null
        })
        .reply(201, mockRepo);
      
      const repo = await client.repositories.create(repoData);
      
      expect(repo.name).toBe('new-repo');
      expect(repo.description).toBe('Test repository');
    });
    
    test('should validate repository data', async () => {
      await expect(
        client.repositories.create({ name: '' })
      ).rejects.toThrow(ValidationError);
      
      await expect(
        client.repositories.create({ name: 'test', description: 'x'.repeat(400) })
      ).rejects.toThrow(ValidationError);
    });
  });
  
  describe('branches API', () => {
    test('should list branches', async () => {
      const mockBranches = [
        testUtils.createMockBranch({ name: 'main' }),
        testUtils.createMockBranch({ name: 'develop', protected: true })
      ];
      
      nock('https://api.github.com')
        .get('/repos/octocat/test-repo/branches')
        .query({
          protected: 'false',
          page: '1',
          per_page: '30'
        })
        .reply(200, mockBranches);
      
      const branches = await client.branches.list('octocat', 'test-repo');
      
      expect(branches).toHaveLength(2);
      expect(branches[0].name).toBe('main');
      expect(branches[1].name).toBe('develop');
      expect(branches[1].protected).toBe(true);
    });
    
    test('should get specific branch', async () => {
      const mockBranch = testUtils.createMockBranch({ name: 'main' });
      
      nock('https://api.github.com')
        .get('/repos/octocat/test-repo/branches/main')
        .reply(200, mockBranch);
      
      const branch = await client.branches.get('octocat', 'test-repo', 'main');
      
      expect(branch.name).toBe('main');
    });
  });
  
  describe('collaborators API', () => {
    test('should list collaborators', async () => {
      const mockCollaborators = [
        testUtils.createMockCollaborator({ login: 'user1' }),
        testUtils.createMockCollaborator({ login: 'user2' })
      ];
      
      nock('https://api.github.com')
        .get('/repos/octocat/test-repo/collaborators')
        .query({
          affiliation: 'all',
          page: '1',
          per_page: '30'
        })
        .reply(200, mockCollaborators);
      
      const collaborators = await client.collaborators.list('octocat', 'test-repo');
      
      expect(collaborators).toHaveLength(2);
      expect(collaborators[0].login).toBe('user1');
      expect(collaborators[1].login).toBe('user2');
    });
    
    test('should check collaborator permissions', async () => {
      const mockPermission = {
        permission: 'admin',
        user: { login: 'testuser' }
      };
      
      nock('https://api.github.com')
        .get('/repos/octocat/test-repo/collaborators/testuser/permission')
        .reply(200, mockPermission);
      
      const permission = await client.collaborators.checkPermissions('octocat', 'test-repo', 'testuser');
      
      expect(permission.permission).toBe('admin');
    });
  });
  
  describe('error handling', () => {
    test('should handle rate limiting', async () => {
      // Use a completely generic nock setup
      nock.cleanAll();
      
      const interceptor = nock('https://api.github.com')
        .persist() // Make it persistent to avoid timing issues
        .get(() => true) // Match any GET request
        .reply(429, 
          { message: 'API rate limit exceeded' },
          { 
            'x-ratelimit-remaining': '0', 
            'x-ratelimit-reset': '1640995200',
            'content-type': 'application/json'
          }
        );
      
      await expect(
        client.repositories.get('octocat', 'test-repo')
      ).rejects.toThrow('API rate limit exceeded');
      
      // Clean up after test
      interceptor.persist(false);
      nock.cleanAll();
    });
    
    test('should handle network errors', async () => {
      // Don't mock the request to simulate network failure
      nock('https://api.github.com')
        .get('/repos/octocat/test-repo')
        .replyWithError('ECONNREFUSED');
      
      await expect(
        client.repositories.get('octocat', 'test-repo')
      ).rejects.toThrow();
    });
  });
  
  describe('pagination', () => {
    test('should handle paginated responses', async () => {
      const page1 = [testUtils.createMockRepo({ name: 'repo1' })];
      const page2 = [testUtils.createMockRepo({ name: 'repo2' })];
      
      nock('https://api.github.com')
        .get('/user/repos')
        .query({ page: '1', per_page: '1', visibility: 'all', affiliation: 'owner,collaborator,organization_member', type: 'all', sort: 'updated', direction: 'desc' })
        .reply(200, page1, {
          'link': '<https://api.github.com/user/repos?page=2&per_page=1>; rel="next"'
        })
        .get('/user/repos')
        .query({ page: '2', per_page: '1', visibility: 'all', affiliation: 'owner,collaborator,organization_member', type: 'all', sort: 'updated', direction: 'desc' })
        .reply(200, page2);
      
      const paginator = client.paginate(client.repositories.listForAuthenticatedUser, { per_page: 1 });
      const allRepos = [];
      
      for await (const repo of paginator) {
        allRepos.push(repo);
        if (allRepos.length >= 2) break; // Prevent infinite loop in test
      }
      
      expect(allRepos).toHaveLength(2);
      expect(allRepos[0].name).toBe('repo1');
      expect(allRepos[1].name).toBe('repo2');
    });
  });
  
  describe('client configuration', () => {
    test('should update configuration', () => {
      const originalConfig = client.getConfig();
      expect(originalConfig.timeout).toBe(10000);
      
      client.updateConfig({ timeout: 15000 });
      
      const updatedConfig = client.getConfig();
      expect(updatedConfig.timeout).toBe(15000);
    });
    
    test('should ping API', async () => {
      nock('https://api.github.com')
        .get('/')
        .reply(200, { message: 'Hello, World!' });
      
      const result = await client.ping();
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('GitHub API is reachable');
    });
  });
});