/**
 * @fileoverview Repository command handlers for CLI
 * @module cli/commands/repositories
 */

import chalk from 'chalk';
import Table from 'cli-table3';

/**
 * Display repository information
 */
export async function displayRepository(repo, options = {}) {
  if (options.json) {
    console.log(JSON.stringify(repo, null, 2));
    return;
  }
  
  const table = new Table({
    colWidths: [25, 50],
    wordWrap: true,
    style: { head: [], border: [] }
  });
  
  table.push(
    ['Name', chalk.bold(repo.full_name)],
    ['Description', repo.description || 'No description'],
    ['Language', repo.language || 'Not detected'],
    ['Stars', repo.stargazers_count?.toLocaleString() || '0'],
    ['Forks', repo.forks_count?.toLocaleString() || '0'],
    ['Issues', repo.open_issues_count?.toLocaleString() || '0'],
    ['Visibility', repo.private ? chalk.red('Private') : chalk.green('Public')],
    ['Default Branch', repo.default_branch || 'main'],
    ['Created', new Date(repo.created_at).toLocaleDateString()],
    ['Updated', new Date(repo.updated_at).toLocaleDateString()],
    ['Clone URL', repo.clone_url],
    ['Homepage', repo.homepage || 'None']
  );
  
  if (options.full) {
    table.push(
      ['Size', `${repo.size} KB`],
      ['Has Issues', repo.has_issues ? 'Yes' : 'No'],
      ['Has Projects', repo.has_projects ? 'Yes' : 'No'],
      ['Has Wiki', repo.has_wiki ? 'Yes' : 'No'],
      ['Has Discussions', repo.has_discussions ? 'Yes' : 'No'],
      ['Archived', repo.archived ? chalk.yellow('Yes') : 'No'],
      ['Disabled', repo.disabled ? chalk.red('Yes') : 'No']
    );
    
    if (repo.topics && repo.topics.length > 0) {
      table.push(['Topics', repo.topics.join(', ')]);
    }
    
    if (repo.license) {
      table.push(['License', repo.license.name]);
    }
  }
  
  console.log(table.toString());
}

/**
 * Display list of repositories
 */
export async function displayRepositoryList(repos, options = {}) {
  if (options.json) {
    console.log(JSON.stringify(repos, null, 2));
    return;
  }
  
  if (repos.length === 0) {
    console.log(chalk.yellow('No repositories found.'));
    return;
  }
  
  const table = new Table({
    head: ['Name', 'Description', 'Language', 'Stars', 'Forks', 'Updated'],
    colWidths: [30, 40, 15, 10, 10, 12],
    wordWrap: true
  });
  
  for (const repo of repos) {
    const visibility = repo.private ? chalk.red('🔒') : chalk.green('📖');
    const name = `${visibility} ${repo.full_name}`;
    const description = repo.description ? 
      (repo.description.length > 35 ? repo.description.substring(0, 32) + '...' : repo.description) :
      chalk.dim('No description');
    const language = repo.language || chalk.dim('N/A');
    const stars = repo.stargazers_count?.toLocaleString() || '0';
    const forks = repo.forks_count?.toLocaleString() || '0';
    const updated = new Date(repo.updated_at).toLocaleDateString();
    
    table.push([name, description, language, stars, forks, updated]);
  }
  
  console.log(table.toString());
  
  // Summary
  const total = repos.length;
  const publicRepos = repos.filter(r => !r.private).length;
  const privateRepos = repos.filter(r => r.private).length;
  const totalStars = repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0);
  
  console.log();
  console.log(chalk.dim(`Total: ${total} repositories`));
  console.log(chalk.dim(`Public: ${publicRepos}, Private: ${privateRepos}`));
  console.log(chalk.dim(`Total stars: ${totalStars.toLocaleString()}`));
}