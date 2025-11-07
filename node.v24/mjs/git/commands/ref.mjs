import { formatOutput } from '../utils/format.mjs';

export class RefCommands {
  constructor(client) {
    this.client = client;
  }

  register(program) {
    program
      .command('create')
      .description('Create a new reference')
      .requiredOption('-o, --owner <owner>', 'Repository owner')
      .requiredOption('-r, --repo <repo>', 'Repository name')
      .requiredOption('--ref <ref>', 'Reference name (e.g., refs/heads/feature)')
      .requiredOption('-s, --sha <sha>', 'SHA1 value for this reference')
      .option('--json', 'Output as JSON')
      .action(async (options) => {
        try {
          const result = await this.client.createRef(
            options.owner,
            options.repo,
            options.ref,
            options.sha
          );

          formatOutput(result, options.json);
        } catch (error) {
          console.error('Error creating reference:', error.message);
          process.exit(1);
        }
      });

    program
      .command('get')
      .description('Get a reference')
      .requiredOption('-o, --owner <owner>', 'Repository owner')
      .requiredOption('-r, --repo <repo>', 'Repository name')
      .requiredOption('--ref <ref>', 'Reference name (e.g., heads/main)')
      .option('--json', 'Output as JSON')
      .action(async (options) => {
        try {
          const result = await this.client.getRef(
            options.owner,
            options.repo,
            options.ref
          );

          formatOutput(result, options.json);
        } catch (error) {
          console.error('Error getting reference:', error.message);
          process.exit(1);
        }
      });

    program
      .command('list')
      .description('List matching references')
      .requiredOption('-o, --owner <owner>', 'Repository owner')
      .requiredOption('-r, --repo <repo>', 'Repository name')
      .requiredOption('--ref <ref>', 'Reference pattern to match')
      .option('--json', 'Output as JSON')
      .action(async (options) => {
        try {
          const result = await this.client.listMatchingRefs(
            options.owner,
            options.repo,
            options.ref
          );

          formatOutput(result, options.json);
        } catch (error) {
          console.error('Error listing references:', error.message);
          process.exit(1);
        }
      });

    program
      .command('update')
      .description('Update a reference')
      .requiredOption('-o, --owner <owner>', 'Repository owner')
      .requiredOption('-r, --repo <repo>', 'Repository name')
      .requiredOption('--ref <ref>', 'Reference name (e.g., heads/main)')
      .requiredOption('-s, --sha <sha>', 'New SHA1 value')
      .option('-f, --force', 'Force update (non-fast-forward)')
      .option('--json', 'Output as JSON')
      .action(async (options) => {
        try {
          const result = await this.client.updateRef(
            options.owner,
            options.repo,
            options.ref,
            options.sha,
            options.force
          );

          formatOutput(result, options.json);
        } catch (error) {
          console.error('Error updating reference:', error.message);
          process.exit(1);
        }
      });

    program
      .command('delete')
      .description('Delete a reference')
      .requiredOption('-o, --owner <owner>', 'Repository owner')
      .requiredOption('-r, --repo <repo>', 'Repository name')
      .requiredOption('--ref <ref>', 'Reference name (e.g., heads/feature)')
      .option('--json', 'Output as JSON')
      .action(async (options) => {
        try {
          const result = await this.client.deleteRef(
            options.owner,
            options.repo,
            options.ref
          );

          if (options.json) {
            console.log(JSON.stringify(result, null, 2));
          } else {
            console.log('Reference deleted successfully');
          }
        } catch (error) {
          console.error('Error deleting reference:', error.message);
          process.exit(1);
        }
      });
  }
}