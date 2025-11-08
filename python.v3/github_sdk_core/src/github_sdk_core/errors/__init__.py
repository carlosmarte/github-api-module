"""
GitHub SDK Error Classes

Comprehensive exception hierarchy for GitHub API errors.
"""

from github_sdk_core.errors.base import GitHubAPIError
from github_sdk_core.errors.http import (
    AuthenticationError,
    ForbiddenError,
    NotFoundError,
    RateLimitError,
    ServerError,
    ValidationError,
)
from github_sdk_core.errors.client import ConfigurationError, NetworkError

__all__ = [
    # Base
    "GitHubAPIError",
    # HTTP Errors
    "AuthenticationError",
    "ForbiddenError",
    "NotFoundError",
    "RateLimitError",
    "ServerError",
    "ValidationError",
    # Client Errors
    "ConfigurationError",
    "NetworkError",
]
