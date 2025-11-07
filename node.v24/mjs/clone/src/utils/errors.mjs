/**
 * @fileoverview Custom error classes for Git operations
 * @module errors
 */

/**
 * Base error class for all Git-related errors
 */
export class GitError extends Error {
  /**
   * Create a GitError
   * @param {string} message - Error message
   * @param {Error} [originalError] - Original error that caused this error
   * @param {Object} [context] - Additional context information
   */
  constructor(message, originalError, context = {}) {
    super(message);
    this.name = 'GitError';
    this.originalError = originalError;
    this.context = context;
    this.timestamp = new Date().toISOString();

    // Maintain proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, GitError);
    }
  }

  /**
   * Convert error to JSON representation
   * @returns {Object} JSON representation of the error
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      stack: this.stack,
      timestamp: this.timestamp,
      context: this.context,
      originalError: this.originalError ? {
        name: this.originalError.name,
        message: this.originalError.message,
        stack: this.originalError.stack
      } : null
    };
  }
}

/**
 * Error thrown when authentication fails
 */
export class AuthError extends GitError {
  /**
   * Create an AuthError
   * @param {string} message - Error message
   * @param {Error} [originalError] - Original error
   * @param {Object} [context] - Additional context
   */
  constructor(message, originalError, context = {}) {
    super(message, originalError, context);
    this.name = 'AuthError';
  }
}

/**
 * Error thrown when validation fails
 */
export class ValidationError extends GitError {
  /**
   * Create a ValidationError
   * @param {string} message - Error message
   * @param {Object} [validationDetails] - Details about what failed validation
   * @param {Object} [context] - Additional context
   */
  constructor(message, validationDetails = {}, context = {}) {
    super(message, null, context);
    this.name = 'ValidationError';
    this.validationDetails = validationDetails;
  }

  /**
   * Convert error to JSON representation
   * @returns {Object} JSON representation of the error
   */
  toJSON() {
    return {
      ...super.toJSON(),
      validationDetails: this.validationDetails
    };
  }
}

/**
 * Error thrown when a repository operation fails
 */
export class RepositoryError extends GitError {
  /**
   * Create a RepositoryError
   * @param {string} message - Error message
   * @param {string} [repoName] - Repository name
   * @param {string} [operation] - Operation that failed
   * @param {Error} [originalError] - Original error
   * @param {Object} [context] - Additional context
   */
  constructor(message, repoName, operation, originalError, context = {}) {
    super(message, originalError, context);
    this.name = 'RepositoryError';
    this.repoName = repoName;
    this.operation = operation;
  }

  /**
   * Convert error to JSON representation
   * @returns {Object} JSON representation of the error
   */
  toJSON() {
    return {
      ...super.toJSON(),
      repoName: this.repoName,
      operation: this.operation
    };
  }
}

/**
 * Error thrown when a clone operation fails
 */
export class CloneError extends RepositoryError {
  /**
   * Create a CloneError
   * @param {string} message - Error message
   * @param {string} [repoUrl] - Repository URL
   * @param {string} [targetDir] - Target directory
   * @param {Error} [originalError] - Original error
   * @param {Object} [context] - Additional context
   */
  constructor(message, repoUrl, targetDir, originalError, context = {}) {
    super(message, targetDir, 'clone', originalError, context);
    this.name = 'CloneError';
    this.repoUrl = repoUrl;
    this.targetDir = targetDir;
  }

  /**
   * Convert error to JSON representation
   * @returns {Object} JSON representation of the error
   */
  toJSON() {
    return {
      ...super.toJSON(),
      repoUrl: this.repoUrl,
      targetDir: this.targetDir
    };
  }
}

/**
 * Error thrown when network operations fail
 */
export class NetworkError extends GitError {
  /**
   * Create a NetworkError
   * @param {string} message - Error message
   * @param {string} [url] - URL that failed
   * @param {number} [statusCode] - HTTP status code if applicable
   * @param {Error} [originalError] - Original error
   * @param {Object} [context] - Additional context
   */
  constructor(message, url, statusCode, originalError, context = {}) {
    super(message, originalError, context);
    this.name = 'NetworkError';
    this.url = url;
    this.statusCode = statusCode;
  }

