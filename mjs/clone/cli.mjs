#!/usr/bin/env node

/**
 * @fileoverview Git Repository Management CLI - Command Line Interface
 * @version 1.0.0
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import dotenv from 'dotenv';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import { GitClient } from './src/client/GitClient.mjs';
import { GitError, AuthError } from './src/utils/errors.mjs';
import { setupConfig, loadConfig } from './src/cli/config.mjs';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Package info
const packageJson = {
  name: '@thinkeloquent/clone',
  version: '1.0.0',
  description: 'Git Repository Management SDK and CLI - Local git operations with simple-git'
};

/**
 * Main CLI program
 */
const program = new Command();

program
  .name('gh-clone')
  .description(packageJson.description)
  .version(packageJson.version)
  .option('-t, --token <token>', 'GitHub personal access token')
  .option('-d, --base-dir <dir>', 'Base directory for repositories', './repositories')
  .option('--timeout <ms>', 'Operation timeout in milliseconds', '300000')
  .option('-v, --verbose', 'Enable verbose logging')
  .option('-q, --quiet', 'Suppress output except errors')
  .option('--json', 'Output results as JSON')
  .option('--no-color', 'Disable colored output');

/**
 * Create GitClient from global options
 */
function createClient(options) {
  const config = loadConfig();
  
  return new GitClient({
    baseDir: options.baseDir || config.baseDir || './repositories',
    token: options.token || config.token || process.env.GITHUB_TOKEN,
    verbose: options.verbose || config.verbose || false,
    timeout: parseInt(options.timeout || config.timeout || '300000')
  });
}

/**
 * Format output based on options
 */
