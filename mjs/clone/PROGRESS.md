# Progress Tracking with @thinkeloquent/github-sdk-clone

The `@thinkeloquent/github-sdk-clone` package now includes comprehensive progress tracking capabilities powered by `@thinkeloquent/cli-progressor`. This allows consuming applications to have full control over how progress is displayed and tracked during git operations.

## Key Features

- **Silent by default**: No progress output unless explicitly requested
- **Consuming app controls display**: Progress data is provided via callbacks, apps decide how to show it
- **Multiple progress consumers**: Same progress data can be consumed by multiple systems
- **Detailed progress information**: Stage tracking, percentage completion, time estimates
- **Legacy compatibility**: Existing progress callbacks continue to work

## Quick Start

### Basic Progress Tracking (Silent)

```javascript
import { clone } from '@thinkeloquent/github-sdk-clone';

const repo = await clone(
  'https://github.com/octocat/Hello-World.git',
  'hello-world',
  {
    onProgress: (data) => {
      console.log(`${data.percentage}% - ${data.message}`);
    },
    onStageChange: (data) => {
      console.log(`Stage: ${data.stage}`);
    },
    onComplete: (data) => {
      console.log('Clone completed!', data.result);
    }
  }
);
```

### CLI Progress Bar

```javascript
import { clone } from '@thinkeloquent/github-sdk-clone';

const repo = await clone(
  'https://github.com/octocat/Hello-World.git',
  'hello-world',
  {
    showProgress: true  // Shows visual progress bar in terminal
  }
);
```

## Progress Data Structure

### Progress Events

```javascript
{
  operationId: 'clone-hello-world-1640000000000',
  stage: 'cloning',
  step: 45,
  total: 100,
  percentage: 45,
  message: 'Receiving objects: 45%'
}
```

### Stage Change Events

```javascript
{
  operationId: 'clone-hello-world-1640000000000',
  stage: 'resolving_deltas',
  description: 'Resolving deltas...',
  timestamp: '2024-01-01T12:00:00.000Z'
}
```

### Completion Events

```javascript
{
  operationId: 'clone-hello-world-1640000000000',
  result: {
    name: 'hello-world',
    path: '/path/to/hello-world',
    // ... repository information
  }
}
```

## Clone Stages

The package tracks these stages during clone operations:

- `initializing`: Preparing the clone operation
- `cloning`: Downloading repository data
- `resolving_deltas`: Processing git deltas
- `checking_out`: Checking out working directory
- `complete`: Operation finished

```javascript
import { CLONE_STAGES } from '@thinkeloquent/github-sdk-clone';

// Use constants for stage comparison
if (data.stage === CLONE_STAGES.CLONING) {
  console.log('Now downloading repository data...');
}
```

## Advanced Usage

### Custom Progress Manager

```javascript
import { 
  clone, 
  createSilentProgressManager 
} from '@thinkeloquent/github-sdk-clone';

const progressManager = createSilentProgressManager({
  onProgress: (data) => {
    // Send to analytics
    analytics.track('clone_progress', {
      percentage: data.percentage,
      stage: data.stage
    });
  },
  onStageChange: (data) => {
    // Update UI state
    setCloneState({
      stage: data.stage,
      description: data.description
    });
  },
  onComplete: (data) => {
    // Show notification
    showNotification('Repository cloned successfully!');
  }
});

const repo = await clone(
  'https://github.com/octocat/Hello-World.git',
  'hello-world',
  { progressManager }
);
```

### Multiple Progress Consumers

```javascript
import { clone } from '@thinkeloquent/github-sdk-clone';

// Database logger
const dbLogger = {
  onProgress: (data) => {
    database.log('clone_progress', {
      operationId: data.operationId,
      percentage: data.percentage,
      timestamp: new Date()
    });
  }
};

// UI updater
const uiUpdater = {
  onProgress: (data) => {
    progressBar.setProgress(data.percentage);
    statusText.setText(data.message);
  }
};

// Notification system
const notifier = {
  onStageChange: (data) => {
    if (data.stage === 'complete') {
      pushNotification('Clone completed!');
    }
  }
};

// Combined handler
const combinedProgressHandler = (data) => {
  dbLogger.onProgress(data);
  uiUpdater.onProgress(data);
};

const combinedStageHandler = (data) => {
  notifier.onStageChange(data);
};

const repo = await clone(
  'https://github.com/octocat/Hello-World.git',
  'hello-world',
  {
    onProgress: combinedProgressHandler,
    onStageChange: combinedStageHandler
  }
);
```

### React Integration Example

