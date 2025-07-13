/**
 * @fileoverview Input validation utilities
 * @module validation
 */

import { ValidationError } from './errors.mjs';

/**
 * Validate repository name
 */
export function validateRepositoryName(name) {
  if (!name || typeof name !== 'string') {
    throw new ValidationError('Repository name must be a non-empty string', 'name', name);
  }
  
  if (name.length > 100) {
    throw new ValidationError('Repository name must be 100 characters or less', 'name', name);
  }
  
  if (!/^[a-zA-Z0-9._-]+$/.test(name)) {
    throw new ValidationError(
      'Repository name can only contain alphanumeric characters, periods, hyphens, and underscores',
      'name',
      name
    );
  }
  
  // Check for reserved names
  const reserved = ['_', '.', '..', 'CON', 'PRN', 'AUX', 'NUL', 'COM1', 'LPT1'];
  if (reserved.includes(name.toUpperCase())) {
    throw new ValidationError('Repository name is reserved', 'name', name);
  }
  
  return true;
}

/**
 * Validate username/organization name
 */
export function validateUsername(username) {
  if (!username || typeof username !== 'string') {
    throw new ValidationError('Username must be a non-empty string', 'username', username);
  }
  
  if (username.length > 39) {
    throw new ValidationError('Username must be 39 characters or less', 'username', username);
  }
  
  if (!/^[a-zA-Z0-9-]+$/.test(username)) {
    throw new ValidationError(
      'Username can only contain alphanumeric characters and hyphens',
      'username',
      username
    );
  }
  
  if (username.startsWith('-') || username.endsWith('-')) {
    throw new ValidationError('Username cannot start or end with a hyphen', 'username', username);
  }
  
  return true;
}

/**
 * Validate branch name
 */
