"""
HTTP client module for GitHub SDK
"""

from github_sdk_core.client.http_client import HTTPClient, RateLimitInfo

__all__ = [
    "HTTPClient",
    "RateLimitInfo",
]
