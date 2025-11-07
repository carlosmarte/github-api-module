import { formatOutput } from '../utils/format.mjs';

export class TagCommands {
  constructor(client) {
    this.client = client;
  }

  register(program) {
    program
      .command('create')
      .description('Create a new tag object')
      .requiredOption('-o, --owner <owner>', 'Repository owner')
      .requiredOption('-r, --repo <repo>', 'Repository name')
      .requiredOption('-t, --tag <tag>', 'Tag name (e.g., v1.0.0)')
      .requiredOption('-m, --message <message>', 'Tag message')
      .requiredOption('--object <object>', 'SHA of the git object this is tagging')
      .option('--type <type>', 'Object type (commit, tree, or blob)', 'commit')
      .option('--tagger-name <name>', 'Tagger name')
      .option('--tagger-email <email>', 'Tagger email')
      .option('--tagger-date <date>', 'Tagger date (ISO 8601)')
      .option('--json', 'Output as JSON')
      .action(async (options) => {
        try {
          let tagger = null;

          if (options.taggerName || options.taggerEmail) {
            tagger = {
              name: options.taggerName,
              email: options.taggerEmail,
              date: options.taggerDate || new Date().toISOString()
            };
          }

          const result = await this.client.createTag(
            options.owner,
            options.repo,
            options.tag,
            options.message,
            options.object,
            options.type,
            tagger
          );

          formatOutput(result, options.json);
        } catch (error) {
          console.error('Error creating tag:', error.message);
          process.exit(1);
        }
      });

    program
      .command('get')
      .description('Get a tag')
      .requiredOption('-o, --owner <owner>', 'Repository owner')
      .requiredOption('-r, --repo <repo>', 'Repository name')
      .requiredOption('-s, --sha <sha>', 'Tag SHA')
      .option('--json', 'Output as JSON')
      .action(async (options) => {
        try {
          const result = await this.client.getTag(
            options.owner,
            options.repo,
            options.sha
          );

          formatOutput(result, options.json);
        } catch (error) {
          console.error('Error getting tag:', error.message);
          process.exit(1);
        }
      });
  }
}