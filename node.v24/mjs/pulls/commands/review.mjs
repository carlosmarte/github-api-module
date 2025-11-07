/**
 * Review pull request command
 */

import inquirer from 'inquirer';

export default async function reviewCommand(client, options) {
  let reviewData = {};
  
  if (options.interactive) {
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'event',
        message: 'Review action:',
        choices: [
          { name: 'Approve', value: 'APPROVE' },
          { name: 'Request changes', value: 'REQUEST_CHANGES' },
          { name: 'Comment only', value: 'COMMENT' }
        ]
      },
      {
        type: 'editor',
        name: 'body',
        message: 'Review comment:'
      }
    ]);
    
    reviewData = answers;
  } else {
    // Determine review event from options
    if (options.approve) {
      reviewData.event = 'APPROVE';
    } else if (options.requestChanges) {
      reviewData.event = 'REQUEST_CHANGES';
    } else {
      reviewData.event = 'COMMENT';
    }
    
    reviewData.body = options.comment || '';
  }
  
  const review = await client.createReview(options.number, reviewData);
  
  console.log(`✓ Review submitted for PR #${options.number}`);
  console.log(`  Status: ${reviewData.event}`);
  
  return review;
}