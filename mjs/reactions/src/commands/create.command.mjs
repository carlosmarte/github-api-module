/**
 * Create reaction command
 * @module commands/create
 */

import { BaseCommand } from './base.command.mjs';
import { createClient } from '../bootstrap.mjs';

export class CreateCommand extends BaseCommand {
  constructor() {
    super('create', 'Create a reaction for a GitHub entity');
    
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
      .requiredOption('-r, --resource <type>', 'Resource type is required')
      .requiredOption('--content <type>', 'Reaction content is required');

    this.action(this.handleCreate);
  }

  async handleCreate(options) {
    const config = this.buildConfig(options);
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
    this.displayOutput(result, options.output);
  }
}