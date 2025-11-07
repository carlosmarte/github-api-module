# GitHub Teams API CLI & SDK

A comprehensive Node.js CLI and SDK for interacting with the GitHub Teams API. This module provides both command-line tools and a programmatic SDK for managing GitHub teams, team members, repositories, projects, and discussions.

## Features

- 🚀 **CLI & SDK** - Use as a command-line tool or import as an SDK
- 🔐 **Authentication** - Supports GitHub personal access tokens
- 📦 **ES Modules** - Modern JavaScript modules (.mjs)
- 🎨 **Rich CLI** - Interactive prompts, colored output, and progress indicators
- 📊 **Comprehensive Coverage** - All GitHub Teams API endpoints
- ✨ **Type Definitions** - Schema validation based on OpenAPI spec

## Installation

```bash
# Install locally
npm install @github-api/teams

# Or install globally for CLI usage
npm install -g @github-api/teams
```

## Authentication

Set your GitHub personal access token as an environment variable:

```bash
export GITHUB_TOKEN=your_token_here
```

Or create a `.env` file:

```env
GITHUB_TOKEN=your_token_here
```

## CLI Usage

### Basic Commands

```bash
# List all teams in an organization
github-teams -o myorg teams list

# Create a new team
github-teams -o myorg teams create --name "Dev Team" --description "Development team" --privacy closed

# Get team details
github-teams -o myorg teams get dev-team

# Update a team
github-teams -o myorg teams update dev-team --description "Updated description"

# Delete a team
github-teams -o myorg teams delete dev-team --confirm
```

### Managing Team Members

```bash
# List team members
github-teams -o myorg teams members list dev-team

# Add a member to a team
github-teams -o myorg teams members add dev-team johndoe --role maintainer

# Remove a member from a team
github-teams -o myorg teams members remove dev-team johndoe
```

### Managing Team Repositories

```bash
# List team repositories
github-teams -o myorg teams repos list dev-team

# Add repository to team
github-teams -o myorg teams repos add dev-team myorg myrepo --permission push

# Remove repository from team
github-teams -o myorg teams repos remove dev-team myorg myrepo
```

### Team Discussions (if enabled)

```bash
# List team discussions
github-teams -o myorg teams discussions list dev-team

# Create a new discussion
github-teams -o myorg teams discussions create dev-team --title "Q4 Planning" --body "Let's discuss Q4 goals"

# Add a comment to a discussion
github-teams -o myorg teams discussions comment dev-team 1 --body "Great idea!"
```

## SDK Usage

### Basic Example

```javascript
import TeamsClient from '@github-api/teams';

// Initialize the client
const client = new TeamsClient({
  token: 'your_github_token',
  baseUrl: 'https://api.github.com' // Optional, for GitHub Enterprise
});

// List teams
const teams = await client.listTeams('myorg', {
  per_page: 100,
  page: 1
});

// Create a team
const newTeam = await client.createTeam('myorg', {
  name: 'New Team',
  description: 'A new team',
  privacy: 'closed',
  notification_setting: 'notifications_enabled'
});

// Get team details
const team = await client.getTeam('myorg', 'team-slug');

// Update a team
const updatedTeam = await client.updateTeam('myorg', 'team-slug', {
  description: 'Updated description'
});

// Delete a team
await client.deleteTeam('myorg', 'team-slug');
```

### Managing Team Members

```javascript
// List team members
const members = await client.listTeamMembers('myorg', 'team-slug', {
  role: 'all' // 'all' | 'member' | 'maintainer'
});

// Add a team member
await client.addTeamMember('myorg', 'team-slug', 'username', {
  role: 'maintainer' // 'member' | 'maintainer'
});

// Get team membership for a user
const membership = await client.getTeamMembership('myorg', 'team-slug', 'username');

// Remove a team member
await client.removeTeamMember('myorg', 'team-slug', 'username');
```

### Managing Team Repositories

```javascript
// List team repositories
const repos = await client.listTeamRepos('myorg', 'team-slug', {
  per_page: 50
});

// Add repository to team
await client.addTeamRepo('myorg', 'team-slug', 'owner', 'repo', {
  permission: 'push' // 'pull' | 'push' | 'admin'
});

// Check if team manages a repository
const manages = await client.checkTeamRepo('myorg', 'team-slug', 'owner', 'repo');

// Remove repository from team
await client.removeTeamRepo('myorg', 'team-slug', 'owner', 'repo');
```

### Team Discussions

```javascript
// List team discussions
const discussions = await client.listTeamDiscussions('myorg', 'team-slug', {
  direction: 'desc' // 'asc' | 'desc'
});

// Create a discussion
const discussion = await client.createTeamDiscussion('myorg', 'team-slug', {
  title: 'Discussion Title',
  body: 'Discussion body',
  private: false
});

// Get a specific discussion
const discussion = await client.getTeamDiscussion('myorg', 'team-slug', 42);

// Update a discussion
const updated = await client.updateTeamDiscussion('myorg', 'team-slug', 42, {
  title: 'Updated Title',
  body: 'Updated body'
});

// Delete a discussion
await client.deleteTeamDiscussion('myorg', 'team-slug', 42);
```

