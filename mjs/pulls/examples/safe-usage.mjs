#!/usr/bin/env node

import { createSafeClient, withErrorHandling, executeWithClient } from '../lib/safeClient.mjs';
import { AuthError, RateLimitError, ValidationError } from '../utils/errors.mjs';

/**
 * Example 1: Create client with authentication validation
 */
async function example1() {
  console.log('\n=== Example 1: Safe Client Creation ===\n');
  
  try {
    const client = await createSafeClient({
      owner: 'octocat',
      repo: 'Hello-World'
    });
    
    console.log('✅ Client created successfully');
    
    // Use the client
    const prs = await client.list({ state: 'open', per_page: 5 });
    console.log(`Found ${prs.length} open pull requests`);
    
  } catch (error) {
    if (error instanceof AuthError) {
      console.error('Authentication failed - please check your GitHub token');
      process.exit(1);
    }
    throw error;
  }
}

/**
 * Example 2: Using withErrorHandling wrapper
 */
async function example2() {
  console.log('\n=== Example 2: Error Handling Wrapper ===\n');
  
  const client = await createSafeClient({
    owner: 'nodejs',
    repo: 'node'
  });
  
  // Wrap operations with error handling
  const result = await withErrorHandling(
    async () => {
      const pr = await client.get(1);
      return pr;
    },
    'Fetch Pull Request #1'
  );
  
  if (result) {
    console.log(`✅ Fetched PR #${result.number}: ${result.title}`);
  }
}

/**
 * Example 3: Execute with client (all-in-one)
 */
async function example3() {
  console.log('\n=== Example 3: Execute with Client ===\n');
  
  const prs = await executeWithClient(
    async (client) => {
      return await client.list({ 
        state: 'closed', 
        per_page: 3 
      });
    },
    {
      owner: 'facebook',
      repo: 'react'
    }
  );
  
  console.log(`✅ Found ${prs.length} closed PRs`);
  prs.forEach(pr => {
    console.log(`  - #${pr.number}: ${pr.title}`);
  });
}

/**
 * Example 4: Comprehensive error handling
 */
async function example4() {
  console.log('\n=== Example 4: Comprehensive Error Handling ===\n');
  
  try {
    const client = await createSafeClient({
      owner: 'microsoft',
      repo: 'vscode',
      validateAuth: true // Explicitly validate auth
    });
    
    // Attempt various operations with specific error handling
    try {
      const pr = await client.get(99999999); // Non-existent PR
      console.log(`PR: ${pr.title}`);
    } catch (error) {
      if (error.status === 404) {
        console.log('⚠️  Pull request not found (expected)');
      } else {
        throw error;
      }
    }
    
    // Handle validation errors
    try {
      await client.create({
        title: '', // Invalid - empty title
        head: 'feature',
        base: 'main'
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        console.log('⚠️  Validation error caught (expected):', error.message);
      } else {
        throw error;
      }
    }
    
    // Handle rate limit errors
    try {
      // This would trigger if rate limit is exceeded
      await client.list({ per_page: 100 });
      console.log('✅ List operation succeeded');
    } catch (error) {
      if (error instanceof RateLimitError) {
        const resetTime = error.getTimeUntilReset();
        console.log(`⚠️  Rate limit exceeded. Resets in ${resetTime} seconds`);
      } else {
        throw error;
      }
    }
    
  } catch (error) {
    if (error instanceof AuthError) {
      console.error('\n❌ Authentication Error:');
      console.error(error.message);
      console.error('\nPlease ensure your GitHub token is valid and has the necessary permissions.');
      process.exit(1);
    }
    
    console.error('\n❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

/**
 * Run all examples
 */
async function runExamples() {
  try {
    await example1();
    await example2();
    await example3();
    await example4();
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ All examples completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Example failed:', error.message);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runExamples().catch(console.error);
}

export { example1, example2, example3, example4 };