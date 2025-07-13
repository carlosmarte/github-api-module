import chalk from 'chalk';
import Table from 'cli-table3';

/**
 * Format utilities for CLI output
 */

/**
 * Format date string
 * @param {string} dateString - ISO date string
 * @param {boolean} [relative=false] - Show relative time
 * @returns {string} Formatted date
 */
export function formatDate(dateString, relative = false) {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  
  if (relative) {
    const now = Date.now();
    const diff = now - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'just now';
  }
  
  return date.toLocaleDateString();
}

/**
 * Format pull request state with color
 * @param {string} state - PR state
 * @param {boolean} [colorize=true] - Add color
 * @returns {string} Formatted state
 */
export function formatState(state, colorize = true) {
  if (!colorize) return state;
  
  switch (state?.toLowerCase()) {
    case 'open':
      return chalk.green(state);
    case 'closed':
      return chalk.red(state);
    case 'merged':
      return chalk.magenta(state);
    case 'draft':
      return chalk.gray(state);
    default:
      return state;
  }
}

/**
 * Format pull request for display
 * @param {Object} pr - Pull request object
 * @param {Object} [options] - Format options
 * @returns {string} Formatted pull request
 */
export function formatPullRequest(pr, options = {}) {
  const parts = [];
  
  // Number and title
  parts.push(chalk.bold(`#${pr.number}`) + ` ${pr.title}`);
  
  // State and author
  parts.push(`  ${formatState(pr.state)} by @${pr.user?.login || 'unknown'}`);
  
  // Dates
  if (pr.created_at) {
    parts.push(`  Created: ${formatDate(pr.created_at, true)}`);
  }
  
  if (pr.updated_at && pr.updated_at !== pr.created_at) {
    parts.push(`  Updated: ${formatDate(pr.updated_at, true)}`);
  }
  
  // Labels
  if (pr.labels && pr.labels.length > 0) {
    const labels = pr.labels.map(l => chalk.hex(l.color)(`[${l.name}]`)).join(' ');
    parts.push(`  Labels: ${labels}`);
  }
  
  // Reviews and comments
  if (options.showCounts) {
    const counts = [];
    if (pr.comments > 0) counts.push(`${pr.comments} comments`);
    if (pr.review_comments > 0) counts.push(`${pr.review_comments} review comments`);
    if (counts.length > 0) {
      parts.push(`  ${counts.join(', ')}`);
    }
  }
  
  // Changes
  if (options.showChanges && (pr.additions || pr.deletions)) {
    parts.push(`  Changes: ${chalk.green(`+${pr.additions || 0}`)} ${chalk.red(`-${pr.deletions || 0}`)}`);
  }
  
  return parts.join('\n');
}

/**
 * Format pull request as table row
 * @param {Object} pr - Pull request
 * @returns {Array} Table row data
 */
export function formatPullRequestRow(pr) {
  return [
    pr.number,
    pr.title.length > 50 ? pr.title.substring(0, 47) + '...' : pr.title,
    formatState(pr.state, true),
    pr.user?.login || 'unknown',
    formatDate(pr.created_at, true)
  ];
}

/**
 * Create table for pull requests
 * @param {Array} pullRequests - Array of pull requests
 * @param {Object} [options] - Table options
 * @returns {string} Formatted table
 */
export function createPullRequestTable(pullRequests, options = {}) {
  const table = new Table({
    head: ['#', 'Title', 'State', 'Author', 'Created'],
    style: {
      head: ['cyan']
    },
    ...options.tableOptions
  });
  
  for (const pr of pullRequests) {
    table.push(formatPullRequestRow(pr));
  }
  
  return table.toString();
}

/**
 * Format review state
 * @param {string} state - Review state
 * @param {boolean} [colorize=true] - Add color
 * @returns {string} Formatted state
 */
export function formatReviewState(state, colorize = true) {
  if (!colorize) return state;
  
  switch (state) {
    case 'APPROVED':
      return chalk.green('✓ Approved');
    case 'CHANGES_REQUESTED':
      return chalk.red('✗ Changes requested');
    case 'COMMENTED':
      return chalk.blue('💬 Commented');
    case 'DISMISSED':
      return chalk.gray('Dismissed');
    case 'PENDING':
      return chalk.yellow('⏳ Pending');
    default:
      return state;
  }
}

/**
 * Format file changes
 * @param {Array} files - Changed files
 * @param {Object} [options] - Format options
 * @returns {string} Formatted file list
 */
export function formatFileChanges(files, options = {}) {
  if (!files || files.length === 0) {
    return 'No files changed';
  }
  
  const lines = [];
  
  for (const file of files) {
    let line = '';
    
    // Status indicator
    switch (file.status) {
      case 'added':
        line += chalk.green('[A] ');
        break;
      case 'modified':
        line += chalk.yellow('[M] ');
        break;
      case 'removed':
        line += chalk.red('[D] ');
        break;
      case 'renamed':
        line += chalk.blue('[R] ');
        break;
      default:
        line += '[?] ';
    }
    
    // Filename
    line += file.filename;
    
    // Changes
    if (options.showChanges) {
      line += ` (${chalk.green(`+${file.additions || 0}`)} ${chalk.red(`-${file.deletions || 0}`)})`;
    }
    
    lines.push(line);
  }
  
  return lines.join('\n');
}

/**
 * Format JSON output
 * @param {*} data - Data to format
 * @param {boolean} [pretty=true] - Pretty print
 * @returns {string} JSON string
 */
export function formatJson(data, pretty = true) {
  return JSON.stringify(data, null, pretty ? 2 : 0);
}

/**
 * Format output based on format type
 * @param {*} data - Data to format
 * @param {string} format - Output format (json, table, text)
 * @param {Object} [options] - Format options
 * @returns {string} Formatted output
 */
export function formatOutput(data, format, options = {}) {
  switch (format) {
    case 'json':
      return formatJson(data, options.pretty !== false);
      
    case 'table':
      if (Array.isArray(data)) {
        return createPullRequestTable(data, options);
      }
      return formatJson(data, true);
      
    case 'text':
    default:
      if (Array.isArray(data)) {
        return data.map(pr => formatPullRequest(pr, options)).join('\n\n');
      }
      if (data && typeof data === 'object' && data.number) {
        return formatPullRequest(data, { ...options, showCounts: true, showChanges: true });
      }
      return formatJson(data, true);
  }
}

/**
 * Truncate text
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @param {string} [suffix='...'] - Suffix for truncated text
 * @returns {string} Truncated text
 */
export function truncate(text, maxLength, suffix = '...') {
  if (!text || text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Format URL for display
 * @param {string} url - URL to format
 * @param {boolean} [colorize=true] - Add color
 * @returns {string} Formatted URL
 */
export function formatUrl(url, colorize = true) {
  if (!url) return '';
  return colorize ? chalk.cyan.underline(url) : url;
}

export default {
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
};