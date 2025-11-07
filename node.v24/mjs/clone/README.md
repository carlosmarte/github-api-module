# Git Repository Management SDK and CLI

A comprehensive Node.js module for local Git repository management using `simple-git`. Provides both SDK and CLI interfaces for cloning, pulling, pushing, and managing Git repositories locally.

## Features

- **Local Git Operations**: Clone, pull, push, init, sync repositories
- **GitHub Integration**: Seamless authentication with GitHub tokens
- **Batch Operations**: Clone or sync multiple repositories concurrently
- **Progress Tracking**: Real-time progress indicators for operations
- **Repository Health**: Check repository status and get recommendations
- **TypeScript Support**: Full TypeScript definitions included
- **CLI Interface**: Command-line tool for repository management
- **Error Handling**: Comprehensive error types and validation

## Installation

```bash
npm install @thinkeloquent/github-sdk-clone
```

## Quick Start

### SDK Usage

```javascript
import { GitClient, clone, pull, push } from '@thinkeloquent/github-sdk-clone';

// Create a client
const client = new GitClient({
  baseDir: './repositories',
  token: process.env.GITHUB_TOKEN,
  verbose: true
});

// Clone a repository
const repo = await client.clone('https://github.com/octocat/Hello-World.git', 'hello-world');
console.log(`Cloned: ${repo.name}`);

// Or use convenience functions
await clone('https://github.com/octocat/Hello-World.git', 'hello-world', {
  token: process.env.GITHUB_TOKEN,
  depth: 1,
  branch: 'main'
});

// Pull latest changes
await pull('hello-world');

// Push changes
await push('hello-world');
```

### CLI Usage

```bash
# Install globally for CLI access
npm install -g @thinkeloquent/github-sdk-clone

# Configure the CLI
gh-clone config

# Clone a repository
gh-clone clone https://github.com/octocat/Hello-World.git hello-world

# List managed repositories
gh-clone list

# Get repository status
gh-clone status hello-world

# Pull latest changes
gh-clone pull hello-world

# Push changes
gh-clone push hello-world

# Sync repository (pull + optional push)
gh-clone sync hello-world --auto-push
```

## SDK API Reference

### GitClient

Main client class for Git operations.

```javascript
const client = new GitClient({
  baseDir: './repositories',     // Base directory for repositories
  token: 'github_token',         // GitHub personal access token
  verbose: false,                // Enable verbose logging
  timeout: 300000               // Operation timeout in milliseconds
});
```

#### Methods

- `clone(repoUrl, targetDir?, options?)` - Clone a repository
- `pull(repoName, options?)` - Pull latest changes
- `push(repoName, options?)` - Push changes
- `status(repoName)` - Get repository status
- `listRepositories()` - List all managed repositories
- `init(repoName, options?)` - Initialize a new repository

### High-Level Operations

```javascript
import { 
  cloneRepository, 
  pullRepository, 
  pushRepository, 
  batchClone,
  getRepositoryHealth 
} from '@thinkeloquent/github-sdk-clone';

// Clone with progress tracking
const repo = await cloneRepository(
  'https://github.com/octocat/Hello-World.git',
  'hello-world',
  {
    client: { token: process.env.GITHUB_TOKEN },
    clone: { depth: 1, branch: 'main' },
    onProgress: (progress) => console.log(`Progress: ${progress}%`)
  }
);

// Batch clone multiple repositories
const results = await batchClone([
  'https://github.com/octocat/Hello-World.git',
  'https://github.com/octocat/Spoon-Knife.git'
], {
  concurrency: 3,
  onComplete: (repoUrl, result, error) => {
    if (error) {
      console.error(`Failed to clone ${repoUrl}: ${error.message}`);
    } else {
      console.log(`Successfully cloned ${result.name}`);
    }
  }
});

// Get repository health check
const health = await getRepositoryHealth('hello-world');
console.log(`Repository health: ${health.healthy ? 'Good' : 'Issues found'}`);
```

## CLI Commands

### Configuration

```bash
gh-clone config                    # Interactive configuration setup
```

### Repository Operations

```bash
gh-clone clone <repo-url> [dir]    # Clone repository
gh-clone pull <repo-name>          # Pull latest changes  
gh-clone push <repo-name>          # Push changes
gh-clone status <repo-name>        # Show repository status
gh-clone init <repo-name>          # Initialize new repository
gh-clone sync <repo-name>          # Sync (pull + optional push)
gh-clone list                      # List all repositories
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

```bash
# Clone options
--branch <branch>             # Specific branch to clone
--depth <number>              # Shallow clone depth
--bare                        # Create bare repository

# Pull/Push options
--remote <remote>             # Remote name (default: origin)
--branch <branch>             # Branch name
--rebase                      # Use rebase instead of merge (pull)
--force                       # Force push
--set-upstream                # Set upstream tracking (push)

# Sync options
--auto-push                   # Automatically push after pull
```

## Configuration

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

## Environment Variables

- `GITHUB_TOKEN` - GitHub personal access token
- `GH_CLONE_BASE_DIR` - Default base directory for repositories

## Error Handling

The module provides comprehensive error types:

```javascript
import { 
  GitError, 
  AuthError, 
  ValidationError, 
  CloneError,
  wrapError 
} from '@thinkeloquent/github-sdk-clone';

try {
  await clone('invalid-url');
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

## TypeScript Support

Full TypeScript definitions are included:

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
```

## Examples

### Basic Repository Management

```javascript
import { createClient } from '@thinkeloquent/github-sdk-clone';

const client = createClient({
  baseDir: './my-projects',
  token: process.env.GITHUB_TOKEN
});

// Clone a project
await client.clone('https://github.com/facebook/react.git', 'react');

// Work on the project...

// Sync changes
const status = await client.status('react');
if (status.status.behind > 0) {
  await client.pull('react');
}

if (status.status.ahead > 0) {
  await client.push('react');
}
```

### Batch Operations

```javascript
import { batchClone, batchSync } from '@thinkeloquent/github-sdk-clone';

// Clone multiple repositories
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
  }
});

console.log(`Successfully cloned ${results.successCount} repositories`);

// Later, sync all repositories
const repoNames = ['react', 'vue', 'angular'];
await batchSync(repoNames, {
  concurrency: 3,
  autoPush: false
});
```

### Advanced Configuration

```javascript
import { GitClient } from '@thinkeloquent/github-sdk-clone';

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
```

## Requirements

- Node.js >= 18.0.0
- Git installed and accessible via command line
- GitHub personal access token (for private repositories)

## License

MIT

## Contributing

Contributions are welcome! Please read the contributing guidelines and submit pull requests to the main repository.

## Support

- GitHub Issues: [Report bugs or request features](https://github.com/github-api-module/monorepo/issues)
- Documentation: [Full API documentation](https://github.com/github-api-module/monorepo/tree/main/mjs/clone)