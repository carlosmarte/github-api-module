/**
 * @fileoverview Formatting utilities for GitHub Users CLI output
 * @module formatting
 */

import chalk from 'chalk';
import Table from 'cli-table3';

/**
 * Format user information for display
 * @param {Object} user - User object
 * @param {Object} [options] - Formatting options
 * @returns {string} Formatted user information
 */
export function formatUser(user, options = {}) {
  if (options.json) {
    return JSON.stringify(user, null, 2);
  }

  const output = [];
  
  // Header with username
  output.push(chalk.bold.blue(`👤 ${user.login}${user.name ? ` (${user.name})` : ''}`));
  
  if (user.bio) {
    output.push(chalk.italic(user.bio));
  }
  
  // Basic info
  const info = [];
  if (user.company) info.push(`🏢 ${user.company}`);
  if (user.location) info.push(`📍 ${user.location}`);
  if (user.blog) info.push(`🔗 ${user.blog}`);
  if (user.twitter_username) info.push(`🐦 @${user.twitter_username}`);
  
  if (info.length > 0) {
    output.push('');
    output.push(...info);
  }
  
  // Stats (if available)
  if (user.public_repos !== undefined || user.followers !== undefined) {
    output.push('');
    const stats = [];
    if (user.public_repos !== undefined) stats.push(`📚 ${user.public_repos} repos`);
    if (user.public_gists !== undefined) stats.push(`📝 ${user.public_gists} gists`);
    if (user.followers !== undefined) stats.push(`👥 ${user.followers} followers`);
    if (user.following !== undefined) stats.push(`👤 ${user.following} following`);
    output.push(stats.join('  '));
  }
  
  // URLs
  output.push('');
  output.push(`GitHub: ${chalk.cyan(user.html_url)}`);
  output.push(`API: ${chalk.gray(user.url)}`);
  
  // Account info
  if (user.created_at) {
    output.push(`Created: ${formatDate(user.created_at)}`);
  }
  
  if (user.updated_at) {
    output.push(`Updated: ${formatDate(user.updated_at)}`);
  }
  
  return output.join('\n');
}

/**
 * Format user list as table
 * @param {Array} users - Array of user objects
 * @param {Object} [options] - Formatting options
 * @returns {string} Formatted user table
 */
export function formatUserTable(users, options = {}) {
  if (options.json) {
    return JSON.stringify(users, null, 2);
  }

  if (!Array.isArray(users) || users.length === 0) {
    return chalk.yellow('No users found.');
  }

  const table = new Table({
    head: ['Username', 'Name', 'Type', 'ID'].map(h => chalk.bold(h)),
    chars: {
      'top': '═', 'top-mid': '╤', 'top-left': '╔', 'top-right': '╗',
      'bottom': '═', 'bottom-mid': '╧', 'bottom-left': '╚', 'bottom-right': '╝',
      'left': '║', 'left-mid': '╟', 'mid': '─', 'mid-mid': '┼',
      'right': '║', 'right-mid': '╢', 'middle': '│'
    }
  });

  users.forEach(user => {
    table.push([
      chalk.cyan(user.login),
      user.name || chalk.gray('N/A'),
      user.type === 'User' ? '👤 User' : '🏢 Org',
      chalk.gray(user.id)
    ]);
  });

  return table.toString();
}

/**
 * Format email addresses
 * @param {Array} emails - Array of email objects
 * @param {Object} [options] - Formatting options
 * @returns {string} Formatted email list
 */
export function formatEmails(emails, options = {}) {
  if (options.json) {
    return JSON.stringify(emails, null, 2);
  }

  if (!Array.isArray(emails) || emails.length === 0) {
    return chalk.yellow('No email addresses found.');
  }

  const table = new Table({
    head: ['Email', 'Primary', 'Verified', 'Visibility'].map(h => chalk.bold(h)),
    chars: {
      'top': '═', 'top-mid': '╤', 'top-left': '╔', 'top-right': '╗',
      'bottom': '═', 'bottom-mid': '╧', 'bottom-left': '╚', 'bottom-right': '╝',
      'left': '║', 'left-mid': '╟', 'mid': '─', 'mid-mid': '┼',
      'right': '║', 'right-mid': '╢', 'middle': '│'
    }
  });

  emails.forEach(email => {
    table.push([
      email.email,
      email.primary ? chalk.green('✓') : chalk.gray('○'),
      email.verified ? chalk.green('✓') : chalk.red('✗'),
      email.visibility || chalk.gray('N/A')
    ]);
  });

  return table.toString();
}

