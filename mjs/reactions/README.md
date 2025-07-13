# GitHub Reactions API CLI & SDK

A comprehensive Node.js CLI tool and SDK for interacting with GitHub's reactions API. Built with modern ES modules, full TypeScript support via JSDoc, and robust error handling.

[![npm version](https://badge.fury.io/js/@github-api%2Freactions.svg)](https://badge.fury.io/js/@github-api%2Freactions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

✅ **Complete API Coverage** - All GitHub reactions endpoints  
✅ **CLI & SDK** - Use as command-line tool or import as Node.js module  
✅ **Modern ES Modules** - No build step required, runs on Node.js 18+  
✅ **TypeScript Support** - Full type definitions via JSDoc  
✅ **Error Handling** - Comprehensive error types and retry logic  
✅ **Rate Limiting** - Automatic GitHub rate limit handling  
✅ **Pagination** - Manual and automatic pagination support  
✅ **Configuration** - Multiple config sources (env vars, files)  
✅ **Logging** - Structured logging with Winston  

## Supported GitHub Entities

- 🐛 **Issues** - React to issues
- 💬 **Issue Comments** - React to issue comments
- 📝 **Commit Comments** - React to commit comments  
- 🔍 **PR Review Comments** - React to pull request review comments
- 🚀 **Releases** - React to releases (limited reaction types)
- 💭 **Team Discussions** - React to team discussions
- 💬 **Team Discussion Comments** - React to team discussion comments

## Available Reactions

Regular reactions: `+1`, `-1`, `laugh`, `confused`, `heart`, `hooray`, `rocket`, `eyes`  
Release reactions: `+1`, `laugh`, `heart`, `hooray`, `rocket`, `eyes` (no `-1` or `confused`)

## Installation

### Global CLI Installation
```bash
npm install -g @github-api/reactions
```

### Local Project Installation
```bash
npm install @github-api/reactions
```

## Quick Start

### CLI Usage

Set your GitHub token:
```bash
export GITHUB_TOKEN=your_github_token_here
```

List reactions for an issue:
```bash
github-reactions list --resource issue --owner octocat --repo Hello-World --issue-number 1
```

Create a heart reaction:
```bash
github-reactions create --resource issue --owner octocat --repo Hello-World --issue-number 1 --content heart
```

Delete a reaction:
```bash
github-reactions delete --resource issue --owner octocat --repo Hello-World --issue-number 1 --reaction-id 12345
```

### SDK Usage

```javascript
import { createClient, REACTION_CONTENT } from '@github-api/reactions';

// Create client
const client = await createClient({
  token: 'your_github_token_here'
});

// List reactions for an issue
const { data: reactions } = await client.listForIssue('octocat', 'Hello-World', 1);
console.log(`Found ${reactions.length} reactions`);

// Create a reaction
const reaction = await client.createForIssue('octocat', 'Hello-World', 1, {
  content: REACTION_CONTENT.HEART
});
console.log(`Created reaction: ${reaction.content}`);

// Delete a reaction
await client.deleteForIssue('octocat', 'Hello-World', 1, reaction.id);
console.log('Reaction deleted');
```

## CLI Commands

### `list` - List Reactions

List reactions for various GitHub entities with filtering and pagination.

```bash
github-reactions list [options]

Options:
  -r, --resource <type>         Resource type (required)
  --owner <owner>              Repository owner
  --repo <repo>                Repository name  
  --org <org>                  Organization name
  --team-slug <slug>           Team slug
  --issue-number <number>      Issue number
  --comment-id <id>            Comment ID
  --release-id <id>            Release ID
  --discussion-number <number> Discussion number
  --comment-number <number>    Comment number (for team discussions)
  --content <type>             Filter by reaction type
  --per-page <number>          Results per page (max 100, default: 30)
  --page <number>              Page number (default: 1)
  --all-pages                  Fetch all pages automatically
  -o, --output <format>        Output format: json, table (default: table)
  -t, --token <token>          GitHub personal access token
  -v, --verbose                Enable verbose output
```

### `create` - Create Reaction

Create a reaction for a GitHub entity.

```bash
github-reactions create [options]

Options:
  -r, --resource <type>         Resource type (required)
  --content <type>             Reaction content (required)
  --owner <owner>              Repository owner
  --repo <repo>                Repository name
  --org <org>                  Organization name
  --team-slug <slug>           Team slug
  --issue-number <number>      Issue number
  --comment-id <id>            Comment ID
  --release-id <id>            Release ID
  --discussion-number <number> Discussion number
  --comment-number <number>    Comment number (for team discussions)
  -o, --output <format>        Output format: json, table (default: table)
  -t, --token <token>          GitHub personal access token
```

### `delete` - Delete Reaction

Delete a reaction from a GitHub entity.

```bash
github-reactions delete [options]

Options:
  -r, --resource <type>         Resource type (required)
  --reaction-id <id>           Reaction ID to delete (required)
  --owner <owner>              Repository owner
  --repo <repo>                Repository name
  --org <org>                  Organization name
  --team-slug <slug>           Team slug
  --issue-number <number>      Issue number
  --comment-id <id>            Comment ID
  --release-id <id>            Release ID
  --discussion-number <number> Discussion number
  --comment-number <number>    Comment number (for team discussions)
  -t, --token <token>          GitHub personal access token
```

### Resource Types

- `issue` - Issues
- `issue-comment` - Issue comments
- `commit-comment` - Commit comments
- `pr-comment` - Pull request review comments
- `release` - Releases
- `team-discussion` - Team discussions
- `team-discussion-comment` - Team discussion comments

## SDK API Reference

### Client Creation

```javascript
import { createClient } from '@github-api/reactions';

const client = await createClient({
  token: 'your_token',           // GitHub token (required)
  baseUrl: 'https://api.github.com', // API base URL (optional)
  timeout: 30000,                // Request timeout in ms (optional)
  retries: 3,                    // Number of retries (optional)
  logging: {                     // Logging configuration (optional)
    level: 'info',               // Log level
    console: true                // Log to console
  }
});
```

### Issue Reactions

```javascript
// List reactions for an issue
const { data, pagination } = await client.listForIssue(owner, repo, issueNumber, {
  content: 'heart',    // Filter by reaction type (optional)
  perPage: 30,         // Results per page (optional)
  page: 1,             // Page number (optional)
  autoPage: false      // Fetch all pages (optional)
});

// Create reaction for an issue
const reaction = await client.createForIssue(owner, repo, issueNumber, {
  content: 'heart'     // Reaction type (required)
});

// Delete reaction from an issue
await client.deleteForIssue(owner, repo, issueNumber, reactionId);
```

### Issue Comment Reactions

```javascript
// List reactions for an issue comment
const { data } = await client.listForIssueComment(owner, repo, commentId);

// Create reaction for an issue comment
const reaction = await client.createForIssueComment(owner, repo, commentId, {
  content: '+1'
});

// Delete reaction from an issue comment
await client.deleteForIssueComment(owner, repo, commentId, reactionId);
```

### Commit Comment Reactions

```javascript
// List reactions for a commit comment
const { data } = await client.listForCommitComment(owner, repo, commentId);

// Create reaction for a commit comment
const reaction = await client.createForCommitComment(owner, repo, commentId, {
  content: 'rocket'
});

// Delete reaction from a commit comment
await client.deleteForCommitComment(owner, repo, commentId, reactionId);
```

### Pull Request Review Comment Reactions

```javascript
// List reactions for a PR review comment
const { data } = await client.listForPullRequestReviewComment(owner, repo, commentId);

// Create reaction for a PR review comment
const reaction = await client.createForPullRequestReviewComment(owner, repo, commentId, {
  content: 'eyes'
});

// Delete reaction from a PR review comment
await client.deleteForPullRequestComment(owner, repo, commentId, reactionId);
```

### Release Reactions

```javascript
// List reactions for a release (limited reaction types)
const { data } = await client.listForRelease(owner, repo, releaseId);

// Create reaction for a release
const reaction = await client.createForRelease(owner, repo, releaseId, {
  content: 'hooray'    // Only: +1, laugh, heart, hooray, rocket, eyes
});

// Delete reaction from a release
await client.deleteForRelease(owner, repo, releaseId, reactionId);
```

### Team Discussion Reactions

```javascript
// List reactions for a team discussion
const { data } = await client.listForTeamDiscussion(org, teamSlug, discussionNumber);

// Create reaction for a team discussion
const reaction = await client.createForTeamDiscussion(org, teamSlug, discussionNumber, {
  content: 'laugh'
});

// Delete reaction from a team discussion
await client.deleteForTeamDiscussion(org, teamSlug, discussionNumber, reactionId);
```

### Team Discussion Comment Reactions

```javascript
// List reactions for a team discussion comment
const { data } = await client.listForTeamDiscussionComment(org, teamSlug, discussionNumber, commentNumber);

// Create reaction for a team discussion comment
const reaction = await client.createForTeamDiscussionComment(org, teamSlug, discussionNumber, commentNumber, {
  content: 'confused'
});

// Delete reaction from a team discussion comment
await client.deleteForTeamDiscussionComment(org, teamSlug, discussionNumber, commentNumber, reactionId);
```

## Configuration

### Environment Variables

```bash
GITHUB_TOKEN=your_github_token        # GitHub personal access token (required)
GITHUB_API_URL=https://api.github.com # GitHub API base URL (optional)
GITHUB_TIMEOUT=30000                  # Request timeout in milliseconds (optional)
GITHUB_RETRIES=3                      # Number of request retries (optional)
GITHUB_PER_PAGE=30                    # Default results per page (optional)
LOG_LEVEL=info                        # Log level (optional)
```

### Configuration File

Create a `.github-reactions.json` file in your project root or home directory:

```json
{
  "token": "your_github_token",
  "baseUrl": "https://api.github.com",
  "timeout": 30000,
  "retries": 3,
  "pagination": {
    "perPage": 30
  },
  "logging": {
    "level": "info",
    "console": true,
    "file": "./reactions.log"
  }
}
```

Configuration is loaded from (in order of precedence):
1. Direct configuration passed to `createClient()`
2. Environment variables
3. Configuration file specified via parameter
4. Default configuration file locations:
   - `.github-reactions.json` (current directory)
   - `~/.github-reactions.json` (home directory)  
   - `~/.config/github-reactions.json` (config directory)

## Error Handling

The SDK provides comprehensive error handling with specific error types:

```javascript
import { 
  GitHubReactionsError,
  ValidationError,
  AuthenticationError,
  NotFoundError,
  RateLimitError,
  ErrorHandler
} from '@github-api/reactions';

try {
  await client.createForIssue('owner', 'repo', 1, { content: 'invalid' });
} catch (error) {
  const handledError = ErrorHandler.handle(error);
  
  if (error instanceof ValidationError) {
    console.error('Validation failed:', error.message);
  } else if (error instanceof AuthenticationError) {
    console.error('Authentication required:', error.message);
  } else if (error instanceof RateLimitError) {
    console.error('Rate limit exceeded:', error.message);
    console.log('Resets at:', new Date(error.details.resetTime * 1000));
  }
}
```

### Error Types

- `ValidationError` - Invalid input parameters
- `AuthenticationError` - Missing or invalid GitHub token
- `NotFoundError` - Resource not found (404)
- `ForbiddenError` - Insufficient permissions (403)
- `RateLimitError` - GitHub rate limit exceeded (429)
- `NetworkError` - Network connectivity issues
- `TimeoutError` - Request timeout
- `ConfigurationError` - Invalid configuration

## Pagination

### Automatic Pagination

```javascript
// Fetch all reactions across all pages
const { data: allReactions } = await client.listForIssue('owner', 'repo', 1, {
  autoPage: true
});
```

### Manual Pagination

```javascript
let page = 1;
let hasMore = true;

while (hasMore) {
  const { data: reactions, pagination } = await client.listForIssue('owner', 'repo', 1, {
    page,
    perPage: 50
  });
  
  console.log(`Page ${page}: ${reactions.length} reactions`);
  
  hasMore = pagination.nextUrl !== undefined;
  page++;
}
```

## Rate Limiting

The client automatically handles GitHub's rate limiting:

- Detects rate limit responses (429)
- Waits for rate limit reset automatically  
- Exponential backoff for retries
- Respects `x-ratelimit-reset` header

## Logging

Configure logging levels and outputs:

```javascript
const client = await createClient({
  token: 'your_token',
  logging: {
    level: 'debug',           // error, warn, info, debug, verbose
    console: true,            // Log to console
    file: './reactions.log'   // Log to file (optional)
  }
});
```

## Examples

### Basic CLI Usage

```bash
# List all reactions for an issue
github-reactions list -r issue --owner microsoft --repo vscode --issue-number 1

# Create a thumbs up reaction
github-reactions create -r issue --owner microsoft --repo vscode --issue-number 1 --content +1

# List reactions with filtering and pagination
github-reactions list -r issue --owner microsoft --repo vscode --issue-number 1 --content heart --per-page 10

# Get all reactions across all pages
github-reactions list -r issue --owner microsoft --repo vscode --issue-number 1 --all-pages

# Output as JSON
github-reactions list -r issue --owner microsoft --repo vscode --issue-number 1 -o json
```

### Advanced SDK Usage

```javascript
import { createClient, REACTION_CONTENT, ErrorHandler } from '@github-api/reactions';

async function manageReactions() {
  const client = await createClient();
  
  try {
    // Get current reactions
    const { data: reactions } = await client.listForIssue('owner', 'repo', 1);
    console.log(`Current reactions: ${reactions.length}`);
    
    // Add different reaction types
    const reactionTypes = [
      REACTION_CONTENT.HEART,
      REACTION_CONTENT.ROCKET,
      REACTION_CONTENT.EYES
    ];
    
    for (const content of reactionTypes) {
      const reaction = await client.createForIssue('owner', 'repo', 1, { content });
      console.log(`Added ${content} reaction (ID: ${reaction.id})`);
    }
    
    // List reactions with auto-pagination
    const { data: allReactions } = await client.listForIssue('owner', 'repo', 1, {
      autoPage: true
    });
    
    // Remove specific reactions
    for (const reaction of allReactions) {
      if (reaction.content === REACTION_CONTENT.EYES) {
        await client.deleteForIssue('owner', 'repo', 1, reaction.id);
        console.log(`Removed ${reaction.content} reaction`);
      }
    }
    
  } catch (error) {
    const handledError = ErrorHandler.handle(error);
    console.error(`Operation failed: ${handledError.message}`);
  }
}

manageReactions();
```

## Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup

```bash
git clone https://github.com/your-repo/github-reactions
cd github-reactions
npm install
```

### Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode  
npm run test:watch
```

### CLI Development

```bash
# Run CLI in development
npm run dev -- list --help

# Test CLI without installing globally
node src/cli.mjs examples
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and add tests
4. Run the test suite: `npm test`
5. Submit a pull request

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- 📚 [Documentation](https://github.com/your-repo/github-reactions/wiki)
- 🐛 [Issues](https://github.com/your-repo/github-reactions/issues)  
- 💬 [Discussions](https://github.com/your-repo/github-reactions/discussions)

---

**Built with ❤️ using the GitHub Reactions API**