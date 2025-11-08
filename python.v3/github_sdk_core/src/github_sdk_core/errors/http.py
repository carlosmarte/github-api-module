"""
HTTP-specific error classes for GitHub API responses
"""

from datetime import datetime
from typing import Any

from github_sdk_core.errors.base import GitHubAPIError


class AuthenticationError(GitHubAPIError):
    """
    Raised when authentication fails (HTTP 401).

    This typically indicates:
    - Invalid or expired token
    - Missing authentication credentials
    - Token lacks required permissions
    """

    def __init__(
        self,
        message: str = "Authentication failed",
        response: dict[str, Any] | None = None,
        docs_url: str | None = None,
        request_id: str | None = None,
    ) -> None:
        super().__init__(
            message=message,
            status_code=401,
            response=response,
            docs_url=docs_url,
            request_id=request_id,
        )


class ForbiddenError(GitHubAPIError):
    """
    Raised when access is forbidden (HTTP 403).

    This typically indicates:
    - Insufficient permissions/scopes
    - Resource access is restricted
    - Rate limit exceeded (use RateLimitError instead if rate limit detected)
    """

    def __init__(
        self,
        message: str = "Access forbidden",
        response: dict[str, Any] | None = None,
        docs_url: str | None = None,
        request_id: str | None = None,
    ) -> None:
        super().__init__(
            message=message,
            status_code=403,
            response=response,
            docs_url=docs_url,
            request_id=request_id,
        )


class NotFoundError(GitHubAPIError):
    """
    Raised when a resource is not found (HTTP 404).

    This typically indicates:
    - Repository doesn't exist
    - User/organization doesn't exist
    - Branch/tag doesn't exist
    - Insufficient permissions (GitHub returns 404 instead of 403 for private repos)
    """

    def __init__(
        self,
        message: str = "Resource not found",
        resource_type: str | None = None,
        resource_id: str | None = None,
        response: dict[str, Any] | None = None,
        docs_url: str | None = None,
        request_id: str | None = None,
    ) -> None:
        self.resource_type = resource_type
        self.resource_id = resource_id

        if resource_type and resource_id:
            message = f"{resource_type} '{resource_id}' not found"

        super().__init__(
            message=message,
            status_code=404,
            response=response,
            docs_url=docs_url,
            request_id=request_id,
        )


class ValidationError(GitHubAPIError):
    """
    Raised when request validation fails (HTTP 422).

    This typically indicates:
    - Invalid request parameters
    - Missing required fields
    - Field values that don't meet GitHub's requirements
    """

    def __init__(
        self,
        message: str = "Validation failed",
        errors: list[dict[str, Any]] | None = None,
        response: dict[str, Any] | None = None,
        docs_url: str | None = None,
        request_id: str | None = None,
    ) -> None:
        self.errors = errors or []

        # Enhance message with validation error details
        if self.errors:
            error_details = []
            for error in self.errors:
                field = error.get("field", "unknown")
                code = error.get("code", "invalid")
                error_details.append(f"{field}: {code}")

            if error_details:
                message = f"{message}: {', '.join(error_details)}"

        super().__init__(
            message=message,
            status_code=422,
            response=response,
            docs_url=docs_url,
            request_id=request_id,
        )


class RateLimitError(GitHubAPIError):
    """
    Raised when rate limit is exceeded (HTTP 403 with rate limit headers).

    GitHub API has different rate limits for different resources:
    - Core API: 5,000 requests/hour (authenticated)
    - Search API: 30 requests/minute (authenticated)
    - GraphQL API: 5,000 points/hour (authenticated)

    Attributes:
        limit: Total rate limit
        remaining: Remaining requests in current window
        reset_at: When the rate limit resets (datetime)
        retry_after: Seconds until rate limit resets
        resource: Rate limit resource type (core, search, graphql, etc.)
    """

    def __init__(
        self,
        message: str = "Rate limit exceeded",
        limit: int | None = None,
        remaining: int | None = None,
        reset_at: datetime | None = None,
        retry_after: int | None = None,
        resource: str | None = None,
        response: dict[str, Any] | None = None,
        docs_url: str | None = None,
        request_id: str | None = None,
    ) -> None:
        self.limit = limit
        self.remaining = remaining
        self.reset_at = reset_at
        self.retry_after = retry_after
        self.resource = resource

        # Enhance message with rate limit details
        if reset_at:
            message = f"{message}. Resets at {reset_at.isoformat()}"
        elif retry_after:
            message = f"{message}. Retry after {retry_after} seconds"

        if resource:
            message = f"{message} (resource: {resource})"

        super().__init__(
            message=message,
            status_code=403,
            response=response,
            docs_url=docs_url,
            request_id=request_id,
        )

    @property
    def is_retryable(self) -> bool:
        """Rate limit errors are retryable after waiting."""
        return True


class ServerError(GitHubAPIError):
    """
    Raised when GitHub API returns a server error (HTTP 5xx).

    This typically indicates:
    - GitHub is experiencing issues
    - Temporary service disruption
    - Internal server error

    These errors are generally retryable with exponential backoff.
    """

    def __init__(
        self,
        message: str = "GitHub server error",
        status_code: int = 500,
        response: dict[str, Any] | None = None,
        docs_url: str | None = None,
        request_id: str | None = None,
    ) -> None:
        super().__init__(
            message=message,
            status_code=status_code,
            response=response,
            docs_url=docs_url,
            request_id=request_id,
        )

    @property
    def is_retryable(self) -> bool:
        """Server errors are retryable."""
        return True
