#!/usr/bin/env node

/**
 * GitHub Search API - Scaling Demonstration
 * Shows how to use the search client at scale with various optimization strategies
 */

import { createSafeSearchClient } from '../lib/SafeSearchClient.mjs';
import ora from 'ora';
import chalk from 'chalk';

console.log(chalk.cyan.bold('\n🚀 GitHub Search API - Scaling Demonstration\n'));

/**
 * Demo 1: Token Pool Management
 * Distribute load across multiple tokens
 */
async function demoTokenPooling() {
  console.log(chalk.yellow('\n📊 Demo 1: Token Pool Management'));
  
  // Configure client with multiple tokens
  const client = await createSafeSearchClient({
    tokens: [
      process.env.GITHUB_TOKEN_1,
      process.env.GITHUB_TOKEN_2,
      process.env.GITHUB_TOKEN_3
    ].filter(Boolean),
    
    // Enable adaptive rate limiting
    adaptiveRateLimit: true,
    rateLimitBuffer: 20
  });
  
  const spinner = ora('Executing searches across token pool...').start();
  
  try {
    // Execute multiple searches in parallel
    const searches = [
      'language:javascript stars:>1000',
      'language:python machine learning',
      'language:go kubernetes',
      'language:rust web framework',
      'language:typescript react'
    ];
    
    const results = await client.parallelSearch('repositories', searches, {
      per_page: 10,
      sort: 'stars'
    });
    
    spinner.succeed('Token pool demonstration complete');
    
    // Display rate limit status
    const rateLimits = client.getRateLimitStatus();
    console.log(chalk.green('\nRate Limit Status:'));
    console.log(`  Total tokens: ${rateLimits.tokens.length}`);
    console.log(`  Core remaining: ${rateLimits.overall.core.remaining}/${rateLimits.overall.core.limit}`);
    console.log(`  Search remaining: ${rateLimits.overall.search.remaining}/${rateLimits.overall.search.limit}`);
    
    return results;
  } catch (error) {
    spinner.fail(`Error: ${error.message}`);
  } finally {
    await client.close();
  }
}

/**
 * Demo 2: Intelligent Caching
 * Reduce API calls with multi-tier caching
 */
async function demoCaching() {
  console.log(chalk.yellow('\n💾 Demo 2: Intelligent Caching'));
  
  const client = await createSafeSearchClient({
    cacheEnabled: true,
    cacheStrategy: 'aggressive',
    cacheTTL: 600000, // 10 minutes
    normalizeQueries: true
  });
  
  const query = 'javascript framework';
  const spinner = ora('Testing cache performance...').start();
  
  try {
    // First request - cache miss
    console.time('First request');
    const result1 = await client.searchRepositories({
      q: query,
      per_page: 10
    });
    console.timeEnd('First request');
    console.log(`  Cache hit: ${result1._cache?.hit || false}`);
    
    // Second request - cache hit
    console.time('Second request');
    const result2 = await client.searchRepositories({
      q: query,
      per_page: 10
    });
    console.timeEnd('Second request');
    console.log(`  Cache hit: ${result2._cache?.hit || false}`);
    
    // Similar query - normalized and cached
    console.time('Normalized query');
    const result3 = await client.searchRepositories({
      q: 'JAVASCRIPT   framework', // Different formatting
      per_page: 10
    });
    console.timeEnd('Normalized query');
    console.log(`  Cache hit: ${result3._cache?.hit || false}`);
    
    spinner.succeed('Caching demonstration complete');
    
    // Display cache statistics
    const cacheStats = client.getCacheStats();
    console.log(chalk.green('\nCache Statistics:'));
    console.log(`  Hit rate: ${cacheStats.hitRate}`);
    console.log(`  Total hits: ${cacheStats.hits}`);
    console.log(`  Total misses: ${cacheStats.misses}`);
    console.log(`  Memory usage: ${cacheStats.memoryUsage}`);
    
  } catch (error) {
    spinner.fail(`Error: ${error.message}`);
  } finally {
    await client.close();
  }
}

/**
 * Demo 3: Request Batching
 * Optimize multiple searches with batching
 */
