/**
 * @fileoverview Status command implementation
 * @module commands/status
 */

import chalk from 'chalk';
import { GitClient } from '../../client/GitClient.mjs';
import { GitError } from '../../utils/errors.mjs';

/**
 * Execute status command
 * @param {string} repoName - Repository name
 * @param {Object} options - Command options
 * @param {Object} globalOptions - Global CLI options
 */
export async function statusCommand(repoName, options, globalOptions) {
  try {
    const client = new GitClient({
      baseDir: globalOptions.baseDir,
      token: globalOptions.token,
      verbose: globalOptions.verbose,
      timeout: parseInt(globalOptions.timeout)
    });
    
    const result = await client.status(repoName);
    
    if (!globalOptions.quiet && !globalOptions.json) {
      console.log(chalk.green(`Repository: ${result.name}`));
      console.log(chalk.cyan('Path:'), result.path);
      console.log(chalk.cyan('Branch:'), result.branch);
      console.log(chalk.cyan('Modified:'), result.status.modified.length);
      console.log(chalk.cyan('Staged:'), result.status.staged.length);
      console.log(chalk.cyan('Untracked:'), result.status.not_added.length);
      console.log(chalk.cyan('Behind:'), result.status.behind);
      console.log(chalk.cyan('Ahead:'), result.status.ahead);
      
      if (result.recentCommits.length > 0) {
        console.log(chalk.cyan('Recent commits:'));
        result.recentCommits.slice(0, 3).forEach(commit => {
          console.log(`  ${chalk.yellow(commit.hash.substring(0, 7))} ${commit.message}`);
        });
      }
    }

    return result;

  } catch (error) {
    throw new GitError(`Status operation failed: ${error.message}`, error);
  }
}

/**
 * Status command configuration for Commander.js
 */
export const statusCommandConfig = {
  command: 'status <repo-name>',
  description: 'Show repository status',
  options: []
};