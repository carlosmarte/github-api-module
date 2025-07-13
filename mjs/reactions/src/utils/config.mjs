/**
 * Configuration management utilities
 * @module utils/config
 */

import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { ConfigurationError } from '../core/errors.mjs';

/**
 * Load configuration from various sources
 * @param {string} [configPath] - Path to config file
 * @returns {Promise<Object>} Configuration object
 */
export async function loadConfig(configPath) {
  const config = {
    token: process.env.GITHUB_TOKEN,
    baseUrl: process.env.GITHUB_API_URL || 'https://api.github.com',
    timeout: parseInt(process.env.GITHUB_TIMEOUT) || 30000,
    retries: parseInt(process.env.GITHUB_RETRIES) || 3,
    pagination: {
      perPage: parseInt(process.env.GITHUB_PER_PAGE) || 30,
      page: 1,
      autoPage: false,
    },
    logging: {
      level: process.env.LOG_LEVEL || 'info',
      console: true,
    },
  };

  // Try to load from config file
  if (configPath) {
    try {
      const fileConfig = await loadConfigFile(configPath);
      Object.assign(config, fileConfig);
    } catch (error) {
      throw new ConfigurationError(`Failed to load config file: ${configPath}`, error);
    }
  } else {
    // Try default config locations
    const defaultPaths = [
      '.github-reactions.json',
      join(homedir(), '.github-reactions.json'),
      join(homedir(), '.config', 'github-reactions.json'),
    ];

    for (const path of defaultPaths) {
      try {
        const fileConfig = await loadConfigFile(path);
        Object.assign(config, fileConfig);
        break;
      } catch {
        // Ignore errors for default paths
      }
    }
  }

  return config;
}

/**
 * Load configuration from a JSON file
 * @param {string} filePath - Path to config file
 * @returns {Promise<Object>} Configuration object
 */
async function loadConfigFile(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Validate configuration
 * @param {Object} config - Configuration to validate
 * @throws {ConfigurationError} If configuration is invalid
 */
export function validateConfig(config) {
  if (!config.token) {
    throw new ConfigurationError(
      'GitHub token is required. Set GITHUB_TOKEN environment variable or provide in config file.'
    );
  }

  if (!config.baseUrl || !config.baseUrl.startsWith('http')) {
    throw new ConfigurationError('Invalid base URL provided');
  }

  if (config.timeout && (config.timeout < 1000 || config.timeout > 300000)) {
    throw new ConfigurationError('Timeout must be between 1000ms and 300000ms');
  }

  if (config.retries && (config.retries < 0 || config.retries > 10)) {
    throw new ConfigurationError('Retries must be between 0 and 10');
  }

  if (config.pagination?.perPage && (config.pagination.perPage < 1 || config.pagination.perPage > 100)) {
    throw new ConfigurationError('Per page must be between 1 and 100');
  }
}