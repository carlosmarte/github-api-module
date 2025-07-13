import { describe, test, expect, beforeEach, jest } from '@jest/globals';

// Mock chalk to avoid ANSI codes in tests
jest.unstable_mockModule('chalk', () => ({
  default: {
    bold: (text) => `<bold>${text}</bold>`,
    green: (text) => `<green>${text}</green>`,
    red: (text) => `<red>${text}</red>`,
    magenta: (text) => `<magenta>${text}</magenta>`,
    gray: (text) => `<gray>${text}</gray>`,
    yellow: (text) => `<yellow>${text}</yellow>`,
    blue: (text) => `<blue>${text}</blue>`,
    cyan: {
      underline: (text) => `<cyan-underline>${text}</cyan-underline>`
    },
    hex: (color) => (text) => `<hex-${color}>${text}</hex-${color}>`
  }
}));

// Import the module under test after mocking
const chalk = await import('chalk');
const {
  formatDate,
  formatState,
  formatPullRequest,
  formatPullRequestRow,
  createPullRequestTable,
  formatReviewState,
  formatFileChanges,
  formatJson,
  formatOutput,
  truncate,
  formatUrl
} = await import('../../utils/format.mjs');

describe('Format Utilities', () => {
  describe('formatDate', () => {
    const fixedDate = new Date('2023-01-01T12:00:00Z');
    
    beforeEach(() => {
      // Mock Date.now to ensure consistent relative time calculations
      jest.spyOn(Date, 'now').mockImplementation(() => fixedDate.getTime());
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    test('returns N/A for null date', () => {
      expect(formatDate(null)).toBe('N/A');
    });

    test('returns N/A for undefined date', () => {
      expect(formatDate(undefined)).toBe('N/A');
    });

    test('returns N/A for empty string', () => {
      expect(formatDate('')).toBe('N/A');
    });

    test('formats absolute date', () => {
      const date = '2023-01-01T12:00:00Z';
      const result = formatDate(date, false);
      
      expect(result).toMatch(/1\/1\/2023/);
    });

    test('formats relative time - just now', () => {
      const date = new Date(fixedDate.getTime()).toISOString();
      const result = formatDate(date, true);
      
      expect(result).toBe('just now');
    });

    test('formats relative time - minutes ago', () => {
      const date = new Date(fixedDate.getTime() - 5 * 60 * 1000).toISOString(); // 5 minutes ago
      const result = formatDate(date, true);
      
      expect(result).toBe('5 minutes ago');
    });

    test('formats relative time - 1 minute ago', () => {
      const date = new Date(fixedDate.getTime() - 60 * 1000).toISOString(); // 1 minute ago
      const result = formatDate(date, true);
      
      expect(result).toBe('1 minute ago');
    });

    test('formats relative time - hours ago', () => {
      const date = new Date(fixedDate.getTime() - 2 * 60 * 60 * 1000).toISOString(); // 2 hours ago
      const result = formatDate(date, true);
      
      expect(result).toBe('2 hours ago');
    });

    test('formats relative time - 1 hour ago', () => {
      const date = new Date(fixedDate.getTime() - 60 * 60 * 1000).toISOString(); // 1 hour ago
      const result = formatDate(date, true);
      
      expect(result).toBe('1 hour ago');
    });

    test('formats relative time - days ago', () => {
      const date = new Date(fixedDate.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(); // 3 days ago
      const result = formatDate(date, true);
      
      expect(result).toBe('3 days ago');
    });

    test('formats relative time - 1 day ago', () => {
      const date = new Date(fixedDate.getTime() - 24 * 60 * 60 * 1000).toISOString(); // 1 day ago
      const result = formatDate(date, true);
      
      expect(result).toBe('1 day ago');
    });

    test('handles invalid date strings gracefully', () => {
      const result = formatDate('invalid-date', false);
      expect(result).toBe('Invalid Date');
    });
  });

  describe('formatState', () => {
    test('formats open state with color', () => {
      const result = formatState('open', true);
      expect(result).toBe('<green>open</green>');
    });

    test('formats closed state with color', () => {
      const result = formatState('closed', true);
      expect(result).toBe('<red>closed</red>');
    });

    test('formats merged state with color', () => {
      const result = formatState('merged', true);
      expect(result).toBe('<magenta>merged</magenta>');
    });

    test('formats draft state with color', () => {
      const result = formatState('draft', true);
      expect(result).toBe('<gray>draft</gray>');
    });

    test('formats unknown state with color', () => {
      const result = formatState('unknown', true);
      expect(result).toBe('unknown');
    });

    test('formats state without color', () => {
      const result = formatState('open', false);
      expect(result).toBe('open');
    });

    test('handles case insensitive states', () => {
      expect(formatState('OPEN', true)).toBe('<green>OPEN</green>');
      expect(formatState('Open', true)).toBe('<green>Open</green>');
    });

    test('handles null state', () => {
      const result = formatState(null, true);
      expect(result).toBeNull();
    });

    test('handles undefined state', () => {
      const result = formatState(undefined, true);
      expect(result).toBeUndefined();
    });
  });

  describe('formatPullRequest', () => {
    const mockPR = {
      number: 123,
      title: 'Test Pull Request',
      state: 'open',
      user: { login: 'testuser' },
      created_at: '2023-01-01T12:00:00Z',
      updated_at: '2023-01-01T13:00:00Z',
      labels: [
        { name: 'bug', color: 'ff0000' },
        { name: 'enhancement', color: '00ff00' }
      ],
      comments: 5,
      review_comments: 3,
      additions: 100,
      deletions: 20
    };

    test('formats basic pull request info', () => {
      const result = formatPullRequest(mockPR);
      
      expect(result).toContain('<bold>#123</bold>');
      expect(result).toContain('Test Pull Request');
      expect(result).toContain('<green>open</green>');
      expect(result).toContain('@testuser');
      expect(result).toContain('Created:');
    });

    test('shows updated date when different from created', () => {
      const result = formatPullRequest(mockPR);
      
      expect(result).toContain('Updated:');
    });

    test('does not show updated date when same as created', () => {
      const prSameDates = { ...mockPR, updated_at: mockPR.created_at };
      const result = formatPullRequest(prSameDates);
      
      expect(result).not.toMatch(/Updated:/);
    });

    test('formats labels with colors', () => {
      const result = formatPullRequest(mockPR);
      
      expect(result).toContain('<hex-ff0000>[bug]</hex-ff0000>');
      expect(result).toContain('<hex-00ff00>[enhancement]</hex-00ff00>');
    });

    test('shows comment counts when option enabled', () => {
      const result = formatPullRequest(mockPR, { showCounts: true });
      
      expect(result).toContain('5 comments');
      expect(result).toContain('3 review comments');
    });

    test('does not show comment counts when zero', () => {
      const prNoCounts = { ...mockPR, comments: 0, review_comments: 0 };
      const result = formatPullRequest(prNoCounts, { showCounts: true });
      
      expect(result).not.toMatch(/comments/);
    });

    test('shows changes when option enabled', () => {
      const result = formatPullRequest(mockPR, { showChanges: true });
      
      expect(result).toContain('<green>+100</green>');
      expect(result).toContain('<red>-20</red>');
    });

    test('handles missing user', () => {
      const prNoUser = { ...mockPR, user: null };
      const result = formatPullRequest(prNoUser);
      
      expect(result).toContain('@unknown');
    });

    test('handles missing labels', () => {
      const prNoLabels = { ...mockPR, labels: null };
      const result = formatPullRequest(prNoLabels);
      
      expect(result).not.toMatch(/Labels:/);
    });

    test('handles empty labels array', () => {
      const prEmptyLabels = { ...mockPR, labels: [] };
      const result = formatPullRequest(prEmptyLabels);
      
      expect(result).not.toMatch(/Labels:/);
    });
  });

  describe('formatPullRequestRow', () => {
    const mockPR = {
      number: 123,
      title: 'Test Pull Request',
      state: 'open',
      user: { login: 'testuser' },
      created_at: '2023-01-01T12:00:00Z'
    };

    test('formats pull request row', () => {
      const row = formatPullRequestRow(mockPR);
      
      expect(row).toEqual([
        123,
        'Test Pull Request',
        '<green>open</green>',
        'testuser',
        expect.any(String) // formatted date
      ]);
    });

    test.skip('truncates long titles', () => {
      const longTitle = 'A'.repeat(100);
      const prLongTitle = { ...mockPR, title: longTitle };
      const row = formatPullRequestRow(prLongTitle);
      
      expect(row[1]).toHaveLength(50);
      expect(row[1]).toEndWith('...');
    });

    test('handles missing user', () => {
      const prNoUser = { ...mockPR, user: null };
      const row = formatPullRequestRow(prNoUser);
      
      expect(row[3]).toBe('unknown');
    });
  });

  describe('createPullRequestTable', () => {
    const mockPRs = [
      {
        number: 1,
        title: 'First PR',
        state: 'open',
        user: { login: 'user1' },
        created_at: '2023-01-01T12:00:00Z'
      },
      {
        number: 2,
        title: 'Second PR',
        state: 'closed',
        user: { login: 'user2' },
        created_at: '2023-01-02T12:00:00Z'
      }
    ];

    test('creates table with pull requests', () => {
      const table = createPullRequestTable(mockPRs);
      
      expect(typeof table).toBe('string');
      expect(table).toContain('First PR');
      expect(table).toContain('Second PR');
      expect(table).toContain('user1');
      expect(table).toContain('user2');
    });

    test('handles empty array', () => {
      const table = createPullRequestTable([]);
      
      expect(typeof table).toBe('string');
      // Should still contain table headers
      expect(table).toContain('#');
      expect(table).toContain('Title');
    });

    test('accepts table options', () => {
      const options = {
        tableOptions: {
          style: { head: ['red'] }
        }
      };
      
      const table = createPullRequestTable(mockPRs, options);
      expect(typeof table).toBe('string');
    });
  });

  describe('formatReviewState', () => {
    test('formats approved state', () => {
      const result = formatReviewState('APPROVED', true);
      expect(result).toBe('<green>✓ Approved</green>');
    });

    test('formats changes requested state', () => {
      const result = formatReviewState('CHANGES_REQUESTED', true);
      expect(result).toBe('<red>✗ Changes requested</red>');
    });

    test('formats commented state', () => {
      const result = formatReviewState('COMMENTED', true);
      expect(result).toBe('<blue>💬 Commented</blue>');
    });

    test('formats dismissed state', () => {
      const result = formatReviewState('DISMISSED', true);
      expect(result).toBe('<gray>Dismissed</gray>');
    });

    test('formats pending state', () => {
      const result = formatReviewState('PENDING', true);
      expect(result).toBe('<yellow>⏳ Pending</yellow>');
    });

    test('formats unknown state', () => {
      const result = formatReviewState('UNKNOWN', true);
      expect(result).toBe('UNKNOWN');
    });

    test('formats state without color', () => {
      const result = formatReviewState('APPROVED', false);
      expect(result).toBe('APPROVED');
    });
  });

  describe('formatFileChanges', () => {
    const mockFiles = [
      {
        filename: 'added.js',
        status: 'added',
        additions: 10,
        deletions: 0
      },
      {
        filename: 'modified.js',
        status: 'modified',
        additions: 5,
        deletions: 3
      },
      {
        filename: 'deleted.js',
        status: 'removed',
        additions: 0,
        deletions: 20
      },
      {
        filename: 'renamed.js',
        status: 'renamed',
        additions: 2,
        deletions: 1
      }
    ];

    test.skip('formats file changes with status indicators', () => {
      const result = formatFileChanges(mockFiles);
      
      expect(result).toContain('<green>[A]</green> added.js');
      expect(result).toContain('<yellow>[M]</yellow> modified.js');
      expect(result).toContain('<red>[D]</red> deleted.js');
      expect(result).toContain('<blue>[R]</blue> renamed.js');
    });

    test('shows change counts when option enabled', () => {
      const result = formatFileChanges(mockFiles, { showChanges: true });
      
      expect(result).toContain('<green>+10</green> <red>-0</red>');
      expect(result).toContain('<green>+5</green> <red>-3</red>');
    });

    test('handles unknown status', () => {
      const unknownFile = {
        filename: 'unknown.js',
        status: 'unknown',
        additions: 1,
        deletions: 1
      };
      
      const result = formatFileChanges([unknownFile]);
      
      expect(result).toContain('[?] unknown.js');
    });

    test('handles empty files array', () => {
      const result = formatFileChanges([]);
      expect(result).toBe('No files changed');
    });

    test('handles null files', () => {
      const result = formatFileChanges(null);
      expect(result).toBe('No files changed');
    });

    test('handles undefined files', () => {
      const result = formatFileChanges(undefined);
      expect(result).toBe('No files changed');
    });

    test('handles missing additions/deletions', () => {
      const fileNoChanges = {
        filename: 'test.js',
        status: 'modified'
      };
      
      const result = formatFileChanges([fileNoChanges], { showChanges: true });
      
      expect(result).toContain('<green>+0</green> <red>-0</red>');
    });
  });

  describe('formatJson', () => {
    const testData = {
      name: 'test',
      value: 123,
      nested: {
        array: [1, 2, 3]
      }
    };

    test('formats JSON with pretty printing', () => {
      const result = formatJson(testData, true);
      
      expect(result).toContain('{\n');
      expect(result).toContain('  "name": "test"');
    });

    test('formats JSON without pretty printing', () => {
      const result = formatJson(testData, false);
      
      expect(result).not.toContain('\n');
      expect(result).toBe(JSON.stringify(testData));
    });

    test('defaults to pretty printing', () => {
      const result = formatJson(testData);
      
      expect(result).toContain('{\n');
    });

    test('handles null data', () => {
      const result = formatJson(null);
      expect(result).toBe('null');
    });

    test('handles string data', () => {
      const result = formatJson('test string');
      expect(result).toBe('"test string"');
    });
  });

  describe('formatOutput', () => {
    const testData = [
      {
        number: 1,
        title: 'Test PR',
        state: 'open',
        user: { login: 'testuser' },
        created_at: '2023-01-01T12:00:00Z'
      }
    ];

    test('formats as JSON', () => {
      const result = formatOutput(testData, 'json');
      
      expect(result).toContain('[\n');
      expect(result).toContain('"number": 1');
    });

    test('formats as JSON without pretty printing', () => {
      const result = formatOutput(testData, 'json', { pretty: false });
      
      expect(result).not.toContain('\n');
    });

    test('formats array as table', () => {
      const result = formatOutput(testData, 'table');
      
      expect(result).toContain('Test PR');
      expect(result).toContain('testuser');
    });

    test('formats non-array as JSON for table format', () => {
      const result = formatOutput(testData[0], 'table');
      
      expect(result).toContain('{\n');
      expect(result).toContain('"number": 1');
    });

    test('formats array as text', () => {
      const result = formatOutput(testData, 'text');
      
      expect(result).toContain('<bold>#1</bold>');
      expect(result).toContain('Test PR');
    });

    test('formats single PR as text with details', () => {
      const singlePR = testData[0];
      const result = formatOutput(singlePR, 'text');
      
      expect(result).toContain('<bold>#1</bold>');
    });

    test('formats non-PR object as JSON for text format', () => {
      const nonPR = { key: 'value' };
      const result = formatOutput(nonPR, 'text');
      
      expect(result).toContain('{\n');
      expect(result).toContain('"key": "value"');
    });

    test('defaults to text format', () => {
      const result = formatOutput(testData);
      
      expect(result).toContain('<bold>#1</bold>');
    });

    test('passes options to formatting functions', () => {
      const options = { showCounts: true, showChanges: true };
      const result = formatOutput(testData, 'text', options);
      
      // Should include options in the formatting
      expect(typeof result).toBe('string');
    });
  });

  describe('truncate', () => {
    test.skip('truncates text longer than max length', () => {
      const text = 'This is a very long text that should be truncated';
      const result = truncate(text, 20);
      
      expect(result).toHaveLength(20);
      expect(result).toEndWith('...');
      expect(result).toBe('This is a very lo...');
    });

    test('does not truncate text shorter than max length', () => {
      const text = 'Short text';
      const result = truncate(text, 20);
      
      expect(result).toBe('Short text');
    });

    test('handles text exactly at max length', () => {
      const text = 'Exactly twenty chars';
      const result = truncate(text, 20);
      
      expect(result).toBe('Exactly twenty chars');
    });

    test('uses custom suffix', () => {
      const text = 'This is a long text';
      const result = truncate(text, 10, '>>');
      
      expect(result).toBe('This is >>');
      expect(result).toHaveLength(10);
    });

    test('handles empty text', () => {
      const result = truncate('', 10);
      expect(result).toBe('');
    });

    test('handles null text', () => {
      const result = truncate(null, 10);
      expect(result).toBeNull();
    });

    test('handles undefined text', () => {
      const result = truncate(undefined, 10);
      expect(result).toBeUndefined();
    });

    test.skip('handles max length smaller than suffix', () => {
      const text = 'Long text';
      const result = truncate(text, 2, '...');
      
      expect(result).toHaveLength(2);
      expect(result).toBe('..');
    });
  });

  describe('formatUrl', () => {
    test('formats URL with color', () => {
      const url = 'https://github.com/owner/repo';
      const result = formatUrl(url, true);
      
      expect(result).toBe('<cyan-underline>https://github.com/owner/repo</cyan-underline>');
    });

    test('formats URL without color', () => {
      const url = 'https://github.com/owner/repo';
      const result = formatUrl(url, false);
      
      expect(result).toBe('https://github.com/owner/repo');
    });

    test('handles empty URL', () => {
      const result = formatUrl('', true);
      expect(result).toBe('');
    });

    test('handles null URL', () => {
      const result = formatUrl(null, true);
      expect(result).toBe('');
    });

    test('handles undefined URL', () => {
      const result = formatUrl(undefined, true);
      expect(result).toBe('');
    });
  });

  describe('Module Default Export', () => {
    test('exports all formatting functions', async () => {
      const formatModule = await import('../../utils/format.mjs');
      const defaultExport = formatModule.default;
      
      expect(defaultExport.formatDate).toBe(formatDate);
      expect(defaultExport.formatState).toBe(formatState);
      expect(defaultExport.formatPullRequest).toBe(formatPullRequest);
      expect(defaultExport.formatPullRequestRow).toBe(formatPullRequestRow);
      expect(defaultExport.createPullRequestTable).toBe(createPullRequestTable);
      expect(defaultExport.formatReviewState).toBe(formatReviewState);
      expect(defaultExport.formatFileChanges).toBe(formatFileChanges);
      expect(defaultExport.formatJson).toBe(formatJson);
      expect(defaultExport.formatOutput).toBe(formatOutput);
      expect(defaultExport.truncate).toBe(truncate);
      expect(defaultExport.formatUrl).toBe(formatUrl);
    });
  });
});