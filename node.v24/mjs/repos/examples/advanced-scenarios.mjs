#!/usr/bin/env node

/**
 * @fileoverview Advanced Usage Scenarios
 * Complex real-world examples demonstrating advanced SDK usage patterns
 */

import { RepoClient } from '../index.mjs';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Scenario 1: Repository Migration Helper
 * Migrate repositories between organizations with full metadata preservation
 */
async function repositoryMigrationScenario() {
  console.log('🔄 Repository Migration Scenario');
  console.log('================================');
  
  const client = new RepoClient({
    token: process.env.GITHUB_TOKEN,
    rateLimiting: { enabled: true, padding: 500 } // Extra padding for bulk operations
  });
  
  const sourceOrg = 'source-org';
  const targetOrg = 'target-org';
  const reposToMigrate = ['repo1', 'repo2'];
  
  try {
    for (const repoName of reposToMigrate) {
      console.log(`\\nMigrating ${repoName}...`);
      
      // 1. Get source repository details
      const sourceRepo = await client.repositories.get(sourceOrg, repoName);
      console.log(`✓ Retrieved source repository metadata`);
      
      // 2. Get all branches
      const branches = await client.branches.list(sourceOrg, repoName, { per_page: 100 });
      console.log(`✓ Found ${branches.length} branches`);
      
      // 3. Get collaborators
      const collaborators = await client.collaborators.list(sourceOrg, repoName);
      console.log(`✓ Found ${collaborators.length} collaborators`);
      
      // 4. Get topics and settings
      const topics = await client.repositories.getAllTopics(sourceOrg, repoName);
      console.log(`✓ Found ${topics.names.length} topics: ${topics.names.join(', ')}`);
      
      // 5. Create repository in target organization
      const migrationData = {
        name: repoName,
        description: sourceRepo.description,
        private: sourceRepo.private,
        has_issues: sourceRepo.has_issues,
        has_projects: sourceRepo.has_projects,
        has_wiki: sourceRepo.has_wiki,
        has_discussions: sourceRepo.has_discussions,
        topics: topics.names,
        allow_squash_merge: sourceRepo.allow_squash_merge,
        allow_merge_commit: sourceRepo.allow_merge_commit,
        allow_rebase_merge: sourceRepo.allow_rebase_merge,
        delete_branch_on_merge: sourceRepo.delete_branch_on_merge
      };
      
      const newRepo = await client.repositories.createInOrg(targetOrg, migrationData);
      console.log(`✓ Created target repository: ${newRepo.html_url}`);
      
      // 6. Transfer collaborators (manual verification recommended)
      const migrationReport = {
        sourceRepo: `${sourceOrg}/${repoName}`,
        targetRepo: `${targetOrg}/${repoName}`,
        branches: branches.map(b => ({
          name: b.name,
          protected: b.protected,
          sha: b.commit.sha
        })),
        collaborators: collaborators.map(c => ({
          login: c.login,
          permission: c.permissions
        })),
        topics: topics.names,
        migrationDate: new Date().toISOString()
      };
      
      console.log(`✓ Migration completed for ${repoName}`);
      console.log(`📋 Migration report:`, JSON.stringify(migrationReport, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  }
}

/**
 * Scenario 2: Repository Health Audit
 * Comprehensive audit of repository security and best practices
 */
async function repositoryHealthAudit() {
  console.log('\\n🔍 Repository Health Audit');
  console.log('============================');
  
  const client = new RepoClient({
    token: process.env.GITHUB_TOKEN
  });
  
  try {
    // Get authenticated user's repositories
    const repos = await client.repositories.listForAuthenticatedUser({
      type: 'owner',
      sort: 'updated',
      per_page: 10 // Limit for demo
    });
    
    console.log(`Auditing ${repos.length} repositories...\\n`);
    
    const auditResults = [];
    
    for (const repo of repos) {
      console.log(`Auditing ${repo.full_name}...`);
      
      const audit = {
        repository: repo.full_name,
        score: 0,
        maxScore: 100,
        findings: [],
        recommendations: []
      };
      
      // Security checks
      try {
        const vulnerabilityAlerts = await client.security.getVulnerabilityAlerts(repo.owner.login, repo.name);
        if (vulnerabilityAlerts.enabled) {
          audit.score += 10;
          audit.findings.push('✅ Vulnerability alerts enabled');
        } else {
          audit.findings.push('⚠️  Vulnerability alerts disabled');
          audit.recommendations.push('Enable vulnerability alerts');
        }
      } catch (error) {
        audit.findings.push('❓ Could not check vulnerability alerts');
      }
      
      // Branch protection
      try {
        const branches = await client.branches.list(repo.owner.login, repo.name);
        const defaultBranch = branches.find(b => b.name === repo.default_branch);
        
        if (defaultBranch && defaultBranch.protected) {
          audit.score += 20;
          audit.findings.push('✅ Default branch protected');
          
          // Check protection details
          const protection = await client.branches.getProtection(repo.owner.login, repo.name, repo.default_branch);
          if (protection.required_pull_request_reviews) {
            audit.score += 10;
            audit.findings.push('✅ Pull request reviews required');
          }
          if (protection.required_status_checks) {
            audit.score += 10;
            audit.findings.push('✅ Status checks required');
          }
        } else {
          audit.findings.push('❌ Default branch not protected');
          audit.recommendations.push('Enable branch protection on default branch');
        }
      } catch (error) {
        audit.findings.push('❓ Could not check branch protection');
      }
      
      // Repository settings
      if (repo.description) {
        audit.score += 5;
        audit.findings.push('✅ Has description');
      } else {
        audit.findings.push('⚠️  No description');
        audit.recommendations.push('Add repository description');
      }
      
      if (repo.topics && repo.topics.length > 0) {
        audit.score += 5;
        audit.findings.push(`✅ Has ${repo.topics.length} topics`);
      } else {
        audit.findings.push('⚠️  No topics');
        audit.recommendations.push('Add relevant topics for discoverability');
      }
      
      if (repo.license) {
        audit.score += 10;
        audit.findings.push(`✅ Has license: ${repo.license.name}`);
      } else {
        audit.findings.push('⚠️  No license');
        audit.recommendations.push('Add appropriate license');
      }
      
      // README check (inferred)
      if (repo.size > 0) {
        audit.score += 5;
        audit.findings.push('✅ Repository has content');
      } else {
        audit.findings.push('⚠️  Repository appears empty');
        audit.recommendations.push('Add README and initial content');
      }
      
      // Issue and PR settings
      if (repo.has_issues) {
        audit.score += 5;
        audit.findings.push('✅ Issues enabled');
      } else {
        audit.findings.push('ℹ️  Issues disabled (may be intentional)');
      }
      
      if (repo.has_discussions) {
        audit.score += 5;
        audit.findings.push('✅ Discussions enabled');
      }
      
      // Calculate grade
      const percentage = (audit.score / audit.maxScore) * 100;
      let grade = 'F';
      if (percentage >= 90) grade = 'A';
      else if (percentage >= 80) grade = 'B';
      else if (percentage >= 70) grade = 'C';
      else if (percentage >= 60) grade = 'D';
      
      audit.grade = grade;
      audit.percentage = Math.round(percentage);
      
      auditResults.push(audit);
      
      console.log(`  Grade: ${grade} (${audit.percentage}%)`);
      console.log(`  Score: ${audit.score}/${audit.maxScore}`);
    }
    
    // Summary report
    console.log('\\n📊 Audit Summary');
    console.log('================');
    
    const avgScore = auditResults.reduce((sum, audit) => sum + audit.percentage, 0) / auditResults.length;
    console.log(`Average health score: ${Math.round(avgScore)}%`);
    
    const gradeDistribution = auditResults.reduce((dist, audit) => {
      dist[audit.grade] = (dist[audit.grade] || 0) + 1;
      return dist;
    }, {});
    console.log(`Grade distribution:`, gradeDistribution);
    
    // Top recommendations
    const allRecommendations = auditResults.flatMap(audit => audit.recommendations);
    const recommendationCounts = allRecommendations.reduce((counts, rec) => {
      counts[rec] = (counts[rec] || 0) + 1;
      return counts;
    }, {});
    
    console.log('\\n🎯 Top Recommendations:');
    Object.entries(recommendationCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .forEach(([rec, count]) => {
        console.log(`  ${count}x ${rec}`);
      });
    
  } catch (error) {
    console.error('❌ Audit failed:', error.message);
  }
}

/**
 * Scenario 3: Repository Synchronization
 * Keep multiple repositories in sync with templates and policies
 */
async function repositorySynchronizationScenario() {
  console.log('\\n🔄 Repository Synchronization');
  console.log('==============================');
  
  const client = new RepoClient({
    token: process.env.GITHUB_TOKEN
  });
  
  try {
    // Template repository configuration
    const templateConfig = {
      topics: ['managed', 'template-sync'],
      branch_protection: {
        required_status_checks: {
          strict: true,
          contexts: ['ci/test']
        },
        enforce_admins: true,
        required_pull_request_reviews: {
          required_approving_review_count: 1,
          dismiss_stale_reviews: true
        }
      },
      settings: {
        has_issues: true,
        has_projects: false,
        has_wiki: false,
        allow_squash_merge: true,
        allow_merge_commit: false,
        allow_rebase_merge: false,
        delete_branch_on_merge: true
      }
    };
    
    // Find repositories to sync (those with 'managed' topic)
    const allRepos = await client.repositories.listForAuthenticatedUser({
      type: 'owner',
      per_page: 100
    });
    
    const managedRepos = allRepos.filter(repo => 
      repo.topics && repo.topics.includes('managed')
    );
    
    console.log(`Found ${managedRepos.length} managed repositories to sync`);
    
    for (const repo of managedRepos) {
      console.log(`\\nSyncing ${repo.full_name}...`);
      
      // Update repository settings
      const updates = {};
      let hasUpdates = false;
      
      Object.entries(templateConfig.settings).forEach(([key, value]) => {
        if (repo[key] !== value) {
          updates[key] = value;
          hasUpdates = true;
        }
      });
      
      if (hasUpdates) {
        await client.repositories.update(repo.owner.login, repo.name, updates);
        console.log('✓ Updated repository settings');
      }
      
      // Sync topics
      const currentTopics = new Set(repo.topics || []);
      const requiredTopics = new Set(templateConfig.topics);
      const topicsToAdd = [...requiredTopics].filter(t => !currentTopics.has(t));
      
      if (topicsToAdd.length > 0) {
        const allTopics = [...new Set([...repo.topics, ...topicsToAdd])];
        await client.repositories.replaceAllTopics(repo.owner.login, repo.name, allTopics);
        console.log(`✓ Added topics: ${topicsToAdd.join(', ')}`);
      }
      
      // Sync branch protection
      try {
        const currentProtection = await client.branches.getProtection(
          repo.owner.login, 
          repo.name, 
          repo.default_branch
        );
        
        // Compare and update if needed
        let needsUpdate = false;
        const protectionUpdate = { ...templateConfig.branch_protection };
        
        if (JSON.stringify(currentProtection.required_status_checks) !== 
            JSON.stringify(templateConfig.branch_protection.required_status_checks)) {
          needsUpdate = true;
        }
        
        if (needsUpdate) {
          await client.branches.updateProtection(
            repo.owner.login,
            repo.name,
            repo.default_branch,
            protectionUpdate
          );
          console.log('✓ Updated branch protection');
        }
        
      } catch (error) {
        if (error.statusCode === 404) {
          // No protection exists, create it
          await client.branches.updateProtection(
            repo.owner.login,
            repo.name,
            repo.default_branch,
            templateConfig.branch_protection
          );
          console.log('✓ Added branch protection');
        } else {
          console.log(`⚠️  Could not update branch protection: ${error.message}`);
        }
      }
    }
    
    console.log(`\\n✅ Synchronized ${managedRepos.length} repositories`);
    
  } catch (error) {
    console.error('❌ Synchronization failed:', error.message);
  }
}

/**
 * Scenario 4: Repository Analytics and Reporting
 * Generate comprehensive analytics across repositories
 */
async function repositoryAnalyticsScenario() {
  console.log('\\n📊 Repository Analytics & Reporting');
  console.log('====================================');
  
  const client = new RepoClient({
    token: process.env.GITHUB_TOKEN
  });
  
  try {
    // Get all repositories
    const repos = await client.repositories.listForAuthenticatedUser({
      type: 'owner',
      per_page: 100
    });
    
    console.log(`Analyzing ${repos.length} repositories...\\n`);
    
    const analytics = {
      overview: {
        totalRepositories: repos.length,
        publicRepositories: repos.filter(r => !r.private).length,
        privateRepositories: repos.filter(r => r.private).length,
        totalStars: repos.reduce((sum, r) => sum + r.stargazers_count, 0),
        totalForks: repos.reduce((sum, r) => sum + r.forks_count, 0)
      },
      languages: {},
      topics: {},
      licenses: {},
      activity: {
        recentlyUpdated: [],
        staleRepositories: [],
        mostActive: []
      },
      collaboration: {
        totalCollaborators: 0,
        collaboratorsPerRepo: [],
        mostCollaborativeRepos: []
      },
      security: {
        protectedRepos: 0,
        vulnerabilityAlertsEnabled: 0,
        repositoriesWithIssues: repos.filter(r => r.has_issues).length
      }
    };
    
    // Language analysis
    repos.forEach(repo => {
      if (repo.language) {
        analytics.languages[repo.language] = (analytics.languages[repo.language] || 0) + 1;
      }
    });
    
    // Topics analysis
    repos.forEach(repo => {
      if (repo.topics) {
        repo.topics.forEach(topic => {
          analytics.topics[topic] = (analytics.topics[topic] || 0) + 1;
        });
      }
    });
    
    // License analysis
    repos.forEach(repo => {
      const license = repo.license ? repo.license.name : 'No License';
      analytics.licenses[license] = (analytics.licenses[license] || 0) + 1;
    });
    
    // Activity analysis
    const now = new Date();
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    
    repos.forEach(repo => {
      const updatedAt = new Date(repo.updated_at);
      
      if (updatedAt > oneMonthAgo) {
        analytics.activity.recentlyUpdated.push({
          name: repo.name,
          updated_at: repo.updated_at
        });
      }
      
      if (updatedAt < sixMonthsAgo) {
        analytics.activity.staleRepositories.push({
          name: repo.name,
          updated_at: repo.updated_at,
          daysSinceUpdate: Math.floor((now - updatedAt) / (1000 * 60 * 60 * 24))
        });
      }
    });
    
    // Sort by activity
    analytics.activity.mostActive = repos
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
      .slice(0, 5)
      .map(r => ({ name: r.name, updated_at: r.updated_at }));
    
    // Get detailed collaboration data for top repositories
    const topRepos = repos
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, 5);
    
    for (const repo of topRepos) {
      try {
        const collaborators = await client.collaborators.list(repo.owner.login, repo.name);
        analytics.collaboration.totalCollaborators += collaborators.length;
        analytics.collaboration.collaboratorsPerRepo.push({
          name: repo.name,
          collaborators: collaborators.length
        });
        
        // Check if main branch is protected
        try {
          await client.branches.getProtection(repo.owner.login, repo.name, repo.default_branch);
          analytics.security.protectedRepos++;
        } catch (error) {
          // Not protected
        }
        
        // Check vulnerability alerts
        try {
          const alerts = await client.security.getVulnerabilityAlerts(repo.owner.login, repo.name);
          if (alerts.enabled) {
            analytics.security.vulnerabilityAlertsEnabled++;
          }
        } catch (error) {
          // Could not check
        }
      } catch (error) {
        console.log(`Could not get collaboration data for ${repo.name}`);
      }
    }
    
    // Find most collaborative repositories
    analytics.collaboration.mostCollaborativeRepos = analytics.collaboration.collaboratorsPerRepo
      .sort((a, b) => b.collaborators - a.collaborators)
      .slice(0, 3);
    
    // Generate report
    console.log('📈 Analytics Report');
    console.log('==================');
    
    console.log('\\n🏢 Overview:');
    console.log(`  Total Repositories: ${analytics.overview.totalRepositories}`);
    console.log(`  Public: ${analytics.overview.publicRepositories}`);
    console.log(`  Private: ${analytics.overview.privateRepositories}`);
    console.log(`  Total Stars: ${analytics.overview.totalStars.toLocaleString()}`);
    console.log(`  Total Forks: ${analytics.overview.totalForks.toLocaleString()}`);
    
    console.log('\\n💻 Top Languages:');
    Object.entries(analytics.languages)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .forEach(([lang, count]) => {
        const percentage = ((count / analytics.overview.totalRepositories) * 100).toFixed(1);
        console.log(`  ${lang}: ${count} repos (${percentage}%)`);
      });
    
    console.log('\\n🏷️  Popular Topics:');
    Object.entries(analytics.topics)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .forEach(([topic, count]) => {
        console.log(`  ${topic}: ${count} repos`);
      });
    
    console.log('\\n📄 License Distribution:');
    Object.entries(analytics.licenses)
      .sort(([,a], [,b]) => b - a)
      .forEach(([license, count]) => {
        const percentage = ((count / analytics.overview.totalRepositories) * 100).toFixed(1);
        console.log(`  ${license}: ${count} repos (${percentage}%)`);
      });
    
    console.log('\\n📅 Activity:');
    console.log(`  Recently Updated (last 30 days): ${analytics.activity.recentlyUpdated.length}`);
    console.log(`  Stale (>6 months): ${analytics.activity.staleRepositories.length}`);
    
    if (analytics.activity.staleRepositories.length > 0) {
      console.log('\\n  ⚠️  Stale Repositories:');
      analytics.activity.staleRepositories.slice(0, 3).forEach(repo => {
        console.log(`    ${repo.name} (${repo.daysSinceUpdate} days)`);
      });
    }
    
    console.log('\\n👥 Collaboration:');
    console.log(`  Total Collaborators: ${analytics.collaboration.totalCollaborators}`);
    console.log(`  Average per Repository: ${(analytics.collaboration.totalCollaborators / topRepos.length).toFixed(1)}`);
    
    console.log('\\n🔒 Security:');
    console.log(`  Protected Repositories: ${analytics.security.protectedRepos}/${topRepos.length}`);
    console.log(`  Vulnerability Alerts: ${analytics.security.vulnerabilityAlertsEnabled}/${topRepos.length}`);
    console.log(`  Repositories with Issues: ${analytics.security.repositoriesWithIssues}`);
    
    // Export report as JSON
    const reportFile = `repository-analytics-${new Date().toISOString().split('T')[0]}.json`;
    console.log(`\\n💾 Full report exported to: ${reportFile}`);
    
  } catch (error) {
    console.error('❌ Analytics failed:', error.message);
  }
}

/**
 * Main execution
 */
async function main() {
  if (!process.env.GITHUB_TOKEN) {
    console.error('❌ GITHUB_TOKEN environment variable is required');
    process.exit(1);
  }
  
  console.log('🚀 Advanced GitHub Repository SDK Scenarios');
  console.log('============================================');
  
  // Note: These scenarios are for demonstration purposes
  // Some operations create/modify real repositories, so use with caution
  
  await repositoryHealthAudit();
  await repositoryAnalyticsScenario();
  
  // Commented out scenarios that make changes:
  // await repositoryMigrationScenario();
  // await repositorySynchronizationScenario();
  
  console.log('\\n✅ All scenarios completed!');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}