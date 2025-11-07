import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Mock external dependencies
jest.mock('commander', () => ({
  program: {
    name: jest.fn().mockReturnThis(),
    description: jest.fn().mockReturnThis(),
    version: jest.fn().mockReturnThis(),
    option: jest.fn().mockReturnThis(),
    command: jest.fn().mockReturnThis(),
    parse: jest.fn().mockReturnThis()
  }
}));

jest.mock('dotenv', () => ({
  config: jest.fn()
}));

// Mock internal modules
jest.unstable_mockModule('../lib/client.mjs', () => ({
  GitHubClient: jest.fn().mockImplementation((options) => ({
    token: options?.token,
    baseUrl: options?.baseUrl || 'https://api.github.com'
  }))
}));

jest.unstable_mockModule('../commands/blob.mjs', () => ({
  BlobCommands: jest.fn().mockImplementation(() => ({
    register: jest.fn()
  }))
}));

jest.unstable_mockModule('../commands/commit.mjs', () => ({
  CommitCommands: jest.fn().mockImplementation(() => ({
    register: jest.fn()
  }))
}));

jest.unstable_mockModule('../commands/ref.mjs', () => ({
  RefCommands: jest.fn().mockImplementation(() => ({
    register: jest.fn()
  }))
}));

jest.unstable_mockModule('../commands/tag.mjs', () => ({
  TagCommands: jest.fn().mockImplementation(() => ({
    register: jest.fn()
  }))
}));

jest.unstable_mockModule('../commands/tree.mjs', () => ({
  TreeCommands: jest.fn().mockImplementation(() => ({
    register: jest.fn()
  }))
}));

describe('CLI', () => {
  let originalEnv;
  let program;
  let config;
  let GitHubClient;
  let BlobCommands;
  let CommitCommands;
  let RefCommands;
  let TagCommands;
  let TreeCommands;

  beforeEach(() => {
    // Save original env
    originalEnv = { ...process.env };
    
    // Clear module cache to ensure fresh imports
    jest.resetModules();
  });

  afterEach(() => {
    // Restore original env
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  it('should initialize with environment variables', async () => {
    process.env.GITHUB_TOKEN = 'test-token';
    process.env.GITHUB_API_URL = 'https://custom.github.com';

    // Import modules after setting env
    const commander = await import('commander');
    const dotenv = await import('dotenv');
    const clientModule = await import('../lib/client.mjs');
    
    program = commander.program;
    config = dotenv.config;
    GitHubClient = clientModule.GitHubClient;

    // Import CLI (this executes the CLI setup)
    await import('../cli.mjs');

    expect(config).toHaveBeenCalled();
    expect(GitHubClient).toHaveBeenCalledWith({
      token: 'test-token',
      baseUrl: 'https://custom.github.com'
    });
  });

  it('should use default API URL when not provided', async () => {
    process.env.GITHUB_TOKEN = 'test-token';
    delete process.env.GITHUB_API_URL;

    const clientModule = await import('../lib/client.mjs');
    GitHubClient = clientModule.GitHubClient;

    await import('../cli.mjs');

    expect(GitHubClient).toHaveBeenCalledWith({
      token: 'test-token',
      baseUrl: 'https://api.github.com'
    });
  });

  it('should configure program metadata', async () => {
    const commander = await import('commander');
    program = commander.program;

    await import('../cli.mjs');

    expect(program.name).toHaveBeenCalledWith('github-git');
    expect(program.description).toHaveBeenCalledWith('GitHub Git API CLI');
    expect(program.version).toHaveBeenCalledWith('1.0.0');
  });

  it('should register global options', async () => {
    const commander = await import('commander');
    program = commander.program;

    await import('../cli.mjs');

    expect(program.option).toHaveBeenCalledWith(
      '-t, --token <token>',
      'GitHub API token',
      process.env.GITHUB_TOKEN  // Will be undefined in test
    );
    expect(program.option).toHaveBeenCalledWith(
      '--api-url <url>',
      'GitHub API base URL',
      'https://api.github.com'
    );
  });

  it('should register all command modules', async () => {
    const commander = await import('commander');
    const blobModule = await import('../commands/blob.mjs');
    const commitModule = await import('../commands/commit.mjs');
    const refModule = await import('../commands/ref.mjs');
    const tagModule = await import('../commands/tag.mjs');
    const treeModule = await import('../commands/tree.mjs');
    
    program = commander.program;
    BlobCommands = blobModule.BlobCommands;
    CommitCommands = commitModule.CommitCommands;
    RefCommands = refModule.RefCommands;
    TagCommands = tagModule.TagCommands;
    TreeCommands = treeModule.TreeCommands;

    await import('../cli.mjs');

    // Verify command registration
    expect(program.command).toHaveBeenCalledWith('blob');
    expect(program.command).toHaveBeenCalledWith('commit');
    expect(program.command).toHaveBeenCalledWith('ref');
    expect(program.command).toHaveBeenCalledWith('tag');
    expect(program.command).toHaveBeenCalledWith('tree');

    // Verify command classes instantiation
    expect(BlobCommands).toHaveBeenCalled();
    expect(CommitCommands).toHaveBeenCalled();
    expect(RefCommands).toHaveBeenCalled();
    expect(TagCommands).toHaveBeenCalled();
    expect(TreeCommands).toHaveBeenCalled();
  });

  it('should parse command line arguments', async () => {
    const commander = await import('commander');
    program = commander.program;

    await import('../cli.mjs');

    expect(program.parse).toHaveBeenCalled();
  });

  it('should work without GITHUB_TOKEN', async () => {
    delete process.env.GITHUB_TOKEN;
    delete process.env.GITHUB_API_URL;

    const clientModule = await import('../lib/client.mjs');
    GitHubClient = clientModule.GitHubClient;

    await import('../cli.mjs');

    expect(GitHubClient).toHaveBeenCalledWith({
      token: undefined,
      baseUrl: 'https://api.github.com'
    });
  });

  it('should set up command descriptions', async () => {
    const commander = await import('commander');
    program = commander.program;
    
    const mockBlobCmd = { description: jest.fn().mockReturnThis() };
    const mockCommitCmd = { description: jest.fn().mockReturnThis() };
    const mockRefCmd = { description: jest.fn().mockReturnThis() };
    const mockTagCmd = { description: jest.fn().mockReturnThis() };
    const mockTreeCmd = { description: jest.fn().mockReturnThis() };

    program.command
      .mockReturnValueOnce(mockBlobCmd)
      .mockReturnValueOnce(mockCommitCmd)
      .mockReturnValueOnce(mockRefCmd)
      .mockReturnValueOnce(mockTagCmd)
      .mockReturnValueOnce(mockTreeCmd);

    await import('../cli.mjs');

    expect(mockBlobCmd.description).toHaveBeenCalledWith('Manage Git blobs');
    expect(mockCommitCmd.description).toHaveBeenCalledWith('Manage Git commits');
    expect(mockRefCmd.description).toHaveBeenCalledWith('Manage Git references');
    expect(mockTagCmd.description).toHaveBeenCalledWith('Manage Git tags');
    expect(mockTreeCmd.description).toHaveBeenCalledWith('Manage Git trees');
  });
});