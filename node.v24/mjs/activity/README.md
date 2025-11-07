# GitHub Activity SDK

A comprehensive Node.js SDK and CLI for the GitHub Activity API, providing easy access to events, notifications, stars, and repository watching functionality.

## Features

- 🚀 **Full API Coverage**: Complete implementation of GitHub Activity API endpoints
- 🔧 **CLI & SDK**: Use as a command-line tool or programmatic SDK
- 📄 **ES Modules**: Modern JavaScript with ES modules (.mjs)
- 🔄 **Pagination**: Built-in pagination support with async iterators
- 🔐 **Authentication**: Multiple authentication methods (token, env vars, config file)
- ⚡ **Rate Limiting**: Automatic rate limit handling with retry logic
- 📊 **Multiple Formats**: JSON, table, and CSV output formats
- 🎨 **Rich CLI**: Colorized output with progress indicators

## Installation

```bash
npm install @github/activity-sdk
```

Or install globally for CLI usage:

```bash
npm install -g @github/activity-sdk
```

## Quick Start

### CLI Usage

```bash
# Set your GitHub token
export GITHUB_TOKEN=your_token_here

# List public events
gha events list

# Check notifications
gha notifications list --unread

# Star a repository
gha stars add owner repo

# Watch a repository
gha watch add owner repo
```

### SDK Usage

```javascript
import { ActivityClient } from '@github/activity-sdk';

// Create client
const client = new ActivityClient({
  token: 'your_github_token'
});

// Get public events
const events = await client.events.listPublic();
console.log(events.data);

// Check notifications
const notifications = await client.notifications.list({ all: false });
console.log(notifications.data);

// Star a repository
await client.stars.starRepo('owner', 'repo');

// Watch a repository  
await client.watching.watchRepo('owner', 'repo');
```

## Authentication

The SDK supports multiple authentication methods:

1. **Direct token**:
```javascript
const client = new ActivityClient({ token: 'ghp_...' });
```

2. **Environment variables**:
```bash
export GITHUB_TOKEN=ghp_...
# or
export GH_TOKEN=ghp_...
```

3. **Configuration file** (`.github-activity.json`):
```json
{
  "token": "ghp_...",
  "baseUrl": "https://api.github.com",
  "perPage": 30
}
```

4. **From environment**:
```javascript
const client = await ActivityClient.fromEnvironment();
```

## CLI Commands

### Events

```bash
# List public events
gha events list [--page 1] [--per-page 30] [--type PushEvent]

# List repository events
gha events repo owner repo

# List user events
gha events user username [--public]

# List organization events
gha events org orgname

# Stream events in real-time
gha events stream [--interval 60000] [--type WatchEvent]
```

### Notifications

```bash
# List notifications
gha notifications list [--all] [--participating] [--since date]

# Mark all as read
gha notifications mark-read

# Get thread details
gha notifications thread <id>

# Mark thread as read/done
gha notifications thread-read <id>
gha notifications thread-done <id>

# Subscribe to thread
gha notifications subscribe <id> [--ignore]
```

### Stars

```bash
# List stargazers
gha stars list owner repo [--with-timestamps]

# List starred repositories
gha stars user [username]

# Check if starred
gha stars check owner repo

# Star/unstar repository
gha stars add owner repo
gha stars remove owner repo

# Get star statistics
gha stars stats owner repo
```

### Watching

```bash
# List watchers
gha watch list owner repo

# List watched repositories
gha watch user [username]

# Check subscription
gha watch check owner repo

# Watch/unwatch repository
gha watch add owner repo
gha watch remove owner repo

# Ignore repository
gha watch ignore owner repo
```

### Feeds

```bash
# List available feeds
gha feeds list

# Get all feed URLs
gha feeds get

# Get feed metadata
gha feeds metadata
```

### Utilities

```bash
# Check rate limit
gha rate-limit

# Get authenticated user
gha whoami

# Get API meta information
gha meta
```

## SDK API Reference

### ActivityClient

Main client class for interacting with the GitHub Activity API.

