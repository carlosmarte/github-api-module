import { formatOutput } from '../utils/format.mjs';

export class CommitCommands {
  constructor(client) {
    this.client = client;
  }

  register(program) {
    program
      .command('create')
      .description('Create a new commit')
      .requiredOption('-o, --owner <owner>', 'Repository owner')
      .requiredOption('-r, --repo <repo>', 'Repository name')
      .requiredOption('-m, --message <message>', 'Commit message')
      .requiredOption('-t, --tree <tree>', 'Tree SHA')
      .option('-p, --parents <parents...>', 'Parent commit SHAs')
      .option('--author-name <name>', 'Author name')
      .option('--author-email <email>', 'Author email')
      .option('--author-date <date>', 'Author date (ISO 8601)')
      .option('--committer-name <name>', 'Committer name')
      .option('--committer-email <email>', 'Committer email')
      .option('--committer-date <date>', 'Committer date (ISO 8601)')
      .option('--json', 'Output as JSON')
      .action(async (options) => {
        try {
          let author = null;
          let committer = null;

          if (options.authorName || options.authorEmail) {
            author = {
              name: options.authorName,
              email: options.authorEmail,
              date: options.authorDate || new Date().toISOString()
            };
          }

          if (options.committerName || options.committerEmail) {
            committer = {
              name: options.committerName,
              email: options.committerEmail,
              date: options.committerDate || new Date().toISOString()
            };
          }

          const result = await this.client.createCommit(
            options.owner,
            options.repo,
            options.message,
            options.tree,
            options.parents || [],
            author,
            committer
          );

          formatOutput(result, options.json);
        } catch (error) {
          console.error('Error creating commit:', error.message);
          process.exit(1);
        }
      });

    program
      .command('get')
      .description('Get a commit')
      .requiredOption('-o, --owner <owner>', 'Repository owner')
      .requiredOption('-r, --repo <repo>', 'Repository name')
      .requiredOption('-s, --sha <sha>', 'Commit SHA')
      .option('--json', 'Output as JSON')
      .action(async (options) => {
        try {
          const result = await this.client.getCommit(
            options.owner,
            options.repo,
            options.sha
          );

          formatOutput(result, options.json);
        } catch (error) {
          console.error('Error getting commit:', error.message);
          process.exit(1);
        }
      });
  }
}