  /**
   * Convert error to JSON representation
   * @returns {Object} JSON representation of the error
   */
  toJSON() {
    return {
      ...super.toJSON(),
      url: this.url,
      statusCode: this.statusCode
    };
  }
}

/**
 * Error thrown when file system operations fail
 */
export class FileSystemError extends GitError {
  /**
   * Create a FileSystemError
   * @param {string} message - Error message
   * @param {string} [path] - File system path
   * @param {string} [operation] - File operation that failed
   * @param {Error} [originalError] - Original error
   * @param {Object} [context] - Additional context
   */
  constructor(message, path, operation, originalError, context = {}) {
    super(message, originalError, context);
    this.name = 'FileSystemError';
    this.path = path;
    this.operation = operation;
  }

  /**
   * Convert error to JSON representation
   * @returns {Object} JSON representation of the error
   */
  toJSON() {
    return {
      ...super.toJSON(),
      path: this.path,
      operation: this.operation
    };
  }
}

/**
 * Error thrown when configuration is invalid
 */
export class ConfigError extends GitError {
  /**
   * Create a ConfigError
   * @param {string} message - Error message
   * @param {string} [configKey] - Configuration key that's invalid
   * @param {*} [configValue] - Configuration value that's invalid
   * @param {Object} [context] - Additional context
   */
  constructor(message, configKey, configValue, context = {}) {
    super(message, null, context);
    this.name = 'ConfigError';
    this.configKey = configKey;
    this.configValue = configValue;
  }

  /**
   * Convert error to JSON representation
   * @returns {Object} JSON representation of the error
   */
  toJSON() {
    return {
      ...super.toJSON(),
      configKey: this.configKey,
      configValue: this.configValue
    };
  }
}

/**
 * Utility function to handle and wrap errors
 * @param {Error} error - Original error
 * @param {string} operation - Operation that failed
 * @param {Object} [context] - Additional context
 * @returns {GitError} Wrapped error
 */
export function wrapError(error, operation, context = {}) {
  // If it's already a GitError, return it as-is
  if (error instanceof GitError) {
    return error;
  }

  // Map common error patterns to specific error types
  const message = error.message || 'Unknown error';
  
  // Authentication errors
  if (message.includes('Authentication failed') || 
      message.includes('Permission denied') ||
      message.includes('401') ||
      message.includes('403')) {
    return new AuthError(`${operation} failed: ${message}`, error, context);
  }

  // Network errors
  if (message.includes('ENOTFOUND') ||
      message.includes('ECONNREFUSED') ||
      message.includes('timeout') ||
      message.includes('network')) {
    return new NetworkError(`${operation} failed: ${message}`, context.url, null, error, context);
  }

  // File system errors
  if (message.includes('ENOENT') ||
      message.includes('EACCES') ||
      message.includes('EPERM') ||
      message.includes('file') ||
      message.includes('directory')) {
    return new FileSystemError(`${operation} failed: ${message}`, context.path, operation, error, context);
  }

  // Repository-specific errors
  if (message.includes('not a git repository') ||
      message.includes('repository') ||
      message.includes('clone') ||
      message.includes('push') ||
      message.includes('pull')) {
    return new RepositoryError(`${operation} failed: ${message}`, context.repoName, operation, error, context);
  }

  // Default to generic GitError
  return new GitError(`${operation} failed: ${message}`, error, context);
}

/**
 * Utility function to check if an error is of a specific type
 * @param {Error} error - Error to check
 * @param {Function} errorClass - Error class to check against
 * @returns {boolean} True if error is of the specified type
 */
export function isErrorType(error, errorClass) {
  return error instanceof errorClass;
}

/**
 * Extract useful information from an error for logging
 * @param {Error} error - Error to extract info from
 * @returns {Object} Error information suitable for logging
 */
export function getErrorInfo(error) {
  if (error instanceof GitError) {
    return error.toJSON();
  }

  return {
    name: error.name || 'Error',
    message: error.message || 'Unknown error',
    stack: error.stack,
    timestamp: new Date().toISOString()
  };
}