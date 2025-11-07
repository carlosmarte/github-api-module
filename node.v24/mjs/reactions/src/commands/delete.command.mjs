/**
 * Delete reaction command
 * @module commands/delete
 */

import { BaseCommand } from './base.command.mjs';
import { createClient } from '../bootstrap.mjs';

export class DeleteCommand extends BaseCommand {
  constructor() {
    super('delete', 'Delete a reaction from a GitHub entity');
    
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
      .requiredOption('--reaction-id <id>', 'Reaction ID is required');

    this.action(this.handleDelete);
  }

  async handleDelete(options) {
    const config = this.buildConfig(options);
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
  }
}