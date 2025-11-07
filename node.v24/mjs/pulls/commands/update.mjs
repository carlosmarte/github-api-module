/**
 * Update pull request command
 */

export default async function updateCommand(client, options) {
  const data = {};
  
  if (options.title) data.title = options.title;
  if (options.body) data.body = options.body;
  if (options.base) data.base = options.base;
  if (options.state) data.state = options.state;
  
  if (Object.keys(data).length === 0) {
    throw new Error('No update fields provided');
  }
  
  const pr = await client.update(options.number, data);
  console.log(`✓ Pull request #${pr.number} updated`);
  
  return pr;
}