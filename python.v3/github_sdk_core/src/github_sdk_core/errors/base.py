"""
Base exception class for GitHub SDK errors
"""

from typing import Any


class GitHubAPIError(Exception):
    """
    Base exception class for all GitHub SDK errors.

    Attributes:
        message: Human-readable error message
        status_code: HTTP status code (if applicable)
        response: Raw response data from the API (if applicable)
        docs_url: URL to relevant GitHub API documentation
        request_id: GitHub request ID for debugging
    """

    def __init__(
        self,
        message: str,
        status_code: int | None = None,
        response: dict[str, Any] | None = None,
        docs_url: str | None = None,
        request_id: str | None = None,
    ) -> None:
        """
        Initialize a GitHub API error.

        Args:
            message: Error message
            status_code: HTTP status code if from API response
            response: Full response data from API
            docs_url: Link to relevant documentation
            request_id: GitHub request ID for debugging
        """
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.response = response or {}
        self.docs_url = docs_url
        self.request_id = request_id

    def __str__(self) -> str:
        """Return string representation of the error."""
        parts = [self.message]

        if self.status_code:
            parts.append(f"(HTTP {self.status_code})")

        if self.request_id:
            parts.append(f"[Request ID: {self.request_id}]")

        if self.docs_url:
            parts.append(f"See: {self.docs_url}")

        return " ".join(parts)

    def __repr__(self) -> str:
        """Return developer-friendly representation."""
        return (
            f"{self.__class__.__name__}("
            f"message={self.message!r}, "
            f"status_code={self.status_code}, "
            f"request_id={self.request_id})"
        )

    @property
    def is_retryable(self) -> bool:
        """
        Determine if this error represents a retryable condition.

        Returns:
            True if the error is retryable, False otherwise
        """
        # By default, only 5xx errors are retryable
        if self.status_code:
            return 500 <= self.status_code < 600
        return False
