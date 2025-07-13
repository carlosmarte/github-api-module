#!/usr/bin/env node

/**
 * CLI entry point for GitHub Reactions API
 * @module cli
 */

import { Command } from 'commander';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import chalk from 'chalk';
import inquirer from 'inquirer';

import { createClient } from './bootstrap.mjs';
import { REACTION_CONTENT, RELEASE_REACTION_CONTENT } from './core/types.mjs';
import { ErrorHandler } from './core/errors.mjs';

// Load package.json
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(
  await readFile(join(__dirname, '../package.json'), 'utf-8')
);

const program = new Command();

program
  .name('github-reactions')
  .description('GitHub Reactions API CLI - Interact with reactions to various GitHub entities')
  .version(packageJson.version)
  .option('-v, --verbose', 'Enable verbose output')
  .option('--no-color', 'Disable colored output');

// Helper functions
function formatReactionEmoji(content) {
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

function displayTable(data) {
  if (!data || data.length === 0) {
    console.log(chalk.yellow('No data found'));
    return;
  }

  const reactions = data.map(item => ({
    ID: item.id,
    User: item.user?.login || 'N/A',
    Content: formatReactionEmoji(item.content),
    'Created At': new Date(item.created_at).toLocaleString()
  }));

  console.table(reactions);
}

function displayOutput(data, format = 'table') {
  if (format === 'json') {
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  if (Array.isArray(data)) {
    displayTable(data);
  } else {
    displayTable([data]);
  }
}

// List command
program
  .command('list')
  .description('List reactions for various GitHub entities')
  .option('-t, --token <token>', 'GitHub personal access token')
  .option('-o, --output <format>', 'Output format (json, table)', 'table')
  .option('--per-page <number>', 'Results per page (max 100)', '30')
  .option('--page <number>', 'Page number to fetch', '1')
  .option('--all-pages', 'Fetch all pages automatically')
  .option('--owner <owner>', 'Repository owner (for repo resources)')
  .option('--repo <repo>', 'Repository name (for repo resources)')
  .option('--org <org>', 'Organization name (for team resources)')
  .option('--team-slug <slug>', 'Team slug (for team resources)')
  .option('--issue-number <number>', 'Issue number')
  .option('--comment-id <id>', 'Comment ID')
  .option('--release-id <id>', 'Release ID')
  .option('--discussion-number <number>', 'Discussion number')
  .option('--comment-number <number>', 'Comment number (for team discussion comments)')
  .option('--content <type>', 'Filter by reaction type')
  .requiredOption('-r, --resource <type>', 'Resource type is required')
  .action(async (options) => {
    try {
      const config = {};
      if (options.token) config.token = options.token;
      if (options.verbose) config.logging = { level: 'debug' };

      const client = await createClient(config);
      
      const paginationOptions = {
        perPage: parseInt(options.perPage) || 30,
        page: parseInt(options.page) || 1,
        autoPage: Boolean(options.allPages),
        content: options.content
      };

      let result;
      
      switch (options.resource) {
        case 'issue':
          result = await client.listForIssue(
            options.owner,
            options.repo,
            parseInt(options.issueNumber),
            paginationOptions
          );
          break;
          
        case 'issue-comment':
          result = await client.listForIssueComment(
            options.owner,
            options.repo,
            parseInt(options.commentId),
            paginationOptions
          );
          break;
          
        case 'commit-comment':
          result = await client.listForCommitComment(
            options.owner,
            options.repo,
            parseInt(options.commentId),
            paginationOptions
          );
          break;
          
        case 'pr-comment':
          result = await client.listForPullRequestReviewComment(
            options.owner,
            options.repo,
            parseInt(options.commentId),
            paginationOptions
          );
          break;
          
        case 'release':
          result = await client.listForRelease(
            options.owner,
            options.repo,
            parseInt(options.releaseId),
            paginationOptions
          );
          break;
          
        case 'team-discussion':
          result = await client.listForTeamDiscussion(
            options.org,
            options.teamSlug,
            parseInt(options.discussionNumber),
            paginationOptions
          );
          break;
          
        case 'team-discussion-comment':
          result = await client.listForTeamDiscussionComment(
            options.org,
            options.teamSlug,
            parseInt(options.discussionNumber),
            parseInt(options.commentNumber),
            paginationOptions
          );
          break;
          
        default:
          throw new Error(`Unknown resource type: ${options.resource}`);
      }
      
      displayOutput(result.data, options.output);
      
      if (options.output === 'table' && result.pagination) {
        console.log(`\nPage ${result.pagination.page} of ${result.pagination.totalPages || '?'}`);
        if (result.pagination.totalItems) {
          console.log(`Total items: ${result.pagination.totalItems}`);
        }
      }
    } catch (error) {
      const handledError = ErrorHandler.handle(error);
      console.error(chalk.red(`Error: ${handledError.message}`));
      if (options.verbose) {
        console.error(chalk.gray(handledError.stack));
      }
      process.exit(1);
    }
  });

// Create command
program
  .command('create')
  .description('Create a reaction for a GitHub entity')
  .option('-t, --token <token>', 'GitHub personal access token')
  .option('-o, --output <format>', 'Output format (json, table)', 'table')
  .option('--owner <owner>', 'Repository owner (for repo resources)')
  .option('--repo <repo>', 'Repository name (for repo resources)')
  .option('--org <org>', 'Organization name (for team resources)')
  .option('--team-slug <slug>', 'Team slug (for team resources)')
  .option('--issue-number <number>', 'Issue number')
  .option('--comment-id <id>', 'Comment ID')
  .option('--release-id <id>', 'Release ID')
  .option('--discussion-number <number>', 'Discussion number')
  .option('--comment-number <number>', 'Comment number (for team discussion comments)')
  .requiredOption('-r, --resource <type>', 'Resource type is required')
  .requiredOption('--content <type>', 'Reaction content is required')
  .action(async (options) => {
    try {
      const config = {};
      if (options.token) config.token = options.token;
      if (options.verbose) config.logging = { level: 'debug' };

      const client = await createClient(config);
      
      let result;
      
      switch (options.resource) {
        case 'issue':
          result = await client.createForIssue(
            options.owner,
            options.repo,
            parseInt(options.issueNumber),
            { content: options.content }
          );
          break;
          
        case 'issue-comment':
          result = await client.createForIssueComment(
            options.owner,
            options.repo,
            parseInt(options.commentId),
            { content: options.content }
          );
          break;
          
        case 'commit-comment':
          result = await client.createForCommitComment(
            options.owner,
            options.repo,
            parseInt(options.commentId),
            { content: options.content }
          );
          break;
          
        case 'pr-comment':
          result = await client.createForPullRequestReviewComment(
            options.owner,
            options.repo,
            parseInt(options.commentId),
            { content: options.content }
          );
          break;
          
        case 'release':
          result = await client.createForRelease(
            options.owner,
            options.repo,
            parseInt(options.releaseId),
            { content: options.content }
          );
          break;
          
        case 'team-discussion':
          result = await client.createForTeamDiscussion(
            options.org,
            options.teamSlug,
            parseInt(options.discussionNumber),
            { content: options.content }
          );
          break;
          
        case 'team-discussion-comment':
          result = await client.createForTeamDiscussionComment(
            options.org,
            options.teamSlug,
            parseInt(options.discussionNumber),
            parseInt(options.commentNumber),
            { content: options.content }
          );
          break;
          
        default:
          throw new Error(`Unknown resource type: ${options.resource}`);
      }
      
      console.log(`✅ Reaction created successfully!`);
      displayOutput(result, options.output);
    } catch (error) {
      const handledError = ErrorHandler.handle(error);
      console.error(chalk.red(`Error: ${handledError.message}`));
      if (options.verbose) {
        console.error(chalk.gray(handledError.stack));
      }
      process.exit(1);
    }
  });

// Delete command
program
  .command('delete')
  .description('Delete a reaction from a GitHub entity')
  .option('-t, --token <token>', 'GitHub personal access token')
  .option('--owner <owner>', 'Repository owner (for repo resources)')
  .option('--repo <repo>', 'Repository name (for repo resources)')
  .option('--org <org>', 'Organization name (for team resources)')
  .option('--team-slug <slug>', 'Team slug (for team resources)')
  .option('--issue-number <number>', 'Issue number')
  .option('--comment-id <id>', 'Comment ID')
  .option('--release-id <id>', 'Release ID')
  .option('--discussion-number <number>', 'Discussion number')
  .option('--comment-number <number>', 'Comment number (for team discussion comments)')
  .requiredOption('-r, --resource <type>', 'Resource type is required')
  .requiredOption('--reaction-id <id>', 'Reaction ID is required')
  .action(async (options) => {
    try {
      const config = {};
      if (options.token) config.token = options.token;
      if (options.verbose) config.logging = { level: 'debug' };

      const client = await createClient(config);
      
      switch (options.resource) {
        case 'issue':
          await client.deleteForIssue(
            options.owner,
            options.repo,
            parseInt(options.issueNumber),
            parseInt(options.reactionId)
          );
          break;
          
        case 'issue-comment':
          await client.deleteForIssueComment(
            options.owner,
            options.repo,
            parseInt(options.commentId),
            parseInt(options.reactionId)
          );
          break;
          
        case 'commit-comment':
          await client.deleteForCommitComment(
            options.owner,
            options.repo,
            parseInt(options.commentId),
            parseInt(options.reactionId)
          );
          break;
          
        case 'pr-comment':
          await client.deleteForPullRequestComment(
            options.owner,
            options.repo,
            parseInt(options.commentId),
            parseInt(options.reactionId)
          );
          break;
          
        case 'release':
          await client.deleteForRelease(
            options.owner,
            options.repo,
            parseInt(options.releaseId),
            parseInt(options.reactionId)
          );
          break;
          
        case 'team-discussion':
          await client.deleteForTeamDiscussion(
            options.org,
            options.teamSlug,
            parseInt(options.discussionNumber),
            parseInt(options.reactionId)
          );
          break;
          
        case 'team-discussion-comment':
          await client.deleteForTeamDiscussionComment(
            options.org,
            options.teamSlug,
            parseInt(options.discussionNumber),
            parseInt(options.commentNumber),
            parseInt(options.reactionId)
          );
          break;
          
        default:
          throw new Error(`Unknown resource type: ${options.resource}`);
      }
      
      console.log(`✅ Reaction deleted successfully!`);
    } catch (error) {
      const handledError = ErrorHandler.handle(error);
      console.error(chalk.red(`Error: ${handledError.message}`));
      if (options.verbose) {
        console.error(chalk.gray(handledError.stack));
      }
      process.exit(1);
    }
  });

// Examples command
program
  .command('examples')
  .description('Show usage examples')
  .action(() => {
    console.log(chalk.blue('📚 GitHub Reactions CLI - Usage Examples\n'));
    
    console.log(chalk.yellow('List reactions for an issue:'));
    console.log('  github-reactions list --resource issue --owner octocat --repo Hello-World --issue-number 1\n');
    
    console.log(chalk.yellow('Create a heart reaction for an issue:'));
    console.log('  github-reactions create --resource issue --owner octocat --repo Hello-World --issue-number 1 --content heart\n');
    
    console.log(chalk.yellow('List reactions for a commit comment:'));
    console.log('  github-reactions list --resource commit-comment --owner octocat --repo Hello-World --comment-id 12345\n');
    
    console.log(chalk.yellow('Delete a reaction:'));
    console.log('  github-reactions delete --resource issue --owner octocat --repo Hello-World --issue-number 1 --reaction-id 67890\n');
    
    console.log(chalk.green('💡 Pro tip: Set your GitHub token via the GITHUB_TOKEN environment variable'));
  });

// Parse command line arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}