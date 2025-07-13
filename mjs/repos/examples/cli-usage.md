# CLI Usage Examples

This document provides comprehensive examples of using the GitHub Repository CLI tool.

## Setup and Configuration

### Initial Setup
```bash
# Install globally
npm install -g @github-api/repos

# Interactive configuration setup
gh-repo config setup
```

### Manual Configuration
```bash
# Set token via environment variable (recommended)
export GITHUB_TOKEN=ghp_your_personal_access_token_here

# Or use the --token flag with any command
gh-repo --token ghp_your_token repo list
```

### Show Current Configuration
```bash
gh-repo config show
```

## Repository Operations

### Get Repository Information

```bash
# Basic repository info
gh-repo repo get octocat Hello-World

# Full repository details
gh-repo repo get octocat Hello-World --full

# JSON output
gh-repo repo get octocat Hello-World --json
```

### List Repositories

```bash
# List your repositories
gh-repo repo list

# List another user's repositories
gh-repo repo list octocat

# Filter by type and sort
gh-repo repo list --type public --sort updated --direction desc

# Limit results
gh-repo repo list --limit 10
```

Advanced listing examples:
```bash
# List only private repositories
gh-repo repo list --type private

# List repositories sorted by stars (if supported)
gh-repo repo list --sort stargazers_count

# List organization repositories
gh-repo repo list myorg --type org
```

### Create Repository

```bash
# Basic repository creation
gh-repo repo create my-new-repo

# Repository with description
gh-repo repo create my-project --description "My awesome project"

# Private repository with initialization
gh-repo repo create secret-project --private --init

# Repository in organization
gh-repo repo create team-project --org myorganization --description "Team project"

# Complete example with all options
gh-repo repo create full-example \
  --description "Complete example repository" \
  --private \
  --init \
  --has-issues \
  --has-projects \
  --has-wiki
```

### Update Repository

```bash
# Update description
gh-repo repo update octocat Hello-World --description "New description"

# Change visibility
gh-repo repo update octocat Hello-World --private

# Disable features
gh-repo repo update octocat Hello-World --no-issues --no-wiki
```

### Delete Repository

```bash
# Delete with confirmation prompt
gh-repo repo delete myuser myrepo

# Force delete without confirmation
gh-repo repo delete myuser myrepo --force
```

## Branch Operations

### List Branches

```bash
# List all branches
gh-repo branch list octocat Hello-World

# List only protected branches
gh-repo branch list octocat Hello-World --protected

# JSON output
gh-repo branch list octocat Hello-World --json
```

### Branch Information

```bash
# Get specific branch details
gh-repo branch get octocat Hello-World main

# Get branch protection status
gh-repo branch protection octocat Hello-World main
```

## Collaborator Management

### List Collaborators

```bash
# List repository collaborators
gh-repo collaborator list octocat Hello-World

# List with detailed permissions
gh-repo collaborator list octocat Hello-World --detailed

# JSON output for processing
gh-repo collaborator list octocat Hello-World --json
```

### Add Collaborators

```bash
# Add collaborator with push access
gh-repo collaborator add octocat Hello-World newuser

# Add collaborator with specific permission
gh-repo collaborator add octocat Hello-World newuser --permission admin

# Add collaborator with triage permission
gh-repo collaborator add octocat Hello-World newuser --permission triage
```

### Remove Collaborators

```bash
# Remove collaborator
gh-repo collaborator remove octocat Hello-World username

# Remove with confirmation
gh-repo collaborator remove octocat Hello-World username --force
```

## Tag and Release Operations

### List Tags

```bash
# List repository tags
gh-repo tag list octocat Hello-World

# List latest 10 tags
gh-repo tag list octocat Hello-World --limit 10

# List tags with release information
gh-repo tag list octocat Hello-World --with-releases
```

### Create Tags

```bash
# Create lightweight tag
gh-repo tag create octocat Hello-World v1.0.0 --sha abc1234

# Create annotated tag
gh-repo tag create octocat Hello-World v1.0.0 --sha abc1234 --message "Version 1.0.0 release"

# Create tag with automatic release
gh-repo tag create octocat Hello-World v1.0.0 --sha abc1234 --release
```

## Webhook Management

### List Webhooks

```bash
# List repository webhooks
gh-repo webhook list octocat Hello-World

# List with delivery information
gh-repo webhook list octocat Hello-World --with-deliveries
```

### Create Webhooks

```bash
# Create webhook
gh-repo webhook create octocat Hello-World \
  --url https://example.com/webhook \
  --events push,pull_request \
  --secret mysecret

# Create webhook with JSON payload
gh-repo webhook create octocat Hello-World \
  --url https://example.com/webhook \
  --content-type json \
  --events '*'
```

### Test Webhooks

```bash
# Test webhook delivery
gh-repo webhook test octocat Hello-World 12345

# Ping webhook
gh-repo webhook ping octocat Hello-World 12345
```

## Security Operations

### Security Analysis

```bash
# Get security analysis status
gh-repo security status octocat Hello-World

# Enable vulnerability alerts
gh-repo security enable-alerts octocat Hello-World

# Disable vulnerability alerts
gh-repo security disable-alerts octocat Hello-World
```

## Advanced Usage

### Bulk Operations

```bash
# List multiple repositories with filtering
gh-repo repo list | grep -i "project"

# Bulk repository updates (using shell scripting)
for repo in $(gh-repo repo list --format name); do
  gh-repo repo update myuser $repo --description "Updated description"
done
```

### Output Formatting

```bash
# Table format (default)
gh-repo repo list --format table

# JSON format for processing
gh-repo repo list --format json | jq '.[] | .name'

# CSV format (if supported)
gh-repo repo list --format csv

# Minimal output
gh-repo repo list --quiet

# Verbose output with debug info
gh-repo repo list --verbose
```

