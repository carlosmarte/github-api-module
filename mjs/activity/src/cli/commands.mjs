/**
 * CLI Command Definitions
 * @module cli/commands
 */

import { Command } from 'commander';
import ora from 'ora';
import inquirer from 'inquirer';
import {
  displayEvents,
  displayNotifications,
  displayStars,
  displayWatchers,
  displayFeeds,
  displaySuccess,
  displayError,
  displayInfo,
  formatOutput
} from './formatters.mjs';

/**
 * Setup all CLI commands
 * @param {Command} program - Commander program
 * @param {ActivityClient} client - Activity API client
 * @param {Object} globalOptions - Global CLI options
 */
export function setupCommands(program, client, globalOptions) {
  // Events commands
  setupEventsCommands(program, client, globalOptions);
  
  // Notifications commands
  setupNotificationsCommands(program, client, globalOptions);
  
  // Stars commands
  setupStarsCommands(program, client, globalOptions);
  
  // Watching commands
  setupWatchingCommands(program, client, globalOptions);
  
  // Feeds commands
  setupFeedsCommands(program, client, globalOptions);
  
  // Utility commands
  setupUtilityCommands(program, client, globalOptions);
}

/**
 * Setup events commands
 */
function setupEventsCommands(program, client, globalOptions) {
  const events = program
    .command('events')
    .description('Manage GitHub events');

  events
    .command('list')
    .description('List public events')
    .option('--page <number>', 'Page number', parseInt, 1)
    .option('--per-page <number>', 'Items per page', parseInt, 30)
    .option('--type <type>', 'Filter by event type')
    .action(async (options) => {
      const spinner = ora('Fetching public events...').start();
      try {
        const response = await client.events.listPublic(options);
        spinner.succeed('Events fetched successfully');
        
        let events = response.data;
        if (options.type) {
          events = client.events.filterByType(events, options.type);
        }
        
        displayEvents(events, globalOptions.output);
      } catch (error) {
        spinner.fail('Failed to fetch events');
        displayError(error);
      }
    });

  events
    .command('repo <owner> <repo>')
    .description('List repository events')
    .option('--page <number>', 'Page number', parseInt, 1)
    .option('--per-page <number>', 'Items per page', parseInt, 30)
    .action(async (owner, repo, options) => {
      const spinner = ora(`Fetching events for ${owner}/${repo}...`).start();
      try {
        const response = await client.events.listForRepo(owner, repo, options);
        spinner.succeed('Events fetched successfully');
        displayEvents(response.data, globalOptions.output);
      } catch (error) {
        spinner.fail('Failed to fetch events');
        displayError(error);
      }
    });

  events
    .command('user <username>')
    .description('List user events')
    .option('--public', 'Only public events')
    .option('--page <number>', 'Page number', parseInt, 1)
    .option('--per-page <number>', 'Items per page', parseInt, 30)
    .action(async (username, options) => {
      const spinner = ora(`Fetching events for ${username}...`).start();
      try {
        const response = options.public 
          ? await client.events.listPublicForUser(username, options)
          : await client.events.listForUser(username, options);
        spinner.succeed('Events fetched successfully');
        displayEvents(response.data, globalOptions.output);
      } catch (error) {
        spinner.fail('Failed to fetch events');
        displayError(error);
      }
    });

  events
    .command('org <org>')
    .description('List organization events')
    .option('--page <number>', 'Page number', parseInt, 1)
    .option('--per-page <number>', 'Items per page', parseInt, 30)
    .action(async (org, options) => {
      const spinner = ora(`Fetching events for ${org}...`).start();
      try {
        const response = await client.events.listForOrg(org, options);
        spinner.succeed('Events fetched successfully');
        displayEvents(response.data, globalOptions.output);
      } catch (error) {
        spinner.fail('Failed to fetch events');
        displayError(error);
      }
    });

  events
    .command('stream')
    .description('Stream public events in real-time')
    .option('--interval <ms>', 'Polling interval', parseInt, 60000)
    .option('--type <type>', 'Filter by event type')
    .action(async (options) => {
      console.log('Starting event stream... Press Ctrl+C to stop.');
      
      try {
        const stream = client.events.streamPublic({
          interval: options.interval,
          onEvent: (event) => {
            if (!options.type || event.type === options.type) {
              displayEvents([event], 'compact');
            }
          }
        });
        
        for await (const event of stream) {
          // Events are displayed via onEvent callback
        }
      } catch (error) {
        displayError(error);
      }
    });
}

