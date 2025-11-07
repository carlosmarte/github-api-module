# GitHub Gist API Client

A comprehensive Node.js CLI tool and SDK for managing GitHub Gists. Built with ES modules and featuring both programmatic and command-line interfaces.

## Features

- 🚀 **Full API Coverage**: All GitHub Gist API endpoints implemented
- 💻 **Dual Interface**: Use as CLI tool or programmatic SDK
- 📄 **Multiple Formats**: JSON, YAML, and table output
- 🔄 **Auto Pagination**: Built-in pagination support with async iterators
- 🔒 **Authentication**: Multiple auth methods (env vars, config file, flags)
- ⚡ **Modern Code**: ES modules with Node.js 18+ support
- 🎨 **Rich CLI**: Interactive mode, progress indicators, colored output
- 📝 **TypeScript**: Full type definitions included
- 🔁 **Retry Logic**: Automatic retry with exponential backoff
- ⏱️ **Rate Limiting**: Smart rate limit handling

## Installation

```bash
# Install globally for CLI usage
npm install -g @github-api/gist

# Install locally for SDK usage
npm install @github-api/gist
```

## Authentication

Set up authentication using one of these methods:

1. **Environment Variable** (recommended):
```bash
export GITHUB_TOKEN=your_personal_access_token
# or
export GH_TOKEN=your_personal_access_token
```

2. **Configuration File**:
```bash
gist config set token your_personal_access_token
```

3. **CLI Flag**:
```bash
gist --token your_personal_access_token list
```

## CLI Usage

### Basic Commands

```bash
# List your gists
gist list
gist ls

# List public gists
gist list --public

# List starred gists
gist list --starred

# List user's gists
gist list --user octocat

# Create a gist from files
gist create file1.js file2.md --description "My code"

# Create a public gist
gist create file.txt --public

# Create gist from stdin
cat file.js | gist create --stdin --filename code.js

# Interactive gist creation
gist create --interactive

# Get a gist
gist get <gist-id>

# Save gist files to directory
gist get <gist-id> --save ./output

# Update a gist
gist update <gist-id> --description "New description"
gist update <gist-id> --add-file newfile.js
gist update <gist-id> --remove-file oldfile.txt
gist update <gist-id> --rename-file old.txt:new.txt

# Delete a gist
gist delete <gist-id>
```

### Star Management

```bash
# Star a gist
gist star add <gist-id>

# Unstar a gist
gist star remove <gist-id>

# Check if gist is starred
gist star check <gist-id>

# Toggle star status
gist star toggle <gist-id>

# List starred gists
gist star list
# or
gist starred
```

### Comments

```bash
# List comments
gist comment list <gist-id>
# or
gist comments <gist-id>

# Create a comment
gist comment create <gist-id> --body "Great code!"

# Interactive comment creation
gist comment create <gist-id> --interactive

# Get a comment
gist comment get <gist-id> <comment-id>

# Update a comment
gist comment update <gist-id> <comment-id> --body "Updated comment"

# Delete a comment
gist comment delete <gist-id> <comment-id>
```

### Forks

```bash
# Fork a gist
gist fork create <gist-id>

# List forks
gist fork list <gist-id>
# or
gist forks <gist-id>
```

### History

```bash
# View commit history
gist commits <gist-id>
# or
gist history <gist-id>

# View commit statistics
gist commits <gist-id> --stats

# Get a specific revision
gist revision <gist-id> <sha>
```

### Output Formats

```bash
# JSON output (default)
gist list --format json

# YAML output
gist list --format yaml

# Table output
gist list --format table

# Disable colors
gist list --no-color
```

### Configuration

```bash
# Set a config value
gist config set token <your-token>
gist config set format table

# Get a config value
gist config get token

# List all config
gist config list

# Delete a config value
gist config delete token

# Clear all config
gist config clear
```

## SDK Usage

### Basic Example

```javascript
import GistAPI from '@github-api/gist';

// Initialize client
const client = new GistAPI({
  token: 'your_github_token'
});

// List gists
const gists = await client.gists.list();
console.log(gists);

// Create a gist
const newGist = await client.gists.create({
  description: 'My awesome gist',
  public: true,
  files: {
    'hello.js': { content: 'console.log("Hello World");' },
    'readme.md': { content: '# Hello\n\nThis is a test gist' }
  }
});
console.log('Created:', newGist.html_url);

// Get a gist
const gist = await client.gists.get('gist_id_here');
console.log(gist);

// Update a gist
const updated = await client.gists.update('gist_id_here', {
  description: 'Updated description',
  files: {
    'newfile.txt': { content: 'New file content' },
    'oldfile.txt': null  // Delete this file
  }
});

// Delete a gist
await client.gists.delete('gist_id_here');
```

