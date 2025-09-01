/**
 * @fileoverview Clone command implementation
 * @module commands/clone
 */

import chalk from 'chalk';
import ora from 'ora';
import { GitClient } from '../../client/GitClient.mjs';
import { GitError } from '../../utils/errors.mjs';

/**
 * Execute clone command
 * @param {string} repoUrl - Repository URL to clone
 * @param {string} targetDir - Target directory name
 * @param {Object} options - Command options
 * @param {Object} globalOptions - Global CLI options
 */
export async function cloneCommand(repoUrl, targetDir, options, globalOptions) {
  const spinner = globalOptions.quiet ? null : ora('Cloning repository...').start();
  
  try {
    const client = new GitClient({
      baseDir: globalOptions.baseDir,
      token: globalOptions.token,
      verbose: globalOptions.verbose,
      timeout: parseInt(globalOptions.timeout)
    });
    
    if (spinner) {
      spinner.text = `Cloning ${repoUrl}...`;
    }
    
    const result = await client.clone(repoUrl, targetDir, {
      branch: options.branch,
      depth: options.depth,
      bare: options.bare,
      progress: (data) => {
        if (spinner) {
          spinner.text = `Cloning ${repoUrl}... ${data}`;
        }
      }
    });

    if (spinner) {
      spinner.succeed(`Successfully cloned to ${result.name}`);
    }
    
    if (!globalOptions.quiet && !globalOptions.json) {
      console.log(chalk.green('✓ Repository cloned successfully'));
      console.log(chalk.cyan('Path:'), result.path);
      console.log(chalk.cyan('Branch:'), result.branch);
      if (result.remotes.length > 0) {
        console.log(chalk.cyan('Remote:'), result.remotes[0].refs.fetch);
      }
    }

    return result;

  } catch (error) {
    if (spinner) {
      spinner.fail('Clone failed');
    }
    throw new GitError(`Clone operation failed: ${error.message}`, error);
  }
}

/**
 * Clone command configuration for Commander.js
 */
export const cloneCommandConfig = {
  command: 'clone <repo-url> [target-dir]',
  description: 'Clone a repository',
  options: [
    ['-b, --branch <branch>', 'Specific branch to clone'],
    ['--depth <depth>', 'Clone depth for shallow clone', parseInt],
    ['--bare', 'Create bare repository']
  ]
};