"""
Pytest configuration and shared fixtures
"""

import pytest
from github_sdk_core.auth import TokenAuth
from github_sdk_core.client import HTTPClient


@pytest.fixture
def mock_token() -> str:
    """Return a mock GitHub token."""
    return "ghp_" + "0" * 36


@pytest.fixture
def token_auth(mock_token: str) -> TokenAuth:
    """Return a TokenAuth instance with mock token."""
    return TokenAuth(mock_token)


@pytest.fixture
async def http_client(token_auth: TokenAuth) -> HTTPClient:
    """Return an HTTPClient instance with mock auth."""
    client = HTTPClient(auth=token_auth)
    yield client
    await client.close()
