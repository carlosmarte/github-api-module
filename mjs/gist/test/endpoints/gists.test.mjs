import { jest } from '@jest/globals';
import { GistsEndpoint } from '../../lib/endpoints/gists.mjs';
import { ValidationError } from '../../lib/utils/errors.mjs';
import '../setup.mjs';

describe('GistsEndpoint', () => {
  let gistsEndpoint;
  let mockClient;

  beforeEach(() => {
    mockClient = {
      get: jest.fn(),
      post: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
      auth: {
        requireAuth: jest.fn()
      }
    };
    gistsEndpoint = new GistsEndpoint(mockClient);
  });

  describe('list', () => {
    it('should list gists with default options', async () => {
      const mockGists = [{ id: '1', description: 'Test 1' }];
      mockClient.get.mockResolvedValue({ data: mockGists });

      const result = await gistsEndpoint.list();

      expect(mockClient.get).toHaveBeenCalledWith('/gists', { params: {} });
      expect(result).toEqual(mockGists);
    });

    it('should list gists with pagination options', async () => {
      const mockGists = [{ id: '1' }, { id: '2' }];
      mockClient.get.mockResolvedValue({ data: mockGists });

      const result = await gistsEndpoint.list({ per_page: 10, page: 2 });

      expect(mockClient.get).toHaveBeenCalledWith('/gists', {
        params: { per_page: 10, page: 2 }
      });
      expect(result).toEqual(mockGists);
    });
  });

  describe('listPublic', () => {
    it('should list public gists', async () => {
      const mockGists = [{ id: 'pub1', public: true }];
      mockClient.get.mockResolvedValue({ data: mockGists });

      const result = await gistsEndpoint.listPublic();

      expect(mockClient.get).toHaveBeenCalledWith('/gists/public', { params: {} });
      expect(result).toEqual(mockGists);
    });
  });

  describe('listStarred', () => {
    it('should list starred gists and require auth', async () => {
      const mockGists = [{ id: 'star1', starred: true }];
      mockClient.get.mockResolvedValue({ data: mockGists });

      const result = await gistsEndpoint.listStarred();

      expect(mockClient.auth.requireAuth).toHaveBeenCalled();
      expect(mockClient.get).toHaveBeenCalledWith('/gists/starred', { params: {} });
      expect(result).toEqual(mockGists);
    });
  });

  describe('listForUser', () => {
    it('should list gists for a specific user', async () => {
      const mockGists = [{ id: 'user1', owner: { login: 'testuser' } }];
      mockClient.get.mockResolvedValue({ data: mockGists });

      const result = await gistsEndpoint.listForUser('testuser');

      expect(mockClient.get).toHaveBeenCalledWith('/users/testuser/gists', { params: {} });
      expect(result).toEqual(mockGists);
    });

    it('should throw error when username is not provided', async () => {
      await expect(gistsEndpoint.listForUser()).rejects.toThrow(ValidationError);
      await expect(gistsEndpoint.listForUser('')).rejects.toThrow('Username is required');
    });
  });

  describe('get', () => {
    it('should get a single gist', async () => {
      const mockGist = { id: '123', description: 'Test gist' };
      mockClient.get.mockResolvedValue({ data: mockGist });

      const result = await gistsEndpoint.get('123');

      expect(mockClient.get).toHaveBeenCalledWith('/gists/123', { mediaType: undefined });
      expect(result).toEqual(mockGist);
    });

    it('should get raw content when raw option is true', async () => {
      const mockGist = { id: '123', files: { 'test.js': { content: 'raw content' } } };
      mockClient.get.mockResolvedValue({ data: mockGist });

      const result = await gistsEndpoint.get('123', { raw: true });

      expect(mockClient.get).toHaveBeenCalledWith('/gists/123', {
        mediaType: 'application/vnd.github.raw+json'
      });
      expect(result).toEqual(mockGist);
    });

    it('should get base64 content when base64 option is true', async () => {
      const mockGist = { id: '123', files: { 'test.js': { content: 'YmFzZTY0' } } };
      mockClient.get.mockResolvedValue({ data: mockGist });

      const result = await gistsEndpoint.get('123', { base64: true });

      expect(mockClient.get).toHaveBeenCalledWith('/gists/123', {
        mediaType: 'application/vnd.github.base64+json'
      });
      expect(result).toEqual(mockGist);
    });

    it('should throw error when gist ID is not provided', async () => {
      await expect(gistsEndpoint.get()).rejects.toThrow(ValidationError);
      await expect(gistsEndpoint.get('')).rejects.toThrow('Gist ID is required');
    });
  });

  describe('getRevision', () => {
    it('should get a specific gist revision', async () => {
      const mockRevision = { id: '123', history: [{ version: 'abc123' }] };
      mockClient.get.mockResolvedValue({ data: mockRevision });

      const result = await gistsEndpoint.getRevision('123', 'abc123');

      expect(mockClient.get).toHaveBeenCalledWith('/gists/123/abc123', { mediaType: undefined });
      expect(result).toEqual(mockRevision);
    });

    it('should throw error when gist ID or SHA is missing', async () => {
      await expect(gistsEndpoint.getRevision()).rejects.toThrow(ValidationError);
      await expect(gistsEndpoint.getRevision('123')).rejects.toThrow('Gist ID and SHA are required');
      await expect(gistsEndpoint.getRevision('', 'abc')).rejects.toThrow('Gist ID and SHA are required');
    });
  });

  describe('create', () => {
    it('should create a new gist', async () => {
      const newGist = {
        description: 'Test gist',
        public: true,
        files: {
          'test.js': { content: 'console.log("hello");' }
        }
      };
      const mockResponse = { id: 'new123', ...newGist };
      mockClient.post.mockResolvedValue({ data: mockResponse });

      const result = await gistsEndpoint.create(newGist);

      expect(mockClient.auth.requireAuth).toHaveBeenCalled();
      expect(mockClient.post).toHaveBeenCalledWith('/gists', newGist);
      expect(result).toEqual(mockResponse);
    });

    it('should throw error when no files are provided', async () => {
      await expect(gistsEndpoint.create({ description: 'Test' }))
        .rejects.toThrow('At least one file is required');
      
      await expect(gistsEndpoint.create({ files: {} }))
        .rejects.toThrow('At least one file is required');
    });

    it('should throw error when file content is missing', async () => {
      const invalidGist = {
        files: {
          'test.js': { }
        }
      };

      await expect(gistsEndpoint.create(invalidGist))
        .rejects.toThrow('Content is required for file: test.js');
    });

    it('should throw error for invalid gistfile names', async () => {
      const invalidGist = {
        files: {
          'gistfile1': { content: 'test' }
        }
      };

      await expect(gistsEndpoint.create(invalidGist))
        .rejects.toThrow('Invalid filename: gistfile1');
    });
  });

  describe('update', () => {
    it('should update a gist', async () => {
      const updateData = {
        description: 'Updated description',
        files: {
          'test.js': { content: 'updated content' }
        }
      };
      const mockResponse = { id: '123', ...updateData };
      mockClient.patch.mockResolvedValue({ data: mockResponse });

      const result = await gistsEndpoint.update('123', updateData);

      expect(mockClient.auth.requireAuth).toHaveBeenCalled();
      expect(mockClient.patch).toHaveBeenCalledWith('/gists/123', updateData);
      expect(result).toEqual(mockResponse);
    });

    it('should throw error when gist ID is not provided', async () => {
      await expect(gistsEndpoint.update()).rejects.toThrow(ValidationError);
      await expect(gistsEndpoint.update('', {})).rejects.toThrow('Gist ID is required');
    });
  });

  describe('delete', () => {
    it('should delete a gist', async () => {
      mockClient.delete.mockResolvedValue({});

      const result = await gistsEndpoint.delete('123');

      expect(mockClient.auth.requireAuth).toHaveBeenCalled();
      expect(mockClient.delete).toHaveBeenCalledWith('/gists/123');
      expect(result).toBe(true);
    });

    it('should throw error when gist ID is not provided', async () => {
      await expect(gistsEndpoint.delete()).rejects.toThrow(ValidationError);
      await expect(gistsEndpoint.delete('')).rejects.toThrow('Gist ID is required');
    });
  });

  describe('fork', () => {
    it('should fork a gist', async () => {
      const mockFork = { id: 'fork123', fork_of: { id: '123' } };
      mockClient.post.mockResolvedValue({ data: mockFork });

      const result = await gistsEndpoint.fork('123');

      expect(mockClient.auth.requireAuth).toHaveBeenCalled();
      expect(mockClient.post).toHaveBeenCalledWith('/gists/123/forks');
      expect(result).toEqual(mockFork);
    });

    it('should throw error when gist ID is not provided', async () => {
      await expect(gistsEndpoint.fork()).rejects.toThrow(ValidationError);
      await expect(gistsEndpoint.fork('')).rejects.toThrow('Gist ID is required');
    });
  });

  describe('listForks', () => {
    it('should list forks of a gist', async () => {
      const mockForks = [{ id: 'fork1' }, { id: 'fork2' }];
      mockClient.get.mockResolvedValue({ data: mockForks });

      const result = await gistsEndpoint.listForks('123');

      expect(mockClient.get).toHaveBeenCalledWith('/gists/123/forks', { params: {} });
      expect(result).toEqual(mockForks);
    });

    it('should throw error when gist ID is not provided', async () => {
      await expect(gistsEndpoint.listForks()).rejects.toThrow(ValidationError);
      await expect(gistsEndpoint.listForks('')).rejects.toThrow('Gist ID is required');
    });
  });

  describe('iterate', () => {
    it('should iterate through paginated gists', async () => {
      const page1 = [{ id: '1' }, { id: '2' }];
      const page2 = [{ id: '3' }];
      const page3 = [];
      
      let callCount = 0;
      gistsEndpoint.list = jest.fn().mockImplementation(async (params) => {
        callCount++;
        if (callCount === 1) return page1;
        if (callCount === 2) return page2;
        return page3;
      });

      const results = [];
      for await (const gist of gistsEndpoint.iterate()) {
        results.push(gist);
      }

      expect(results).toEqual([...page1, ...page2]);
    });
  });
});