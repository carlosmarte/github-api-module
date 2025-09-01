/**
 * @fileoverview GitClient tests
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { GitClient } from '../src/client/GitClient.mjs';
import { GitError, ValidationError } from '../src/utils/errors.mjs';
import { existsSync, rmSync, mkdirSync } from 'fs';
import { join } from 'path';

// Test setup
const TEST_BASE_DIR = './test-repos';
const TEST_REPO_URL = 'https://github.com/octocat/Hello-World.git';
const TEST_REPO_NAME = 'test-repo';

describe('GitClient', () => {
  let client;

  beforeEach(() => {
    // Clean up test directory
    if (existsSync(TEST_BASE_DIR)) {
      rmSync(TEST_BASE_DIR, { recursive: true, force: true });
    }
    
    client = new GitClient({
      baseDir: TEST_BASE_DIR,
      verbose: false
    });
  });

  afterEach(() => {
    // Clean up test directory
    if (existsSync(TEST_BASE_DIR)) {
      rmSync(TEST_BASE_DIR, { recursive: true, force: true });
    }
  });

  describe('constructor', () => {
    test('creates client with default options', () => {
      const defaultClient = new GitClient();
      expect(defaultClient.baseDir).toContain('repositories');
      expect(defaultClient.verbose).toBe(false);
      expect(defaultClient.timeout).toBe(300000);
    });

    test('creates client with custom options', () => {
      const customClient = new GitClient({
        baseDir: './custom-repos',
        token: 'test-token',
        verbose: true,
        timeout: 60000
      });
      
      expect(customClient.baseDir).toContain('custom-repos');
      expect(customClient.token).toBe('test-token');
      expect(customClient.verbose).toBe(true);
      expect(customClient.timeout).toBe(60000);
    });

    test('creates base directory if it does not exist', () => {
      expect(existsSync(TEST_BASE_DIR)).toBe(true);
    });
  });

  describe('_getAuthenticatedUrl', () => {
    test('returns original URL if no token', () => {
      const clientNoToken = new GitClient({ baseDir: TEST_BASE_DIR });
      const result = clientNoToken._getAuthenticatedUrl(TEST_REPO_URL);
      expect(result).toBe(TEST_REPO_URL);
    });

    test('returns original URL if not GitHub', () => {
      const clientWithToken = new GitClient({ 
        baseDir: TEST_BASE_DIR,
        token: 'test-token'
      });
      const result = clientWithToken._getAuthenticatedUrl('https://gitlab.com/user/repo.git');
      expect(result).toBe('https://gitlab.com/user/repo.git');
    });

    test('adds authentication for GitHub URLs', () => {
      const clientWithToken = new GitClient({ 
        baseDir: TEST_BASE_DIR,
        token: 'test-token'
      });
      const result = clientWithToken._getAuthenticatedUrl(TEST_REPO_URL);
      expect(result).toContain('test-token');
      expect(result).toContain('x-oauth-basic');
    });
  });

  describe('_getRepoPath', () => {
    test('returns absolute path for absolute input', () => {
      const absolutePath = '/tmp/test-repo';
      const result = client._getRepoPath(absolutePath);
      expect(result).toBe(absolutePath);
    });

    test('returns path relative to base directory', () => {
      const result = client._getRepoPath(TEST_REPO_NAME);
      expect(result).toBe(join(client.baseDir, TEST_REPO_NAME));
    });
  });

  describe('init', () => {
    test('initializes a new repository', async () => {
      const result = await client.init(TEST_REPO_NAME);
      
      expect(result.name).toBe(TEST_REPO_NAME);
      expect(result.path).toContain(TEST_REPO_NAME);
      expect(result.bare).toBe(false);
      expect(result.initializedAt).toBeDefined();
      expect(existsSync(result.path)).toBe(true);
      expect(existsSync(join(result.path, '.git'))).toBe(true);
    });

    test('initializes a bare repository', async () => {
      const result = await client.init(TEST_REPO_NAME, { bare: true });
      
      expect(result.name).toBe(TEST_REPO_NAME);
      expect(result.bare).toBe(true);
      expect(existsSync(result.path)).toBe(true);
    });

    test('throws error if directory already exists', async () => {
      // Create directory first
      const repoPath = client._getRepoPath(TEST_REPO_NAME);
      mkdirSync(repoPath, { recursive: true });
      
      await expect(client.init(TEST_REPO_NAME)).rejects.toThrow(ValidationError);
    });
  });

  describe('listRepositories', () => {
    test('returns empty array when no repositories exist', async () => {
      const result = await client.listRepositories();
      expect(result).toEqual([]);
    });

    test('returns repository list when repositories exist', async () => {
      // Initialize a test repository
      await client.init(TEST_REPO_NAME);
      
      const result = await client.listRepositories();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe(TEST_REPO_NAME);
      expect(result[0].path).toContain(TEST_REPO_NAME);
    });
  });

  describe('status', () => {
    test('gets status for initialized repository', async () => {
      // Initialize a test repository first
      await client.init(TEST_REPO_NAME);
      
      const result = await client.status(TEST_REPO_NAME);
      
      expect(result.name).toBe(TEST_REPO_NAME);
      expect(result.path).toContain(TEST_REPO_NAME);
      expect(result.status).toBeDefined();
      expect(result.branches).toBeDefined();
      expect(result.lastUpdated).toBeDefined();
    });

    test('throws error for non-existent repository', async () => {
      await expect(client.status('non-existent')).rejects.toThrow(GitError);
    });
  });

  describe('clone', () => {
    test('validates repository URL', async () => {
      await expect(client.clone('')).rejects.toThrow(ValidationError);
      await expect(client.clone('invalid-url')).rejects.toThrow(ValidationError);
    });

    test('throws error if target directory exists', async () => {
      // Create directory first
      const repoPath = client._getRepoPath(TEST_REPO_NAME);
      mkdirSync(repoPath, { recursive: true });
      
      await expect(client.clone(TEST_REPO_URL, TEST_REPO_NAME)).rejects.toThrow(ValidationError);
    });

    // Note: Actual clone tests would require network access and are typically run in integration tests
  });
});

describe('Error Handling', () => {
  test('wraps unknown errors as GitError', () => {
    const originalError = new Error('Test error');
    const wrappedError = new GitError('Operation failed', originalError);
    
    expect(wrappedError).toBeInstanceOf(GitError);
    expect(wrappedError.message).toBe('Operation failed');
    expect(wrappedError.originalError).toBe(originalError);
    expect(wrappedError.timestamp).toBeDefined();
  });

  test('preserves GitError instances', () => {
    const gitError = new GitError('Git operation failed');
    expect(gitError).toBeInstanceOf(GitError);
    expect(gitError.name).toBe('GitError');
  });
});

describe('Validation Integration', () => {
  test('validates repository URLs correctly', () => {
    const client = new GitClient({ baseDir: TEST_BASE_DIR });
    
    // These would normally be tested through actual operations
    expect(() => client._getAuthenticatedUrl('')).not.toThrow();
    expect(() => client._getRepoPath('valid-name')).not.toThrow();
  });
});