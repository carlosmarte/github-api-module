#!/usr/bin/env node

import { Command } from 'commander';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import ora from 'ora';

import GistAPI from './index.mjs';
import { Formatter } from './lib/utils/formatter.mjs';
import { config } from './lib/utils/config.mjs';

// Import command modules
import { createListCommand } from './lib/cli/commands/list.mjs';
import { createCreateCommand } from './lib/cli/commands/create.mjs';
import { createUpdateCommand } from './lib/cli/commands/update.mjs';
import { createDeleteCommand } from './lib/cli/commands/delete.mjs';
import { createStarCommand } from './lib/cli/commands/star.mjs';
import { createForkCommand } from './lib/cli/commands/fork.mjs';
import { createCommentCommand } from './lib/cli/commands/comment.mjs';
import { createGetCommand } from './lib/cli/commands/get.mjs';
import { createCommitsCommand } from './lib/cli/commands/commits.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageJson = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf8'));

// Create main program
const program = new Command();

program
  .name('gist')
  .description('GitHub Gists CLI - Manage your GitHub gists from the command line')
  .version(packageJson.version)
  .option('-t, --token <token>', 'GitHub personal access token')
  .option('-f, --format <format>', 'Output format (json, yaml, table)', 'json')
  .option('--no-color', 'Disable colored output')
  .hook('preAction', (thisCommand) => {
    // Set up global options
    const opts = thisCommand.opts();
    
    // Disable colors if requested
    if (!opts.color) {
      chalk.level = 0;
    }
    
    // Store format globally
    global.outputFormat = opts.format;
    
    // Create API client
    global.gistAPI = new GistAPI({ 
      token: opts.token 
    });
    
    global.formatter = new Formatter(opts.format);
  });

// Config command
program
  .command('config')
  .description('Manage CLI configuration')
  .argument('[action]', 'Action to perform (get, set, delete, list)')
  .argument('[key]', 'Configuration key')
  .argument('[value]', 'Configuration value')
  .action((action, key, value) => {
    switch (action) {
      case 'set':
        if (!key || !value) {
          console.error(chalk.red('Key and value are required for set action'));
          process.exit(1);
        }
        config.set(key, value);
        console.log(chalk.green(`✓ Set ${key} = ${value}`));
        break;
      
      case 'get':
        if (!key) {
          console.error(chalk.red('Key is required for get action'));
          process.exit(1);
        }
        const val = config.get(key);
        if (val !== undefined) {
          console.log(val);
        } else {
          console.log(chalk.yellow(`Key '${key}' not found`));
        }
        break;
      
      case 'delete':
        if (!key) {
          console.error(chalk.red('Key is required for delete action'));
          process.exit(1);
        }
        config.delete(key);
        console.log(chalk.green(`✓ Deleted ${key}`));
        break;
      
      case 'list':
      case undefined:
        const allConfig = config.load();
        if (Object.keys(allConfig).length === 0) {
          console.log(chalk.yellow('No configuration found'));
        } else {
          console.log(JSON.stringify(allConfig, null, 2));
        }
        break;
      
      case 'clear':
        config.clear();
        console.log(chalk.green('✓ Configuration cleared'));
        break;
      
      default:
        console.error(chalk.red(`Unknown action: ${action}`));
        console.log('Available actions: get, set, delete, list, clear');
        process.exit(1);
    }
  });

// Add all commands
createListCommand(program);
createCreateCommand(program);
createGetCommand(program);
createUpdateCommand(program);
createDeleteCommand(program);
createStarCommand(program);
createForkCommand(program);
createCommentCommand(program);
createCommitsCommand(program);

// Error handling
program.exitOverride();

try {
  await program.parseAsync(process.argv);
} catch (error) {
  if (error.code === 'commander.unknownCommand') {
    console.error(chalk.red('Unknown command'));
    program.outputHelp();
  } else if (error.name === 'AuthenticationError') {
    console.error(chalk.red('Authentication required'));
    console.log(chalk.yellow('Please set your GitHub token:'));
    console.log('  1. Set GITHUB_TOKEN environment variable');
    console.log('  2. Use --token flag');
    console.log('  3. Run: gist config set token <your-token>');
  } else if (error.name === 'RateLimitError') {
    const resetDate = new Date(error.resetTime * 1000);
    console.error(chalk.red('Rate limit exceeded'));
    console.log(chalk.yellow(`Resets at: ${resetDate.toLocaleString()}`));
  } else if (error.name === 'ValidationError') {
    console.error(chalk.red('Validation error:'), error.message);
    if (error.errors && error.errors.length > 0) {
      error.errors.forEach(err => {
        console.log(chalk.yellow(`  - ${err.field}: ${err.message}`));
      });
    }
  } else {
    console.error(chalk.red('Error:'), error.message);
    if (process.env.DEBUG) {
      console.error(error);
    }
  }
  process.exit(1);
}