import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import {
  ApiError,
  AuthError,
  ValidationError,
  RateLimitError,
  NotFoundError,
  PermissionError,
  ConflictError,
  handleApiError,
  formatError
} from '../../utils/errors.mjs';

describe('Error Classes', () => {
  describe('ApiError', () => {
    test('creates error with message only', () => {
      const error = new ApiError('Test error');
      
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('ApiError');
      expect(error.message).toBe('Test error');
      expect(error.status).toBe(0);
      expect(error.data).toBeNull();
    });

    test('creates error with message and status', () => {
      const error = new ApiError('Test error', 500);
      
      expect(error.message).toBe('Test error');
      expect(error.status).toBe(500);
      expect(error.data).toBeNull();
    });

    test('creates error with message, status, and data', () => {
      const data = { details: 'error details' };
      const error = new ApiError('Test error', 500, data);
      
      expect(error.message).toBe('Test error');
      expect(error.status).toBe(500);
      expect(error.data).toEqual(data);
    });

    test('has correct prototype chain', () => {
      const error = new ApiError('Test');
      
      expect(error instanceof Error).toBe(true);
      expect(error instanceof ApiError).toBe(true);
    });
  });

  describe('AuthError', () => {
    test('creates auth error with default status', () => {
      const error = new AuthError('Authentication failed');
      
      expect(error).toBeInstanceOf(ApiError);
      expect(error.name).toBe('AuthError');
      expect(error.message).toBe('Authentication failed');
      expect(error.status).toBe(401);
      expect(error.data).toBeNull();
    });

    test('creates auth error with data', () => {
      const data = { code: 'invalid_token' };
      const error = new AuthError('Bad credentials', data);
      
      expect(error.message).toBe('Bad credentials');
      expect(error.status).toBe(401);
      expect(error.data).toEqual(data);
    });

    test('maintains inheritance chain', () => {
      const error = new AuthError('Test');
      
      expect(error instanceof Error).toBe(true);
      expect(error instanceof ApiError).toBe(true);
      expect(error instanceof AuthError).toBe(true);
    });
  });

  describe('ValidationError', () => {
    test('creates validation error with default values', () => {
      const error = new ValidationError('Validation failed');
      
      expect(error).toBeInstanceOf(ApiError);
      expect(error.name).toBe('ValidationError');
      expect(error.message).toBe('Validation failed');
      expect(error.status).toBe(422);
      expect(error.errors).toEqual([]);
      expect(error.data).toBeNull();
    });

    test('creates validation error with errors array', () => {
      const errors = [
        { field: 'title', message: 'is required' },
        { field: 'body', message: 'is too long' }
      ];
      const error = new ValidationError('Validation failed', errors);
      
      expect(error.errors).toEqual(errors);
    });

    test('creates validation error with errors and data', () => {
      const errors = [{ field: 'title', message: 'is required' }];
      const data = { documentation_url: 'https://docs.github.com' };
      const error = new ValidationError('Validation failed', errors, data);
      
      expect(error.errors).toEqual(errors);
      expect(error.data).toEqual(data);
    });

    describe('getErrorMessages', () => {
      test('returns message when no errors array', () => {
        const error = new ValidationError('Validation failed');
        const messages = error.getErrorMessages();
        
        expect(messages).toEqual(['Validation failed']);
      });

      test('returns message when errors is not an array', () => {
        const error = new ValidationError('Validation failed', null);
        const messages = error.getErrorMessages();
        
        expect(messages).toEqual(['Validation failed']);
      });

      test('formats string errors', () => {
        const errors = ['Error 1', 'Error 2'];
        const error = new ValidationError('Validation failed', errors);
        const messages = error.getErrorMessages();
        
        expect(messages).toEqual(['Error 1', 'Error 2']);
      });

      test('formats object errors with field and message', () => {
        const errors = [
          { field: 'title', message: 'is required' },
          { field: 'body', message: 'is too long' }
        ];
        const error = new ValidationError('Validation failed', errors);
        const messages = error.getErrorMessages();
        
        expect(messages).toEqual([
          'title: is required',
          'body: is too long'
        ]);
      });

      test('formats object errors with message only', () => {
        const errors = [
          { message: 'Field is invalid' },
          { message: 'Another error' }
        ];
        const error = new ValidationError('Validation failed', errors);
        const messages = error.getErrorMessages();
        
        expect(messages).toEqual([
          'Field is invalid',
          'Another error'
        ]);
      });

      test('formats complex object errors as JSON', () => {
        const errors = [
          { code: 'invalid', resource: 'Issue' },
          { type: 'error', details: { field: 'title' } }
        ];
        const error = new ValidationError('Validation failed', errors);
        const messages = error.getErrorMessages();
        
        expect(messages).toEqual([
          '{"code":"invalid","resource":"Issue"}',
          '{"type":"error","details":{"field":"title"}}'
        ]);
      });

      test('handles mixed error types', () => {
        const errors = [
          'Simple string error',
          { field: 'title', message: 'is required' },
          { message: 'No field error' },
          { code: 'complex', data: { value: 123 } }
        ];
        const error = new ValidationError('Validation failed', errors);
        const messages = error.getErrorMessages();
        
        expect(messages).toEqual([
          'Simple string error',
          'title: is required',
          'No field error',
          '{"code":"complex","data":{"value":123}}'
        ]);
      });
    });
  });

  describe('RateLimitError', () => {
    test('creates rate limit error with default values', () => {
      const error = new RateLimitError('Rate limit exceeded');
      
      expect(error).toBeInstanceOf(ApiError);
      expect(error.name).toBe('RateLimitError');
      expect(error.message).toBe('Rate limit exceeded');
      expect(error.status).toBe(403);
      expect(error.resetTime).toBeNull();
      expect(error.data).toBeNull();
    });

    test('creates rate limit error with reset time', () => {
      const resetTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const error = new RateLimitError('Rate limit exceeded', resetTime);
      
      expect(error.resetTime).toBe(resetTime);
    });

    test('creates rate limit error with reset time and data', () => {
      const resetTime = Math.floor(Date.now() / 1000) + 3600;
      const data = { limit: 60, remaining: 0 };
      const error = new RateLimitError('Rate limit exceeded', resetTime, data);
      
      expect(error.resetTime).toBe(resetTime);
      expect(error.data).toEqual(data);
    });

    describe('getTimeUntilReset', () => {
      test('returns 0 when no reset time', () => {
        const error = new RateLimitError('Rate limit exceeded');
        const timeUntilReset = error.getTimeUntilReset();
        
        expect(timeUntilReset).toBe(0);
      });

      test('returns time until reset in seconds', () => {
        const resetTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
        const error = new RateLimitError('Rate limit exceeded', resetTime);
        const timeUntilReset = error.getTimeUntilReset();
        
        expect(timeUntilReset).toBeGreaterThan(3500);
        expect(timeUntilReset).toBeLessThanOrEqual(3600);
      });

      test('returns 0 when reset time is in the past', () => {
        const resetTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
        const error = new RateLimitError('Rate limit exceeded', resetTime);
        const timeUntilReset = error.getTimeUntilReset();
        
        expect(timeUntilReset).toBe(0);
      });

      test('rounds up to nearest second', () => {
        const resetTime = Math.floor(Date.now() / 1000) + 1; // 1 second from now
        const error = new RateLimitError('Rate limit exceeded', resetTime);
        const timeUntilReset = error.getTimeUntilReset();
        
        expect(timeUntilReset).toBe(1);
      });
    });
  });

  describe('NotFoundError', () => {
    test('creates not found error', () => {
      const error = new NotFoundError('Resource not found');
      
      expect(error).toBeInstanceOf(ApiError);
      expect(error.name).toBe('NotFoundError');
      expect(error.message).toBe('Resource not found');
      expect(error.status).toBe(404);
    });

    test('creates not found error with data', () => {
      const data = { resource: 'pull request' };
      const error = new NotFoundError('Resource not found', data);
      
      expect(error.data).toEqual(data);
    });
  });

  describe('PermissionError', () => {
    test('creates permission error', () => {
      const error = new PermissionError('Insufficient permissions');
      
      expect(error).toBeInstanceOf(ApiError);
      expect(error.name).toBe('PermissionError');
      expect(error.message).toBe('Insufficient permissions');
      expect(error.status).toBe(403);
    });
  });

  describe('ConflictError', () => {
    test('creates conflict error', () => {
      const error = new ConflictError('Resource conflict');
      
      expect(error).toBeInstanceOf(ApiError);
      expect(error.name).toBe('ConflictError');
      expect(error.message).toBe('Resource conflict');
      expect(error.status).toBe(409);
    });
  });
});

