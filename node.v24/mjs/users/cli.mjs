#!/usr/bin/env node

/**
 * @fileoverview GitHub Users CLI - Command Line Interface
 * @version 1.0.0
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import dotenv from 'dotenv';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import { UsersClient } from './src/client/UsersClient.mjs';
import { UsersError, AuthError } from './src/utils/errors.mjs';
import { getAuth } from './src/client/auth.mjs';
import { formatError, formatSuccess, formatInfo } from './src/utils/formatting.mjs';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Package info
const packageJson = {
  name: '@github-api/users',
  version: '1.0.0',
  description: 'GitHub Users API client and CLI'
};

/**
 * Main CLI program
 */
const program = new Command();

program
  .name('gh-users')
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
function handleError(error, options = {}) {
  if (options.quiet) return;

  if (error instanceof AuthError) {
    console.error(formatError(`Authentication failed: ${error.message}`));
    console.error(formatInfo('Set GITHUB_TOKEN environment variable or use --token option'));
    process.exit(1);
  } else if (error instanceof UsersError) {
    console.error(formatError(error.message));
    if (options.verbose && error.response) {
      console.error(chalk.gray('Response details:'), JSON.stringify(error.response, null, 2));
    }
    process.exit(1);
  } else {
    console.error(formatError(`Unexpected error: ${error.message}`));
    if (options.verbose) {
      console.error(chalk.gray(error.stack));
    }
    process.exit(1);
  }
}

/**
 * Create client from options
 */
function createClient(options) {
  const token = options.token || getAuth();
  
  if (!token) {
    throw new AuthError('GitHub token is required. Set GITHUB_TOKEN environment variable or use --token option.');
  }

  return new UsersClient({
    token,
    baseUrl: options.baseUrl,
    timeout: parseInt(options.timeout),
    rateLimiting: {
      enabled: !options.noRateLimit
    }
  });
}

/**
 * Profile commands
 */
const profileCmd = program
  .command('profile')
  .alias('me')
  .description('Manage authenticated user profile');

profileCmd
  .command('show')
  .description('Show authenticated user profile')
  .action(async (options) => {
    try {
      const globalOptions = program.opts();
      const client = createClient(globalOptions);
      
      const spinner = globalOptions.quiet ? null : ora('Fetching user profile...').start();
      
      const user = await client.profile.getAuthenticated();
      
      if (spinner) spinner.succeed('Profile retrieved');
      
      if (globalOptions.json) {
        console.log(JSON.stringify(user, null, 2));
      } else {
        const { formatUser } = await import('./src/utils/formatting.mjs');
        console.log(formatUser(user));
      }
    } catch (error) {
      if (spinner) spinner.fail('Failed to retrieve profile');
      handleError(error, program.opts());
    }
  });

profileCmd
  .command('update')
  .description('Update authenticated user profile')
  .option('--name <name>', 'Full name')
  .option('--bio <bio>', 'Biography')
  .option('--company <company>', 'Company')
  .option('--location <location>', 'Location')
  .option('--blog <url>', 'Blog URL')
  .option('--twitter <username>', 'Twitter username')
  .option('--hireable', 'Set as hireable')
  .option('--not-hireable', 'Set as not hireable')
  .action(async (options) => {
    try {
      const globalOptions = program.opts();
      const client = createClient(globalOptions);
      
      const updateData = {};
      if (options.name !== undefined) updateData.name = options.name;
      if (options.bio !== undefined) updateData.bio = options.bio;
      if (options.company !== undefined) updateData.company = options.company;
      if (options.location !== undefined) updateData.location = options.location;
      if (options.blog !== undefined) updateData.blog = options.blog;
      if (options.twitter !== undefined) updateData.twitter_username = options.twitter;
      if (options.hireable) updateData.hireable = true;
      if (options.notHireable) updateData.hireable = false;
      
      if (Object.keys(updateData).length === 0) {
        console.log(formatInfo('No updates specified. Use --help to see available options.'));
        return;
      }
      
      const spinner = globalOptions.quiet ? null : ora('Updating profile...').start();
      
      const user = await client.profile.updateAuthenticated(updateData);
      
      if (spinner) spinner.succeed('Profile updated');
      
      if (globalOptions.json) {
        console.log(JSON.stringify(user, null, 2));
      } else {
        console.log(formatSuccess('Profile updated successfully!'));
        const { formatUser } = await import('./src/utils/formatting.mjs');
        console.log(formatUser(user));
      }
    } catch (error) {
      if (spinner) spinner.fail('Failed to update profile');
      handleError(error, program.opts());
    }
  });

