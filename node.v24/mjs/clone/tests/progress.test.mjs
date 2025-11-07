/**
 * @fileoverview Progress Manager tests
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
  GitProgressManager,
  createProgressManager,
  createSilentProgressManager,
  createCLIProgressManager,
  CLONE_STAGES
} from '../src/utils/progress.mjs';

describe('GitProgressManager', () => {
  let progressManager;
  let progressCallback;
  let stageCallback;
  let completeCallback;

  beforeEach(() => {
    progressCallback = jest.fn();
    stageCallback = jest.fn();
    completeCallback = jest.fn();
  });

  describe('constructor', () => {
    test('creates manager with default options', () => {
      const manager = new GitProgressManager();
      expect(manager.silent).toBe(true);
      expect(manager.enableCLI).toBe(false);
      expect(manager.currentStage).toBe(null);
      expect(manager.totalSteps).toBe(0);
      expect(manager.currentStep).toBe(0);
    });

    test('creates manager with custom options', () => {
      const manager = new GitProgressManager({
        silent: false,
        enableCLI: true,
        onProgress: progressCallback,
        onStageChange: stageCallback,
        onComplete: completeCallback
      });

      expect(manager.silent).toBe(false);
      expect(manager.enableCLI).toBe(true);
      expect(manager.onProgress).toBe(progressCallback);
      expect(manager.onStageChange).toBe(stageCallback);
      expect(manager.onComplete).toBe(completeCallback);
    });
  });

  describe('progress tracking', () => {
    beforeEach(() => {
      progressManager = new GitProgressManager({
        onProgress: progressCallback,
        onStageChange: stageCallback,
        onComplete: completeCallback
      });
    });

    test('starts progress tracking', () => {
      const operationId = 'test-operation';
      const description = 'Test operation';
      const totalSteps = 100;

      progressManager.start(operationId, description, totalSteps);

      expect(progressManager.operationId).toBe(operationId);
      expect(progressManager.totalSteps).toBe(totalSteps);
      expect(progressManager.currentStep).toBe(0);
      expect(progressManager.currentStage).toBe(CLONE_STAGES.INITIALIZING);
      
      expect(stageCallback).toHaveBeenCalledWith({
        operationId,
        stage: CLONE_STAGES.INITIALIZING,
        description,
        timestamp: expect.any(String)
      });
    });

    test('updates progress to specific step', () => {
      progressManager.start('test-op', 'Test', 100);
      progressManager.update(50, 'Halfway done');

      expect(progressManager.currentStep).toBe(50);
      expect(progressCallback).toHaveBeenCalledWith({
        operationId: 'test-op',
        stage: CLONE_STAGES.INITIALIZING,
        step: 50,
        total: 100,
        percentage: 50,
        message: 'Halfway done'
      });
    });

    test('advances progress by steps', () => {
      progressManager.start('test-op', 'Test', 100);
      progressManager.advance(25, 'Advanced');

      expect(progressManager.currentStep).toBe(25);
      expect(progressCallback).toHaveBeenCalledWith({
        operationId: 'test-op',
        stage: CLONE_STAGES.INITIALIZING,
        step: 25,
        total: 100,
        percentage: 25,
        message: 'Advanced'
      });
    });

    test('changes stage', () => {
      progressManager.start('test-op', 'Test', 100);
      progressManager.setStage(CLONE_STAGES.CLONING, 'Now cloning');

      expect(progressManager.currentStage).toBe(CLONE_STAGES.CLONING);
      expect(stageCallback).toHaveBeenCalledWith({
        operationId: 'test-op',
        stage: CLONE_STAGES.CLONING,
        description: 'Now cloning',
        timestamp: expect.any(String)
      });
    });

    test('completes operation', () => {
      progressManager.start('test-op', 'Test', 100);
      const result = { success: true };
      
      progressManager.complete(result);

      expect(progressManager.currentStage).toBe(CLONE_STAGES.COMPLETE);
      expect(completeCallback).toHaveBeenCalledWith({
        operationId: 'test-op',
        result
      });
    });

    test('handles errors', () => {
      progressManager.start('test-op', 'Test', 100);
      const error = new Error('Test error');
      
      progressManager.error(error);

      expect(completeCallback).toHaveBeenCalledWith({
        operationId: 'test-op',
        error: 'Test error',
        stage: CLONE_STAGES.INITIALIZING
      });
    });
  });

  describe('git progress parsing', () => {
    beforeEach(() => {
      progressManager = new GitProgressManager({
        onProgress: progressCallback
      });
      progressManager.start('test-op', 'Test', 100);
    });

    test('parses cloning initialization', () => {
      const callback = progressManager.createGitProgressCallback();
      callback('Cloning into test-repo...');

      expect(progressCallback).toHaveBeenCalledWith({
        operationId: 'test-op',
        stage: CLONE_STAGES.CLONING,
        step: 10,
        total: 100,
        percentage: 10,
        message: 'Initializing clone...'
      });
    });

    test('parses receiving objects progress', () => {
      const callback = progressManager.createGitProgressCallback();
      callback('Receiving objects: 75% (750/1000)');

      expect(progressCallback).toHaveBeenCalledWith({
        operationId: 'test-op',
        stage: CLONE_STAGES.CLONING,
        step: 65, // 20 + (75% of 60)
        total: 100,
        percentage: 65,
        message: 'Receiving objects: 75%'
      });
    });

    test('parses resolving deltas progress', () => {
      const callback = progressManager.createGitProgressCallback();
      callback('Resolving deltas: 50% (250/500)');

      expect(progressCallback).toHaveBeenCalledWith({
        operationId: 'test-op',
        stage: CLONE_STAGES.RESOLVING_DELTAS,
        step: 87, // 80 + (50% of 15)
        total: 100,
        percentage: 87,
        message: 'Resolving deltas: 50%'
      });
    });

    test('parses checking out files', () => {
      const callback = progressManager.createGitProgressCallback();
      callback('Checking out files: 100% (150/150)');

      expect(progressCallback).toHaveBeenCalledWith({
        operationId: 'test-op',
        stage: CLONE_STAGES.CHECKING_OUT,
        step: 95,
        total: 100,
        percentage: 95,
        message: 'Checking out files...'
      });
    });

    test('ignores unrecognized progress', () => {
      const callback = progressManager.createGitProgressCallback();
      const initialCallCount = progressCallback.mock.calls.length;
      
      callback('Some unrecognized output');

      // Should not have called the progress callback
      expect(progressCallback).toHaveBeenCalledTimes(initialCallCount);
    });
  });

  describe('factory functions', () => {
    test('createProgressManager creates manager with options', () => {
      const manager = createProgressManager({
        silent: false,
        onProgress: progressCallback
      });

      expect(manager).toBeInstanceOf(GitProgressManager);
      expect(manager.silent).toBe(false);
      expect(manager.onProgress).toBe(progressCallback);
    });

    test('createSilentProgressManager creates silent manager', () => {
      const manager = createSilentProgressManager({
        onProgress: progressCallback
      });

      expect(manager).toBeInstanceOf(GitProgressManager);
      expect(manager.silent).toBe(true);
      expect(manager.enableCLI).toBe(false);
      expect(manager.onProgress).toBe(progressCallback);
    });

    test('createCLIProgressManager creates CLI manager', () => {
      const manager = createCLIProgressManager({
        onProgress: progressCallback
      });

      expect(manager).toBeInstanceOf(GitProgressManager);
      expect(manager.silent).toBe(false);
      expect(manager.enableCLI).toBe(true);
      expect(manager.onProgress).toBe(progressCallback);
    });
  });

  describe('CLONE_STAGES constants', () => {
    test('exports expected stage constants', () => {
      expect(CLONE_STAGES.INITIALIZING).toBe('initializing');
      expect(CLONE_STAGES.CLONING).toBe('cloning');
      expect(CLONE_STAGES.RESOLVING_DELTAS).toBe('resolving_deltas');
      expect(CLONE_STAGES.CHECKING_OUT).toBe('checking_out');
      expect(CLONE_STAGES.COMPLETE).toBe('complete');
    });
  });
});