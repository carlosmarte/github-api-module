/**
 * @fileoverview Collaborator command handlers for CLI
 * @module cli/commands/collaborators
 */

import chalk from 'chalk';
import Table from 'cli-table3';

/**
 * Display list of collaborators
 */
export async function displayCollaboratorList(collaborators, options = {}) {
  if (options.json) {
    console.log(JSON.stringify(collaborators, null, 2));
    return;
  }
  
  if (collaborators.length === 0) {
    console.log(chalk.yellow('No collaborators found.'));
    return;
  }
  
  const table = new Table({
    head: ['User', 'Type', 'Permission', 'Role'],
    colWidths: [25, 15, 15, 20],
    wordWrap: true
  });
  
  for (const collaborator of collaborators) {
    const userDisplay = `${collaborator.login}${collaborator.type === 'Bot' ? ' 🤖' : ''}`;
    const type = collaborator.type || 'User';
    
    // Determine permission level
    let permission = 'read';
    let role = 'Read';
    
    if (collaborator.permissions) {
      if (collaborator.permissions.admin) {
        permission = 'admin';
        role = chalk.red('Admin');
      } else if (collaborator.permissions.maintain) {
        permission = 'maintain';
        role = chalk.yellow('Maintain');
      } else if (collaborator.permissions.push) {
        permission = 'write';
        role = chalk.blue('Write');
      } else if (collaborator.permissions.triage) {
        permission = 'triage';
        role = chalk.green('Triage');
      } else {
        role = chalk.dim('Read');
      }
    }
    
    table.push([
      userDisplay,
      type,
      permission,
      role
    ]);
  }
  
  console.log(table.toString());
  
  // Summary
  const stats = {
    total: collaborators.length,
    users: collaborators.filter(c => c.type !== 'Bot').length,
    bots: collaborators.filter(c => c.type === 'Bot').length,
    admins: collaborators.filter(c => c.permissions?.admin).length,
    writers: collaborators.filter(c => c.permissions?.push && !c.permissions?.admin).length
  };
  
  console.log();
  console.log(chalk.dim(`Total: ${stats.total} collaborators`));
  console.log(chalk.dim(`Users: ${stats.users}, Bots: ${stats.bots}`));
  console.log(chalk.dim(`Admins: ${stats.admins}, Writers: ${stats.writers}`));
}