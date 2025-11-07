/**
 * Assignees management command
 */

import ora from 'ora';
import { formatError, formatSuccess } from '../utils/format.mjs';

export default {
  async execute(client, options) {
    const action = options.action?.toLowerCase();
    
    switch (action) {
      case 'list':
        await listAssignees(client, options);
        break;
      
      case 'add':
        await addAssignees(client, options);
        break;
      
      case 'remove':
        await removeAssignees(client, options);
        break;
      
      default:
        throw new Error(`Unknown action: ${action}. Use: list, add, remove`);
    }
  }
};

async function listAssignees(client, options) {
  const spinner = ora('Fetching assignees...').start();
  
  try {
    const assignees = await client.listAssignees();
    spinner.succeed(`Found ${assignees.length} available assignees`);
    
    assignees.forEach(user => {
      console.log(`@${user.login} - ${user.name || 'No name'}`);
    });
  } catch (error) {
    spinner.fail();
    throw error;
  }
}

async function addAssignees(client, options) {
  if (!options.number || !options.assignees) {
    throw new Error('Issue number and assignees are required');
  }
  
  const assignees = options.assignees.split(',').map(a => a.trim()).filter(a => a);
  const spinner = ora('Adding assignees...').start();
  
  try {
    const issue = await client.addAssignees(options.number, assignees);
    spinner.succeed(formatSuccess(`Assignees added to issue #${issue.number}`));
    console.log('Assignees:', issue.assignees.map(a => `@${a.login}`).join(', '));
  } catch (error) {
    spinner.fail();
    throw error;
  }
}

async function removeAssignees(client, options) {
  if (!options.number || !options.assignees) {
    throw new Error('Issue number and assignees are required');
  }
  
  const assignees = options.assignees.split(',').map(a => a.trim()).filter(a => a);
  const spinner = ora('Removing assignees...').start();
  
  try {
    const issue = await client.removeAssignees(options.number, assignees);
    spinner.succeed(formatSuccess(`Assignees removed from issue #${issue.number}`));
    console.log('Remaining assignees:', issue.assignees.map(a => `@${a.login}`).join(', ') || 'None');
  } catch (error) {
    spinner.fail();
    throw error;
  }
}