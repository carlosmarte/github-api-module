import TeamsClient, { createClient, models } from './index.mjs';

describe('GitHub Teams API Module', () => {
  describe('Module Exports', () => {
    test('should export TeamsClient as default', () => {
      expect(TeamsClient).toBeDefined();
      expect(typeof TeamsClient).toBe('function');
    });

    test('should export createClient factory function', () => {
      expect(createClient).toBeDefined();
      expect(typeof createClient).toBe('function');
    });

    test('should export models object', () => {
      expect(models).toBeDefined();
      expect(typeof models).toBe('object');
    });

    test('should have Team model in models', () => {
      expect(models.Team).toBeDefined();
      expect(typeof models.Team).toBe('function');
    });

    test('should have TeamMember model in models', () => {
      expect(models.TeamMember).toBeDefined();
      expect(typeof models.TeamMember).toBe('function');
    });
  });

  describe('TeamsClient Constructor', () => {
    test('should create instance with token', () => {
      const client = new TeamsClient({ token: 'test-token-123' });
      expect(client).toBeInstanceOf(TeamsClient);
      expect(client.token).toBe('test-token-123');
    });

    test('should create instance with custom baseURL', () => {
      const client = new TeamsClient({ 
        token: 'test-token',
        baseURL: 'https://api.github.custom.com'
      });
      expect(client.baseURL).toBe('https://api.github.custom.com');
    });

    test('should use default baseURL when not provided', () => {
      const client = new TeamsClient({ token: 'test-token' });
      expect(client.baseURL).toBe('https://api.github.com');
    });

    test('should throw error when token is not provided', () => {
      expect(() => new TeamsClient({})).toThrow();
    });

    test('should accept additional options', () => {
      const client = new TeamsClient({
        token: 'test-token',
        timeout: 5000,
        retries: 3
      });
      expect(client.token).toBe('test-token');
    });
  });

  describe('Factory Function', () => {
    test('should create TeamsClient instance', () => {
      const client = createClient({ token: 'factory-token' });
      expect(client).toBeInstanceOf(TeamsClient);
    });

    test('should pass options to constructor', () => {
      const client = createClient({ 
        token: 'factory-token',
        baseURL: 'https://custom.api.com'
      });
      expect(client.token).toBe('factory-token');
      expect(client.baseURL).toBe('https://custom.api.com');
    });
  });

  describe('Client Methods', () => {
    let client;

    beforeEach(() => {
      client = new TeamsClient({ token: 'test-token' });
    });

    const methods = [
      'listTeams',
      'createTeam', 
      'getTeam',
      'updateTeam',
      'deleteTeam',
      'listTeamMembers',
      'addTeamMember',
      'removeTeamMember',
      'getTeamMembership'
    ];

    test.each(methods)('should have %s method', (method) => {
      expect(client[method]).toBeDefined();
      expect(typeof client[method]).toBe('function');
    });

    test('should have all required methods', () => {
      methods.forEach(method => {
        expect(client[method]).toBeDefined();
      });
    });
  });

  describe('Team Model', () => {
    test('should create Team instance with properties', () => {
      const team = new models.Team({
        id: 1,
        name: 'Test Team',
        slug: 'test-team',
        description: 'A test team',
        privacy: 'closed',
        permission: 'push'
      });

      expect(team).toBeInstanceOf(models.Team);
      expect(team.id).toBe(1);
      expect(team.name).toBe('Test Team');
      expect(team.slug).toBe('test-team');
      expect(team.description).toBe('A test team');
      expect(team.privacy).toBe('closed');
      expect(team.permission).toBe('push');
    });

    test('should handle partial data', () => {
      const team = new models.Team({
        id: 2,
        name: 'Minimal Team'
      });

      expect(team.id).toBe(2);
      expect(team.name).toBe('Minimal Team');
      expect(team.slug).toBeUndefined();
    });

    test('should handle empty constructor', () => {
      const team = new models.Team();
      expect(team).toBeInstanceOf(models.Team);
    });
  });

  describe('TeamMember Model', () => {
    test('should create TeamMember instance with properties', () => {
      const member = new models.TeamMember({
        login: 'testuser',
        id: 123,
        avatar_url: 'https://github.com/avatar.jpg',
        type: 'User',
        role: 'member'
      });

      expect(member).toBeInstanceOf(models.TeamMember);
      expect(member.login).toBe('testuser');
      expect(member.id).toBe(123);
      expect(member.avatar_url).toBe('https://github.com/avatar.jpg');
      expect(member.type).toBe('User');
      expect(member.role).toBe('member');
    });

    test('should handle maintainer role', () => {
      const member = new models.TeamMember({
        login: 'maintainer',
        id: 456,
        role: 'maintainer'
      });

      expect(member.role).toBe('maintainer');
    });

    test('should handle empty constructor', () => {
      const member = new models.TeamMember();
      expect(member).toBeInstanceOf(models.TeamMember);
    });
  });

  describe('Method Parameters', () => {
    let client;

    beforeEach(() => {
      client = new TeamsClient({ token: 'test-token' });
    });

    test('getTeam should require team parameter', async () => {
      await expect(client.getTeam()).rejects.toThrow();
    });

    test('updateTeam should require team and data parameters', async () => {
      await expect(client.updateTeam()).rejects.toThrow();
      await expect(client.updateTeam('team-slug')).rejects.toThrow();
    });

    test('deleteTeam should require team parameter', async () => {
      await expect(client.deleteTeam()).rejects.toThrow();
    });

    test('listTeamMembers should require team parameter', async () => {
      await expect(client.listTeamMembers()).rejects.toThrow();
    });

    test('addTeamMember should require team and username parameters', async () => {
      await expect(client.addTeamMember()).rejects.toThrow();
      await expect(client.addTeamMember('team-slug')).rejects.toThrow();
    });

    test('removeTeamMember should require team and username parameters', async () => {
      await expect(client.removeTeamMember()).rejects.toThrow();
      await expect(client.removeTeamMember('team-slug')).rejects.toThrow();
    });

    test('getTeamMembership should require team and username parameters', async () => {
      await expect(client.getTeamMembership()).rejects.toThrow();
      await expect(client.getTeamMembership('team-slug')).rejects.toThrow();
    });
  });

  describe('Pagination', () => {
    let client;
    let originalFetch;

    beforeEach(() => {
      client = new TeamsClient({ token: 'test-token' });
      // Mock fetch to prevent actual API calls
      originalFetch = global.fetch;
      global.fetch = () => Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
        text: () => Promise.resolve('[]'),
        headers: {
          get: (name) => name === 'content-type' ? 'application/json' : null,
          entries: () => []
        }
      });
    });

    afterEach(() => {
      // Restore original fetch
      global.fetch = originalFetch;
    });

    test('listTeams should accept pagination options', async () => {
      const result = await client.listTeams('test-org', { page: 1, per_page: 30 });
      expect(result).toBeDefined();
    });

    test('listTeamMembers should accept pagination options', async () => {
      const result = await client.listTeamMembers('test-org', 'team-slug', { page: 2, per_page: 50 });
      expect(result).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('should provide meaningful error messages', () => {
      expect(() => new TeamsClient()).toThrow(/token/i);
    });

    test('should handle invalid token type', () => {
      expect(() => new TeamsClient({ token: 123 })).toThrow();
    });
  });
});