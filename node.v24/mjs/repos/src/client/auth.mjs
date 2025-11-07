/**
 * @fileoverview Authentication handling for GitHub API
 * @module auth
 */

import { AuthError } from '../utils/errors.mjs';

/**
 * Authentication types supported
 */
export const AuthType = {
  TOKEN: 'token',
  GITHUB_APP: 'github_app',
  OAUTH: 'oauth'
};

/**
 * Authentication manager class
 */
export class AuthManager {
  constructor(options = {}) {
    this.token = options.token;
    this.authType = options.authType || AuthType.TOKEN;
    this.appId = options.appId;
    this.privateKey = options.privateKey;
    this.installationId = options.installationId;
  }
  
  /**
   * Validate authentication configuration
   */
  validate() {
    switch (this.authType) {
      case AuthType.TOKEN:
        if (!this.token) {
          throw new AuthError('Personal access token is required');
        }
        if (!this.token.startsWith('ghp_') && !this.token.startsWith('github_pat_')) {
          console.warn('Warning: Token format does not match expected GitHub token patterns');
        }
        break;
        
      case AuthType.GITHUB_APP:
        if (!this.appId || !this.privateKey) {
          throw new AuthError('GitHub App ID and private key are required for app authentication');
        }
        break;
        
      case AuthType.OAUTH:
        if (!this.token) {
          throw new AuthError('OAuth token is required');
        }
        break;
        
      default:
        throw new AuthError(`Unsupported authentication type: ${this.authType}`);
    }
  }
  
  /**
   * Get authorization header value
   */
  getAuthHeader() {
    this.validate();
    
    switch (this.authType) {
      case AuthType.TOKEN:
      case AuthType.OAUTH:
        return `Bearer ${this.token}`;
        
      case AuthType.GITHUB_APP:
        // For GitHub Apps, we need to generate JWT token
        return `Bearer ${this.generateJWT()}`;
        
      default:
        throw new AuthError(`Cannot generate auth header for type: ${this.authType}`);
    }
  }
  
  /**
   * Generate JWT for GitHub App authentication
   * Note: This is a simplified implementation. In production, use a proper JWT library.
   */
  generateJWT() {
    if (this.authType !== AuthType.GITHUB_APP) {
      throw new AuthError('JWT generation only available for GitHub App authentication');
    }
    
    // This would need a proper JWT implementation with RS256 signing
    // For now, throw an error indicating this needs to be implemented
    throw new AuthError('GitHub App authentication not yet implemented. Use personal access token instead.');
  }
  
  /**
   * Get user information from token
   */
  async getUserInfo(httpClient) {
    try {
      const response = await httpClient.get('/user');
      return response;
    } catch (error) {
      if (error.statusCode === 401) {
        throw new AuthError('Invalid or expired token');
      }
      throw error;
    }
  }
  
  /**
   * Check if token has specific scopes
   */
  async checkScopes(httpClient, requiredScopes = []) {
    try {
      const response = await httpClient.head('/user');
      const scopes = response.headers?.get('x-oauth-scopes')?.split(', ') || [];
      
      const missingScopes = requiredScopes.filter(scope => !scopes.includes(scope));
      
      if (missingScopes.length > 0) {
        throw new AuthError(`Missing required scopes: ${missingScopes.join(', ')}`);
      }
      
      return scopes;
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      throw new AuthError('Unable to verify token scopes');
    }
  }
  
  /**
   * Get rate limit information
   */
  async getRateLimit(httpClient) {
    try {
      const response = await httpClient.get('/rate_limit');
      return response;
    } catch (error) {
      // Rate limit endpoint might not be accessible, return null
      return null;
    }
  }
}

/**
 * Create authentication manager from various input formats
 */
export function createAuth(input) {
  if (typeof input === 'string') {
    // Simple token string
    return new AuthManager({ token: input });
  }
  
  if (typeof input === 'object' && input !== null) {
    return new AuthManager(input);
  }
  
  throw new AuthError('Invalid authentication configuration');
}

/**
 * Detect authentication type from token format
 */
export function detectAuthType(token) {
  if (!token || typeof token !== 'string') {
    return null;
  }
  
  // GitHub personal access token (classic)
  if (token.startsWith('ghp_')) {
    return AuthType.TOKEN;
  }
  
  // GitHub personal access token (fine-grained)
  if (token.startsWith('github_pat_')) {
    return AuthType.TOKEN;
  }
  
  // OAuth token (usually starts with 'gho_')
  if (token.startsWith('gho_')) {
    return AuthType.OAUTH;
  }
  
  // GitHub App installation token (usually starts with 'ghs_')
  if (token.startsWith('ghs_')) {
    return AuthType.GITHUB_APP;
  }
  
  // Fallback to token type for unknown formats
  return AuthType.TOKEN;
}

/**
 * Validate token format
 */
export function validateToken(token) {
  if (!token || typeof token !== 'string') {
    throw new AuthError('Token must be a non-empty string');
  }
  
  // Basic length check
  if (token.length < 20) {
    throw new AuthError('Token appears to be too short');
  }
  
  // Check for common mistakes
  if (token.includes(' ')) {
    throw new AuthError('Token should not contain spaces');
  }
  
  if (token.startsWith('token ') || token.startsWith('Bearer ')) {
    throw new AuthError('Token should not include "token" or "Bearer" prefix');
  }
  
  return true;
}

/**
 * Get token from environment or config
 */
export function getTokenFromEnvironment() {
  // Check various environment variables
  const envVars = [
    'GITHUB_TOKEN',
    'GH_TOKEN',
    'GITHUB_ACCESS_TOKEN',
    'GITHUB_PAT'
  ];
  
  for (const envVar of envVars) {
    const token = process.env[envVar];
    if (token) {
      return token;
    }
  }
  
  return null;
}

/**
 * Authentication utilities
 */
export const authUtils = {
  /**
   * Extract repo permissions from token scopes
   */
  getRepoPermissions(scopes) {
    const permissions = {
      read: false,
      write: false,
      admin: false
    };
    
    if (scopes.includes('repo')) {
      permissions.read = true;
      permissions.write = true;
      permissions.admin = true;
    } else {
      if (scopes.includes('public_repo')) {
        permissions.read = true;
        permissions.write = true;
      }
      if (scopes.includes('repo:status')) {
        permissions.read = true;
      }
    }
    
    return permissions;
  },
  
  /**
   * Check if scopes allow specific operation
   */
  canPerformOperation(scopes, operation) {
    const operations = {
      'read': ['repo', 'public_repo', 'repo:status'],
      'write': ['repo', 'public_repo'],
      'admin': ['repo'],
      'delete': ['repo', 'delete_repo']
    };
    
    const requiredScopes = operations[operation] || [];
    return requiredScopes.some(scope => scopes.includes(scope));
  }
};