### Global Options

```bash
# All commands support these global options:

# Authentication
--token ghp_your_token                    # GitHub token
--base-url https://api.github.com         # API base URL

# Request settings
--timeout 10000                           # Request timeout (ms)
--no-rate-limit                          # Disable rate limiting

# Output settings
--json                                    # JSON output
--verbose                                 # Verbose logging
--quiet                                   # Suppress output
--no-color                               # Disable colors

# Example combining multiple options
gh-repo repo list --token $GITHUB_TOKEN --json --quiet --timeout 15000
```

### Error Handling

```bash
# Verbose error output
gh-repo repo get invalid-user invalid-repo --verbose

# Quiet mode (only errors)
gh-repo repo list --quiet

# JSON error output for scripting
gh-repo repo get invalid-user invalid-repo --json 2>&1
```

## Scripting Examples

### Bash Scripts

```bash
#!/bin/bash
# backup-repos.sh - Clone all user repositories

# Get list of repository clone URLs
repos=$(gh-repo repo list --json | jq -r '.[].clone_url')

# Clone each repository
for repo_url in $repos; do
  echo "Cloning $repo_url"
  git clone "$repo_url"
done
```

```bash
#!/bin/bash
# check-repo-stats.sh - Report on repository statistics

user=$1
if [ -z "$user" ]; then
  echo "Usage: $0 <username>"
  exit 1
fi

echo "Repository statistics for $user:"
echo "================================"

repos=$(gh-repo repo list $user --json)
total=$(echo "$repos" | jq 'length')
public=$(echo "$repos" | jq '[.[] | select(.private == false)] | length')
private=$(echo "$repos" | jq '[.[] | select(.private == true)] | length')
stars=$(echo "$repos" | jq '[.[] | .stargazers_count] | add')

echo "Total repositories: $total"
echo "Public: $public"
echo "Private: $private"
echo "Total stars: $stars"

echo ""
echo "Top 5 repositories by stars:"
echo "$repos" | jq -r '.[] | select(.stargazers_count > 0) | "\\(.stargazers_count) - \\(.name)"' | sort -nr | head -5
```

### PowerShell Scripts

```powershell
# backup-repos.ps1 - Windows PowerShell version
$repos = gh-repo repo list --json | ConvertFrom-Json

foreach ($repo in $repos) {
    Write-Host "Cloning $($repo.name)"
    git clone $repo.clone_url
}
```

### Node.js Integration

```javascript
// Use CLI from Node.js scripts
const { execSync } = require('child_process');

function getRepositories(user) {
  const result = execSync(`gh-repo repo list ${user} --json`, { encoding: 'utf8' });
  return JSON.parse(result);
}

function createRepository(name, description) {
  const command = `gh-repo repo create ${name} --description "${description}"`;
  execSync(command, { stdio: 'inherit' });
}

// Usage
const repos = getRepositories('octocat');
console.log(`Found ${repos.length} repositories`);

createRepository('my-new-project', 'Created from Node.js script');
```

## Tips and Best Practices

### Performance Tips

1. **Use pagination wisely**:
   ```bash
   # Good: Limit results when you don't need everything
   gh-repo repo list --limit 20
   
   # Better: Use specific filters
   gh-repo repo list --type public --sort updated
   ```

2. **Enable rate limiting** for bulk operations:
   ```bash
   gh-repo repo list --rate-limit
   ```

3. **Use JSON output** for scripting:
   ```bash
   gh-repo repo list --json | jq '.[] | select(.language == "JavaScript")'
   ```

### Security Best Practices

1. **Use environment variables** for tokens:
   ```bash
   export GITHUB_TOKEN=ghp_your_token
   # Rather than --token flag in commands
   ```

2. **Limit token scopes** to minimum required permissions

3. **Use organization tokens** for organization repositories

4. **Regularly rotate tokens**

### Troubleshooting

1. **Check authentication**:
   ```bash
   gh-repo config show
   gh-repo ping  # Test API connectivity
   ```

2. **Enable verbose logging**:
   ```bash
   gh-repo repo list --verbose
   ```

3. **Check rate limits**:
   ```bash
   gh-repo rate-limit
   ```

4. **Validate input**:
   ```bash
   # CLI provides helpful validation errors
   gh-repo repo create ""  # Will show validation error
   ```

## Integration Examples

### CI/CD Integration

```yaml
# GitHub Actions workflow
name: Repository Management
on: workflow_dispatch

jobs:
  manage-repos:
    runs-on: ubuntu-latest
    steps:
      - name: Install CLI
        run: npm install -g @github-api/repos
        
      - name: List repositories
        run: gh-repo repo list --json > repos.json
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          
      - name: Create backup repository
        run: gh-repo repo create backup-$(date +%Y%m%d) --private
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Monitoring Scripts

```bash
#!/bin/bash
# monitor-repos.sh - Check repository health

echo "Repository Health Check - $(date)"
echo "=================================="

# Check for repositories without descriptions
repos_no_desc=$(gh-repo repo list --json | jq -r '.[] | select(.description == null or .description == "") | .name')

if [ ! -z "$repos_no_desc" ]; then
  echo "⚠️  Repositories without descriptions:"
  echo "$repos_no_desc"
fi

# Check for repositories without topics
repos_no_topics=$(gh-repo repo list --json | jq -r '.[] | select(.topics | length == 0) | .name')

if [ ! -z "$repos_no_topics" ]; then
  echo "⚠️  Repositories without topics:"
  echo "$repos_no_topics"
fi

echo "✅ Health check complete"
```