/**
 * Setup notifications commands
 */
function setupNotificationsCommands(program, client, globalOptions) {
  const notifications = program
    .command('notifications')
    .alias('notif')
    .description('Manage GitHub notifications');

  notifications
    .command('list')
    .description('List notifications')
    .option('--all', 'Show all notifications (including read)')
    .option('--participating', 'Only participating notifications')
    .option('--since <date>', 'Show notifications since date')
    .option('--before <date>', 'Show notifications before date')
    .option('--page <number>', 'Page number', parseInt, 1)
    .option('--per-page <number>', 'Items per page', parseInt, 50)
    .action(async (options) => {
      const spinner = ora('Fetching notifications...').start();
      try {
        const response = await client.notifications.list(options);
        spinner.succeed(`Fetched ${response.data.length} notifications`);
        displayNotifications(response.data, globalOptions.output);
      } catch (error) {
        spinner.fail('Failed to fetch notifications');
        displayError(error);
      }
    });

  notifications
    .command('mark-read')
    .description('Mark all notifications as read')
    .option('--last-read-at <date>', 'Mark as read up to this date')
    .action(async (options) => {
      const confirm = await inquirer.prompt([{
        type: 'confirm',
        name: 'proceed',
        message: 'Mark all notifications as read?',
        default: false
      }]);
      
      if (!confirm.proceed) {
        displayInfo('Operation cancelled');
        return;
      }
      
      const spinner = ora('Marking notifications as read...').start();
      try {
        await client.notifications.markAsRead(options);
        spinner.succeed('All notifications marked as read');
      } catch (error) {
        spinner.fail('Failed to mark notifications as read');
        displayError(error);
      }
    });

  notifications
    .command('thread <id>')
    .description('Get notification thread details')
    .action(async (threadId) => {
      const spinner = ora(`Fetching thread ${threadId}...`).start();
      try {
        const thread = await client.notifications.getThread(threadId);
        spinner.succeed('Thread fetched successfully');
        formatOutput([thread], globalOptions.output);
      } catch (error) {
        spinner.fail('Failed to fetch thread');
        displayError(error);
      }
    });

  notifications
    .command('thread-read <id>')
    .description('Mark thread as read')
    .action(async (threadId) => {
      const spinner = ora(`Marking thread ${threadId} as read...`).start();
      try {
        await client.notifications.markThreadAsRead(threadId);
        spinner.succeed('Thread marked as read');
      } catch (error) {
        spinner.fail('Failed to mark thread as read');
        displayError(error);
      }
    });

  notifications
    .command('thread-done <id>')
    .description('Mark thread as done')
    .action(async (threadId) => {
      const spinner = ora(`Marking thread ${threadId} as done...`).start();
      try {
        await client.notifications.markThreadAsDone(threadId);
        spinner.succeed('Thread marked as done');
      } catch (error) {
        spinner.fail('Failed to mark thread as done');
        displayError(error);
      }
    });

  notifications
    .command('subscribe <id>')
    .description('Subscribe to thread')
    .option('--ignore', 'Ignore the thread')
    .action(async (threadId, options) => {
      const spinner = ora(`Updating subscription for thread ${threadId}...`).start();
      try {
        await client.notifications.setThreadSubscription(threadId, {
          ignored: options.ignore || false
        });
        spinner.succeed(options.ignore ? 'Thread ignored' : 'Subscribed to thread');
      } catch (error) {
        spinner.fail('Failed to update subscription');
        displayError(error);
      }
    });
}

/**
 * Setup stars commands
 */
