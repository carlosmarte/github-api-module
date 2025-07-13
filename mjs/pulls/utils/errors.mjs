/**
 * Custom error classes for GitHub Pull Request API
 */

/**
 * Base API Error
 */
export class ApiError extends Error {
  constructor(message, status = 0, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Authentication Error
 */
export class AuthError extends ApiError {
  constructor(message, data = null) {
    super(message, 401, data);
    this.name = 'AuthError';
  }
}

/**
 * Validation Error
 */
export class ValidationError extends ApiError {
  constructor(message, errors = [], data = null) {
    super(message, 422, data);
    this.name = 'ValidationError';
    this.errors = errors;
  }
  
  /**
   * Get formatted error messages
   * @returns {Array<string>} Error messages
   */
  getErrorMessages() {
    if (!this.errors || !Array.isArray(this.errors) || this.errors.length === 0) {
      return [this.message];
    }
    
    return this.errors.map(error => {
      if (typeof error === 'string') {
        return error;
      }
      
      // Handle null/undefined errors
      if (error === null || error === undefined) {
        return '';
      }
      
      // Handle object errors
      if (error && typeof error === 'object') {
        if (error.message) {
          if (error.field) {
            return `${error.field}: ${error.message}`;
          }
          return error.message;
        }
        return JSON.stringify(error);
      }
      
      // Handle other types (number, boolean, etc.)
      return String(error);
    }).filter(msg => msg !== ''); // Remove empty strings
  }
}

/**
 * Rate Limit Error
 */
export class RateLimitError extends ApiError {
  constructor(message, resetTime = null, data = null) {
    super(message, 403, data);
    this.name = 'RateLimitError';
    this.resetTime = resetTime;
  }
  
  /**
   * Get time until rate limit resets
   * @returns {number} Seconds until reset
   */
  getTimeUntilReset() {
    if (!this.resetTime) {
      return 0;
    }
    
    const resetDate = new Date(this.resetTime * 1000);
    const now = new Date();
    return Math.max(0, Math.ceil((resetDate - now) / 1000));
  }
}

/**
 * Not Found Error
 */
export class NotFoundError extends ApiError {
  constructor(message, data = null) {
    super(message, 404, data);
    this.name = 'NotFoundError';
  }
}

/**
 * Permission Error
 */
export class PermissionError extends ApiError {
  constructor(message, data = null) {
    super(message, 403, data);
    this.name = 'PermissionError';
  }
}

/**
 * Conflict Error
 */
export class ConflictError extends ApiError {
  constructor(message, data = null) {
    super(message, 409, data);
    this.name = 'ConflictError';
  }
}

/**
 * Handle API errors and throw appropriate error type
 * @param {Response} response - Fetch response
 * @param {Object} [errorData] - Error data from response
 * @throws {ApiError} Appropriate error type
 */
export async function handleApiError(response, errorData = null) {
  const data = errorData || await response.json().catch(() => null);
  const message = data?.message || response.statusText || 'API request failed';
  
  switch (response.status) {
    case 401:
      throw new AuthError(message, data);
      
    case 403:
      // Check if it's a rate limit error
      const rateLimitRemaining = response.headers.get('x-ratelimit-remaining');
      const rateLimitReset = response.headers.get('x-ratelimit-reset');
      
      if (rateLimitRemaining === '0') {
        throw new RateLimitError(
          'API rate limit exceeded',
          rateLimitReset ? parseInt(rateLimitReset, 10) : null,
          data
        );
      }
      throw new PermissionError(message, data);
      
    case 404:
      throw new NotFoundError(message, data);
      
    case 409:
      throw new ConflictError(message, data);
      
    case 422:
      throw new ValidationError(message, data?.errors || [], data);
      
    default:
      throw new ApiError(message, response.status, data);
  }
}

/**
 * Format error for CLI output
 * @param {Error} error - Error to format
 * @returns {string} Formatted error message
 */
export function formatError(error) {
  if (error instanceof ValidationError) {
    const messages = error.getErrorMessages();
    return `Validation failed:\n  - ${messages.join('\n  - ')}`;
  }
  
  if (error instanceof RateLimitError) {
    const timeUntilReset = error.getTimeUntilReset();
    if (timeUntilReset > 0) {
      const minutes = Math.ceil(timeUntilReset / 60);
      return `${error.message}. Rate limit resets in ${minutes} minute(s).`;
    }
    return error.message;
  }
  
  if (error instanceof ApiError) {
    if (error.status) {
      return `${error.message} (HTTP ${error.status})`;
    }
    return error.message;
  }
  
  return (error && error.message) || 'An unknown error occurred';
}

export default {
  ApiError,
  AuthError,
  ValidationError,
  RateLimitError,
  NotFoundError,
  PermissionError,
  ConflictError,
  handleApiError,
  formatError
};