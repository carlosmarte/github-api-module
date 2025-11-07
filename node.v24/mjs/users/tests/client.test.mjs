/**
 * @fileoverview Tests for UsersClient
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { UsersClient } from '../src/client/UsersClient.mjs';
import { AuthError, UsersError } from '../src/utils/errors.mjs';

describe('UsersClient', () => {
  let client;

  beforeEach(() => {
    client = new UsersClient({
      token: 'test-token-123',
      baseUrl: 'https://api.github.com'
    });
  });

  afterEach(() => {
    if (client) {
      client.close();
    }
  });

  describe('constructor', () => {
    it('should create client with valid token', () => {
      expect(client).toBeInstanceOf(UsersClient);
      expect(client.options.token).toBe('test-token-123');
      expect(client.options.baseUrl).toBe('https://api.github.com');
    });

    it('should throw AuthError without token', () => {
      expect(() => {
        new UsersClient({});
      }).toThrow(AuthError);
    });

    it('should set default options', () => {
      const defaultClient = new UsersClient({ token: 'test' });
      expect(defaultClient.options.baseUrl).toBe('https://api.github.com');
      expect(defaultClient.options.timeout).toBe(10000);
      expect(defaultClient.options.rateLimiting.enabled).toBe(true);
    });

    it('should override default options', () => {
      const customClient = new UsersClient({
        token: 'test',
        baseUrl: 'https://github.enterprise.com/api/v3',
        timeout: 5000,
        rateLimiting: { enabled: false }
      });
      
      expect(customClient.options.baseUrl).toBe('https://github.enterprise.com/api/v3');
      expect(customClient.options.timeout).toBe(5000);
      expect(customClient.options.rateLimiting.enabled).toBe(false);
    });
  });

  describe('API modules', () => {
    it('should have profile API', () => {
      expect(client.profile).toBeDefined();
      expect(typeof client.profile.getAuthenticated).toBe('function');
      expect(typeof client.profile.updateAuthenticated).toBe('function');
    });

    it('should have emails API', () => {
      expect(client.emails).toBeDefined();
      expect(typeof client.emails.list).toBe('function');
      expect(typeof client.emails.add).toBe('function');
      expect(typeof client.emails.delete).toBe('function');
    });

    it('should have discovery API', () => {
      expect(client.discovery).toBeDefined();
      expect(typeof client.discovery.list).toBe('function');
      expect(typeof client.discovery.getByUsername).toBe('function');
      expect(typeof client.discovery.getById).toBe('function');
    });

    it('should have context API', () => {
      expect(client.context).toBeDefined();
      expect(typeof client.context.getForUser).toBe('function');
    });
  });

  describe('testAuth', () => {
    it('should return rate limit info on successful auth', async () => {
      const mockAPI = mockGitHubAPI();
      mockAPI
        .get('/rate_limit')
        .reply(200, mockRateLimitData);

      const result = await client.testAuth();
      expect(result).toEqual(expect.objectContaining({
        resources: expect.any(Object)
      }));
    });

    it('should throw AuthError on 401', async () => {
      const mockAPI = mockGitHubAPI();
      mockAPI
        .get('/rate_limit')
        .reply(401, mockErrorResponse(401, 'Bad credentials'));

      await expect(client.testAuth()).rejects.toThrow(AuthError);
    });

    it('should propagate other errors', async () => {
      const mockAPI = mockGitHubAPI();
      mockAPI
        .get('/rate_limit')
        .reply(500, mockErrorResponse(500, 'Internal server error'));

      await expect(client.testAuth()).rejects.toThrow(UsersError);
    });
  });

  describe('getRateLimit', () => {
    it('should return rate limit information', async () => {
      const mockAPI = mockGitHubAPI();
      mockAPI
        .get('/rate_limit')
        .reply(200, mockRateLimitData);

      const result = await client.getRateLimit();
      expect(result).toEqual(expect.objectContaining({
        resources: expect.objectContaining({
          core: expect.any(Object),
          search: expect.any(Object)
        })
      }));
    });
  });

  describe('updateConfig', () => {
    it('should update client configuration', () => {
      const newOptions = {
        timeout: 15000,
        baseUrl: 'https://api.github.com/v4'
      };

      client.updateConfig(newOptions);
      
      expect(client.options.timeout).toBe(15000);
      expect(client.options.baseUrl).toBe('https://api.github.com/v4');
      expect(client.options.token).toBe('test-token-123'); // Should preserve existing
    });

    it('should update http client configuration', () => {
      const spy = jest.spyOn(client.http, 'updateConfig');
      
      const newOptions = { timeout: 20000 };
      client.updateConfig(newOptions);
      
      expect(spy).toHaveBeenCalledWith(expect.objectContaining(newOptions));
    });
  });

  describe('close', () => {
    it('should close http client', () => {
      const spy = jest.spyOn(client.http, 'close');
      
      client.close();
      
      expect(spy).toHaveBeenCalled();
    });

    it('should handle missing close method', () => {
      delete client.http.close;
      
      expect(() => client.close()).not.toThrow();
    });
  });
});