function setupStarsCommands(program, client, globalOptions) {
  const stars = program
    .command('stars')
    .description('Manage repository stars');

  stars
    .command('list <owner> <repo>')
    .description('List stargazers for a repository')
    .option('--with-timestamps', 'Include star creation timestamps')
    .option('--page <number>', 'Page number', parseInt, 1)
    .option('--per-page <number>', 'Items per page', parseInt, 30)
    .action(async (owner, repo, options) => {
      const spinner = ora(`Fetching stargazers for ${owner}/${repo}...`).start();
      try {
        const response = await client.stars.listStargazers(owner, repo, options);
        spinner.succeed(`Fetched ${response.data.length} stargazers`);
        displayStars(response.data, globalOptions.output, options.withTimestamps);
      } catch (error) {
        spinner.fail('Failed to fetch stargazers');
        displayError(error);
      }
    });

  stars
    .command('user [username]')
    .description('List repositories starred by user')
    .option('--sort <field>', 'Sort by created or updated', 'created')
    .option('--direction <dir>', 'Sort direction (asc/desc)', 'desc')
    .option('--page <number>', 'Page number', parseInt, 1)
    .option('--per-page <number>', 'Items per page', parseInt, 30)
    .action(async (username, options) => {
      const spinner = ora('Fetching starred repositories...').start();
      try {
        const response = username
          ? await client.stars.listStarredByUser(username, options)
          : await client.stars.listStarredByAuthUser(options);
        spinner.succeed(`Fetched ${response.data.length} starred repositories`);
        formatOutput(response.data, globalOptions.output);
      } catch (error) {
        spinner.fail('Failed to fetch starred repositories');
        displayError(error);
      }
    });

  stars
    .command('check <owner> <repo>')
    .description('Check if repository is starred')
    .action(async (owner, repo) => {
      const spinner = ora(`Checking if ${owner}/${repo} is starred...`).start();
      try {
        const isStarred = await client.stars.checkIfStarred(owner, repo);
        spinner.stop();
        if (isStarred) {
          displaySuccess(`✨ ${owner}/${repo} is starred`);
        } else {
          displayInfo(`${owner}/${repo} is not starred`);
        }
      } catch (error) {
        spinner.fail('Failed to check star status');
        displayError(error);
      }
    });

  stars
    .command('add <owner> <repo>')
    .description('Star a repository')
    .action(async (owner, repo) => {
      const spinner = ora(`Starring ${owner}/${repo}...`).start();
      try {
        await client.stars.starRepo(owner, repo);
        spinner.succeed(`✨ Starred ${owner}/${repo}`);
      } catch (error) {
        spinner.fail('Failed to star repository');
        displayError(error);
      }
    });

  stars
    .command('remove <owner> <repo>')
    .description('Unstar a repository')
    .action(async (owner, repo) => {
      const spinner = ora(`Unstarring ${owner}/${repo}...`).start();
      try {
        await client.stars.unstarRepo(owner, repo);
        spinner.succeed(`Unstarred ${owner}/${repo}`);
      } catch (error) {
        spinner.fail('Failed to unstar repository');
        displayError(error);
      }
    });

  stars
    .command('stats <owner> <repo>')
    .description('Get star statistics for repository')
    .action(async (owner, repo) => {
      const spinner = ora(`Fetching star statistics for ${owner}/${repo}...`).start();
      try {
        const stats = await client.stars.getStarStatistics(owner, repo);
        spinner.succeed('Statistics fetched successfully');
        formatOutput(stats, globalOptions.output);
      } catch (error) {
        spinner.fail('Failed to fetch statistics');
        displayError(error);
      }
    });
}

/**
 * Setup watching commands
 */
function setupWatchingCommands(program, client, globalOptions) {
  const watch = program
    .command('watch')
    .description('Manage repository watching/subscriptions');

  watch
    .command('list <owner> <repo>')
    .description('List watchers for a repository')
    .option('--page <number>', 'Page number', parseInt, 1)
    .option('--per-page <number>', 'Items per page', parseInt, 30)
    .action(async (owner, repo, options) => {
      const spinner = ora(`Fetching watchers for ${owner}/${repo}...`).start();
      try {
        const response = await client.watching.listWatchers(owner, repo, options);
        spinner.succeed(`Fetched ${response.data.length} watchers`);
        displayWatchers(response.data, globalOptions.output);
      } catch (error) {
        spinner.fail('Failed to fetch watchers');
        displayError(error);
      }
    });

  watch
    .command('user [username]')
    .description('List repositories watched by user')
    .option('--page <number>', 'Page number', parseInt, 1)
    .option('--per-page <number>', 'Items per page', parseInt, 30)
    .action(async (username, options) => {
      const spinner = ora('Fetching watched repositories...').start();
      try {
        const response = username
          ? await client.watching.listWatchedByUser(username, options)
          : await client.watching.listWatchedByAuthUser(options);
        spinner.succeed(`Fetched ${response.data.length} watched repositories`);
        formatOutput(response.data, globalOptions.output);
      } catch (error) {
        spinner.fail('Failed to fetch watched repositories');
        displayError(error);
      }
    });

  watch
    .command('check <owner> <repo>')
    .description('Check repository subscription')
    .action(async (owner, repo) => {
      const spinner = ora(`Checking subscription for ${owner}/${repo}...`).start();
      try {
        const subscription = await client.watching.getRepoSubscription(owner, repo);
        spinner.stop();
        formatOutput(subscription, globalOptions.output);
      } catch (error) {
        spinner.fail('Failed to check subscription');
        displayError(error);
      }
    });

  watch
    .command('add <owner> <repo>')
    .description('Watch a repository')
    .action(async (owner, repo) => {
      const spinner = ora(`Watching ${owner}/${repo}...`).start();
      try {
        await client.watching.watchRepo(owner, repo);
        spinner.succeed(`👁️ Now watching ${owner}/${repo}`);
      } catch (error) {
        spinner.fail('Failed to watch repository');
        displayError(error);
      }
    });

  watch
    .command('remove <owner> <repo>')
    .description('Unwatch a repository')
    .action(async (owner, repo) => {
      const spinner = ora(`Unwatching ${owner}/${repo}...`).start();
      try {
        await client.watching.unwatchRepo(owner, repo);
        spinner.succeed(`Unwatched ${owner}/${repo}`);
      } catch (error) {
        spinner.fail('Failed to unwatch repository');
        displayError(error);
      }
    });

  watch
    .command('ignore <owner> <repo>')
    .description('Ignore a repository')
    .action(async (owner, repo) => {
      const spinner = ora(`Ignoring ${owner}/${repo}...`).start();
      try {
        await client.watching.ignoreRepo(owner, repo);
        spinner.succeed(`🔇 Ignoring ${owner}/${repo}`);
      } catch (error) {
        spinner.fail('Failed to ignore repository');
        displayError(error);
      }
    });
}

