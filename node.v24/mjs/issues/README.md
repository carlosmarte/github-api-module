# GitHub Issues API Client & CLI

A comprehensive Node.js SDK and CLI tool for managing GitHub Issues. This module provides both a programmatic API for use in your applications and a powerful command-line interface for managing issues directly from your terminal.

## Features

- 🚀 **Complete Issues API Coverage** - All GitHub Issues API endpoints
- 💻 **Dual Interface** - Use as SDK or CLI tool
- 🔒 **Authentication Support** - Token-based authentication
- 📄 **Pagination Support** - Automatic pagination handling
- ⚡ **Rate Limiting** - Built-in rate limit management
- 🎨 **Formatted Output** - Beautiful CLI output with colors
- 🔧 **Configurable** - Environment variables and config files
- 📦 **ES Modules** - Modern JavaScript with ESM

## Installation

```bash
npm install @github-api/issues
# or
yarn add @github-api/issues
# or
pnpm add @github-api/issues
```

For global CLI usage:
```bash
npm install -g @github-api/issues
```

## Quick Start

### SDK Usage

```javascript
import { createClient } from '@github-api/issues';

// Create a client
const client = createClient({
  auth: 'your-github-token',
  owner: 'octocat',
  repo: 'hello-world'
});

// List issues
const issues = await client.listForRepo({ state: 'open' });

// Create an issue
const newIssue = await client.create({
  title: 'Found a bug',
  body: 'Description of the bug...',
  labels: ['bug']
});

// Add a comment
await client.createComment(newIssue.number, 'Thanks for reporting!');
```

### CLI Usage

```bash
# Set up authentication
export GITHUB_TOKEN=your-token

# List issues
gh-issues list --repo octocat/hello-world

# Create an issue
gh-issues create --title "Bug report" --body "Details..." --labels bug

# Get issue details
gh-issues get 123

# Add a comment
gh-issues comments add -n 123 -b "Thanks for the report!"
```

## Authentication

The module supports multiple authentication methods:

### Environment Variables
```bash
export GITHUB_TOKEN=ghp_xxxxxxxxxxxx
# or
export GITHUB_ACCESS_TOKEN=ghp_xxxxxxxxxxxx
# or
export GH_TOKEN=ghp_xxxxxxxxxxxx
```

### Programmatic
```javascript
const client = createClient({
  auth: 'ghp_xxxxxxxxxxxx'
});
```

### CLI Option
```bash
gh-issues list --token ghp_xxxxxxxxxxxx
```

## SDK Documentation

### Creating a Client

```javascript
import { createClient, IssuesClient, RateLimitedIssuesClient } from '@github-api/issues';

// Auto-detect rate limiting (recommended)
const client = createClient({
  auth: 'token',
  owner: 'owner',
  repo: 'repo'
});

// Explicit client without rate limiting
const basicClient = new IssuesClient({
  auth: 'token',
  owner: 'owner',
  repo: 'repo'
});

// Explicit rate-limited client
const rateLimitedClient = new RateLimitedIssuesClient({
  auth: 'token',
  owner: 'owner',
  repo: 'repo',
  rateLimitBuffer: 100,  // Reserve 100 requests
  retryOnRateLimit: true // Auto-retry on rate limit
});
```

### Issues Operations

#### List Issues
```javascript
// List all issues for authenticated user
const myIssues = await client.list({
  filter: 'assigned',  // assigned, created, mentioned, subscribed, repos, all
  state: 'open',      // open, closed, all
  sort: 'created',    // created, updated, comments
  direction: 'desc'   // asc, desc
});

// List repository issues
const repoIssues = await client.listForRepo({
  state: 'open',
  labels: 'bug,help wanted',
  assignee: 'octocat',
  creator: 'defunkt',
  milestone: 1,
  since: '2023-01-01T00:00:00Z'
});

// List organization issues
const orgIssues = await client.listForOrg('github', {
  filter: 'repos',
  state: 'all'
});
```

#### Get Single Issue
```javascript
const issue = await client.get(123);
console.log(issue.title, issue.state);
```

