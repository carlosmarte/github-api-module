#!/usr/bin/env node

/**
 * GitHub Issues CLI
 */

import { program } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { createClient } from './index.mjs';
import { loadConfig, resolveRepository, initConfig } from './lib/config.mjs';
import { getAuth } from './lib/auth.mjs';
import { formatOutput, formatError, formatSuccess } from './utils/format.mjs';

// Import commands
import listCommand from './commands/list.mjs';
import getCommand from './commands/get.mjs';
import createCommand from './commands/create.mjs';
import updateCommand from './commands/update.mjs';
import commentsCommand from './commands/comments.mjs';
import labelsCommand from './commands/labels.mjs';
import assigneesCommand from './commands/assignees.mjs';
import milestonesCommand from './commands/milestones.mjs';

// Version from package.json
const VERSION = '1.0.0';

// Configure program
program
  .name('gh-issues')
  .description('GitHub Issues CLI - Manage GitHub issues from the command line')
  .version(VERSION)
  .option('-r, --repo <owner/repo>', 'Repository (owner/repo format)')
  .option('-t, --token <token>', 'GitHub authentication token')
  .option('-o, --output <format>', 'Output format (json, table, text)', 'text')
  .option('--no-color', 'Disable colored output')
  .option('--config', 'Show configuration')
  .hook('preAction', (thisCommand) => {
    // Global pre-action hook
    if (thisCommand.opts().noColor) {
      chalk.level = 0;
    }
  });

// List issues command
program
  .command('list')
  .alias('ls')
  .description('List issues')
  .option('-s, --state <state>', 'Filter by state (open, closed, all)', 'open')
  .option('-l, --labels <labels>', 'Filter by labels (comma-separated)')
  .option('-a, --assignee <assignee>', 'Filter by assignee')
  .option('-c, --creator <creator>', 'Filter by creator')
  .option('-m, --milestone <milestone>', 'Filter by milestone')
  .option('--sort <field>', 'Sort by (created, updated, comments)', 'created')
  .option('--direction <dir>', 'Sort direction (asc, desc)', 'desc')
  .option('--limit <number>', 'Maximum number of results', parseInt)
  .option('--all', 'Fetch all pages')
  .option('--org <org>', 'List issues for organization')
  .action(async (options) => {
    await executeCommand(listCommand, options);
  });

// Get single issue
program
  .command('get <number>')
  .alias('show')
  .description('Get issue details')
  .option('--comments', 'Include comments')
  .option('--events', 'Include events')
  .option('--timeline', 'Include timeline')
  .action(async (number, options) => {
    await executeCommand(getCommand, { number: parseInt(number), ...options });
  });

// Create issue
program
  .command('create')
  .alias('new')
  .description('Create a new issue')
  .option('--title <title>', 'Issue title')
  .option('--body <body>', 'Issue description')
  .option('--labels <labels>', 'Labels (comma-separated)')
  .option('--assignees <assignees>', 'Assignees (comma-separated)')
  .option('--milestone <milestone>', 'Milestone number')
  .option('-i, --interactive', 'Interactive mode')
  .action(async (options) => {
    await executeCommand(createCommand, options);
  });

// Update issue
program
  .command('update <number>')
  .alias('edit')
  .description('Update an issue')
  .option('--title <title>', 'New title')
  .option('--body <body>', 'New description')
  .option('--state <state>', 'State (open, closed)')
  .option('--labels <labels>', 'Replace labels (comma-separated)')
  .option('--milestone <milestone>', 'Milestone number')
  .action(async (number, options) => {
    await executeCommand(updateCommand, { number: parseInt(number), ...options });
  });

// Close issue
program
  .command('close <number>')
  .description('Close an issue')
  .option('--reason <reason>', 'Close reason (completed, not_planned, duplicate)', 'completed')
  .action(async (number, options) => {
    const client = await getConfiguredClient(program.opts());
    const spinner = ora('Closing issue...').start();
    
    try {
      const issue = await client.update(parseInt(number), {
        state: 'closed',
        state_reason: options.reason
      });
      spinner.succeed(formatSuccess(`Issue #${issue.number} closed`));
      console.log(formatOutput(issue, program.opts()));
    } catch (error) {
      spinner.fail();
      console.error(formatError(error));
      process.exit(1);
    }
  });

// Reopen issue
program
  .command('reopen <number>')
  .description('Reopen an issue')
  .action(async (number) => {
    const client = await getConfiguredClient(program.opts());
    const spinner = ora('Reopening issue...').start();
    
    try {
      const issue = await client.update(parseInt(number), {
        state: 'open',
        state_reason: 'reopened'
      });
      spinner.succeed(formatSuccess(`Issue #${issue.number} reopened`));
      console.log(formatOutput(issue, program.opts()));
    } catch (error) {
      spinner.fail();
      console.error(formatError(error));
      process.exit(1);
    }
  });

// Lock issue
program
  .command('lock <number>')
  .description('Lock an issue')
  .option('--reason <reason>', 'Lock reason (off-topic, too heated, resolved, spam)')
  .action(async (number, options) => {
    const client = await getConfiguredClient(program.opts());
    const spinner = ora('Locking issue...').start();
    
    try {
      await client.lock(parseInt(number), options.reason);
      spinner.succeed(formatSuccess(`Issue #${number} locked`));
    } catch (error) {
      spinner.fail();
      console.error(formatError(error));
      process.exit(1);
    }
  });

