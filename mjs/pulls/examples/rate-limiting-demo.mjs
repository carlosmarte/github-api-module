#!/usr/bin/env node

import { RateLimitedPullRequestClient } from '../index.mjs';
import chalk from 'chalk';

/**
 * Demo script showing rate limiting functionality
 * 
 * Usage:
 *   node examples/rate-limiting-demo.mjs [owner] [repo]
 */

async function demo() {
  const owner = process.argv[2] || 'facebook';
  const repo = process.argv[3] || 'react';
  
  console.log(chalk.blue('🚀 Rate Limiting Demo\n'));
  console.log(chalk.gray(`Repository: ${owner}/${repo}\n`));
  
  // Create a rate-limited client
  const client = new RateLimitedPullRequestClient({
    owner,
    repo,
    enableRateLimiting: true // Explicitly enable rate limiting
  });
  
  try {
    // Check current rate limit status
    console.log(chalk.yellow('📊 Checking rate limit status...'));
    const status = await client.getRateLimitStatus();
    
    console.log(chalk.green('\n✅ Core API Rate Limits:'));
    console.log(`  Limit: ${status.core.limit} requests/hour`);
    console.log(`  Remaining: ${status.core.remaining} requests`);
    console.log(`  Used: ${status.core.used} requests`);
    console.log(`  Resets at: ${status.core.reset.toLocaleString()}`);
    
    console.log(chalk.green('\n✅ Search API Rate Limits:'));
    console.log(`  Limit: ${status.search.limit} requests/minute`);
    console.log(`  Remaining: ${status.search.remaining} requests`);
    console.log(`  Used: ${status.search.used} requests`);
    console.log(`  Resets at: ${status.search.reset.toLocaleString()}`);
    
    // Make a test request
    console.log(chalk.yellow('\n📝 Fetching pull requests...'));
    const pulls = await client.list({ state: 'open', per_page: 5 });
    
    console.log(chalk.green(`\n✅ Found ${pulls.length} open pull requests:`));
    pulls.forEach(pr => {
      console.log(`  #${pr.number}: ${pr.title}`);
    });
    
    // Check rate limit status again
    const statusAfter = await client.getRateLimitStatus();
    console.log(chalk.blue('\n📊 Rate limit after request:'));
    console.log(`  Remaining: ${statusAfter.core.remaining} requests`);
    
    // Demonstrate rate limit handling
    console.log(chalk.yellow('\n🔧 Rate limiting features:'));
    console.log('  ✓ Automatic request queuing when approaching limits');
    console.log('  ✓ Dynamic rate limit detection from GitHub headers');
    console.log('  ✓ Separate limiters for core and search APIs');
    console.log('  ✓ Graceful error handling for rate limit exceeded');
    
  } catch (error) {
    if (error.name === 'RateLimitError') {
      console.log(chalk.red('\n❌ Rate limit exceeded!'));
      const resetIn = error.getTimeUntilReset();
      console.log(chalk.yellow(`  Rate limit resets in ${Math.ceil(resetIn / 60)} minutes`));
      console.log(chalk.gray('  The rate-limited client would normally queue this request'));
    } else {
      console.error(chalk.red('\n❌ Error:'), error.message);
    }
  }
}

// Run the demo
demo().catch(console.error);