#### Create Issue
```javascript
const newIssue = await client.create({
  title: 'Bug: Application crashes on startup',
  body: 'Detailed description...',
  labels: ['bug', 'critical'],
  assignees: ['octocat'],
  milestone: 1
});
```

#### Update Issue
```javascript
const updated = await client.update(123, {
  title: 'Updated title',
  body: 'Updated description',
  state: 'closed',
  state_reason: 'completed',  // completed, not_planned, reopened
  labels: ['fixed'],
  assignees: ['newuser'],
  milestone: 2
});
```

#### Lock/Unlock Issues
```javascript
// Lock with reason
await client.lock(123, 'too heated');
// Lock reasons: off-topic, too heated, resolved, spam

// Unlock
await client.unlock(123);
```

### Comments Operations

```javascript
// List comments
const comments = await client.listComments(123, {
  since: '2023-01-01T00:00:00Z'
});

// Get single comment
const comment = await client.getComment(456);

// Create comment
const newComment = await client.createComment(123, 'Thanks for reporting!');

// Update comment
await client.updateComment(456, 'Updated comment text');

// Delete comment
await client.deleteComment(456);
```

### Labels Operations

```javascript
// List repository labels
const repoLabels = await client.listLabelsForRepo();

// Create label
const label = await client.createLabel({
  name: 'urgent',
  color: 'ff0000',
  description: 'Urgent issues'
});

// Update label
await client.updateLabel('bug', {
  name: 'defect',
  color: '00ff00'
});

// Labels on issues
const issueLabels = await client.listLabelsOnIssue(123);
await client.addLabels(123, ['bug', 'help wanted']);
await client.setLabels(123, ['fixed']);  // Replace all
await client.removeLabel(123, 'bug');
await client.removeAllLabels(123);
```

### Assignees Operations

```javascript
// List available assignees
const assignees = await client.listAssignees();

// Check if user can be assigned
const canAssign = await client.checkAssignee('octocat');

// Manage issue assignees
await client.addAssignees(123, ['octocat', 'defunkt']);
await client.removeAssignees(123, ['defunkt']);
```

### Milestones Operations

```javascript
// List milestones
const milestones = await client.listMilestones({
  state: 'open',  // open, closed, all
  sort: 'due_on', // due_on, completeness
  direction: 'asc'
});

// Create milestone
const milestone = await client.createMilestone({
  title: 'v1.0',
  description: 'First stable release',
  due_on: '2024-12-31T23:59:59Z'
});

// Update milestone
await client.updateMilestone(1, {
  title: 'v1.0.0',
  state: 'closed'
});

// Delete milestone
await client.deleteMilestone(1);
```

### Events & Timeline

```javascript
// List issue events
const events = await client.listEvents(123);

// List timeline events
const timeline = await client.listTimelineEvents(123);
```

### Pagination

```javascript
import { paginate, collectAllPages } from '@github-api/issues';

// Using async generator
const client = createClient({ owner: 'octocat', repo: 'hello-world' });
for await (const issue of paginate(
  (opts) => client.listForRepo({ ...opts, includePagination: true }),
  { state: 'open' }
)) {
  console.log(issue.title);
}

// Collect all pages
const allIssues = await collectAllPages(
  (opts) => client.listForRepo({ ...opts, includePagination: true }),
  { state: 'all' },
  1000  // max items
);
```

### Error Handling

```javascript
import { 
  ApiError, 
  AuthError, 
  ValidationError, 
  RateLimitError,
  NotFoundError 
} from '@github-api/issues';

try {
  await client.get(999999);
} catch (error) {
  if (error instanceof NotFoundError) {
    console.log('Issue not found');
  } else if (error instanceof RateLimitError) {
    console.log(`Rate limited. Resets at ${error.resetDate}`);
  } else if (error instanceof AuthError) {
    console.log('Authentication failed');
  } else if (error instanceof ValidationError) {
    console.log('Validation errors:', error.errors);
  }
}
```

## CLI Documentation

### Global Options

- `-r, --repo <owner/repo>` - Repository in owner/repo format
- `-t, --token <token>` - GitHub authentication token
- `-o, --output <format>` - Output format: json, table, text (default: text)
- `--no-color` - Disable colored output
- `--config` - Show configuration