export function validateBranchName(branchName) {
  if (!branchName || typeof branchName !== 'string') {
    throw new ValidationError('Branch name must be a non-empty string', 'branch', branchName);
  }
  
  if (branchName.length > 250) {
    throw new ValidationError('Branch name must be 250 characters or less', 'branch', branchName);
  }
  
  // Git branch naming rules
  const invalidPatterns = [
    /^\./,           // Cannot start with .
    /\.\./,          // Cannot contain ..
    /\/$/,           // Cannot end with /
    /^\//,           // Cannot start with /
    /\/\//,          // Cannot contain //
    /[@{~^:?*\[\]\\]/, // Cannot contain special characters
    /\s/,            // Cannot contain whitespace
    /\.lock$/,       // Cannot end with .lock
    /^@$/,           // Cannot be @
  ];
  
  for (const pattern of invalidPatterns) {
    if (pattern.test(branchName)) {
      throw new ValidationError('Invalid branch name format', 'branch', branchName);
    }
  }
  
  return true;
}

/**
 * Validate tag name
 */
export function validateTagName(tagName) {
  if (!tagName || typeof tagName !== 'string') {
    throw new ValidationError('Tag name must be a non-empty string', 'tag', tagName);
  }
  
  if (tagName.length > 250) {
    throw new ValidationError('Tag name must be 250 characters or less', 'tag', tagName);
  }
  
  // Similar to branch name validation but slightly different rules
  const invalidPatterns = [
    /^\./,           // Cannot start with .
    /\.\./,          // Cannot contain ..
    /\/$/,           // Cannot end with /
    /^\//,           // Cannot start with /
    /\/\//,          // Cannot contain //
    /[@{~^:?*\[\]\\]/, // Cannot contain special characters
    /\s/,            // Cannot contain whitespace
    /\.lock$/,       // Cannot end with .lock
  ];
  
  for (const pattern of invalidPatterns) {
    if (pattern.test(tagName)) {
      throw new ValidationError('Invalid tag name format', 'tag', tagName);
    }
  }
  
  return true;
}

/**
 * Validate repository data for creation/update
 */
export function validateRepository(data) {
  const errors = [];
  
  // Required fields
  if (!data.name) {
    errors.push(new ValidationError('Repository name is required', 'name'));
  } else {
    try {
      validateRepositoryName(data.name);
    } catch (error) {
      errors.push(error);
    }
  }
  
  // Optional fields validation
  if (data.description && typeof data.description !== 'string') {
    errors.push(new ValidationError('Description must be a string', 'description', data.description));
  }
  
  if (data.description && data.description.length > 350) {
    errors.push(new ValidationError('Description must be 350 characters or less', 'description'));
  }
  
  if (data.homepage && typeof data.homepage !== 'string') {
    errors.push(new ValidationError('Homepage must be a string', 'homepage', data.homepage));
  }
  
  if (data.homepage && data.homepage.length > 255) {
    errors.push(new ValidationError('Homepage URL must be 255 characters or less', 'homepage'));
  }
  
  if (data.private !== undefined && typeof data.private !== 'boolean') {
    errors.push(new ValidationError('Private must be a boolean', 'private', data.private));
  }
  
  if (data.has_issues !== undefined && typeof data.has_issues !== 'boolean') {
    errors.push(new ValidationError('has_issues must be a boolean', 'has_issues', data.has_issues));
  }
  
  if (data.has_projects !== undefined && typeof data.has_projects !== 'boolean') {
    errors.push(new ValidationError('has_projects must be a boolean', 'has_projects', data.has_projects));
  }
  
  if (data.has_wiki !== undefined && typeof data.has_wiki !== 'boolean') {
    errors.push(new ValidationError('has_wiki must be a boolean', 'has_wiki', data.has_wiki));
  }
  
  if (data.topics && !Array.isArray(data.topics)) {
    errors.push(new ValidationError('Topics must be an array', 'topics', data.topics));
  }
  
  if (data.topics && data.topics.length > 20) {
    errors.push(new ValidationError('Cannot have more than 20 topics', 'topics'));
  }
  
  if (data.topics) {
    for (let i = 0; i < data.topics.length; i++) {
      const topic = data.topics[i];
      if (typeof topic !== 'string') {
        errors.push(new ValidationError(`Topic at index ${i} must be a string`, 'topics', topic));
      } else if (topic.length > 50) {
        errors.push(new ValidationError(`Topic "${topic}" must be 50 characters or less`, 'topics'));
      } else if (!/^[a-z0-9-]+$/.test(topic)) {
        errors.push(new ValidationError(`Topic "${topic}" can only contain lowercase letters, numbers, and hyphens`, 'topics'));
      }
    }
  }
  
  if (errors.length > 0) {
    throw new ValidationError('Repository validation failed', 'repository', { errors });
  }
  
  return true;
}

/**
 * Validate pagination parameters
 */
export function validatePagination(options = {}) {
  const errors = [];
  
  if (options.page !== undefined) {
    if (!Number.isInteger(options.page) || options.page < 1) {
      errors.push(new ValidationError('Page must be a positive integer', 'page', options.page));
    }
    if (options.page > 1000) {
      errors.push(new ValidationError('Page cannot be greater than 1000', 'page', options.page));
    }
  }
  
  if (options.per_page !== undefined) {
    if (!Number.isInteger(options.per_page) || options.per_page < 1) {
      errors.push(new ValidationError('per_page must be a positive integer', 'per_page', options.per_page));
    }
    if (options.per_page > 100) {
      errors.push(new ValidationError('per_page cannot be greater than 100', 'per_page', options.per_page));
    }
  }
  
  if (errors.length > 0) {
    throw new ValidationError('Pagination validation failed', 'pagination', { errors });
  }
  
  return true;
}

/**
 * Validate sorting parameters
 */
export function validateSort(options = {}, allowedSorts = []) {
  const errors = [];
  
  if (options.sort !== undefined) {
    if (typeof options.sort !== 'string') {
      errors.push(new ValidationError('Sort must be a string', 'sort', options.sort));
    } else if (allowedSorts.length > 0 && !allowedSorts.includes(options.sort)) {
      errors.push(new ValidationError(
        `Sort must be one of: ${allowedSorts.join(', ')}`, 
        'sort', 
        options.sort
      ));
    }
  }
  
  if (options.direction !== undefined) {
    if (!['asc', 'desc'].includes(options.direction)) {
      errors.push(new ValidationError('Direction must be "asc" or "desc"', 'direction', options.direction));
    }
  }
  
  if (errors.length > 0) {
    throw new ValidationError('Sort validation failed', 'sort', { errors });
  }
  
  return true;
}

/**
 * Validate webhook configuration
 */
export function validateWebhookConfig(config) {
  const errors = [];
  
  if (!config.url) {
    errors.push(new ValidationError('Webhook URL is required', 'url'));
  } else if (typeof config.url !== 'string') {
    errors.push(new ValidationError('Webhook URL must be a string', 'url', config.url));
  } else {
    try {
      new URL(config.url);
    } catch (error) {
      errors.push(new ValidationError('Webhook URL must be a valid URL', 'url', config.url));
    }
  }
  
  if (config.content_type && !['json', 'form'].includes(config.content_type)) {
    errors.push(new ValidationError('Content type must be "json" or "form"', 'content_type', config.content_type));
  }
  
  if (config.insecure_ssl !== undefined) {
    if (typeof config.insecure_ssl !== 'string' && typeof config.insecure_ssl !== 'number') {
      errors.push(new ValidationError('insecure_ssl must be a string or number', 'insecure_ssl', config.insecure_ssl));
    } else if (!['0', '1', 0, 1].includes(config.insecure_ssl)) {
      errors.push(new ValidationError('insecure_ssl must be "0", "1", 0, or 1', 'insecure_ssl', config.insecure_ssl));
    }
  }
  
  if (errors.length > 0) {
    throw new ValidationError('Webhook configuration validation failed', 'webhook', { errors });
  }
  
  return true;
}

/**
 * Generic input validation
 */
export function validateInput(value, rules) {
  const errors = [];
  
  for (const rule of rules) {
    try {
      switch (rule.type) {
        case 'required':
          if (value === null || value === undefined || value === '') {
            errors.push(new ValidationError(rule.message || 'Field is required', rule.field));
          }
          break;
          
        case 'string':
          if (value !== undefined && typeof value !== 'string') {
            errors.push(new ValidationError(rule.message || 'Field must be a string', rule.field, value));
          }
          break;
          
        case 'number':
          if (value !== undefined && typeof value !== 'number') {
            errors.push(new ValidationError(rule.message || 'Field must be a number', rule.field, value));
          }
          break;
          
        case 'boolean':
          if (value !== undefined && typeof value !== 'boolean') {
            errors.push(new ValidationError(rule.message || 'Field must be a boolean', rule.field, value));
          }
          break;
          
        case 'array':
          if (value !== undefined && !Array.isArray(value)) {
            errors.push(new ValidationError(rule.message || 'Field must be an array', rule.field, value));
          }
          break;
          
        case 'minLength':
          if (value && value.length < rule.value) {
            errors.push(new ValidationError(
              rule.message || `Field must be at least ${rule.value} characters long`,
              rule.field,
              value
            ));
          }
          break;
          
        case 'maxLength':
          if (value && value.length > rule.value) {
            errors.push(new ValidationError(
              rule.message || `Field must be no more than ${rule.value} characters long`,
              rule.field,
              value
            ));
          }
          break;
          
        case 'pattern':
          if (value && !rule.value.test(value)) {
            errors.push(new ValidationError(
              rule.message || `Field does not match required pattern`,
              rule.field,
              value
            ));
          }
          break;
          
        case 'enum':
          if (value !== undefined && !rule.value.includes(value)) {
            errors.push(new ValidationError(
              rule.message || `Field must be one of: ${rule.value.join(', ')}`,
              rule.field,
              value
            ));
          }
          break;
      }
    } catch (error) {
      errors.push(error);
    }
  }
  
  if (errors.length > 0) {
    throw new ValidationError('Input validation failed', null, { errors });
  }
  
  return true;
}