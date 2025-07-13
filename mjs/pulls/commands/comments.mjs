/**
 * Comments command for pull requests
 */

export default async function commentsCommand(client, options) {
  if (options.add) {
    // Add a comment (simplified - would need more details for line comments)
    const comment = await client.createReviewComment(options.number, {
      body: options.add,
      commit_id: 'HEAD', // Would need to get actual commit SHA
      path: '', // Would need file path for line comments
      position: 1
    });
    
    console.log(`✓ Comment added to PR #${options.number}`);
    return comment;
  }
  
  // List comments
  const comments = await client.listReviewComments(options.number);
  return comments;
}