/**
 * Format user context/hovercard information
 * @param {Object} context - Context object
 * @param {Object} [options] - Formatting options
 * @returns {string} Formatted context information
 */
export function formatUserContext(context, options = {}) {
  if (options.json) {
    return JSON.stringify(context, null, 2);
  }

  const output = [];
  
  // Contexts array
  if (context.contexts && context.contexts.length > 0) {
    output.push(chalk.bold('User Context:'));
    
    context.contexts.forEach(ctx => {
      output.push(`\n${chalk.cyan(ctx.message)}`);
      if (ctx.octicon) {
        output.push(`Icon: ${ctx.octicon}`);
      }
    });
  } else {
    output.push(chalk.yellow('No context information available.'));
  }

  return output.join('\n');
}

/**
 * Format date for display
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
export function formatDate(dateString) {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return 'today';
  } else if (diffDays === 1) {
    return 'yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} month${months === 1 ? '' : 's'} ago`;
  } else {
    const years = Math.floor(diffDays / 365);
    return `${years} year${years === 1 ? '' : 's'} ago`;
  }
}

/**
 * Format file size
 * @param {number} bytes - Size in bytes
 * @returns {string} Human-readable file size
 */
export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format boolean value with colors
 * @param {boolean} value - Boolean value
 * @param {Object} [options] - Formatting options
 * @returns {string} Colored boolean
 */
export function formatBoolean(value, options = {}) {
  if (value === true) {
    return options.symbols ? chalk.green('✓') : chalk.green('true');
  } else if (value === false) {
    return options.symbols ? chalk.red('✗') : chalk.red('false');
  }
  return chalk.gray('N/A');
}

/**
 * Format loading spinner message
 * @param {string} message - Message to display
 * @returns {Object} Ora spinner configuration
 */
export function createSpinner(message) {
  return {
    text: message,
    color: 'cyan',
    spinner: 'dots'
  };
}

/**
 * Format success message
 * @param {string} message - Success message
 * @returns {string} Formatted success message
 */
export function formatSuccess(message) {
  return chalk.green(`✓ ${message}`);
}

/**
 * Format error message
 * @param {string|Error} error - Error message or object
 * @returns {string} Formatted error message
 */
export function formatError(error) {
  const message = typeof error === 'string' ? error : error.message;
  return chalk.red(`✗ ${message}`);
}

/**
 * Format warning message
 * @param {string} message - Warning message
 * @returns {string} Formatted warning message
 */
export function formatWarning(message) {
  return chalk.yellow(`⚠ ${message}`);
}

/**
 * Format info message
 * @param {string} message - Info message
 * @returns {string} Formatted info message
 */
export function formatInfo(message) {
  return chalk.blue(`ℹ ${message}`);
}

/**
 * Format pagination info
 * @param {Object} pagination - Pagination object
 * @returns {string} Formatted pagination info
 */
export function formatPaginationInfo(pagination) {
  if (!pagination) return '';
  
  const parts = [];
  
  if (pagination.totalCount) {
    parts.push(`Total: ${pagination.totalCount}`);
  }
  
  if (pagination.hasNext) {
    parts.push(chalk.cyan('Has more pages'));
  }
  
  if (parts.length === 0) return '';
  
  return chalk.gray(`(${parts.join(', ')})`);
}

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} [maxLength=50] - Maximum length
 * @returns {string} Truncated text
 */
export function truncateText(text, maxLength = 50) {
  if (!text || typeof text !== 'string') return '';
  
  if (text.length <= maxLength) return text;
  
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Create a formatted header
 * @param {string} title - Header title
 * @param {string} [subtitle] - Optional subtitle
 * @returns {string} Formatted header
 */
export function createHeader(title, subtitle = '') {
  const output = [];
  output.push(chalk.bold.magenta(title));
  
  if (subtitle) {
    output.push(chalk.gray(subtitle));
  }
  
  output.push(''); // Empty line
  return output.join('\n');
}