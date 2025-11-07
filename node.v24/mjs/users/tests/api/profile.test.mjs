/**
 * @fileoverview Tests for ProfileAPI
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { ProfileAPI } from '../../src/api/profile.mjs';
import { AuthError, ValidationError } from '../../src/utils/errors.mjs';
import { HttpClient } from '../../src/client/http.mjs';

describe('ProfileAPI', () => {
  let profileAPI;
  let httpClient;

  beforeEach(() => {
    httpClient = new HttpClient({
      token: 'test-token-123',
      baseUrl: 'https://api.github.com'
    });
    profileAPI = new ProfileAPI(httpClient);
  });

  describe('getAuthenticated', () => {
    it('should get authenticated user successfully', async () => {
      const mockAPI = mockGitHubAPI();
      mockAPI
        .get('/user')
        .reply(200, mockUserData.private);

      const user = await profileAPI.getAuthenticated();
      expect(user).toEqual(expect.objectContaining({
        login: 'octocat',
        id: 1,
        type: 'User'
      }));
    });

    it('should throw AuthError on 401', async () => {
      const mockAPI = mockGitHubAPI();
      mockAPI
        .get('/user')
        .reply(401, mockErrorResponse(401, 'Bad credentials'));

      await expect(profileAPI.getAuthenticated()).rejects.toThrow(AuthError);
    });

    it('should pass options to http client', async () => {
      const mockAPI = mockGitHubAPI();
      mockAPI
        .get('/user')
        .reply(200, mockUserData.private);

      const options = { headers: { 'X-Custom': 'test' } };
      await profileAPI.getAuthenticated(options);
      
      // Test passes if no error is thrown
    });
  });

  describe('updateAuthenticated', () => {
    it('should update user profile successfully', async () => {
      const updateData = {
        name: 'New Name',
        bio: 'Updated bio',
        location: 'New Location'
      };

      const mockAPI = mockGitHubAPI();
      mockAPI
        .patch('/user', updateData)
        .reply(200, { ...mockUserData.private, ...updateData });

      const result = await profileAPI.updateAuthenticated(updateData);
      expect(result.name).toBe('New Name');
      expect(result.bio).toBe('Updated bio');
      expect(result.location).toBe('New Location');
    });

    it('should validate user data before update', async () => {
      const invalidData = {
        name: 'x'.repeat(300) // Too long
      };

      await expect(profileAPI.updateAuthenticated(invalidData)).rejects.toThrow(ValidationError);
    });

    it('should throw AuthError on 401', async () => {
      const mockAPI = mockGitHubAPI();
      mockAPI
        .patch('/user')
        .reply(401, mockErrorResponse(401, 'Bad credentials'));

      await expect(profileAPI.updateAuthenticated({ name: 'Test' })).rejects.toThrow(AuthError);
    });

    it('should throw AuthError on 403 (insufficient permissions)', async () => {
      const mockAPI = mockGitHubAPI();
      mockAPI
        .patch('/user')
        .reply(403, mockErrorResponse(403, 'Forbidden'));

      await expect(profileAPI.updateAuthenticated({ name: 'Test' })).rejects.toThrow(AuthError);
    });

    it('should handle empty update data', async () => {
      const mockAPI = mockGitHubAPI();
      mockAPI
        .patch('/user', {})
        .reply(200, mockUserData.private);

      const result = await profileAPI.updateAuthenticated({});
      expect(result.login).toBe('octocat');
    });
  });

  describe('getPublicProfile', () => {
    it('should return only public fields', async () => {
      const mockAPI = mockGitHubAPI();
      mockAPI
        .get('/user')
        .reply(200, mockUserData.private);

      const publicUser = await profileAPI.getPublicProfile();
      
      // Should have public fields
      expect(publicUser.login).toBe('octocat');
      expect(publicUser.name).toBe('The Octocat');
      expect(publicUser.public_repos).toBe(2);
      
      // Should not have private fields
      expect(publicUser.private_gists).toBeUndefined();
      expect(publicUser.total_private_repos).toBeUndefined();
      expect(publicUser.disk_usage).toBeUndefined();
      expect(publicUser.plan).toBeUndefined();
    });
  });

  describe('getDiskUsage', () => {
    it('should return disk usage information', async () => {
      const mockAPI = mockGitHubAPI();
      mockAPI
        .get('/user')
        .reply(200, mockUserData.private);

      const usage = await profileAPI.getDiskUsage();
      
      expect(usage).toEqual({
        diskUsage: 10000,
        privateRepos: 100,
        totalPrivateRepos: 100,
        collaborators: 8
      });
    });

    it('should return default values for missing data', async () => {
      const userData = { ...mockUserData.private };
      delete userData.disk_usage;
      delete userData.owned_private_repos;
      
      const mockAPI = mockGitHubAPI();
      mockAPI
        .get('/user')
        .reply(200, userData);

      const usage = await profileAPI.getDiskUsage();
      
      expect(usage.diskUsage).toBe(0);
      expect(usage.privateRepos).toBe(0);
    });
  });

  describe('getPlan', () => {
    it('should return plan information', async () => {
      const mockAPI = mockGitHubAPI();
      mockAPI
        .get('/user')
        .reply(200, mockUserData.private);

      const plan = await profileAPI.getPlan();
      
      expect(plan).toEqual({
        name: 'Medium',
        space: 400,
        private_repos: 20,
        collaborators: 0
      });
    });

    it('should return null for missing plan', async () => {
      const userData = { ...mockUserData.private };
      delete userData.plan;
      
      const mockAPI = mockGitHubAPI();
      mockAPI
        .get('/user')
        .reply(200, userData);

      const plan = await profileAPI.getPlan();
      expect(plan).toBeNull();
    });

    it('should return null on auth error', async () => {
      const mockAPI = mockGitHubAPI();
      mockAPI
        .get('/user')
        .reply(401, mockErrorResponse(401, 'Bad credentials'));

      const plan = await profileAPI.getPlan();
      expect(plan).toBeNull();
    });
  });
});