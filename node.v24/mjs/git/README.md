# GitHub Git API CLI/SDK

A Node.js ES module that provides both CLI and SDK functionality for GitHub's Git API.

## Installation

```bash
cd mjs/git
npm install
```

## Configuration

Set your GitHub token as an environment variable:

```bash
export GITHUB_TOKEN=your_github_token_here
```

Or create a `.env` file:
```
GITHUB_TOKEN=your_github_token_here
```

## CLI Usage

### Blob Operations

```bash
# Create a blob
./cli.mjs blob create -o owner -r repo -c "Hello World"
./cli.mjs blob create -o owner -r repo -f ./file.txt -e base64

# Get a blob
./cli.mjs blob get -o owner -r repo -s sha123456
./cli.mjs blob get -o owner -r repo -s sha123456 --save output.txt
```

### Commit Operations

```bash
# Create a commit
./cli.mjs commit create -o owner -r repo -m "Initial commit" -t tree_sha -p parent_sha

# Get a commit
./cli.mjs commit get -o owner -r repo -s commit_sha
```

### Reference Operations

```bash
# Create a reference
./cli.mjs ref create -o owner -r repo --ref refs/heads/feature -s sha123456

# Get a reference
./cli.mjs ref get -o owner -r repo --ref heads/main

# List matching references
./cli.mjs ref list -o owner -r repo --ref heads/feature

# Update a reference
./cli.mjs ref update -o owner -r repo --ref heads/main -s new_sha --force

# Delete a reference
./cli.mjs ref delete -o owner -r repo --ref heads/feature
```

### Tag Operations

```bash
# Create a tag
./cli.mjs tag create -o owner -r repo -t v1.0.0 -m "Release v1.0.0" --object commit_sha

# Get a tag
./cli.mjs tag get -o owner -r repo -s tag_sha
```

### Tree Operations

```bash
# Create a tree
./cli.mjs tree create -o owner -r repo -t '[{"path":"file.txt","mode":"100644","type":"blob","sha":"blob_sha"}]'

# Get a tree
./cli.mjs tree get -o owner -r repo -s tree_sha --recursive
```

## SDK Usage

```javascript
import { GitHubClient } from './index.mjs';

const client = new GitHubClient({
  token: 'your_token',
  baseUrl: 'https://api.github.com'
});

// Create a blob
const blob = await client.createBlob('owner', 'repo', 'Hello World', 'utf-8');
console.log(blob.sha);

// Get a commit
const commit = await client.getCommit('owner', 'repo', 'commit_sha');
console.log(commit.message);

// Create a reference
const ref = await client.createRef('owner', 'repo', 'refs/heads/feature', 'sha');

// Create a tree
const tree = await client.createTree('owner', 'repo', [
  { path: 'file.txt', mode: '100644', type: 'blob', sha: 'blob_sha' }
]);
```

## API Methods

### GitHubClient

- `createBlob(owner, repo, content, encoding)`
- `getBlob(owner, repo, fileSha)`
- `createCommit(owner, repo, message, tree, parents, author, committer)`
- `getCommit(owner, repo, commitSha)`
- `createRef(owner, repo, ref, sha)`
- `getRef(owner, repo, ref)`
- `listMatchingRefs(owner, repo, ref)`
- `updateRef(owner, repo, ref, sha, force)`
- `deleteRef(owner, repo, ref)`
- `createTag(owner, repo, tag, message, object, type, tagger)`
- `getTag(owner, repo, tagSha)`
- `createTree(owner, repo, tree, baseTree)`
- `getTree(owner, repo, treeSha, recursive)`

## Options

All CLI commands support:
- `--json`: Output results as JSON
- `-o, --owner`: Repository owner
- `-r, --repo`: Repository name

## License

MIT