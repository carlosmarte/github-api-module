#!/usr/bin/env node

/**
 * @fileoverview Example demonstrating progress tracking with @thinkeloquent/github-sdk-clone
 * 
 * This example shows how consuming applications can control progress display
 * and get detailed feedback during git clone operations.
 */

import {
  clone,
  cloneRepository,
  createClient,
  createSilentProgressManager,
  createCLIProgressManager,
  CLONE_STAGES
} from '../index.mjs';

/**
 * Example 1: Basic clone with silent progress tracking
 * Perfect for background operations where you want progress data but no visual output
 */
async function example1_SilentProgress() {
  console.log('\n=== Example 1: Silent Progress Tracking ===');
  
  try {
    const repo = await clone(
      'https://github.com/octocat/Hello-World.git',
      'hello-world-silent',
      {
        onProgress: (data) => {
          // Consuming app receives detailed progress data but controls display
          console.log(`📊 ${data.percentage}% - ${data.message || 'Processing...'}`);
        },
        onStageChange: (data) => {
          console.log(`🔄 Stage: ${data.stage} - ${data.description}`);
        },
        onComplete: (data) => {
          console.log(`✅ Operation completed: ${data.operationId}`);
        }
      }
    );

    console.log(`Successfully cloned to: ${repo.path}`);
  } catch (error) {
    console.error('Clone failed:', error.message);
  }
}

/**
 * Example 2: Clone with CLI progress bar
 * Shows a visual progress bar in the terminal
 */
async function example2_CLIProgress() {
  console.log('\n=== Example 2: CLI Progress Bar ===');
  
  try {
    const repo = await clone(
      'https://github.com/octocat/Hello-World.git',
      'hello-world-cli',
      {
        showProgress: true,
        onComplete: (data) => {
          console.log('Clone operation completed successfully!');
        }
      }
    );

    console.log(`Successfully cloned to: ${repo.path}`);
  } catch (error) {
    console.error('Clone failed:', error.message);
  }
}

/**
 * Example 3: Custom progress manager with detailed tracking
 * Demonstrates how to create and use a custom progress manager
 */
async function example3_CustomProgressManager() {
  console.log('\n=== Example 3: Custom Progress Manager ===');
  
  const progressData = {
    startTime: null,
    stages: [],
    progressHistory: []
  };

  const customProgressManager = createSilentProgressManager({
    onProgress: (data) => {
      progressData.progressHistory.push({
        timestamp: new Date().toISOString(),
        percentage: data.percentage,
        message: data.message,
        stage: data.stage
      });
      
      // Custom progress display
      const elapsed = Date.now() - progressData.startTime;
      const rate = data.percentage / (elapsed / 1000);
      console.log(`⚡ ${data.percentage}% (${rate.toFixed(1)}%/sec) - ${data.message || 'Working...'}`);
    },
    onStageChange: (data) => {
      progressData.stages.push({
        stage: data.stage,
        description: data.description,
        timestamp: data.timestamp
      });
      console.log(`🎯 Entering stage: ${data.stage.toUpperCase()}`);
    },
    onComplete: (data) => {
      const totalTime = Date.now() - progressData.startTime;
      console.log(`🏁 Completed in ${totalTime}ms`);
      console.log(`📈 Went through ${progressData.stages.length} stages`);
      console.log(`📊 Tracked ${progressData.progressHistory.length} progress updates`);
    }
  });

  try {
    progressData.startTime = Date.now();
    
    const repo = await clone(
      'https://github.com/octocat/Hello-World.git',
      'hello-world-custom',
      {
        progressManager: customProgressManager
      }
    );

    console.log(`Successfully cloned to: ${repo.path}`);
  } catch (error) {
    console.error('Clone failed:', error.message);
  }
}

/**
 * Example 4: Multiple concurrent clones with progress tracking
 * Shows how to track progress of multiple operations simultaneously
 */
async function example4_MultipleClones() {
  console.log('\n=== Example 4: Multiple Concurrent Clones ===');
  
  const repos = [
    'https://github.com/octocat/Hello-World.git',
    'https://github.com/octocat/Spoon-Knife.git'
  ];

  const clonePromises = repos.map((repoUrl, index) => {
    const targetDir = `concurrent-clone-${index}`;
    
    return clone(repoUrl, targetDir, {
      onProgress: (data) => {
        console.log(`[${targetDir}] ${data.percentage}% - ${data.message || ''}`);
      },
      onStageChange: (data) => {
        console.log(`[${targetDir}] Stage: ${data.stage}`);
      },
      onComplete: (data) => {
        console.log(`[${targetDir}] ✅ Complete!`);
      }
    }).catch(error => {
      console.error(`[${targetDir}] ❌ Failed:`, error.message);
      return null;
    });
  });

  try {
    const results = await Promise.all(clonePromises);
    const successful = results.filter(r => r !== null);
    console.log(`Successfully cloned ${successful.length}/${repos.length} repositories`);
  } catch (error) {
    console.error('Batch clone failed:', error.message);
  }
}

