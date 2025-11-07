/**
 * Basic usage examples for GitHub Reactions API SDK
 */

import { createClient, REACTION_CONTENT } from '../src/index.mjs';

async function main() {
  try {
    // Create client with token from environment
    const client = await createClient({
      // token: 'your_github_token_here' // or set GITHUB_TOKEN env var
    });

    console.log('🎭 GitHub Reactions API - Basic Usage Examples\n');

    // Example repository and issue
    const owner = 'octocat';
    const repo = 'Hello-World';
    const issueNumber = 1;

    console.log(`Working with: ${owner}/${repo}#${issueNumber}\n`);

    // List existing reactions
    console.log('📋 Listing existing reactions...');
    const { data: reactions, pagination } = await client.listForIssue(owner, repo, issueNumber);
    
    if (reactions.length > 0) {
      reactions.forEach(reaction => {
        console.log(`  ${reaction.content} by ${reaction.user?.login || 'Unknown'} (ID: ${reaction.id})`);
      });
    } else {
      console.log('  No reactions found');
    }
    console.log(`  Page ${pagination.page} of ${pagination.totalPages || '?'}\n`);

    // Create a heart reaction
    console.log('❤️ Creating a heart reaction...');
    const heartReaction = await client.createForIssue(owner, repo, issueNumber, {
      content: REACTION_CONTENT.HEART
    });
    console.log(`  Created: ${heartReaction.content} (ID: ${heartReaction.id})\n`);

    // Create a thumbs up reaction
    console.log('👍 Creating a thumbs up reaction...');
    const thumbsUpReaction = await client.createForIssue(owner, repo, issueNumber, {
      content: REACTION_CONTENT.PLUS_ONE
    });
    console.log(`  Created: ${thumbsUpReaction.content} (ID: ${thumbsUpReaction.id})\n`);

    // List reactions with filtering
    console.log('🔍 Listing only heart reactions...');
    const { data: heartReactions } = await client.listForIssue(owner, repo, issueNumber, {
      content: REACTION_CONTENT.HEART
    });
    console.log(`  Found ${heartReactions.length} heart reactions\n`);

    // Delete the reactions we created
    console.log('🗑️ Cleaning up reactions...');
    await client.deleteForIssue(owner, repo, issueNumber, heartReaction.id);
    console.log(`  Deleted heart reaction (ID: ${heartReaction.id})`);
    
    await client.deleteForIssue(owner, repo, issueNumber, thumbsUpReaction.id);
    console.log(`  Deleted thumbs up reaction (ID: ${thumbsUpReaction.id})\n`);

    console.log('✅ Example completed successfully!');

  } catch (error) {
    if (error.code === 'CONFIGURATION_ERROR' && error.message.includes('GitHub token is required')) {
      console.error('❌ Error: GitHub token is required');
      console.log('\n💡 Set your token with:');
      console.log('   export GITHUB_TOKEN=your_github_token_here');
      console.log('   OR pass it directly to createClient({ token: "your_token" })');
    } else {
      console.error('❌ Error:', error.message);
      if (error.details) {
        console.error('   Details:', error.details);
      }
    }
    process.exit(1);
  }
}

main();