```javascript
const client = new ActivityClient({
  token: 'github_token',
  baseURL: 'https://api.github.com',
  timeout: 30000,
  perPage: 30,
  debug: false
});
```

### Events API

```javascript
// List public events
const { data, pagination, rateLimit } = await client.events.listPublic();

// List repository events
const events = await client.events.listForRepo('owner', 'repo');

// Stream events
const stream = client.events.streamPublic({ interval: 60000 });
for await (const event of stream) {
  console.log(event);
}

// Get paginator
const paginator = client.events.getPublicPaginator();
for await (const event of paginator) {
  console.log(event);
}
```

### Notifications API

```javascript
// List notifications
const notifications = await client.notifications.list({
  all: false,
  participating: true
});

// Mark as read
await client.notifications.markAsRead();

// Thread operations
const thread = await client.notifications.getThread(threadId);
await client.notifications.markThreadAsRead(threadId);
await client.notifications.setThreadSubscription(threadId, { ignored: false });
```

### Stars API

```javascript
// List stargazers
const stargazers = await client.stars.listStargazers('owner', 'repo', {
  withTimestamps: true
});

// Star operations
const isStarred = await client.stars.checkIfStarred('owner', 'repo');
await client.stars.starRepo('owner', 'repo');
await client.stars.unstarRepo('owner', 'repo');

// Get statistics
const stats = await client.stars.getStarStatistics('owner', 'repo');
```

### Watching API

```javascript
// List watchers
const watchers = await client.watching.listWatchers('owner', 'repo');

// Subscription operations
const subscription = await client.watching.getRepoSubscription('owner', 'repo');
await client.watching.watchRepo('owner', 'repo');
await client.watching.ignoreRepo('owner', 'repo');

// Check status
const isWatching = await client.watching.isWatching('owner', 'repo');
```

### Feeds API

```javascript
// Get feeds
const feeds = await client.feeds.getFeeds();
const timeline = await client.feeds.getTimelineFeedUrl();
const available = await client.feeds.getAllAvailableFeeds();
```

## Pagination

The SDK provides multiple ways to handle pagination:

### Using Paginators

```javascript
const paginator = client.events.getPublicPaginator({ per_page: 100 });

// Iterate through all items
for await (const event of paginator) {
  console.log(event);
}

// Or fetch all at once
const allEvents = await paginator.fetchAll();
```

### Manual Pagination

```javascript
let page = 1;
let hasMore = true;

while (hasMore) {
  const response = await client.events.listPublic({ page, per_page: 100 });
  console.log(response.data);
  
  hasMore = response.pagination?.next !== undefined;
  page++;
}
```

## Error Handling

The SDK provides detailed error handling:

```javascript
import { APIError, RateLimitError, AuthenticationError } from '@github/activity-sdk';

try {
  await client.events.listPublic();
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log(`Rate limited. Resets in ${error.getTimeUntilReset()}`);
  } else if (error instanceof AuthenticationError) {
    console.log('Authentication required');
  } else if (error instanceof APIError) {
    console.log(`API error: ${error.message} (${error.statusCode})`);
  }
}
```

## Configuration

Create a `.github-activity.json` file:

```json
{
  "token": "ghp_...",
  "baseUrl": "https://api.github.com",
  "perPage": 30,
  "timeout": 30000,
  "cache": true,
  "debug": false
}
```

## Environment Variables

- `GITHUB_TOKEN` or `GH_TOKEN`: GitHub personal access token
- `GITHUB_API_URL`: API base URL (default: https://api.github.com)
- `GITHUB_API_TIMEOUT`: Request timeout in milliseconds
- `DEBUG`: Enable debug mode

## Examples

See the `examples/` directory for more detailed examples:

- `basic-usage.mjs`: Basic SDK usage examples
- `pagination.mjs`: Pagination examples
- `streaming.mjs`: Event streaming examples
- `error-handling.mjs`: Error handling examples
- `cli-examples.md`: CLI usage examples

## Requirements

- Node.js >= 18.0.0
- GitHub personal access token (for authenticated requests)

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and questions, please use the GitHub issues page.