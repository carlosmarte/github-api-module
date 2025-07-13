import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { formatOutput } from '../../utils/format.mjs';

describe('formatOutput', () => {
  let consoleLogSpy;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe('JSON output', () => {
    it('should output data as formatted JSON when asJson is true', () => {
      const data = { sha: 'abc123', message: 'test' };
      formatOutput(data, true);

      expect(consoleLogSpy).toHaveBeenCalledWith(JSON.stringify(data, null, 2));
    });

    it('should handle complex nested objects in JSON mode', () => {
      const data = {
        sha: 'abc123',
        author: { name: 'John', email: 'john@example.com' },
        tree: [{ path: 'file.txt', type: 'blob' }]
      };
      formatOutput(data, true);

      expect(consoleLogSpy).toHaveBeenCalledWith(JSON.stringify(data, null, 2));
    });

    it('should handle null data in JSON mode', () => {
      formatOutput(null, true);
      expect(consoleLogSpy).toHaveBeenCalledWith('null');
    });

    it('should handle arrays in JSON mode', () => {
      const data = [{ sha: '1' }, { sha: '2' }];
      formatOutput(data, true);
      expect(consoleLogSpy).toHaveBeenCalledWith(JSON.stringify(data, null, 2));
    });
  });

  describe('Pretty print output', () => {
    it('should print SHA when present', () => {
      formatOutput({ sha: 'abc123' });
      expect(consoleLogSpy).toHaveBeenCalledWith('SHA: abc123');
    });

    it('should print URL when present', () => {
      formatOutput({ url: 'https://api.github.com/test' });
      expect(consoleLogSpy).toHaveBeenCalledWith('URL: https://api.github.com/test');
    });

    it('should print ref when present', () => {
      formatOutput({ ref: 'refs/heads/main' });
      expect(consoleLogSpy).toHaveBeenCalledWith('Ref: refs/heads/main');
    });

    it('should print tag when present', () => {
      formatOutput({ tag: 'v1.0.0' });
      expect(consoleLogSpy).toHaveBeenCalledWith('Tag: v1.0.0');
    });

    it('should print message when present', () => {
      formatOutput({ message: 'Commit message' });
      expect(consoleLogSpy).toHaveBeenCalledWith('Message: Commit message');
    });

    it('should print author details when present', () => {
      formatOutput({
        author: {
          name: 'John Doe',
          email: 'john@example.com',
          date: '2024-01-01T00:00:00Z'
        }
      });

      expect(consoleLogSpy).toHaveBeenCalledWith('\nAuthor:');
      expect(consoleLogSpy).toHaveBeenCalledWith('  Name: John Doe');
      expect(consoleLogSpy).toHaveBeenCalledWith('  Email: john@example.com');
      expect(consoleLogSpy).toHaveBeenCalledWith('  Date: 2024-01-01T00:00:00Z');
    });

    it('should print committer details when present', () => {
      formatOutput({
        committer: {
          name: 'Jane Doe',
          email: 'jane@example.com',
          date: '2024-01-02T00:00:00Z'
        }
      });

      expect(consoleLogSpy).toHaveBeenCalledWith('\nCommitter:');
      expect(consoleLogSpy).toHaveBeenCalledWith('  Name: Jane Doe');
      expect(consoleLogSpy).toHaveBeenCalledWith('  Email: jane@example.com');
      expect(consoleLogSpy).toHaveBeenCalledWith('  Date: 2024-01-02T00:00:00Z');
    });

    it('should print tagger details when present', () => {
      formatOutput({
        tagger: {
          name: 'Bob Smith',
          email: 'bob@example.com',
          date: '2024-01-03T00:00:00Z'
        }
      });

      expect(consoleLogSpy).toHaveBeenCalledWith('\nTagger:');
      expect(consoleLogSpy).toHaveBeenCalledWith('  Name: Bob Smith');
      expect(consoleLogSpy).toHaveBeenCalledWith('  Email: bob@example.com');
      expect(consoleLogSpy).toHaveBeenCalledWith('  Date: 2024-01-03T00:00:00Z');
    });

    it('should print object details when present', () => {
      formatOutput({
        object: {
          type: 'commit',
          sha: 'commit123'
        }
      });

      expect(consoleLogSpy).toHaveBeenCalledWith('\nObject:');
      expect(consoleLogSpy).toHaveBeenCalledWith('  Type: commit');
      expect(consoleLogSpy).toHaveBeenCalledWith('  SHA: commit123');
    });

    it('should print tree SHA when tree has sha property', () => {
      formatOutput({
        tree: { sha: 'tree123' }
      });

      expect(consoleLogSpy).toHaveBeenCalledWith('Tree SHA: tree123');
    });

    it('should print tree entry count when tree is array', () => {
      formatOutput({
        tree: [
          { path: 'file1.txt' },
          { path: 'file2.txt' },
          { path: 'file3.txt' }
        ]
      });

      expect(consoleLogSpy).toHaveBeenCalledWith('Tree entries: 3');
    });

    it('should print parent SHAs when present', () => {
      formatOutput({
        parents: [
          { sha: 'parent1' },
          { sha: 'parent2' }
        ]
      });

      expect(consoleLogSpy).toHaveBeenCalledWith('Parents: parent1, parent2');
    });

    it('should print verification details when present', () => {
      formatOutput({
        verification: {
          verified: true,
          reason: 'valid'
        }
      });

      expect(consoleLogSpy).toHaveBeenCalledWith('\nVerification:');
      expect(consoleLogSpy).toHaveBeenCalledWith('  Verified: true');
      expect(consoleLogSpy).toHaveBeenCalledWith('  Reason: valid');
    });

    it('should print content with utf-8 encoding', () => {
      formatOutput({
        content: 'Hello, world!',
        encoding: 'utf-8'
      });

      expect(consoleLogSpy).toHaveBeenCalledWith('\nContent (utf-8):');
      expect(consoleLogSpy).toHaveBeenCalledWith('Hello, world!');
    });

    it('should truncate base64 content', () => {
      const longBase64 = 'a'.repeat(200);
      formatOutput({
        content: longBase64,
        encoding: 'base64'
      });

      expect(consoleLogSpy).toHaveBeenCalledWith('\nContent (base64):');
      expect(consoleLogSpy).toHaveBeenCalledWith('a'.repeat(100) + '...');
    });

    it('should handle multiple fields', () => {
      formatOutput({
        sha: 'abc123',
        message: 'Test commit',
        author: {
          name: 'John',
          email: 'john@example.com',
          date: '2024-01-01'
        }
      });

      expect(consoleLogSpy).toHaveBeenCalledWith('SHA: abc123');
      expect(consoleLogSpy).toHaveBeenCalledWith('Message: Test commit');
      expect(consoleLogSpy).toHaveBeenCalledWith('\nAuthor:');
    });

    it('should handle empty object', () => {
      formatOutput({});
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should handle undefined data gracefully', () => {
      formatOutput(undefined);
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });

  describe('Edge cases', () => {
    it('should handle null values in fields', () => {
      formatOutput({
        sha: null,
        message: null
      });
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should handle empty strings', () => {
      formatOutput({
        sha: '',
        message: ''
      });
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should handle special characters in output', () => {
      formatOutput({
        message: 'Special chars: \n\t\r 🎉'
      });
      expect(consoleLogSpy).toHaveBeenCalledWith('Message: Special chars: \n\t\r 🎉');
    });
  });
});