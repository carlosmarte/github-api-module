/**
 * Get pull request details command
 */

export default async function getCommand(client, options) {
  const pr = await client.get(options.number);
  
  // Add additional data if requested
  if (options.comments) {
    pr.comments_list = await client.listReviewComments(options.number);
  }
  
  if (options.reviews) {
    pr.reviews_list = await client.listReviews(options.number);
  }
  
  if (options.commits) {
    pr.commits_list = await client.listCommits(options.number);
  }
  
  if (options.files) {
    pr.files_list = await client.listFiles(options.number);
  }
  
  return pr;
}