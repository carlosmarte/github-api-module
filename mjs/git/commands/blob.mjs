import fs from 'fs/promises';
import { formatOutput } from '../utils/format.mjs';

export class BlobCommands {
  constructor(client) {
    this.client = client;
  }

  register(program) {
    program
      .command('create')
      .description('Create a new blob')
      .requiredOption('-o, --owner <owner>', 'Repository owner')
      .requiredOption('-r, --repo <repo>', 'Repository name')
      .option('-c, --content <content>', 'Blob content')
      .option('-f, --file <file>', 'Read content from file')
      .option('-e, --encoding <encoding>', 'Content encoding (utf-8 or base64)', 'utf-8')
      .option('--json', 'Output as JSON')
      .action(async (options) => {
        try {
          let content = options.content;
          
          if (options.file) {
            const buffer = await fs.readFile(options.file);
            if (options.encoding === 'base64') {
              content = buffer.toString('base64');
            } else {
              content = buffer.toString('utf-8');
            }
          }

          if (!content) {
            throw new Error('Either --content or --file must be provided');
          }

          const result = await this.client.createBlob(
            options.owner,
            options.repo,
            content,
            options.encoding
          );

          formatOutput(result, options.json);
        } catch (error) {
          console.error('Error creating blob:', error.message);
          process.exit(1);
        }
      });

    program
      .command('get')
      .description('Get a blob')
      .requiredOption('-o, --owner <owner>', 'Repository owner')
      .requiredOption('-r, --repo <repo>', 'Repository name')
      .requiredOption('-s, --sha <sha>', 'Blob SHA')
      .option('--save <file>', 'Save content to file')
      .option('--json', 'Output as JSON')
      .action(async (options) => {
        try {
          const result = await this.client.getBlob(
            options.owner,
            options.repo,
            options.sha
          );

          if (options.save) {
            let content = result.content;
            if (result.encoding === 'base64') {
              content = Buffer.from(content, 'base64');
            }
            await fs.writeFile(options.save, content);
            console.log(`Blob saved to ${options.save}`);
          } else {
            formatOutput(result, options.json);
          }
        } catch (error) {
          console.error('Error getting blob:', error.message);
          process.exit(1);
        }
      });
  }
}