/**
 * Email commands
 */
const emailCmd = program
  .command('email')
  .alias('emails')
  .description('Manage authenticated user email addresses');

emailCmd
  .command('list')
  .description('List email addresses')
  .option('--verified', 'Show only verified emails')
  .option('--unverified', 'Show only unverified emails')
  .option('--primary', 'Show only primary email')
  .action(async (options) => {
    try {
      const globalOptions = program.opts();
      const client = createClient(globalOptions);
      
      const spinner = globalOptions.quiet ? null : ora('Fetching email addresses...').start();
      
      let emails;
      if (options.verified) {
        emails = await client.emails.getVerified();
      } else if (options.unverified) {
        emails = await client.emails.getUnverified();
      } else if (options.primary) {
        const primary = await client.emails.getPrimary();
        emails = primary ? [primary] : [];
      } else {
        emails = await client.emails.list();
      }
      
      if (spinner) spinner.succeed(`Found ${emails.length} email address${emails.length === 1 ? '' : 'es'}`);
      
      if (globalOptions.json) {
        console.log(JSON.stringify(emails, null, 2));
      } else {
        const { formatEmails } = await import('./src/utils/formatting.mjs');
        console.log(formatEmails(emails));
      }
    } catch (error) {
      if (spinner) spinner.fail('Failed to retrieve email addresses');
      handleError(error, program.opts());
    }
  });

emailCmd
  .command('add <emails...>')
  .description('Add email addresses')
  .action(async (emails) => {
    try {
      const globalOptions = program.opts();
      const client = createClient(globalOptions);
      
      const spinner = globalOptions.quiet ? null : ora(`Adding ${emails.length} email address${emails.length === 1 ? '' : 'es'}...`).start();
      
      const result = await client.emails.add(emails);
      
      if (spinner) spinner.succeed(`Added ${result.length} email address${result.length === 1 ? '' : 'es'}`);
      
      if (globalOptions.json) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(formatSuccess(`Successfully added ${result.length} email address${result.length === 1 ? '' : 'es'}!`));
        emails.forEach(email => console.log(`  + ${email}`));
      }
    } catch (error) {
      if (spinner) spinner.fail('Failed to add email addresses');
      handleError(error, program.opts());
    }
  });

emailCmd
  .command('delete <emails...>')
  .alias('remove')
  .description('Delete email addresses')
  .action(async (emails) => {
    try {
      const globalOptions = program.opts();
      const client = createClient(globalOptions);
      
      const spinner = globalOptions.quiet ? null : ora(`Deleting ${emails.length} email address${emails.length === 1 ? '' : 'es'}...`).start();
      
      await client.emails.delete(emails);
      
      if (spinner) spinner.succeed(`Deleted ${emails.length} email address${emails.length === 1 ? '' : 'es'}`);
      
      if (!globalOptions.json) {
        console.log(formatSuccess(`Successfully deleted ${emails.length} email address${emails.length === 1 ? '' : 'es'}!`));
        emails.forEach(email => console.log(`  - ${email}`));
      }
    } catch (error) {
      if (spinner) spinner.fail('Failed to delete email addresses');
      handleError(error, program.opts());
    }
  });

/**
 * User discovery commands
 */
const userCmd = program
  .command('user')
  .alias('users')
  .description('Discover and view user information');

