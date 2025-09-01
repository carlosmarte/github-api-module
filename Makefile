# GitHub API Module Monorepo Makefile
# Simplifies changeset operations and common development tasks

.PHONY: help changeset version publish status build test lint format clean install

# Default target
help: ## Show this help message
	@echo "GitHub API Module Monorepo - Available Commands"
	@echo "=============================================="
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "📦 Packages in this monorepo:"
	@echo "  • @github-api/activity   - GitHub Activity API SDK and CLI"
	@echo "  • @github-api/gist       - GitHub Gists API client"
	@echo "  • @github-api/git        - GitHub Git API CLI and SDK"
	@echo "  • @github-api/repos      - GitHub Repository API client"
	@echo "  • @github-api/issues     - GitHub Issues API client"
	@echo "  • @github-api/users      - GitHub Users API client"
	@echo "  • @github-api/teams      - GitHub Teams API CLI and SDK"
	@echo "  • @github-api/pulls      - GitHub Pull Requests API client"
	@echo "  • @github-api/reactions  - GitHub Reactions API CLI and SDK"
	@echo "  • @github-api/search     - GitHub Search API client"
	@echo ""
	@echo "🚀 Quick start:"
	@echo "  1. make changeset    # Create a changeset for your changes"
	@echo "  2. make version      # Update package versions"
	@echo "  3. make publish      # Publish packages to npm"

# Changeset operations
changeset: ## Create a new changeset (interactive)
	@echo "🦋 Creating a new changeset..."
	@npm run changeset

version: ## Apply changesets and update package versions
	@echo "🏷️  Applying changesets and updating versions..."
	@npm run changeset:version
	@echo "✅ Versions updated! Review the changes and commit when ready."

publish: ## Publish packages to npm registry
	@echo "📦 Publishing packages to npm..."
	@npm run changeset:publish
	@echo "✅ Packages published successfully!"

status: ## Check changeset status and what will be published
	@echo "📊 Checking changeset status..."
	@npm run changeset:status

# Development operations
install: ## Install dependencies for all packages
	@echo "📥 Installing dependencies..."
	@npm install
	@echo "✅ Dependencies installed!"

build: ## Build all packages (if build scripts exist)
	@echo "🏗️  Building all packages..."
	@npm run build --workspaces --if-present
	@echo "✅ Build complete!"

test: ## Run tests for all packages
	@echo "🧪 Running tests for all packages..."
	@npm run test --workspaces --if-present
	@echo "✅ Tests complete!"

lint: ## Lint all packages
	@echo "🔍 Linting all packages..."
	@npm run lint --workspaces --if-present
	@echo "✅ Linting complete!"

format: ## Format code in all packages
	@echo "💅 Formatting code in all packages..."
	@npm run format --workspaces --if-present
	@echo "✅ Formatting complete!"

# Utility operations
clean: ## Clean node_modules in all packages
	@echo "🧹 Cleaning node_modules..."
	@find . -name "node_modules" -type d -prune -exec rm -rf '{}' +
	@echo "✅ Cleanup complete!"

reinstall: clean install ## Clean and reinstall all dependencies

# Git operations
git-status: ## Show git status with changeset context
	@echo "📊 Git status:"
	@git status --short
	@echo ""
	@echo "🦋 Changeset status:"
	@make status

commit-version: ## Commit version changes (after running 'make version')
	@echo "💾 Committing version updates..."
	@git add .
	@git commit -m "Version packages 🦋

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
	@echo "✅ Version changes committed!"

# Information commands  
packages: ## List all workspace packages
	@echo "📦 Workspace packages:"
	@npm ls --depth=0 --workspaces | grep -E "^├─|^└─" | sed 's/├─┬/•/g' | sed 's/└──/•/g'

info: ## Show detailed project information
	@echo "GitHub API Module Monorepo"
	@echo "========================="
	@echo "Node version: $(shell node --version)"
	@echo "NPM version:  $(shell npm --version)"
	@echo "Packages:     10"
	@echo ""
	@echo "Changeset configuration:"
	@echo "• Access: public"
	@echo "• Registry: https://registry.npmjs.org/"
	@echo "• Base branch: main"
	@echo ""
	@make packages

# Development workflow shortcuts
workflow: ## Show recommended development workflow
	@echo "🔄 Recommended Development Workflow"
	@echo "=================================="
	@echo ""
	@echo "1. 📝 Make changes to one or more packages"
	@echo "2. 🦋 make changeset    # Document your changes"
	@echo "3. 📊 make status       # Check what will be published"
	@echo "4. 🏷️  make version     # Update versions and generate changelogs"
	@echo "5. 💾 make commit-version # Commit version changes"
	@echo "6. 📦 make publish      # Publish to npm"
	@echo ""
	@echo "🛠️  Additional commands:"
	@echo "• make test           # Run all tests"
	@echo "• make lint           # Check code quality"
	@echo "• make build          # Build packages"
	@echo "• make git-status     # Check git and changeset status"

# Quick aliases for common operations
c: changeset ## Alias for 'changeset'
v: version ## Alias for 'version'
p: publish ## Alias for 'publish'
s: status ## Alias for 'status'
t: test ## Alias for 'test'
l: lint ## Alias for 'lint'