/**
 * @fileoverview Progress Management utilities for Git operations
 * @module progress
 */

import { ProgressBar, ProgressBarBuilder, CLIProgressHelper } from '@thinkeloquent/cli-progressor';

/**
 * Progress stages for git clone operations
 */
export const CLONE_STAGES = {
  INITIALIZING: 'initializing',
  CLONING: 'cloning',
  RESOLVING_DELTAS: 'resolving_deltas',
  CHECKING_OUT: 'checking_out',
  COMPLETE: 'complete'
};

/**
 * Progress Manager for Git Operations
 * Provides a clean interface for consuming applications to control progress display
 */
export class GitProgressManager {
  /**
   * Create a new progress manager
   * @param {Object} options - Configuration options
   * @param {boolean} [options.silent=true] - Whether to suppress all output by default
   * @param {Function} [options.onProgress] - Progress callback function
   * @param {Function} [options.onStageChange] - Stage change callback
   * @param {Function} [options.onComplete] - Completion callback
   * @param {boolean} [options.enableCLI=false] - Enable CLI progress display
   */
  constructor(options = {}) {
    this.silent = options.silent !== false; // Default to silent
    this.onProgress = options.onProgress;
    this.onStageChange = options.onStageChange;
    this.onComplete = options.onComplete;
    this.enableCLI = options.enableCLI || false;
    
    this.currentStage = null;
    this.totalSteps = 0;
    this.currentStep = 0;
    this.progressBar = null;
    this.operationId = null;
  }

  /**
   * Start a new progress tracking operation
   * @param {string} operationId - Unique identifier for the operation
   * @param {string} description - Operation description
   * @param {number} [totalSteps=100] - Total number of steps
   */
  start(operationId, description, totalSteps = 100) {
    this.operationId = operationId;
    this.totalSteps = totalSteps;
    this.currentStep = 0;
    this.currentStage = CLONE_STAGES.INITIALIZING;

    // Only create CLI progress bar if explicitly enabled
    if (this.enableCLI && !this.silent) {
      this.progressBar = new ProgressBarBuilder()
        .withTotal(totalSteps)
        .withDescription(description)
        .withBarLength(40)
        .showETA(true)
        .onProgress((data) => {
          // Call user-provided progress callback if available
          if (this.onProgress) {
            this.onProgress({
              operationId: this.operationId,
              stage: this.currentStage,
              step: data.current,
              total: data.total,
              percentage: data.percentage,
              eta: data.eta,
              description: description
            });
          }
        })
        .build();
      
      this.progressBar.start();
    }

    // Always call callbacks even in silent mode
    this._notifyStageChange(this.currentStage, description);
  }

  /**
   * Update progress to a specific step
   * @param {number} step - Current step number
   * @param {string} [message] - Optional status message
   */
  update(step, message) {
    this.currentStep = step;
    
    if (this.progressBar) {
      this.progressBar.update(step);
      if (message) {
        this.progressBar.setDescription(message);
      }
    }

    // Always notify callbacks
    if (this.onProgress) {
      this.onProgress({
        operationId: this.operationId,
        stage: this.currentStage,
        step: step,
        total: this.totalSteps,
        percentage: Math.round((step / this.totalSteps) * 100),
        message: message
      });
    }
  }

  /**
   * Advance progress by a number of steps
   * @param {number} [steps=1] - Number of steps to advance
   * @param {string} [message] - Optional status message
   */
  advance(steps = 1, message) {
    this.update(this.currentStep + steps, message);
  }

  /**
   * Change the current operation stage
   * @param {string} stage - New stage (use CLONE_STAGES constants)
   * @param {string} [description] - Stage description
   */
  setStage(stage, description) {
    this.currentStage = stage;
    this._notifyStageChange(stage, description);
    
    if (this.progressBar && description) {
      this.progressBar.setDescription(description);
    }
  }

