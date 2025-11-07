# GitHub Users API

[![npm version](https://badge.fury.io/js/%40github-api%2Fusers.svg)](https://badge.fury.io/js/%40github-api%2Fusers)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A complete Node.js CLI and SDK for the GitHub Users API, providing both command-line tools and programmatic access to all GitHub user-related operations.

## Features

- 🔐 **Complete Authentication Support** - Personal access tokens, OAuth, and GitHub Apps
- 👤 **Profile Management** - Get and update authenticated user profiles
- 📧 **Email Management** - Add, remove, and list user email addresses
- 🔍 **User Discovery** - Search and retrieve public user information
- 🏷️ **Contextual Information** - Get user hovercard/context data
- ⚡ **Rate Limiting** - Built-in rate limiting with automatic retry
- 🎯 **Dual Interface** - Use as CLI tool or import as SDK
- 📊 **Rich Output** - Formatted tables, JSON output, and verbose logging
- ✅ **Full TypeScript Support** - Complete type definitions included
- 🧪 **Comprehensive Testing** - High test coverage with mock support

## Installation

```bash
npm install @github-api/users
```

Or install globally for CLI usage:

```bash
npm install -g @github-api/users
```

## Quick Start

### CLI Usage

```bash
# Set your GitHub token
export GITHUB_TOKEN="your-token-here"

# Get your profile
gh-users profile show

# Get another user's information
gh-users user get octocat

# List your email addresses
gh-users email list

# Get user context information
gh-users context get octocat
```

### SDK Usage

```javascript
import { createClient } from '@github-api/users';

// Create a client
const client = createClient({
  token: process.env.GITHUB_TOKEN
});

// Get authenticated user
const me = await client.profile.getAuthenticated();
console.log(`Hello, ${me.name}!`);

// Get any user's public information
const user = await client.discovery.getByUsername('octocat');
console.log(`${user.name} has ${user.public_repos} public repositories`);
```

## Authentication

### Setting up Authentication

The library supports multiple authentication methods:

1. **Environment Variable** (recommended):
   ```bash
   export GITHUB_TOKEN="ghp_your_token_here"
   ```

2. **CLI Option**:
   ```bash
   gh-users --token "ghp_your_token_here" profile show
   ```

3. **Programmatic**:
   ```javascript
   const client = createClient({
     token: 'ghp_your_token_here'
   });
   ```

### Token Scopes

Different operations require different token scopes:

- **Profile operations**: `user` scope for private info, public access for basic info
- **Email management**: `user:email` scope for listing, `user` scope for adding/removing
- **User discovery**: No authentication required for public information
- **Context information**: `repo` scope may be required for some contexts

## CLI Reference

### Global Options

- `--token <token>` - GitHub personal access token
- `--base-url <url>` - GitHub API base URL (for Enterprise)
- `--timeout <ms>` - Request timeout in milliseconds
- `--no-rate-limit` - Disable rate limiting
- `--json` - Output results as JSON
- `--verbose` - Enable verbose logging
- `--quiet` - Suppress output except errors
- `--no-color` - Disable colored output

### Profile Commands

```bash
# Show your profile
gh-users profile show

# Update your profile
gh-users profile update --name "Your Name" --bio "Your bio" --location "Your City"
gh-users profile update --company "Your Company" --blog "https://yourblog.com"
gh-users profile update --hireable  # Set as hireable
gh-users profile update --not-hireable  # Set as not hireable
```

### Email Commands

```bash
# List email addresses
gh-users email list
gh-users email list --verified    # Only verified emails
gh-users email list --primary     # Only primary email

# Add email addresses
gh-users email add user@example.com
gh-users email add user1@example.com user2@example.com

# Remove email addresses
gh-users email delete user@example.com
gh-users email remove user1@example.com user2@example.com  # alias
```

### User Discovery Commands

```bash
# Get user by username
gh-users user get octocat
gh-users user get github

# List users
gh-users user list
gh-users user list --since 1000 --per-page 50
gh-users user list --type User      # Only user accounts
gh-users user list --type Organization  # Only organization accounts
```

### Context Commands

```bash
# Get user context
gh-users context get octocat

# Get context with subject information
gh-users context get octocat --subject-type repository --subject-id 1296269
gh-users context get octocat --subject-type organization --subject-id github
```

### Utility Commands

```bash
# Test authentication
gh-users auth-test
```

## SDK Reference

### Creating a Client

```javascript
import { createClient } from '@github-api/users';

const client = createClient({
  token: 'your-token-here',
  baseUrl: 'https://api.github.com',  // Custom GitHub Enterprise URL
  timeout: 10000,  // Request timeout in ms
  rateLimiting: {
    enabled: true,
    maxRequests: 5000  // Requests per hour
  }
});
```

### Profile API

```javascript
// Get authenticated user
const user = await client.profile.getAuthenticated();

// Update authenticated user
const updated = await client.profile.updateAuthenticated({
  name: 'New Name',
  bio: 'Updated biography',
  location: 'New Location',
  company: 'New Company',
  blog: 'https://newblog.com',
  twitter_username: 'newhandle',
  hireable: true
});

// Get public profile only
const publicProfile = await client.profile.getPublicProfile();

// Get disk usage information
const usage = await client.profile.getDiskUsage();

// Get plan information
const plan = await client.profile.getPlan();
```

### Email API

```javascript
// List all emails
const emails = await client.emails.list();

// Add email addresses
const added = await client.emails.add('user@example.com');
const addedMultiple = await client.emails.add([
  'user1@example.com',
  'user2@example.com'
]);

// Remove email addresses
await client.emails.delete('user@example.com');
await client.emails.delete(['user1@example.com', 'user2@example.com']);

// Get specific email types
const primary = await client.emails.getPrimary();
const verified = await client.emails.getVerified();
const unverified = await client.emails.getUnverified();

// Check if email exists
const exists = await client.emails.exists('user@example.com');

// Get email statistics
const stats = await client.emails.getStats();
```

### Discovery API

```javascript
// List users
const users = await client.discovery.list({
  since: 1000,      // Start from user ID
  per_page: 50      // Results per page
});

// Get user by username
const user = await client.discovery.getByUsername('octocat');

// Get user by ID
const userById = await client.discovery.getById(583231);

// Search users
const searchResults = await client.discovery.search({
  type: 'User',     // Filter by type
  minId: 1000,      // Minimum user ID
  maxId: 2000       // Maximum user ID
});

// Check if username exists
const exists = await client.discovery.exists('octocat');

// Get user statistics
const stats = await client.discovery.getStats('octocat');

// Get multiple users
const { successful, failed } = await client.discovery.getMultipleByUsername([
  'octocat', 'github', 'nonexistent'
], { continueOnError: true });
```

### Context API

```javascript
// Get user context
const context = await client.context.getForUser('octocat');

// Get context with subject information
const repoContext = await client.context.getForUserInRepository('octocat', '1296269');
const orgContext = await client.context.getForUserInOrganization('octocat', 'github');
const issueContext = await client.context.getForUserInIssue('octocat', '123');

// Get context for multiple users
const { successful, failed } = await client.context.getForMultipleUsers([
  'octocat', 'github'
], { continueOnError: true });

// Get context summary
const summary = await client.context.getSummary('octocat');
```

### Convenience Functions

```javascript
import { getUser, listUsers, getAuthenticatedUser, listEmails } from '@github-api/users';

// Quick user lookup
const user = await getUser('octocat', { token: 'your-token' });

// Quick user listing
const users = await listUsers({ token: 'your-token', per_page: 10 });

// Quick authenticated user
const me = await getAuthenticatedUser({ token: 'your-token' });

// Quick email listing
const emails = await listEmails({ token: 'your-token' });
```

## Error Handling

The library provides specific error types for different scenarios:

```javascript
import { 
  UsersError, 
  AuthError, 
  ValidationError, 
  RateLimitError,
  NotFoundError 
} from '@github-api/users';

try {
  const user = await client.profile.getAuthenticated();
} catch (error) {
  if (error instanceof AuthError) {
    console.log('Authentication failed:', error.message);
  } else if (error instanceof RateLimitError) {
    console.log('Rate limited. Try again in:', error.getTimeUntilResetString());
  } else if (error instanceof ValidationError) {
    console.log('Validation errors:', error.getValidationErrors());
  } else if (error instanceof NotFoundError) {
    console.log('Resource not found:', error.message);
  } else {
    console.log('Other error:', error.message);
  }
}
```

## Pagination

The library supports both manual and automatic pagination:

```javascript
import { paginate, paginateAll, autoPaginate } from '@github-api/users';

// Manual pagination
const page1 = await client.discovery.list({ page: 1, per_page: 100 });
const page2 = await client.discovery.list({ page: 2, per_page: 100 });

// Automatic pagination - collect all results
const allUsers = await paginateAll(() => client.discovery.list({ per_page: 100 }));

// Iterate through all pages
for await (const user of autoPaginate(() => client.discovery.list({ per_page: 100 }))) {
  console.log(user.login);
}
```

## Rate Limiting

Built-in rate limiting is enabled by default:

```javascript
const client = createClient({
  token: 'your-token',
  rateLimiting: {
    enabled: true,
    maxRequests: 5000,  // GitHub's default limit
    window: 3600000     // 1 hour in milliseconds
  }
});

// Check current rate limit status
const rateLimit = await client.getRateLimit();
console.log(`Remaining: ${rateLimit.resources.core.remaining}`);
```

## Examples

See the [`examples/`](./examples/) directory for complete usage examples:

- [`basic-usage.mjs`](./examples/basic-usage.mjs) - Basic SDK usage patterns

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and add tests
4. Run the test suite: `npm test`
5. Commit your changes: `git commit -am 'Add feature'`
6. Push to the branch: `git push origin feature-name`
7. Submit a pull request

## License

MIT © [GitHub API Module](LICENSE)

## API Coverage

This library implements all GitHub Users API endpoints:

- ✅ `GET /user` - Get authenticated user
- ✅ `PATCH /user` - Update authenticated user
- ✅ `GET /user/emails` - List user emails
- ✅ `POST /user/emails` - Add user emails
- ✅ `DELETE /user/emails` - Delete user emails
- ✅ `GET /users` - List users
- ✅ `GET /users/{username}` - Get user by username
- ✅ `GET /user/{account_id}` - Get user by ID
- ✅ `GET /users/{username}/hovercard` - Get user context

## Related Packages

- [`@github-api/repos`](../repos/) - Repository management
- [`@github-api/issues`](../issues/) - Issue management
- [`@github-api/pulls`](../pulls/) - Pull request management