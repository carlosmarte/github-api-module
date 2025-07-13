/**
 * Custom error classes for GitHub Issues API
 */

/**
 * Base API Error
 */
export class ApiError extends Error {
  constructor(message, statusCode = 0, details = null) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Authentication Error
 */
export class AuthError extends ApiError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
    this.name = 'AuthError';
  }
}

/**
 * Validation Error
 */
export class ValidationError extends ApiError {
  constructor(message, errors = [], details = null) {
    super(message, 422, details);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

/**
 * Rate Limit Error
 */
export class RateLimitError extends ApiError {
  constructor(message = 'Rate limit exceeded', resetTime = null) {
    super(message, 429);
    this.name = 'RateLimitError';
    this.resetTime = resetTime;
    if (resetTime) {
      this.resetDate = new Date(resetTime * 1000);
      this.minutesUntilReset = Math.ceil((this.resetDate - new Date()) / 60000);
    }
  }
}

/**
 * Not Found Error
 */
export class NotFoundError extends ApiError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404);
    this.name = 'NotFoundError';
  }
}

/**
 * Permission Error
 */
export class PermissionError extends ApiError {
  constructor(message = 'Permission denied') {
    super(message, 403);
    this.name = 'PermissionError';
  }
}

/**
 * Conflict Error
 */
export class ConflictError extends ApiError {
  constructor(message = 'Resource conflict') {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

/**
 * Network Error
 */
export class NetworkError extends ApiError {
  constructor(message = 'Network error occurred') {
    super(message, 0);
    this.name = 'NetworkError';
  }
}