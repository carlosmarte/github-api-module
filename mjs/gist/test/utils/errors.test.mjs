import { jest } from '@jest/globals';
import {
  GistAPIError,
  AuthenticationError,
  RateLimitError,
  ValidationError,
  NotFoundError,
  ForbiddenError,
  handleAPIError
} from '../../lib/utils/errors.mjs';

describe('Error Classes', () => {
  describe('GistAPIError', () => {
    it('should create error with message, status code, and response', () => {
      const error = new GistAPIError('Test error', 500, { data: 'test' });
      
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('GistAPIError');
      expect(error.statusCode).toBe(500);
      expect(error.response).toEqual({ data: 'test' });
      expect(error instanceof Error).toBe(true);
    });
  });

  describe('AuthenticationError', () => {
    it('should create authentication error with default message', () => {
      const error = new AuthenticationError();
      
      expect(error.message).toBe('Authentication required');
      expect(error.name).toBe('AuthenticationError');
      expect(error.statusCode).toBe(401);
      expect(error instanceof GistAPIError).toBe(true);
    });

    it('should create authentication error with custom message', () => {
      const error = new AuthenticationError('Invalid token');
      expect(error.message).toBe('Invalid token');
    });
  });

  describe('RateLimitError', () => {
    it('should create rate limit error with reset information', () => {
      const resetTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const error = new RateLimitError(resetTime, 5000, 0);
      
      expect(error.name).toBe('RateLimitError');
      expect(error.statusCode).toBe(429);
      expect(error.resetTime).toBe(resetTime);
      expect(error.limit).toBe(5000);
      expect(error.remaining).toBe(0);
      expect(error.message).toContain('Rate limit exceeded');
      expect(error.message).toContain(new Date(resetTime * 1000).toISOString());
    });
  });

  describe('ValidationError', () => {
    it('should create validation error with message', () => {
      const error = new ValidationError('Validation failed');
      
      expect(error.message).toBe('Validation failed');
      expect(error.name).toBe('ValidationError');
      expect(error.statusCode).toBe(422);
      expect(error.errors).toEqual([]);
    });

    it('should create validation error with errors array', () => {
      const errors = [
        { field: 'name', code: 'missing' },
        { field: 'description', code: 'invalid' }
      ];
      const error = new ValidationError('Validation failed', errors);
      
      expect(error.errors).toEqual(errors);
    });
  });

  describe('NotFoundError', () => {
    it('should create not found error with default message', () => {
      const error = new NotFoundError();
      
      expect(error.message).toBe('Resource not found');
      expect(error.name).toBe('NotFoundError');
      expect(error.statusCode).toBe(404);
    });

    it('should create not found error with custom resource', () => {
      const error = new NotFoundError('Gist');
      expect(error.message).toBe('Gist not found');
    });
  });

  describe('ForbiddenError', () => {
    it('should create forbidden error with default message', () => {
      const error = new ForbiddenError();
      
      expect(error.message).toBe('Access forbidden');
      expect(error.name).toBe('ForbiddenError');
      expect(error.statusCode).toBe(403);
    });

    it('should create forbidden error with custom message', () => {
      const error = new ForbiddenError('Insufficient permissions');
      expect(error.message).toBe('Insufficient permissions');
    });
  });
});

describe('handleAPIError', () => {
  it('should throw AuthenticationError for 401 status', () => {
    const response = {
      status: 401,
      statusText: 'Unauthorized',
      headers: new Map()
    };
    const responseBody = { message: 'Bad credentials' };

    expect(() => handleAPIError(response, responseBody))
      .toThrow(AuthenticationError);
    
    try {
      handleAPIError(response, responseBody);
    } catch (error) {
      expect(error.message).toBe('Bad credentials');
    }
  });

  it('should throw RateLimitError for 403 with rate limit headers', () => {
    const resetTime = Math.floor(Date.now() / 1000) + 3600;
    const response = {
      status: 403,
      headers: new Map([
        ['x-ratelimit-remaining', '0'],
        ['x-ratelimit-reset', resetTime.toString()],
        ['x-ratelimit-limit', '5000']
      ])
    };

    expect(() => handleAPIError(response, {}))
      .toThrow(RateLimitError);
    
    try {
      handleAPIError(response, {});
    } catch (error) {
      expect(error.resetTime).toBe(resetTime);
      expect(error.limit).toBe(5000);
      expect(error.remaining).toBe(0);
    }
  });

  it('should throw ForbiddenError for 403 without rate limit', () => {
    const response = {
      status: 403,
      headers: new Map([
        ['x-ratelimit-remaining', '100']
      ])
    };
    const responseBody = { message: 'Forbidden' };

    expect(() => handleAPIError(response, responseBody))
      .toThrow(ForbiddenError);
    
    try {
      handleAPIError(response, responseBody);
    } catch (error) {
      expect(error.message).toBe('Forbidden');
    }
  });

  it('should throw NotFoundError for 404 status', () => {
    const response = {
      status: 404,
      headers: new Map()
    };
    const responseBody = { message: 'Gist not found' };

    expect(() => handleAPIError(response, responseBody))
      .toThrow(NotFoundError);
    
    try {
      handleAPIError(response, responseBody);
    } catch (error) {
      expect(error.message).toBe('Gist not found not found');
    }
  });

  it('should throw ValidationError for 422 status', () => {
    const response = {
      status: 422,
      headers: new Map()
    };
    const responseBody = {
      message: 'Validation failed',
      errors: [{ field: 'description', code: 'missing' }]
    };

    expect(() => handleAPIError(response, responseBody))
      .toThrow(ValidationError);
    
    try {
      handleAPIError(response, responseBody);
    } catch (error) {
      expect(error.message).toBe('Validation failed');
      expect(error.errors).toEqual([{ field: 'description', code: 'missing' }]);
    }
  });

  it('should throw GistAPIError for other status codes', () => {
    const response = {
      status: 500,
      statusText: 'Internal Server Error',
      headers: new Map()
    };
    const responseBody = { message: 'Server error' };

    expect(() => handleAPIError(response, responseBody))
      .toThrow(GistAPIError);
    
    try {
      handleAPIError(response, responseBody);
    } catch (error) {
      expect(error.message).toBe('Server error');
      expect(error.statusCode).toBe(500);
      expect(error.response).toEqual(responseBody);
    }
  });

  it('should use statusText when no message in response body', () => {
    const response = {
      status: 500,
      statusText: 'Internal Server Error',
      headers: new Map()
    };

    try {
      handleAPIError(response, null);
    } catch (error) {
      expect(error.message).toBe('Internal Server Error');
    }
  });
});