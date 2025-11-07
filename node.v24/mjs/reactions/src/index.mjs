/**
 * Main SDK entry point for GitHub Reactions API
 * @module index
 */

// Re-export main functionality
export { ReactionsClient } from './client/ReactionsClient.mjs';
export { createClient, Container } from './bootstrap.mjs';

// Re-export types and constants
export {
  REACTION_CONTENT,
  RELEASE_REACTION_CONTENT,
  Types
} from './core/types.mjs';

// Re-export errors
export {
  GitHubReactionsError,
  ValidationError,
  AuthenticationError,
  NotFoundError,
  ForbiddenError,
  RateLimitError,
  NetworkError,
  TimeoutError,
  ConfigurationError,
  ErrorHandler
} from './core/errors.mjs';

// Re-export utilities
export { loadConfig } from './utils/config.mjs';
export { createLogger } from './utils/logger.mjs';

// Default export
export { createClient as default } from './bootstrap.mjs';