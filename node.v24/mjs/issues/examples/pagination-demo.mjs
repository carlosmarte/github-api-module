#!/usr/bin/env node

/**
 * Pagination examples for GitHub Issues SDK
 */

import { createClient, paginate, collectAllPages } from '../index.mjs';

// Get authentication from environment
const auth = process.env.GITHUB_TOKEN;
if (!auth) {
  console.error('Please set GITHUB_TOKEN environment variable');
  process.exit(1);
}

// Repository to work with
const owner = process.argv[2]?.split('/')[0] || 'microsoft';
const repo = process.argv[2]?.split('/')[1] || 'vscode';

async function main() {
  const client = createClient({
    auth,
    owner,
    repo
  });

  console.log(`📚 Pagination Demo for ${owner}/${repo}\n`);

  try {
    // Example 1: Fetch a single page
    console.log('1️⃣ Fetching single page (first 10 issues)...');
    const firstPage = await client.listForRepo({
      state: 'open',
      per_page: 10,
      page: 1
    });
    
    console.log(`Got ${firstPage.length} issues from first page:`);
    firstPage.slice(0, 3).forEach(issue => {
      console.log(`  #${issue.number} - ${issue.title.substring(0, 50)}...`);
    });
    console.log('  ...\n');

    // Example 2: Fetch with pagination info
    console.log('2️⃣ Fetching with pagination metadata...');
    const paginatedResponse = await client.listForRepo({
      state: 'open',
      per_page: 10,
      page: 1,
      includePagination: true
    });
    
    console.log('Pagination info:');
    console.log(`  Current page: ${paginatedResponse.pagination.page}`);
    console.log(`  Items per page: ${paginatedResponse.pagination.per_page}`);
    console.log(`  Has next page: ${paginatedResponse.pagination.hasNext}`);
    console.log(`  Has previous page: ${paginatedResponse.pagination.hasPrev}`);
    if (paginatedResponse.pagination.lastPage) {
      console.log(`  Total pages: ${paginatedResponse.pagination.lastPage}`);
    }
    console.log();

    // Example 3: Use async generator to iterate through pages
    console.log('3️⃣ Iterating through pages with async generator...');
    console.log('(Fetching first 30 issues across multiple pages)');
    
    let count = 0;
    const maxItems = 30;
    
    for await (const issue of paginate(
      (opts) => client.listForRepo({ ...opts, includePagination: true }),
      { state: 'open', per_page: 10 }
    )) {
      if (count % 10 === 0) {
        console.log(`\nPage ${Math.floor(count / 10) + 1}:`);
      }
      console.log(`  #${issue.number} - ${issue.title.substring(0, 40)}...`);
      
      count++;
      if (count >= maxItems) break;
    }
    
    console.log(`\nFetched ${count} issues total\n`);

    // Example 4: Collect all pages into array
    console.log('4️⃣ Collecting multiple pages into array...');
    console.log('(Collecting issues with "bug" label)');
    
    const allBugIssues = await collectAllPages(
      (opts) => client.listForRepo({ ...opts, includePagination: true }),
      { 
        state: 'all',
        labels: 'bug',
        per_page: 20
      },
      50  // Maximum 50 items
    );
    
    console.log(`Collected ${allBugIssues.length} issues with "bug" label:`);
    allBugIssues.slice(0, 5).forEach((issue, i) => {
      console.log(`  ${i + 1}. #${issue.number} - ${issue.title.substring(0, 40)}... (${issue.state})`);
    });
    if (allBugIssues.length > 5) {
      console.log(`  ... and ${allBugIssues.length - 5} more\n`);
    }

    // Example 5: Manual pagination control
    console.log('5️⃣ Manual pagination control...');
    let page = 1;
    let hasMore = true;
    let totalFetched = 0;
    
    while (hasMore && page <= 3) {
      const response = await client.listForRepo({
        state: 'closed',
        per_page: 15,
        page: page,
        includePagination: true
      });
      
      console.log(`Page ${page}: Fetched ${response.data.length} closed issues`);
      totalFetched += response.data.length;
      
      hasMore = response.pagination.hasNext;
      page++;
    }
    
    console.log(`Total closed issues fetched: ${totalFetched}`);
    if (hasMore) {
      console.log('(More pages available but stopped at page 3)\n');
    }

    // Example 6: Search with pagination
    console.log('6️⃣ Paginating through comments...');
    
    // First, find an issue with comments
    const issuesWithComments = await client.listForRepo({
      state: 'all',
      sort: 'comments',
      direction: 'desc',
      per_page: 1
    });
    
    if (issuesWithComments.length > 0 && issuesWithComments[0].comments > 0) {
      const issueNumber = issuesWithComments[0].number;
      console.log(`Issue #${issueNumber} has ${issuesWithComments[0].comments} comments`);
      
      // Paginate through comments
      const comments = await collectAllPages(
        (opts) => client.listComments(issueNumber, { ...opts, includePagination: true }),
        { per_page: 10 },
        20  // Max 20 comments
      );
      
      console.log(`Fetched ${comments.length} comments:`);
      comments.slice(0, 3).forEach((comment, i) => {
        const preview = comment.body.substring(0, 50).replace(/\n/g, ' ');
        console.log(`  ${i + 1}. @${comment.user.login}: ${preview}...`);
      });
      if (comments.length > 3) {
        console.log(`  ... and ${comments.length - 3} more`);
      }
    } else {
      console.log('No issues with comments found');
    }

    console.log('\n✅ Pagination examples completed!');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    
    // Handle rate limiting specifically
    if (error.name === 'RateLimitError') {
      console.error(`Rate limit will reset at: ${error.resetDate}`);
      console.error(`Minutes until reset: ${error.minutesUntilReset}`);
    }
    
    process.exit(1);
  }
}

// Show usage
if (process.argv.includes('--help')) {
  console.log('Usage: node pagination-demo.mjs [owner/repo]');
  console.log('Example: node pagination-demo.mjs facebook/react');
  console.log('\nDefault: microsoft/vscode');
  process.exit(0);
}

// Run the examples
main().catch(console.error);