// Unlock issue
program
  .command('unlock <number>')
  .description('Unlock an issue')
  .action(async (number) => {
    const client = await getConfiguredClient(program.opts());
    const spinner = ora('Unlocking issue...').start();
    
    try {
      await client.unlock(parseInt(number));
      spinner.succeed(formatSuccess(`Issue #${number} unlocked`));
    } catch (error) {
      spinner.fail();
      console.error(formatError(error));
      process.exit(1);
    }
  });

// Comments subcommands
program
  .command('comments <action>')
  .alias('comment')
  .description('Manage issue comments (list, add, edit, delete)')
  .option('-n, --number <number>', 'Issue number', parseInt)
  .option('-c, --comment <id>', 'Comment ID', parseInt)
  .option('-b, --body <body>', 'Comment body')
  .option('--since <date>', 'List comments since date')
  .action(async (action, options) => {
    await executeCommand(commentsCommand, { action, ...options });
  });

// Labels subcommands
program
  .command('labels <action>')
  .alias('label')
  .description('Manage issue labels (list, add, remove, set)')
  .option('-n, --number <number>', 'Issue number', parseInt)
  .option('-l, --labels <labels>', 'Labels (comma-separated)')
  .option('--name <name>', 'Label name')
  .option('--color <color>', 'Label color (hex without #)')
  .option('--description <description>', 'Label description')
  .action(async (action, options) => {
    await executeCommand(labelsCommand, { action, ...options });
  });

// Assignees subcommands
program
  .command('assignees <action>')
  .alias('assign')
  .description('Manage issue assignees (list, add, remove)')
  .option('-n, --number <number>', 'Issue number', parseInt)
  .option('-a, --assignees <assignees>', 'Assignees (comma-separated)')
  .action(async (action, options) => {
    await executeCommand(assigneesCommand, { action, ...options });
  });

// Milestones subcommands
program
  .command('milestones <action>')
  .alias('milestone')
  .description('Manage milestones (list, create, update, delete)')
  .option('-n, --number <number>', 'Milestone number', parseInt)
  .option('--title <title>', 'Milestone title')
  .option('--description <description>', 'Milestone description')
  .option('--due <date>', 'Due date (YYYY-MM-DD)')
  .option('--state <state>', 'State (open, closed)')
  .action(async (action, options) => {
    await executeCommand(milestonesCommand, { action, ...options });
  });

// Search issues
program
  .command('search <query>')
  .description('Search issues')
  .option('--in <fields>', 'Search in (title, body, comments)', 'title,body')
  .option('--author <user>', 'Filter by author')
  .option('--mentions <user>', 'Filter by mentions')
  .option('--team <team>', 'Filter by team')
  .option('--sort <field>', 'Sort by (comments, reactions, interactions, created, updated)')
  .option('--order <dir>', 'Sort order (asc, desc)', 'desc')
  .option('--limit <number>', 'Maximum results', parseInt)
  .action(async (query, options) => {
    const spinner = ora('Searching issues...').start();
    
    try {
      // Build search query
      let searchQuery = query;
      const globalOpts = program.opts();
      
      if (globalOpts.repo) {
        const [owner, repo] = globalOpts.repo.split('/');
        searchQuery = `repo:${owner}/${repo} ${searchQuery}`;
      }
      
      if (options.author) searchQuery += ` author:${options.author}`;
      if (options.mentions) searchQuery += ` mentions:${options.mentions}`;
      if (options.team) searchQuery += ` team:${options.team}`;
      
      // Search using GitHub search API
      const response = await fetch(
        `https://api.github.com/search/issues?q=${encodeURIComponent(searchQuery)}&sort=${options.sort || ''}&order=${options.order}`,
        {
          headers: {
            'Authorization': `token ${getAuth()}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );
      
      const data = await response.json();
      spinner.succeed(`Found ${data.total_count} results`);
      
      const items = options.limit ? data.items.slice(0, options.limit) : data.items;
      console.log(formatOutput(items, globalOpts));
    } catch (error) {
      spinner.fail();
      console.error(formatError(error));
      process.exit(1);
    }
  });

// Initialize config
program
  .command('init')
  .description('Initialize configuration file')
  .action(async () => {
    try {
      await initConfig();
      console.log(formatSuccess('Configuration initialized'));
    } catch (error) {
      console.error(formatError(error));
      process.exit(1);
    }
  });

// Helper function to execute commands
async function executeCommand(commandModule, options) {
  try {
    const globalOptions = program.opts();
    const client = await getConfiguredClient(globalOptions);
    const config = await loadConfig();
    
    await commandModule.execute(client, {
      ...config,
      ...globalOptions,
      ...options
    });
  } catch (error) {
    console.error(formatError(error));
    process.exit(1);
  }
}

// Helper function to get configured client
async function getConfiguredClient(options) {
  const config = await loadConfig();
  let repoInfo = {};
  
  try {
    repoInfo = await resolveRepository(options);
  } catch (error) {
    // Repository might not be needed for some commands
  }
  
  return createClient({
    auth: options.token || getAuth(),
    ...repoInfo,
    ...config,
    ...options
  });
}

// Parse arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}