  /**
   * Mark the operation as complete
   * @param {Object} [result] - Operation result data
   */
  complete(result = {}) {
    this.currentStage = CLONE_STAGES.COMPLETE;
    
    if (this.progressBar) {
      this.progressBar.update(this.totalSteps);
      this.progressBar.complete();
    }

    if (this.onComplete) {
      this.onComplete({
        operationId: this.operationId,
        result: result
      });
    }

    this._notifyStageChange(CLONE_STAGES.COMPLETE, 'Operation completed');
  }

  /**
   * Handle an error during progress tracking
   * @param {Error} error - The error that occurred
   */
  error(error) {
    if (this.progressBar) {
      this.progressBar.error(error.message);
    }

    if (this.onComplete) {
      this.onComplete({
        operationId: this.operationId,
        error: error.message,
        stage: this.currentStage
      });
    }
  }

  /**
   * Create a progress callback function for simple-git operations
   * @returns {Function} Progress callback compatible with simple-git
   */
  createGitProgressCallback() {
    return (progress) => {
      // Parse git progress output
      const progressData = this._parseGitProgress(progress);
      
      if (progressData) {
        // Update stage first if it changed
        if (progressData.stage && progressData.stage !== this.currentStage) {
          this.setStage(progressData.stage, progressData.message);
        }
        
        // Then update progress
        this.update(progressData.step, progressData.message);
      }
    };
  }

  /**
   * Parse git command progress output
   * @private
   * @param {string} progress - Raw progress string from git
   * @returns {Object|null} Parsed progress data
   */
  _parseGitProgress(progress) {
    if (!progress || typeof progress !== 'string') {
      return null;
    }

    const progressStr = progress.toString().trim();
    
    // Common git progress patterns
    if (progressStr.includes('Cloning into')) {
      return { stage: CLONE_STAGES.CLONING, message: 'Initializing clone...', step: 10 };
    }
    
    if (progressStr.includes('remote: Counting objects')) {
      return { stage: CLONE_STAGES.CLONING, message: 'Counting objects...', step: 20 };
    }
    
    if (progressStr.includes('Receiving objects')) {
      const match = progressStr.match(/Receiving objects:\s*(\d+)%/);
      if (match) {
        const percentage = parseInt(match[1]);
        const step = Math.round((percentage / 100) * 60) + 20; // 20-80 range
        return { stage: CLONE_STAGES.CLONING, message: `Receiving objects: ${percentage}%`, step };
      }
    }
    
    if (progressStr.includes('Resolving deltas')) {
      const match = progressStr.match(/Resolving deltas:\s*(\d+)%/);
      if (match) {
        const percentage = parseInt(match[1]);
        const step = Math.round((percentage / 100) * 15) + 80; // 80-95 range
        return { stage: CLONE_STAGES.RESOLVING_DELTAS, message: `Resolving deltas: ${percentage}%`, step };
      }
    }
    
    if (progressStr.includes('Checking out files')) {
      return { stage: CLONE_STAGES.CHECKING_OUT, message: 'Checking out files...', step: 95 };
    }

    return null;
  }

  /**
   * Notify stage change callback
   * @private
   */
  _notifyStageChange(stage, description) {
    if (this.onStageChange) {
      this.onStageChange({
        operationId: this.operationId,
        stage: stage,
        description: description,
        timestamp: new Date().toISOString()
      });
    }
  }
}

/**
 * Create a progress manager with common configurations
 * @param {Object} options - Configuration options
 * @returns {GitProgressManager} Configured progress manager
 */
export function createProgressManager(options = {}) {
  return new GitProgressManager(options);
}

/**
 * Helper function to create a silent progress manager (no output)
 * Only fires callbacks if provided
 * @param {Object} callbacks - Progress callbacks
 * @returns {GitProgressManager} Silent progress manager
 */
export function createSilentProgressManager(callbacks = {}) {
  return new GitProgressManager({
    silent: true,
    enableCLI: false,
    ...callbacks
  });
}

/**
 * Helper function to create a CLI-enabled progress manager
 * Shows progress in terminal
 * @param {Object} options - Configuration options
 * @returns {GitProgressManager} CLI-enabled progress manager
 */
export function createCLIProgressManager(options = {}) {
  return new GitProgressManager({
    silent: false,
    enableCLI: true,
    ...options
  });
}