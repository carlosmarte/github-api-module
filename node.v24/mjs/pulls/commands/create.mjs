/**
 * Create pull request command
 */

import inquirer from 'inquirer';

export default async function createCommand(client, options) {
  let data = {};
  
  if (options.interactive) {
    // Interactive mode - prompt for details
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'title',
        message: 'Pull request title:',
        validate: (input) => input.length > 0 || 'Title is required'
      },
      {
        type: 'editor',
        name: 'body',
        message: 'Pull request description (optional):'
      },
      {
        type: 'input',
        name: 'head',
        message: 'Head branch (source):',
        validate: (input) => input.length > 0 || 'Head branch is required'
      },
      {
        type: 'input',
        name: 'base',
        message: 'Base branch (target):',
        default: 'main',
        validate: (input) => input.length > 0 || 'Base branch is required'
      },
      {
        type: 'confirm',
        name: 'draft',
        message: 'Create as draft?',
        default: false
      },
      {
        type: 'confirm',
        name: 'maintainer_can_modify',
        message: 'Allow maintainers to edit?',
        default: true
      }
    ]);
    
    data = answers;
  } else {
    // Command line mode
    if (!options.title || !options.head || !options.base) {
      throw new Error('Title, head, and base are required. Use --interactive for guided creation.');
    }
    
    data = {
      title: options.title,
      body: options.body || '',
      head: options.head,
      base: options.base || 'main',
      draft: options.draft || false,
      maintainer_can_modify: options.maintainerCanModify !== false
    };
  }
  
  // Create the pull request
  const pr = await client.create(data);
  console.log(`✓ Pull request #${pr.number} created: ${pr.html_url}`);
  
  return pr;
}