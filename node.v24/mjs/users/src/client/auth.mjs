/**
 * @fileoverview Authentication utilities for GitHub API
 * @module auth
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { AuthError } from '../utils/errors.mjs';

/**
 * Get GitHub authentication token from various sources
 * @param {Object} [options] - Authentication options
 * @param {string} [options.token] - Explicit token
 * @returns {string|null} Authentication token
 */
export function getAuth(options = {}) {
  // 1. Check explicit token option
  if (options.token) {
    return options.token;
  }

  // 2. Check environment variables
  const envToken = process.env.GITHUB_TOKEN || 
                   process.env.GH_TOKEN || 
                   process.env.GITHUB_API_TOKEN;
  if (envToken) {
    return envToken;
  }

  // 3. Check GitHub CLI config (if available)
  try {
    const ghConfigPath = join(process.env.HOME || process.env.USERPROFILE || '', '.config/gh/hosts.yml');
    if (existsSync(ghConfigPath)) {
      const config = readFileSync(ghConfigPath, 'utf8');
      const tokenMatch = config.match(/oauth_token:\s*([^\s\n]+)/);
      if (tokenMatch) {
        return tokenMatch[1];
      }
    }
  } catch (error) {
    // Ignore errors reading gh config
  }

  // 4. Check .env file in current directory
  try {
    const envPath = join(process.cwd(), '.env');
    if (existsSync(envPath)) {
      const envContent = readFileSync(envPath, 'utf8');
      const tokenMatch = envContent.match(/GITHUB_TOKEN\s*=\s*([^\s\n]+)/);
      if (tokenMatch) {
        return tokenMatch[1];
      }
    }
  } catch (error) {
    // Ignore errors reading .env file
  }

  return null;
}

/**
 * Validate GitHub token format
 * @param {string} token - Token to validate
 * @returns {boolean} True if token format appears valid
 */
export function validateToken(token) {
  if (!token || typeof token !== 'string') {
    return false;
  }

  // GitHub tokens should be at least 20 characters
  if (token.length < 20) {
    return false;
  }

  // Classic personal access tokens start with 'ghp_'
  // Fine-grained tokens start with 'github_pat_'
  // GitHub App tokens start with 'ghs_'
  const validPrefixes = ['ghp_', 'github_pat_', 'ghs_'];
  const hasValidPrefix = validPrefixes.some(prefix => token.startsWith(prefix));
  
  if (!hasValidPrefix) {
    // Could be an older format token, allow it
    return true;
  }

  return true;
}

/**
 * Create authentication headers
 * @param {string} token - GitHub token
 * @returns {Object} Authentication headers
 */
export function createAuthHeaders(token) {
  if (!token) {
    throw new AuthError('No authentication token provided');
  }

  if (!validateToken(token)) {
    throw new AuthError('Invalid token format');
  }

  return {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28'
  };
}

/**
 * Extract token scopes from response headers
 * @param {Headers} headers - Response headers
 * @returns {Array<string>} Array of token scopes
 */
export function extractScopes(headers) {
  const scopeHeader = headers.get('X-OAuth-Scopes') || headers.get('x-oauth-scopes');
  if (!scopeHeader) {
    return [];
  }
  
  return scopeHeader
    .split(',')
    .map(scope => scope.trim())
    .filter(scope => scope.length > 0);
}

/**
 * Check if token has required scopes
 * @param {Array<string>} tokenScopes - Available scopes
 * @param {Array<string>} requiredScopes - Required scopes
 * @returns {boolean} True if all required scopes are available
 */
export function hasRequiredScopes(tokenScopes, requiredScopes) {
  if (!Array.isArray(requiredScopes) || requiredScopes.length === 0) {
    return true;
  }

  return requiredScopes.every(required => tokenScopes.includes(required));
}

/**
 * Get authentication method from token
 * @param {string} token - GitHub token
 * @returns {string} Authentication method ('personal', 'app', 'oauth')
 */
export function getAuthMethod(token) {
  if (!token) {
    return 'none';
  }

  if (token.startsWith('ghp_')) {
    return 'personal';
  }
  
  if (token.startsWith('github_pat_')) {
    return 'personal-fine-grained';
  }
  
  if (token.startsWith('ghs_')) {
    return 'app';
  }
  
  // Could be OAuth token or older format
  return 'oauth';
}