/**
 * @fileoverview Custom error classes for GitHub Users API
 * @module errors
 */

/**
 * Base error class for GitHub Users API
 */
export class UsersError extends Error {
  /**
   * Create a new UsersError
   * @param {string} message - Error message
   * @param {number} [status] - HTTP status code
   * @param {Object} [response] - API response data
   */
  constructor(message, status = null, response = null) {
    super(message);
    this.name = 'UsersError';
    this.status = status;
    this.response = response;
    
    // Maintain proper stack trace (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, UsersError);
    }
  }

  /**
   * Convert error to JSON representation
   * @returns {Object} JSON representation of error
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      response: this.response
    };
  }
}

/**
 * Authentication-related error
 */
export class AuthError extends UsersError {
  constructor(message, status = null, response = null) {
    super(message, status, response);
    this.name = 'AuthError';
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AuthError);
    }
  }
}

/**
 * Validation-related error
 */
export class ValidationError extends UsersError {
  constructor(message, status = null, response = null) {
    super(message, status, response);
    this.name = 'ValidationError';
    this.errors = response?.errors || [];
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError);
    }
  }

  /**
   * Get validation errors
   * @returns {Array} Array of validation error details
   */
  getValidationErrors() {
    return this.errors;
  }

  /**
   * Get errors for a specific field
   * @param {string} field - Field name
   * @returns {Array} Array of errors for the field
   */
  getFieldErrors(field) {
    return this.errors.filter(error => error.field === field);
  }
}

/**
 * Rate limit-related error
 */
export class RateLimitError extends UsersError {
  constructor(message, status = null, response = null) {
    super(message, status, response);
    this.name = 'RateLimitError';
    this.resetTime = response?.reset ? new Date(response.reset * 1000) : null;
    this.limit = response?.limit || null;
    this.remaining = response?.remaining || 0;
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, RateLimitError);
    }
  }

  /**
   * Get time until rate limit resets
   * @returns {number} Milliseconds until reset
   */
  getTimeUntilReset() {
    if (!this.resetTime) {
      return 0;
    }
    return Math.max(0, this.resetTime.getTime() - Date.now());
  }

  /**
   * Get human-readable time until reset
   * @returns {string} Human-readable time
   */
  getTimeUntilResetString() {
    const ms = this.getTimeUntilReset();
    if (ms === 0) {
      return 'now';
    }
    
    const minutes = Math.ceil(ms / 60000);
    if (minutes < 60) {
      return `${minutes} minute${minutes === 1 ? '' : 's'}`;
    }
    
    const hours = Math.ceil(minutes / 60);
    return `${hours} hour${hours === 1 ? '' : 's'}`;
  }
}

/**
 * Network-related error
 */
export class NetworkError extends UsersError {
  constructor(message, originalError = null) {
    super(message);
    this.name = 'NetworkError';
    this.originalError = originalError;
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NetworkError);
    }
  }
}

/**
 * Resource not found error
 */
export class NotFoundError extends UsersError {
  constructor(message, status = 404, response = null) {
    super(message, status, response);
    this.name = 'NotFoundError';
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NotFoundError);
    }
  }
}

/**
 * Permission denied error
 */
export class ForbiddenError extends UsersError {
  constructor(message, status = 403, response = null) {
    super(message, status, response);
    this.name = 'ForbiddenError';
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ForbiddenError);
    }
  }
}

/**
 * Create appropriate error from GitHub API response
 * @param {Response} response - HTTP response
 * @param {Object} data - Response data
 * @returns {UsersError} Appropriate error instance
 */
export function createErrorFromResponse(response, data) {
  const message = data.message || `HTTP ${response.status}: ${response.statusText}`;
  const status = response.status;
  
  switch (status) {
    case 401:
      return new AuthError(message, status, data);
    case 403:
      if (message.toLowerCase().includes('rate limit')) {
        return new RateLimitError(message, status, data);
      }
      return new ForbiddenError(message, status, data);
    case 404:
      return new NotFoundError(message, status, data);
    case 422:
      return new ValidationError(message, status, data);
    default:
      return new UsersError(message, status, data);
  }
}

/**
 * Check if error is retryable
 * @param {Error} error - Error to check
 * @returns {boolean} True if error is retryable
 */
export function isRetryableError(error) {
  if (error instanceof NetworkError) {
    return true;
  }
  
  if (error instanceof UsersError && error.status) {
    // Retry on 5xx server errors and some 4xx errors
    return error.status >= 500 || error.status === 408 || error.status === 429;
  }
  
  return false;
}

/**
 * Get retry delay for error
 * @param {Error} error - Error to get delay for
 * @param {number} attempt - Current attempt number
 * @returns {number} Delay in milliseconds
 */
export function getRetryDelay(error, attempt = 1) {
  if (error instanceof RateLimitError) {
    return error.getTimeUntilReset();
  }
  
  // Exponential backoff with jitter
  const baseDelay = Math.min(1000 * Math.pow(2, attempt - 1), 30000);
  const jitter = Math.random() * 1000;
  return baseDelay + jitter;
}