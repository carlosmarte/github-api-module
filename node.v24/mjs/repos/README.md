# GitHub Repository API Client & CLI

A comprehensive Node.js package that provides both a powerful SDK and command-line interface for interacting with GitHub repository APIs. Built with modern ES modules, TypeScript definitions, and enterprise-scale architecture patterns.

[![Version](https://img.shields.io/npm/v/@github-api/repos.svg)](https://www.npmjs.com/package/@github-api/repos)
[![License](https://img.shields.io/npm/l/@github-api/repos.svg)](https://github.com/github-api-module/repos/blob/main/LICENSE)
[![Node](https://img.shields.io/node/v/@github-api/repos.svg)](https://nodejs.org)

## Features

### 🚀 Dual-Purpose Design
- **SDK**: Programmatic access to GitHub repository operations
- **CLI**: Command-line interface for repository management

### 🔧 Core Capabilities
- **Repository Management**: Create, read, update, delete repositories
- **Branch Operations**: List, protect, and manage branches
- **Collaborator Management**: Add, remove, and manage repository collaborators
- **Tag & Release Management**: Create and manage tags and releases  
- **Webhook Management**: Configure and manage repository webhooks
- **Security Settings**: Configure security analysis and vulnerability alerts
- **Repository Rules**: Manage repository rulesets and policies

### 💡 Developer Experience
- **TypeScript Support**: Full type definitions included
- **Rate Limiting**: Built-in GitHub API rate limiting protection
- **Error Handling**: Comprehensive error types and handling
- **Pagination**: Automatic handling of paginated responses
- **Authentication**: Support for personal access tokens and GitHub Apps
- **Validation**: Input validation with helpful error messages

## Installation

```bash
npm install @github-api/repos
```

For CLI usage:
```bash
npm install -g @github-api/repos
```

## Quick Start

### SDK Usage

```javascript
import { RepoClient } from '@github-api/repos';

// Create client with personal access token
const client = new RepoClient({
  token: process.env.GITHUB_TOKEN
});

// Get repository information
const repo = await client.repositories.get('octocat', 'Hello-World');
console.log(`Repository: ${repo.full_name}`);
console.log(`Stars: ${repo.stargazers_count}`);

// List user repositories
const repos = await client.repositories.listForAuthenticatedUser({
  type: 'public',
  sort: 'updated'
});
console.log(`Found ${repos.length} repositories`);

// Create a new repository
const newRepo = await client.repositories.create({
  name: 'my-awesome-project',
  description: 'An awesome new project',
  private: false,
  auto_init: true
});
console.log(`Created: ${newRepo.html_url}`);
```

### CLI Usage

```bash
# Configure authentication
gh-repo config setup

# Get repository information
gh-repo repo get octocat Hello-World

# List repositories
gh-repo repo list
gh-repo repo list octocat

# Create a repository
gh-repo repo create my-new-repo --description "My new repository"

# List branches
gh-repo branch list octocat Hello-World

# List collaborators
gh-repo collaborator list octocat Hello-World
```

## Authentication

### Personal Access Token

The most common authentication method:

```javascript
import { RepoClient } from '@github-api/repos';

const client = new RepoClient({
  token: 'ghp_your_personal_access_token_here'
});
```

### Environment Variables

Set your token in environment variables:

```bash
export GITHUB_TOKEN=ghp_your_personal_access_token_here
```

```javascript
import { RepoClient } from '@github-api/repos';

// Token automatically loaded from GITHUB_TOKEN environment variable
const client = new RepoClient();
```

### Required Scopes

Your GitHub token needs the following scopes:
- `repo` - Full repository access
- `read:org` - Read organization membership (for organization repositories)

## API Reference

### RepoClient

Main client class for accessing GitHub Repository APIs.

#### Constructor Options

```javascript
const client = new RepoClient({
  token: 'your-github-token',           // GitHub personal access token
  baseUrl: 'https://api.github.com',   // GitHub API base URL
  timeout: 10000,                      // Request timeout (ms)
  rateLimiting: {
    enabled: true,                     // Enable rate limiting protection
    padding: 100                       // Padding between requests (ms)
  }
});
```

### Repository Operations

#### Get Repository
```javascript
const repo = await client.repositories.get(owner, repo);
```

#### List Repositories
```javascript
// List user repositories
const repos = await client.repositories.listForUser(username, options);

// List authenticated user repositories
const repos = await client.repositories.listForAuthenticatedUser(options);

// List organization repositories
const repos = await client.repositories.listForOrg(orgname, options);
```

#### Create Repository
```javascript
const repo = await client.repositories.create({
  name: 'repository-name',
  description: 'Repository description',
  private: false,
  auto_init: true,
  has_issues: true,
  has_projects: true,
  has_wiki: true
});
```

#### Update Repository
```javascript
const repo = await client.repositories.update(owner, repo, {
  description: 'New description',
  has_issues: false
});
```

#### Delete Repository
```javascript
await client.repositories.delete(owner, repo);
```

### Branch Operations

#### List Branches
```javascript
const branches = await client.branches.list(owner, repo, {
  protected: false  // Filter for protected branches
});
```

#### Get Branch
```javascript
const branch = await client.branches.get(owner, repo, branchName);
```

#### Branch Protection
```javascript
// Get protection
const protection = await client.branches.getProtection(owner, repo, branchName);

// Update protection
await client.branches.updateProtection(owner, repo, branchName, {
  required_status_checks: {
    strict: true,
    contexts: ['ci/test']
  },
  enforce_admins: true,
  required_pull_request_reviews: {
    required_approving_review_count: 2,
    dismiss_stale_reviews: true
  }
});
```

### Collaborator Management

#### List Collaborators
```javascript
const collaborators = await client.collaborators.list(owner, repo);
```

#### Add Collaborator
```javascript
await client.collaborators.add(owner, repo, username, {
  permission: 'push'  // pull, push, admin, maintain, triage
});
```

#### Remove Collaborator
```javascript
await client.collaborators.remove(owner, repo, username);
```

#### Check Permissions
```javascript
const permissions = await client.collaborators.checkPermissions(owner, repo, username);
console.log(`Permission level: ${permissions.permission}`);
```

### Pagination

Handle paginated responses:

```javascript
// Get all repositories (automatic pagination)
const allRepos = await client.repositories.listForAuthenticatedUser({ per_page: 100 });

// Use pagination iterator
for await (const repo of client.paginate(client.repositories.listForAuthenticatedUser)) {
  console.log(repo.name);
}

// Get specific page
const page2 = await client.repositories.listForAuthenticatedUser({ page: 2, per_page: 50 });
```

## CLI Commands

### Repository Commands

```bash
# Get repository information
gh-repo repo get <owner> <repo> [--full]

# List repositories
gh-repo repo list [user] [--type=all|owner|member] [--sort=created|updated|pushed|full_name]

# Create repository
gh-repo repo create <name> [options]
  --description <desc>     Repository description
  --private               Create private repository
  --init                  Initialize with README
  --org <org>            Create in organization

# Delete repository
gh-repo repo delete <owner> <repo> [--force]
```

### Branch Commands

```bash
# List branches
gh-repo branch list <owner> <repo> [--protected]
```

### Collaborator Commands

```bash
# List collaborators
gh-repo collaborator list <owner> <repo>
```

### Configuration Commands

```bash
# Interactive setup
gh-repo config setup

# Show current configuration
gh-repo config show
```

### Global Options

```bash
--token <token>      GitHub personal access token
--base-url <url>     GitHub API base URL
--timeout <ms>       Request timeout
--no-rate-limit      Disable rate limiting
--json               Output as JSON
--verbose            Enable verbose logging
--quiet              Suppress output except errors
--no-color           Disable colored output
```

## Error Handling

The package provides comprehensive error handling with specific error types:

```javascript
import { 
  RepoError, 
  AuthError, 
  ValidationError, 
  RateLimitError,
  NotFoundError 
} from '@github-api/repos';

try {
  const repo = await client.repositories.get('owner', 'repo');
} catch (error) {
  if (error instanceof AuthError) {
    console.error('Authentication failed:', error.message);
  } else if (error instanceof NotFoundError) {
    console.error('Repository not found');
  } else if (error instanceof RateLimitError) {
    console.error('Rate limit exceeded, retry after:', error.resetTime);
  } else {
    console.error('Unexpected error:', error.message);
  }
}
```

## Rate Limiting

The client automatically handles GitHub's rate limiting:

```javascript
const client = new RepoClient({
  token: process.env.GITHUB_TOKEN,
  rateLimiting: {
    enabled: true,      // Enable automatic rate limiting
    padding: 100        // Milliseconds between requests
  }
});

// Check current rate limit status
const rateLimit = await client.getRateLimit();
console.log(`Remaining: ${rateLimit.remaining}/${rateLimit.limit}`);
```

## Examples

See the [examples](./examples/) directory for more comprehensive examples:

- [SDK Usage](./examples/sdk-usage.mjs) - Complete SDK examples
- [CLI Examples](./examples/cli-usage.md) - Command-line usage examples
- [Advanced Scenarios](./examples/advanced-scenarios.mjs) - Complex use cases

## Development

### Running Tests

```bash
npm test
npm run test:watch
npm run test:coverage
```

### Building

```bash
npm run build
```

### Linting

```bash
npm run lint
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- 🐛 [Bug Reports](https://github.com/github-api-module/repos/issues)
- 💡 [Feature Requests](https://github.com/github-api-module/repos/issues)
- 📖 [Documentation](https://github.com/github-api-module/repos#readme)

## Related Projects

- [@github-api/pulls](../pulls/) - Pull Request management
- [@github-api/issues](../issues/) - Issue management
- [@github-api/gist](../gist/) - Gist operations

---

Made with ❤️ by the GitHub API Module team