/**
 * Setup feeds commands
 */
function setupFeedsCommands(program, client, globalOptions) {
  const feeds = program
    .command('feeds')
    .description('Manage activity feeds');

  feeds
    .command('list')
    .description('List available feeds')
    .action(async () => {
      const spinner = ora('Fetching available feeds...').start();
      try {
        const availableFeeds = await client.feeds.getAllAvailableFeeds();
        spinner.succeed(`Found ${availableFeeds.length} available feeds`);
        displayFeeds(availableFeeds, globalOptions.output);
      } catch (error) {
        spinner.fail('Failed to fetch feeds');
        displayError(error);
      }
    });

  feeds
    .command('get')
    .description('Get all feed URLs')
    .action(async () => {
      const spinner = ora('Fetching feed URLs...').start();
      try {
        const feedData = await client.feeds.getFeeds();
        spinner.succeed('Feeds fetched successfully');
        formatOutput(feedData, globalOptions.output);
      } catch (error) {
        spinner.fail('Failed to fetch feeds');
        displayError(error);
      }
    });

  feeds
    .command('metadata')
    .description('Get feed metadata')
    .action(async () => {
      const spinner = ora('Fetching feed metadata...').start();
      try {
        const metadata = await client.feeds.getFeedMetadata();
        spinner.succeed('Metadata fetched successfully');
        formatOutput(metadata, globalOptions.output);
      } catch (error) {
        spinner.fail('Failed to fetch metadata');
        displayError(error);
      }
    });
}

/**
 * Setup utility commands
 */
function setupUtilityCommands(program, client, globalOptions) {
  program
    .command('rate-limit')
    .description('Check current rate limit status')
    .action(async () => {
      const spinner = ora('Checking rate limit...').start();
      try {
        const rateLimit = await client.getRateLimit();
        spinner.succeed('Rate limit fetched successfully');
        formatOutput(rateLimit, globalOptions.output);
      } catch (error) {
        spinner.fail('Failed to check rate limit');
        displayError(error);
      }
    });

  program
    .command('whoami')
    .description('Get authenticated user information')
    .action(async () => {
      const spinner = ora('Fetching user information...').start();
      try {
        const user = await client.getAuthenticatedUser();
        spinner.succeed(`Authenticated as ${user.login}`);
        formatOutput(user, globalOptions.output);
      } catch (error) {
        spinner.fail('Failed to fetch user information');
        displayError(error);
      }
    });

  program
    .command('meta')
    .description('Get API meta information')
    .action(async () => {
      const spinner = ora('Fetching API meta information...').start();
      try {
        const meta = await client.getMeta();
        spinner.succeed('Meta information fetched successfully');
        formatOutput(meta, globalOptions.output);
      } catch (error) {
        spinner.fail('Failed to fetch meta information');
        displayError(error);
      }
    });
}

export default { setupCommands };