# GitHub Pull Requests CLI Examples

This document provides practical examples of using the `gh-pr` CLI tool.

## Setup

First, set your GitHub token:
```bash
export GITHUB_TOKEN=ghp_your_token_here
```

## Basic Usage

### List Pull Requests

```bash
# List all open PRs
gh-pr list --repo facebook/react

# List closed PRs
gh-pr list --repo facebook/react --state closed

# List PRs with specific base branch
gh-pr list --repo facebook/react --base main

# List PRs sorted by update time
gh-pr list --repo facebook/react --sort updated

# List PRs in table format (default)
gh-pr list --repo facebook/react

# List PRs in JSON format
gh-pr list --repo facebook/react --output json

# List all pages of results
gh-pr list --repo facebook/react --all
```

### Get Pull Request Details

```bash
# Get basic PR information
gh-pr get 1234 --repo facebook/react

# Get PR with comments
gh-pr get 1234 --repo facebook/react --comments

# Get PR with reviews
gh-pr get 1234 --repo facebook/react --reviews

# Get PR with commits
gh-pr get 1234 --repo facebook/react --commits

# Get PR with changed files
gh-pr get 1234 --repo facebook/react --files

# Get everything in JSON format
gh-pr get 1234 --repo facebook/react --comments --reviews --commits --files --output json
```

### Create Pull Request

```bash
# Create a simple PR
gh-pr create --repo myorg/myrepo \
  --title "Add new feature" \
  --head feature-branch \
  --base main \
  --body "This PR adds a new feature for..."

# Create a draft PR
gh-pr create --repo myorg/myrepo \
  --title "WIP: New feature" \
  --head feature-branch \
  --base main \
  --draft

# Create PR interactively
gh-pr create --repo myorg/myrepo --interactive
```

### Update Pull Request

```bash
# Update PR title
gh-pr update 123 --repo myorg/myrepo --title "Updated title"

# Update PR description
gh-pr update 123 --repo myorg/myrepo --body "New description"

# Close a PR
gh-pr update 123 --repo myorg/myrepo --state closed

# Reopen a PR
gh-pr update 123 --repo myorg/myrepo --state open

# Change base branch
gh-pr update 123 --repo myorg/myrepo --base develop
```

### Merge Pull Request

```bash
# Merge with default method
gh-pr merge 123 --repo myorg/myrepo

# Squash and merge
gh-pr merge 123 --repo myorg/myrepo --method squash

# Rebase and merge
gh-pr merge 123 --repo myorg/myrepo --method rebase

# Merge with custom commit message
gh-pr merge 123 --repo myorg/myrepo \
  --title "Merge: Add new feature" \
  --message "This adds the new feature as discussed"

# Skip confirmation prompt
gh-pr merge 123 --repo myorg/myrepo --confirm
```

### Review Pull Request

```bash
# Approve a PR
gh-pr review 123 --repo myorg/myrepo --approve

# Request changes
gh-pr review 123 --repo myorg/myrepo --request-changes \
  --comment "Please address the following issues..."

# Add a comment review
gh-pr review 123 --repo myorg/myrepo \
  --comment "Looks good overall, just a few minor suggestions"

# Interactive review
gh-pr review 123 --repo myorg/myrepo --interactive
```

### Search Pull Requests

```bash
# Search for bug fixes
gh-pr search "bug fix" --repo facebook/react

# Search PRs by author
gh-pr search "feature" --repo facebook/react --author gaearon

# Search PRs with label
gh-pr search "enhancement" --repo facebook/react --label "good first issue"

# Search PRs by assignee
gh-pr search "refactor" --repo facebook/react --assignee zpao

# Complex search with sorting
gh-pr search "performance" --repo facebook/react \
  --author gaearon \
  --label enhancement \
  --sort comments \
  --order desc
```

### Working with Files

```bash
# Show changed files in a PR
gh-pr files 123 --repo myorg/myrepo

# Show only file names
gh-pr files 123 --repo myorg/myrepo --names-only

# Show file statistics
gh-pr files 123 --repo myorg/myrepo --stats
```

