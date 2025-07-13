/**
 * List pull requests command
 */

import { collectAllPages } from '../utils/pagination.mjs';

export default async function listCommand(client, options) {
  const listOptions = {
    state: options.state || 'open',
    base: options.base,
    head: options.head,
    sort: options.sort || 'created',
    direction: options.direction || 'desc',
    per_page: options.limit || 30
  };
  
  // If fetching all pages
  if (options.all) {
    return await collectAllPages(
      (page) => client.list({ ...listOptions, page }),
      { maxPages: options.limit ? Math.ceil(options.limit / 30) : Infinity }
    );
  }
  
  // Single page fetch
  return await client.list(listOptions);
}