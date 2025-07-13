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
    test('creates error with message and default values', () => {
      const error = new ApiError('Test error');
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ApiError);
      expect(error.name).toBe('ApiError');
      expect(error.message).toBe('Test error');
      expect(error.status).toBe(0);
      expect(error.data).toBeNull();
    });
    
    test('creates error with custom status and data', () => {
      const data = { details: 'some details' };
      const error = new ApiError('Custom error', 500, data);
      
      expect(error.message).toBe('Custom error');
      expect(error.status).toBe(500);
      expect(error.data).toEqual(data);
    });
    
    test('inherits from Error properly', () => {
      const error = new ApiError('Test');
      expect(error.stack).toBeDefined();
      expect(error.toString()).toBe('ApiError: Test');
    });
  });
  
  describe('AuthError', () => {
    test('creates authentication error with 401 status', () => {
      const error = new AuthError('Invalid token');
      
      expect(error).toBeInstanceOf(ApiError);
      expect(error).toBeInstanceOf(AuthError);
      expect(error.name).toBe('AuthError');
      expect(error.message).toBe('Invalid token');
      expect(error.status).toBe(401);
      expect(error.data).toBeNull();
    });
    
    test('creates auth error with custom data', () => {
      const data = { reason: 'expired' };
      const error = new AuthError('Token expired', data);
      
      expect(error.message).toBe('Token expired');
      expect(error.status).toBe(401);
      expect(error.data).toEqual(data);
    });
    
    test('maintains inheritance chain', () => {
      const error = new AuthError('Auth failed');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ApiError);
      expect(error).toBeInstanceOf(AuthError);
    });
  });
  
  describe('ValidationError', () => {
    test('creates validation error with 422 status', () => {
      const error = new ValidationError('Validation failed');
      
      expect(error).toBeInstanceOf(ApiError);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.name).toBe('ValidationError');
      expect(error.message).toBe('Validation failed');
      expect(error.status).toBe(422);
      expect(error.errors).toEqual([]);
      expect(error.data).toBeNull();
    });
    
    test('creates validation error with error details', () => {
      const errors = [
        { field: 'title', message: 'Title is required' },
        { field: 'base', message: 'Invalid base branch' }
      ];
      const error = new ValidationError('Validation failed', errors);
      
      expect(error.errors).toEqual(errors);
    });
    
    test('getErrorMessages formats error messages correctly', () => {
      const errors = [
        { field: 'title', message: 'Title is required' },
        { field: 'base', message: 'Invalid base branch' },
        'Simple string error',
        { message: 'Error without field' },
        { unknown: 'format' }
      ];
      
      const error = new ValidationError('Validation failed', errors);
      const messages = error.getErrorMessages();
      
      expect(messages).toEqual([
        'title: Title is required',
        'base: Invalid base branch',
        'Simple string error',
        'Error without field',
        '{"unknown":"format"}'
      ]);
    });
    
    test('getErrorMessages returns main message when no errors array', () => {
      const error = new ValidationError('Main validation message');
      const messages = error.getErrorMessages();
      
      expect(messages).toEqual(['Main validation message']);
    });
    
    test('getErrorMessages handles null errors array', () => {
      const error = new ValidationError('Validation failed', null);
      const messages = error.getErrorMessages();
      
      expect(messages).toEqual(['Validation failed']);
    });
    
    test('handles complex error objects', () => {
      const errors = [
        { field: 'body', code: 'missing_field', message: 'Body is required' },
        { resource: 'PullRequest', code: 'custom', message: 'Custom error' }
      ];
      
      const error = new ValidationError('Complex validation', errors);
      const messages = error.getErrorMessages();
      
      expect(messages).toEqual([
        'body: Body is required',
        'Custom error'
      ]);
    });
  });
  
  describe('RateLimitError', () => {
    test('creates rate limit error with 403 status', () => {
      const error = new RateLimitError('Rate limit exceeded');
      
      expect(error).toBeInstanceOf(ApiError);
      expect(error).toBeInstanceOf(RateLimitError);
      expect(error.name).toBe('RateLimitError');
      expect(error.message).toBe('Rate limit exceeded');
      expect(error.status).toBe(403);
      expect(error.resetTime).toBeNull();
      expect(error.data).toBeNull();
    });
    
    test('creates rate limit error with reset time', () => {
      const resetTime = Math.floor(Date.now() / 1000) + 3600;
      const error = new RateLimitError('Rate limit exceeded', resetTime);
      
      expect(error.resetTime).toBe(resetTime);
    });
    
    test('getTimeUntilReset calculates time correctly', () => {
      const now = Date.now();
      const resetTime = Math.floor(now / 1000) + 120; // 2 minutes from now
      const error = new RateLimitError('Rate limit exceeded', resetTime);
      
      const timeUntilReset = error.getTimeUntilReset();
      
      expect(timeUntilReset).toBeGreaterThanOrEqual(119);
      expect(timeUntilReset).toBeLessThanOrEqual(121);
    });
    
    test('getTimeUntilReset returns 0 for past reset time', () => {
      const pastTime = Math.floor(Date.now() / 1000) - 60; // 1 minute ago
      const error = new RateLimitError('Rate limit exceeded', pastTime);
      
      const timeUntilReset = error.getTimeUntilReset();
      
      expect(timeUntilReset).toBe(0);
    });
    
    test('getTimeUntilReset returns 0 when no reset time', () => {
      const error = new RateLimitError('Rate limit exceeded');
      
      const timeUntilReset = error.getTimeUntilReset();
      
      expect(timeUntilReset).toBe(0);
    });
    
    test('handles large reset times correctly', () => {
      const resetTime = Math.floor(Date.now() / 1000) + 86400; // 24 hours from now
      const error = new RateLimitError('Rate limit exceeded', resetTime);
      
      const timeUntilReset = error.getTimeUntilReset();
      
      expect(timeUntilReset).toBeGreaterThan(86390);
      expect(timeUntilReset).toBeLessThan(86410);
    });
  });
  
  describe('NotFoundError', () => {
    test('creates not found error with 404 status', () => {
      const error = new NotFoundError('Resource not found');
      
      expect(error).toBeInstanceOf(ApiError);
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.name).toBe('NotFoundError');
      expect(error.message).toBe('Resource not found');
      expect(error.status).toBe(404);
      expect(error.data).toBeNull();
    });
    
    test('creates not found error with custom data', () => {
      const data = { resource: 'pull_request', id: 123 };
      const error = new NotFoundError('Pull request not found', data);
      
      expect(error.data).toEqual(data);
    });
  });
  
  describe('PermissionError', () => {
    test('creates permission error with 403 status', () => {
      const error = new PermissionError('Access denied');
      
      expect(error).toBeInstanceOf(ApiError);
      expect(error).toBeInstanceOf(PermissionError);
      expect(error.name).toBe('PermissionError');
      expect(error.message).toBe('Access denied');
      expect(error.status).toBe(403);
      expect(error.data).toBeNull();
    });
    
    test('distinguishes from RateLimitError', () => {
      const permError = new PermissionError('No access');
      const rateError = new RateLimitError('Rate limited');
      
      expect(permError).not.toBeInstanceOf(RateLimitError);
      expect(rateError).not.toBeInstanceOf(PermissionError);
      expect(permError.status).toBe(rateError.status); // Both 403
    });
  });
  
  describe('ConflictError', () => {
    test('creates conflict error with 409 status', () => {
      const error = new ConflictError('Merge conflict');
      
      expect(error).toBeInstanceOf(ApiError);
      expect(error).toBeInstanceOf(ConflictError);
      expect(error.name).toBe('ConflictError');
      expect(error.message).toBe('Merge conflict');
      expect(error.status).toBe(409);
      expect(error.data).toBeNull();
    });
    
    test('creates conflict error with details', () => {
      const data = { conflictType: 'merge', files: ['README.md'] };
      const error = new ConflictError('Cannot merge', data);
      
      expect(error.data).toEqual(data);
    });
  });
});

