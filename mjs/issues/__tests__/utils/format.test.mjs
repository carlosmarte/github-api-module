import { formatDate, formatIssue, getStateIcon, truncate, formatLabel } from '../../utils/format.mjs';

describe('Format utilities', () => {
  describe('formatDate', () => {
    it('should format date as locale string by default', () => {
      const date = '2024-01-15T10:30:00Z';
      const formatted = formatDate(date);
      expect(formatted).toContain('2024');
      expect(typeof formatted).toBe('string');
    });

    it('should handle relative date formatting', () => {
      const date = new Date();
      date.setMinutes(date.getMinutes() - 5);
      const formatted = formatDate(date.toISOString(), true);
      expect(formatted).toBe('5m ago');
    });

    it('should return dash for null dates', () => {
      expect(formatDate(null)).toBe('-');
      expect(formatDate(undefined)).toBe('-');
    });
  });

  describe('formatIssue', () => {
    it('should format issue as text by default', () => {
      const issue = {
        number: 123,
        title: 'Test Issue',
        state: 'open',
        created_at: '2024-01-15T10:30:00Z',
        user: { login: 'testuser' },
        comments: 5,
        html_url: 'https://github.com/test/repo/issues/123'
      };
      
      const formatted = formatIssue(issue);
      expect(formatted).toContain('#123');
      expect(formatted).toContain('Test Issue');
      expect(formatted).toContain('open');
      expect(formatted).toContain('@testuser');
      expect(formatted).toContain('5 comments');
    });

    it('should format issue as JSON when specified', () => {
      const issue = {
        number: 123,
        title: 'Test Issue',
        state: 'open'
      };
      
      const formatted = formatIssue(issue, 'json');
      const parsed = JSON.parse(formatted);
      expect(parsed).toEqual(issue);
    });
  });

  describe('getStateIcon', () => {
    it('should return correct icon for issue states', () => {
      expect(getStateIcon('open')).toContain('●');
      expect(getStateIcon('closed')).toContain('✓');
      expect(getStateIcon('unknown')).toContain('○');
    });
  });

  describe('truncate', () => {
    it('should truncate long strings', () => {
      expect(truncate('This is a very long string', 10)).toBe('This is...');
      expect(truncate('Short', 10)).toBe('Short');
      expect(truncate(null, 10)).toBe('');
    });
  });

  describe('formatLabel', () => {
    it('should format label string', () => {
      const formatted = formatLabel('bug');
      expect(formatted).toContain('bug');
    });

    it('should format label object with color', () => {
      const label = { name: 'enhancement', color: 'a2eeef' };
      const formatted = formatLabel(label);
      expect(formatted).toContain('enhancement');
    });
  });
});