### Commands

#### List Issues
```bash
gh-issues list [options]
gh-issues ls [options]

Options:
  -s, --state <state>          State: open, closed, all (default: open)
  -l, --labels <labels>        Filter by labels (comma-separated)
  -a, --assignee <assignee>    Filter by assignee
  -c, --creator <creator>      Filter by creator
  -m, --milestone <milestone>  Filter by milestone
  --sort <field>              Sort by: created, updated, comments
  --direction <dir>           Sort direction: asc, desc
  --limit <number>            Maximum number of results
  --all                       Fetch all pages
  --org <org>                 List issues for organization

Examples:
  gh-issues list --repo octocat/hello-world
  gh-issues list --state all --labels bug --limit 50
  gh-issues list --assignee @me --sort updated
```

#### Get Issue
```bash
gh-issues get <number> [options]
gh-issues show <number> [options]

Options:
  --comments    Include comments
  --events      Include events
  --timeline    Include timeline

Examples:
  gh-issues get 123
  gh-issues show 123 --comments --timeline
```

#### Create Issue
```bash
gh-issues create [options]
gh-issues new [options]

Options:
  --title <title>              Issue title
  --body <body>                Issue description
  --labels <labels>            Labels (comma-separated)
  --assignees <assignees>      Assignees (comma-separated)
  --milestone <milestone>      Milestone number
  -i, --interactive            Interactive mode

Examples:
  gh-issues create --title "Bug report" --body "Details..."
  gh-issues create --interactive
  gh-issues new --title "Feature" --labels enhancement,help-wanted
```

#### Update Issue
```bash
gh-issues update <number> [options]
gh-issues edit <number> [options]

Options:
  --title <title>              New title
  --body <body>                New description
  --state <state>              State: open, closed
  --labels <labels>            Replace labels (comma-separated)
  --milestone <milestone>      Milestone number

Examples:
  gh-issues update 123 --title "Updated title"
  gh-issues edit 123 --state closed --labels fixed
```

#### Close/Reopen Issues
```bash
gh-issues close <number> [options]
gh-issues reopen <number>

Options (close):
  --reason <reason>   Close reason: completed, not_planned, duplicate

Examples:
  gh-issues close 123
  gh-issues close 123 --reason not_planned
  gh-issues reopen 123
```

#### Lock/Unlock Issues
```bash
gh-issues lock <number> [options]
gh-issues unlock <number>

Options (lock):
  --reason <reason>   Lock reason: off-topic, too heated, resolved, spam

Examples:
  gh-issues lock 123 --reason resolved
  gh-issues unlock 123
```

#### Manage Comments
```bash
gh-issues comments <action> [options]
gh-issues comment <action> [options]

Actions: list, add, edit, delete

Options:
  -n, --number <number>    Issue number
  -c, --comment <id>       Comment ID
  -b, --body <body>        Comment body
  --since <date>           List comments since date

Examples:
  gh-issues comments list -n 123
  gh-issues comments add -n 123 -b "Thanks!"
  gh-issues comments edit -c 456 -b "Updated"
  gh-issues comments delete -c 456
```

#### Manage Labels
```bash
gh-issues labels <action> [options]
gh-issues label <action> [options]

Actions: list, add, remove, set

Options:
  -n, --number <number>        Issue number
  -l, --labels <labels>        Labels (comma-separated)
  --name <name>                Label name
  --color <color>              Label color (hex without #)
  --description <description>  Label description

Examples:
  gh-issues labels list
  gh-issues labels list -n 123
  gh-issues labels add -n 123 -l "bug,help wanted"
  gh-issues labels remove -n 123 --name bug
  gh-issues labels set -n 123 -l "fixed,released"
```

#### Manage Assignees
```bash
gh-issues assignees <action> [options]
gh-issues assign <action> [options]

Actions: list, add, remove

Options:
  -n, --number <number>        Issue number
  -a, --assignees <assignees>  Assignees (comma-separated)

Examples:
  gh-issues assignees list
  gh-issues assignees add -n 123 -a "octocat,defunkt"
  gh-issues assignees remove -n 123 -a defunkt
```

