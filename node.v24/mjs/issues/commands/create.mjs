/**
 * Create issue command
 */

import ora from 'ora';
import inquirer from 'inquirer';
import { formatIssue, formatError, formatSuccess } from '../utils/format.mjs';

export default {
  async execute(client, options) {
    let issueData = {};
    
    // Interactive mode
    if (options.interactive) {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'title',
          message: 'Issue title:',
          validate: input => input.trim() !== '' || 'Title is required'
        },
        {
          type: 'editor',
          name: 'body',
          message: 'Issue description (opens in editor):'
        },
        {
          type: 'input',
          name: 'labels',
          message: 'Labels (comma-separated, optional):'
        },
        {
          type: 'input',
          name: 'assignees',
          message: 'Assignees (comma-separated usernames, optional):'
        },
        {
          type: 'input',
          name: 'milestone',
          message: 'Milestone number (optional):'
        }
      ]);
      
      issueData = {
        title: answers.title,
        body: answers.body || '',
        labels: answers.labels ? answers.labels.split(',').map(l => l.trim()).filter(l => l) : [],
        assignees: answers.assignees ? answers.assignees.split(',').map(a => a.trim()).filter(a => a) : [],
        milestone: answers.milestone ? parseInt(answers.milestone) : null
      };
    } else {
      // Command-line mode
      if (!options.title) {
        throw new Error('Issue title is required. Use --title or -i for interactive mode');
      }
      
      issueData = {
        title: options.title,
        body: options.body || '',
        labels: options.labels ? options.labels.split(',').map(l => l.trim()).filter(l => l) : [],
        assignees: options.assignees ? options.assignees.split(',').map(a => a.trim()).filter(a => a) : [],
        milestone: options.milestone ? parseInt(options.milestone) : null
      };
    }
    
    const spinner = ora('Creating issue...').start();
    
    try {
      const issue = await client.create(issueData);
      spinner.succeed(formatSuccess(`Issue #${issue.number} created`));
      console.log(formatIssue(issue, options.output || 'text'));
    } catch (error) {
      spinner.fail();
      throw error;
    }
  }
};