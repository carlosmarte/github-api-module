/**
 * @fileoverview Validation utilities for Git operations
 * @module validation
 */

import { existsSync, statSync } from 'fs';
import { resolve, isAbsolute } from 'path';
import { ValidationError } from './errors.mjs';

/**
 * Regular expression patterns for validation
 */
const PATTERNS = {
  // Git repository URL patterns
  GITHUB_SSH: /^git@github\.com:[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\.git$/,
  GITHUB_HTTPS: /^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:\.git)?$/,
  GIT_URL: /^(https?:\/\/|git@)[A-Za-z0-9._-]+[\/:]([A-Za-z0-9_.-]+\/)*[A-Za-z0-9_.-]+(?:\.git)?$/,
  
  // Branch and tag names
  GIT_REF: /^[A-Za-z0-9][A-Za-z0-9._\/-]*[A-Za-z0-9]$|^[A-Za-z0-9]$/,
  
  // Directory/file names (avoiding problematic characters)
  SAFE_NAME: /^[A-Za-z0-9][A-Za-z0-9._-]*$/,
  
  // GitHub token format
  GITHUB_TOKEN: /^gh[pousr]_[A-Za-z0-9]{36}$|^[A-Za-z0-9]{40}$/
};

/**
 * Validate a repository URL
 * @param {string} repoUrl - Repository URL to validate
 * @param {Object} [options] - Validation options
 * @param {boolean} [options.allowSSH=true] - Allow SSH URLs
 * @param {boolean} [options.allowHTTPS=true] - Allow HTTPS URLs
 * @param {boolean} [options.requireGitHub=false] - Require GitHub URLs only
 * @throws {ValidationError} If validation fails
 * @returns {Object} Validation result with parsed URL info
 */
export function validateRepository(repoUrl, options = {}) {
  const opts = {
    allowSSH: true,
    allowHTTPS: true,
    requireGitHub: false,
    ...options
  };

  if (!repoUrl || typeof repoUrl !== 'string') {
    throw new ValidationError('Repository URL is required and must be a string', {
      field: 'repoUrl',
      value: repoUrl,
      type: 'required'
    });
  }

  const trimmedUrl = repoUrl.trim();
  
  if (trimmedUrl.length === 0) {
    throw new ValidationError('Repository URL cannot be empty', {
      field: 'repoUrl',
      value: repoUrl,
      type: 'empty'
    });
  }

  // Check for GitHub-specific patterns first if required
  if (opts.requireGitHub) {
    const isGitHubSSH = PATTERNS.GITHUB_SSH.test(trimmedUrl);
    const isGitHubHTTPS = PATTERNS.GITHUB_HTTPS.test(trimmedUrl);
    
    if (!isGitHubSSH && !isGitHubHTTPS) {
      throw new ValidationError('Only GitHub repository URLs are allowed', {
        field: 'repoUrl',
        value: trimmedUrl,
        type: 'github_required'
      });
    }
    
    if (isGitHubSSH && !opts.allowSSH) {
      throw new ValidationError('SSH URLs are not allowed', {
        field: 'repoUrl',
        value: trimmedUrl,
        type: 'ssh_not_allowed'
      });
    }
    
    if (isGitHubHTTPS && !opts.allowHTTPS) {
      throw new ValidationError('HTTPS URLs are not allowed', {
        field: 'repoUrl',
        value: trimmedUrl,
        type: 'https_not_allowed'
      });
    }
  } else {
    // General Git URL validation
    if (!PATTERNS.GIT_URL.test(trimmedUrl)) {
      throw new ValidationError('Invalid repository URL format', {
        field: 'repoUrl',
        value: trimmedUrl,
        type: 'invalid_format'
      });
    }
  }

  // Parse URL information
  const result = {
    url: trimmedUrl,
    isSSH: trimmedUrl.startsWith('git@'),
    isHTTPS: trimmedUrl.startsWith('https://'),
    isGitHub: trimmedUrl.includes('github.com')
  };

  // Extract repository information
  if (result.isGitHub) {
    if (result.isSSH) {
      const match = trimmedUrl.match(/git@github\.com:([^\/]+)\/([^\.]+)(?:\.git)?$/);
      if (match) {
        result.owner = match[1];
        result.repo = match[2];
      }
    } else {
      const match = trimmedUrl.match(/https:\/\/github\.com\/([^\/]+)\/([^\/]+)(?:\.git)?$/);
      if (match) {
        result.owner = match[1];
        result.repo = match[2];
      }
    }
  }

  return result;
}

