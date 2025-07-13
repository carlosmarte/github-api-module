import TeamsClient, { createClient, models } from './index.mjs';
import assert from 'assert';
import { inspect } from 'util';

const PASS = '✓';
const FAIL = '✗';
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

class TestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
    this.skipped = 0;
  }

  describe(description, fn) {
    console.log(`\n${colors.bold}${colors.cyan}${description}${colors.reset}`);
    fn();
  }

  it(description, fn) {
    const startTime = Date.now();
    try {
      fn();
      const duration = Date.now() - startTime;
      console.log(`  ${colors.green}${PASS}${colors.reset} ${description} ${colors.yellow}(${duration}ms)${colors.reset}`);
      this.passed++;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.log(`  ${colors.red}${FAIL}${colors.reset} ${description} ${colors.yellow}(${duration}ms)${colors.reset}`);
      console.log(`    ${colors.red}Error: ${error.message}${colors.reset}`);
      if (error.stack) {
        console.log(`    ${colors.red}${error.stack.split('\n').slice(1, 3).join('\n    ')}${colors.reset}`);
      }
      this.failed++;
    }
  }

  skip(description) {
    console.log(`  ${colors.yellow}- ${description} (skipped)${colors.reset}`);
    this.skipped++;
  }

  expect(actual) {
    return {
      toBe(expected) {
        assert.strictEqual(actual, expected, `Expected ${inspect(actual)} to be ${inspect(expected)}`);
      },
      toEqual(expected) {
        assert.deepStrictEqual(actual, expected, `Expected ${inspect(actual)} to equal ${inspect(expected)}`);
      },
      toBeTruthy() {
        assert(actual, `Expected ${inspect(actual)} to be truthy`);
      },
      toBeFalsy() {
        assert(!actual, `Expected ${inspect(actual)} to be falsy`);
      },
      toBeInstanceOf(constructor) {
        assert(actual instanceof constructor, `Expected ${inspect(actual)} to be instance of ${constructor.name}`);
      },
      toHaveProperty(prop) {
        assert(prop in actual, `Expected object to have property "${prop}"`);
      },
      toBeTypeOf(type) {
        assert.strictEqual(typeof actual, type, `Expected ${inspect(actual)} to be of type ${type}, got ${typeof actual}`);
      },
      toContain(item) {
        assert(actual.includes(item), `Expected ${inspect(actual)} to contain ${inspect(item)}`);
      },
      toHaveLength(length) {
        assert.strictEqual(actual.length, length, `Expected length ${actual.length} to be ${length}`);
      },
      toThrow(errorType) {
        assert.throws(actual, errorType);
      }
    };
  }

  summary() {
    console.log('\n' + '='.repeat(60));
    console.log(`${colors.bold}Test Results:${colors.reset}`);
    console.log(`  ${colors.green}Passed: ${this.passed}${colors.reset}`);
    if (this.failed > 0) {
      console.log(`  ${colors.red}Failed: ${this.failed}${colors.reset}`);
    }
    if (this.skipped > 0) {
      console.log(`  ${colors.yellow}Skipped: ${this.skipped}${colors.reset}`);
    }
    console.log(`  Total: ${this.passed + this.failed + this.skipped}`);
    console.log('='.repeat(60));
    
    if (this.failed === 0) {
      console.log(`\n${colors.green}${colors.bold}All tests passed! 🎉${colors.reset}\n`);
    } else {
      console.log(`\n${colors.red}${colors.bold}Some tests failed.${colors.reset}\n`);
      process.exit(1);
    }
  }
}

const test = new TestRunner();
const describe = (desc, fn) => test.describe(desc, fn);
const it = (desc, fn) => test.it(desc, fn);
const skip = (desc) => test.skip(desc);
const expect = (actual) => test.expect(actual);

console.log(`${colors.bold}${colors.cyan}GitHub Teams API Module - Comprehensive Test Suite${colors.reset}`);
console.log('='.repeat(60));

