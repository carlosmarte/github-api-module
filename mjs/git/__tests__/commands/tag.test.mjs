import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

jest.unstable_mockModule('../../utils/format.mjs', () => ({
  formatOutput: jest.fn()
}));

const { formatOutput } = await import('../../utils/format.mjs');
const { TagCommands } = await import('../../commands/tag.mjs');

describe('TagCommands', () => {
  let tagCommands;
  let mockClient;
  let mockProgram;
  let mockCommand;
  let consoleErrorSpy;
  let processExitSpy;

  beforeEach(() => {
    mockClient = {
      createTag: jest.fn(),
      getTag: jest.fn()
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

    tagCommands = new TagCommands(mockClient);
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
      tagCommands.register(mockProgram);
      createAction = mockCommand.action.mock.calls[0][0];
    });

    it('should create tag with minimal options', async () => {
      const options = {
        owner: 'test-owner',
        repo: 'test-repo',
        tag: 'v1.0.0',
        message: 'Release v1.0.0',
        object: 'commit123',
        type: 'commit',
        json: false
      };

      mockClient.createTag.mockResolvedValue({ tag: 'v1.0.0', sha: 'tag123' });

      await createAction(options);

      expect(mockClient.createTag).toHaveBeenCalledWith(
        'test-owner',
        'test-repo',
        'v1.0.0',
        'Release v1.0.0',
        'commit123',
        'commit',
        null
      );
      expect(formatOutput).toHaveBeenCalled();
    });

    it('should create tag with tagger details', async () => {
      const mockDate = '2024-01-15T12:00:00.000Z';
      const dateSpy = jest.spyOn(Date.prototype, 'toISOString').mockReturnValue(mockDate);

      const options = {
        owner: 'test-owner',
        repo: 'test-repo',
        tag: 'v2.0.0',
        message: 'Release v2.0.0',
        object: 'commit456',
        type: 'commit',
        taggerName: 'John Doe',
        taggerEmail: 'john@example.com'
      };

      mockClient.createTag.mockResolvedValue({ tag: 'v2.0.0', sha: 'tag456' });

      await createAction(options);

      expect(mockClient.createTag).toHaveBeenCalledWith(
        'test-owner',
        'test-repo',
        'v2.0.0',
        'Release v2.0.0',
        'commit456',
        'commit',
        {
          name: 'John Doe',
          email: 'john@example.com',
          date: mockDate
        }
      );

      dateSpy.mockRestore();
    });

    it('should handle API errors', async () => {
      const options = {
        owner: 'test-owner',
        repo: 'test-repo',
        tag: 'v3.0.0',
        message: 'Release',
        object: 'invalid',
        type: 'commit'
      };

      mockClient.createTag.mockRejectedValue(new Error('Invalid object'));

      await createAction(options);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error creating tag:', 'Invalid object');
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('get command', () => {
    let getAction;

    beforeEach(() => {
      tagCommands.register(mockProgram);
      getAction = mockCommand.action.mock.calls[1][0];
    });

    it('should get tag', async () => {
      const options = {
        owner: 'test-owner',
        repo: 'test-repo',
        sha: 'tag123',
        json: true
      };

      const tagData = {
        tag: 'v1.0.0',
        message: 'Release v1.0.0',
        object: { sha: 'commit123', type: 'commit' }
      };
      mockClient.getTag.mockResolvedValue(tagData);

      await getAction(options);

      expect(mockClient.getTag).toHaveBeenCalledWith(
        'test-owner',
        'test-repo',
        'tag123'
      );
      expect(formatOutput).toHaveBeenCalledWith(tagData, true);
    });

    it('should handle not found errors', async () => {
      const options = {
        owner: 'test-owner',
        repo: 'test-repo',
        sha: 'invalid'
      };

      mockClient.getTag.mockRejectedValue(new Error('Tag not found'));

      await getAction(options);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error getting tag:', 'Tag not found');
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });
});