/**
 * Example 5: Integration with external progress tracking systems
 * Shows how to integrate with external systems like databases, APIs, etc.
 */
async function example5_ExternalIntegration() {
  console.log('\n=== Example 5: External System Integration ===');
  
  // Simulate external progress tracking system
  const externalTracker = {
    operations: new Map(),
    
    createOperation(id, description) {
      this.operations.set(id, {
        id,
        description,
        progress: 0,
        stage: 'initializing',
        status: 'running',
        startTime: Date.now()
      });
      console.log(`📝 External tracker: Created operation ${id}`);
    },
    
    updateProgress(id, progress, stage, message) {
      const op = this.operations.get(id);
      if (op) {
        op.progress = progress;
        op.stage = stage;
        op.lastUpdate = Date.now();
        // Here you would normally send to database, API, etc.
        console.log(`🔄 External tracker: ${id} - ${progress}% (${stage})`);
      }
    },
    
    completeOperation(id, result) {
      const op = this.operations.get(id);
      if (op) {
        op.status = result.error ? 'failed' : 'completed';
        op.endTime = Date.now();
        op.duration = op.endTime - op.startTime;
        console.log(`🎯 External tracker: ${id} ${op.status} in ${op.duration}ms`);
      }
    }
  };

  try {
    const operationId = `clone-${Date.now()}`;
    
    const repo = await clone(
      'https://github.com/octocat/Hello-World.git',
      'hello-world-external',
      {
        onStageChange: (data) => {
          if (data.stage === CLONE_STAGES.INITIALIZING) {
            externalTracker.createOperation(data.operationId, 'Cloning repository');
          }
        },
        onProgress: (data) => {
          externalTracker.updateProgress(
            data.operationId, 
            data.percentage, 
            data.stage, 
            data.message
          );
        },
        onComplete: (data) => {
          externalTracker.completeOperation(data.operationId, data.result || {});
        }
      }
    );

    console.log(`Successfully cloned to: ${repo.path}`);
  } catch (error) {
    console.error('Clone failed:', error.message);
  }
}

/**
 * Example 6: React-like progress state management
 * Shows how you might integrate with React or similar state management
 */
async function example6_StateManagement() {
  console.log('\n=== Example 6: State Management Pattern ===');
  
  // Simulate React-like state
  const progressState = {
    isLoading: false,
    progress: 0,
    stage: null,
    message: '',
    error: null,
    
    setState(updates) {
      Object.assign(this, updates);
      this.render();
    },
    
    render() {
      if (this.isLoading) {
        console.log(`🔄 Loading: ${this.progress}% - ${this.message} (${this.stage})`);
      } else if (this.error) {
        console.log(`❌ Error: ${this.error}`);
      } else {
        console.log(`✅ Complete: ${this.message}`);
      }
    }
  };

  try {
    progressState.setState({ isLoading: true, message: 'Starting clone...' });
    
    const repo = await clone(
      'https://github.com/octocat/Hello-World.git',
      'hello-world-state',
      {
        onProgress: (data) => {
          progressState.setState({
            progress: data.percentage,
            message: data.message || 'Processing...',
            stage: data.stage
          });
        },
        onStageChange: (data) => {
          progressState.setState({
            stage: data.stage,
            message: data.description
          });
        },
        onComplete: (data) => {
          progressState.setState({
            isLoading: false,
            progress: 100,
            message: 'Clone completed successfully!'
          });
        }
      }
    );

    console.log(`Successfully cloned to: ${repo.path}`);
  } catch (error) {
    progressState.setState({
      isLoading: false,
      error: error.message
    });
  }
}

/**
 * Run all examples
 */
async function runExamples() {
  console.log('🚀 Progress Tracking Examples');
  console.log('============================');
  
  const examples = [
    example1_SilentProgress,
    example2_CLIProgress,
    example3_CustomProgressManager,
    example4_MultipleClones,
    example5_ExternalIntegration,
    example6_StateManagement
  ];

  for (const example of examples) {
    try {
      await example();
      console.log('\n✅ Example completed successfully\n');
    } catch (error) {
      console.error('\n❌ Example failed:', error.message, '\n');
    }
    
    // Wait a bit between examples
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// Only run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runExamples()
    .then(() => {
      console.log('🎉 All examples completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Examples failed:', error);
      process.exit(1);
    });
}