#### Manage Milestones
```bash
gh-issues milestones <action> [options]
gh-issues milestone <action> [options]

Actions: list, create, update, delete

Options:
  -n, --number <number>            Milestone number
  --title <title>                  Milestone title
  --description <description>      Milestone description
  --due <date>                     Due date (YYYY-MM-DD)
  --state <state>                  State: open, closed

Examples:
  gh-issues milestones list
  gh-issues milestones create --title "v1.0" --due 2024-12-31
  gh-issues milestones update -n 1 --state closed
  gh-issues milestones delete -n 1
```

#### Search Issues
```bash
gh-issues search <query> [options]

Options:
  --in <fields>        Search in: title, body, comments
  --author <user>      Filter by author
  --mentions <user>    Filter by mentions
  --team <team>        Filter by team
  --sort <field>       Sort by: comments, reactions, interactions, created, updated
  --order <dir>        Sort order: asc, desc
  --limit <number>     Maximum results

Examples:
  gh-issues search "memory leak"
  gh-issues search "bug" --author octocat --sort reactions
  gh-issues search "help wanted" --in title
```

### Configuration

Initialize a configuration file:
```bash
gh-issues init
```

This creates `.gh-issues.json`:
```json
{
  "baseUrl": "https://api.github.com",
  "owner": "",
  "repo": "",
  "perPage": 30,
  "output": "text",
  "colors": true
}
```

Configuration locations (in order of priority):
1. `./.gh-issues.json` - Project config
2. `./.github/issues.json` - GitHub folder config
3. `~/.config/gh-issues/config.json` - User config
4. `~/.gh-issues.json` - Home config

## Advanced Usage

### Custom Output Formatting

```javascript
import { format } from '@github-api/issues';

const issue = await client.get(123);

// Text format
console.log(format.formatIssue(issue, 'text'));

// JSON format
console.log(format.formatIssue(issue, 'json'));

// Table format
console.log(format.formatIssueTable([issue]));
```

### Rate Limit Management

```javascript
// Check rate limit status
const rateLimitedClient = new RateLimitedIssuesClient({ auth: 'token' });
const status = await rateLimitedClient.checkRateLimit();
console.log(`Remaining: ${status.resources.core.remaining}`);
console.log(`Reset: ${new Date(status.resources.core.reset * 1000)}`);

// Get current status
const currentStatus = rateLimitedClient.getRateLimitStatus();
console.log(`${currentStatus.remaining} requests remaining`);
```

### Batch Operations

```javascript
// Close multiple issues
const issuesToClose = [123, 124, 125];
const results = await Promise.all(
  issuesToClose.map(num => 
    client.update(num, { state: 'closed' })
  )
);

// Add label to multiple issues
const issuesToLabel = [123, 124, 125];
await Promise.all(
  issuesToLabel.map(num =>
    client.addLabels(num, ['processed'])
  )
);
```

## Environment Variables

- `GITHUB_TOKEN` - GitHub authentication token
- `GITHUB_ACCESS_TOKEN` - Alternative token variable
- `GH_TOKEN` - Alternative token variable
- `GITHUB_REPOSITORY` - Default repository (owner/repo format)
- `NODE_ENV` - Set to 'test' to disable rate limiting

## Error Codes

| Error | Status | Description |
|-------|--------|-------------|
| AuthError | 401 | Invalid or expired token |
| PermissionError | 403 | Insufficient permissions |
| NotFoundError | 404 | Resource not found |
| ConflictError | 409 | Resource conflict |
| ValidationError | 422 | Invalid input data |
| RateLimitError | 429 | Rate limit exceeded |
| ApiError | Various | General API error |
| NetworkError | 0 | Network connection error |

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Links

- [GitHub Issues API Documentation](https://docs.github.com/en/rest/issues)
- [GitHub Personal Access Tokens](https://github.com/settings/tokens)
- [Rate Limiting](https://docs.github.com/en/rest/overview/resources-in-the-rest-api#rate-limiting)