describe('Error Handling Functions', () => {
  describe('handleApiError', () => {
    let mockResponse;

    beforeEach(() => {
      mockResponse = {
        status: 500,
        statusText: 'Internal Server Error',
        headers: new Map(),
        json: jest.fn()
      };
    });

    test('throws AuthError for 401 status', async () => {
      mockResponse.status = 401;
      mockResponse.json.mockResolvedValue({ message: 'Bad credentials' });
      
      await expect(handleApiError(mockResponse))
        .rejects.toThrow(AuthError);
      
      await expect(handleApiError(mockResponse))
        .rejects.toThrow('Bad credentials');
    });

    test('throws RateLimitError for 403 with rate limit headers', async () => {
      mockResponse.status = 403;
      mockResponse.headers.set('x-ratelimit-remaining', '0');
      mockResponse.headers.set('x-ratelimit-reset', '1640995200');
      mockResponse.json.mockResolvedValue({ message: 'Rate limit exceeded' });
      
      await expect(handleApiError(mockResponse))
        .rejects.toThrow(RateLimitError);
      
      try {
        await handleApiError(mockResponse);
      } catch (error) {
        expect(error.resetTime).toBe(1640995200);
      }
    });

    test('throws PermissionError for 403 without rate limit', async () => {
      mockResponse.status = 403;
      mockResponse.json.mockResolvedValue({ message: 'Insufficient permissions' });
      
      await expect(handleApiError(mockResponse))
        .rejects.toThrow(PermissionError);
    });

    test('throws NotFoundError for 404 status', async () => {
      mockResponse.status = 404;
      mockResponse.json.mockResolvedValue({ message: 'Not Found' });
      
      await expect(handleApiError(mockResponse))
        .rejects.toThrow(NotFoundError);
    });

    test('throws ConflictError for 409 status', async () => {
      mockResponse.status = 409;
      mockResponse.json.mockResolvedValue({ message: 'Conflict' });
      
      await expect(handleApiError(mockResponse))
        .rejects.toThrow(ConflictError);
    });

    test('throws ValidationError for 422 status', async () => {
      mockResponse.status = 422;
      mockResponse.json.mockResolvedValue({
        message: 'Validation failed',
        errors: [{ field: 'title', message: 'is required' }]
      });
      
      await expect(handleApiError(mockResponse))
        .rejects.toThrow(ValidationError);
      
      try {
        await handleApiError(mockResponse);
      } catch (error) {
        expect(error.errors).toEqual([{ field: 'title', message: 'is required' }]);
      }
    });

    test('throws generic ApiError for other status codes', async () => {
      mockResponse.status = 500;
      mockResponse.json.mockResolvedValue({ message: 'Internal server error' });
      
      await expect(handleApiError(mockResponse))
        .rejects.toThrow(ApiError);
      
      try {
        await handleApiError(mockResponse);
      } catch (error) {
        expect(error.status).toBe(500);
        expect(error.message).toBe('Internal server error');
      }
    });

    test('uses statusText when no message in response', async () => {
      mockResponse.json.mockResolvedValue({});
      
      await expect(handleApiError(mockResponse))
        .rejects.toThrow('Internal Server Error');
    });

    test('uses fallback message when no message or statusText', async () => {
      mockResponse.statusText = '';
      mockResponse.json.mockResolvedValue({});
      
      await expect(handleApiError(mockResponse))
        .rejects.toThrow('API request failed');
    });

    test('handles JSON parsing errors', async () => {
      mockResponse.json.mockRejectedValue(new Error('Invalid JSON'));
      
      await expect(handleApiError(mockResponse))
        .rejects.toThrow('Internal Server Error');
    });

    test('uses provided error data', async () => {
      const errorData = { code: 'custom_error', message: 'Custom error message' };
      
      try {
        await handleApiError(mockResponse, errorData);
      } catch (error) {
        expect(error.data).toEqual(errorData);
        expect(error.message).toBe('Custom error message');
      }
    });

    test('handles missing rate limit reset header', async () => {
      mockResponse.status = 403;
      mockResponse.headers.set('x-ratelimit-remaining', '0');
      // Missing x-ratelimit-reset header
      mockResponse.json.mockResolvedValue({ message: 'Rate limit exceeded' });
      
      try {
        await handleApiError(mockResponse);
      } catch (error) {
        expect(error).toBeInstanceOf(RateLimitError);
        expect(error.resetTime).toBeNull();
      }
    });

    test('parses rate limit reset header as integer', async () => {
      mockResponse.status = 403;
      mockResponse.headers.set('x-ratelimit-remaining', '0');
      mockResponse.headers.set('x-ratelimit-reset', '1640995200');
      mockResponse.json.mockResolvedValue({ message: 'Rate limit exceeded' });
      
      try {
        await handleApiError(mockResponse);
      } catch (error) {
        expect(error.resetTime).toBe(1640995200);
        expect(typeof error.resetTime).toBe('number');
      }
    });
  });

  describe('formatError', () => {
    test('formats ValidationError with multiple messages', () => {
      const errors = [
        { field: 'title', message: 'is required' },
        { field: 'body', message: 'is too long' }
      ];
      const error = new ValidationError('Validation failed', errors);
      
      const formatted = formatError(error);
      
      expect(formatted).toBe('Validation failed:\n  - title: is required\n  - body: is too long');
    });

    test('formats ValidationError with single message', () => {
      const error = new ValidationError('Validation failed');
      
      const formatted = formatError(error);
      
      expect(formatted).toBe('Validation failed:\n  - Validation failed');
    });

    test('formats RateLimitError with reset time', () => {
      const resetTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const error = new RateLimitError('Rate limit exceeded', resetTime);
      
      const formatted = formatError(error);
      
      expect(formatted).toBe('Rate limit exceeded. Rate limit resets in 60 minute(s).');
    });

    test('formats RateLimitError without reset time', () => {
      const error = new RateLimitError('Rate limit exceeded');
      
      const formatted = formatError(error);
      
      expect(formatted).toBe('Rate limit exceeded');
    });

    test('formats RateLimitError with past reset time', () => {
      const resetTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const error = new RateLimitError('Rate limit exceeded', resetTime);
      
      const formatted = formatError(error);
      
      expect(formatted).toBe('Rate limit exceeded');
    });

    test('formats ApiError with status code', () => {
      const error = new ApiError('Server error', 500);
      
      const formatted = formatError(error);
      
      expect(formatted).toBe('Server error (HTTP 500)');
    });

    test('formats ApiError without status code', () => {
      const error = new ApiError('Network error');
      
      const formatted = formatError(error);
      
      expect(formatted).toBe('Network error');
    });

    test('formats generic Error', () => {
      const error = new Error('Something went wrong');
      
      const formatted = formatError(error);
      
      expect(formatted).toBe('Something went wrong');
    });

    test('handles error without message', () => {
      const error = new Error();
      error.message = '';
      
      const formatted = formatError(error);
      
      expect(formatted).toBe('An unknown error occurred');
    });

    test('handles null error', () => {
      const error = null;
      
      const formatted = formatError(error);
      
      expect(formatted).toBe('An unknown error occurred');
    });

    test('calculates reset time in minutes correctly', () => {
      const resetTime = Math.floor(Date.now() / 1000) + 150; // 2.5 minutes from now
      const error = new RateLimitError('Rate limit exceeded', resetTime);
      
      const formatted = formatError(error);
      
      expect(formatted).toBe('Rate limit exceeded. Rate limit resets in 3 minute(s).');
    });
  });
});

describe('Error Module Default Export', () => {
  test('exports all error classes and functions', async () => {
    const errorModule = await import('../../utils/errors.mjs');
    const defaultExport = errorModule.default;
    
    expect(defaultExport.ApiError).toBe(ApiError);
    expect(defaultExport.AuthError).toBe(AuthError);
    expect(defaultExport.ValidationError).toBe(ValidationError);
    expect(defaultExport.RateLimitError).toBe(RateLimitError);
    expect(defaultExport.NotFoundError).toBe(NotFoundError);
    expect(defaultExport.PermissionError).toBe(PermissionError);
    expect(defaultExport.ConflictError).toBe(ConflictError);
    expect(defaultExport.handleApiError).toBe(handleApiError);
    expect(defaultExport.formatError).toBe(formatError);
  });
});