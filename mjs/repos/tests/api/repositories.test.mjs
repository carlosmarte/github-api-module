/**
 * @fileoverview Repository API tests
 * @module tests/api/repositories
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import nock from 'nock';
import { HTTPClient } from '../../src/client/http.mjs';
import * as repositories from '../../src/api/repositories.mjs';
import { ValidationError, NotFoundError } from '../../src/utils/errors.mjs';

describe('repositories API', () => {
  let httpClient;
  
  beforeEach(() => {
    nock.cleanAll();
    nock.disableNetConnect();
    
    httpClient = new HTTPClient({
      baseUrl: 'https://api.github.com',
      authManager: {
        getAuthHeader: () => 'Bearer test-token'
      }
    });
  });
  
  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });
  
  describe('get', () => {
    test('should get repository successfully', async () => {
      const mockRepo = testUtils.createMockRepo({
        name: 'test-repo',
        full_name: 'octocat/test-repo'
      });
      
      nock('https://api.github.com')
        .get('/repos/octocat/test-repo')
        .reply(200, mockRepo);
      
      const result = await repositories.get(httpClient, 'octocat', 'test-repo');
      
      expect(result.name).toBe('test-repo');
      expect(result.full_name).toBe('octocat/test-repo');
    });
    
    test('should validate owner parameter', async () => {
      await expect(
        repositories.get(httpClient, '', 'test-repo')
      ).rejects.toThrow(ValidationError);
      
      await expect(
        repositories.get(httpClient, 'invalid-user-name-too-long-to-be-valid-and-exceeds-39-chars', 'test-repo')
      ).rejects.toThrow(ValidationError);
    });
    
    test('should validate repository name parameter', async () => {
      await expect(
        repositories.get(httpClient, 'octocat', '')
      ).rejects.toThrow(ValidationError);
      
      await expect(
        repositories.get(httpClient, 'octocat', 'invalid/repo')
      ).rejects.toThrow(ValidationError);
    });
  });
  
  describe('listForUser', () => {
    test('should list user repositories with default options', async () => {
      const mockRepos = [
        testUtils.createMockRepo({ name: 'repo1' }),
        testUtils.createMockRepo({ name: 'repo2' })
      ];
      
      nock('https://api.github.com')
        .get('/users/octocat/repos')
        .query({
          type: 'all',
          sort: 'updated',
          direction: 'desc',
          page: '1',
          per_page: '30'
        })
        .reply(200, mockRepos);
      
      const result = await repositories.listForUser(httpClient, 'octocat');
      
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('repo1');
      expect(result[1].name).toBe('repo2');
    });
    
    test('should list user repositories with custom options', async () => {
      const mockRepos = [testUtils.createMockRepo({ name: 'repo1' })];
      
      nock('https://api.github.com')
        .get('/users/octocat/repos')
        .query({
          type: 'owner',
          sort: 'created',
          direction: 'asc',
          page: '2',
          per_page: '10'
        })
        .reply(200, mockRepos);
      
      const result = await repositories.listForUser(httpClient, 'octocat', {
        type: 'owner',
        sort: 'created',
        direction: 'asc',
        page: 2,
        per_page: 10
      });
      
      expect(result).toHaveLength(1);
    });
    
    test('should validate sort parameters', async () => {
      await expect(
        repositories.listForUser(httpClient, 'octocat', { sort: 'invalid' })
      ).rejects.toThrow(ValidationError);
    });
    
    test('should validate pagination parameters', async () => {
      await expect(
        repositories.listForUser(httpClient, 'octocat', { page: 0 })
      ).rejects.toThrow(ValidationError);
      
      await expect(
        repositories.listForUser(httpClient, 'octocat', { per_page: 101 })
      ).rejects.toThrow(ValidationError);
    });
  });
  
  describe('listForAuthenticatedUser', () => {
    test('should list authenticated user repositories', async () => {
      const mockRepos = [
        testUtils.createMockRepo({ name: 'private-repo', private: true }),
        testUtils.createMockRepo({ name: 'public-repo', private: false })
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
      
      const result = await repositories.listForAuthenticatedUser(httpClient);
      
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('private-repo');
      expect(result[1].name).toBe('public-repo');
    });
  });
  
  describe('create', () => {
    test('should create repository with minimal data', async () => {
      const repoData = {
        name: 'new-repo',
        description: 'Test repository'
      };
      
      const mockRepo = testUtils.createMockRepo(repoData);
      
      nock('https://api.github.com')
        .post('/user/repos')
        .reply(201, mockRepo);
      
      const result = await repositories.create(httpClient, repoData);
      
      expect(result.name).toBe('new-repo');
      expect(result.description).toBe('Test repository');
    });
    
    test('should create repository with full data', async () => {
      const repoData = {
        name: 'full-repo',
        description: 'Full test repository',
        private: true,
        has_issues: false,
        has_projects: false,
        has_wiki: false,
        auto_init: true,
        gitignore_template: 'Node',
        license_template: 'mit',
        allow_squash_merge: false
      };
      
      const mockRepo = testUtils.createMockRepo(repoData);
      
      nock('https://api.github.com')
        .post('/user/repos', {
          name: 'full-repo',
          description: 'Full test repository',
          homepage: null,
          private: true,
          has_issues: false,
          has_projects: false,
          has_wiki: false,
          has_discussions: false,
          is_template: false,
          auto_init: true,
          gitignore_template: 'Node',
          license_template: 'mit',
          allow_squash_merge: false,
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
      
      const result = await repositories.create(httpClient, repoData);
      
      expect(result.name).toBe('full-repo');
      expect(result.private).toBe(true);
    });
    
    test('should create repository with topics', async () => {
      const repoData = {
        name: 'topic-repo',
        description: 'Repository with topics',
        topics: ['javascript', 'api', 'sdk']
      };
      
      const mockRepo = testUtils.createMockRepo(repoData);
      
      nock('https://api.github.com')
        .post('/user/repos')
        .reply(201, mockRepo)
        .put('/repos/testuser/topic-repo/topics', { names: ['javascript', 'api', 'sdk'] })
        .reply(200, { names: ['javascript', 'api', 'sdk'] });
      
      const result = await repositories.create(httpClient, repoData);
      
      expect(result.name).toBe('topic-repo');
    });
    
    test('should validate repository data', async () => {
      await expect(
        repositories.create(httpClient, { name: '' })
      ).rejects.toThrow(ValidationError);
      
      await expect(
        repositories.create(httpClient, { name: 'test', description: 'x'.repeat(400) })
      ).rejects.toThrow(ValidationError);
      
      await expect(
        repositories.create(httpClient, { name: 'test', topics: 'not-an-array' })
      ).rejects.toThrow(ValidationError);
    });
  });
  
  describe('createInOrg', () => {
    test('should create repository in organization', async () => {
      const repoData = {
        name: 'org-repo',
        description: 'Organization repository',
        private: false
      };
      
      const mockRepo = testUtils.createMockRepo({
        ...repoData,
        full_name: 'testorg/org-repo'
      });
      
      nock('https://api.github.com')
        .post('/orgs/testorg/repos')
        .reply(201, mockRepo);
      
      const result = await repositories.createInOrg(httpClient, 'testorg', repoData);
      
      expect(result.name).toBe('org-repo');
      expect(result.full_name).toBe('testorg/org-repo');
    });
  });
  
  describe('update', () => {
    test('should update repository', async () => {
      const updates = {
        description: 'Updated description',
        has_issues: false
      };
      
      const mockRepo = testUtils.createMockRepo({
        name: 'test-repo',
        description: 'Updated description',
        has_issues: false
      });
      
      nock('https://api.github.com')
        .patch('/repos/octocat/test-repo', updates)
        .reply(200, mockRepo);
      
      const result = await repositories.update(httpClient, 'octocat', 'test-repo', updates);
      
      expect(result.description).toBe('Updated description');
      expect(result.has_issues).toBe(false);
    });
    
    test('should update repository with topics', async () => {
      const updates = {
        description: 'Updated description',
        topics: ['updated', 'topics']
      };
      
      const mockRepo = testUtils.createMockRepo({
        name: 'test-repo',
        description: 'Updated description'
      });
      
      nock('https://api.github.com')
        .patch('/repos/octocat/test-repo', { description: 'Updated description' })
        .reply(200, mockRepo)
        .put('/repos/octocat/test-repo/topics', { names: ['updated', 'topics'] })
        .reply(200, { names: ['updated', 'topics'] });
      
      const result = await repositories.update(httpClient, 'octocat', 'test-repo', updates);
      
      expect(result.description).toBe('Updated description');
    });
  });
  
  describe('deleteRepo', () => {
    test('should delete repository', async () => {
      nock('https://api.github.com')
        .delete('/repos/octocat/test-repo')
        .reply(204);
      
      const result = await repositories.deleteRepo(httpClient, 'octocat', 'test-repo');
      
      expect(result.message).toBe('Repository deleted successfully');
    });
  });
  
  describe('topics', () => {
    test('should get all topics', async () => {
      const mockTopics = { names: ['javascript', 'api', 'sdk'] };
      
      nock('https://api.github.com')
        .get('/repos/octocat/test-repo/topics')
        .reply(200, mockTopics);
      
      const result = await repositories.getAllTopics(httpClient, 'octocat', 'test-repo');
      
      expect(result.names).toEqual(['javascript', 'api', 'sdk']);
    });
    
    test('should replace all topics', async () => {
      const topics = ['new', 'topics'];
      const mockResponse = { names: topics };
      
      nock('https://api.github.com')
        .put('/repos/octocat/test-repo/topics', { names: topics })
        .reply(200, mockResponse);
      
      const result = await repositories.replaceAllTopics(httpClient, 'octocat', 'test-repo', topics);
      
      expect(result.names).toEqual(topics);
    });
    
    test('should validate topics', async () => {
      // Test non-array input
      await expect(
        repositories.replaceAllTopics(httpClient, 'octocat', 'test-repo', 'not-an-array')
      ).rejects.toThrow(ValidationError);
      
      // Test topic too long (over 50 chars)
      await expect(
        repositories.replaceAllTopics(httpClient, 'octocat', 'test-repo', ['x'.repeat(51)])
      ).rejects.toThrow(ValidationError);
      
      // Test too many topics (over 20)
      await expect(
        repositories.replaceAllTopics(httpClient, 'octocat', 'test-repo', Array(21).fill('topic'))
      ).rejects.toThrow(ValidationError);
      
      // Test invalid topic format (uppercase letters)
      await expect(
        repositories.replaceAllTopics(httpClient, 'octocat', 'test-repo', ['Invalid-Topic'])
      ).rejects.toThrow(ValidationError);
    });
  });
  
  describe('languages', () => {
    test('should get repository languages', async () => {
      const mockLanguages = {
        'JavaScript': 12345,
        'Python': 5432,
        'HTML': 1234
      };
      
      nock('https://api.github.com')
        .get('/repos/octocat/test-repo/languages')
        .reply(200, mockLanguages);
      
      const result = await repositories.getLanguages(httpClient, 'octocat', 'test-repo');
      
      expect(result).toEqual(mockLanguages);
    });
  });
  
  describe('contributors', () => {
    test('should get repository contributors', async () => {
      const mockContributors = [
        { login: 'user1', contributions: 100 },
        { login: 'user2', contributions: 50 }
      ];
      
      nock('https://api.github.com')
        .get('/repos/octocat/test-repo/contributors')
        .query({
          anon: '0',
          page: '1',
          per_page: '30'
        })
        .reply(200, mockContributors);
      
      const result = await repositories.getContributors(httpClient, 'octocat', 'test-repo');
      
      expect(result).toHaveLength(2);
      expect(result[0].login).toBe('user1');
      expect(result[0].contributions).toBe(100);
    });
  });
  
  describe('fork', () => {
    test('should fork repository', async () => {
      const mockFork = testUtils.createMockRepo({
        name: 'Hello-World',
        full_name: 'testuser/Hello-World',
        fork: true
      });
      
      nock('https://api.github.com')
        .post('/repos/octocat/Hello-World/forks', {})
        .reply(202, mockFork);
      
      const result = await repositories.fork(httpClient, 'octocat', 'Hello-World');
      
      expect(result.name).toBe('Hello-World');
      expect(result.fork).toBe(true);
    });
    
    test('should fork repository with options', async () => {
      const options = {
        organization: 'myorg',
        name: 'forked-repo',
        default_branch_only: true
      };
      
      const mockFork = testUtils.createMockRepo({
        name: 'forked-repo',
        full_name: 'myorg/forked-repo',
        fork: true
      });
      
      nock('https://api.github.com')
        .post('/repos/octocat/Hello-World/forks', options)
        .reply(202, mockFork);
      
      const result = await repositories.fork(httpClient, 'octocat', 'Hello-World', options);
      
      expect(result.name).toBe('forked-repo');
      expect(result.full_name).toBe('myorg/forked-repo');
    });
  });
  
  describe('star', () => {
    test('should check if repository is starred', async () => {
      nock('https://api.github.com')
        .get('/user/starred/octocat/Hello-World')
        .reply(204);
      
      const result = await repositories.checkIfStarred(httpClient, 'octocat', 'Hello-World');
      
      expect(result).toBe(true);
    });
    
    test('should return false if repository is not starred', async () => {
      nock('https://api.github.com')
        .get('/user/starred/octocat/Hello-World')
        .reply(404);
      
      const result = await repositories.checkIfStarred(httpClient, 'octocat', 'Hello-World');
      
      expect(result).toBe(false);
    });
    
    test('should star repository', async () => {
      nock('https://api.github.com')
        .put('/user/starred/octocat/Hello-World')
        .reply(204);
      
      const result = await repositories.star(httpClient, 'octocat', 'Hello-World');
      
      expect(result.message).toBe('Repository starred successfully');
    });
    
    test('should unstar repository', async () => {
      nock('https://api.github.com')
        .delete('/user/starred/octocat/Hello-World')
        .reply(204);
      
      const result = await repositories.unstar(httpClient, 'octocat', 'Hello-World');
      
      expect(result.message).toBe('Repository unstarred successfully');
    });
  });
  
  describe('generateNameSuggestions', () => {
    test('should generate valid repository name suggestions', async () => {
      const suggestions = repositories.generateNameSuggestions('test');
      
      expect(suggestions).toContain('test');
      expect(suggestions).toContain('test-project');
      expect(suggestions).toContain('test-app');
      expect(suggestions).toContain('my-test');
      
      // All suggestions should be valid
      const { validateRepositoryName } = await import('../../src/utils/validation.mjs');
      suggestions.forEach(name => {
        expect(() => {
          validateRepositoryName(name);
        }).not.toThrow();
      });
    });
  });
});