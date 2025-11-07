import { jest, describe, it, expect } from '@jest/globals';

// Mock the modules before importing
jest.unstable_mockModule('../lib/client.mjs', () => ({
  GitHubClient: jest.fn().mockImplementation(() => ({ mocked: true }))
}));

jest.unstable_mockModule('../commands/blob.mjs', () => ({
  BlobCommands: jest.fn()
}));

jest.unstable_mockModule('../commands/commit.mjs', () => ({
  CommitCommands: jest.fn()
}));

jest.unstable_mockModule('../commands/ref.mjs', () => ({
  RefCommands: jest.fn()
}));

jest.unstable_mockModule('../commands/tag.mjs', () => ({
  TagCommands: jest.fn()
}));

jest.unstable_mockModule('../commands/tree.mjs', () => ({
  TreeCommands: jest.fn()
}));

jest.unstable_mockModule('../utils/format.mjs', () => ({
  formatOutput: jest.fn()
}));

describe('index.mjs exports', () => {
  it('should export GitHubClient', async () => {
    const module = await import('../index.mjs');
    expect(module.GitHubClient).toBeDefined();
    expect(typeof module.GitHubClient).toBe('function');
  });

  it('should export command classes', async () => {
    const module = await import('../index.mjs');
    
    expect(module.BlobCommands).toBeDefined();
    expect(module.CommitCommands).toBeDefined();
    expect(module.RefCommands).toBeDefined();
    expect(module.TagCommands).toBeDefined();
    expect(module.TreeCommands).toBeDefined();
  });

  it('should export formatOutput utility', async () => {
    const module = await import('../index.mjs');
    expect(module.formatOutput).toBeDefined();
    expect(typeof module.formatOutput).toBe('function');
  });

  it('should have GitHubClient as default export', async () => {
    const module = await import('../index.mjs');
    expect(module.default).toBeDefined();
    expect(module.default).toBe(module.GitHubClient);
  });

  it('should have all expected named exports', async () => {
    const module = await import('../index.mjs');
    
    const expectedExports = [
      'GitHubClient',
      'BlobCommands',
      'CommitCommands',
      'RefCommands',
      'TagCommands',
      'TreeCommands',
      'formatOutput',
      'default'
    ];

    const actualExports = Object.keys(module);
    
    expectedExports.forEach(exportName => {
      expect(actualExports).toContain(exportName);
    });
  });
});