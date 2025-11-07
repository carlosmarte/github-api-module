/**
 * Error handling utilities
 * @module utils/errors
 */

/**
 * Base error class for API errors
 */
export class APIError extends Error {
  /**
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {Array} errors - Validation errors
   * @param {string} documentationUrl - URL to documentation
   */
  constructor(message, statusCode, errors = [], documentationUrl = null) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.errors = errors;
    this.documentationUrl = documentationUrl;
  }

  /**
   * Get formatted error message
   * @returns {string}
   */
  toString() {
    let msg = `${this.name}: ${this.message} (Status: ${this.statusCode})`;
    
    if (this.errors.length > 0) {
      msg += '\nValidation Errors:';
      for (const error of this.errors) {
        msg += `\n  - ${error.field}: ${error.code} - ${error.message}`;
      }
    }
    
    if (this.documentationUrl) {
      msg += `\nDocumentation: ${this.documentationUrl}`;
    }
    
    return msg;
  }
}

/**
 * Rate limit error
 */
export class RateLimitError extends APIError {
  /**
   * @param {string} message - Error message
   * @param {number} retryAfter - Milliseconds until rate limit resets
   * @param {number} resetTime - Unix timestamp when rate limit resets
   */
  constructor(message, retryAfter, resetTime) {
    super(message, 403);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
    this.resetTime = resetTime;
  }

  /**
   * Get seconds until rate limit resets
   * @returns {number}
   */
  getSecondsUntilReset() {
    return Math.max(0, Math.ceil(this.retryAfter / 1000));
  }

  /**
   * Get formatted time until reset
   * @returns {string}
   */
  getTimeUntilReset() {
    const seconds = this.getSecondsUntilReset();
    
    if (seconds < 60) {
      return `${seconds} second${seconds !== 1 ? 's' : ''}`;
    }
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours} hour${hours !== 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`;
  }
}

/**
 * Authentication error
 */
export class AuthenticationError extends APIError {
  constructor(message = 'Authentication required') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

/**
 * Not found error
 */
export class NotFoundError extends APIError {
  constructor(message = 'Resource not found') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

/**
 * Validation error
 */
export class ValidationError extends APIError {
  constructor(message, errors = []) {
    super(message, 422, errors);
    this.name = 'ValidationError';
  }
}

/**
 * Configuration error
 */
export class ConfigurationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

/**
 * Check if error is retryable
 * @param {Error} error
 * @returns {boolean}
 */
export function isRetryableError(error) {
  if (error instanceof RateLimitError) {
    return true;
  }
  
  if (error instanceof APIError) {
    // Retry on server errors
    return error.statusCode >= 500;
  }
  
  // Retry on network errors
  return error.code === 'ECONNRESET' || 
         error.code === 'ETIMEDOUT' ||
         error.code === 'ECONNREFUSED';
}

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise}
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} baseDelay - Base delay in milliseconds
 * @returns {Promise}
 */
export async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  let lastError;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry if not retryable
      if (!isRetryableError(error)) {
        throw error;
      }
      
      // Don't retry if we've exhausted retries
      if (i === maxRetries) {
        throw error;
      }
      
      // Calculate delay with exponential backoff
      let delay = baseDelay * Math.pow(2, i);
      
      // If rate limited, wait until reset
      if (error instanceof RateLimitError) {
        delay = Math.max(delay, error.retryAfter);
      }
      
      console.error(`Request failed, retrying in ${delay}ms... (Attempt ${i + 1}/${maxRetries})`);
      await sleep(delay);
    }
  }
  
  throw lastError;
}