/**
 * Custom error classes for GitHub Reactions API
 * @module core/errors
 */

export class GitHubReactionsError extends Error {
  /**
   * @param {string} message - Error message
   * @param {string} [code='UNKNOWN_ERROR'] - Error code
   * @param {number} [statusCode=500] - HTTP status code
   * @param {*} [details] - Additional error details
   */
  constructor(message, code = 'UNKNOWN_ERROR', statusCode = 500, details = undefined) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
      stack: this.stack,
    };
  }
}

export class ValidationError extends GitHubReactionsError {
  constructor(message, details) {
    super(message, 'VALIDATION_ERROR', 400, details);
  }
}

export class AuthenticationError extends GitHubReactionsError {
  constructor(message = 'GitHub token is required') {
    super(message, 'AUTHENTICATION_ERROR', 401);
  }
}

export class NotFoundError extends GitHubReactionsError {
  constructor(resource, identifier) {
    super(
      `${resource} not found${identifier ? `: ${identifier}` : ''}`,
      'NOT_FOUND',
      404,
      { resource, identifier }
    );
  }
}

export class ForbiddenError extends GitHubReactionsError {
  constructor(message = 'Forbidden - insufficient permissions') {
    super(message, 'FORBIDDEN', 403);
  }
}

export class RateLimitError extends GitHubReactionsError {
  constructor(resetTime) {
    super(
      `Rate limit exceeded. Resets at ${new Date(resetTime * 1000)}`,
      'RATE_LIMIT_ERROR',
      429,
      { resetTime }
    );
  }
}

export class NetworkError extends GitHubReactionsError {
  constructor(message, details) {
    super(message, 'NETWORK_ERROR', 503, details);
  }
}

export class TimeoutError extends GitHubReactionsError {
  constructor(timeout) {
    super(`Request timeout after ${timeout}ms`, 'TIMEOUT_ERROR', 408, { timeout });
  }
}

export class ConfigurationError extends GitHubReactionsError {
  constructor(message, details) {
    super(message, 'CONFIGURATION_ERROR', 500, details);
  }
}

// Error handler utility
export class ErrorHandler {
  /**
   * Convert any error to a GitHubReactionsError
   * @param {*} error - The error to handle
   * @returns {GitHubReactionsError} Normalized error
   */
  static handle(error) {
    if (error instanceof GitHubReactionsError) {
      return error;
    }

    // Handle GitHub API errors
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          return new AuthenticationError(data?.message || 'Authentication required');
        case 403:
          return new ForbiddenError(data?.message || 'Forbidden');
        case 404:
          return new NotFoundError('Resource', data?.message || 'Not found');
        case 422:
          return new ValidationError(data?.message || 'Validation failed', data?.errors);
        case 429:
          return new RateLimitError(error.response.headers['x-ratelimit-reset']);
        default:
          return new GitHubReactionsError(
            data?.message || `HTTP ${status}`,
            'API_ERROR',
            status,
            data
          );
      }
    }

    // Handle network errors
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return new NetworkError(error.message, { code: error.code });
    }

    // Handle timeout errors
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return new TimeoutError(error.timeout || 30000);
    }

    if (error instanceof Error) {
      return new GitHubReactionsError(error.message, 'WRAPPED_ERROR', 500, {
        originalError: error.name,
        stack: error.stack,
      });
    }

    return new GitHubReactionsError(String(error), 'UNKNOWN_ERROR', 500);
  }

  /**
   * Check if an error is retryable
   * @param {GitHubReactionsError} error - The error to check
   * @returns {boolean} Whether the error is retryable
   */
  static isRetryable(error) {
    const retryableCodes = ['NETWORK_ERROR', 'TIMEOUT_ERROR', 'RATE_LIMIT_ERROR'];
    return retryableCodes.includes(error.code) || error.statusCode >= 500;
  }
}