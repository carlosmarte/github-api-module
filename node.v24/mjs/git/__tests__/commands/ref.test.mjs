import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

jest.unstable_mockModule('../../utils/format.mjs', () => ({
  formatOutput: jest.fn()
}));

const { formatOutput } = await import('../../utils/format.mjs');
const { RefCommands } = await import('../../commands/ref.mjs');

describe('RefCommands', () => {
  let refCommands;
  let mockClient;
  let mockProgram;
  let mockCommand;
  let consoleErrorSpy;
  let processExitSpy;

  beforeEach(() => {
    mockClient = {
      createRef: jest.fn(),
      getRef: jest.fn(),
      listMatchingRefs: jest.fn(),
      updateRef: jest.fn(),
      deleteRef: jest.fn()
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

    refCommands = new RefCommands(mockClient);
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
      refCommands.register(mockProgram);
      createAction = mockCommand.action.mock.calls[0][0];
    });

    it('should create reference', async () => {
      const options = {
        owner: 'test-owner',
        repo: 'test-repo',
        ref: 'refs/heads/feature',
        sha: 'abc123',
        json: false
      };

      mockClient.createRef.mockResolvedValue({ ref: 'refs/heads/feature', object: { sha: 'abc123' } });

      await createAction(options);

      expect(mockClient.createRef).toHaveBeenCalledWith(
        'test-owner',
        'test-repo',
        'refs/heads/feature',
        'abc123'
      );
      expect(formatOutput).toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      const options = {
        owner: 'test-owner',
        repo: 'test-repo',
        ref: 'refs/heads/invalid',
        sha: 'invalid'
      };

      mockClient.createRef.mockRejectedValue(new Error('Invalid SHA'));

      await createAction(options);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error creating reference:', 'Invalid SHA');
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('get command', () => {
    let getAction;

    beforeEach(() => {
      refCommands.register(mockProgram);
      getAction = mockCommand.action.mock.calls[1][0];
    });

    it('should get reference', async () => {
      const options = {
        owner: 'test-owner',
        repo: 'test-repo',
        ref: 'heads/main',
        json: true
      };

      const refData = { ref: 'refs/heads/main', object: { sha: 'def456' } };
      mockClient.getRef.mockResolvedValue(refData);

      await getAction(options);

      expect(mockClient.getRef).toHaveBeenCalledWith(
        'test-owner',
        'test-repo',
        'heads/main'
      );
      expect(formatOutput).toHaveBeenCalledWith(refData, true);
    });

    it('should handle not found errors', async () => {
      const options = {
        owner: 'test-owner',
        repo: 'test-repo',
        ref: 'heads/nonexistent'
      };

      mockClient.getRef.mockRejectedValue(new Error('Reference not found'));

      await getAction(options);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error getting reference:', 'Reference not found');
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });
});