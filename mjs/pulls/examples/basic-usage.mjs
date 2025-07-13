#!/usr/bin/env node

/**
 * Basic usage examples for GitHub Pull Requests SDK
 */

import { createClient, PullRequestClient } from '../index.mjs';

// Configure your GitHub token
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const OWNER = 'octocat'; // Replace with your org/user
const REPO = 'Hello-World'; // Replace with your repo

async function main() {
  // Create client instance
  const client = createClient({
    auth: GITHUB_TOKEN,
    owner: OWNER,
    repo: REPO
  });

  console.log('GitHub Pull Requests SDK Examples\n');
  console.log('=====================================\n');

  try {
    // Example 1: List open pull requests
    console.log('1. Listing open pull requests...');
    const openPRs = await client.list({ state: 'open', per_page: 5 });
    console.log(`Found ${openPRs.length} open PRs:`);
    openPRs.forEach(pr => {
      console.log(`  #${pr.number}: ${pr.title} (by @${pr.user.login})`);
    });
    console.log();

    // Example 2: Get specific pull request details
    if (openPRs.length > 0) {
      const prNumber = openPRs[0].number;
      console.log(`2. Getting details for PR #${prNumber}...`);
      const pr = await client.get(prNumber);
      console.log(`  Title: ${pr.title}`);
      console.log(`  State: ${pr.state}`);
      console.log(`  Created: ${new Date(pr.created_at).toLocaleDateString()}`);
      console.log(`  Author: @${pr.user.login}`);
      console.log(`  Changes: +${pr.additions} -${pr.deletions}`);
      console.log();

      // Example 3: List files changed
      console.log(`3. Files changed in PR #${prNumber}:`);
      const files = await client.listFiles(prNumber);
      files.slice(0, 5).forEach(file => {
        console.log(`  ${file.status}: ${file.filename} (+${file.additions} -${file.deletions})`);
      });
      if (files.length > 5) {
        console.log(`  ... and ${files.length - 5} more files`);
      }
      console.log();

      // Example 4: List reviews
      console.log(`4. Reviews for PR #${prNumber}:`);
      const reviews = await client.listReviews(prNumber);
      if (reviews.length > 0) {
        reviews.forEach(review => {
          console.log(`  @${review.user.login}: ${review.state}`);
        });
      } else {
        console.log('  No reviews yet');
      }
      console.log();
    }

    // Example 5: Search for pull requests
    console.log('5. Searching for bug fix PRs...');
    const searchResults = await client.search(`repo:${OWNER}/${REPO} type:pr bug`, {
      sort: 'created',
      order: 'desc',
      per_page: 5
    });
    console.log(`Found ${searchResults.total_count} PRs matching "bug":`);
    searchResults.items.forEach(pr => {
      console.log(`  #${pr.number}: ${pr.title}`);
    });
    console.log();

    // Example 6: Pagination - iterate through all PRs
    console.log('6. Counting all pull requests (paginated)...');
    let count = 0;
    for await (const pr of client.listAll({ state: 'all' })) {
      count++;
      if (count <= 3) {
        console.log(`  PR #${pr.number}: ${pr.title}`);
      }
      // Stop after 20 for demo
      if (count >= 20) break;
    }
    console.log(`  Total counted: ${count} pull requests`);
    console.log();

    // Example 7: Creating a pull request (commented out to avoid creating real PRs)
    console.log('7. Example code to create a pull request:');
    console.log(`
    const newPR = await client.create({
      title: 'Add new feature',
      head: 'feature-branch',
      base: 'main',
      body: 'This PR adds a new feature...',
      draft: false
    });
    console.log(\`Created PR #\${newPR.number}: \${newPR.html_url}\`);
    `);
    console.log();

    // Example 8: Error handling
    console.log('8. Error handling example:');
    try {
      await client.get(999999); // Non-existent PR
    } catch (error) {
      console.log(`  Caught error: ${error.name} - ${error.message}`);
    }

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }

  console.log('\n✅ Examples completed successfully!');
}

// Run examples
main().catch(console.error);