userCmd
  .command('get <username>')
  .description('Get user information by username')
  .action(async (username) => {
    try {
      const globalOptions = program.opts();
      const client = createClient(globalOptions);
      
      const spinner = globalOptions.quiet ? null : ora(`Fetching user ${username}...`).start();
      
      const user = await client.discovery.getByUsername(username);
      
      if (spinner) spinner.succeed(`Retrieved user ${username}`);
      
      if (globalOptions.json) {
        console.log(JSON.stringify(user, null, 2));
      } else {
        const { formatUser } = await import('./src/utils/formatting.mjs');
        console.log(formatUser(user));
      }
    } catch (error) {
      if (spinner) spinner.fail(`Failed to retrieve user ${username}`);
      handleError(error, program.opts());
    }
  });

userCmd
  .command('list')
  .description('List GitHub users')
  .option('--since <id>', 'User ID to start listing from', parseInt)
  .option('--per-page <count>', 'Number of users per page (max 100)', parseInt, 30)
  .option('--type <type>', 'Filter by user type (User or Organization)')
  .action(async (options) => {
    try {
      const globalOptions = program.opts();
      const client = createClient(globalOptions);
      
      const listOptions = {};
      if (options.since) listOptions.since = options.since;
      if (options.perPage) listOptions.per_page = options.perPage;
      
      const spinner = globalOptions.quiet ? null : ora('Fetching users...').start();
      
      let users = await client.discovery.list(listOptions);
      
      // Filter by type if specified
      if (options.type) {
        users = users.filter(user => user.type === options.type);
      }
      
      if (spinner) spinner.succeed(`Found ${users.length} users`);
      
      if (globalOptions.json) {
        console.log(JSON.stringify(users, null, 2));
      } else {
        const { formatUserTable } = await import('./src/utils/formatting.mjs');
        console.log(formatUserTable(users));
      }
    } catch (error) {
      if (spinner) spinner.fail('Failed to list users');
      handleError(error, program.opts());
    }
  });

/**
 * Context/hovercard commands
 */
const contextCmd = program
  .command('context')
  .alias('hovercard')
  .description('Get contextual user information');

contextCmd
  .command('get <username>')
  .description('Get user context information')
  .option('--subject-type <type>', 'Context subject type (repository, issue, pull_request, organization)')
  .option('--subject-id <id>', 'Context subject ID')
  .action(async (username, options) => {
    try {
      const globalOptions = program.opts();
      const client = createClient(globalOptions);
      
      const contextOptions = {};
      if (options.subjectType) contextOptions.subject_type = options.subjectType;
      if (options.subjectId) contextOptions.subject_id = options.subjectId;
      
      const spinner = globalOptions.quiet ? null : ora(`Fetching context for ${username}...`).start();
      
      const context = await client.context.getForUser(username, contextOptions);
      
      if (spinner) spinner.succeed(`Retrieved context for ${username}`);
      
      if (globalOptions.json) {
        console.log(JSON.stringify(context, null, 2));
      } else {
        const { formatUserContext } = await import('./src/utils/formatting.mjs');
        console.log(formatUserContext(context));
      }
    } catch (error) {
      if (spinner) spinner.fail(`Failed to retrieve context for ${username}`);
      handleError(error, program.opts());
    }
  });

/**
 * Test authentication command
 */
program
  .command('auth-test')
  .description('Test authentication and show rate limit information')
  .action(async () => {
    try {
      const globalOptions = program.opts();
      const client = createClient(globalOptions);
      
      const spinner = globalOptions.quiet ? null : ora('Testing authentication...').start();
      
      const rateLimit = await client.testAuth();
      
      if (spinner) spinner.succeed('Authentication successful!');
      
      if (globalOptions.json) {
        console.log(JSON.stringify(rateLimit, null, 2));
      } else {
        console.log(formatSuccess('Authentication successful!'));
        console.log(formatInfo('Rate limit information:'));
        console.log(`  Core: ${rateLimit.resources.core.remaining}/${rateLimit.resources.core.limit}`);
        console.log(`  Search: ${rateLimit.resources.search.remaining}/${rateLimit.resources.search.limit}`);
        console.log(`  Reset: ${new Date(rateLimit.resources.core.reset * 1000).toLocaleString()}`);
      }
    } catch (error) {
      if (spinner) spinner.fail('Authentication failed');
      handleError(error, program.opts());
    }
  });

/**
 * Parse and execute
 */
program.parse();