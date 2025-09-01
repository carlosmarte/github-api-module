# Changesets Setup Guide

This monorepo is now configured with [Changesets](https://github.com/changesets/changesets) for managing versioning and publishing across all GitHub API packages.

## 📦 Packages in This Monorepo

- `@github-api/activity` - GitHub Activity API SDK and CLI
- `@github-api/gist` - GitHub Gists API client
- `@github-api/git` - GitHub Git API CLI and SDK
- `@github-api/repos` - GitHub Repository API client
- `@github-api/issues` - GitHub Issues API client
- `@github-api/users` - GitHub Users API client
- `@github-api/teams` - GitHub Teams API CLI and SDK
- `@github-api/pulls` - GitHub Pull Requests API client
- `@github-api/reactions` - GitHub Reactions API CLI and SDK
- `@github-api/search` - GitHub Search API client

## 🚀 How to Use Changesets

### 1. Making Changes
When you make changes to any package, create a changeset to document what changed:

```bash
npm run changeset
```

This will:
- Ask you which packages changed
- Ask for the type of change (patch/minor/major)
- Ask for a summary of the changes
- Create a markdown file in `.changeset/`

### 2. Checking Status
See what will be published:

```bash
npm run changeset:status
```

### 3. Versioning
Consume all changesets and update package.json versions:

```bash
npm run changeset:version
```

This will:
- Update package versions based on changesets
- Update CHANGELOG.md files
- Remove consumed changeset files

### 4. Publishing
Publish all changed packages to npm:

```bash
npm run changeset:publish
```

## 📋 Available Scripts

- `npm run changeset` - Create a new changeset
- `npm run changeset:version` - Version packages and update changelogs
- `npm run changeset:publish` - Publish packages to npm
- `npm run changeset:status` - Check which packages will be published

## 🔧 Workspace Commands

Run commands across all packages:

- `npm run build` - Build all packages (if build scripts exist)
- `npm run test` - Test all packages  
- `npm run lint` - Lint all packages
- `npm run format` - Format all packages

## 🔑 Publishing Configuration

All packages are configured with:
- `publishConfig.access: "public"` - Packages will be public on npm
- Consistent repository URLs pointing to this monorepo
- Proper `files` arrays for publishing
- Standardized directory structure metadata

## 📝 Example Workflow

1. **Make changes** to one or more packages
2. **Create changeset**: `npm run changeset`
3. **Check status**: `npm run changeset:status`  
4. **Version packages**: `npm run changeset:version`
5. **Publish**: `npm run changeset:publish`

## 🎯 Tips

- Create changesets early and often during development
- Use semantic versioning appropriately:
  - **patch**: Bug fixes
  - **minor**: New features (backward compatible)
  - **major**: Breaking changes
- Each changeset can affect multiple packages
- Changesets handle inter-package dependencies automatically