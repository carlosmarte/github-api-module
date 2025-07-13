/**
 * @fileoverview Branch command handlers for CLI
 * @module cli/commands/branches
 */

import chalk from 'chalk';
import Table from 'cli-table3';

/**
 * Display list of branches
 */
export async function displayBranchList(branches, options = {}) {
  if (options.json) {
    console.log(JSON.stringify(branches, null, 2));
    return;
  }
  
  if (branches.length === 0) {
    console.log(chalk.yellow('No branches found.'));
    return;
  }
  
  const table = new Table({
    head: ['Name', 'Protected', 'SHA', 'Commit Message'],
    colWidths: [25, 12, 12, 40],
    wordWrap: true
  });
  
  for (const branch of branches) {
    const protected = branch.protected ? chalk.green('✓') : chalk.dim('✗');
    const sha = branch.commit.sha.substring(0, 8);
    const message = branch.commit.commit.message.split('\n')[0];
    const shortMessage = message.length > 35 ? message.substring(0, 32) + '...' : message;
    
    table.push([
      branch.name,
      protected,
      chalk.dim(sha),
      shortMessage
    ]);
  }
  
  console.log(table.toString());
  
  console.log();
  console.log(chalk.dim(`Total: ${branches.length} branches`));
  console.log(chalk.dim(`Protected: ${branches.filter(b => b.protected).length}`));
}