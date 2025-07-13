/**
 * Milestones management command
 */

import ora from 'ora';
import { formatMilestone, formatError, formatSuccess } from '../utils/format.mjs';

export default {
  async execute(client, options) {
    const action = options.action?.toLowerCase();
    
    switch (action) {
      case 'list':
        await listMilestones(client, options);
        break;
      
      case 'create':
        await createMilestone(client, options);
        break;
      
      case 'update':
        await updateMilestone(client, options);
        break;
      
      case 'delete':
        await deleteMilestone(client, options);
        break;
      
      default:
        throw new Error(`Unknown action: ${action}. Use: list, create, update, delete`);
    }
  }
};

async function listMilestones(client, options) {
  const spinner = ora('Fetching milestones...').start();
  
  try {
    const milestones = await client.listMilestones({
      state: options.state || 'open'
    });
    
    spinner.succeed(`Found ${milestones.length} milestones`);
    
    milestones.forEach(milestone => {
      console.log(`\n#${milestone.number} ${formatMilestone(milestone)}`);
    });
  } catch (error) {
    spinner.fail();
    throw error;
  }
}

async function createMilestone(client, options) {
  if (!options.title) {
    throw new Error('Milestone title is required');
  }
  
  const data = {
    title: options.title,
    description: options.description,
    due_on: options.due,
    state: options.state || 'open'
  };
  
  const spinner = ora('Creating milestone...').start();
  
  try {
    const milestone = await client.createMilestone(data);
    spinner.succeed(formatSuccess(`Milestone #${milestone.number} created`));
    console.log(formatMilestone(milestone));
  } catch (error) {
    spinner.fail();
    throw error;
  }
}

async function updateMilestone(client, options) {
  if (!options.number) {
    throw new Error('Milestone number is required');
  }
  
  const data = {};
  if (options.title) data.title = options.title;
  if (options.description) data.description = options.description;
  if (options.due) data.due_on = options.due;
  if (options.state) data.state = options.state;
  
  const spinner = ora('Updating milestone...').start();
  
  try {
    const milestone = await client.updateMilestone(options.number, data);
    spinner.succeed(formatSuccess(`Milestone #${milestone.number} updated`));
    console.log(formatMilestone(milestone));
  } catch (error) {
    spinner.fail();
    throw error;
  }
}

async function deleteMilestone(client, options) {
  if (!options.number) {
    throw new Error('Milestone number is required');
  }
  
  const spinner = ora('Deleting milestone...').start();
  
  try {
    await client.deleteMilestone(options.number);
    spinner.succeed(formatSuccess(`Milestone #${options.number} deleted`));
  } catch (error) {
    spinner.fail();
    throw error;
  }
}