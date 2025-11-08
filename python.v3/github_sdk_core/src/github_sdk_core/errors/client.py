"""
Client-specific error classes
"""

from typing import Any

from github_sdk_core.errors.base import GitHubAPIError


class ConfigurationError(GitHubAPIError):
    """
    Raised when there's an issue with client configuration.

    This typically indicates:
    - Missing required configuration
    - Invalid configuration values
    - Conflicting configuration options
    """

    def __init__(
        self,
        message: str,
        config_key: str | None = None,
    ) -> None:
        """
        Initialize a configuration error.

        Args:
            message: Error message describing the configuration issue
            config_key: The configuration key that caused the error
        """
        self.config_key = config_key

        if config_key:
            message = f"Configuration error for '{config_key}': {message}"

        super().__init__(message=message)


class NetworkError(GitHubAPIError):
    """
    Raised when a network error occurs during API communication.

    This typically indicates:
    - Connection timeout
    - Connection refused
    - DNS resolution failure
    - SSL/TLS errors
    - Other network-level failures

    Network errors are generally retryable.
    """

    def __init__(
        self,
        message: str = "Network error occurred",
        original_error: Exception | None = None,
    ) -> None:
        """
        Initialize a network error.

        Args:
            message: Error message
            original_error: The original exception that caused this error
        """
        self.original_error = original_error

        if original_error:
            message = f"{message}: {str(original_error)}"

        super().__init__(message=message)

    @property
    def is_retryable(self) -> bool:
        """Network errors are retryable."""
        return True

    def __repr__(self) -> str:
        """Return developer-friendly representation."""
        return (
            f"{self.__class__.__name__}("
            f"message={self.message!r}, "
            f"original_error={self.original_error!r})"
        )