async function demoBatching() {
  console.log(chalk.yellow('\n📦 Demo 3: Request Batching'));
  
  const client = await createSafeSearchClient({
    batchingEnabled: true,
    batchWindow: 200,
    maxBatchSize: 10,
    deduplicateRequests: true,
    parallelRequests: true
  });
  
  const spinner = ora('Executing batched searches...').start();
  
  try {
    // Execute multiple searches that will be batched
    const searches = [
      { type: 'repositories', q: 'react', per_page: 5 },
      { type: 'repositories', q: 'vue', per_page: 5 },
      { type: 'repositories', q: 'angular', per_page: 5 },
      { type: 'code', q: 'useState', per_page: 5 },
      { type: 'code', q: 'useEffect', per_page: 5 },
      { type: 'issues', q: 'bug label:security', per_page: 5 },
      { type: 'users', q: 'location:Seattle', per_page: 5 }
    ];
    
    const results = await client.batchSearch(searches);
    
    spinner.succeed('Batching demonstration complete');
    
    // Display batch statistics
    const batchStats = client.getBatchStats();
    console.log(chalk.green('\nBatch Statistics:'));
    console.log(`  Total batches: ${batchStats.totalBatches}`);
    console.log(`  Average batch size: ${batchStats.averageBatchSize.toFixed(2)}`);
    console.log(`  Deduplicated requests: ${batchStats.deduplicatedRequests}`);
    console.log(`  Parallel executions: ${batchStats.parallelExecutions}`);
    
    // Show sample results
    console.log('\nSample Results:');
    results.forEach((result, index) => {
      const search = searches[index];
      if (result.success) {
        console.log(`  ✓ ${search.type}: ${search.q} - ${result.data.total_count} results`);
      } else {
        console.log(`  ✗ ${search.type}: ${search.q} - ${result.error}`);
      }
    });
    
  } catch (error) {
    spinner.fail(`Error: ${error.message}`);
  } finally {
    await client.close();
  }
}

/**
 * Demo 4: Circuit Breaker & Graceful Degradation
 * Handle failures gracefully
 */
async function demoResilience() {
  console.log(chalk.yellow('\n🛡️ Demo 4: Circuit Breaker & Graceful Degradation'));
  
  const client = await createSafeSearchClient({
    circuitBreakerEnabled: true,
    failureThreshold: 3,
    circuitTimeout: 10000,
    degradationEnabled: true,
    autoRecovery: true
  });
  
  const spinner = ora('Testing resilience features...').start();
  
  try {
    // Simulate multiple requests, some may fail
    const queries = [
      'valid query',
      'another valid query',
      // Invalid queries that might trigger errors
      'repo:nonexistent/repo',
      'complex query with errors'
    ];
    
    for (const query of queries) {
      try {
        const result = await client.searchRepositories({
          q: query,
          per_page: 5
        });
        console.log(`  ✓ Success: ${query} - ${result.total_count} results`);
      } catch (error) {
        console.log(`  ✗ Failed: ${query} - Circuit breaker may activate`);
      }
    }
    
    spinner.succeed('Resilience demonstration complete');
    
    // Display health status
    const health = client.getHealth();
    console.log(chalk.green('\nSystem Health:'));
    console.log(`  Status: ${health.status}`);
    console.log(`  Degradation level: ${health.degradationLevel}`);
    console.log(`  Recent errors: ${health.recentErrors}`);
    console.log('  Circuit breakers:');
    health.circuitBreakers.forEach(cb => {
      console.log(`    ${cb.endpoint}: ${cb.state} (${cb.failures} failures)`);
    });
    
  } catch (error) {
    spinner.fail(`Error: ${error.message}`);
  } finally {
    await client.close();
  }
}

/**
 * Demo 5: Large-Scale Parallel Processing
 * Process hundreds of searches efficiently
 */
