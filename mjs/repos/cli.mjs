#!/usr/bin/env node

/**
 * @fileoverview GitHub Repository CLI - Command Line Interface
 * @version 1.0.0
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import dotenv from 'dotenv';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import { RepoClient } from './src/client/RepoClient.mjs';
import { RepoError, AuthError } from './src/utils/errors.mjs';
import * as commands from './src/cli/commands/index.mjs';
import { setupConfig, loadConfig } from './src/cli/config.mjs';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Package info
const packageJson = {
  name: '@github-api/repos',
  version: '1.0.0',
  description: 'GitHub Repository API client and CLI'
};

/**
 * Main CLI program
 */
const program = new Command();

program
  .name('gh-repo')
  .description(packageJson.description)
  .version(packageJson.version)
  .option('-t, --token <token>', 'GitHub personal access token')
  .option('--base-url <url>', 'GitHub API base URL', 'https://api.github.com')
  .option('--timeout <ms>', 'Request timeout in milliseconds', '10000')
  .option('--no-rate-limit', 'Disable rate limiting')
  .option('-v, --verbose', 'Enable verbose logging')
  .option('-q, --quiet', 'Suppress output except errors')
  .option('--json', 'Output results as JSON')
  .option('--no-color', 'Disable colored output');

/**
 * Global error handler
 */
process.on('uncaughtException', (error) => {
  console.error(chalk.red('✗ Uncaught Exception:'), error.message);
  if (program.opts().verbose) {
    console.error(error.stack);
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('✗ Unhandled Rejection:'), reason);
  if (program.opts().verbose) {
    console.error(promise);
  }
  process.exit(1);
});

/**
 * Create authenticated client from CLI options
 */
async function createClient(options = {}) {
  const globalOpts = program.opts();
  const config = await loadConfig();
  
  const token = options.token || globalOpts.token || config.token || process.env.GITHUB_TOKEN;
  
  if (!token) {
    throw new AuthError('GitHub token required. Set GITHUB_TOKEN environment variable or use --token option');
  }
  
  return new RepoClient({
    token,
    baseUrl: globalOpts.baseUrl,
    timeout: parseInt(globalOpts.timeout),
    rateLimiting: { enabled: !globalOpts.noRateLimit },
    verbose: globalOpts.verbose
  });
}

/**
 * Repository commands
 */
const repoCmd = program
  .command('repo')
  .alias('repository')
  .description('Repository management commands');

