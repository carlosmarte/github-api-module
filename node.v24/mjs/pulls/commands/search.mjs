/**
 * Search pull requests command
 */

export default async function searchCommand(client, options) {
  // Build search query
  let query = options.query;
  
  // Add repository qualifier if specified
  if (options.repo || (client.owner && client.repo)) {
    const repo = options.repo || `${client.owner}/${client.repo}`;
    query += ` repo:${repo}`;
  }
  
  // Add type qualifier (pull requests only)
  query += ' type:pr';
  
  // Add other qualifiers
  if (options.author) query += ` author:${options.author}`;
  if (options.assignee) query += ` assignee:${options.assignee}`;
  if (options.label) query += ` label:"${options.label}"`;
  
  const searchOptions = {
    sort: options.sort || 'created',
    order: options.order || 'desc',
    per_page: options.limit || 30
  };
  
  const results = await client.search(query, searchOptions);
  
  console.log(`Found ${results.total_count} pull requests`);
  
  // Return just the items for formatting
  return results.items;
}