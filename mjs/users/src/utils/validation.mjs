/**
 * @fileoverview Validation utilities for GitHub Users API
 * @module validation
 */

import { ValidationError } from './errors.mjs';

/**
 * Validate general input parameters
 * @param {*} value - Value to validate
 * @param {string} name - Parameter name
 * @param {Object} rules - Validation rules
 * @throws {ValidationError} If validation fails
 */
export function validateInput(value, name, rules = {}) {
  const errors = [];

  // Required check
  if (rules.required && (value === undefined || value === null || value === '')) {
    errors.push(`${name} is required`);
  }

  // If value is empty and not required, skip further validation
  if (!rules.required && (value === undefined || value === null || value === '')) {
    return;
  }

  // Type validation
  if (rules.type && typeof value !== rules.type) {
    errors.push(`${name} must be of type ${rules.type}`);
  }

  // String validations
  if (typeof value === 'string') {
    if (rules.minLength && value.length < rules.minLength) {
      errors.push(`${name} must be at least ${rules.minLength} characters long`);
    }
    
    if (rules.maxLength && value.length > rules.maxLength) {
      errors.push(`${name} must be at most ${rules.maxLength} characters long`);
    }
    
    if (rules.pattern && !rules.pattern.test(value)) {
      errors.push(`${name} has invalid format`);
    }
  }

  // Number validations
  if (typeof value === 'number') {
    if (rules.min !== undefined && value < rules.min) {
      errors.push(`${name} must be at least ${rules.min}`);
    }
    
    if (rules.max !== undefined && value > rules.max) {
      errors.push(`${name} must be at most ${rules.max}`);
    }
  }

  // Array validations
  if (Array.isArray(value)) {
    if (rules.minItems && value.length < rules.minItems) {
      errors.push(`${name} must contain at least ${rules.minItems} items`);
    }
    
    if (rules.maxItems && value.length > rules.maxItems) {
      errors.push(`${name} must contain at most ${rules.maxItems} items`);
    }
  }

  // Enum validation
  if (rules.enum && !rules.enum.includes(value)) {
    errors.push(`${name} must be one of: ${rules.enum.join(', ')}`);
  }

  if (errors.length > 0) {
    throw new ValidationError(`Validation failed for ${name}: ${errors.join(', ')}`);
  }
}

/**
 * Validate email address
 * @param {string} email - Email address to validate
 * @returns {boolean} True if email is valid
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }

  // Basic email regex - GitHub accepts most standard formats
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate GitHub username
 * @param {string} username - Username to validate
 * @returns {boolean} True if username is valid
 */
export function validateUsername(username) {
  if (!username || typeof username !== 'string') {
    return false;
  }

  // GitHub username rules:
  // - Max 39 characters
  // - Alphanumeric characters or single hyphens
  // - Cannot begin or end with a hyphen
  const usernameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/;
  return usernameRegex.test(username);
}

/**
 * Validate GitHub user ID
 * @param {number|string} userId - User ID to validate
 * @returns {boolean} True if user ID is valid
 */
export function validateUserId(userId) {
  const id = parseInt(userId);
  return Number.isInteger(id) && id > 0;
}

/**
 * Validate pagination parameters
 * @param {Object} params - Pagination parameters
 * @returns {Object} Validated parameters
 */
export function validatePagination(params = {}) {
  const validated = {};

  if (params.per_page !== undefined) {
    validateInput(params.per_page, 'per_page', {
      type: 'number',
      min: 1,
      max: 100
    });
    validated.per_page = params.per_page;
  }

  if (params.page !== undefined) {
    validateInput(params.page, 'page', {
      type: 'number',
      min: 1
    });
    validated.page = params.page;
  }

  if (params.since !== undefined) {
    validateInput(params.since, 'since', {
      type: 'number',
      min: 1
    });
    validated.since = params.since;
  }

  return validated;
}

/**
 * Validate user update data
 * @param {Object} userData - User data to validate
 * @returns {Object} Validated user data
 */
export function validateUserUpdate(userData = {}) {
  const validated = {};

  if (userData.name !== undefined) {
    validateInput(userData.name, 'name', {
      type: 'string',
      maxLength: 255
    });
    validated.name = userData.name;
  }

  if (userData.email !== undefined) {
    if (userData.email !== null && !validateEmail(userData.email)) {
      throw new ValidationError('Invalid email address format');
    }
    validated.email = userData.email;
  }

  if (userData.blog !== undefined) {
    validateInput(userData.blog, 'blog', {
      type: 'string',
      maxLength: 255
    });
    validated.blog = userData.blog;
  }

  if (userData.company !== undefined) {
    validateInput(userData.company, 'company', {
      type: 'string',
      maxLength: 255
    });
    validated.company = userData.company;
  }

  if (userData.location !== undefined) {
    validateInput(userData.location, 'location', {
      type: 'string',
      maxLength: 255
    });
    validated.location = userData.location;
  }

  if (userData.bio !== undefined) {
    validateInput(userData.bio, 'bio', {
      type: 'string',
      maxLength: 160
    });
    validated.bio = userData.bio;
  }

  if (userData.twitter_username !== undefined) {
    validateInput(userData.twitter_username, 'twitter_username', {
      type: 'string',
      maxLength: 15
    });
    validated.twitter_username = userData.twitter_username;
  }

  if (userData.hireable !== undefined) {
    validateInput(userData.hireable, 'hireable', {
      type: 'boolean'
    });
    validated.hireable = userData.hireable;
  }

  return validated;
}

/**
 * Validate email addresses for bulk operations
 * @param {Array<string>} emails - Array of email addresses
 * @returns {Array<string>} Validated email addresses
 */
export function validateEmails(emails) {
  if (!Array.isArray(emails)) {
    throw new ValidationError('Emails must be provided as an array');
  }

  if (emails.length === 0) {
    throw new ValidationError('At least one email address is required');
  }

  if (emails.length > 100) {
    throw new ValidationError('Cannot add more than 100 email addresses at once');
  }

  const validEmails = [];
  const errors = [];

  emails.forEach((email, index) => {
    if (!validateEmail(email)) {
      errors.push(`Invalid email at index ${index}: ${email}`);
    } else {
      validEmails.push(email);
    }
  });

  if (errors.length > 0) {
    throw new ValidationError(`Email validation failed: ${errors.join(', ')}`);
  }

  return validEmails;
}

/**
 * Validate sort parameters
 * @param {string} sort - Sort parameter
 * @param {Array<string>} allowedValues - Allowed sort values
 * @returns {string} Validated sort parameter
 */
export function validateSort(sort, allowedValues) {
  if (sort && !allowedValues.includes(sort)) {
    throw new ValidationError(`Invalid sort value. Must be one of: ${allowedValues.join(', ')}`);
  }
  return sort;
}

/**
 * Validate order parameter
 * @param {string} order - Order parameter
 * @returns {string} Validated order parameter
 */
export function validateOrder(order) {
  const allowedOrders = ['asc', 'desc'];
  if (order && !allowedOrders.includes(order)) {
    throw new ValidationError(`Invalid order value. Must be one of: ${allowedOrders.join(', ')}`);
  }
  return order;
}

/**
 * Sanitize user input to prevent XSS and other issues
 * @param {string} input - Input to sanitize
 * @returns {string} Sanitized input
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') {
    return input;
  }

  // Remove potential script tags and other dangerous content
  return input
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}