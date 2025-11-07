# GitHub Pull Requests CLI & SDK

A comprehensive Node.js CLI and SDK for managing GitHub Pull Requests, built from the official GitHub REST API v3 OpenAPI specification.

## Features

- 🚀 **Full API Coverage** - Complete implementation of GitHub Pull Requests API
- 💻 **CLI & SDK** - Use as command-line tool or import as JavaScript/Node.js library
- 🔄 **Pagination Support** - Automatic handling of paginated results
- 🔐 **Authentication** - Support for GitHub tokens with automatic detection
- 📊 **Multiple Output Formats** - JSON, table, and text output
- 🎨 **Interactive Mode** - Guided CLI operations with prompts
- ⚡ **ES Modules** - Modern JavaScript with full ESM support
- 🛡️ **Type Definitions** - Comprehensive JSDoc types from OpenAPI spec

## Installation

```bash
# Install globally for CLI usage
npm install -g @github-api/pulls

# Or install locally for SDK usage
npm install @github-api/pulls
```

## Quick Start

### CLI Usage

```bash
# Set your GitHub token
export GITHUB_TOKEN=your_token_here

# List open pull requests
gh-pr list --repo owner/repo

# Get pull request details
gh-pr get 123 --repo owner/repo

# Create a new pull request
gh-pr create --repo owner/repo --title "Feature" --head feature-branch --base main

# Merge a pull request
gh-pr merge 123 --repo owner/repo --method squash
```

### SDK Usage

```javascript
import { createClient } from '@github-api/pulls';

// Create client
const client = createClient({
  auth: 'your-github-token',
  owner: 'owner',
  repo: 'repository'
});

// List pull requests
const prs = await client.list({ state: 'open' });

// Get a specific PR
const pr = await client.get(123);

// Create a new PR
const newPR = await client.create({
  title: 'New Feature',
  head: 'feature-branch',
  base: 'main',
  body: 'Description of changes'
});

// Merge a PR
await client.merge(123, { merge_method: 'squash' });
```

## Configuration

### Environment Variables

- `GITHUB_TOKEN` or `GH_TOKEN` - GitHub authentication token
- `GITHUB_OWNER` - Default repository owner
- `GITHUB_REPO` - Default repository name
- `GITHUB_API_URL` - Custom API endpoint (for GitHub Enterprise)

### Configuration File

Create `.gh-pr.json` in your project or home directory:

```json
{
  "owner": "your-org",
  "repo": "your-repo",
  "baseUrl": "https://api.github.com",
  "outputFormat": "table",
  "perPage": 30
}
```

Initialize configuration:
```bash
gh-pr config --init
```

## CLI Commands

### List Pull Requests
```bash
gh-pr list [options]
  -s, --state <state>      Filter by state (open, closed, all) [default: open]
  -b, --base <branch>      Filter by base branch
  -h, --head <branch>      Filter by head branch
  --sort <field>           Sort by (created, updated, popularity) [default: created]
  --direction <dir>        Sort direction (asc, desc) [default: desc]
  -l, --limit <number>     Maximum number of results
  --all                    Fetch all pages
```

### Get Pull Request
```bash
gh-pr get <number> [options]
  --comments               Include comments
  --reviews                Include reviews
  --commits                Include commits
  --files                  Include changed files
```

### Create Pull Request
```bash
gh-pr create [options]
  --title <title>          PR title
  --body <body>            PR description
  --head <branch>          Head branch
  --base <branch>          Base branch
  --draft                  Create as draft
  -i, --interactive        Interactive mode
```

### Update Pull Request
```bash
gh-pr update <number> [options]
  --title <title>          New title
  --body <body>            New description
  --base <branch>          New base branch
  --state <state>          State (open, closed)
```

### Merge Pull Request
```bash
gh-pr merge <number> [options]
  --method <method>        Merge method (merge, squash, rebase) [default: merge]
  --title <title>          Merge commit title
  --message <message>      Merge commit message
  --confirm                Skip confirmation prompt
```

### Review Pull Request
```bash
gh-pr review <number> [options]
  --approve                Approve the PR
  --request-changes        Request changes
  --comment <comment>      Add a comment
  -i, --interactive        Interactive mode
```

### Search Pull Requests
```bash
gh-pr search <query> [options]
  --repo <owner/repo>      Search in specific repository
  --author <username>      Filter by author
  --assignee <username>    Filter by assignee
  --label <label>          Filter by label
  --sort <field>           Sort by (created, updated, comments)
  --order <dir>            Sort order (asc, desc)
  -l, --limit <number>     Maximum number of results
```

### Other Commands
```bash
# Manage comments
gh-pr comments <number> [options]

# Show changed files
gh-pr files <number> [options]

# Interactive mode
gh-pr interactive

# Manage configuration
gh-pr config [options]
```

## SDK API Reference

### Client Creation

```javascript
import { createClient, PullRequestClient } from '@github-api/pulls';

// Using factory function
const client = createClient({
  auth: 'github-token',
  owner: 'owner',
  repo: 'repo',
  baseUrl: 'https://api.github.com'
});

// Using class directly
const client = new PullRequestClient({
  auth: 'github-token',
  owner: 'owner',
  repo: 'repo'
});
```

### Methods

#### List Pull Requests
```javascript
const prs = await client.list({
  state: 'open',        // 'open', 'closed', 'all'
  head: 'user:branch',  // Filter by head
  base: 'main',         // Filter by base
  sort: 'created',      // 'created', 'updated', 'popularity'
  direction: 'desc',    // 'asc', 'desc'
  per_page: 30,         // Results per page
  page: 1               // Page number
});
```