describe('handleApiError Function', () => {
  let mockResponse;
  
  beforeEach(() => {
    mockResponse = {
      status: 200,
      statusText: 'OK',
      headers: new Map(),
      json: jest.fn()
    };
  });
  
  test('throws AuthError for 401 status', async () => {
    mockResponse.status = 401;
    mockResponse.json.mockResolvedValue({ message: 'Bad credentials' });
    
    await expect(handleApiError(mockResponse))
      .rejects.toThrow(AuthError);
    
    try {
      await handleApiError(mockResponse);
    } catch (error) {
      expect(error.message).toBe('Bad credentials');
      expect(error.status).toBe(401);
    }
  });
  
  test('throws RateLimitError for 403 with rate limit headers', async () => {
    mockResponse.status = 403;
    mockResponse.headers.get = jest.fn((header) => {
      if (header === 'x-ratelimit-remaining') return '0';
      if (header === 'x-ratelimit-reset') return '1234567890';
      return null;
    });
    mockResponse.json.mockResolvedValue({ message: 'API rate limit exceeded' });
    
    await expect(handleApiError(mockResponse))
      .rejects.toThrow(RateLimitError);
    
    try {
      await handleApiError(mockResponse);
    } catch (error) {
      expect(error).toBeInstanceOf(RateLimitError);
      expect(error.resetTime).toBe(1234567890);
    }
  });
  
  test('throws PermissionError for 403 without rate limit', async () => {
    mockResponse.status = 403;
    mockResponse.headers.get = jest.fn(() => null);
    mockResponse.json.mockResolvedValue({ message: 'Permission denied' });
    
    await expect(handleApiError(mockResponse))
      .rejects.toThrow(PermissionError);
    
    try {
      await handleApiError(mockResponse);
    } catch (error) {
      expect(error.message).toBe('Permission denied');
      expect(error).not.toBeInstanceOf(RateLimitError);
    }
  });
  
  test('throws NotFoundError for 404 status', async () => {
    mockResponse.status = 404;
    mockResponse.json.mockResolvedValue({ message: 'Not found' });
    
    await expect(handleApiError(mockResponse))
      .rejects.toThrow(NotFoundError);
  });
  
  test('throws ConflictError for 409 status', async () => {
    mockResponse.status = 409;
    mockResponse.json.mockResolvedValue({ message: 'Merge conflict' });
    
    await expect(handleApiError(mockResponse))
      .rejects.toThrow(ConflictError);
  });
  
  test('throws ValidationError for 422 status with errors', async () => {
    mockResponse.status = 422;
    const errors = [
      { field: 'title', code: 'missing', message: 'Title required' }
    ];
    mockResponse.json.mockResolvedValue({ 
      message: 'Validation failed',
      errors 
    });
    
    await expect(handleApiError(mockResponse))
      .rejects.toThrow(ValidationError);
    
    try {
      await handleApiError(mockResponse);
    } catch (error) {
      expect(error.errors).toEqual(errors);
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
      expect(error).toBeInstanceOf(ApiError);
      expect(error).not.toBeInstanceOf(AuthError);
      expect(error).not.toBeInstanceOf(ValidationError);
      expect(error.status).toBe(500);
    }
  });
  
  test('uses provided error data when available', async () => {
    mockResponse.status = 400;
    const errorData = { message: 'Custom error', details: 'Some details' };
    
    await expect(handleApiError(mockResponse, errorData))
      .rejects.toThrow(ApiError);
    
    try {
      await handleApiError(mockResponse, errorData);
    } catch (error) {
      expect(error.message).toBe('Custom error');
      expect(error.data).toEqual(errorData);
    }
  });
  
  test('handles json parse failures gracefully', async () => {
    mockResponse.status = 500;
    mockResponse.statusText = 'Internal Server Error';
    mockResponse.json.mockRejectedValue(new Error('Invalid JSON'));
    
    await expect(handleApiError(mockResponse))
      .rejects.toThrow(ApiError);
    
    try {
      await handleApiError(mockResponse);
    } catch (error) {
      expect(error.message).toBe('Internal Server Error');
    }
  });
  
  test('handles missing message in error data', async () => {
    mockResponse.status = 400;
    mockResponse.statusText = 'Bad Request';
    mockResponse.json.mockResolvedValue({});
    
    await expect(handleApiError(mockResponse))
      .rejects.toThrow(ApiError);
    
    try {
      await handleApiError(mockResponse);
    } catch (error) {
      expect(error.message).toBe('Bad Request');
    }
  });
  
  test('handles completely missing error info', async () => {
    mockResponse.status = 400;
    mockResponse.statusText = '';
    mockResponse.json.mockResolvedValue(null);
    
    await expect(handleApiError(mockResponse))
      .rejects.toThrow(ApiError);
    
    try {
      await handleApiError(mockResponse);
    } catch (error) {
      expect(error.message).toBe('API request failed');
    }
  });
  
  test('correctly parses rate limit reset as integer', async () => {
    mockResponse.status = 403;
    mockResponse.headers.get = jest.fn((header) => {
      if (header === 'x-ratelimit-remaining') return '0';
      if (header === 'x-ratelimit-reset') return '1234567890.5'; // Float value
      return null;
    });
    mockResponse.json.mockResolvedValue({ message: 'API rate limit exceeded' });
    
    try {
      await handleApiError(mockResponse);
    } catch (error) {
      expect(error).toBeInstanceOf(RateLimitError);
      expect(error.resetTime).toBe(1234567890); // Should be parsed as integer
    }
  });
});

