#!/usr/bin/env node

/**
 * Basic Usage Examples for GitHub Activity SDK
 */

import { createClient } from '../src/index.mjs';

async function main() {
  // Create client (will use GITHUB_TOKEN from environment)
  const client = await createClient();

  console.log('GitHub Activity SDK - Basic Usage Examples\n');

  // Example 1: List public events
  console.log('1. Fetching public events...');
  try {
    const eventsResponse = await client.events.listPublic({ per_page: 5 });
    console.log(`Found ${eventsResponse.data.length} public events`);
    
    for (const event of eventsResponse.data) {
      console.log(`  - ${event.type} by ${event.actor.login} in ${event.repo.name}`);
    }
  } catch (error) {
    console.error('Error fetching events:', error.message);
  }

  console.log('\n---\n');

  // Example 2: Check notifications
  console.log('2. Checking notifications...');
  try {
    const notifications = await client.notifications.list({ all: false });
    console.log(`You have ${notifications.data.length} unread notifications`);
    
    for (const notification of notifications.data.slice(0, 3)) {
      console.log(`  - ${notification.subject.type}: ${notification.subject.title}`);
      console.log(`    Repository: ${notification.repository.full_name}`);
      console.log(`    Reason: ${notification.reason}`);
    }
  } catch (error) {
    console.error('Error fetching notifications:', error.message);
  }

  console.log('\n---\n');

  // Example 3: List starred repositories
  console.log('3. Listing your starred repositories...');
  try {
    const starred = await client.stars.listStarredByAuthUser({ per_page: 5 });
    console.log(`You have starred ${starred.data.length} repositories (showing first 5)`);
    
    for (const repo of starred.data) {
      console.log(`  - ${repo.full_name} (★ ${repo.stargazers_count})`);
      if (repo.description) {
        console.log(`    ${repo.description.substring(0, 60)}...`);
      }
    }
  } catch (error) {
    console.error('Error fetching starred repos:', error.message);
  }

  console.log('\n---\n');

  // Example 4: Get available feeds
  console.log('4. Getting available feeds...');
  try {
    const feeds = await client.feeds.getAllAvailableFeeds();
    console.log(`Found ${feeds.length} available feeds:`);
    
    for (const feed of feeds) {
      console.log(`  - ${feed.name} (${feed.type})`);
      console.log(`    Public: ${feed.public ? 'Yes' : 'No'}`);
    }
  } catch (error) {
    console.error('Error fetching feeds:', error.message);
  }

  console.log('\n---\n');

  // Example 5: Check rate limit
  console.log('5. Checking rate limit...');
  try {
    const rateLimit = await client.getRateLimit();
    const core = rateLimit.resources.core;
    const percentUsed = ((core.limit - core.remaining) / core.limit * 100).toFixed(1);
    
    console.log(`Rate Limit Status:`);
    console.log(`  Remaining: ${core.remaining}/${core.limit} (${percentUsed}% used)`);
    console.log(`  Resets at: ${new Date(core.reset * 1000).toLocaleString()}`);
  } catch (error) {
    console.error('Error checking rate limit:', error.message);
  }

  console.log('\n---\n');

  // Example 6: Get authenticated user
  console.log('6. Getting authenticated user info...');
  try {
    const user = await client.getAuthenticatedUser();
    console.log(`Authenticated as: ${user.login}`);
    console.log(`  Name: ${user.name || 'Not set'}`);
    console.log(`  Public repos: ${user.public_repos}`);
    console.log(`  Followers: ${user.followers}`);
    console.log(`  Following: ${user.following}`);
  } catch (error) {
    console.error('Error getting user info:', error.message);
  }
}

// Run examples
main().catch(console.error);