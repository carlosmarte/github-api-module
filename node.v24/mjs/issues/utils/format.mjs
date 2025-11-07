/**
 * Formatting utilities for GitHub Issues CLI
 */

import chalk from 'chalk';
import { table } from 'table';

/**
 * Format issue for display
 * @param {Object} issue - Issue object
 * @param {string} format - Output format (json, table, text)
 * @returns {string} Formatted output
 */
export function formatIssue(issue, format = 'text') {
  switch (format) {
    case 'json':
      return JSON.stringify(issue, null, 2);
    
    case 'table':
      return formatIssueTable([issue]);
    
    case 'text':
    default:
      return formatIssueText(issue);
  }
}

/**
 * Format issue as text
 * @param {Object} issue - Issue object
 * @returns {string} Formatted text
 */
export function formatIssueText(issue) {
  const parts = [];
  
  parts.push(chalk.bold.green(`#${issue.number}`) + ' ' + chalk.bold(issue.title));
  parts.push(chalk.gray(`State: ${getStateIcon(issue.state)} ${issue.state}`));
  parts.push(chalk.gray(`Author: @${issue.user?.login || 'unknown'}`));
  parts.push(chalk.gray(`Created: ${formatDate(issue.created_at)}`));
  
  if (issue.assignees?.length > 0) {
    parts.push(chalk.gray(`Assignees: ${issue.assignees.map(a => '@' + a.login).join(', ')}`));
  }
  
  if (issue.labels?.length > 0) {
    parts.push(chalk.gray(`Labels: ${issue.labels.map(l => formatLabel(l)).join(' ')}`));
  }
  
  if (issue.milestone) {
    parts.push(chalk.gray(`Milestone: ${issue.milestone.title}`));
  }
  
  if (issue.body) {
    parts.push('');
    parts.push(issue.body);
  }
  
  parts.push('');
  parts.push(chalk.gray(`${issue.comments} comments`));
  parts.push(chalk.blue.underline(issue.html_url));
  
  return parts.join('\n');
}

/**
 * Format issues as table
 * @param {Array} issues - Array of issues
 * @returns {string} Formatted table
 */
export function formatIssueTable(issues) {
  const data = [
    ['#', 'Title', 'State', 'Author', 'Labels', 'Comments', 'Updated']
  ];
  
  for (const issue of issues) {
    data.push([
      chalk.green(`#${issue.number}`),
      truncate(issue.title, 50),
      getStateIcon(issue.state) + ' ' + issue.state,
      '@' + (issue.user?.login || 'unknown'),
      (issue.labels || []).map(l => l.name).join(', ') || '-',
      issue.comments.toString(),
      formatDate(issue.updated_at, true)
    ]);
  }
  
  return table(data, {
    border: {
      topBody: '─',
      topJoin: '┬',
      topLeft: '┌',
      topRight: '┐',
      bottomBody: '─',
      bottomJoin: '┴',
      bottomLeft: '└',
      bottomRight: '┘',
      bodyLeft: '│',
      bodyRight: '│',
      bodyJoin: '│',
      joinBody: '─',
      joinLeft: '├',
      joinRight: '┤',
      joinJoin: '┼'
    }
  });
}

/**
 * Format issue comment
 * @param {Object} comment - Comment object
 * @returns {string} Formatted comment
 */
export function formatComment(comment) {
  const parts = [];
  
  parts.push(chalk.bold(`@${comment.user?.login || 'unknown'}`) + ' ' + chalk.gray(formatDate(comment.created_at)));
  
  if (comment.updated_at !== comment.created_at) {
    parts.push(chalk.gray(`(edited ${formatDate(comment.updated_at)})`));
  }
  
  parts.push('');
  parts.push(comment.body);
  
  return parts.join('\n');
}

/**
 * Format label with color
 * @param {Object|string} label - Label object or name
 * @returns {string} Formatted label
 */
export function formatLabel(label) {
  if (typeof label === 'string') {
    return chalk.bgGray.white(` ${label} `);
  }
  
  const color = label.color ? `#${label.color}` : '#cccccc';
  return chalk.bgHex(color).white(` ${label.name} `);
}

/**
 * Format milestone
 * @param {Object} milestone - Milestone object
 * @returns {string} Formatted milestone
 */
export function formatMilestone(milestone) {
  const parts = [];
  
  parts.push(chalk.bold(milestone.title));
  
  if (milestone.description) {
    parts.push(chalk.gray(milestone.description));
  }
  
  const progress = milestone.closed_issues / (milestone.open_issues + milestone.closed_issues) * 100;
  parts.push(chalk.gray(`Progress: ${milestone.closed_issues}/${milestone.open_issues + milestone.closed_issues} (${progress.toFixed(0)}%)`));
  
  if (milestone.due_on) {
    parts.push(chalk.gray(`Due: ${formatDate(milestone.due_on)}`));
  }
  
  return parts.join('\n');
}

/**
 * Format error for display
 * @param {Error} error - Error object
 * @returns {string} Formatted error
 */
export function formatError(error) {
  let message = chalk.red.bold('Error: ') + error.message;
  
  if (error.name === 'ValidationError' && error.errors) {
    message += '\n' + chalk.yellow('Validation errors:');
    for (const err of error.errors) {
      message += '\n  - ' + (err.message || err.code || err);
    }
  }
  
  if (error.name === 'RateLimitError' && error.minutesUntilReset) {
    message += '\n' + chalk.yellow(`Rate limit resets in ${error.minutesUntilReset} minutes`);
  }
  
  return message;
}

/**
 * Format success message
 * @param {string} message - Success message
 * @returns {string} Formatted message
 */
export function formatSuccess(message) {
  return chalk.green('✓ ') + message;
}

/**
 * Format warning message
 * @param {string} message - Warning message
 * @returns {string} Formatted message
 */
export function formatWarning(message) {
  return chalk.yellow('⚠ ') + message;
}

/**
 * Format date
 * @param {string} dateStr - ISO date string
 * @param {boolean} relative - Use relative format
 * @returns {string} Formatted date
 */
export function formatDate(dateStr, relative = false) {
  if (!dateStr) return '-';
  
  const date = new Date(dateStr);
  
  if (relative) {
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 30) return date.toLocaleDateString();
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'just now';
  }
  
  return date.toLocaleString();
}

/**
 * Get state icon
 * @param {string} state - Issue state
 * @returns {string} State icon
 */
export function getStateIcon(state) {
  switch (state) {
    case 'open':
      return chalk.green('●');
    case 'closed':
      return chalk.red('✓');
    default:
      return chalk.gray('○');
  }
}

/**
 * Truncate string
 * @param {string} str - String to truncate
 * @param {number} length - Maximum length
 * @returns {string} Truncated string
 */
export function truncate(str, length) {
  if (!str) return '';
  if (str.length <= length) return str;
  return str.substring(0, length - 3) + '...';
}

/**
 * Format output based on options
 * @param {*} data - Data to format
 * @param {Object} options - Format options
 * @returns {string} Formatted output
 */
export function formatOutput(data, options = {}) {
  if (options.output === 'json' || options.json) {
    return JSON.stringify(data, null, 2);
  }
  
  if (Array.isArray(data)) {
    if (data.length === 0) {
      return chalk.gray('No results found');
    }
    
    if (options.output === 'table') {
      return formatIssueTable(data);
    }
    
    return data.map(item => formatIssue(item, options.output || 'text')).join('\n\n');
  }
  
  return formatIssue(data, options.output || 'text');
}