async function demoLargeScale() {
  console.log(chalk.yellow('\n⚡ Demo 5: Large-Scale Parallel Processing'));
  
  const client = await createSafeSearchClient({
    // Optimize for high throughput
    coreConcurrency: 20,
    searchConcurrency: 10,
    cacheStrategy: 'aggressive',
    batchingEnabled: true,
    parallelRequests: true,
    maxParallel: 10
  });
  
  const spinner = ora('Processing large-scale search operation...').start();
  
  try {
    // Generate many search queries
    const languages = ['javascript', 'python', 'go', 'rust', 'java'];
    const topics = ['web', 'api', 'cli', 'database', 'framework'];
    const queries = [];
    
    for (const lang of languages) {
      for (const topic of topics) {
        queries.push(`language:${lang} ${topic}`);
      }
    }
    
    console.log(`\n  Processing ${queries.length} searches...`);
    
    const startTime = Date.now();
    
    // Process all queries
    const results = await client.parallelSearch('repositories', queries, {
      per_page: 5,
      sort: 'stars'
    });
    
    const duration = Date.now() - startTime;
    
    spinner.succeed(`Processed ${queries.length} searches in ${duration}ms`);
    
    // Display performance metrics
    const metrics = client.getMetrics();
    console.log(chalk.green('\nPerformance Metrics:'));
    console.log(`  Total requests: ${metrics.totalRequests}`);
    console.log(`  Success rate: ${metrics.successRate}`);
    console.log(`  Average latency: ${metrics.averageLatency}ms`);
    console.log(`  Requests/second: ${(queries.length / (duration / 1000)).toFixed(2)}`);
    
    // Show rate limiting efficiency
    console.log('\nRate Limiting:');
    console.log(`  Throttled requests: ${metrics.rateLimiting.throttled}`);
    console.log(`  Token rotations: ${metrics.rateLimiting.tokenRotations}`);
    console.log(`  Average queue wait: ${metrics.rateLimiting.averageWaitTime.toFixed(2)}ms`);
    
    // Show caching efficiency
    console.log('\nCaching:');
    console.log(`  Cache hit rate: ${metrics.cache.hitRate}`);
    console.log(`  Stale hits: ${metrics.cache.staleHits}`);
    
    // Show batching efficiency  
    console.log('\nBatching:');
    console.log(`  Total batches: ${metrics.batching.totalBatches}`);
    console.log(`  Deduplicated: ${metrics.batching.deduplicatedRequests}`);
    
  } catch (error) {
    spinner.fail(`Error: ${error.message}`);
  } finally {
    await client.close();
  }
}

/**
 * Demo 6: Multi-Endpoint Search
 * Search across different GitHub resources
 */
async function demoMultiEndpoint() {
  console.log(chalk.yellow('\n🔍 Demo 6: Multi-Endpoint Search'));
  
  const client = await createSafeSearchClient();
  
  const query = 'kubernetes';
  const spinner = ora(`Searching for "${query}" across all endpoints...`).start();
  
  try {
    const results = await client.multiEndpointSearch(query, 
      ['repositories', 'code', 'issues', 'users', 'topics'],
      { per_page: 5 }
    );
    
    spinner.succeed('Multi-endpoint search complete');
    
    console.log('\nResults Summary:');
    for (const [type, result] of Object.entries(results)) {
      if (result.success) {
        console.log(`  ${type}: ${result.data.total_count.toLocaleString()} total results`);
        
        // Show top result
        if (result.data.items && result.data.items.length > 0) {
          const top = result.data.items[0];
          const name = top.full_name || top.name || top.login || top.path || 'N/A';
          console.log(`    Top result: ${name}`);
        }
      } else {
        console.log(`  ${type}: Failed - ${result.error}`);
      }
    }
    
  } catch (error) {
    spinner.fail(`Error: ${error.message}`);
  } finally {
    await client.close();
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    // Check for GitHub token
    if (!process.env.GITHUB_TOKEN) {
      console.log(chalk.red('\n⚠️  Warning: GITHUB_TOKEN not set'));
      console.log(chalk.yellow('Some demos may have limited functionality\n'));
    }
    
    // Run demos sequentially
    await demoTokenPooling();
    await demoCaching();
    await demoBatching();
    await demoResilience();
    await demoLargeScale();
    await demoMultiEndpoint();
    
    console.log(chalk.green.bold('\n✅ All demonstrations completed successfully!\n'));
    
  } catch (error) {
    console.error(chalk.red(`\n❌ Error: ${error.message}\n`));
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}