/**
 * Validate a file system path
 * @param {string} path - Path to validate
 * @param {Object} [options] - Validation options
 * @param {boolean} [options.mustExist=true] - Path must exist
 * @param {boolean} [options.mustBeDirectory=false] - Path must be a directory
 * @param {boolean} [options.mustBeFile=false] - Path must be a file
 * @param {boolean} [options.checkWritable=false] - Check if path is writable
 * @throws {ValidationError} If validation fails
 * @returns {Object} Validation result with path info
 */
export function validatePath(path, options = {}) {
  const opts = {
    mustExist: true,
    mustBeDirectory: false,
    mustBeFile: false,
    checkWritable: false,
    ...options
  };

  if (!path || typeof path !== 'string') {
    throw new ValidationError('Path is required and must be a string', {
      field: 'path',
      value: path,
      type: 'required'
    });
  }

  const trimmedPath = path.trim();
  
  if (trimmedPath.length === 0) {
    throw new ValidationError('Path cannot be empty', {
      field: 'path',
      value: path,
      type: 'empty'
    });
  }

  const resolvedPath = resolve(trimmedPath);
  const exists = existsSync(resolvedPath);

  if (opts.mustExist && !exists) {
    throw new ValidationError(`Path does not exist: ${resolvedPath}`, {
      field: 'path',
      value: trimmedPath,
      resolvedPath,
      type: 'not_exists'
    });
  }

  const result = {
    originalPath: trimmedPath,
    resolvedPath,
    exists,
    isAbsolute: isAbsolute(trimmedPath)
  };

  if (exists) {
    const stats = statSync(resolvedPath);
    result.isDirectory = stats.isDirectory();
    result.isFile = stats.isFile();
    result.size = stats.size;
    result.modified = stats.mtime;

    if (opts.mustBeDirectory && !result.isDirectory) {
      throw new ValidationError(`Path must be a directory: ${resolvedPath}`, {
        field: 'path',
        value: trimmedPath,
        resolvedPath,
        type: 'not_directory'
      });
    }

    if (opts.mustBeFile && !result.isFile) {
      throw new ValidationError(`Path must be a file: ${resolvedPath}`, {
        field: 'path',
        value: trimmedPath,
        resolvedPath,
        type: 'not_file'
      });
    }

    // Check if it's a Git repository
    if (result.isDirectory) {
      const gitDir = resolve(resolvedPath, '.git');
      result.isGitRepository = existsSync(gitDir);
    }
  }

  return result;
}

/**
 * Validate a directory name for safety
 * @param {string} name - Directory name to validate
 * @param {Object} [options] - Validation options
 * @param {number} [options.maxLength=255] - Maximum name length
 * @param {boolean} [options.allowDots=false] - Allow dots in name
 * @throws {ValidationError} If validation fails
 * @returns {Object} Validation result
 */
export function validateDirectoryName(name, options = {}) {
  const opts = {
    maxLength: 255,
    allowDots: false,
    ...options
  };

  if (!name || typeof name !== 'string') {
    throw new ValidationError('Directory name is required and must be a string', {
      field: 'name',
      value: name,
      type: 'required'
    });
  }

  const trimmedName = name.trim();

  if (trimmedName.length === 0) {
    throw new ValidationError('Directory name cannot be empty', {
      field: 'name',
      value: name,
      type: 'empty'
    });
  }

  if (trimmedName.length > opts.maxLength) {
    throw new ValidationError(`Directory name too long (max ${opts.maxLength} characters)`, {
      field: 'name',
      value: trimmedName,
      maxLength: opts.maxLength,
      actualLength: trimmedName.length,
      type: 'too_long'
    });
  }

  // Check for unsafe characters
  const hasUnsafeChars = /[<>:"|?*\x00-\x1f]/.test(trimmedName);
  if (hasUnsafeChars) {
    throw new ValidationError('Directory name contains unsafe characters', {
      field: 'name',
      value: trimmedName,
      type: 'unsafe_characters'
    });
  }

  // Check for reserved names
  const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 
                        'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 
                        'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'];
  
  if (reservedNames.includes(trimmedName.toUpperCase())) {
    throw new ValidationError('Directory name is reserved by the system', {
      field: 'name',
      value: trimmedName,
      type: 'reserved_name'
    });
  }

  // Check for dots if not allowed
  if (!opts.allowDots && trimmedName.includes('.')) {
    throw new ValidationError('Directory name cannot contain dots', {
      field: 'name',
      value: trimmedName,
      type: 'dots_not_allowed'
    });
  }

  // Check if it starts or ends with dot or space
  if (trimmedName.startsWith('.') || trimmedName.endsWith('.') || 
      trimmedName.startsWith(' ') || trimmedName.endsWith(' ')) {
    throw new ValidationError('Directory name cannot start or end with dot or space', {
      field: 'name',
      value: trimmedName,
      type: 'invalid_start_end'
    });
  }

  return {
    name: trimmedName,
    isValid: true,
    length: trimmedName.length
  };
}

