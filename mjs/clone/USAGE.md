# Usage Guide

A comprehensive guide for using the Git Repository Management SDK and CLI.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [SDK API](#sdk-api)
  - [GitClient](#gitclient)
  - [High-Level Operations](#high-level-operations)
  - [Batch Operations](#batch-operations)
- [CLI Usage](#cli-usage)
- [Configuration](#configuration)
- [Error Handling](#error-handling)
- [Examples](#examples)

## Installation

### SDK Installation

```bash
npm install @thinkeloquent/github-sdk-clone
```

### CLI Installation

```bash
# Install globally for CLI access
npm install -g @thinkeloquent/github-sdk-clone
```

## Quick Start

### SDK Usage

```javascript
import { GitClient } from '@thinkeloquent/github-sdk-clone';

// Create a client
const client = new GitClient({
  baseDir: './repositories',
  token: process.env.GITHUB_TOKEN,
  verbose: true
});

// Clone a repository
const repo = await client.clone('https://github.com/octocat/Hello-World.git', 'hello-world');
console.log(`Cloned: ${repo.name}`);

// Pull latest changes
await client.pull('hello-world');

// Push changes
await client.push('hello-world');
```

### CLI Usage

```bash
# Configure the CLI
gh-clone config

# Clone a repository
gh-clone clone https://github.com/octocat/Hello-World.git hello-world

# Pull latest changes
gh-clone pull hello-world

# Push changes
gh-clone push hello-world
```

## SDK API

### GitClient

The main client class for Git operations.

#### Constructor

```javascript
const client = new GitClient(options);
```

**Options:**
- `baseDir` (string): Base directory for repositories (default: './repositories')
- `token` (string): GitHub personal access token
- `verbose` (boolean): Enable verbose logging (default: false)
- `timeout` (number): Operation timeout in milliseconds (default: 300000)
- `gitOptions` (object): Additional simple-git options

#### Methods

##### clone(repoUrl, targetDir, options)

Clone a repository.

```javascript
const repo = await client.clone(
  'https://github.com/octocat/Hello-World.git',
  'my-hello-world',
  {
    branch: 'main',
    depth: 1,
    progress: (progress) => console.log(progress)
  }
);
```

**Parameters:**
- `repoUrl` (string): Repository URL to clone
- `targetDir` (string, optional): Target directory name
- `options` (object, optional):
  - `bare` (boolean): Create bare repository
  - `branch` (string): Specific branch to clone
  - `depth` (number): Clone depth for shallow clone
  - `progress` (function): Progress callback

**Returns:** Promise<Object> with repository information

##### pull(repoName, options)

Pull latest changes from remote.

```javascript
const result = await client.pull('hello-world', {
  remote: 'origin',
  branch: 'main',
  rebase: true
});
```

**Parameters:**
- `repoName` (string): Repository name or path
- `options` (object, optional):
  - `remote` (string): Remote name (default: 'origin')
  - `branch` (string): Branch name
  - `rebase` (boolean): Use rebase instead of merge

**Returns:** Promise<Object> with pull result

##### push(repoName, options)

Push changes to remote.

```javascript
const result = await client.push('hello-world', {
  remote: 'origin',
  branch: 'main',
  force: false,
  setUpstream: true
});
```

**Parameters:**
- `repoName` (string): Repository name or path
- `options` (object, optional):
  - `remote` (string): Remote name (default: 'origin')
  - `branch` (string): Branch name
  - `force` (boolean): Force push
  - `setUpstream` (boolean): Set upstream tracking

**Returns:** Promise<Object> with push result

##### status(repoName)

Get repository status and information.

```javascript
const status = await client.status('hello-world');
console.log(`Current branch: ${status.branch}`);
console.log(`Status: ${status.status.current}`);
```

**Parameters:**
- `repoName` (string): Repository name or path

**Returns:** Promise<Object> with repository status

##### listRepositories()

List all managed repositories.

```javascript
const repositories = await client.listRepositories();
repositories.forEach(repo => {
  console.log(`${repo.name}: ${repo.branch}`);
});
```

**Returns:** Promise<Array> of repository information

##### init(repoName, options)

Initialize a new repository.

```javascript
const repo = await client.init('new-project', {
  bare: false
});
```

**Parameters:**
- `repoName` (string): Repository name
- `options` (object, optional):
  - `bare` (boolean): Create bare repository

**Returns:** Promise<Object> with repository information

### High-Level Operations

Import high-level operation functions:

```javascript
import { 
  cloneRepository, 
  pullRepository, 
  pushRepository,
  syncRepository,
  getRepositoryHealth,
  listRepositories,
  initRepository
} from '@thinkeloquent/github-sdk-clone';
```

#### cloneRepository(repoUrl, targetDir, options)

Clone with progress tracking and advanced options.

```javascript
const repo = await cloneRepository(
  'https://github.com/octocat/Hello-World.git',
  'hello-world',
  {
    client: { token: process.env.GITHUB_TOKEN },
    clone: { depth: 1, branch: 'main' },
    onProgress: (progress) => console.log(`Progress: ${progress}%`)
  }
);
```

#### syncRepository(repoName, options)

Sync repository (pull then optionally push).

```javascript
const result = await syncRepository('hello-world', {
  client: { token: process.env.GITHUB_TOKEN },
  autoPush: true,
  pull: { rebase: true },
  push: { setUpstream: true }
});
```

#### getRepositoryHealth(repoName, options)

Get repository health check with recommendations.

```javascript
const health = await getRepositoryHealth('hello-world');
console.log(`Repository health: ${health.healthy ? 'Good' : 'Issues found'}`);
health.recommendations.forEach(rec => console.log(`- ${rec}`));
```

### Batch Operations

#### batchClone(repoUrls, options)

Clone multiple repositories concurrently.

```javascript
import { batchClone } from '@thinkeloquent/github-sdk-clone';

const results = await batchClone([
  'https://github.com/octocat/Hello-World.git',
  'https://github.com/octocat/Spoon-Knife.git'
], {
  concurrency: 3,
  client: { token: process.env.GITHUB_TOKEN },
  onComplete: (repoUrl, result, error) => {
    if (error) {
      console.error(`Failed to clone ${repoUrl}: ${error.message}`);
    } else {
      console.log(`Successfully cloned ${result.name}`);
    }
  },
  onProgress: (repoUrl, progress) => {
    console.log(`${repoUrl}: ${progress}%`);
  }
});

console.log(`Successfully cloned ${results.successCount}/${results.total} repositories`);
```

#### batchSync(repoNames, options)

Sync multiple repositories concurrently.

```javascript
import { batchSync } from '@thinkeloquent/github-sdk-clone';

const results = await batchSync(['repo1', 'repo2', 'repo3'], {
  concurrency: 2,
  autoPush: false,
  client: { token: process.env.GITHUB_TOKEN },
  onComplete: (repoName, result, error) => {
    if (error) {
      console.error(`Failed to sync ${repoName}: ${error.message}`);
    } else {
      console.log(`Successfully synced ${result.name}`);
    }
  }
});
```

## CLI Usage

### Configuration

```bash
# Interactive configuration setup
gh-clone config

# Set specific configuration values
gh-clone config --token your_github_token
gh-clone config --base-dir ./my-repos
```

### Repository Operations

```bash
# Clone repository
gh-clone clone <repo-url> [directory]
gh-clone clone https://github.com/octocat/Hello-World.git hello-world

# Clone with options
gh-clone clone https://github.com/octocat/Hello-World.git hello-world \
  --branch main --depth 1 --verbose

# Pull latest changes
gh-clone pull <repo-name>
gh-clone pull hello-world --rebase

# Push changes
gh-clone push <repo-name>
gh-clone push hello-world --set-upstream

# Get repository status
gh-clone status <repo-name>
gh-clone status hello-world

# Initialize new repository
gh-clone init <repo-name>
gh-clone init my-new-project

# Sync repository (pull + optional push)
gh-clone sync <repo-name>
gh-clone sync hello-world --auto-push

# List all repositories
gh-clone list
gh-clone list --json
```

### Global Options

```bash
-t, --token <token>           # GitHub personal access token
-d, --base-dir <dir>          # Base directory for repositories
-v, --verbose                 # Enable verbose logging
-q, --quiet                   # Suppress output except errors
--json                        # Output results as JSON
--no-color                    # Disable colored output
```

### Command-Specific Options

#### Clone Options

```bash
--branch <branch>             # Specific branch to clone
--depth <number>              # Shallow clone depth
--bare                        # Create bare repository
```

#### Pull/Push Options

```bash
--remote <remote>             # Remote name (default: origin)
--branch <branch>             # Branch name
--rebase                      # Use rebase instead of merge (pull)
--force                       # Force push
--set-upstream                # Set upstream tracking (push)
```

#### Sync Options

```bash
--auto-push                   # Automatically push after pull
```

## Configuration

### Environment Variables

- `GITHUB_TOKEN`: GitHub personal access token
- `GH_CLONE_BASE_DIR`: Default base directory for repositories

### Configuration File

The CLI stores configuration in `~/.gh-clone/config.yml`:

```yaml
baseDir: ./repositories
token: your_github_token
verbose: false
timeout: 300000
git:
  maxConcurrentProcesses: 6
  timeout: 300000
ui:
  color: true
  progress: true
```

## Error Handling

The module provides comprehensive error types:

```javascript
import { 
  GitError, 
  AuthError, 
  ValidationError, 
  CloneError 
} from '@thinkeloquent/github-sdk-clone';

try {
  await client.clone('invalid-url');
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Validation failed:', error.validationDetails);
  } else if (error instanceof AuthError) {
    console.error('Authentication failed:', error.message);
  } else if (error instanceof GitError) {
    console.error('Git operation failed:', error.message);
    console.log('Context:', error.context);
  }
}
```

## Examples

### Basic Repository Management

```javascript
import { GitClient } from '@thinkeloquent/github-sdk-clone';

const client = new GitClient({
  baseDir: './my-projects',
  token: process.env.GITHUB_TOKEN
});

// Clone a project
await client.clone('https://github.com/facebook/react.git', 'react');

// Check status and sync if needed
const status = await client.status('react');
if (status.status.behind > 0) {
  await client.pull('react');
}

if (status.status.ahead > 0) {
  await client.push('react');
}
```

### Batch Operations with Progress Tracking

```javascript
import { batchClone } from '@thinkeloquent/github-sdk-clone';

const repositories = [
  'https://github.com/facebook/react.git',
  'https://github.com/vuejs/vue.git',
  'https://github.com/angular/angular.git'
];

const results = await batchClone(repositories, {
  concurrency: 2,
  client: { token: process.env.GITHUB_TOKEN },
  onProgress: (repoUrl, progress) => {
    console.log(`${repoUrl}: ${progress}%`);
  },
  onComplete: (repoUrl, result, error) => {
    if (error) {
      console.error(`❌ ${repoUrl}: ${error.message}`);
    } else {
      console.log(`✅ ${result.name}: Cloned successfully`);
    }
  }
});

console.log(`\nSummary: ${results.successCount}/${results.total} repositories cloned`);
```

### Advanced Configuration and Health Monitoring

```javascript
import { GitClient, getRepositoryHealth } from '@thinkeloquent/github-sdk-clone';

const client = new GitClient({
  baseDir: './repositories',
  token: process.env.GITHUB_TOKEN,
  verbose: true,
  timeout: 600000, // 10 minutes
  gitOptions: {
    maxConcurrentProcesses: 3,
    timeout: {
      block: 600000
    }
  }
});

// Clone with specific options
await client.clone(
  'https://github.com/torvalds/linux.git',
  'linux-kernel',
  {
    depth: 1,
    branch: 'master',
    progress: (data) => console.log('Clone progress:', data)
  }
);

// Monitor repository health
const health = await getRepositoryHealth('linux-kernel');
console.log(`Repository health: ${health.healthy ? '✅ Healthy' : '⚠️  Issues found'}`);

if (health.issues.length > 0) {
  console.log('\nIssues:');
  health.issues.forEach(issue => console.log(`- ${issue}`));
  
  console.log('\nRecommendations:');
  health.recommendations.forEach(rec => console.log(`- ${rec}`));
}
```

### TypeScript Usage

```typescript
import { GitClient, CloneOptions, RepositoryInfo } from '@thinkeloquent/github-sdk-clone';

const client = new GitClient({
  baseDir: './repos',
  token: process.env.GITHUB_TOKEN
});

const options: CloneOptions = {
  branch: 'main',
  depth: 1
};

const repo: RepositoryInfo = await client.clone(
  'https://github.com/octocat/Hello-World.git',
  'hello-world',
  options
);

console.log(`Repository cloned: ${repo.name} at ${repo.path}`);
```

## Requirements

- Node.js >= 18.0.0
- Git installed and accessible via command line
- GitHub personal access token (for private repositories)

## Troubleshooting

### Common Issues

1. **Authentication Failed**: Ensure your GitHub token has the necessary permissions
2. **Directory Already Exists**: Use a different target directory or remove the existing one
3. **Network Timeout**: Increase the timeout value in client options
4. **Git Not Found**: Ensure Git is installed and in your system PATH

### Debug Mode

Enable verbose logging to see detailed operation information:

```javascript
const client = new GitClient({
  verbose: true,
  // other options...
});
```

Or use the CLI verbose flag:

```bash
gh-clone clone https://github.com/octocat/Hello-World.git hello-world --verbose
```