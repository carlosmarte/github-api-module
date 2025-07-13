#!/usr/bin/env node

/**
 * Advanced filtering and search examples for GitHub Issues SDK
 */

import { createClient } from '../index.mjs';
import { formatIssue, formatMilestone, formatLabel } from '../utils/format.mjs';

// Get authentication from environment
const auth = process.env.GITHUB_TOKEN;
if (!auth) {
  console.error('Please set GITHUB_TOKEN environment variable');
  process.exit(1);
}

async function main() {
  // Parse command line arguments
  const repoArg = process.argv[2] || 'nodejs/node';
  const [owner, repo] = repoArg.split('/');
  
  const client = createClient({
    auth,
    owner,
    repo
  });

  console.log(`🔍 Advanced Filtering Examples for ${owner}/${repo}\n`);

  try {
    // Example 1: Filter by multiple criteria
    console.log('1️⃣ Filter by multiple criteria (state, labels, assignee)...');
    const multiFilter = await client.listForRepo({
      state: 'open',
      labels: 'bug,help wanted',  // Multiple labels (AND condition)
      assignee: '*',               // Any assignee
      sort: 'updated',
      direction: 'desc',
      per_page: 5
    });
    
    console.log(`Found ${multiFilter.length} issues matching all criteria:`);
    multiFilter.forEach(issue => {
      const labels = issue.labels.map(l => l.name).join(', ');
      const assignees = issue.assignees.map(a => '@' + a.login).join(', ');
      console.log(`  #${issue.number} - ${issue.title.substring(0, 40)}...`);
      console.log(`    Labels: ${labels || 'none'}`);
      console.log(`    Assignees: ${assignees || 'none'}`);
    });
    console.log();

    // Example 2: Filter by date range
    console.log('2️⃣ Filter by date (issues updated in last 7 days)...');
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const recentIssues = await client.listForRepo({
      state: 'all',
      since: oneWeekAgo.toISOString(),
      sort: 'updated',
      per_page: 5
    });
    
    console.log(`Found ${recentIssues.length} recently updated issues:`);
    recentIssues.forEach(issue => {
      const updated = new Date(issue.updated_at);
      const daysAgo = Math.floor((Date.now() - updated) / (1000 * 60 * 60 * 24));
      console.log(`  #${issue.number} - ${issue.title.substring(0, 40)}... (${daysAgo}d ago)`);
    });
    console.log();

    // Example 3: Filter by milestone
    console.log('3️⃣ Working with milestones...');
    const milestones = await client.listMilestones({
      state: 'open',
      sort: 'due_on',
      direction: 'asc',
      per_page: 3
    });
    
    if (milestones.length > 0) {
      console.log(`Found ${milestones.length} open milestones:`);
      
      for (const milestone of milestones) {
        console.log(`\n  Milestone: "${milestone.title}"`);
        console.log(`  Progress: ${milestone.closed_issues}/${milestone.open_issues + milestone.closed_issues} issues`);
        
        if (milestone.due_on) {
          const dueDate = new Date(milestone.due_on);
          console.log(`  Due: ${dueDate.toLocaleDateString()}`);
        }
        
        // Get issues for this milestone
        const milestoneIssues = await client.listForRepo({
          milestone: milestone.number,
          state: 'open',
          per_page: 3
        });
        
        if (milestoneIssues.length > 0) {
          console.log(`  Open issues in this milestone:`);
          milestoneIssues.forEach(issue => {
            console.log(`    #${issue.number} - ${issue.title.substring(0, 35)}...`);
          });
        }
      }
    } else {
      console.log('No open milestones found');
    }
    console.log();

    // Example 4: Filter by creator and mentioned
    console.log('4️⃣ Filter by creator and mentions...');
    
    // Get repository info to find a valid creator
    const allIssues = await client.listForRepo({
      state: 'all',
      per_page: 10
    });
    
    if (allIssues.length > 0) {
      const creator = allIssues[0].user.login;
      
      console.log(`Issues created by @${creator}:`);
      const creatorIssues = await client.listForRepo({
        creator: creator,
        state: 'all',
        per_page: 3
      });
      
      creatorIssues.forEach(issue => {
        console.log(`  #${issue.number} - ${issue.title.substring(0, 40)}... (${issue.state})`);
      });
    }
    console.log();

    // Example 5: Complex label combinations
    console.log('5️⃣ Working with labels...');
    const labels = await client.listLabelsForRepo({
      per_page: 10
    });
    
    console.log(`Repository has ${labels.length} labels:`);
    labels.slice(0, 5).forEach(label => {
      console.log(`  • ${label.name} - ${label.description || 'No description'}`);
    });
    
    // Find issues with specific label
    if (labels.length > 0) {
      const targetLabel = labels[0].name;
      console.log(`\nIssues with "${targetLabel}" label:`);
      
      const labeledIssues = await client.listForRepo({
        labels: targetLabel,
        state: 'all',
        per_page: 3
      });
      
      labeledIssues.forEach(issue => {
        console.log(`  #${issue.number} - ${issue.title.substring(0, 40)}... (${issue.state})`);
      });
    }
    console.log();

    // Example 6: Sort by different criteria
    console.log('6️⃣ Different sorting options...');
    
    console.log('Most commented issues:');
    const mostCommented = await client.listForRepo({
      state: 'all',
      sort: 'comments',
      direction: 'desc',
      per_page: 3
    });
    
    mostCommented.forEach(issue => {
      console.log(`  #${issue.number} - ${issue.title.substring(0, 35)}... (${issue.comments} comments)`);
    });
    
    console.log('\nOldest open issues:');
    const oldestOpen = await client.listForRepo({
      state: 'open',
      sort: 'created',
      direction: 'asc',
      per_page: 3
    });
    
    oldestOpen.forEach(issue => {
      const created = new Date(issue.created_at);
      const daysOld = Math.floor((Date.now() - created) / (1000 * 60 * 60 * 24));
      console.log(`  #${issue.number} - ${issue.title.substring(0, 35)}... (${daysOld} days old)`);
    });
    console.log();

    // Example 7: Check assignee availability
    console.log('7️⃣ Assignee management...');
    const availableAssignees = await client.listAssignees({
      per_page: 5
    });
    
    console.log(`${availableAssignees.length} available assignees:`);
    availableAssignees.forEach(user => {
      console.log(`  @${user.login} - ${user.name || 'No name'}`);
    });
    
    // Check if specific user can be assigned
    if (availableAssignees.length > 0) {
      const testUser = availableAssignees[0].login;
      const canAssign = await client.checkAssignee(testUser);
      console.log(`Can assign @${testUser}: ${canAssign ? 'Yes' : 'No'}`);
    }
    console.log();

    // Example 8: Organization-wide issues (if applicable)
    console.log('8️⃣ Organization-wide view...');
    
    if (owner && !owner.includes('-')) {  // Simple check if it might be an org
      try {
        const orgIssues = await client.listForOrg(owner, {
          filter: 'all',
          state: 'open',
          per_page: 5
        });
        
        console.log(`Found ${orgIssues.length} organization-wide issues:`);
        orgIssues.forEach(issue => {
          const repoName = issue.repository?.name || 'unknown';
          console.log(`  ${repoName}#${issue.number} - ${issue.title.substring(0, 30)}...`);
        });
      } catch (error) {
        console.log('Unable to fetch organization issues (might not be an org or insufficient permissions)');
      }
    } else {
      console.log('Skipping org-wide view (not an organization)');
    }
    console.log();

    // Example 9: Issue statistics
    console.log('9️⃣ Issue statistics...');
    
    // Get counts for different states
    const openCount = (await client.listForRepo({ state: 'open', per_page: 1, includePagination: true }))
      .pagination.total || 'unknown';
    const closedCount = (await client.listForRepo({ state: 'closed', per_page: 1, includePagination: true }))
      .pagination.total || 'unknown';
    
    console.log('Repository issue statistics:');
    console.log(`  Open issues: ${openCount}`);
    console.log(`  Closed issues: ${closedCount}`);
    
    // Get issues by state reason
    const completed = await client.listForRepo({
      state: 'closed',
      per_page: 100
    });
    
    const stateReasons = {};
    completed.forEach(issue => {
      const reason = issue.state_reason || 'unspecified';
      stateReasons[reason] = (stateReasons[reason] || 0) + 1;
    });
    
    console.log('  Closure reasons (from last 100 closed):');
    Object.entries(stateReasons).forEach(([reason, count]) => {
      console.log(`    ${reason}: ${count}`);
    });

    console.log('\n✅ Advanced filtering examples completed!');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.name === 'ValidationError' && error.errors) {
      console.error('Validation errors:', error.errors);
    }
    process.exit(1);
  }
}

// Show usage
if (process.argv.includes('--help')) {
  console.log('Usage: node advanced-filters.mjs [owner/repo]');
  console.log('Example: node advanced-filters.mjs microsoft/typescript');
  console.log('\nDefault: nodejs/node');
  process.exit(0);
}

// Run the examples
main().catch(console.error);