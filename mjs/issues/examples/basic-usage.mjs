#!/usr/bin/env node

/**
 * Basic usage examples for GitHub Issues SDK
 */

import { createClient } from '../index.mjs';

// Get authentication from environment
const auth = process.env.GITHUB_TOKEN;
if (!auth) {
  console.error('Please set GITHUB_TOKEN environment variable');
  process.exit(1);
}

// Repository to work with
const owner = 'octocat';
const repo = 'hello-world';

async function main() {
  // Create a client instance
  const client = createClient({
    auth,
    owner,
    repo
  });

  console.log(`Working with ${owner}/${repo}\n`);

  try {
    // 1. List open issues
    console.log('📋 Listing open issues...');
    const openIssues = await client.listForRepo({
      state: 'open',
      per_page: 5
    });
    
    console.log(`Found ${openIssues.length} open issues:`);
    openIssues.forEach(issue => {
      console.log(`  #${issue.number} - ${issue.title}`);
    });

    // 2. Create a new issue
    console.log('\n✨ Creating a new issue...');
    const newIssue = await client.create({
      title: 'Test issue from SDK',
      body: 'This is a test issue created using the GitHub Issues SDK.\n\n- Item 1\n- Item 2\n- Item 3',
      labels: ['documentation', 'good first issue']
    });
    
    console.log(`Created issue #${newIssue.number}: ${newIssue.title}`);
    console.log(`URL: ${newIssue.html_url}`);

    // 3. Add a comment to the issue
    console.log('\n💬 Adding a comment...');
    const comment = await client.createComment(
      newIssue.number,
      'This is an automated comment added via the SDK!'
    );
    
    console.log(`Added comment #${comment.id}`);

    // 4. Add labels to the issue
    console.log('\n🏷️  Adding more labels...');
    const labels = await client.addLabels(newIssue.number, ['help wanted']);
    console.log(`Issue now has ${labels.length} labels:`, labels.map(l => l.name).join(', '));

    // 5. Update the issue
    console.log('\n📝 Updating the issue...');
    const updatedIssue = await client.update(newIssue.number, {
      title: newIssue.title + ' (Updated)',
      body: newIssue.body + '\n\n**Update:** This issue has been modified.'
    });
    
    console.log(`Updated issue title: ${updatedIssue.title}`);

    // 6. List comments on the issue
    console.log('\n💬 Listing comments...');
    const comments = await client.listComments(newIssue.number);
    console.log(`Found ${comments.length} comments:`);
    comments.forEach(comment => {
      console.log(`  @${comment.user.login}: ${comment.body.substring(0, 50)}...`);
    });

    // 7. Get issue details
    console.log('\n🔍 Getting issue details...');
    const issueDetails = await client.get(newIssue.number);
    console.log('Issue details:');
    console.log(`  Number: #${issueDetails.number}`);
    console.log(`  Title: ${issueDetails.title}`);
    console.log(`  State: ${issueDetails.state}`);
    console.log(`  Comments: ${issueDetails.comments}`);
    console.log(`  Created: ${new Date(issueDetails.created_at).toLocaleDateString()}`);
    console.log(`  Updated: ${new Date(issueDetails.updated_at).toLocaleDateString()}`);

    // 8. Search for issues
    console.log('\n🔍 Searching for issues with "bug" label...');
    const bugIssues = await client.listForRepo({
      labels: 'bug',
      state: 'all',
      per_page: 5
    });
    
    console.log(`Found ${bugIssues.length} issues with "bug" label:`);
    bugIssues.forEach(issue => {
      console.log(`  #${issue.number} - ${issue.title} (${issue.state})`);
    });

    // 9. Close the issue
    console.log('\n🔒 Closing the issue...');
    const closedIssue = await client.update(newIssue.number, {
      state: 'closed',
      state_reason: 'completed'
    });
    
    console.log(`Issue #${closedIssue.number} is now ${closedIssue.state}`);

    // 10. Reopen the issue
    console.log('\n🔓 Reopening the issue...');
    const reopenedIssue = await client.update(newIssue.number, {
      state: 'open'
    });
    
    console.log(`Issue #${reopenedIssue.number} is now ${reopenedIssue.state}`);

    console.log('\n✅ All operations completed successfully!');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.details) {
      console.error('Details:', error.details);
    }
    process.exit(1);
  }
}

// Run the examples
main().catch(console.error);