/**
 * Base command class for CLI commands
 * @module commands/base
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { ErrorHandler } from '../core/errors.mjs';

export class BaseCommand {
  constructor(name, description) {
    this.program = new Command(name);
    this.program.description(description);
  }

  /**
   * Add common options to the command
   */
  addCommonOptions() {
    this.program
      .option('-t, --token <token>', 'GitHub personal access token')
      .option('-o, --output <format>', 'Output format (json, table)', 'table')
      .option('--per-page <number>', 'Results per page (max 100)', '30')
      .option('--page <number>', 'Page number to fetch', '1')
      .option('--all-pages', 'Fetch all pages automatically')
      .option('-v, --verbose', 'Enable verbose output');

    return this;
  }

  /**
   * Handle command execution with error handling
   * @param {Function} handler - Command handler function
   */
  action(handler) {
    this.program.action(async (...args) => {
      try {
        await handler.apply(this, args);
      } catch (error) {
        const handledError = ErrorHandler.handle(error);
        
        console.error(chalk.red(`Error: ${handledError.message}`));
        
        if (args[args.length - 1]?.opts?.()?.verbose) {
          console.error(chalk.gray(handledError.stack));
        }
        
        process.exit(1);
      }
    });

    return this.program;
  }

  /**
   * Format and display output
   * @param {any} data - Data to display
   * @param {string} format - Output format
   */
  displayOutput(data, format = 'table') {
    if (format === 'json') {
      console.log(JSON.stringify(data, null, 2));
      return;
    }

    // Default table format for reactions
    if (Array.isArray(data)) {
      this.displayTable(data);
    } else {
      this.displayTable([data]);
    }
  }

  /**
   * Display data in table format
   * @param {Array} data - Array of data objects
   */
  displayTable(data) {
    if (!data || data.length === 0) {
      console.log(chalk.yellow('No data found'));
      return;
    }

    // Simple table implementation for reactions
    const reactions = data.map(item => ({
      ID: item.id,
      User: item.user?.login || 'N/A',
      Content: this.formatReactionEmoji(item.content),
      'Created At': new Date(item.created_at).toLocaleString()
    }));

    console.table(reactions);
  }

  /**
   * Format reaction content with emoji
   * @param {string} content - Reaction content
   * @returns {string} Formatted reaction with emoji
   */
  formatReactionEmoji(content) {
    const emojiMap = {
      '+1': '👍 +1',
      '-1': '👎 -1',
      'laugh': '😄 laugh',
      'confused': '😕 confused',
      'heart': '❤️ heart',
      'hooray': '🎉 hooray',
      'rocket': '🚀 rocket',
      'eyes': '👀 eyes'
    };
    
    return emojiMap[content] || content;
  }

  /**
   * Parse pagination options from command line
   * @param {Object} options - Command line options
   * @returns {Object} Pagination options
   */
  parsePaginationOptions(options) {
    return {
      perPage: parseInt(options.perPage) || 30,
      page: parseInt(options.page) || 1,
      autoPage: Boolean(options.allPages)
    };
  }

  /**
   * Build configuration from command line options
   * @param {Object} options - Command line options
   * @returns {Object} Configuration object
   */
  buildConfig(options) {
    const config = {};
    
    if (options.token) {
      config.token = options.token;
    }
    
    if (options.verbose) {
      config.logging = { level: 'debug' };
    }
    
    return config;
  }
}