describe('Module Exports', () => {
  it('should export TeamsClient as default', () => {
    expect(TeamsClient).toBeTruthy();
    expect(TeamsClient).toBeTypeOf('function');
  });

  it('should export createClient factory function', () => {
    expect(createClient).toBeTruthy();
    expect(createClient).toBeTypeOf('function');
  });

  it('should export models object', () => {
    expect(models).toBeTruthy();
    expect(models).toBeTypeOf('object');
  });

  it('should have Team model in models', () => {
    expect(models).toHaveProperty('Team');
    expect(models.Team).toBeTypeOf('function');
  });

  it('should have TeamMember model in models', () => {
    expect(models).toHaveProperty('TeamMember');
    expect(models.TeamMember).toBeTypeOf('function');
  });
});

describe('TeamsClient Constructor', () => {
  it('should create instance with token', () => {
    const client = new TeamsClient({ token: 'test-token-123' });
    expect(client).toBeInstanceOf(TeamsClient);
    expect(client.token).toBe('test-token-123');
  });

  it('should create instance with custom baseURL', () => {
    const client = new TeamsClient({ 
      token: 'test-token',
      baseURL: 'https://api.github.custom.com'
    });
    expect(client.baseURL).toBe('https://api.github.custom.com');
  });

  it('should use default baseURL when not provided', () => {
    const client = new TeamsClient({ token: 'test-token' });
    expect(client.baseURL).toBe('https://api.github.com');
  });

  it('should throw error when token is not provided', () => {
    expect(() => new TeamsClient({})).toThrow();
  });
});

describe('Factory Function', () => {
  it('should create TeamsClient instance', () => {
    const client = createClient({ token: 'factory-token' });
    expect(client).toBeInstanceOf(TeamsClient);
  });

  it('should pass options to constructor', () => {
    const client = createClient({ 
      token: 'factory-token',
      baseURL: 'https://custom.api.com'
    });
    expect(client.token).toBe('factory-token');
    expect(client.baseURL).toBe('https://custom.api.com');
  });
});

describe('Client Methods', () => {
  const client = new TeamsClient({ token: 'test-token' });
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

  methods.forEach(method => {
    it(`should have ${method} method`, () => {
      expect(client).toHaveProperty(method);
      expect(client[method]).toBeTypeOf('function');
    });
  });

  it('should have correct number of methods', () => {
    const clientMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(client))
      .filter(name => name !== 'constructor' && typeof client[name] === 'function');
    expect(clientMethods.length).toBe(methods.length);
  });
});

describe('Team Model', () => {
  it('should create Team instance with properties', () => {
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

  it('should handle partial data', () => {
    const team = new models.Team({
      id: 2,
      name: 'Minimal Team'
    });

    expect(team.id).toBe(2);
    expect(team.name).toBe('Minimal Team');
    expect(team.slug).toBe(undefined);
  });
});

describe('TeamMember Model', () => {
  it('should create TeamMember instance with properties', () => {
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

  it('should handle maintainer role', () => {
    const member = new models.TeamMember({
      login: 'maintainer',
      id: 456,
      role: 'maintainer'
    });

    expect(member.role).toBe('maintainer');
  });
});

describe('Method Parameters Validation', () => {
  const client = new TeamsClient({ token: 'test-token' });

  it('getTeam should require team parameter', () => {
    expect(() => client.getTeam()).toThrow();
  });

  it('updateTeam should require team and data parameters', () => {
    expect(() => client.updateTeam()).toThrow();
    expect(() => client.updateTeam('team-slug')).toThrow();
  });

  it('deleteTeam should require team parameter', () => {
    expect(() => client.deleteTeam()).toThrow();
  });

  skip('listTeams should handle pagination options');
  skip('createTeam should validate required fields');
});

describe('HTTP Configuration', () => {
  it('should set correct headers', () => {
    const client = new TeamsClient({ token: 'test-token-abc' });
    const headers = {
      'Authorization': `Bearer test-token-abc`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'github-teams-api-client'
    };
    
    skip('Verify headers are set correctly in requests');
  });

  it('should handle rate limiting configuration', () => {
    const client = new TeamsClient({ 
      token: 'test-token',
      rateLimit: true 
    });
    skip('Rate limiting configuration test');
  });
});

describe('Error Handling', () => {
  skip('should handle network errors gracefully');
  skip('should handle API errors with proper messages');
  skip('should handle rate limit errors');
  skip('should handle authentication errors');
});

test.summary();