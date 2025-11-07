/**
 * Core type definitions for GitHub Reactions API
 * @module core/types
 */

/**
 * @typedef {Object} Config
 * @property {string} [token] - GitHub personal access token
 * @property {string} [baseUrl='https://api.github.com'] - GitHub API base URL
 * @property {number} [timeout=30000] - Request timeout in milliseconds
 * @property {number} [retries=3] - Number of retries for failed requests
 * @property {PaginationOptions} [pagination] - Default pagination options
 * @property {LoggingOptions} [logging] - Logging configuration
 */

/**
 * @typedef {Object} PaginationOptions
 * @property {number} [perPage=30] - Number of results per page (max 100)
 * @property {number} [page=1] - Page number to fetch
 * @property {boolean} [autoPage=false] - Automatically fetch all pages
 */

/**
 * @typedef {Object} LoggingOptions
 * @property {'error'|'warn'|'info'|'debug'|'verbose'} [level='info'] - Log level
 * @property {boolean} [console=true] - Log to console
 * @property {string} [file] - Log file path
 */

/**
 * @typedef {Object} SimpleUser
 * @property {string} login - GitHub username
 * @property {number} id - User ID
 * @property {string} node_id - GraphQL node ID
 * @property {string} avatar_url - Avatar URL
 * @property {string|null} gravatar_id - Gravatar ID
 * @property {string} url - User API URL
 * @property {string} html_url - User profile URL
 * @property {string} followers_url - Followers API URL
 * @property {string} following_url - Following API URL template
 * @property {string} gists_url - Gists API URL template
 * @property {string} starred_url - Starred repos API URL template
 * @property {string} subscriptions_url - Subscriptions API URL
 * @property {string} organizations_url - Organizations API URL
 * @property {string} repos_url - Repositories API URL
 * @property {string} events_url - Events API URL template
 * @property {string} received_events_url - Received events API URL
 * @property {string} type - User type (User, Bot, etc.)
 * @property {boolean} site_admin - Whether user is a site admin
 * @property {string} [name] - Display name
 * @property {string} [email] - Email address
 * @property {string} [starred_at] - Starred at timestamp
 * @property {string} [user_view_type] - User view type
 */

/**
 * @typedef {Object} Reaction
 * @property {number} id - Reaction ID
 * @property {string} node_id - GraphQL node ID
 * @property {SimpleUser|null} user - User who created the reaction
 * @property {ReactionContent} content - The reaction type
 * @property {string} created_at - Creation timestamp in ISO 8601 format
 */

/**
 * @typedef {''+1''|''-1''|''laugh''|''confused''|''heart''|''hooray''|''rocket''|''eyes''} ReactionContent
 */

/**
 * @typedef {''+1''|''laugh''|''heart''|''hooray''|''rocket''|''eyes''} ReleaseReactionContent
 */

/**
 * @typedef {Object} BasicError
 * @property {string} message - Error message
 * @property {string} [documentation_url] - Documentation URL
 * @property {string} [url] - API URL
 * @property {string} [status] - HTTP status
 */

/**
 * @typedef {Object} ValidationError
 * @property {string} message - Error message
 * @property {string} documentation_url - Documentation URL
 * @property {ValidationErrorItem[]} [errors] - Validation errors
 */

/**
 * @typedef {Object} ValidationErrorItem
 * @property {string} code - Error code
 * @property {string} [resource] - Resource name
 * @property {string} [field] - Field name
 * @property {string} [message] - Error message
 * @property {number} [index] - Array index
 * @property {string|number|string[]|null} [value] - Invalid value
 */

/**
 * @typedef {Object} ListReactionsOptions
 * @property {ReactionContent} [content] - Filter by reaction type
 * @property {number} [perPage=30] - Results per page (max 100)
 * @property {number} [page=1] - Page number
 * @property {boolean} [autoPage=false] - Fetch all pages automatically
 */

/**
 * @typedef {Object} ListReleaseReactionsOptions
 * @property {ReleaseReactionContent} [content] - Filter by reaction type
 * @property {number} [perPage=30] - Results per page (max 100)
 * @property {number} [page=1] - Page number
 * @property {boolean} [autoPage=false] - Fetch all pages automatically
 */

/**
 * @typedef {Object} CreateReactionOptions
 * @property {ReactionContent} content - The reaction type to add
 */

/**
 * @typedef {Object} CreateReleaseReactionOptions
 * @property {ReleaseReactionContent} content - The reaction type to add
 */

/**
 * @typedef {Object} PaginatedResponse
 * @property {any[]} data - Response data
 * @property {PaginationInfo} pagination - Pagination information
 */

/**
 * @typedef {Object} PaginationInfo
 * @property {number} page - Current page
 * @property {number} perPage - Results per page
 * @property {number} [totalPages] - Total pages (if available)
 * @property {string} [nextUrl] - Next page URL
 * @property {string} [prevUrl] - Previous page URL
 * @property {string} [firstUrl] - First page URL
 * @property {string} [lastUrl] - Last page URL
 */

// Reaction content enum values
export const REACTION_CONTENT = {
  PLUS_ONE: '+1',
  MINUS_ONE: '-1',
  LAUGH: 'laugh',
  CONFUSED: 'confused',
  HEART: 'heart',
  HOORAY: 'hooray',
  ROCKET: 'rocket',
  EYES: 'eyes'
};

// Release reaction content enum values (subset of regular reactions)
export const RELEASE_REACTION_CONTENT = {
  PLUS_ONE: '+1',
  LAUGH: 'laugh',
  HEART: 'heart',
  HOORAY: 'hooray',
  ROCKET: 'rocket',
  EYES: 'eyes'
};

// Export type definitions for runtime use
export const Types = {
  Config: /** @type {Config} */ ({}),
  Reaction: /** @type {Reaction} */ ({}),
  SimpleUser: /** @type {SimpleUser} */ ({}),
  ListReactionsOptions: /** @type {ListReactionsOptions} */ ({}),
  CreateReactionOptions: /** @type {CreateReactionOptions} */ ({}),
  PaginatedResponse: /** @type {PaginatedResponse} */ ({}),
};