#!/usr/bin/env node

/**
 * @fileoverview SDK Usage Examples
 * Comprehensive examples of using the GitHub Repository SDK
 */

import { RepoClient, createClient } from '../index.mjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Basic repository operations
 */
async function basicRepositoryOperations() {
  console.log('🔧 Basic Repository Operations');
  
  const client = new RepoClient({
    token: process.env.GITHUB_TOKEN
  });
  
  try {
    // Get authenticated user info
    const user = await client.getAuthenticatedUser();
    console.log(`✓ Authenticated as: ${user.login}`);
    
    // Get a specific repository
    const repo = await client.repositories.get('octocat', 'Hello-World');
    console.log(`✓ Repository: ${repo.full_name}`);
    console.log(`  - Description: ${repo.description}`);
    console.log(`  - Stars: ${repo.stargazers_count}`);
    console.log(`  - Language: ${repo.language}`);
    
    // List user repositories
    const repos = await client.repositories.listForAuthenticatedUser({
      type: 'public',
      sort: 'updated',
      per_page: 5
    });
    console.log(`✓ Found ${repos.length} recent repositories:`);
    repos.forEach(r => {
      console.log(`  - ${r.name} (${r.language || 'N/A'})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

/**
 * Repository management examples
 */
async function repositoryManagement() {
  console.log('\\n📚 Repository Management');
  
  const client = createClient({
    token: process.env.GITHUB_TOKEN,
    rateLimiting: { enabled: true }
  });
  
  try {
    // Create a test repository
    const repoName = `test-repo-${Date.now()}`;
    const newRepo = await client.repositories.create({
      name: repoName,
      description: 'Test repository created by SDK example',
      private: false,
      auto_init: true,
      has_issues: true,
      has_projects: false,
      has_wiki: false,
      topics: ['test', 'sdk', 'github-api']
    });
    
    console.log(`✓ Created repository: ${newRepo.html_url}`);
    
    // Update repository settings
    const updatedRepo = await client.repositories.update(newRepo.owner.login, repoName, {
      description: 'Updated description via SDK',
      has_projects: true
    });
    console.log(`✓ Updated repository description`);
    
    // Get repository topics
    const topics = await client.repositories.getAllTopics(newRepo.owner.login, repoName);
    console.log(`✓ Topics: ${topics.names.join(', ')}`);
    
    // Update topics
    await client.repositories.replaceAllTopics(newRepo.owner.login, repoName, [
      'updated', 'sdk', 'example', 'nodejs'
    ]);
    console.log(`✓ Updated topics`);
    
    // Get repository languages
    const languages = await client.repositories.getLanguages(newRepo.owner.login, repoName);
    console.log(`✓ Languages:`, Object.keys(languages));
    
    // Star the repository
    await client.repositories.star(newRepo.owner.login, repoName);
    console.log(`✓ Starred repository`);
    
    // Check if starred
    const isStarred = await client.repositories.checkIfStarred(newRepo.owner.login, repoName);
    console.log(`✓ Star status: ${isStarred ? 'starred' : 'not starred'}`);
    
    // Clean up - delete the test repository
    console.log(`🗑️  Cleaning up test repository...`);
    await client.repositories.deleteRepo(newRepo.owner.login, repoName);
    console.log(`✓ Deleted test repository`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

/**
 * Branch management examples
 */
async function branchManagement() {
  console.log('\\n🌿 Branch Management');
  
  const client = new RepoClient({
    token: process.env.GITHUB_TOKEN
  });
  
  try {
    // List branches for a repository
    const branches = await client.branches.list('octocat', 'Hello-World');
    console.log(`✓ Found ${branches.length} branches:`);
    branches.slice(0, 3).forEach(branch => {
      console.log(`  - ${branch.name} ${branch.protected ? '🔒' : ''}`);
    });
    
    // Get specific branch
    const mainBranch = await client.branches.get('octocat', 'Hello-World', 'master');
    console.log(`✓ Main branch: ${mainBranch.name}`);
    console.log(`  - SHA: ${mainBranch.commit.sha.substring(0, 8)}`);
    console.log(`  - Protected: ${mainBranch.protected ? 'Yes' : 'No'}`);
    
    if (mainBranch.protected) {
      // Get branch protection details
      const protection = await client.branches.getProtection('octocat', 'Hello-World', 'master');
      console.log(`✓ Protection details:`);
      if (protection.required_status_checks) {
        console.log(`  - Status checks: ${protection.required_status_checks.contexts.length} required`);
      }
      if (protection.required_pull_request_reviews) {
        console.log(`  - PR reviews: ${protection.required_pull_request_reviews.required_approving_review_count} required`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

/**
 * Collaborator management examples
 */
async function collaboratorManagement() {
  console.log('\\n👥 Collaborator Management');
  
  const client = new RepoClient({
    token: process.env.GITHUB_TOKEN
  });
  
  try {
    // List collaborators (using a public repo for demonstration)
    const collaborators = await client.collaborators.list('octocat', 'Hello-World');
    console.log(`✓ Found ${collaborators.length} collaborators:`);
    
    collaborators.slice(0, 5).forEach(collaborator => {
      let permission = 'read';
      if (collaborator.permissions) {
        if (collaborator.permissions.admin) permission = 'admin';
        else if (collaborator.permissions.maintain) permission = 'maintain';
        else if (collaborator.permissions.push) permission = 'write';
        else if (collaborator.permissions.triage) permission = 'triage';
      }
      
      console.log(`  - ${collaborator.login} (${permission}) ${collaborator.type === 'Bot' ? '🤖' : '👤'}`);
    });
    
    // Check specific user permissions
    const permissions = await client.collaborators.checkPermissions('octocat', 'Hello-World', 'octocat');
    console.log(`✓ octocat permission level: ${permissions.permission}`);
    
    // Get collaborator statistics
    const stats = await client.collaborators.getStats('octocat', 'Hello-World');
    console.log(`✓ Collaborator stats:`);
    console.log(`  - Total: ${stats.total}`);
    console.log(`  - Users: ${stats.byType.users}, Bots: ${stats.byType.bots}`);
    console.log(`  - By permission:`, stats.byPermission);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

/**
 * Pagination examples
 */
async function paginationExamples() {
  console.log('\\n📄 Pagination Examples');
  
  const client = new RepoClient({
    token: process.env.GITHUB_TOKEN
  });
  
  try {
    console.log('Using pagination iterator...');
    let count = 0;
    const iterator = client.paginate(client.repositories.listForAuthenticatedUser, {
      per_page: 10
    });
    
    for await (const repo of iterator) {
      if (count >= 5) break; // Limit for demo
      console.log(`  ${count + 1}. ${repo.name} - ${repo.description || 'No description'}`);
      count++;
    }
    
    console.log(`✓ Processed ${count} repositories using iterator`);
    
    // Get all results at once (be careful with large result sets)
    console.log('Getting first page directly...');
    const firstPage = await client.repositories.listForAuthenticatedUser({
      page: 1,
      per_page: 3
    });
    
    console.log(`✓ First page contains ${firstPage.length} repositories`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

/**
 * Error handling examples
 */
async function errorHandlingExamples() {
  console.log('\\n❌ Error Handling Examples');
  
  const client = new RepoClient({
    token: process.env.GITHUB_TOKEN
  });
  
  // Example 1: Repository not found
  try {
    await client.repositories.get('nonexistentuser', 'nonexistentrepo');
  } catch (error) {
    console.log(`✓ Caught NotFoundError: ${error.message}`);
  }
  
  // Example 2: Invalid input validation
  try {
    await client.repositories.create({
      name: '', // Invalid empty name
      description: 'Test repo'
    });
  } catch (error) {
    console.log(`✓ Caught ValidationError: ${error.message}`);
  }
  
  // Example 3: Check rate limit status
  const rateLimit = await client.getRateLimit();
  console.log(`✓ Rate limit status: ${rateLimit.remaining || 'unknown'} remaining`);
  
  // Example 4: Test connectivity
  const pingResult = await client.ping();
  console.log(`✓ API connectivity: ${pingResult.success ? 'OK' : 'Failed'}`);
}

/**
 * Advanced usage examples
 */
async function advancedUsage() {
  console.log('\\n🚀 Advanced Usage Examples');
  
  const client = new RepoClient({
    token: process.env.GITHUB_TOKEN,
    timeout: 15000,
    rateLimiting: {
      enabled: true,
      padding: 200
    }
  });
  
  try {
    // Get configuration
    const config = client.getConfig();
    console.log(`✓ Client configuration:`);
    console.log(`  - Base URL: ${config.baseUrl}`);
    console.log(`  - Timeout: ${config.timeout}ms`);
    console.log(`  - Rate limiting: ${config.rateLimiting.enabled ? 'enabled' : 'disabled'}`);
    
    // Update configuration
    client.updateConfig({
      timeout: 20000
    });
    console.log(`✓ Updated timeout to 20000ms`);
    
    // Search repositories with filters
    const publicRepos = await client.repositories.listForAuthenticatedUser({
      visibility: 'public',
      type: 'owner',
      sort: 'updated',
      direction: 'desc',
      per_page: 5
    });
    
    console.log(`✓ Found ${publicRepos.length} public repositories owned by user`);
    
    // Get repository statistics
    if (publicRepos.length > 0) {
      const repo = publicRepos[0];
      const stats = await client.repositories.getStats(repo.owner.login, repo.name);
      console.log(`✓ Statistics for ${repo.name}:`);
      console.log(`  - Languages:`, Object.keys(stats.languages || {}));
      console.log(`  - Contributors: ${stats.contributors?.length || 0}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

/**
 * Main execution
 */
async function main() {
  if (!process.env.GITHUB_TOKEN) {
    console.error('❌ GITHUB_TOKEN environment variable is required');
    console.log('Set your GitHub token:');
    console.log('export GITHUB_TOKEN=ghp_your_token_here');
    process.exit(1);
  }
  
  console.log('🎯 GitHub Repository SDK Examples');
  console.log('=====================================');
  
  await basicRepositoryOperations();
  await repositoryManagement();
  await branchManagement();
  await collaboratorManagement();
  await paginationExamples();
  await errorHandlingExamples();
  await advancedUsage();
  
  console.log('\\n✅ All examples completed successfully!');
}

// Run examples if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}