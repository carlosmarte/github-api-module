"""
Token-based authentication implementation
"""

import json
import os
import re
from pathlib import Path
from typing import TYPE_CHECKING

from github_sdk_core.auth.base import Auth
from github_sdk_core.constants import (
    AUTHORIZATION_HEADER_NAME,
    CONFIG_FILE_PATHS,
    ENV_TOKEN_VARS,
    TOKEN_PREFIXES,
)
from github_sdk_core.errors import AuthenticationError, ConfigurationError

if TYPE_CHECKING:
    import httpx


class TokenAuth(Auth):
    """
    Token-based authentication for GitHub API.

    Supports multiple token types:
    - Personal Access Token (classic): ghp_*
    - Fine-grained PAT: github_pat_*
    - OAuth token: gho_*
    - GitHub App installation token: ghs_*
    - Legacy 40-character hex tokens

    Tokens can be loaded from:
    1. Direct initialization
    2. Environment variables
    3. Configuration files
    """

    def __init__(self, token: str) -> None:
        """
        Initialize token authentication.

        Args:
            token: GitHub authentication token

        Raises:
            ConfigurationError: If token is empty or invalid format
        """
        if not token:
            raise ConfigurationError("Token cannot be empty", config_key="token")

        self.token = token.strip()
        self._validate_token_format()

    def _validate_token_format(self) -> None:
        """
        Validate token format.

        Raises:
            ConfigurationError: If token format is invalid
        """
        # Check for known prefixes
        has_valid_prefix = any(self.token.startswith(prefix) for prefix in TOKEN_PREFIXES)

        # Check for legacy 40-character hex token
        is_legacy_token = bool(re.match(r"^[a-f0-9]{40}$", self.token))

        if not has_valid_prefix and not is_legacy_token:
            raise ConfigurationError(
                f"Invalid token format. Expected token to start with one of "
                f"{TOKEN_PREFIXES} or be a 40-character hex string",
                config_key="token",
            )

    def apply_auth(self, request: "httpx.Request") -> None:
        """
        Apply token authentication to request.

        Args:
            request: The HTTP request to authenticate
        """
        request.headers[AUTHORIZATION_HEADER_NAME] = f"Bearer {self.token}"

    def validate(self) -> bool:
        """
        Validate the token format.

        Returns:
            True if token format is valid

        Raises:
            AuthenticationError: If token format is invalid
        """
        try:
            self._validate_token_format()
            return True
        except ConfigurationError as e:
            raise AuthenticationError(str(e)) from e

    @classmethod
    def from_environment(cls, var_name: str | None = None) -> "TokenAuth":
        """
        Load token from environment variables.

        Checks in order (if var_name not specified):
        1. GITHUB_TOKEN
        2. GH_TOKEN
        3. GITHUB_ACCESS_TOKEN
        4. GITHUB_PAT

        Args:
            var_name: Specific environment variable name to use

        Returns:
            TokenAuth instance

        Raises:
            ConfigurationError: If no token found in environment
        """
        if var_name:
            token = os.getenv(var_name)
            if not token:
                raise ConfigurationError(
                    f"Environment variable '{var_name}' not found or empty",
                    config_key=var_name,
                )
            return cls(token)

        # Try each environment variable in order
        for var in ENV_TOKEN_VARS:
            token = os.getenv(var)
            if token:
                return cls(token)

        raise ConfigurationError(
            f"No GitHub token found in environment variables. "
            f"Tried: {', '.join(ENV_TOKEN_VARS)}",
            config_key="token",
        )

    @classmethod
    def from_file(cls, file_path: str | Path) -> "TokenAuth":
        """
        Load token from a file.

        The file should contain just the token string, or be a JSON file
        with a "token" key.

        Args:
            file_path: Path to file containing token

        Returns:
            TokenAuth instance

        Raises:
            ConfigurationError: If file not found or invalid format
        """
        path = Path(file_path).expanduser()

        if not path.exists():
            raise ConfigurationError(
                f"Token file not found: {path}",
                config_key="token_file",
            )

        try:
            content = path.read_text().strip()

            # Try to parse as JSON first
            if content.startswith("{"):
                data = json.loads(content)
                if "token" in data:
                    return cls(data["token"])
                raise ConfigurationError(
                    "JSON token file must contain a 'token' key",
                    config_key="token_file",
                )

            # Otherwise, treat as plain token
            return cls(content)

        except json.JSONDecodeError as e:
            raise ConfigurationError(
                f"Invalid JSON in token file: {e}",
                config_key="token_file",
            ) from e
        except Exception as e:
            raise ConfigurationError(
                f"Error reading token file: {e}",
                config_key="token_file",
            ) from e

    @classmethod
    def from_config(cls, config_path: str | Path | None = None) -> "TokenAuth":
        """
        Load token from configuration file.

        If config_path not specified, searches in order:
        1. ~/.github-sdk.json
        2. ~/.config/github-sdk/config.json

        Args:
            config_path: Path to configuration file

        Returns:
            TokenAuth instance

        Raises:
            ConfigurationError: If config file not found or invalid
        """
        if config_path:
            return cls.from_file(config_path)

        # Try default config file locations
        for config_file in CONFIG_FILE_PATHS:
            path = Path(config_file).expanduser()
            if path.exists():
                try:
                    return cls.from_file(path)
                except ConfigurationError:
                    continue

        raise ConfigurationError(
            f"No configuration file found. Tried: {', '.join(CONFIG_FILE_PATHS)}",
            config_key="config_file",
        )

    @classmethod
    def auto_detect(cls) -> "TokenAuth":
        """
        Automatically detect and load token from available sources.

        Tries in order:
        1. Environment variables
        2. Configuration files

        Returns:
            TokenAuth instance

        Raises:
            ConfigurationError: If no token found in any source
        """
        # Try environment first
        try:
            return cls.from_environment()
        except ConfigurationError:
            pass

        # Try config files
        try:
            return cls.from_config()
        except ConfigurationError:
            pass

        raise ConfigurationError(
            "No GitHub token found. Please set GITHUB_TOKEN environment "
            "variable or create a configuration file.",
            config_key="token",
        )

    @property
    def token_type(self) -> str:
        """
        Detect the type of token.

        Returns:
            Token type string: 'pat_classic', 'pat_fine_grained', 'oauth', 'app', or 'legacy'
        """
        if self.token.startswith("ghp_"):
            return "pat_classic"
        elif self.token.startswith("github_pat_"):
            return "pat_fine_grained"
        elif self.token.startswith("gho_"):
            return "oauth"
        elif self.token.startswith("ghs_"):
            return "app"
        else:
            return "legacy"

    def __repr__(self) -> str:
        """Return developer-friendly representation (without exposing token)."""
        masked_token = f"{self.token[:8]}..." if len(self.token) > 8 else "***"
        return f"{self.__class__.__name__}(token={masked_token}, type={self.token_type})"
