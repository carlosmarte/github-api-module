#!/usr/bin/env node

import GistAPI from '../index.mjs';
import { config } from 'dotenv';

// Load environment variables
config();

// Initialize the client
const client = new GistAPI({
  token: process.env.GITHUB_TOKEN
});

async function main() {
  try {
    console.log('GitHub Gist API SDK Examples\n');
    console.log('================================\n');
    
    // Example 1: List gists
    console.log('1. Listing your gists...');
    const myGists = await client.gists.list({ per_page: 5 });
    console.log(`Found ${myGists.length} gists`);
    myGists.forEach(gist => {
      console.log(`  - ${gist.id}: ${gist.description || '(no description)'}`);
    });
    console.log();
    
    // Example 2: Create a gist
    console.log('2. Creating a new gist...');
    const newGist = await client.gists.create({
      description: 'Test gist created via SDK',
      public: false,
      files: {
        'hello.js': { 
          content: 'console.log("Hello from GitHub Gist API!");' 
        },
        'readme.md': { 
          content: '# Test Gist\n\nThis is a test gist created using the SDK.' 
        }
      }
    });
    console.log(`Created gist: ${newGist.html_url}`);
    console.log(`Gist ID: ${newGist.id}`);
    console.log();
    
    // Example 3: Get gist details
    console.log('3. Getting gist details...');
    const gistDetails = await client.gists.get(newGist.id);
    console.log(`Description: ${gistDetails.description}`);
    console.log(`Files: ${Object.keys(gistDetails.files).join(', ')}`);
    console.log(`Public: ${gistDetails.public}`);
    console.log();
    
    // Example 4: Update the gist
    console.log('4. Updating the gist...');
    const updatedGist = await client.gists.update(newGist.id, {
      description: 'Updated: Test gist created via SDK',
      files: {
        'newfile.txt': { content: 'This is a new file added to the gist' },
        'hello.js': { content: 'console.log("Updated content!");' }
      }
    });
    console.log('Gist updated successfully');
    console.log(`New files: ${Object.keys(updatedGist.files).join(', ')}`);
    console.log();
    
    // Example 5: Add a comment
    console.log('5. Adding a comment...');
    const comment = await client.comments.create(newGist.id, {
      body: 'This is a test comment from the SDK!'
    });
    console.log(`Comment added with ID: ${comment.id}`);
    console.log();
    
    // Example 6: Star the gist
    console.log('6. Starring the gist...');
    await client.stars.add(newGist.id);
    const isStarred = await client.stars.check(newGist.id);
    console.log(`Gist starred: ${isStarred}`);
    console.log();
    
    // Example 7: Fork the gist
    console.log('7. Forking the gist...');
    const fork = await client.forks.create(newGist.id);
    console.log(`Fork created: ${fork.html_url}`);
    console.log();
    
    // Example 8: List commits
    console.log('8. Listing gist commits...');
    const commits = await client.commits.list(newGist.id);
    console.log(`Found ${commits.length} commits`);
    commits.forEach(commit => {
      const date = new Date(commit.committed_at).toLocaleDateString();
      console.log(`  - ${commit.version.substring(0, 7)} on ${date}`);
    });
    console.log();
    
    // Example 9: Pagination with async iterator
    console.log('9. Iterating through public gists...');
    let count = 0;
    for await (const gist of client.gists.iteratePublic()) {
      count++;
      console.log(`  ${count}. ${gist.id}: ${gist.description || '(no description)'}`);
      if (count >= 3) break; // Only show first 3
    }
    console.log();
    
    // Example 10: Clean up - delete the test gist
    console.log('10. Cleaning up (deleting test gist)...');
    await client.gists.delete(newGist.id);
    console.log('Test gist deleted');
    console.log();
    
    // Example 11: Error handling
    console.log('11. Error handling example...');
    try {
      await client.gists.get('nonexistent-gist-id');
    } catch (error) {
      console.log(`Caught expected error: ${error.name} - ${error.message}`);
    }
    console.log();
    
    // Example 12: Rate limit info
    console.log('12. Checking rate limit...');
    const rateLimit = await client.getRateLimit();
    console.log(`Rate limit: ${rateLimit.rate.remaining}/${rateLimit.rate.limit}`);
    const resetTime = new Date(rateLimit.rate.reset * 1000);
    console.log(`Resets at: ${resetTime.toLocaleString()}`);
    
    console.log('\n================================');
    console.log('Examples completed successfully!');
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.name === 'AuthenticationError') {
      console.error('Please set GITHUB_TOKEN environment variable');
    }
    process.exit(1);
  }
}

// Run the examples
main();