#### Get Pull Request
```javascript
const pr = await client.get(pullNumber);
```

#### Create Pull Request
```javascript
const pr = await client.create({
  title: 'PR Title',
  head: 'feature-branch',
  base: 'main',
  body: 'Description',
  draft: false,
  maintainer_can_modify: true
});
```

#### Update Pull Request
```javascript
const pr = await client.update(pullNumber, {
  title: 'New Title',
  body: 'New Description',
  state: 'closed',
  base: 'develop'
});
```

#### Merge Pull Request
```javascript
const result = await client.merge(pullNumber, {
  merge_method: 'squash',     // 'merge', 'squash', 'rebase'
  commit_title: 'Merge Title',
  commit_message: 'Merge Message'
});
```

#### Reviews
```javascript
// List reviews
const reviews = await client.listReviews(pullNumber);

// Create review
const review = await client.createReview(pullNumber, {
  body: 'Review comment',
  event: 'APPROVE'  // 'APPROVE', 'REQUEST_CHANGES', 'COMMENT'
});
```

#### Review Comments
```javascript
// List review comments
const comments = await client.listReviewComments(pullNumber);

// Create review comment
const comment = await client.createReviewComment(pullNumber, {
  body: 'Comment text',
  commit_id: 'sha',
  path: 'file.js',
  line: 10,
  side: 'RIGHT'  // 'LEFT', 'RIGHT'
});
```

#### Other Operations
```javascript
// List commits
const commits = await client.listCommits(pullNumber);

// List files
const files = await client.listFiles(pullNumber);

// Check if merged
const isMerged = await client.isMerged(pullNumber);

// Request reviewers
await client.requestReviewers(pullNumber, {
  reviewers: ['user1', 'user2'],
  team_reviewers: ['team1']
});

// Update branch
await client.updateBranch(pullNumber);

// Search pull requests
const results = await client.search('bug fix', {
  sort: 'created',
  order: 'desc'
});
```

### Pagination

```javascript
// Using async generator
for await (const pr of client.listAll({ state: 'open' })) {
  console.log(pr.title);
}

// Collect all pages
import { collectAllPages } from '@github-api/pulls';

const allPRs = await collectAllPages(
  (page) => client.list({ page, per_page: 100 })
);
```

### Rate Limiting

The library includes intelligent rate limiting to prevent hitting GitHub's API limits:

```javascript
import { RateLimitedPullRequestClient } from '@github-api/pulls';

// Create a rate-limited client (enabled by default in production)
const client = new RateLimitedPullRequestClient({
  owner: 'facebook',
  repo: 'react',
  enableRateLimiting: true // Optional, true by default
});

// Check current rate limit status
const status = await client.getRateLimitStatus();
console.log(`Remaining requests: ${status.core.remaining}/${status.core.limit}`);
console.log(`Resets at: ${status.core.reset}`);

// The client automatically:
// - Queues requests when approaching limits
// - Reads rate limit info from GitHub's response headers
// - Handles separate limits for core and search APIs
// - Provides graceful degradation when limits are exceeded
```

Features:
- **Automatic request queuing** - Requests are queued when approaching rate limits
- **Dynamic rate limit detection** - Reads actual limits from GitHub API responses
- **Separate limiters** - Different rate limits for core API (5000/hour) and search API (30/minute)
- **Configurable** - Can be disabled for testing with `enableRateLimiting: false`
- **Environment control** - Set `DISABLE_RATE_LIMITING=true` to disable globally

### Error Handling

```javascript
import { ApiError, AuthError, RateLimitError } from '@github-api/pulls';

try {
  const pr = await client.get(123);
} catch (error) {
  if (error instanceof AuthError) {
    console.error('Authentication failed:', error.message);
  } else if (error instanceof RateLimitError) {
    const resetIn = error.getTimeUntilReset();
    console.error(`Rate limited. Resets in ${resetIn} seconds`);
  } else if (error instanceof ApiError) {
    console.error(`API error (${error.status}):`, error.message);
  }
}
```

## Types

The library includes comprehensive JSDoc type definitions extracted from the OpenAPI specification:

```javascript
/**
 * @typedef {Object} PullRequest
 * @typedef {Object} PullRequestReviewComment
 * @typedef {Object} Review
 * @typedef {Object} SimpleUser
 * @typedef {Object} Repository
 * @typedef {Object} Milestone
 * @typedef {Object} Label
 * @typedef {Object} Team
 * @typedef {Object} Commit
 * @typedef {Object} DiffEntry
 */
```

## Authentication

The library supports multiple authentication methods:

1. **Environment Variables** (recommended)
   ```bash
   export GITHUB_TOKEN=ghp_xxxxxxxxxxxx
   ```

2. **Configuration File**
   ```json
   {
     "auth": "ghp_xxxxxxxxxxxx"
   }
   ```

3. **Programmatic**
   ```javascript
   const client = createClient({
     auth: 'ghp_xxxxxxxxxxxx'
   });
   ```

## Examples

See the `examples/` directory for more detailed examples:

- `basic-usage.mjs` - Basic SDK usage examples
- `cli-examples.md` - CLI usage examples

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run CLI locally
node cli.mjs list --repo owner/repo
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and questions, please use the [GitHub Issues](https://github.com/yourusername/github-api-pulls/issues) page.