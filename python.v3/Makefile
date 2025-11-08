.PHONY: help venv install install-dev run clean test test-cov lint format type-check build publish-test publish all ci

# Python interpreter
PYTHON := python3
VENV := venv
VENV_BIN := $(VENV)/bin
VENV_PYTHON := $(VENV_BIN)/python
VENV_PIP := $(VENV_BIN)/pip

# Default target
help:
	@echo "GitHub SDK Python - Makefile Commands"
	@echo ""
	@echo "Setup:"
	@echo "  make venv          Create virtual environment"
	@echo "  make install       Install production dependencies (creates venv if needed)"
	@echo "  make install-dev   Install development dependencies (creates venv if needed)"
	@echo ""
	@echo "Development:"
	@echo "  make run           Run the basic usage example"
	@echo "  make format        Format code with black and isort"
	@echo "  make lint          Run ruff linter"
	@echo "  make type-check    Run mypy type checker"
	@echo "  make test          Run tests"
	@echo "  make test-cov      Run tests with coverage report"
	@echo ""
	@echo "Build & Publish:"
	@echo "  make build         Build distribution packages"
	@echo "  make publish-test  Publish to TestPyPI"
	@echo "  make publish       Publish to PyPI"
	@echo ""
	@echo "CI:"
	@echo "  make ci            Run full CI pipeline (install, lint, type-check, test, build)"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean         Remove build artifacts and cache files"
	@echo ""
	@echo "Quality:"
	@echo "  make all           Run format, lint, type-check, and test"

# Create virtual environment
venv:
	@if [ ! -d "$(VENV)" ]; then \
		echo "Creating virtual environment..."; \
		$(PYTHON) -m venv $(VENV); \
		echo "Virtual environment created at $(VENV)"; \
	else \
		echo "Virtual environment already exists"; \
	fi

# Install production dependencies
install: venv
	@echo "Installing production dependencies..."
	$(VENV_PIP) install --upgrade pip setuptools wheel
	$(VENV_PIP) install -e github_sdk_core

# Install development dependencies
install-dev: venv
	@echo "Installing development dependencies..."
	$(VENV_PIP) install --upgrade pip setuptools wheel
	$(VENV_PIP) install -e ".[dev]"
	$(VENV_PIP) install -e "github_sdk_core[dev]"

# Run the basic usage example
run: install
	@echo "Running basic usage example..."
	$(VENV_PYTHON) examples/basic_usage.py

# Clean up build artifacts and cache files
clean:
	@echo "Cleaning up build artifacts and cache files..."
	rm -rf build/ dist/ *.egg-info
	rm -rf .pytest_cache .mypy_cache .ruff_cache
	rm -rf htmlcov/ .coverage coverage.xml
	rm -rf $(VENV)
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete
	find . -type f -name "*.pyo" -delete

# Run tests
test: install-dev
	@echo "Running tests..."
	$(VENV_PYTHON) -m pytest tests/ -v

# Run tests with coverage
test-cov: install-dev
	@echo "Running tests with coverage..."
	$(VENV_PYTHON) -m pytest tests/ --cov=github_sdk_core --cov-report=html --cov-report=term

# Format code
format: install-dev
	@echo "Formatting code..."
	$(VENV_PYTHON) -m black github_sdk_core/ tests/
	$(VENV_PYTHON) -m isort github_sdk_core/ tests/

# Run linter
lint: install-dev
	@echo "Running linter..."
	$(VENV_PYTHON) -m ruff check github_sdk_core/ tests/

# Run linter and fix issues
lint-fix: install-dev
	@echo "Running linter with auto-fix..."
	$(VENV_PYTHON) -m ruff check --fix github_sdk_core/ tests/

# Type checking
type-check: install-dev
	@echo "Running type checker..."
	$(VENV_PYTHON) -m mypy github_sdk_core/src/github_sdk_core

# Build distribution packages
build: install-dev clean
	@echo "Building distribution packages..."
	cd github_sdk_core && $(VENV_PYTHON) -m build

# Publish to TestPyPI
publish-test: build
	@echo "Publishing to TestPyPI..."
	$(VENV_PYTHON) -m twine upload --repository testpypi github_sdk_core/dist/*

# Publish to PyPI
publish: build
	@echo "Publishing to PyPI..."
	$(VENV_PYTHON) -m twine upload github_sdk_core/dist/*

# Run all quality checks
all: format lint type-check test
	@echo "All quality checks completed successfully!"

# CI pipeline - runs all checks suitable for continuous integration
ci: install-dev lint type-check test build
	@echo "CI pipeline completed successfully!"

# Development setup (one-time)
setup: install-dev
	@echo "Development environment setup complete!"
	@echo "Run 'make help' to see available commands"