/**
 * Validate a Git branch or tag reference
 * @param {string} ref - Reference name to validate
 * @param {Object} [options] - Validation options
 * @param {string} [options.type] - Reference type ('branch' or 'tag')
 * @throws {ValidationError} If validation fails
 * @returns {Object} Validation result
 */
export function validateGitRef(ref, options = {}) {
  if (!ref || typeof ref !== 'string') {
    throw new ValidationError('Git reference is required and must be a string', {
      field: 'ref',
      value: ref,
      type: 'required'
    });
  }

  const trimmedRef = ref.trim();

  if (trimmedRef.length === 0) {
    throw new ValidationError('Git reference cannot be empty', {
      field: 'ref',
      value: ref,
      type: 'empty'
    });
  }

  // Git reference rules
  if (!PATTERNS.GIT_REF.test(trimmedRef)) {
    throw new ValidationError('Invalid Git reference format', {
      field: 'ref',
      value: trimmedRef,
      type: 'invalid_format'
    });
  }

  // Check for invalid sequences
  if (trimmedRef.includes('..') || trimmedRef.includes('@{') || 
      trimmedRef.includes('\\') || trimmedRef.startsWith('/') || 
      trimmedRef.endsWith('/') || trimmedRef.endsWith('.lock')) {
    throw new ValidationError('Git reference contains invalid sequences', {
      field: 'ref',
      value: trimmedRef,
      type: 'invalid_sequence'
    });
  }

  return {
    ref: trimmedRef,
    type: options.type || 'unknown',
    isValid: true
  };
}

/**
 * Validate GitHub token format
 * @param {string} token - Token to validate
 * @throws {ValidationError} If validation fails
 * @returns {Object} Validation result
 */
export function validateGitHubToken(token) {
  if (!token || typeof token !== 'string') {
    throw new ValidationError('GitHub token is required and must be a string', {
      field: 'token',
      type: 'required'
    });
  }

  const trimmedToken = token.trim();

  if (trimmedToken.length === 0) {
    throw new ValidationError('GitHub token cannot be empty', {
      field: 'token',
      type: 'empty'
    });
  }

  if (!PATTERNS.GITHUB_TOKEN.test(trimmedToken)) {
    throw new ValidationError('Invalid GitHub token format', {
      field: 'token',
      type: 'invalid_format'
    });
  }

  return {
    isValid: true,
    type: trimmedToken.startsWith('ghp_') ? 'personal' :
          trimmedToken.startsWith('gho_') ? 'oauth' :
          trimmedToken.startsWith('ghu_') ? 'user' :
          trimmedToken.startsWith('ghs_') ? 'server' :
          'classic'
  };
}

/**
 * Validate clone options
 * @param {Object} options - Clone options to validate
 * @throws {ValidationError} If validation fails
 * @returns {Object} Validated and normalized options
 */
export function validateCloneOptions(options = {}) {
  const validated = {};

  if (options.branch !== undefined) {
    validateGitRef(options.branch, { type: 'branch' });
    validated.branch = options.branch.trim();
  }

  if (options.depth !== undefined) {
    if (!Number.isInteger(options.depth) || options.depth < 1) {
      throw new ValidationError('Clone depth must be a positive integer', {
        field: 'depth',
        value: options.depth,
        type: 'invalid_depth'
      });
    }
    validated.depth = options.depth;
  }

  if (options.bare !== undefined) {
    if (typeof options.bare !== 'boolean') {
      throw new ValidationError('Bare option must be a boolean', {
        field: 'bare',
        value: options.bare,
        type: 'invalid_type'
      });
    }
    validated.bare = options.bare;
  }

  return validated;
}

/**
 * Comprehensive validation for repository operation
 * @param {Object} params - Parameters to validate
 * @param {string} params.repoUrl - Repository URL
 * @param {string} [params.targetDir] - Target directory
 * @param {Object} [params.options] - Operation options
 * @throws {ValidationError} If any validation fails
 * @returns {Object} Validated parameters
 */
export function validateRepositoryOperation(params) {
  const result = {};

  // Validate repository URL
  result.repository = validateRepository(params.repoUrl);

  // Validate target directory if provided
  if (params.targetDir) {
    result.directory = validateDirectoryName(params.targetDir);
  }

  // Validate options if provided
  if (params.options) {
    result.options = validateCloneOptions(params.options);
  }

  return result;
}