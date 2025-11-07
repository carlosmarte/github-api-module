/**
 * Files command - show changed files in a pull request
 */

import chalk from 'chalk';
import { formatFileChanges } from '../utils/format.mjs';

export default async function filesCommand(client, options) {
  const files = await client.listFiles(options.number);
  
  if (options.namesOnly) {
    // Just return file names
    return files.map(f => f.filename);
  }
  
  if (options.stats) {
    // Return with statistics
    const stats = {
      total_files: files.length,
      additions: files.reduce((sum, f) => sum + (f.additions || 0), 0),
      deletions: files.reduce((sum, f) => sum + (f.deletions || 0), 0),
      files: files.map(f => ({
        filename: f.filename,
        status: f.status,
        additions: f.additions,
        deletions: f.deletions,
        changes: f.changes
      }))
    };
    
    console.log(chalk.bold(`\nFiles changed: ${stats.total_files}`));
    console.log(chalk.green(`+${stats.additions} additions`));
    console.log(chalk.red(`-${stats.deletions} deletions`));
    console.log('');
    
    return stats;
  }
  
  // Default: formatted file list
  console.log(formatFileChanges(files, { showChanges: true }));
  return files;
}