### Working with Comments

```javascript
// List comments
const comments = await client.comments.list('gist_id');

// Create a comment
const comment = await client.comments.create('gist_id', {
  body: 'Great gist!'
});

// Update a comment
await client.comments.update('gist_id', comment.id, {
  body: 'Updated comment text'
});

// Delete a comment
await client.comments.delete('gist_id', comment.id);
```

### Star Management

```javascript
// Check if gist is starred
const isStarred = await client.stars.check('gist_id');

// Star a gist
await client.stars.add('gist_id');

// Unstar a gist
await client.stars.remove('gist_id');

// Toggle star status
const nowStarred = await client.stars.toggle('gist_id');

// List starred gists
const starred = await client.stars.list();
```

### Pagination

```javascript
// Manual pagination
const page1 = await client.gists.list({ page: 1, per_page: 30 });
const page2 = await client.gists.list({ page: 2, per_page: 30 });

// Using async iterator
for await (const gist of client.gists.iterate()) {
  console.log(gist.id, gist.description);
  // Process each gist
}

// Limit iteration
const gists = [];
for await (const gist of client.gists.iterate()) {
  gists.push(gist);
  if (gists.length >= 100) break;
}
```

### Advanced Usage

```javascript
// Custom media types
const rawContent = await client.gists.get('gist_id', { raw: true });
const base64Content = await client.gists.get('gist_id', { base64: true });

// Get specific revision
const revision = await client.gists.getRevision('gist_id', 'sha_here');

// Get commit statistics
const stats = await client.commits.getStats('gist_id');
console.log('Total commits:', stats.totalCommits);
console.log('Total changes:', stats.totalChanges);

// Fork a gist
const fork = await client.forks.create('gist_id');

// List forks
const forks = await client.forks.list('gist_id');
```

### Error Handling

```javascript
import { 
  AuthenticationError, 
  RateLimitError, 
  ValidationError 
} from '@github-api/gist';

try {
  await client.gists.create({
    files: {
      'test.js': { content: 'console.log("test");' }
    }
  });
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Please provide a valid GitHub token');
  } else if (error instanceof RateLimitError) {
    const resetDate = new Date(error.resetTime * 1000);
    console.error(`Rate limit exceeded. Resets at ${resetDate}`);
  } else if (error instanceof ValidationError) {
    console.error('Validation error:', error.message);
    error.errors.forEach(err => {
      console.error(`  ${err.field}: ${err.message}`);
    });
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## API Reference

### Class: `GistAPI`

Main client class for interacting with the GitHub Gist API.

#### Constructor Options

- `token` (string): GitHub personal access token
- `baseURL` (string): API base URL (default: 'https://api.github.com')
- `timeout` (number): Request timeout in ms (default: 30000)
- `retryAttempts` (number): Number of retry attempts (default: 3)
- `retryDelay` (number): Initial retry delay in ms (default: 1000)

#### Properties

- `gists`: GistsEndpoint instance
- `comments`: CommentsEndpoint instance
- `commits`: CommitsEndpoint instance
- `forks`: ForksEndpoint instance
- `stars`: StarsEndpoint instance

### Endpoints

All endpoint methods return Promises and support async/await.

#### GistsEndpoint

- `list(options?)` - List authenticated user's gists
- `listPublic(options?)` - List all public gists
- `listStarred(options?)` - List starred gists
- `listForUser(username, options?)` - List user's gists
- `get(gistId, options?)` - Get a single gist
- `getRevision(gistId, sha, options?)` - Get a gist revision
- `create(data)` - Create a new gist
- `update(gistId, data)` - Update a gist
- `delete(gistId)` - Delete a gist
- `fork(gistId)` - Fork a gist
- `listForks(gistId, options?)` - List gist forks

#### CommentsEndpoint

- `list(gistId, options?)` - List comments on a gist
- `get(gistId, commentId, options?)` - Get a single comment
- `create(gistId, data)` - Create a comment
- `update(gistId, commentId, data)` - Update a comment
- `delete(gistId, commentId)` - Delete a comment

#### Other Endpoints

See TypeScript definitions for complete API reference.

## Environment Variables

- `GITHUB_TOKEN` or `GH_TOKEN`: GitHub personal access token
- `DEBUG`: Enable debug output
- `NO_COLOR`: Disable colored output

## Requirements

- Node.js 18.0.0 or higher
- GitHub personal access token (for authenticated requests)

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For bugs and feature requests, please create an issue on GitHub.