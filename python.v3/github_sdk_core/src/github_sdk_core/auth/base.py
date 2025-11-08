"""
Base authentication class
"""

from abc import ABC, abstractmethod
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    import httpx


class Auth(ABC):
    """
    Abstract base class for GitHub authentication.

    All authentication methods must implement this interface.
    """

    @abstractmethod
    def apply_auth(self, request: "httpx.Request") -> None:
        """
        Apply authentication to an HTTP request.

        This method modifies the request in-place to add authentication
        credentials (typically by setting headers).

        Args:
            request: The HTTP request to authenticate
        """
        pass

    @abstractmethod
    def validate(self) -> bool:
        """
        Validate the authentication credentials.

        Returns:
            True if credentials are valid, False otherwise

        Raises:
            AuthenticationError: If credentials are invalid
        """
        pass

    def __repr__(self) -> str:
        """Return developer-friendly representation."""
        return f"{self.__class__.__name__}()"
