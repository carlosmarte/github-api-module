import { formatOutput } from '../utils/format.mjs';

export class TreeCommands {
  constructor(client) {
    this.client = client;
  }

  register(program) {
    program
      .command('create')
      .description('Create a new tree')
      .requiredOption('-o, --owner <owner>', 'Repository owner')
      .requiredOption('-r, --repo <repo>', 'Repository name')
      .requiredOption('-t, --tree <tree>', 'Tree entries as JSON string')
      .option('-b, --base-tree <baseTree>', 'Base tree SHA')
      .option('--json', 'Output as JSON')
      .action(async (options) => {
        try {
          let tree;
          try {
            tree = JSON.parse(options.tree);
          } catch (e) {
            throw new Error('Invalid tree JSON: ' + e.message);
          }

          const result = await this.client.createTree(
            options.owner,
            options.repo,
            tree,
            options.baseTree
          );

          formatOutput(result, options.json);
        } catch (error) {
          console.error('Error creating tree:', error.message);
          process.exit(1);
        }
      });

    program
      .command('get')
      .description('Get a tree')
      .requiredOption('-o, --owner <owner>', 'Repository owner')
      .requiredOption('-r, --repo <repo>', 'Repository name')
      .requiredOption('-s, --sha <sha>', 'Tree SHA')
      .option('--recursive', 'Get tree recursively')
      .option('--json', 'Output as JSON')
      .action(async (options) => {
        try {
          const result = await this.client.getTree(
            options.owner,
            options.repo,
            options.sha,
            options.recursive
          );

          if (options.json) {
            console.log(JSON.stringify(result, null, 2));
          } else {
            console.log(`Tree SHA: ${result.sha}`);
            console.log(`Truncated: ${result.truncated}`);
            console.log(`\nTree entries (${result.tree.length}):`);
            result.tree.forEach(entry => {
              console.log(`  ${entry.mode} ${entry.type.padEnd(6)} ${entry.sha.substring(0, 7)}  ${entry.path}`);
            });
          }
        } catch (error) {
          console.error('Error getting tree:', error.message);
          process.exit(1);
        }
      });
  }
}