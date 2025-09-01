# Usage Guide

A comprehensive guide for using the Git Repository Management SDK and CLI.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Progress Tracking](#progress-tracking)
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

## Progress Tracking

The SDK includes comprehensive progress tracking powered by `@thinkeloquent/cli-progressor`. **Progress is silent by default** - consuming applications have complete control over how progress is displayed.

### Key Features

- **Silent by default**: No output unless explicitly requested
- **Consuming app controls display**: Progress data provided via callbacks
- **Multiple consumers**: Same progress data can feed multiple systems
- **Detailed information**: Stages, percentages, timing, messages

### Basic Progress Usage

```javascript
import { clone } from '@thinkeloquent/github-sdk-clone';

// Silent progress with custom handling
const repo = await clone(
  'https://github.com/octocat/Hello-World.git',
  'hello-world',
  {
    onProgress: (data) => {
      console.log(`${data.percentage}% - ${data.message}`);
      // Send to analytics, update UI, etc.
    },
    onStageChange: (data) => {
      console.log(`Stage: ${data.stage.toUpperCase()}`);
    },
    onComplete: (data) => {
      console.log('Clone completed!', data.result);
    }
  }
);
```

### CLI Progress Bar

```javascript
// Show visual progress bar in terminal
const repo = await clone(repoUrl, targetDir, {
  showProgress: true
});
```

### Progress Data Structure

```javascript
// Progress events
{
  operationId: 'clone-hello-world-1640000000000',
  stage: 'cloning',
  step: 45,
  total: 100,
  percentage: 45,
  message: 'Receiving objects: 45%'
}

// Stage change events
{
  operationId: 'clone-hello-world-1640000000000',
  stage: 'resolving_deltas',
  description: 'Resolving deltas...',
  timestamp: '2024-01-01T12:00:00.000Z'
}
```

### Clone Stages

```javascript
import { CLONE_STAGES } from '@thinkeloquent/github-sdk-clone';

// Available stages:
CLONE_STAGES.INITIALIZING    // 'initializing'
CLONE_STAGES.CLONING        // 'cloning'
CLONE_STAGES.RESOLVING_DELTAS // 'resolving_deltas'
CLONE_STAGES.CHECKING_OUT   // 'checking_out'
CLONE_STAGES.COMPLETE       // 'complete'
```

### Custom Progress Manager

```javascript
import { createSilentProgressManager } from '@thinkeloquent/github-sdk-clone';

const customManager = createSilentProgressManager({
  onProgress: (data) => {
    // Send to database
    database.log('clone_progress', data);
    
    // Update UI
    updateProgressBar(data.percentage);
    
    // Send to analytics
    analytics.track('clone_progress', {
      percentage: data.percentage,
      stage: data.stage
    });
  }
});

const repo = await clone(repoUrl, targetDir, {
  progressManager: customManager
});
```

### Multiple Progress Consumers

```javascript
// Different systems consuming the same progress data
const combinedHandler = (data) => {
  // Logger
  logger.info(`Clone progress: ${data.percentage}%`);
  
  // Database
  database.updateCloneStatus(data.operationId, data.percentage);
  
  // UI Update
  progressBar.setValue(data.percentage);
  statusText.setText(data.message);
  
  // Notifications
  if (data.percentage % 25 === 0) {
    showNotification(`Clone ${data.percentage}% complete`);
  }
};

const repo = await clone(repoUrl, targetDir, {
  onProgress: combinedHandler
});
```

### React Integration Example

```jsx
function CloneComponent() {
  const [progress, setProgress] = useState({
    isLoading: false,
    percentage: 0,
    stage: null,
    message: ''
  });

  const handleClone = async (repoUrl) => {
    setProgress({ isLoading: true, percentage: 0 });
    
    try {
      await clone(repoUrl, 'target-dir', {
        onProgress: (data) => setProgress(prev => ({
          ...prev,
          percentage: data.percentage,
          message: data.message,
          stage: data.stage
        })),
        onComplete: () => setProgress(prev => ({
          ...prev,
          isLoading: false
        }))
      });
    } catch (error) {
      setProgress(prev => ({
        ...prev,
        isLoading: false,
        error: error.message
      }));
    }
  };

  return (
    <div>
      {progress.isLoading && (
        <div>
          <progress value={progress.percentage} max="100" />
          <p>{progress.stage}: {progress.message}</p>
        </div>
      )}
    </div>
  );
}
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

Clone a repository with comprehensive progress tracking.

```javascript
const repo = await client.clone(
  'https://github.com/octocat/Hello-World.git',
  'my-hello-world',
  {
    branch: 'main',
    depth: 1,
    onProgress: (data) => console.log(`${data.percentage}% - ${data.message}`),
    onStageChange: (data) => console.log(`Stage: ${data.stage}`),
    onComplete: (data) => console.log('Clone completed!')
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
  - `onProgress` (function): Progress event callback
  - `onStageChange` (function): Stage change event callback
  - `onComplete` (function): Completion event callback
  - `progressManager` (object): Custom progress manager instance
  - `progress` (function): Legacy progress callback (deprecated)

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
  initRepository,
  // Progress management
  GitProgressManager,
  createProgressManager,
  createSilentProgressManager,
  createCLIProgressManager,
  CLONE_STAGES
} from '@thinkeloquent/github-sdk-clone';
```

#### cloneRepository(repoUrl, targetDir, options)

Clone with comprehensive progress tracking and advanced options.

```javascript
const repo = await cloneRepository(
  'https://github.com/octocat/Hello-World.git',
  'hello-world',
  {
    client: { token: process.env.GITHUB_TOKEN },
    clone: { depth: 1, branch: 'main' },
    onProgress: (data) => console.log(`${data.percentage}% - ${data.message}`),
    onStageChange: (data) => console.log(`Stage: ${data.stage}`),
    onComplete: (data) => console.log('Clone completed!'),
    showProgress: true  // Shows CLI progress bar
  }
);
```

**New Progress Options:**
- `onProgress` (function): Detailed progress data callback
- `onStageChange` (function): Clone stage change callback
- `onComplete` (function): Operation completion callback
- `showProgress` (boolean): Show CLI progress bar
- `progressManager` (object): Custom progress manager instance

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
  onProgress: (repoUrl, data) => {
    console.log(`${repoUrl}: ${data.percentage}% - ${data.message}`);
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
--no-progress                 # Disable progress display
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
import { batchClone, CLONE_STAGES } from '@thinkeloquent/github-sdk-clone';

const repositories = [
  'https://github.com/facebook/react.git',
  'https://github.com/vuejs/vue.git',
  'https://github.com/angular/angular.git'
];

const results = await batchClone(repositories, {
  concurrency: 2,
  client: { token: process.env.GITHUB_TOKEN },
  onProgress: (repoUrl, data) => {
    console.log(`${repoUrl}: ${data.percentage}% - ${data.message}`);
    
    // Handle specific stages
    if (data.stage === CLONE_STAGES.COMPLETE) {
      console.log(`✅ ${repoUrl} completed successfully!`);
    }
  },
  onComplete: (repoUrl, result, error) => {
    if (error) {
      console.error(`❌ ${repoUrl}: ${error.message}`);
    } else {
      console.log(`✅ ${result.name}: Cloned to ${result.path}`);
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

// Clone with specific options and detailed progress tracking
await client.clone(
  'https://github.com/torvalds/linux.git',
  'linux-kernel',
  {
    depth: 1,
    branch: 'master',
    onProgress: (data) => {
      console.log(`Clone progress: ${data.percentage}% - ${data.message}`);
      
      // Send progress to monitoring system
      monitoring.updateCloneProgress(data.operationId, {
        percentage: data.percentage,
        stage: data.stage,
        timestamp: Date.now()
      });
    },
    onStageChange: (data) => {
      console.log(`Stage changed: ${data.stage} - ${data.description}`);
    },
    onComplete: (data) => {
      console.log('Clone operation completed successfully!');
      monitoring.completeCloneOperation(data.operationId, data.result);
    }
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

## New in This Version

### Progress Tracking Features

This version introduces comprehensive progress tracking capabilities:

- **Silent by default**: No progress output unless explicitly requested by consuming applications
- **Detailed progress data**: Percentage completion, stage information, timing data, and messages
- **Multiple progress consumers**: Same progress data can be used by logging, UI, analytics, and monitoring systems simultaneously
- **CLI progress bars**: Optional visual progress display in terminal applications
- **Custom progress managers**: Full control over how progress is tracked and displayed
- **React/Vue integration**: Easy integration with modern web frameworks
- **Stage-based tracking**: Monitor clone phases (initializing, cloning, resolving deltas, checking out, complete)

### Enhanced API

- New progress callbacks: `onProgress`, `onStageChange`, `onComplete`
- Progress manager support: `progressManager` option for custom implementations  
- CLI progress control: `--no-progress` flag to disable progress display
- Stage constants: `CLONE_STAGES` for consistent stage handling
- Factory functions: `createSilentProgressManager`, `createCLIProgressManager`

### Backward Compatibility

- All existing APIs continue to work unchanged
- Legacy `progress` callback still supported (deprecated but functional)
- No breaking changes to existing integrations

For complete progress tracking documentation, see [PROGRESS.md](./PROGRESS.md).