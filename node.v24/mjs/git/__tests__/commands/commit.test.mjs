import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Mock format utility
jest.unstable_mockModule('../../utils/format.mjs', () => ({
  formatOutput: jest.fn()
}));

const { formatOutput } = await import('../../utils/format.mjs');
const { CommitCommands } = await import('../../commands/commit.mjs');

describe('CommitCommands', () => {
  let commitCommands;
  let mockClient;
  let mockProgram;
  let mockCommand;
  let consoleErrorSpy;
  let processExitSpy;

  beforeEach(() => {
    // Mock client
    mockClient = {
      createCommit: jest.fn(),
      getCommit: jest.fn()
    };

    // Mock commander
    mockCommand = {
      description: jest.fn().mockReturnThis(),
      requiredOption: jest.fn().mockReturnThis(),
      option: jest.fn().mockReturnThis(),
      action: jest.fn().mockReturnThis()
    };

    mockProgram = {
      command: jest.fn().mockReturnValue(mockCommand)
    };

    // Create instance
    commitCommands = new CommitCommands(mockClient);

    // Spy on console and process
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  describe('register', () => {
    it('should register create and get commands', () => {
      commitCommands.register(mockProgram);

      expect(mockProgram.command).toHaveBeenCalledTimes(2);
      expect(mockProgram.command).toHaveBeenCalledWith('create');
      expect(mockProgram.command).toHaveBeenCalledWith('get');
    });
  });

  describe('create command', () => {
    let createAction;

    beforeEach(() => {
      commitCommands.register(mockProgram);
      createAction = mockCommand.action.mock.calls[0][0];
    });

    it('should create commit with minimal options', async () => {
      const options = {
        owner: 'test-owner',
        repo: 'test-repo',
        message: 'Test commit',
        tree: 'tree123',
        json: false
      };

      mockClient.createCommit.mockResolvedValue({ sha: 'commit123' });

      await createAction(options);

      expect(mockClient.createCommit).toHaveBeenCalledWith(
        'test-owner',
        'test-repo',
        'Test commit',
        'tree123',
        [],
        null,
        null
      );
      expect(formatOutput).toHaveBeenCalledWith({ sha: 'commit123' }, false);
    });

    it('should create commit with parents', async () => {
      const options = {
        owner: 'test-owner',
        repo: 'test-repo',
        message: 'Merge commit',
        tree: 'tree456',
        parents: ['parent1', 'parent2'],
        json: true
      };

      mockClient.createCommit.mockResolvedValue({ sha: 'merge123' });

      await createAction(options);

      expect(mockClient.createCommit).toHaveBeenCalledWith(
        'test-owner',
        'test-repo',
        'Merge commit',
        'tree456',
        ['parent1', 'parent2'],
        null,
        null
      );
      expect(formatOutput).toHaveBeenCalledWith({ sha: 'merge123' }, true);
    });

    it('should create commit with author details', async () => {
      const options = {
        owner: 'test-owner',
        repo: 'test-repo',
        message: 'Authored commit',
        tree: 'tree789',
        authorName: 'John Doe',
        authorEmail: 'john@example.com',
        authorDate: '2024-01-01T00:00:00Z'
      };

      mockClient.createCommit.mockResolvedValue({ sha: 'author123' });

      await createAction(options);

      expect(mockClient.createCommit).toHaveBeenCalledWith(
        'test-owner',
        'test-repo',
        'Authored commit',
        'tree789',
        [],
        {
          name: 'John Doe',
          email: 'john@example.com',
          date: '2024-01-01T00:00:00Z'
        },
        null
      );
    });

    it('should use current date when author date not provided', async () => {
      const mockDate = '2024-01-15T12:00:00.000Z';
      const dateSpy = jest.spyOn(Date.prototype, 'toISOString').mockReturnValue(mockDate);

      const options = {
        owner: 'test-owner',
        repo: 'test-repo',
        message: 'Test',
        tree: 'tree000',
        authorName: 'Jane Doe',
        authorEmail: 'jane@example.com'
      };

      mockClient.createCommit.mockResolvedValue({ sha: 'date123' });

      await createAction(options);

      expect(mockClient.createCommit).toHaveBeenCalledWith(
        'test-owner',
        'test-repo',
        'Test',
        'tree000',
        [],
        {
          name: 'Jane Doe',
          email: 'jane@example.com',
          date: mockDate
        },
        null
      );

      dateSpy.mockRestore();
    });

    it('should create commit with committer details', async () => {
      const options = {
        owner: 'test-owner',
        repo: 'test-repo',
        message: 'Committed',
        tree: 'treeabc',
        committerName: 'Bot User',
        committerEmail: 'bot@example.com',
        committerDate: '2024-02-01T00:00:00Z'
      };

      mockClient.createCommit.mockResolvedValue({ sha: 'committer123' });

      await createAction(options);

      expect(mockClient.createCommit).toHaveBeenCalledWith(
        'test-owner',
        'test-repo',
        'Committed',
        'treeabc',
        [],
        null,
        {
          name: 'Bot User',
          email: 'bot@example.com',
          date: '2024-02-01T00:00:00Z'
        }
      );
    });

    it('should handle API errors', async () => {
      const options = {
        owner: 'test-owner',
        repo: 'test-repo',
        message: 'Error commit',
        tree: 'badtree'
      };

      mockClient.createCommit.mockRejectedValue(new Error('Invalid tree'));

      await createAction(options);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error creating commit:',
        'Invalid tree'
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('get command', () => {
    let getAction;

    beforeEach(() => {
      commitCommands.register(mockProgram);
      getAction = mockCommand.action.mock.calls[1][0];
    });

    it('should get commit and display output', async () => {
      const options = {
        owner: 'test-owner',
        repo: 'test-repo',
        sha: 'commit123',
        json: false
      };

      const commitData = {
        sha: 'commit123',
        message: 'Test commit',
        tree: { sha: 'tree123' },
        parents: []
      };

      mockClient.getCommit.mockResolvedValue(commitData);

      await getAction(options);

      expect(mockClient.getCommit).toHaveBeenCalledWith(
        'test-owner',
        'test-repo',
        'commit123'
      );
      expect(formatOutput).toHaveBeenCalledWith(commitData, false);
    });

    it('should output as JSON when flag is set', async () => {
      const options = {
        owner: 'test-owner',
        repo: 'test-repo',
        sha: 'commit456',
        json: true
      };

      const commitData = {
        sha: 'commit456',
        message: 'Another commit'
      };

      mockClient.getCommit.mockResolvedValue(commitData);

      await getAction(options);

      expect(formatOutput).toHaveBeenCalledWith(commitData, true);
    });

    it('should handle API errors', async () => {
      const options = {
        owner: 'test-owner',
        repo: 'test-repo',
        sha: 'invalid'
      };

      mockClient.getCommit.mockRejectedValue(new Error('Commit not found'));

      await getAction(options);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error getting commit:',
        'Commit not found'
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });
});