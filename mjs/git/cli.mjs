#!/usr/bin/env node

import { program } from 'commander';
import { config } from 'dotenv';
import { BlobCommands } from './commands/blob.mjs';
import { CommitCommands } from './commands/commit.mjs';
import { RefCommands } from './commands/ref.mjs';
import { TagCommands } from './commands/tag.mjs';
import { TreeCommands } from './commands/tree.mjs';
import { GitHubClient } from './lib/client.mjs';

config();

const client = new GitHubClient({
  token: process.env.GITHUB_TOKEN,
  baseUrl: process.env.GITHUB_API_URL || 'https://api.github.com'
});

program
  .name('github-git')
  .description('GitHub Git API CLI')
  .version('1.0.0')
  .option('-t, --token <token>', 'GitHub API token', process.env.GITHUB_TOKEN)
  .option('--api-url <url>', 'GitHub API base URL', 'https://api.github.com');

// Blob commands
const blobCmd = program.command('blob').description('Manage Git blobs');
new BlobCommands(client).register(blobCmd);

// Commit commands
const commitCmd = program.command('commit').description('Manage Git commits');
new CommitCommands(client).register(commitCmd);

// Reference commands
const refCmd = program.command('ref').description('Manage Git references');
new RefCommands(client).register(refCmd);

// Tag commands
const tagCmd = program.command('tag').description('Manage Git tags');
new TagCommands(client).register(tagCmd);

// Tree commands
const treeCmd = program.command('tree').description('Manage Git trees');
new TreeCommands(client).register(treeCmd);

program.parse();