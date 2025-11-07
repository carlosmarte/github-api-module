/**
 * @fileoverview CLI configuration management
 * @module cli/config
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import inquirer from 'inquirer';
import { ValidationError } from '../utils/errors.mjs';

const CONFIG_DIR = join(homedir(), '.github-repos');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

/**
 * Default configuration
 */
const DEFAULT_CONFIG = {
  token: null,
  baseUrl: 'https://api.github.com',
  timeout: 10000,
  rateLimiting: {
    enabled: true,
    padding: 100
  },
  output: {
    format: 'table', // table, json
    colors: true,
    verbose: false
  }
};

/**
 * Load configuration from file
 */
export async function loadConfig() {
  try {
    if (!existsSync(CONFIG_FILE)) {
      return { ...DEFAULT_CONFIG };
    }
    
    const configData = await readFile(CONFIG_FILE, 'utf8');
    const config = JSON.parse(configData);
    
    return { ...DEFAULT_CONFIG, ...config };
  } catch (error) {
    console.warn('Warning: Could not load configuration, using defaults');
    return { ...DEFAULT_CONFIG };
  }
}

/**
 * Save configuration to file
 */
export async function saveConfig(config) {
  try {
    // Ensure config directory exists
    if (!existsSync(CONFIG_DIR)) {
      await mkdir(CONFIG_DIR, { recursive: true });
    }
    
    // Don't save sensitive data in plain text (just a warning)
    const configToSave = { ...config };
    if (configToSave.token) {
      console.warn('Warning: Token will be saved in plain text. Consider using environment variables.');
    }
    
    await writeFile(CONFIG_FILE, JSON.stringify(configToSave, null, 2));
  } catch (error) {
    throw new Error(`Failed to save configuration: ${error.message}`);
  }
}

/**
 * Interactive configuration setup
 */
export async function setupConfig() {
  console.log('🔧 GitHub Repository CLI Configuration');
  console.log('');
  
  const currentConfig = await loadConfig();
  
  const questions = [
    {
      type: 'input',
      name: 'token',
      message: 'GitHub Personal Access Token (leave empty to use environment variable):',
      default: currentConfig.token || '',
      validate: (input) => {
        if (!input.trim()) {
          return true; // Allow empty to use env var
        }
        if (input.length < 20) {
          return 'Token appears to be too short';
        }
        if (input.includes(' ')) {
          return 'Token should not contain spaces';
        }
        return true;
      }
    },
    {
      type: 'input',
      name: 'baseUrl',
      message: 'GitHub API Base URL:',
      default: currentConfig.baseUrl || 'https://api.github.com',
      validate: (input) => {
        try {
          new URL(input);
          return true;
        } catch {
          return 'Please enter a valid URL';
        }
      }
    },
    {
      type: 'number',
      name: 'timeout',
      message: 'Request timeout (milliseconds):',
      default: currentConfig.timeout || 10000,
      validate: (input) => {
        if (input < 1000 || input > 60000) {
          return 'Timeout must be between 1000 and 60000 milliseconds';
        }
        return true;
      }
    },
    {
      type: 'confirm',
      name: 'rateLimitingEnabled',
      message: 'Enable rate limiting protection:',
      default: currentConfig.rateLimiting?.enabled !== false
    },
    {
      type: 'list',
      name: 'outputFormat',
      message: 'Default output format:',
      choices: [
        { name: 'Table (human readable)', value: 'table' },
        { name: 'JSON', value: 'json' }
      ],
      default: currentConfig.output?.format || 'table'
    },
    {
      type: 'confirm',
      name: 'colors',
      message: 'Use colors in output:',
      default: currentConfig.output?.colors !== false
    },
    {
      type: 'confirm',
      name: 'verbose',
      message: 'Enable verbose logging:',
      default: currentConfig.output?.verbose === true
    }
  ];
  
  const answers = await inquirer.prompt(questions);
  
  const newConfig = {
    token: answers.token.trim() || null,
    baseUrl: answers.baseUrl,
    timeout: answers.timeout,
    rateLimiting: {
      enabled: answers.rateLimitingEnabled,
      padding: 100
    },
    output: {
      format: answers.outputFormat,
      colors: answers.colors,
      verbose: answers.verbose
    }
  };
  
  await saveConfig(newConfig);
  
  console.log('');
  console.log('✅ Configuration saved successfully!');
  
  if (!newConfig.token && !process.env.GITHUB_TOKEN) {
    console.log('');
    console.log('⚠️  No token configured. You can:');
    console.log('   - Set GITHUB_TOKEN environment variable');
    console.log('   - Use --token option with commands');
    console.log('   - Run this setup again to save a token');
  }
  
  return newConfig;
}

/**
 * Update specific configuration value
 */
export async function updateConfigValue(key, value) {
  const config = await loadConfig();
  
  // Handle nested keys like 'output.format'
  const keys = key.split('.');
  let current = config;
  
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]]) {
      current[keys[i]] = {};
    }
    current = current[keys[i]];
  }
  
  current[keys[keys.length - 1]] = value;
  
  await saveConfig(config);
  return config;
}

/**
 * Get configuration value
 */
export async function getConfigValue(key) {
  const config = await loadConfig();
  
  // Handle nested keys
  const keys = key.split('.');
  let current = config;
  
  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = current[k];
    } else {
      return undefined;
    }
  }
  
  return current;
}

/**
 * Reset configuration to defaults
 */
export async function resetConfig() {
  await saveConfig(DEFAULT_CONFIG);
  return DEFAULT_CONFIG;
}

/**
 * Validate configuration
 */
export function validateConfig(config) {
  const errors = [];
  
  if (config.baseUrl) {
    try {
      new URL(config.baseUrl);
    } catch {
      errors.push('baseUrl must be a valid URL');
    }
  }
  
  if (config.timeout && (config.timeout < 1000 || config.timeout > 60000)) {
    errors.push('timeout must be between 1000 and 60000 milliseconds');
  }
  
  if (config.output?.format && !['table', 'json'].includes(config.output.format)) {
    errors.push('output.format must be "table" or "json"');
  }
  
  if (errors.length > 0) {
    throw new ValidationError(`Configuration validation failed: ${errors.join(', ')}`);
  }
  
  return true;
}