#!/usr/bin/env node

/**
 * Pagination Examples for GitHub Activity SDK
 */

import { createClient } from '../src/index.mjs';

async function main() {
  const client = await createClient();

  console.log('GitHub Activity SDK - Pagination Examples\n');

  // Example 1: Manual pagination
  console.log('1. Manual Pagination - Fetching first 3 pages of events');
  try {
    for (let page = 1; page <= 3; page++) {
      const response = await client.events.listPublic({ 
        page, 
        per_page: 10 
      });
      
      console.log(`  Page ${page}: ${response.data.length} events`);
      
      // Check pagination info
      if (response.pagination) {
        console.log(`    Has next page: ${!!response.pagination.next}`);
      }
      
      // Stop if no more pages
      if (!response.pagination?.next) {
        console.log('  No more pages available');
        break;
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  }

  console.log('\n---\n');

  // Example 2: Using paginator with async iterator
  console.log('2. Using Paginator - Iterate through starred repos');
  try {
    const paginator = client.stars.getAuthStarredPaginator({ 
      per_page: 5 
    });
    
    let count = 0;
    const maxItems = 15;
    
    console.log(`  Fetching up to ${maxItems} starred repositories:`);
    for await (const repo of paginator) {
      count++;
      console.log(`    ${count}. ${repo.full_name}`);
      
      if (count >= maxItems) {
        console.log(`  Stopped after ${maxItems} items`);
        break;
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  }

  console.log('\n---\n');

  // Example 3: Fetch all items at once
  console.log('3. Fetch All - Get all notifications at once');
  try {
    const paginator = client.notifications.getPaginator({ 
      all: false, // unread only
      per_page: 50 
    });
    
    console.log('  Fetching all unread notifications...');
    const allNotifications = await paginator.fetchAll(100); // max 100 items
    
    console.log(`  Total notifications fetched: ${allNotifications.length}`);
    
    // Group by repository
    const byRepo = {};
    for (const notification of allNotifications) {
      const repo = notification.repository.full_name;
      byRepo[repo] = (byRepo[repo] || 0) + 1;
    }
    
    console.log('  Notifications by repository:');
    for (const [repo, count] of Object.entries(byRepo)) {
      console.log(`    ${repo}: ${count}`);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }

  console.log('\n---\n');

  // Example 4: Stream with pagination
  console.log('4. Streaming Pagination - Process events as they arrive');
  try {
    const paginator = client.events.getUserPaginator('github', {
      per_page: 20
    });
    
    let processed = 0;
    const maxProcess = 30;
    
    console.log(`  Processing up to ${maxProcess} events for user 'github':`);
    
    for await (const event of paginator) {
      processed++;
      
      // Process each event
      if (processed % 10 === 0) {
        console.log(`    Processed ${processed} events...`);
      }
      
      // Example: Count by event type
      if (processed === maxProcess) {
        console.log(`  Processed ${processed} events total`);
        break;
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  }

  console.log('\n---\n');

  // Example 5: Parallel pagination
  console.log('5. Parallel Pagination - Fetch multiple resources simultaneously');
  try {
    console.log('  Fetching multiple resources in parallel...');
    
    const [publicEvents, userEvents, notifications] = await Promise.all([
      client.events.listPublic({ per_page: 5 }),
      client.events.listForUser('octocat', { per_page: 5 }),
      client.notifications.list({ per_page: 5, all: true })
    ]);
    
    console.log(`  Results:`);
    console.log(`    Public events: ${publicEvents.data.length}`);
    console.log(`    User events: ${userEvents.data.length}`);
    console.log(`    Notifications: ${notifications.data.length}`);
  } catch (error) {
    console.error('Error:', error.message);
  }

  console.log('\n---\n');

  // Example 6: Custom pagination handler
  console.log('6. Custom Pagination - Build custom pagination logic');
  try {
    console.log('  Fetching repository watchers with custom logic:');
    
    async function* fetchAllWatchers(owner, repo, maxPages = 5) {
      let page = 1;
      let totalFetched = 0;
      
      while (page <= maxPages) {
        const response = await client.watching.listWatchers(owner, repo, {
          page,
          per_page: 30
        });
        
        if (response.data.length === 0) {
          break;
        }
        
        totalFetched += response.data.length;
        console.log(`    Page ${page}: ${response.data.length} watchers (total: ${totalFetched})`);
        
        for (const watcher of response.data) {
          yield watcher;
        }
        
        if (!response.pagination?.next) {
          break;
        }
        
        page++;
      }
    }
    
    // Use the custom paginator
    const watchers = [];
    for await (const watcher of fetchAllWatchers('facebook', 'react', 3)) {
      watchers.push(watcher.login);
      if (watchers.length >= 50) break;
    }
    
    console.log(`  Collected ${watchers.length} watcher usernames`);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run examples
main().catch(console.error);