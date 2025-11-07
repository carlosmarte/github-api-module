import { jest } from '@jest/globals';
import { AuthManager } from '../../lib/utils/auth.mjs';

describe('AuthManager', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.GITHUB_TOKEN;
    delete process.env.GH_TOKEN;
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('constructor', () => {
    it('should initialize with provided token', () => {
      const auth = new AuthManager({ token: 'provided-token' });
      expect(auth.token).toBe('provided-token');
    });

    it('should initialize with default base URL', () => {
      const auth = new AuthManager();
      expect(auth.baseURL).toBe('https://api.github.com');
    });

    it('should initialize with custom base URL', () => {
      const auth = new AuthManager({ baseURL: 'https://custom.api.com' });
      expect(auth.baseURL).toBe('https://custom.api.com');
    });
  });

  describe('loadToken', () => {
    it('should load token from GITHUB_TOKEN env variable', () => {
      process.env.GITHUB_TOKEN = 'github-env-token';
      const auth = new AuthManager();
      expect(auth.token).toBe('github-env-token');
    });

    it('should load token from GH_TOKEN env variable', () => {
      process.env.GH_TOKEN = 'gh-env-token';
      const auth = new AuthManager();
      expect(auth.token).toBe('gh-env-token');
    });

    it('should prefer GITHUB_TOKEN over GH_TOKEN', () => {
      process.env.GITHUB_TOKEN = 'github-token';
      process.env.GH_TOKEN = 'gh-token';
      const auth = new AuthManager();
      expect(auth.token).toBe('github-token');
    });
  });

  describe('getHeaders', () => {
    it('should return headers with authentication when token is set', () => {
      const auth = new AuthManager({ token: 'test-token' });
      const headers = auth.getHeaders();

      expect(headers).toEqual({
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Authorization': 'Bearer test-token'
      });
    });

    it('should return headers without authentication when no token', () => {
      const auth = new AuthManager();
      const headers = auth.getHeaders();

      expect(headers).toEqual({
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      });
      expect(headers.Authorization).toBeUndefined();
    });

    it('should merge additional headers', () => {
      const auth = new AuthManager({ token: 'test-token' });
      const headers = auth.getHeaders({
        'Content-Type': 'application/json',
        'Custom-Header': 'value'
      });

      expect(headers).toEqual({
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json',
        'Custom-Header': 'value'
      });
    });

    it('should allow overriding default headers', () => {
      const auth = new AuthManager();
      const headers = auth.getHeaders({
        'Accept': 'application/vnd.github.raw'
      });

      expect(headers['Accept']).toBe('application/vnd.github.raw');
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when token is set', () => {
      const auth = new AuthManager({ token: 'test-token' });
      expect(auth.isAuthenticated()).toBe(true);
    });

    it('should return false when no token', () => {
      const auth = new AuthManager();
      expect(auth.isAuthenticated()).toBe(false);
    });

    it('should return true when token loaded from env', () => {
      process.env.GITHUB_TOKEN = 'env-token';
      const auth = new AuthManager();
      expect(auth.isAuthenticated()).toBe(true);
    });
  });

  describe('requireAuth', () => {
    it('should not throw when authenticated', () => {
      const auth = new AuthManager({ token: 'test-token' });
      expect(() => auth.requireAuth()).not.toThrow();
    });

    it('should throw error when not authenticated', () => {
      const auth = new AuthManager();
      expect(() => auth.requireAuth()).toThrow(
        'Authentication required. Set GITHUB_TOKEN environment variable or use --token flag.'
      );
    });
  });
});