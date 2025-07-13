# CLI Usage Examples

This document provides practical examples of using the GitHub Gist CLI tool.

## Setup

First, ensure you have the CLI installed and configured:

```bash
# Install globally
npm install -g @github-api/gist

# Set your GitHub token
export GITHUB_TOKEN=your_token_here
# OR
gist config set token your_token_here
```

## Common Workflows

### 1. Share Code Snippets

```bash
# Share a single file
gist create script.js --description "Utility script for data processing"

# Share multiple files as a single gist
gist create index.html style.css script.js --description "Web page example"

# Create a public gist
gist create app.js --public --description "Sample Express app"

# Create from stdin
echo "Hello World" | gist create --stdin --filename hello.txt
```

### 2. Manage Your Gists

```bash
# List all your gists
gist list

# List with table format
gist list --format table

# Search for specific gists (list and grep)
gist list --format json | grep "keyword"

# Get details of a specific gist
gist get abc123def456

# Save gist files locally
gist get abc123def456 --save ./downloads/
```

### 3. Update Existing Gists

```bash
# Update description
gist update abc123def456 --description "Updated: Now with better documentation"

# Add a new file to existing gist
gist update abc123def456 --add-file newfeature.js

# Remove a file
gist update abc123def456 --remove-file oldfile.txt

# Rename a file
gist update abc123def456 --rename-file old.txt:new.txt

# Interactive update
gist update abc123def456 --interactive
```

### 4. Collaborate with Comments

```bash
# View comments on a gist
gist comments abc123def456

# Add a comment
gist comment create abc123def456 --body "Great implementation! One suggestion..."

# Interactive comment (opens editor)
gist comment create abc123def456 --interactive

# Reply to a comment thread
gist comment list abc123def456  # Find comment ID
gist comment create abc123def456 --body "@user Thanks for the feedback!"

# Update your comment
gist comment update abc123def456 42 --body "Updated: Fixed typo in my comment"
```

### 5. Star and Discover Gists

```bash
# Star interesting gists
gist star add abc123def456

# List your starred gists
gist starred

# Check if a gist is starred
gist star check abc123def456

# Unstar a gist
gist star remove abc123def456

# Browse public gists
gist list --public --format table
```

### 6. Work with Forks

```bash
# Fork someone's gist
gist fork create abc123def456

# List all forks of your gist
gist forks abc123def456

# See who forked your gist (with table format)
gist fork list abc123def456 --format table
```

### 7. View History and Revisions

```bash
# View commit history
gist commits abc123def456

# View with statistics
gist commits abc123def456 --stats

# Get a specific revision
gist revision abc123def456 a1b2c3d4

# Compare revisions (save both and diff)
gist revision abc123def456 old_sha --save ./old/
gist revision abc123def456 new_sha --save ./new/
diff -r ./old ./new
```

## Advanced Examples

### Create a Gist from Multiple Files with Globbing

```bash
# Create gist from all JavaScript files in current directory
gist create *.js --description "Project JavaScript files"

# Create from all files in a directory
gist create src/*.ts --description "TypeScript source files"
```

### Batch Operations with Shell Scripting

```bash
# Delete all gists with "test" in description
for gist_id in $(gist list --format json | jq -r '.[] | select(.description | contains("test")) | .id'); do
    gist delete $gist_id --yes
done

# Star all gists from a specific user
for gist_id in $(gist list --user torvalds --format json | jq -r '.[].id'); do
    gist star add $gist_id
done

# Backup all your gists
mkdir -p gist-backup
for gist_id in $(gist list --format json | jq -r '.[].id'); do
    gist get $gist_id --save "./gist-backup/$gist_id/"
done
```

### Interactive Workflows

```bash
# Interactive gist creation with editor
gist create --interactive

# Choose files interactively
gist create $(ls | fzf -m) --description "Selected files"

# Interactive update workflow
gist list --format table
read -p "Enter gist ID to update: " gist_id
gist update $gist_id --interactive
```

### CI/CD Integration

```bash
# In GitHub Actions - Create gist with build artifacts
- name: Upload build logs
  run: |
    gist create build.log test-results.xml \
      --description "Build #${{ github.run_number }} results" \
      --token ${{ secrets.GIST_TOKEN }}

# In Jenkins - Archive failed test results
if [ "$BUILD_STATUS" = "FAILED" ]; then
    gist create test-output.log \
      --description "Failed build $BUILD_NUMBER" \
      --public
fi
```

### Configuration Management

```bash
# Set default output format
gist config set format table

# Use different tokens for different accounts
GITHUB_TOKEN=$WORK_TOKEN gist list
GITHUB_TOKEN=$PERSONAL_TOKEN gist list

# Check current configuration
gist config list
```

## Output Format Examples

```bash
# JSON (default) - good for scripting
gist list --format json | jq '.[] | {id, description}'

# YAML - human readable structured data
gist list --format yaml

# Table - best for terminal viewing
gist list --format table

# Disable colors for piping
gist list --no-color | grep "pattern"
```

## Error Handling

```bash
# Check if gist exists before operating
if gist get abc123def456 > /dev/null 2>&1; then
    gist update abc123def456 --add-file new.txt
else
    echo "Gist not found"
fi

# Handle rate limiting
gist list || {
    echo "Rate limited. Waiting..."
    sleep 3600
    gist list
}
```

## Tips and Tricks

1. **Alias common commands** in your shell:
```bash
alias gls='gist list --format table'
alias gnew='gist create --interactive'
alias gstars='gist starred --format table'
```

2. **Use environment variables** for different contexts:
```bash
# Work gists
GITHUB_TOKEN=$WORK_TOKEN gist list

# Personal gists  
GITHUB_TOKEN=$PERSONAL_TOKEN gist list
```

3. **Combine with other tools**:
```bash
# Use with clipboard
pbpaste | gist create --stdin --filename clipboard.txt

# Use with curl
curl https://example.com/api | gist create --stdin --filename response.json

# Use with git
git diff | gist create --stdin --filename changes.diff
```

4. **Quick sharing**:
```bash
# Share current directory's README
gist create README.md --public | grep "html_url"
```

## Debugging

```bash
# Enable debug output
DEBUG=true gist list

# Check authentication
gist config get token

# Test connection
gist list --per-page 1
```