/**
 * List reactions command
 * @module commands/list
 */

import { BaseCommand } from './base.command.mjs';
import { createClient } from '../bootstrap.mjs';

export class ListCommand extends BaseCommand {
  constructor() {
    super('list', 'List reactions for various GitHub entities');
    
    this.addCommonOptions();
    
    // Resource type options
    this.program
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
      .requiredOption('-r, --resource <type>', 'Resource type is required');

    this.action(this.handleList);
    
    return this.program;
  }

  async handleList(options) {
    const config = this.buildConfig(options);
    const client = await createClient(config);
    
    const paginationOptions = {
      ...this.parsePaginationOptions(options),
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
    
    this.displayOutput(result.data, options.output);
    
    if (options.output === 'table' && result.pagination) {
      console.log(`\nPage ${result.pagination.page} of ${result.pagination.totalPages || '?'}`);
      if (result.pagination.totalItems) {
        console.log(`Total items: ${result.pagination.totalItems}`);
      }
    }
  }
}