describe('formatError Function', () => {
  test('formats ValidationError with multiple errors', () => {
    const errors = [
      { field: 'title', message: 'Title is required' },
      'Base branch invalid',
      { message: 'Description too long' }
    ];
    const error = new ValidationError('Validation failed', errors);
    
    const formatted = formatError(error);
    
    expect(formatted).toBe(
      'Validation failed:\n' +
      '  - title: Title is required\n' +
      '  - Base branch invalid\n' +
      '  - Description too long'
    );
  });
  
  test('formats ValidationError with single error', () => {
    const error = new ValidationError('Single validation error');
    
    const formatted = formatError(error);
    
    expect(formatted).toBe('Validation failed:\n  - Single validation error');
  });
  
  test('formats RateLimitError with reset time', () => {
    const futureTime = Math.floor(Date.now() / 1000) + 180; // 3 minutes from now
    const error = new RateLimitError('Rate limit exceeded', futureTime);
    
    const formatted = formatError(error);
    
    expect(formatted).toBe('Rate limit exceeded. Rate limit resets in 3 minute(s).');
  });
  
  test('formats RateLimitError without reset time', () => {
    const error = new RateLimitError('Rate limit exceeded');
    
    const formatted = formatError(error);
    
    expect(formatted).toBe('Rate limit exceeded');
  });
  
  test('formats RateLimitError with past reset time', () => {
    const pastTime = Math.floor(Date.now() / 1000) - 60;
    const error = new RateLimitError('Rate limit exceeded', pastTime);
    
    const formatted = formatError(error);
    
    expect(formatted).toBe('Rate limit exceeded');
  });
  
  test('formats RateLimitError with hours until reset', () => {
    const futureTime = Math.floor(Date.now() / 1000) + 7200; // 2 hours from now
    const error = new RateLimitError('Rate limit exceeded', futureTime);
    
    const formatted = formatError(error);
    
    expect(formatted).toBe('Rate limit exceeded. Rate limit resets in 120 minute(s).');
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
  
  test('formats AuthError correctly', () => {
    const error = new AuthError('Invalid token');
    
    const formatted = formatError(error);
    
    expect(formatted).toBe('Invalid token (HTTP 401)');
  });
  
  test('formats NotFoundError correctly', () => {
    const error = new NotFoundError('Repository not found');
    
    const formatted = formatError(error);
    
    expect(formatted).toBe('Repository not found (HTTP 404)');
  });
  
  test('formats standard Error', () => {
    const error = new Error('Standard error message');
    
    const formatted = formatError(error);
    
    expect(formatted).toBe('Standard error message');
  });
  
  test('formats error without message', () => {
    const error = new Error();
    error.message = '';
    
    const formatted = formatError(error);
    
    expect(formatted).toBe('An unknown error occurred');
  });
  
  test('formats null/undefined as unknown error', () => {
    // formatError assumes an error object with at least a message property
    // For null/undefined, it would need to be handled differently in the actual implementation
    const nullError = { message: null };
    const undefinedError = { message: undefined };
    const emptyError = { message: '' };
    
    expect(formatError(nullError)).toBe('An unknown error occurred');
    expect(formatError(undefinedError)).toBe('An unknown error occurred');
    expect(formatError(emptyError)).toBe('An unknown error occurred');
  });
  
  test('formats complex validation errors correctly', () => {
    const errors = [
      { field: 'head', code: 'invalid', message: 'Invalid head branch' },
      { field: 'base', code: 'protected', message: 'Cannot modify protected branch' },
      { resource: 'PullRequest', field: 'state', message: 'Invalid state transition' }
    ];
    const error = new ValidationError('Multiple validation errors', errors);
    
    const formatted = formatError(error);
    
    expect(formatted).toBe(
      'Validation failed:\n' +
      '  - head: Invalid head branch\n' +
      '  - base: Cannot modify protected branch\n' +
      '  - state: Invalid state transition'
    );
  });
});

describe('Error Module Exports', () => {
  test('exports all error classes', async () => {
    const errors = await import('../../utils/errors.mjs');
    
    expect(errors.ApiError).toBeDefined();
    expect(errors.AuthError).toBeDefined();
    expect(errors.ValidationError).toBeDefined();
    expect(errors.RateLimitError).toBeDefined();
    expect(errors.NotFoundError).toBeDefined();
    expect(errors.PermissionError).toBeDefined();
    expect(errors.ConflictError).toBeDefined();
    expect(errors.handleApiError).toBeDefined();
    expect(errors.formatError).toBeDefined();
  });
  
  test('default export contains all exports', async () => {
    const { default: errors } = await import('../../utils/errors.mjs');
    
    expect(errors.ApiError).toBeDefined();
    expect(errors.AuthError).toBeDefined();
    expect(errors.ValidationError).toBeDefined();
    expect(errors.RateLimitError).toBeDefined();
    expect(errors.NotFoundError).toBeDefined();
    expect(errors.PermissionError).toBeDefined();
    expect(errors.ConflictError).toBeDefined();
    expect(errors.handleApiError).toBeDefined();
    expect(errors.formatError).toBeDefined();
  });
});

describe('Error Edge Cases', () => {
  test('handles circular references in error data', () => {
    const circular = { prop: 'value' };
    circular.self = circular;
    
    const error = new ApiError('Circular error', 500, circular);
    
    expect(error.data).toBe(circular);
    expect(() => JSON.stringify(error.data)).toThrow(); // Circular reference
  });
  
  test('handles very large error messages', () => {
    const longMessage = 'A'.repeat(10000);
    const error = new ApiError(longMessage);
    
    expect(error.message).toHaveLength(10000);
    expect(error.message).toBe(longMessage);
  });
  
  test('handles special characters in error messages', () => {
    const specialMessage = 'Error: <script>alert("XSS")</script> & "quotes"';
    const error = new ApiError(specialMessage);
    
    expect(error.message).toBe(specialMessage);
  });
  
  test('validates error inheritance chains', () => {
    const authError = new AuthError('Auth');
    const validationError = new ValidationError('Validation');
    const rateLimitError = new RateLimitError('Rate');
    const notFoundError = new NotFoundError('NotFound');
    const permissionError = new PermissionError('Permission');
    const conflictError = new ConflictError('Conflict');
    
    // All should inherit from ApiError
    expect(authError).toBeInstanceOf(ApiError);
    expect(validationError).toBeInstanceOf(ApiError);
    expect(rateLimitError).toBeInstanceOf(ApiError);
    expect(notFoundError).toBeInstanceOf(ApiError);
    expect(permissionError).toBeInstanceOf(ApiError);
    expect(conflictError).toBeInstanceOf(ApiError);
    
    // All should inherit from Error
    expect(authError).toBeInstanceOf(Error);
    expect(validationError).toBeInstanceOf(Error);
    expect(rateLimitError).toBeInstanceOf(Error);
    expect(notFoundError).toBeInstanceOf(Error);
    expect(permissionError).toBeInstanceOf(Error);
    expect(conflictError).toBeInstanceOf(Error);
  });
  
  test('handles malformed validation error arrays', () => {
    const errors = [
      null,
      undefined,
      123,
      true,
      { field: null, message: null },
      [],
      () => {}
    ];
    
    const error = new ValidationError('Malformed', errors);
    const messages = error.getErrorMessages();
    
    // The getErrorMessages function handles these differently:
    // - null and undefined become empty strings and are filtered out
    // - Numbers and booleans get stringified with String()
    // - Objects without messages get JSON.stringified
    expect(messages.some(m => m === 'null')).toBe(false); // null becomes empty and filtered out
    expect(messages.some(m => m === 'undefined')).toBe(false); // undefined becomes empty and filtered out
    expect(messages.some(m => m === '123')).toBe(true); // number gets converted to string
    expect(messages.some(m => m === 'true')).toBe(true); // boolean gets converted to string
    expect(messages.some(m => m.includes('[]'))).toBe(true); // array gets stringified
    expect(messages.some(m => m.includes('{'))).toBe(true); // objects get stringified
  });
});