function formatOutput(data, options) {
  if (options.quiet && !data.error) {
    return;
  }

  if (options.json) {
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  // Pretty print based on data type
  if (data.error) {
    console.error(chalk.red(`Error: ${data.error}`));
    if (options.verbose && data.details) {
      console.error(chalk.gray(JSON.stringify(data.details, null, 2)));
    }
  } else if (Array.isArray(data)) {
    data.forEach(item => {
      if (typeof item === 'string') {
        console.log(item);
      } else {
        console.log(chalk.cyan(item.name || item.path || JSON.stringify(item)));
      }
    });
  } else if (typeof data === 'object') {
    Object.entries(data).forEach(([key, value]) => {
      if (typeof value === 'object') {
        console.log(chalk.cyan(`${key}:`), JSON.stringify(value));
      } else {
        console.log(chalk.cyan(`${key}:`), value);
      }
    });
  } else {
    console.log(data);
  }
}

/**
 * Handle errors consistently
 */
function handleError(error, options) {
  const errorData = {
    error: error.message,
    type: error.name,
    timestamp: new Date().toISOString()
  };

  if (options.verbose) {
    errorData.details = {
      stack: error.stack,
      context: error.context || {},
      originalError: error.originalError ? {
        message: error.originalError.message,
        stack: error.originalError.stack
      } : null
    };
  }

  formatOutput(errorData, options);
  process.exit(1);
}

/**
 * Clone command
 */
program
  .command('clone <repo-url> [target-dir]')
  .description('Clone a repository')
  .option('-b, --branch <branch>', 'Specific branch to clone')
  .option('--depth <depth>', 'Clone depth for shallow clone', parseInt)
  .option('--bare', 'Create bare repository')
  .action(async (repoUrl, targetDir, cmdOptions) => {
    const globalOptions = program.opts();
    const spinner = ora('Cloning repository...').start();
    
    try {
      const client = createClient(globalOptions);
      
      spinner.text = `Cloning ${repoUrl}...`;
      
      const result = await client.clone(repoUrl, targetDir, {
        branch: cmdOptions.branch,
        depth: cmdOptions.depth,
        bare: cmdOptions.bare,
        progress: (data) => {
          spinner.text = `Cloning ${repoUrl}... ${data}`;
        }
      });

      spinner.succeed(`Successfully cloned to ${result.name}`);
      
      if (!globalOptions.quiet) {
        console.log(chalk.green('✓ Repository cloned successfully'));
        console.log(chalk.cyan('Path:'), result.path);
        console.log(chalk.cyan('Branch:'), result.branch);
        if (result.remotes.length > 0) {
          console.log(chalk.cyan('Remote:'), result.remotes[0].refs.fetch);
        }
      }

      if (globalOptions.json) {
        formatOutput(result, globalOptions);
      }

    } catch (error) {
      spinner.fail('Clone failed');
      handleError(error, globalOptions);
    }
  });

/**
 * Pull command
 */
program
  .command('pull <repo-name>')
  .description('Pull latest changes for a repository')
  .option('-r, --remote <remote>', 'Remote name', 'origin')
  .option('-b, --branch <branch>', 'Branch name')
  .option('--rebase', 'Use rebase instead of merge')
  .action(async (repoName, cmdOptions) => {
    const globalOptions = program.opts();
    const spinner = ora(`Pulling changes for ${repoName}...`).start();
    
    try {
      const client = createClient(globalOptions);
      
      const result = await client.pull(repoName, {
        remote: cmdOptions.remote,
        branch: cmdOptions.branch,
        rebase: cmdOptions.rebase
      });

      spinner.succeed(`Successfully pulled ${repoName}`);
      
      if (!globalOptions.quiet) {
        console.log(chalk.green('✓ Pull completed successfully'));
        console.log(chalk.cyan('Repository:'), result.name);
        console.log(chalk.cyan('Status:'), result.status.current);
        if (result.result.summary) {
          console.log(chalk.cyan('Changes:'), result.result.summary.changes || 0);
          console.log(chalk.cyan('Insertions:'), result.result.summary.insertions || 0);
          console.log(chalk.cyan('Deletions:'), result.result.summary.deletions || 0);
        }
      }

      if (globalOptions.json) {
        formatOutput(result, globalOptions);
      }

    } catch (error) {
      spinner.fail('Pull failed');
      handleError(error, globalOptions);
    }
  });

/**
 * Push command
 */
program
  .command('push <repo-name>')
  .description('Push changes for a repository')
  .option('-r, --remote <remote>', 'Remote name', 'origin')
  .option('-b, --branch <branch>', 'Branch name')
  .option('-f, --force', 'Force push')
  .option('-u, --set-upstream', 'Set upstream tracking')
  .action(async (repoName, cmdOptions) => {
    const globalOptions = program.opts();
    const spinner = ora(`Pushing changes for ${repoName}...`).start();
    
    try {
      const client = createClient(globalOptions);
      
      const result = await client.push(repoName, {
        remote: cmdOptions.remote,
        branch: cmdOptions.branch,
        force: cmdOptions.force,
        setUpstream: cmdOptions.setUpstream
      });

      spinner.succeed(`Successfully pushed ${repoName}`);
      
      if (!globalOptions.quiet) {
        console.log(chalk.green('✓ Push completed successfully'));
        console.log(chalk.cyan('Repository:'), result.name);
        console.log(chalk.cyan('Status:'), result.status.current);
      }

      if (globalOptions.json) {
        formatOutput(result, globalOptions);
      }

    } catch (error) {
      spinner.fail('Push failed');
      handleError(error, globalOptions);
    }
  });

/**
 * Status command
 */
program
  .command('status <repo-name>')
  .description('Show repository status')
  .action(async (repoName) => {
    const globalOptions = program.opts();
    
    try {
      const client = createClient(globalOptions);
      const result = await client.status(repoName);
      
      if (!globalOptions.quiet && !globalOptions.json) {
        console.log(chalk.green(`Repository: ${result.name}`));
        console.log(chalk.cyan('Path:'), result.path);
        console.log(chalk.cyan('Branch:'), result.branch);
        console.log(chalk.cyan('Modified:'), result.status.modified.length);
        console.log(chalk.cyan('Staged:'), result.status.staged.length);
        console.log(chalk.cyan('Untracked:'), result.status.not_added.length);
        console.log(chalk.cyan('Behind:'), result.status.behind);
        console.log(chalk.cyan('Ahead:'), result.status.ahead);
        
        if (result.recentCommits.length > 0) {
          console.log(chalk.cyan('Recent commits:'));
          result.recentCommits.slice(0, 3).forEach(commit => {
            console.log(`  ${chalk.yellow(commit.hash.substring(0, 7))} ${commit.message}`);
          });
        }
      }

      formatOutput(result, globalOptions);

    } catch (error) {
      handleError(error, globalOptions);
    }
  });

/**
 * List command
 */
program
  .command('list')
  .alias('ls')
  .description('List all managed repositories')
  .action(async () => {
    const globalOptions = program.opts();
    
    try {
      const client = createClient(globalOptions);
      const repositories = await client.listRepositories();
      
      if (!globalOptions.quiet && !globalOptions.json) {
        if (repositories.length === 0) {
          console.log(chalk.yellow('No repositories found'));
          return;
        }

        console.log(chalk.green(`Found ${repositories.length} repositories:`));
        repositories.forEach(repo => {
          console.log(`  ${chalk.cyan(repo.name)} (${repo.branch})`);
          console.log(`    Path: ${repo.path}`);
          console.log(`    Status: ${repo.status.modified.length} modified, ${repo.status.ahead} ahead, ${repo.status.behind} behind`);
          console.log();
        });
      }

      formatOutput(repositories, globalOptions);

    } catch (error) {
      handleError(error, globalOptions);
    }
  });

/**
 * Init command
 */
program
  .command('init <repo-name>')
  .description('Initialize a new repository')
  .option('--bare', 'Create bare repository')
  .action(async (repoName, cmdOptions) => {
    const globalOptions = program.opts();
    const spinner = ora(`Initializing repository ${repoName}...`).start();
    
    try {
      const client = createClient(globalOptions);
      
      const result = await client.init(repoName, {
        bare: cmdOptions.bare
      });

      spinner.succeed(`Successfully initialized ${repoName}`);
      
      if (!globalOptions.quiet) {
        console.log(chalk.green('✓ Repository initialized successfully'));
        console.log(chalk.cyan('Name:'), result.name);
        console.log(chalk.cyan('Path:'), result.path);
        console.log(chalk.cyan('Type:'), result.bare ? 'bare' : 'regular');
      }

      if (globalOptions.json) {
        formatOutput(result, globalOptions);
      }

    } catch (error) {
      spinner.fail('Init failed');
      handleError(error, globalOptions);
    }
  });

/**
 * Sync command
 */
program
  .command('sync <repo-name>')
  .description('Sync repository (pull + optional push)')
  .option('-r, --remote <remote>', 'Remote name', 'origin')
  .option('-b, --branch <branch>', 'Branch name')
  .option('--auto-push', 'Automatically push after successful pull')
  .option('--rebase', 'Use rebase instead of merge')
  .action(async (repoName, cmdOptions) => {
    const globalOptions = program.opts();
    const spinner = ora(`Syncing ${repoName}...`).start();
    
    try {
      const client = createClient(globalOptions);
      
      // Pull first
      spinner.text = `Pulling changes for ${repoName}...`;
      const pullResult = await client.pull(repoName, {
        remote: cmdOptions.remote,
        branch: cmdOptions.branch,
        rebase: cmdOptions.rebase
      });

      let pushResult = null;
      if (cmdOptions.autoPush) {
        const status = await client.status(repoName);
        if (status.status.ahead > 0) {
          spinner.text = `Pushing changes for ${repoName}...`;
          pushResult = await client.push(repoName, {
            remote: cmdOptions.remote,
            branch: cmdOptions.branch
          });
        }
      }

      spinner.succeed(`Successfully synced ${repoName}`);
      
      if (!globalOptions.quiet) {
        console.log(chalk.green('✓ Sync completed successfully'));
        console.log(chalk.cyan('Repository:'), pullResult.name);
        console.log(chalk.cyan('Pull changes:'), pullResult.result.summary?.changes || 0);
        if (pushResult) {
          console.log(chalk.cyan('Push:'), 'completed');
        }
      }

      const result = {
        repository: pullResult.name,
        pull: pullResult,
        push: pushResult,
        syncedAt: new Date().toISOString()
      };

      if (globalOptions.json) {
        formatOutput(result, globalOptions);
      }

    } catch (error) {
      spinner.fail('Sync failed');
      handleError(error, globalOptions);
    }
  });

/**
 * Config command
 */
program
  .command('config')
  .description('Manage configuration')
  .action(async () => {
    const globalOptions = program.opts();
    
    try {
      await setupConfig();
      console.log(chalk.green('✓ Configuration setup completed'));
    } catch (error) {
      handleError(error, globalOptions);
    }
  });

// Handle unknown commands
program.on('command:*', (operands) => {
  console.error(chalk.red(`Unknown command: ${operands[0]}`));
  console.log('See --help for available commands');
  process.exit(1);
});

// Parse arguments
if (process.argv.length < 3) {
  program.help();
} else {
  program.parse(process.argv);
}