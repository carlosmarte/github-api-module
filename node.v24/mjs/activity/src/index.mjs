/**
 * GitHub Activity SDK
 * @module github-activity-sdk
 */

// Main client
export { ActivityClient } from './client/ActivityClient.mjs';
export { default as ActivityClient } from './client/ActivityClient.mjs';

// HTTP client and auth
export { HttpClient } from './client/http.mjs';
export { AuthConfig, createAuthConfig } from './client/auth.mjs';

// API modules
export { EventsAPI } from './api/events.mjs';
export { NotificationsAPI } from './api/notifications.mjs';
export { FeedsAPI } from './api/feeds.mjs';
export { StarsAPI } from './api/stars.mjs';
export { WatchingAPI } from './api/watching.mjs';

// Utilities
export { Paginator, parseLinkHeader, buildPaginationParams } from './utils/pagination.mjs';
export { 
  APIError, 
  RateLimitError, 
  AuthenticationError, 
  NotFoundError,
  ValidationError,
  ConfigurationError,
  isRetryableError,
  retryWithBackoff,
  sleep
} from './utils/errors.mjs';

// Types
export { Types } from './models/types.mjs';

// Factory function for quick client creation
export async function createClient(options = {}) {
  const { ActivityClient } = await import('./client/ActivityClient.mjs');
  
  // Try to create from environment if no options provided
  if (!options.token && !options.configPath) {
    return ActivityClient.fromEnvironment(options);
  }
  
  // Create from config file if path provided
  if (options.configPath) {
    return ActivityClient.fromConfig(options.configPath, options);
  }
  
  // Create with provided options
  return new ActivityClient(options);
}

// Default export
export default {
  ActivityClient,
  createClient,
  EventsAPI,
  NotificationsAPI,
  FeedsAPI,
  StarsAPI,
  WatchingAPI,
  Types
};