import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Mock fs/promises
jest.unstable_mockModule('fs/promises', () => ({
  default: {
    readFile: jest.fn(),
    writeFile: jest.fn()
  },
  readFile: jest.fn(),
  writeFile: jest.fn()
}));

// Mock format utility
jest.unstable_mockModule('../../utils/format.mjs', () => ({
  formatOutput: jest.fn()
}));

const fsModule = await import('fs/promises');
const fs = fsModule.default;
const { formatOutput } = await import('../../utils/format.mjs');
const { BlobCommands } = await import('../../commands/blob.mjs');

describe('BlobCommands', () => {
  let blobCommands;
  let mockClient;
  let mockProgram;
  let mockCommand;
  let consoleErrorSpy;
  let processExitSpy;

  beforeEach(() => {
    // Mock client
    mockClient = {
      createBlob: jest.fn(),
      getBlob: jest.fn()
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
    blobCommands = new BlobCommands(mockClient);

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
      blobCommands.register(mockProgram);

      expect(mockProgram.command).toHaveBeenCalledTimes(2);
      expect(mockProgram.command).toHaveBeenCalledWith('create');
      expect(mockProgram.command).toHaveBeenCalledWith('get');
    });

    it('should configure create command options', () => {
      blobCommands.register(mockProgram);

      const createCalls = mockProgram.command.mock.calls[0];
      expect(createCalls[0]).toBe('create');

      expect(mockCommand.description).toHaveBeenCalledWith('Create a new blob');
      expect(mockCommand.requiredOption).toHaveBeenCalledWith(
        '-o, --owner <owner>', 
        'Repository owner'
      );
      expect(mockCommand.requiredOption).toHaveBeenCalledWith(
        '-r, --repo <repo>', 
        'Repository name'
      );
      expect(mockCommand.option).toHaveBeenCalledWith(
        '-c, --content <content>', 
        'Blob content'
      );
      expect(mockCommand.option).toHaveBeenCalledWith(
        '-f, --file <file>', 
        'Read content from file'
      );
      expect(mockCommand.option).toHaveBeenCalledWith(
        '-e, --encoding <encoding>', 
        'Content encoding (utf-8 or base64)', 
        'utf-8'
      );
      expect(mockCommand.option).toHaveBeenCalledWith(
        '--json', 
        'Output as JSON'
      );
    });

    it('should configure get command options', () => {
      blobCommands.register(mockProgram);

      // Switch to second command registration
      mockProgram.command.mockClear();
      mockCommand.description.mockClear();
      mockCommand.requiredOption.mockClear();
      mockCommand.option.mockClear();

      blobCommands.register(mockProgram);
      const getCalls = mockProgram.command.mock.calls[1];
      expect(getCalls[0]).toBe('get');

      expect(mockCommand.requiredOption).toHaveBeenCalledWith(
        '-s, --sha <sha>', 
        'Blob SHA'
      );
      expect(mockCommand.option).toHaveBeenCalledWith(
        '--save <file>', 
        'Save content to file'
      );
    });
  });

  describe('create command', () => {
    let createAction;

    beforeEach(() => {
      blobCommands.register(mockProgram);
      createAction = mockCommand.action.mock.calls[0][0];
    });

    it('should create blob with content option', async () => {
      const options = {
        owner: 'test-owner',
        repo: 'test-repo',
        content: 'test content',
        encoding: 'utf-8',
        json: false
      };

      mockClient.createBlob.mockResolvedValue({ sha: 'abc123' });

      await createAction(options);

      expect(mockClient.createBlob).toHaveBeenCalledWith(
        'test-owner',
        'test-repo',
        'test content',
        'utf-8'
      );
      expect(formatOutput).toHaveBeenCalledWith(
        { sha: 'abc123' },
        false
      );
    });

    it('should create blob from file with utf-8 encoding', async () => {
      const options = {
        owner: 'test-owner',
        repo: 'test-repo',
        file: 'test.txt',
        encoding: 'utf-8',
        json: false
      };

      const fileContent = Buffer.from('file content');
      fs.readFile.mockResolvedValue(fileContent);
      mockClient.createBlob.mockResolvedValue({ sha: 'def456' });

      await createAction(options);

      expect(fs.readFile).toHaveBeenCalledWith('test.txt');
      expect(mockClient.createBlob).toHaveBeenCalledWith(
        'test-owner',
        'test-repo',
        'file content',
        'utf-8'
      );
    });

    it('should create blob from file with base64 encoding', async () => {
      const options = {
        owner: 'test-owner',
        repo: 'test-repo',
        file: 'binary.bin',
        encoding: 'base64',
        json: true
      };

      const fileContent = Buffer.from('binary data');
      fs.readFile.mockResolvedValue(fileContent);
      mockClient.createBlob.mockResolvedValue({ sha: 'ghi789' });

      await createAction(options);

      expect(fs.readFile).toHaveBeenCalledWith('binary.bin');
      expect(mockClient.createBlob).toHaveBeenCalledWith(
        'test-owner',
        'test-repo',
        fileContent.toString('base64'),
        'base64'
      );
      expect(formatOutput).toHaveBeenCalledWith(
        { sha: 'ghi789' },
        true
      );
    });

    it('should error when neither content nor file is provided', async () => {
      const options = {
        owner: 'test-owner',
        repo: 'test-repo',
        encoding: 'utf-8'
      };

      await createAction(options);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error creating blob:',
        'Either --content or --file must be provided'
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
      expect(mockClient.createBlob).not.toHaveBeenCalled();
    });

    it('should handle file read errors', async () => {
      const options = {
        owner: 'test-owner',
        repo: 'test-repo',
        file: 'nonexistent.txt',
        encoding: 'utf-8'
      };

      fs.readFile.mockRejectedValue(new Error('File not found'));

      await createAction(options);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error creating blob:',
        'File not found'
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should handle API errors', async () => {
      const options = {
        owner: 'test-owner',
        repo: 'test-repo',
        content: 'test content',
        encoding: 'utf-8'
      };

      mockClient.createBlob.mockRejectedValue(new Error('API error'));

      await createAction(options);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error creating blob:',
        'API error'
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('get command', () => {
    let getAction;

    beforeEach(() => {
      blobCommands.register(mockProgram);
      getAction = mockCommand.action.mock.calls[1][0];
    });

    it('should get blob and display output', async () => {
      const options = {
        owner: 'test-owner',
        repo: 'test-repo',
        sha: 'abc123',
        json: false
      };

      const blobData = {
        content: 'dGVzdCBjb250ZW50',
        encoding: 'base64',
        sha: 'abc123'
      };

      mockClient.getBlob.mockResolvedValue(blobData);

      await getAction(options);

      expect(mockClient.getBlob).toHaveBeenCalledWith(
        'test-owner',
        'test-repo',
        'abc123'
      );
      expect(formatOutput).toHaveBeenCalledWith(blobData, false);
    });

    it('should get blob and save to file with base64 encoding', async () => {
      const options = {
        owner: 'test-owner',
        repo: 'test-repo',
        sha: 'def456',
        save: 'output.txt'
      };

      const blobData = {
        content: 'dGVzdCBjb250ZW50',
        encoding: 'base64'
      };

      mockClient.getBlob.mockResolvedValue(blobData);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await getAction(options);

      const expectedBuffer = Buffer.from('dGVzdCBjb250ZW50', 'base64');
      expect(fs.writeFile).toHaveBeenCalledWith('output.txt', expectedBuffer);
      expect(consoleSpy).toHaveBeenCalledWith('Blob saved to output.txt');
      
      consoleSpy.mockRestore();
    });

    it('should get blob and save to file with utf-8 encoding', async () => {
      const options = {
        owner: 'test-owner',
        repo: 'test-repo',
        sha: 'ghi789',
        save: 'text.txt'
      };

      const blobData = {
        content: 'plain text content',
        encoding: 'utf-8'
      };

      mockClient.getBlob.mockResolvedValue(blobData);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await getAction(options);

      expect(fs.writeFile).toHaveBeenCalledWith('text.txt', 'plain text content');
      expect(consoleSpy).toHaveBeenCalledWith('Blob saved to text.txt');
      
      consoleSpy.mockRestore();
    });

    it('should output as JSON when flag is set', async () => {
      const options = {
        owner: 'test-owner',
        repo: 'test-repo',
        sha: 'jkl012',
        json: true
      };

      const blobData = {
        content: 'content',
        encoding: 'utf-8',
        sha: 'jkl012'
      };

      mockClient.getBlob.mockResolvedValue(blobData);

      await getAction(options);

      expect(formatOutput).toHaveBeenCalledWith(blobData, true);
    });

    it('should handle API errors', async () => {
      const options = {
        owner: 'test-owner',
        repo: 'test-repo',
        sha: 'invalid'
      };

      mockClient.getBlob.mockRejectedValue(new Error('Blob not found'));

      await getAction(options);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error getting blob:',
        'Blob not found'
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should handle file write errors', async () => {
      const options = {
        owner: 'test-owner',
        repo: 'test-repo',
        sha: 'mno345',
        save: '/invalid/path.txt'
      };

      const blobData = {
        content: 'content',
        encoding: 'utf-8'
      };

      mockClient.getBlob.mockResolvedValue(blobData);
      fs.writeFile.mockRejectedValue(new Error('Permission denied'));

      await getAction(options);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error getting blob:',
        'Permission denied'
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('Edge cases', () => {
    let createAction;
    let getAction;

    beforeEach(() => {
      blobCommands.register(mockProgram);
      createAction = mockCommand.action.mock.calls[0][0];
      getAction = mockCommand.action.mock.calls[1][0];
    });

    it('should handle empty content', async () => {
      const options = {
        owner: 'test-owner',
        repo: 'test-repo',
        content: '',
        encoding: 'utf-8'
      };

      // Empty content should be rejected as per the implementation
      await createAction(options);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error creating blob:',
        'Either --content or --file must be provided'
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should handle large files', async () => {
      const options = {
        owner: 'test-owner',
        repo: 'test-repo',
        file: 'large.bin',
        encoding: 'base64'
      };

      const largeContent = Buffer.alloc(10 * 1024 * 1024); // 10MB
      fs.readFile.mockResolvedValue(largeContent);
      mockClient.createBlob.mockResolvedValue({ sha: 'large123' });

      await createAction(options);

      expect(mockClient.createBlob).toHaveBeenCalledWith(
        'test-owner',
        'test-repo',
        largeContent.toString('base64'),
        'base64'
      );
    });

    it('should handle special characters in content', async () => {
      const options = {
        owner: 'test-owner',
        repo: 'test-repo',
        content: '特殊字符 🎉 \n\t\r',
        encoding: 'utf-8'
      };

      mockClient.createBlob.mockResolvedValue({ sha: 'special123' });

      await createAction(options);

      expect(mockClient.createBlob).toHaveBeenCalledWith(
        'test-owner',
        'test-repo',
        '特殊字符 🎉 \n\t\r',
        'utf-8'
      );
    });
  });
});