# GitHub API Module - Root Makefile
# Manages both Node.js and Python SDK tests

.PHONY: help test test-node test-python clean install

# Default target
help: ## Show this help message
	@echo "GitHub API Module - Available Commands"
	@echo "======================================"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "📦 Modules:"
	@echo "  • node.v24 - Node.js SDK with multiple GitHub API packages"
	@echo "  • python.v3 - Python GitHub API SDK"

# Test operations
test: ## Run all tests (Node.js + Python)
	@echo "🧪 Running all tests..."
	@echo ""
	@$(MAKE) test-node || true
	@echo ""
	@$(MAKE) test-python || true
	@echo ""
	@echo "✅ Test run complete!"

test-node: ## Run Node.js tests
	@echo "🟢 Running Node.js tests..."
	@cd node.v24/mjs && (npm test --workspaces --if-present || echo "⚠️  Some Node.js tests failed")

test-python: ## Run Python tests
	@echo "🐍 Running Python tests..."
	@if [ -d "python.v3" ]; then \
		cd python.v3 && (pytest || echo "⚠️  Some Python tests failed"); \
	else \
		echo "⚠️  Python directory not found"; \
	fi

# Installation
install: ## Install dependencies for both Node.js and Python
	@echo "📥 Installing Node.js dependencies..."
	@cd node.v24/mjs && npm install
	@echo ""
	@echo "📥 Installing Python dependencies..."
	@cd python.v3 && pip install -e ".[dev]"
	@echo ""
	@echo "✅ All dependencies installed!"

# Clean operations
clean: ## Clean build artifacts and dependencies
	@echo "🧹 Cleaning Node.js artifacts..."
	@cd node.v24/mjs && $(MAKE) clean
	@echo ""
	@echo "🧹 Cleaning Python artifacts..."
	@cd python.v3 && rm -rf .pytest_cache __pycache__ .coverage htmlcov *.egg-info
	@echo ""
	@echo "✅ Cleanup complete!"