## Advanced Usage

### Using Configuration File

Create `.gh-pr.json` in your project:
```json
{
  "owner": "myorg",
  "repo": "myrepo",
  "outputFormat": "table",
  "perPage": 50
}
```

Then you can omit the `--repo` flag:
```bash
gh-pr list
gh-pr get 123
gh-pr create --title "New feature" --head feature --base main
```

### Working with Different Output Formats

```bash
# Table format (default)
gh-pr list --repo facebook/react --output table

# JSON format (for scripting)
gh-pr list --repo facebook/react --output json | jq '.[] | {number, title}'

# Text format (human readable)
gh-pr list --repo facebook/react --output text

# Disable colors
gh-pr list --repo facebook/react --no-color
```

### Using in Scripts

```bash
#!/bin/bash

# Get all open PRs as JSON
prs=$(gh-pr list --repo myorg/myrepo --output json --all)

# Process each PR
echo "$prs" | jq -r '.[] | "\(.number):\(.title)"' | while read pr; do
  echo "Processing: $pr"
done

# Check if a PR is merged
if gh-pr get 123 --repo myorg/myrepo --output json | jq -e '.merged'; then
  echo "PR is merged"
else
  echo "PR is not merged"
fi

# Count PRs by state
open_count=$(gh-pr list --repo myorg/myrepo --state open --output json | jq length)
closed_count=$(gh-pr list --repo myorg/myrepo --state closed --output json | jq length)
echo "Open: $open_count, Closed: $closed_count"
```

### Interactive Mode

Start interactive mode for guided operations:
```bash
gh-pr interactive --repo myorg/myrepo
```

This will present a menu of options:
- List pull requests
- Get pull request details
- Create pull request
- Update pull request
- Merge pull request
- Review pull request
- Search pull requests

### Environment Variables

```bash
# Set default repository
export GITHUB_OWNER=myorg
export GITHUB_REPO=myrepo

# Set output preferences
export GH_PR_OUTPUT_FORMAT=json
export GH_PR_PER_PAGE=100
export GH_PR_NO_COLOR=true

# Now you can use simpler commands
gh-pr list
gh-pr get 123
```

### GitHub Enterprise

For GitHub Enterprise installations:
```bash
# Set custom API endpoint
export GITHUB_API_URL=https://github.enterprise.com/api/v3

# Or in config file
{
  "baseUrl": "https://github.enterprise.com/api/v3"
}

# Use as normal
gh-pr list --repo enterprise/repo
```

## Tips and Tricks

1. **Alias common commands**:
   ```bash
   alias prlist='gh-pr list --repo myorg/myrepo'
   alias prshow='gh-pr get --repo myorg/myrepo'
   ```

2. **Use with fzf for interactive selection**:
   ```bash
   # Select and view a PR interactively
   pr_number=$(gh-pr list --repo myorg/myrepo --output json | \
     jq -r '.[] | "#\(.number): \(.title)"' | \
     fzf | cut -d: -f1 | tr -d '#')
   gh-pr get $pr_number --repo myorg/myrepo
   ```

3. **Monitor PR status**:
   ```bash
   # Watch PR status
   watch -n 60 'gh-pr get 123 --repo myorg/myrepo --output json | jq "{state, mergeable, merged}"'
   ```

4. **Batch operations**:
   ```bash
   # Close all PRs with a specific label
   gh-pr search "label:wontfix" --repo myorg/myrepo --output json | \
     jq -r '.[].number' | \
     xargs -I {} gh-pr update {} --repo myorg/myrepo --state closed
   ```

5. **Generate reports**:
   ```bash
   # Weekly PR report
   gh-pr list --repo myorg/myrepo --state all --output json | \
     jq -r '.[] | select(.created_at >= "2023-10-01") | "\(.created_at | split("T")[0])\t\(.user.login)\t\(.title)"' | \
     sort | column -t
   ```