### Discussion Comments

```javascript
// List comments on a discussion
const comments = await client.listDiscussionComments('myorg', 'team-slug', 42);

// Create a comment
const comment = await client.createDiscussionComment('myorg', 'team-slug', 42, {
  body: 'This is a comment'
});

// Update a comment
const updated = await client.updateDiscussionComment('myorg', 'team-slug', 42, 1, {
  body: 'Updated comment'
});

// Delete a comment
await client.deleteDiscussionComment('myorg', 'team-slug', 42, 1);
```

### Advanced Features

```javascript
// List child teams
const childTeams = await client.listChildTeams('myorg', 'parent-team-slug');

// List teams for a user
const userTeams = await client.listTeamsForUser('username');

// List pending team invitations
const invitations = await client.listPendingInvitations('myorg', 'team-slug');
```

## Error Handling

```javascript
import TeamsClient from '@github-api/teams';

const client = new TeamsClient({ token: process.env.GITHUB_TOKEN });

try {
  const team = await client.getTeam('myorg', 'non-existent-team');
} catch (error) {
  if (error.status === 404) {
    console.error('Team not found');
  } else if (error.status === 403) {
    console.error('Permission denied');
  } else if (error.status === 401) {
    console.error('Authentication required');
  } else {
    console.error('Error:', error.message);
  }
  
  // Access full error details
  console.log('Response:', error.response);
  console.log('Headers:', error.headers);
}
```

## Pagination

```javascript
// Manual pagination
let page = 1;
let allTeams = [];
let hasMore = true;

while (hasMore) {
  const teams = await client.listTeams('myorg', {
    per_page: 100,
    page: page
  });
  
  allTeams = allTeams.concat(teams);
  hasMore = teams.length === 100;
  page++;
}

console.log(`Total teams: ${allTeams.length}`);
```

## Model Validation

```javascript
import { models } from '@github-api/teams';

const teamData = {
  name: 'My Team',
  description: 'Team description',
  privacy: 'closed'
};

// Validate team data against schema
const validation = models.validateTeam(teamData);
if (!validation.valid) {
  console.error('Validation errors:', validation.errors);
}
```

## API Reference

### TeamsClient Constructor

```javascript
new TeamsClient(options)
```

Options:
- `token` (string): GitHub personal access token
- `baseUrl` (string): Base URL for API (default: 'https://api.github.com')
- `headers` (object): Additional headers to send with requests

### Available Methods

#### Teams
- `listTeams(org, options)`
- `createTeam(org, data)`
- `getTeam(org, teamSlug)`
- `updateTeam(org, teamSlug, data)`
- `deleteTeam(org, teamSlug)`

#### Team Members
- `listTeamMembers(org, teamSlug, options)`
- `addTeamMember(org, teamSlug, username, options)`
- `removeTeamMember(org, teamSlug, username)`
- `getTeamMembership(org, teamSlug, username)`

#### Team Repositories
- `listTeamRepos(org, teamSlug, options)`
- `addTeamRepo(org, teamSlug, owner, repo, options)`
- `removeTeamRepo(org, teamSlug, owner, repo)`
- `checkTeamRepo(org, teamSlug, owner, repo)`

#### Team Projects
- `listTeamProjects(org, teamSlug, options)`
- `addTeamProject(org, teamSlug, projectId, options)`
- `removeTeamProject(org, teamSlug, projectId)`
- `checkTeamProject(org, teamSlug, projectId)`

#### Team Discussions
- `listTeamDiscussions(org, teamSlug, options)`
- `createTeamDiscussion(org, teamSlug, data)`
- `getTeamDiscussion(org, teamSlug, discussionNumber)`
- `updateTeamDiscussion(org, teamSlug, discussionNumber, data)`
- `deleteTeamDiscussion(org, teamSlug, discussionNumber)`

#### Discussion Comments
- `listDiscussionComments(org, teamSlug, discussionNumber, options)`
- `createDiscussionComment(org, teamSlug, discussionNumber, data)`
- `getDiscussionComment(org, teamSlug, discussionNumber, commentNumber)`
- `updateDiscussionComment(org, teamSlug, discussionNumber, commentNumber, data)`
- `deleteDiscussionComment(org, teamSlug, discussionNumber, commentNumber)`

#### Other
- `listChildTeams(org, teamSlug, options)`
- `listTeamsForUser(username, options)`
- `listPendingInvitations(org, teamSlug, options)`

## Rate Limiting

The client automatically handles GitHub's rate limiting. Check the rate limit status:

```javascript
try {
  const teams = await client.listTeams('myorg');
} catch (error) {
  if (error.message.includes('Rate limit exceeded')) {
    console.log('Rate limit will reset at:', error.reset);
  }
}
```

## Requirements

- Node.js >= 18.0.0
- GitHub personal access token with appropriate permissions

## Permissions Required

- `read:org` - Read organization and team data
- `write:org` - Create and manage teams
- `admin:org` - Delete teams and manage all team settings

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and feature requests, please create an issue on GitHub.