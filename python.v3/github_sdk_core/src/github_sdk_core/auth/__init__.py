"""
Authentication module for GitHub SDK

Supports multiple authentication methods and token sources.
"""

from github_sdk_core.auth.base import Auth
from github_sdk_core.auth.token import TokenAuth

__all__ = [
    "Auth",
    "TokenAuth",
]
