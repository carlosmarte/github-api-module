import { jest } from '@jest/globals';
import './setup.mjs';

describe('GistAPI Main Module', () => {
  let GistAPI, gistAPI;
  
  beforeEach(async () => {
    jest.clearAllMocks();
    jest.resetModules();
    
    const module = await import('../index.mjs');
    GistAPI = module.default;
    gistAPI = module.gistAPI;
  });

  describe('GistAPI Class', () => {
    it('should create instance with default options', () => {
      const api = new GistAPI();
      
      expect(api).toHaveProperty('client');
      expect(api).toHaveProperty('gists');
      expect(api).toHaveProperty('comments');
      expect(api).toHaveProperty('commits');
      expect(api).toHaveProperty('forks');
      expect(api).toHaveProperty('stars');
    });

    it('should create instance with custom options', () => {
      const options = { 
        token: 'test-token',
        baseURL: 'https://custom.api.com',
        timeout: 5000
      };
      const api = new GistAPI(options);
      
      expect(api.client.auth.token).toBe('test-token');
      expect(api.client.baseURL).toBe('https://custom.api.com');
      expect(api.client.timeout).toBe(5000);
    });
  });

  describe('getRateLimit', () => {
    it('should fetch rate limit information', async () => {
      const mockRateLimit = {
        rate: { limit: 5000, remaining: 4999, reset: 1234567890 }
      };
      
      const api = new GistAPI();
      api.client.get = jest.fn().mockResolvedValue({ data: mockRateLimit });

      const result = await api.getRateLimit();

      expect(api.client.get).toHaveBeenCalledWith('/rate_limit');
      expect(result).toEqual(mockRateLimit);
    });
  });

  describe('getUser', () => {
    it('should fetch authenticated user information', async () => {
      const mockUser = {
        login: 'testuser',
        id: 12345,
        email: 'test@example.com'
      };

      const api = new GistAPI({ token: 'test-token' });
      api.client.auth.requireAuth = jest.fn();
      api.client.get = jest.fn().mockResolvedValue({ data: mockUser });

      const result = await api.getUser();

      expect(api.client.auth.requireAuth).toHaveBeenCalled();
      expect(api.client.get).toHaveBeenCalledWith('/user');
      expect(result).toEqual(mockUser);
    });
  });

  describe('withOptions', () => {
    it('should create new instance with merged options', () => {
      const api = new GistAPI({ token: 'original-token' });
      const newOptions = { timeout: 10000 };
      
      const newApi = api.withOptions(newOptions);

      expect(newApi).toBeInstanceOf(GistAPI);
      expect(newApi).not.toBe(api);
    });
  });

  describe('Pre-configured instance', () => {
    it('should export a pre-configured instance', () => {
      expect(gistAPI).toBeDefined();
      expect(gistAPI.constructor.name).toBe('GistAPI');
    });
  });
});