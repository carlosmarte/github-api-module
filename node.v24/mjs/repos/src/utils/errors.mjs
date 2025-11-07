/**
 * @fileoverview Custom error classes for GitHub Repository API
 * @module errors
 */

/**
 * Base error class for repository operations
 */
export class RepoError extends Error {
  constructor(message, statusCode = null, response = null) {
    super(message);
    this.name = 'RepoError';
    this.statusCode = statusCode;
    this.response = response;
    
    // Maintain proper stack trace (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, RepoError);
    }
  }
  
  /**
   * Create error from HTTP response
   */
  static fromResponse(response, body) {
    const message = body?.message || `HTTP ${response.status}: ${response.statusText}`;
    return new RepoError(message, response.status, response);
  }
}

/**
 * Authentication related errors
 */
export class AuthError extends RepoError {
  constructor(message, statusCode = 401, response = null) {
    super(message, statusCode, response);
    this.name = 'AuthError';
  }
}

/**
 * Input validation errors
 */
export class ValidationError extends RepoError {
  constructor(message, field = null, value = null) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.value = value;
  }
}

/**
 * Rate limiting errors
 */
export class RateLimitError extends RepoError {
  constructor(message, resetTime = null, remaining = null) {
    super(message, 429);
    this.name = 'RateLimitError';
    this.resetTime = resetTime;
    this.remaining = remaining;
  }
}

/**
 * Network/connectivity errors
 */
export class NetworkError extends RepoError {
  constructor(message, originalError = null) {
    super(message);
    this.name = 'NetworkError';
    this.originalError = originalError;
  }
}

/**
 * Resource not found errors
 */
export class NotFoundError extends RepoError {
  constructor(resource, identifier = null) {
    const message = identifier 
      ? `${resource} '${identifier}' not found`
      : `${resource} not found`;
    super(message, 404);
    this.name = 'NotFoundError';
    this.resource = resource;
    this.identifier = identifier;
  }
}

/**
 * Permission/access denied errors
 */
export class ForbiddenError extends RepoError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403);
    this.name = 'ForbiddenError';
  }
}

/**
 * Conflict errors (e.g., resource already exists)
 */
export class ConflictError extends RepoError {
  constructor(message, resource = null) {
    super(message, 409);
    this.name = 'ConflictError';
    this.resource = resource;
  }
}

/**
 * GitHub API specific errors
 */
export class GitHubAPIError extends RepoError {
  constructor(message, statusCode, response, errors = []) {
    super(message, statusCode, response);
    this.name = 'GitHubAPIError';
    this.errors = errors;
    this.documentation_url = response?.documentation_url;
  }
  
  /**
   * Create from GitHub API error response
   */
  static fromGitHubResponse(response, body) {
    const message = body?.message || `GitHub API error: ${response.status}`;
    const errors = body?.errors || [];
    
    return new GitHubAPIError(message, response.status, response, errors);
  }
  
  /**
   * Check if error is due to rate limiting
   */
  isRateLimit() {
    return this.statusCode === 429 || this.statusCode === 403 && 
           this.message.toLowerCase().includes('rate limit');
  }
  
  /**
   * Check if error is due to missing permissions
   */
  isForbidden() {
    return this.statusCode === 403;
  }
  
  /**
   * Check if error is due to resource not found
   */
  isNotFound() {
    return this.statusCode === 404;
  }
}

/**
 * Error factory to create appropriate error instances
 */
export class ErrorFactory {
  /**
   * Create error from HTTP response
   */
  static fromResponse(response, body = null) {
    const status = response.status;
    const message = body?.message || response.statusText || 'Unknown error';
    
    switch (status) {
      case 401:
        return new AuthError(message, status, response);
        
      case 403:
        if (message.toLowerCase().includes('rate limit')) {
          const resetTime = response.headers?.get('x-ratelimit-reset');
          const remaining = response.headers?.get('x-ratelimit-remaining');
          return new RateLimitError(message, resetTime, remaining);
        }
        return new ForbiddenError(message);
        
      case 404:
        return new NotFoundError('Resource', body?.resource);
        
      case 409:
        return new ConflictError(message, body?.resource);
        
      case 422:
        return new ValidationError(message);
        
      case 429:
        const resetTime = response.headers?.get('x-ratelimit-reset');
        const remaining = response.headers?.get('x-ratelimit-remaining');
        return new RateLimitError(message, resetTime, remaining);
        
      default:
        if (status >= 500) {
          return new RepoError(`Server error: ${message}`, status, response);
        }
        return new GitHubAPIError(message, status, response, body?.errors);
    }
  }
  
  /**
   * Create error from network failure
   */
  static fromNetworkError(originalError, url = null) {
    const message = url 
      ? `Network error accessing ${url}: ${originalError.message}`
      : `Network error: ${originalError.message}`;
    return new NetworkError(message, originalError);
  }
}

/**
 * Error handler utility functions
 */
export const errorUtils = {
  /**
   * Check if error is retryable
   */
  isRetryable(error) {
    if (error instanceof NetworkError) return true;
    if (error instanceof RateLimitError) return true;
    if (error instanceof RepoError && error.statusCode >= 500) return true;
    return false;
  },
  
  /**
   * Get retry delay from error (in milliseconds)
   */
  getRetryDelay(error, attempt = 1) {
    if (error instanceof RateLimitError && error.resetTime) {
      const resetTime = new Date(error.resetTime * 1000);
      const now = new Date();
      return Math.max(0, resetTime.getTime() - now.getTime());
    }
    
    // Exponential backoff for other retryable errors
    return Math.min(1000 * Math.pow(2, attempt - 1), 30000);
  },
  
  /**
   * Format error for console output
   */
  formatForConsole(error) {
    if (error instanceof ValidationError) {
      return `Validation Error: ${error.message}${error.field ? ` (field: ${error.field})` : ''}`;
    }
    
    if (error instanceof RateLimitError) {
      const resetTime = error.resetTime ? new Date(error.resetTime * 1000).toLocaleTimeString() : 'unknown';
      return `Rate Limit Exceeded: ${error.message} (resets at ${resetTime})`;
    }
    
    if (error instanceof GitHubAPIError && error.errors.length > 0) {
      const errorList = error.errors.map(e => `  - ${e.message || e.code}`).join('\n');
      return `${error.message}\nDetails:\n${errorList}`;
    }
    
    return `${error.name}: ${error.message}`;
  }
};