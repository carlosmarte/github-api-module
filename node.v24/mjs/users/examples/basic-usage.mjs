#!/usr/bin/env node

/**
 * @fileoverview Basic usage examples for GitHub Users API
 */

import { createClient, getUser, listUsers } from '../index.mjs';

// Example: Using the client
async function clientExample() {
  console.log('=== Client Example ===');
  
  try {
    // Create a client instance
    const client = createClient({
      token: process.env.GITHUB_TOKEN,
      rateLimiting: { enabled: true }
    });

    // Get authenticated user
    const me = await client.profile.getAuthenticated();
    console.log(`Authenticated as: ${me.login} (${me.name})`);

    // Get user emails
    const emails = await client.emails.list();
    console.log(`Email addresses: ${emails.length}`);
    emails.forEach(email => {
      console.log(`  ${email.email} - Primary: ${email.primary}, Verified: ${email.verified}`);
    });

    // Update profile
    const updated = await client.profile.updateAuthenticated({
      bio: 'Updated via GitHub Users API'
    });
    console.log(`Updated bio: ${updated.bio}`);

    // Clean up
    client.close();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Example: Using convenience functions
async function convenienceExample() {
  console.log('\n=== Convenience Functions Example ===');
  
  try {
    // Get a specific user
    const user = await getUser('octocat', {
      token: process.env.GITHUB_TOKEN
    });
    console.log(`User: ${user.login} (${user.name})`);
    console.log(`Followers: ${user.followers}, Following: ${user.following}`);
    console.log(`Public repos: ${user.public_repos}`);

    // List users
    const users = await listUsers({
      token: process.env.GITHUB_TOKEN,
      per_page: 10
    });
    console.log(`\nFirst ${users.length} users:`);
    users.forEach(u => console.log(`  ${u.login} (ID: ${u.id})`));
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Example: Discover users
async function discoveryExample() {
  console.log('\n=== User Discovery Example ===');
  
  try {
    const client = createClient({
      token: process.env.GITHUB_TOKEN
    });

    // Get user by username
    const user = await client.discovery.getByUsername('github');
    console.log(`Found user: ${user.login} (${user.type})`);

    // Get user statistics
    const stats = await client.discovery.getStats('octocat');
    console.log(`\nUser statistics for ${stats.username}:`);
    console.log(`  Account age: ${stats.accountAge} days`);
    console.log(`  Public repos: ${stats.publicRepos}`);
    console.log(`  Followers: ${stats.followers}`);
    console.log(`  Has bio: ${stats.hasBio}`);

    // Check if username exists
    const exists = await client.discovery.exists('nonexistentuser123456789');
    console.log(`\nUser 'nonexistentuser123456789' exists: ${exists}`);

    client.close();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Example: User context
async function contextExample() {
  console.log('\n=== User Context Example ===');
  
  try {
    const client = createClient({
      token: process.env.GITHUB_TOKEN
    });

    // Get basic context
    const context = await client.context.getForUser('octocat');
    console.log('Basic context for octocat:');
    if (context.contexts && context.contexts.length > 0) {
      context.contexts.forEach(ctx => {
        console.log(`  ${ctx.message}`);
      });
    } else {
      console.log('  No context available');
    }

    // Get context in relation to a repository (example)
    try {
      const repoContext = await client.context.getForUserInRepository('octocat', '1296269');
      console.log('\nRepository context:');
      if (repoContext.contexts) {
        repoContext.contexts.forEach(ctx => {
          console.log(`  ${ctx.message}`);
        });
      }
    } catch (error) {
      console.log('  Repository context not available or requires specific permissions');
    }

    client.close();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Example: Email management
async function emailExample() {
  console.log('\n=== Email Management Example ===');
  
  try {
    const client = createClient({
      token: process.env.GITHUB_TOKEN
    });

    // List all emails
    const emails = await client.emails.list();
    console.log(`Total emails: ${emails.length}`);

    // Get primary email
    const primary = await client.emails.getPrimary();
    if (primary) {
      console.log(`Primary email: ${primary.email}`);
    }

    // Get verified emails
    const verified = await client.emails.getVerified();
    console.log(`Verified emails: ${verified.length}`);

    // Get email statistics
    const stats = await client.emails.getStats();
    console.log('\nEmail statistics:');
    console.log(`  Total: ${stats.total}`);
    console.log(`  Verified: ${stats.verified}`);
    console.log(`  Unverified: ${stats.unverified}`);
    console.log(`  Public: ${stats.public}`);
    console.log(`  Private: ${stats.private}`);

    client.close();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Example: Error handling
async function errorHandlingExample() {
  console.log('\n=== Error Handling Example ===');
  
  try {
    const client = createClient({
      token: 'invalid-token'
    });

    await client.profile.getAuthenticated();
  } catch (error) {
    console.log(`Caught ${error.constructor.name}: ${error.message}`);
    
    if (error.status) {
      console.log(`HTTP Status: ${error.status}`);
    }
    
    if (error.response) {
      console.log('Response details available');
    }
  }

  // Try to get non-existent user
  try {
    const client = createClient({
      token: process.env.GITHUB_TOKEN
    });

    await client.discovery.getByUsername('this-user-definitely-does-not-exist-12345');
  } catch (error) {
    console.log(`Caught ${error.constructor.name}: ${error.message}`);
  }
}

// Run examples
async function runExamples() {
  if (!process.env.GITHUB_TOKEN) {
    console.error('Please set GITHUB_TOKEN environment variable');
    process.exit(1);
  }

  await clientExample();
  await convenienceExample();
  await discoveryExample();
  await contextExample();
  await emailExample();
  await errorHandlingExample();
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runExamples().catch(console.error);
}