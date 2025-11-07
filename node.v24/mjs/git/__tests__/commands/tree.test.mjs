import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

jest.unstable_mockModule('../../utils/format.mjs', () => ({
  formatOutput: jest.fn()
}));

const { formatOutput } = await import('../../utils/format.mjs');
const { TreeCommands } = await import('../../commands/tree.mjs');

describe('TreeCommands', () => {
  let treeCommands;
  let mockClient;
  let mockProgram;
  let mockCommand;
  let consoleErrorSpy;
  let processExitSpy;

  beforeEach(() => {
    mockClient = {
      createTree: jest.fn(),
      getTree: jest.fn()
    };

    mockCommand = {
      description: jest.fn().mockReturnThis(),
      requiredOption: jest.fn().mockReturnThis(),
      option: jest.fn().mockReturnThis(),
      action: jest.fn().mockReturnThis()
    };

    mockProgram = {
      command: jest.fn().mockReturnValue(mockCommand)
    };

    treeCommands = new TreeCommands(mockClient);
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  describe('create command', () => {
    let createAction;

    beforeEach(() => {
      treeCommands.register(mockProgram);
      createAction = mockCommand.action.mock.calls[0][0];
    });

    it('should create tree without base tree', async () => {
      const options = {
        owner: 'test-owner',
        repo: 'test-repo',
        tree: JSON.stringify([
          { path: 'file.txt', mode: '100644', type: 'blob', sha: 'blob123' }
        ]),
        json: false
      };

      mockClient.createTree.mockResolvedValue({ sha: 'tree123', tree: [] });

      await createAction(options);

      expect(mockClient.createTree).toHaveBeenCalledWith(
        'test-owner',
        'test-repo',
        [{ path: 'file.txt', mode: '100644', type: 'blob', sha: 'blob123' }],
        undefined
      );
      expect(formatOutput).toHaveBeenCalled();
    });

    it('should create tree with base tree', async () => {
      const options = {
        owner: 'test-owner',
        repo: 'test-repo',
        tree: JSON.stringify([
          { path: 'new.txt', mode: '100644', type: 'blob', content: 'new content' }
        ]),
        baseTree: 'base-tree-123',
        json: true
      };

      mockClient.createTree.mockResolvedValue({ sha: 'tree456', tree: [] });

      await createAction(options);

      expect(mockClient.createTree).toHaveBeenCalledWith(
        'test-owner',
        'test-repo',
        [{ path: 'new.txt', mode: '100644', type: 'blob', content: 'new content' }],
        'base-tree-123'
      );
      expect(formatOutput).toHaveBeenCalledWith({ sha: 'tree456', tree: [] }, true);
    });

    it('should handle invalid JSON', async () => {
      const options = {
        owner: 'test-owner',
        repo: 'test-repo',
        tree: 'invalid json'
      };

      await createAction(options);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error creating tree:', expect.stringContaining('JSON'));
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should handle API errors', async () => {
      const options = {
        owner: 'test-owner',
        repo: 'test-repo',
        tree: JSON.stringify([{ path: 'file.txt', mode: '100644', type: 'blob', sha: 'invalid' }])
      };

      mockClient.createTree.mockRejectedValue(new Error('Invalid blob SHA'));

      await createAction(options);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error creating tree:', 'Invalid blob SHA');
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('get command', () => {
    let getAction;

    beforeEach(() => {
      treeCommands.register(mockProgram);
      getAction = mockCommand.action.mock.calls[1][0];
    });

    it('should get tree non-recursively', async () => {
      const options = {
        owner: 'test-owner',
        repo: 'test-repo',
        sha: 'tree123',
        json: false
      };

      const treeData = {
        sha: 'tree123',
        truncated: false,
        tree: [
          { path: 'file1.txt', type: 'blob', mode: '100644', sha: 'blob123' },
          { path: 'dir', type: 'tree', mode: '040000', sha: 'tree456' }
        ]
      };
      mockClient.getTree.mockResolvedValue(treeData);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await getAction(options);

      expect(mockClient.getTree).toHaveBeenCalledWith(
        'test-owner',
        'test-repo',
        'tree123',
        undefined  // options.recursive is undefined when not set
      );
      expect(consoleSpy).toHaveBeenCalledWith('Tree SHA: tree123');
      expect(consoleSpy).toHaveBeenCalledWith('Truncated: false');
      
      consoleSpy.mockRestore();
    });

    it('should get tree recursively', async () => {
      const options = {
        owner: 'test-owner',
        repo: 'test-repo',
        sha: 'tree456',
        recursive: true,
        json: true
      };

      const treeData = {
        sha: 'tree456',
        tree: [
          { path: 'file1.txt', type: 'blob', mode: '100644', sha: 'blob789' },
          { path: 'dir/file2.txt', type: 'blob', mode: '100644', sha: 'blob012' }
        ],
        truncated: false
      };
      mockClient.getTree.mockResolvedValue(treeData);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await getAction(options);

      expect(mockClient.getTree).toHaveBeenCalledWith(
        'test-owner',
        'test-repo',
        'tree456',
        true
      );
      expect(consoleSpy).toHaveBeenCalledWith(JSON.stringify(treeData, null, 2));
      
      consoleSpy.mockRestore();
    });

    it('should handle not found errors', async () => {
      const options = {
        owner: 'test-owner',
        repo: 'test-repo',
        sha: 'invalid'
      };

      mockClient.getTree.mockRejectedValue(new Error('Tree not found'));

      await getAction(options);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error getting tree:', 'Tree not found');
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });
});