// Get repository
repoCmd
  .command('get <owner> <repo>')
  .description('Get repository information')
  .option('--full', 'Show full repository details')
  .action(async (owner, repo, options) => {
    const spinner = ora('Fetching repository...').start();
    try {
      const client = await createClient(options);
      const result = await client.repositories.get(owner, repo);
      
      spinner.succeed('Repository fetched successfully');
      await commands.repositories.displayRepository(result, { ...program.opts(), ...options });
    } catch (error) {
      spinner.fail('Failed to fetch repository');
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

// List repositories
repoCmd
  .command('list [user]')
  .alias('ls')
  .description('List repositories for user or authenticated user')
  .option('--type <type>', 'Repository type (all, owner, member)', 'all')
  .option('--sort <sort>', 'Sort by (created, updated, pushed, full_name)', 'updated')
  .option('--direction <direction>', 'Sort direction (asc, desc)', 'desc')
  .option('--limit <limit>', 'Limit number of results', '30')
  .action(async (user, options) => {
    const spinner = ora('Fetching repositories...').start();
    try {
      const client = await createClient(options);
      const repos = user 
        ? await client.repositories.listForUser(user, options)
        : await client.repositories.listForAuthenticatedUser(options);
      
      spinner.succeed(`Found ${repos.length} repositories`);
      await commands.repositories.displayRepositoryList(repos, { ...program.opts(), ...options });
    } catch (error) {
      spinner.fail('Failed to fetch repositories');
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

// Create repository
repoCmd
  .command('create <name>')
  .description('Create a new repository')
  .option('-d, --description <description>', 'Repository description')
  .option('--private', 'Create private repository')
  .option('--init', 'Initialize with README')
  .option('--template <template>', 'Create from template repository')
  .option('--org <organization>', 'Create in organization')
  .action(async (name, options) => {
    const spinner = ora('Creating repository...').start();
    try {
      const client = await createClient(options);
      const repoData = {
        name,
        description: options.description,
        private: options.private || false,
        auto_init: options.init || false
      };
      
      const result = options.org
        ? await client.repositories.createInOrg(options.org, repoData)
        : await client.repositories.create(repoData);
      
      spinner.succeed('Repository created successfully');
      console.log(chalk.green(`✓ Created repository: ${result.full_name}`));
      console.log(chalk.blue(`  URL: ${result.html_url}`));
    } catch (error) {
      spinner.fail('Failed to create repository');
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

// Delete repository
repoCmd
  .command('delete <owner> <repo>')
  .alias('rm')
  .description('Delete a repository')
  .option('--force', 'Skip confirmation prompt')
  .action(async (owner, repo, options) => {
    if (!options.force) {
      const { confirm } = await import('inquirer');
      const { shouldDelete } = await confirm({
        name: 'shouldDelete',
        message: `Are you sure you want to delete ${owner}/${repo}? This action cannot be undone.`,
        default: false
      });
      
      if (!shouldDelete) {
        console.log('Operation cancelled');
        return;
      }
    }
    
    const spinner = ora('Deleting repository...').start();
    try {
      const client = await createClient(options);
      await client.repositories.delete(owner, repo);
      
      spinner.succeed('Repository deleted successfully');
      console.log(chalk.green(`✓ Deleted repository: ${owner}/${repo}`));
    } catch (error) {
      spinner.fail('Failed to delete repository');
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

/**
 * Branch commands
 */
const branchCmd = program
  .command('branch')
  .description('Branch management commands');

branchCmd
  .command('list <owner> <repo>')
  .alias('ls')
  .description('List repository branches')
  .option('--protected', 'Show only protected branches')
  .action(async (owner, repo, options) => {
    const spinner = ora('Fetching branches...').start();
    try {
      const client = await createClient(options);
      const branches = await client.branches.list(owner, repo, options);
      
      spinner.succeed(`Found ${branches.length} branches`);
      await commands.branches.displayBranchList(branches, { ...program.opts(), ...options });
    } catch (error) {
      spinner.fail('Failed to fetch branches');
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

/**
 * Collaborator commands
 */
const collabCmd = program
  .command('collaborator')
  .alias('collab')
  .description('Collaborator management commands');

collabCmd
  .command('list <owner> <repo>')
  .alias('ls')
  .description('List repository collaborators')
  .action(async (owner, repo, options) => {
    const spinner = ora('Fetching collaborators...').start();
    try {
      const client = await createClient(options);
      const collaborators = await client.collaborators.list(owner, repo);
      
      spinner.succeed(`Found ${collaborators.length} collaborators`);
      await commands.collaborators.displayCollaboratorList(collaborators, { ...program.opts(), ...options });
    } catch (error) {
      spinner.fail('Failed to fetch collaborators');
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

/**
 * Configuration commands
 */
const configCmd = program
  .command('config')
  .description('Configuration management');

configCmd
  .command('setup')
  .description('Interactive configuration setup')
  .action(async () => {
    try {
      await setupConfig();
      console.log(chalk.green('✓ Configuration completed'));
    } catch (error) {
      console.error(chalk.red('Configuration failed:'), error.message);
      process.exit(1);
    }
  });

configCmd
  .command('show')
  .description('Show current configuration')
  .action(async () => {
    try {
      const config = await loadConfig();
      console.log(JSON.stringify(config, null, 2));
    } catch (error) {
      console.error(chalk.red('Failed to load configuration:'), error.message);
      process.exit(1);
    }
  });

/**
 * Help command enhancement
 */
program
  .command('help [command]')
  .description('Display help for command')
  .action((command) => {
    if (command) {
      program.commands.find(cmd => cmd.name() === command)?.help();
    } else {
      program.help();
    }
  });

/**
 * Parse command line arguments and execute
 */
async function main() {
  try {
    await program.parseAsync(process.argv);
  } catch (error) {
    if (error instanceof AuthError) {
      console.error(chalk.red('Authentication Error:'), error.message);
      console.log(chalk.yellow('💡 Tip: Run `gh-repo config setup` to configure authentication'));
    } else if (error instanceof RepoError) {
      console.error(chalk.red('Repository Error:'), error.message);
    } else {
      console.error(chalk.red('Error:'), error.message);
      if (program.opts().verbose) {
        console.error(error.stack);
      }
    }
    process.exit(1);
  }
}

// Run CLI if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { program, createClient };
export default program;