/**
 * @fileoverview CLI Configuration Management
 * @module config
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';
import { fileURLToPath } from 'url';
import inquirer from 'inquirer';
import yaml from 'yaml';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Get configuration file path
 */
function getConfigPath() {
  const configDir = join(homedir(), '.gh-clone');
  return join(configDir, 'config.yml');
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG = {
  baseDir: './repositories',
  token: null,
  verbose: false,
  timeout: 300000,
  git: {
    maxConcurrentProcesses: 6,
    timeout: 300000
  },
  ui: {
    color: true,
    progress: true
  }
};

/**
 * Load configuration from file
 * @returns {Object} Configuration object
 */
export function loadConfig() {
  const configPath = getConfigPath();
  
  if (!existsSync(configPath)) {
    return { ...DEFAULT_CONFIG };
  }

  try {
    const configContent = readFileSync(configPath, 'utf8');
    const config = yaml.parse(configContent);
    
    // Merge with defaults to ensure all keys exist
    return {
      ...DEFAULT_CONFIG,
      ...config,
      git: {
        ...DEFAULT_CONFIG.git,
        ...(config.git || {})
      },
      ui: {
        ...DEFAULT_CONFIG.ui,
        ...(config.ui || {})
      }
    };
  } catch (error) {
    console.warn(chalk.yellow(`Warning: Could not load config file: ${error.message}`));
    return { ...DEFAULT_CONFIG };
  }
}

/**
 * Save configuration to file
 * @param {Object} config - Configuration object
 */
export function saveConfig(config) {
  const configPath = getConfigPath();
  const configDir = dirname(configPath);
  
  // Ensure config directory exists
  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true });
  }

  try {
    const configContent = yaml.stringify(config, {
      indent: 2,
      lineWidth: 80,
      minContentWidth: 20
    });
    
    writeFileSync(configPath, configContent, 'utf8');
  } catch (error) {
    throw new Error(`Could not save config file: ${error.message}`);
  }
}

/**
 * Interactive configuration setup
 */
export async function setupConfig() {
  console.log(chalk.cyan('Git Repository Management CLI Configuration'));
  console.log(chalk.gray('Configure your default settings for gh-clone\n'));

  const currentConfig = loadConfig();

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'baseDir',
      message: 'Default base directory for repositories:',
      default: currentConfig.baseDir,
      validate: (input) => {
        if (!input || input.trim().length === 0) {
          return 'Base directory is required';
        }
        return true;
      }
    },
    {
      type: 'password',
      name: 'token',
      message: 'GitHub personal access token (optional):',
      mask: '*',
      default: currentConfig.token,
      when: () => {
        return !process.env.GITHUB_TOKEN;
      }
    },
    {
      type: 'number',
      name: 'timeout',
      message: 'Default operation timeout (milliseconds):',
      default: currentConfig.timeout,
      validate: (input) => {
        if (!Number.isInteger(input) || input < 1000) {
          return 'Timeout must be at least 1000 milliseconds';
        }
        return true;
      }
    },
    {
      type: 'confirm',
      name: 'verbose',
      message: 'Enable verbose logging by default:',
      default: currentConfig.verbose
    },
    {
      type: 'confirm',
      name: 'color',
      message: 'Enable colored output:',
      default: currentConfig.ui.color
    },
    {
      type: 'confirm',
      name: 'progress',
      message: 'Show progress indicators:',
      default: currentConfig.ui.progress
    },
    {
      type: 'number',
      name: 'maxConcurrentProcesses',
      message: 'Maximum concurrent Git processes:',
      default: currentConfig.git.maxConcurrentProcesses,
      validate: (input) => {
        if (!Number.isInteger(input) || input < 1 || input > 20) {
          return 'Must be between 1 and 20';
        }
        return true;
      }
    }
  ]);

  // Build new configuration
  const newConfig = {
    baseDir: answers.baseDir.trim(),
    token: answers.token ? answers.token.trim() : currentConfig.token,
    verbose: answers.verbose,
    timeout: answers.timeout,
    git: {
      maxConcurrentProcesses: answers.maxConcurrentProcesses,
      timeout: answers.timeout
    },
    ui: {
      color: answers.color,
      progress: answers.progress
    }
  };

  // Save configuration
  saveConfig(newConfig);
  
  console.log(chalk.green('\n✓ Configuration saved successfully!'));
  console.log(chalk.gray(`Config location: ${getConfigPath()}`));
  
  // Show summary
  console.log(chalk.cyan('\nConfiguration summary:'));
  console.log(`Base directory: ${chalk.white(newConfig.baseDir)}`);
  console.log(`Token configured: ${chalk.white(newConfig.token ? 'Yes' : 'No')}`);
  console.log(`Timeout: ${chalk.white(newConfig.timeout)}ms`);
  console.log(`Verbose: ${chalk.white(newConfig.verbose ? 'Yes' : 'No')}`);
  console.log(`Colored output: ${chalk.white(newConfig.ui.color ? 'Yes' : 'No')}`);
  console.log(`Progress indicators: ${chalk.white(newConfig.ui.progress ? 'Yes' : 'No')}`);
  console.log(`Max concurrent processes: ${chalk.white(newConfig.git.maxConcurrentProcesses)}`);
}

