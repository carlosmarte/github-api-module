# GitHub SDK Python

Comprehensive GitHub API SDK for Python 3.11+

## Features

- **Async/Await Support**: Built on `httpx` for modern async Python
- **Complete API Coverage**: All 11 GitHub API modules (repos, issues, pulls, activity, users, search, git, gist, teams, clone, reactions)
- **Smart Rate Limiting**: Automatic rate limit detection and handling
- **Retry Logic**: Exponential backoff for failed requests
- **Type Hints**: Full type annotations for better IDE support
- **Multiple Auth Methods**: Token, OAuth, GitHub App support
- **Pagination**: Async iterators for paginated responses
- **Input Validation**: Comprehensive validation before API calls

## Project Structure

```
python.v3/
├── github_sdk_core/         # Core utilities (auth, client, errors, pagination)
├── repos/                   # Repository management
├── issues/                  # Issue tracking
├── pulls/                   # Pull requests
├── activity/                # Events, notifications, stars
├── users/                   # User management
├── search/                  # Search API
├── git/                     # Git data API
├── gist/                    # Gist management
├── teams/                   # Team management
├── clone/                   # Repository cloning
├── reactions/               # Reactions API
├── tests/                   # Test suite
├── examples/                # Usage examples
└── docs/                    # Documentation
```

## Installation

```bash
# Install development environment
make setup

# Or manually
pip install -e ".[dev]"
```

## Quick Start

```python
import asyncio
from github_sdk_core import HTTPClient
from github_sdk_core.auth import TokenAuth

async def main():
    # Create authenticated client
    auth = TokenAuth.from_environment()

    async with HTTPClient(auth=auth) as client:
        # Make API requests
        repo = await client.get("/repos/owner/repo")
        print(f"Repository: {repo['name']}")
        print(f"Stars: {repo['stargazers_count']}")

if __name__ == "__main__":
    asyncio.run(main())
```

## Authentication

Multiple authentication methods are supported:

```python
# From environment variable (GITHUB_TOKEN, GH_TOKEN, etc.)
auth = TokenAuth.from_environment()

# From config file
auth = TokenAuth.from_config("~/.github-sdk.json")

# Direct token
auth = TokenAuth("ghp_...")

# Auto-detect (tries env then config)
auth = TokenAuth.auto_detect()
```

## Development

```bash
# Format code
make format

# Run linter
make lint

# Type checking
make type-check

# Run tests
make test

# Run all checks
make all
```

## Modules

### Core (`github_sdk_core`)
- HTTP client with retry and rate limiting
- Authentication (token, OAuth, GitHub App)
- Error handling with specific exception types
- Pagination support with async iterators
- Input validation

### Module Status

| Module | Status | Priority | Description |
|--------|--------|----------|-------------|
| `github_sdk_core` | ✅ Complete | Critical | Foundation & shared utilities |
| `repos` | 🚧 Planned | High | Repository management |
| `issues` | 🚧 Planned | High | Issue tracking |
| `pulls` | 🚧 Planned | High | Pull requests |
| `activity` | 🚧 Planned | Medium | Events & notifications |
| `users` | 🚧 Planned | Medium | User management |
| `search` | 🚧 Planned | Medium | Search API |
| `git` | 🚧 Planned | Medium | Git data API |
| `gist` | 🚧 Planned | Low | Gist management |
| `teams` | 🚧 Planned | Low | Team management |
| `clone` | 🚧 Planned | Low | Repository cloning |
| `reactions` | 🚧 Planned | Low | Reactions API |

## Implementation Plan

Following **Feature > Story > Task** hierarchy:

- **Feature 0**: ✅ Foundation (Complete)
  - Core project setup
  - HTTP client
  - Authentication
  - Error handling
  - Pagination
  - Validation

- **Feature 1**: 🚧 Repos Module (Next)
- **Feature 2**: 🚧 Issues Module
- **Feature 3**: 🚧 Pulls Module
- **Features 4-11**: 🚧 Other modules

See detailed execution plan in project documentation.

## Requirements

- Python 3.11 or higher
- httpx >= 0.27.0
- pydantic >= 2.0.0
- python-dotenv >= 1.0.0

## License

MIT

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.
