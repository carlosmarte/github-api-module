"""
Tests for authentication module
"""

import pytest
from github_sdk_core.auth import TokenAuth
from github_sdk_core.errors import ConfigurationError


class TestTokenAuth:
    """Test TokenAuth class."""

    def test_token_auth_creation(self, mock_token: str) -> None:
        """Test creating TokenAuth with valid token."""
        auth = TokenAuth(mock_token)
        assert auth.token == mock_token
        assert auth.token_type == "pat_classic"

    def test_token_auth_invalid_empty(self) -> None:
        """Test that empty token raises error."""
        with pytest.raises(ConfigurationError, match="Token cannot be empty"):
            TokenAuth("")

    def test_token_auth_invalid_format(self) -> None:
        """Test that invalid format raises error."""
        with pytest.raises(ConfigurationError, match="Invalid token format"):
            TokenAuth("invalid_token")

    def test_token_type_detection_pat_classic(self) -> None:
        """Test PAT classic token type detection."""
        auth = TokenAuth("ghp_" + "0" * 36)
        assert auth.token_type == "pat_classic"

    def test_token_type_detection_pat_fine_grained(self) -> None:
        """Test fine-grained PAT token type detection."""
        auth = TokenAuth("github_pat_" + "0" * 40)
        assert auth.token_type == "pat_fine_grained"

    def test_token_type_detection_oauth(self) -> None:
        """Test OAuth token type detection."""
        auth = TokenAuth("gho_" + "0" * 36)
        assert auth.token_type == "oauth"

    def test_token_type_detection_app(self) -> None:
        """Test GitHub App token type detection."""
        auth = TokenAuth("ghs_" + "0" * 36)
        assert auth.token_type == "app"

    def test_token_type_detection_legacy(self) -> None:
        """Test legacy 40-char hex token type detection."""
        auth = TokenAuth("a" * 40)
        assert auth.token_type == "legacy"

    def test_token_repr_masks_token(self, mock_token: str) -> None:
        """Test that repr masks the token."""
        auth = TokenAuth(mock_token)
        repr_str = repr(auth)
        assert "ghp_0000..." in repr_str
        assert mock_token not in repr_str


@pytest.mark.skip(reason="Requires environment setup")
class TestTokenAuthFromEnvironment:
    """Test loading token from environment."""

    def test_from_environment(self) -> None:
        """Test loading token from GITHUB_TOKEN env var."""
        # This would require mocking os.getenv
        pass
