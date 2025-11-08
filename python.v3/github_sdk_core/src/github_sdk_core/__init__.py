"""
GitHub SDK Core Package

Provides shared utilities and components for all GitHub SDK modules:
- HTTP client with retry and rate limiting
- Authentication and token management
- Error handling and exceptions
- Pagination support
- Request/response validation
- Common utilities
"""

__version__ = "0.0.1"

from github_sdk_core.client import HTTPClient
from github_sdk_core.auth import Auth, TokenAuth
from github_sdk_core.errors import (
    GitHubAPIError,
    RateLimitError,
    AuthenticationError,
    NotFoundError,
    ValidationError as GitHubValidationError,
    NetworkError,
    ConfigurationError,
)
from github_sdk_core.pagination import Paginator, PaginationParams
from github_sdk_core.validation import (
    validate_repository_name,
    validate_username,
    validate_branch_name,
    validate_tag_name,
)

__all__ = [
    # Version
    "__version__",
    # Client
    "HTTPClient",
    # Auth
    "Auth",
    "TokenAuth",
    # Errors
    "GitHubAPIError",
    "RateLimitError",
    "AuthenticationError",
    "NotFoundError",
    "GitHubValidationError",
    "NetworkError",
    "ConfigurationError",
    # Pagination
    "Paginator",
    "PaginationParams",
    # Validation
    "validate_repository_name",
    "validate_username",
    "validate_branch_name",
    "validate_tag_name",
]
