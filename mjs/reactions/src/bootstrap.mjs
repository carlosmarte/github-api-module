/**
 * Bootstrap and dependency injection setup
 * @module bootstrap
 */

import { HttpService } from './services/http.service.mjs';
import { ReactionsClient } from './client/ReactionsClient.mjs';
import { loadConfig, validateConfig } from './utils/config.mjs';
import { setupLogger } from './utils/logger.mjs';

/**
 * Create a configured ReactionsClient instance
 * @param {Object} [config] - Configuration options
 * @returns {Promise<ReactionsClient>} Configured client
 */
export async function createClient(config = {}) {
  // Load and merge configuration
  const fullConfig = { ...await loadConfig(), ...config };
  validateConfig(fullConfig);

  // Create logger
  const logger = setupLogger(fullConfig.logging);

  // Create HTTP service
  const httpService = new HttpService(fullConfig, logger);

  // Create and return reactions client
  return new ReactionsClient(httpService, logger);
}

/**
 * Simple container for manual dependency management
 */
export class Container {
  constructor() {
    this.services = new Map();
  }

  register(name, factory) {
    this.services.set(name, factory);
    return this;
  }

  resolve(name) {
    const factory = this.services.get(name);
    if (!factory) {
      throw new Error(`Service not found: ${name}`);
    }
    return factory();
  }
}