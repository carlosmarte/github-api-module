// Main SDK export for programmatic usage
export { GitHubClient } from './lib/client.mjs';

// Re-export command classes for advanced usage
export { BlobCommands } from './commands/blob.mjs';
export { CommitCommands } from './commands/commit.mjs';
export { RefCommands } from './commands/ref.mjs';
export { TagCommands } from './commands/tag.mjs';
export { TreeCommands } from './commands/tree.mjs';

// Utility exports
export { formatOutput } from './utils/format.mjs';

// Default export for convenience
import { GitHubClient } from './lib/client.mjs';
export default GitHubClient;