/**
 * Get specific configuration value
 * @param {string} key - Configuration key (supports dot notation)
 * @returns {*} Configuration value
 */
export function getConfig(key) {
  const config = loadConfig();
  
  if (!key) {
    return config;
  }

  // Support dot notation (e.g., 'git.timeout')
  const keys = key.split('.');
  let value = config;
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return undefined;
    }
  }
  
  return value;
}

/**
 * Set specific configuration value
 * @param {string} key - Configuration key (supports dot notation)
 * @param {*} value - Value to set
 */
export function setConfig(key, value) {
  const config = loadConfig();
  
  // Support dot notation (e.g., 'git.timeout')
  const keys = key.split('.');
  let target = config;
  
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    if (!target[k] || typeof target[k] !== 'object') {
      target[k] = {};
    }
    target = target[k];
  }
  
  target[keys[keys.length - 1]] = value;
  saveConfig(config);
}

/**
 * Reset configuration to defaults
 */
export function resetConfig() {
  saveConfig({ ...DEFAULT_CONFIG });
}

/**
 * Show current configuration
 */
export function showConfig() {
  const config = loadConfig();
  const configPath = getConfigPath();
  
  console.log(chalk.cyan('Current Configuration:'));
  console.log(chalk.gray(`Location: ${configPath}`));
  console.log();
  
  console.log(yaml.stringify(config, {
    indent: 2,
    lineWidth: 80,
    minContentWidth: 20
  }));
}

/**
 * Validate configuration
 * @param {Object} config - Configuration object to validate
 * @returns {Array} Array of validation errors
 */
export function validateConfig(config = null) {
  const cfg = config || loadConfig();
  const errors = [];

  // Validate baseDir
  if (!cfg.baseDir || typeof cfg.baseDir !== 'string') {
    errors.push('baseDir must be a non-empty string');
  }

  // Validate token if provided
  if (cfg.token && typeof cfg.token !== 'string') {
    errors.push('token must be a string');
  }

  // Validate timeout
  if (!Number.isInteger(cfg.timeout) || cfg.timeout < 1000) {
    errors.push('timeout must be an integer >= 1000');
  }

  // Validate verbose
  if (typeof cfg.verbose !== 'boolean') {
    errors.push('verbose must be a boolean');
  }

  // Validate git config
  if (cfg.git) {
    if (!Number.isInteger(cfg.git.maxConcurrentProcesses) || 
        cfg.git.maxConcurrentProcesses < 1 || 
        cfg.git.maxConcurrentProcesses > 20) {
      errors.push('git.maxConcurrentProcesses must be an integer between 1 and 20');
    }
    
    if (!Number.isInteger(cfg.git.timeout) || cfg.git.timeout < 1000) {
      errors.push('git.timeout must be an integer >= 1000');
    }
  }

  // Validate UI config
  if (cfg.ui) {
    if (typeof cfg.ui.color !== 'boolean') {
      errors.push('ui.color must be a boolean');
    }
    
    if (typeof cfg.ui.progress !== 'boolean') {
      errors.push('ui.progress must be a boolean');
    }
  }

  return errors;
}