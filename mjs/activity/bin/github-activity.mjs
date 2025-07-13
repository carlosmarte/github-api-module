#!/usr/bin/env node

/**
 * GitHub Activity CLI
 * Command-line interface for GitHub Activity API
 */

import { program } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { config } from 'dotenv';
import { createClient } from '../src/index.mjs';
import { setupCommands } from '../src/cli/commands.mjs';
import { displayBanner, displayError } from '../src/cli/formatters.mjs';

// Load environment variables
config();

// Display banner
displayBanner();

// Main CLI program
program
  .name('github-activity')
  .alias('gha')
  .description('GitHub Activity API CLI - Manage events, notifications, stars, and watching')
  .version('1.0.0')
  .option('-t, --token <token>', 'GitHub personal access token')
  .option('-b, --base-url <url>', 'GitHub API base URL', 'https://api.github.com')
  .option('-c, --config <path>', 'Path to configuration file')
  .option('-o, --output <format>', 'Output format (json, table, csv)', 'table')
  .option('-q, --quiet', 'Suppress non-error output')
  .option('-v, --verbose', 'Verbose output')
  .option('--no-color', 'Disable colored output')
  .option('--debug', 'Enable debug mode');

// Global error handler
process.on('unhandledRejection', (error) => {
  displayError(error);
  process.exit(1);
});

// Initialize client and setup commands
async function main() {
  try {
    // Get global options
    const options = program.opts();
    
    // Disable colors if requested
    if (options.noColor) {
      chalk.level = 0;
    }
    
    // Set debug mode
    if (options.debug) {
      process.env.DEBUG = 'true';
    }
    
    // Create client
    const clientOptions = {
      token: options.token || process.env.GITHUB_TOKEN || process.env.GH_TOKEN,
      baseURL: options.baseUrl,
      debug: options.debug
    };
    
    if (options.config) {
      clientOptions.configPath = options.config;
    }
    
    const client = await createClient(clientOptions);
    
    // Setup commands with client
    setupCommands(program, client, options);
    
    // Parse arguments
    await program.parseAsync(process.argv);
    
    // Show help if no command provided
    if (process.argv.length < 3) {
      program.help();
    }
    
  } catch (error) {
    displayError(error);
    process.exit(1);
  }
}

// Run CLI
main();