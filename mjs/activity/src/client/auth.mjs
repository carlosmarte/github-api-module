/**
 * Authentication handler for GitHub API
 * @module client/auth
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { ConfigurationError } from '../utils/errors.mjs';

/**
 * Authentication configuration
 */
export class AuthConfig {
  /**
   * @param {Object} options - Authentication options
   * @param {string} [options.token] - GitHub personal access token
   * @param {string} [options.tokenFile] - Path to file containing token
   * @param {string} [options.tokenEnv] - Environment variable name for token
   */
  constructor(options = {}) {
    this.token = null;
    this.tokenSource = null;
    
    // Priority: direct token > env var > file > config file
    if (options.token) {
      this.token = options.token;
      this.tokenSource = 'direct';
    } else if (options.tokenEnv) {
      this.loadFromEnv(options.tokenEnv);
    } else if (options.tokenFile) {
      this.tokenFile = options.tokenFile;
      this.tokenSource = 'file';
    } else {
      this.loadFromEnv('GITHUB_TOKEN');
      if (!this.token) {
        this.loadFromEnv('GH_TOKEN');
      }
    }
  }

  /**
   * Load token from environment variable
   * @param {string} envName - Environment variable name
   */
  loadFromEnv(envName) {
    const token = process.env[envName];
    if (token) {
      this.token = token;
      this.tokenSource = `env:${envName}`;
    }
  }

  /**
   * Load token from file
   * @returns {Promise<string>} Token
   */
  async loadFromFile() {
    if (!this.tokenFile) {
      return null;
    }

    try {
      const content = await fs.readFile(this.tokenFile, 'utf-8');
      this.token = content.trim();
      return this.token;
    } catch (error) {
      throw new ConfigurationError(
        `Failed to read token from file ${this.tokenFile}: ${error.message}`
      );
    }
  }

  /**
   * Load configuration from config file
   * @param {string} [configPath] - Path to config file
   * @returns {Promise<Object>} Configuration object
   */
  static async loadConfig(configPath) {
    const paths = [
      configPath,
      '.github-activity.json',
      path.join(os.homedir(), '.github-activity.json'),
      path.join(os.homedir(), '.config', 'github-activity', 'config.json')
    ].filter(Boolean);

    for (const filePath of paths) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const config = JSON.parse(content);
        
        if (config.token || config.auth?.token) {
          return {
            token: config.token || config.auth?.token,
            baseUrl: config.baseUrl || config.baseURL,
            perPage: config.perPage || config.per_page,
            timeout: config.timeout,
            cache: config.cache,
            debug: config.debug
          };
        }
      } catch (error) {
        // Continue to next path
        continue;
      }
    }

    return {};
  }

  /**
   * Get token
   * @returns {Promise<string|null>} Token
   */
  async getToken() {
    if (!this.token && this.tokenFile) {
      await this.loadFromFile();
    }
    return this.token;
  }

  /**
   * Check if authenticated
   * @returns {boolean}
   */
  isAuthenticated() {
    return !!this.token;
  }

  /**
   * Get token source description
   * @returns {string}
   */
  getTokenSource() {
    return this.tokenSource || 'none';
  }

  /**
   * Validate token format
   * @param {string} token - Token to validate
   * @returns {boolean}
   */
  static validateToken(token) {
    if (!token) return false;
    
    // GitHub personal access tokens
    if (token.startsWith('ghp_')) {
      return token.length === 40;
    }
    
    // GitHub App installation tokens
    if (token.startsWith('ghs_')) {
      return token.length > 20;
    }
    
    // Classic personal access tokens (40 char hex)
    if (/^[a-f0-9]{40}$/i.test(token)) {
      return true;
    }
    
    // Fine-grained personal access tokens
    if (token.startsWith('github_pat_')) {
      return token.length > 20;
    }
    
    return false;
  }

  /**
   * Create auth header
   * @returns {Promise<Object>} Headers object
   */
  async createAuthHeader() {
    const token = await this.getToken();
    
    if (!token) {
      return {};
    }

    // Use Bearer for new tokens, token for classic
    if (token.startsWith('ghp_') || token.startsWith('github_pat_') || token.startsWith('ghs_')) {
      return {
        'Authorization': `Bearer ${token}`
      };
    } else {
      return {
        'Authorization': `token ${token}`
      };
    }
  }

  /**
   * Get scopes from token
   * @param {Object} httpClient - HTTP client instance
   * @returns {Promise<Array>} Array of scopes
   */
  async getScopes(httpClient) {
    try {
      const response = await httpClient.get('/user');
      const scopesHeader = response.headers['x-oauth-scopes'];
      
      if (scopesHeader) {
        return scopesHeader.split(',').map(s => s.trim()).filter(Boolean);
      }
      
      return [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Check if token has required scopes
   * @param {Array<string>} requiredScopes - Required scopes
   * @param {Object} httpClient - HTTP client instance
   * @returns {Promise<boolean>}
   */
  async hasScopes(requiredScopes, httpClient) {
    const scopes = await this.getScopes(httpClient);
    return requiredScopes.every(required => 
      scopes.some(scope => scope === required || scope === 'repo')
    );
  }
}

/**
 * Create auth config from various sources
 * @param {Object} options - Options
 * @returns {Promise<AuthConfig>}
 */
export async function createAuthConfig(options = {}) {
  // Load from config file if no direct options
  if (!options.token && !options.tokenFile && !options.tokenEnv) {
    const config = await AuthConfig.loadConfig(options.configPath);
    Object.assign(options, config);
  }

  const authConfig = new AuthConfig(options);
  
  // Validate token if present
  const token = await authConfig.getToken();
  if (token && !AuthConfig.validateToken(token)) {
    console.warn('Warning: Token format appears invalid');
  }

  return authConfig;
}

export default AuthConfig;