```jsx
import React, { useState } from 'react';
import { clone } from '@thinkeloquent/github-sdk-clone';

function CloneComponent() {
  const [progress, setProgress] = useState({
    isLoading: false,
    percentage: 0,
    stage: null,
    message: ''
  });

  const handleClone = async (repoUrl, targetDir) => {
    setProgress({ isLoading: true, percentage: 0, stage: null, message: 'Starting...' });
    
    try {
      const repo = await clone(repoUrl, targetDir, {
        onProgress: (data) => {
          setProgress(prev => ({
            ...prev,
            percentage: data.percentage,
            message: data.message,
            stage: data.stage
          }));
        },
        onComplete: () => {
          setProgress(prev => ({
            ...prev,
            isLoading: false,
            message: 'Clone completed!'
          }));
        }
      });
      
      console.log('Repository cloned:', repo);
    } catch (error) {
      setProgress(prev => ({
        ...prev,
        isLoading: false,
        message: `Error: ${error.message}`
      }));
    }
  };

  return (
    <div>
      {progress.isLoading && (
        <div>
          <div>Stage: {progress.stage}</div>
          <div>Progress: {progress.percentage}%</div>
          <div>Status: {progress.message}</div>
        </div>
      )}
      <button onClick={() => handleClone('https://github.com/octocat/Hello-World.git', 'hello-world')}>
        Clone Repository
      </button>
    </div>
  );
}
```

### Express.js API Integration

```javascript
import express from 'express';
import { clone } from '@thinkeloquent/github-sdk-clone';

const app = express();
const activeClones = new Map();

app.post('/api/clone', async (req, res) => {
  const { repoUrl, targetDir } = req.body;
  const cloneId = `clone-${Date.now()}`;
  
  // Store clone progress
  activeClones.set(cloneId, {
    status: 'starting',
    percentage: 0,
    stage: null,
    message: 'Initializing...'
  });
  
  // Start clone asynchronously
  clone(repoUrl, targetDir, {
    onProgress: (data) => {
      activeClones.set(cloneId, {
        status: 'in_progress',
        percentage: data.percentage,
        stage: data.stage,
        message: data.message
      });
    },
    onComplete: (data) => {
      activeClones.set(cloneId, {
        status: 'completed',
        percentage: 100,
        result: data.result
      });
    }
  }).catch(error => {
    activeClones.set(cloneId, {
      status: 'failed',
      error: error.message
    });
  });
  
  res.json({ cloneId });
});

app.get('/api/clone/:id/progress', (req, res) => {
  const progress = activeClones.get(req.params.id);
  if (!progress) {
    return res.status(404).json({ error: 'Clone not found' });
  }
  res.json(progress);
});
```

## API Reference

### Progress Manager Factory Functions

```javascript
import { 
  createProgressManager,
  createSilentProgressManager,
  createCLIProgressManager 
} from '@thinkeloquent/github-sdk-clone';

// General purpose manager
const manager1 = createProgressManager({
  silent: false,
  onProgress: (data) => console.log(data)
});

// Silent manager (no CLI output)
const manager2 = createSilentProgressManager({
  onProgress: (data) => sendToAnalytics(data)
});

// CLI-enabled manager (shows progress bar)
const manager3 = createCLIProgressManager({
  onComplete: (data) => showNotification('Done!')
});
```

### GitClient Integration

```javascript
import { GitClient } from '@thinkeloquent/github-sdk-clone';

const client = new GitClient({
  baseDir: './repositories',
  token: process.env.GITHUB_TOKEN
});

const repo = await client.clone('https://github.com/octocat/Hello-World.git', 'hello-world', {
  // Progress options
  onProgress: (data) => console.log(`${data.percentage}%`),
  onStageChange: (data) => console.log(`Stage: ${data.stage}`),
  onComplete: (data) => console.log('Done!'),
  
  // Or use custom progress manager
  progressManager: createSilentProgressManager({ ... }),
  
  // Standard clone options still work
  branch: 'main',
  depth: 1
});
```

## Backward Compatibility

Legacy progress callbacks continue to work:

```javascript
// This still works (deprecated but supported)
const repo = await client.clone('https://github.com/octocat/Hello-World.git', 'hello-world', {
  progress: (message) => console.log(message)
});
```

## Best Practices

1. **Use silent progress by default**: Let consuming apps control display
2. **Provide meaningful feedback**: Use progress data to inform users
3. **Handle errors gracefully**: Progress callbacks receive error information
4. **Consider performance**: Don't perform heavy operations in progress callbacks
5. **Use stages for major transitions**: React to stage changes for better UX

## Examples

See the `/examples` directory for complete working examples:

- `examples/progress-usage.mjs` - Comprehensive progress tracking examples
- `verify-progress-integration.mjs` - Integration verification
- `demo-progress.mjs` - Simple demo showing the functionality

## Testing

Run the verification script to test progress integration:

```bash
node verify-progress-integration.mjs
```

This tests all progress functionality without requiring network access.