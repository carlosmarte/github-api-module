/**
 * List issues command
 */

import ora from 'ora';
import { formatOutput, formatError, formatWarning } from '../utils/format.mjs';
import { collectAllPages } from '../utils/pagination.mjs';

export default {
  async execute(client, options) {
    const spinner = ora('Fetching issues...').start();
    
    try {
      let issues;
      
      // Prepare filter options
      const listOptions = {
        state: options.state || 'open',
        sort: options.sort || 'created',
        direction: options.direction || 'desc',
        per_page: options.limit || 30,
        page: 1
      };
      
      // Add optional filters
      if (options.labels) {
        listOptions.labels = options.labels;
      }
      if (options.assignee) {
        listOptions.assignee = options.assignee;
      }
      if (options.creator) {
        listOptions.creator = options.creator;
      }
      if (options.milestone) {
        listOptions.milestone = options.milestone;
      }
      if (options.since) {
        listOptions.since = options.since;
      }
      
      // Determine which list method to use
      if (options.org) {
        // List for organization
        if (options.all) {
          issues = await collectAllPages(
            (opts) => client.listForOrg(options.org, { ...opts, includePagination: true }),
            listOptions,
            options.limit
          );
        } else {
          issues = await client.listForOrg(options.org, listOptions);
        }
      } else if (client.owner && client.repo) {
        // List for repository
        if (options.all) {
          issues = await collectAllPages(
            (opts) => client.listForRepo({ ...opts, includePagination: true }),
            listOptions,
            options.limit
          );
        } else {
          issues = await client.listForRepo(listOptions);
        }
      } else {
        // List for authenticated user
        if (options.all) {
          issues = await collectAllPages(
            (opts) => client.list({ ...opts, includePagination: true }),
            listOptions,
            options.limit
          );
        } else {
          issues = await client.list(listOptions);
        }
      }
      
      spinner.succeed(`Found ${issues.length} issue${issues.length !== 1 ? 's' : ''}`);
      
      if (issues.length === 0) {
        console.log(formatWarning('No issues found matching the criteria'));
        return;
      }
      
      console.log(formatOutput(issues, options));
      
      // Show pagination info if not fetching all
      if (!options.all && issues.length === listOptions.per_page) {
        console.log(formatWarning('\nMore results may be available. Use --all to fetch all pages.'));
      }
      
    } catch (error) {
      spinner.fail();
      throw error;
    }
  }
};