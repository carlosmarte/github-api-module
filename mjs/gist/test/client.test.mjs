import { jest } from '@jest/globals';
import { GistClient } from '../lib/client.mjs';
import './setup.mjs';

describe('GistClient', () => {
  let client;

  beforeEach(() => {
    client = new GistClient({ token: 'test-token' });
  });

  describe('constructor', () => {
    it('should initialize with default values', () => {
      const defaultClient = new GistClient();
      expect(defaultClient.baseURL).toBe('https://api.github.com');
      expect(defaultClient.timeout).toBe(30000);
      expect(defaultClient.retryAttempts).toBe(3);
      expect(defaultClient.retryDelay).toBe(1000);
    });

    it('should accept custom options', () => {
      const customClient = new GistClient({
        baseURL: 'https://custom.api.com',
        timeout: 5000,
        retryAttempts: 5,
        retryDelay: 2000
      });
      expect(customClient.baseURL).toBe('https://custom.api.com');
      expect(customClient.timeout).toBe(5000);
      expect(customClient.retryAttempts).toBe(5);
      expect(customClient.retryDelay).toBe(2000);
    });
  });

  describe('buildURL', () => {
    it('should return base URL when no params provided', () => {
      const url = client.buildURL('https://api.github.com/gists');
      expect(url).toBe('https://api.github.com/gists');
    });

    it('should append query parameters', () => {
      const url = client.buildURL('https://api.github.com/gists', {
        per_page: 10,
        page: 2
      });
      expect(url).toBe('https://api.github.com/gists?per_page=10&page=2');
    });

    it('should ignore null and undefined values', () => {
      const url = client.buildURL('https://api.github.com/gists', {
        per_page: 10,
        page: null,
        since: undefined
      });
      expect(url).toBe('https://api.github.com/gists?per_page=10');
    });
  });

  describe('request', () => {
    it('should make a GET request successfully', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Map([
          ['content-type', 'application/json'],
          ['link', '<https://api.github.com/gists?page=2>; rel="next"']
        ]),
        json: jest.fn().mockResolvedValue({ id: '123', description: 'Test gist' })
      };
      global.fetch.mockResolvedValue(mockResponse);

      const result = await client.request('/gists/123');
      
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.github.com/gists/123',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token'
          })
        })
      );
      expect(result.data).toEqual({ id: '123', description: 'Test gist' });
      expect(result.status).toBe(200);
    });

    it('should make a POST request with body', async () => {
      const mockResponse = {
        ok: true,
        status: 201,
        headers: new Map([['content-type', 'application/json']]),
        json: jest.fn().mockResolvedValue({ id: 'new-gist' })
      };
      global.fetch.mockResolvedValue(mockResponse);

      const body = {
        description: 'New gist',
        files: { 'test.js': { content: 'console.log("test");' } }
      };

      const result = await client.request('/gists', {
        method: 'POST',
        body
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.github.com/gists',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(body),
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
      expect(result.data).toEqual({ id: 'new-gist' });
    });

    it('should handle 204 No Content response', async () => {
      const mockResponse = {
        ok: true,
        status: 204,
        headers: new Map()
      };
      global.fetch.mockResolvedValue(mockResponse);

      const result = await client.request('/gists/123/star', {
        method: 'PUT'
      });

      expect(result.data).toBeNull();
      expect(result.status).toBe(204);
    });

    it('should retry on network errors', async () => {
      const mockError = new Error('Network error');
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: jest.fn().mockResolvedValue({ success: true })
      };

      global.fetch
        .mockRejectedValueOnce(mockError)
        .mockRejectedValueOnce(mockError)
        .mockResolvedValueOnce(mockResponse);

      client.retryDelay = 10; // Short delay for testing
      const result = await client.request('/gists');

      expect(global.fetch).toHaveBeenCalledTimes(3);
      expect(result.data).toEqual({ success: true });
    });

    it('should not retry on 4xx errors', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        headers: new Map([['content-type', 'application/json']]),
        json: jest.fn().mockResolvedValue({ message: 'Not Found' })
      };
      global.fetch.mockResolvedValue(mockResponse);

      await expect(client.request('/gists/invalid')).rejects.toThrow();
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should handle text responses', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'text/plain']]),
        text: jest.fn().mockResolvedValue('Plain text response')
      };
      global.fetch.mockResolvedValue(mockResponse);

      const result = await client.request('/raw/123');
      expect(result.data).toBe('Plain text response');
    });

    it('should add custom media type', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/vnd.github.raw']]),
        text: jest.fn().mockResolvedValue('raw content')
      };
      global.fetch.mockResolvedValue(mockResponse);

      await client.request('/gists/123', {
        mediaType: 'application/vnd.github.raw'
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Accept': 'application/vnd.github.raw'
          })
        })
      );
    });
  });

  describe('convenience methods', () => {
    beforeEach(() => {
      jest.spyOn(client, 'request').mockResolvedValue({ data: {} });
    });

    it('should call request with GET method', async () => {
      await client.get('/gists');
      expect(client.request).toHaveBeenCalledWith('/gists', { method: 'GET' });
    });

    it('should call request with POST method and body', async () => {
      const body = { description: 'test' };
      await client.post('/gists', body);
      expect(client.request).toHaveBeenCalledWith('/gists', { method: 'POST', body });
    });

    it('should call request with PATCH method and body', async () => {
      const body = { description: 'updated' };
      await client.patch('/gists/123', body);
      expect(client.request).toHaveBeenCalledWith('/gists/123', { method: 'PATCH', body });
    });

    it('should call request with PUT method and body', async () => {
      await client.put('/gists/123/star', {});
      expect(client.request).toHaveBeenCalledWith('/gists/123/star', { method: 'PUT', body: {} });
    });

    it('should call request with DELETE method', async () => {
      await client.delete('/gists/123');
      expect(client.request).toHaveBeenCalledWith('/gists/123', { method: 'DELETE' });
    });
  });

  describe('delay', () => {
    it('should delay for specified time', async () => {
      const start = Date.now();
      await client.delay(100);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(90); // Allow small variance
    });
  });
});