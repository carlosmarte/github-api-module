"""
Constants used across the GitHub SDK
"""

from typing import Final

# GitHub API Configuration
DEFAULT_BASE_URL: Final[str] = "https://api.github.com"
DEFAULT_API_VERSION: Final[str] = "2022-11-28"
DEFAULT_USER_AGENT: Final[str] = "github-sdk-python/0.0.1"

# Request Configuration
DEFAULT_TIMEOUT: Final[int] = 30  # seconds
DEFAULT_PER_PAGE: Final[int] = 30
MAX_PER_PAGE: Final[int] = 100
DEFAULT_MAX_RETRIES: Final[int] = 3
DEFAULT_RETRY_BACKOFF_FACTOR: Final[float] = 2.0
DEFAULT_RATE_LIMIT_PADDING: Final[int] = 100  # milliseconds

# Pagination
MAX_PAGES: Final[int] = 1000  # Safety limit

# HTTP Status Codes
HTTP_OK: Final[int] = 200
HTTP_CREATED: Final[int] = 201
HTTP_ACCEPTED: Final[int] = 202
HTTP_NO_CONTENT: Final[int] = 204
HTTP_BAD_REQUEST: Final[int] = 400
HTTP_UNAUTHORIZED: Final[int] = 401
HTTP_FORBIDDEN: Final[int] = 403
HTTP_NOT_FOUND: Final[int] = 404
HTTP_UNPROCESSABLE_ENTITY: Final[int] = 422
HTTP_INTERNAL_SERVER_ERROR: Final[int] = 500
HTTP_BAD_GATEWAY: Final[int] = 502
HTTP_SERVICE_UNAVAILABLE: Final[int] = 503

# Token Patterns
TOKEN_PREFIXES: Final[tuple[str, ...]] = (
    "ghp_",  # Personal Access Token (classic)
    "github_pat_",  # Fine-grained PAT
    "gho_",  # OAuth token
    "ghs_",  # GitHub App installation token
)

# Environment Variables
ENV_TOKEN_VARS: Final[tuple[str, ...]] = (
    "GITHUB_TOKEN",
    "GH_TOKEN",
    "GITHUB_ACCESS_TOKEN",
    "GITHUB_PAT",
)

# Config File Paths
CONFIG_FILE_PATHS: Final[tuple[str, ...]] = (
    "~/.github-sdk.json",
    "~/.config/github-sdk/config.json",
)

# Headers
ACCEPT_HEADER: Final[str] = "application/vnd.github.v3+json"
API_VERSION_HEADER_NAME: Final[str] = "X-GitHub-Api-Version"
AUTHORIZATION_HEADER_NAME: Final[str] = "Authorization"
USER_AGENT_HEADER_NAME: Final[str] = "User-Agent"

# Rate Limit Headers
RATE_LIMIT_LIMIT_HEADER: Final[str] = "x-ratelimit-limit"
RATE_LIMIT_REMAINING_HEADER: Final[str] = "x-ratelimit-remaining"
RATE_LIMIT_RESET_HEADER: Final[str] = "x-ratelimit-reset"
RATE_LIMIT_USED_HEADER: Final[str] = "x-ratelimit-used"
RATE_LIMIT_RESOURCE_HEADER: Final[str] = "x-ratelimit-resource"

# Pagination Headers
LINK_HEADER: Final[str] = "Link"

# Validation Limits
MAX_REPO_NAME_LENGTH: Final[int] = 100
MAX_USERNAME_LENGTH: Final[int] = 39
MAX_BRANCH_NAME_LENGTH: Final[int] = 255
MAX_TAG_NAME_LENGTH: Final[int] = 255

# Retryable Status Codes
RETRYABLE_STATUS_CODES: Final[set[int]] = {
    HTTP_INTERNAL_SERVER_ERROR,
    HTTP_BAD_GATEWAY,
    HTTP_SERVICE_UNAVAILABLE,
}

# Reserved Repository Names
RESERVED_REPO_NAMES: Final[set[str]] = {
    ".", "..", ".git", ".github",
    "admin", "api", "assets", "billing",
    "business", "dashboard", "explore", "features",
    "gist", "git", "github", "help",
    "integrations", "issues", "login", "logout",
    "marketplace", "new", "notifications", "organizations",
    "pricing", "pulls", "search", "security",
    "settings", "site", "sponsors", "stars",
    "styleguide", "topics", "trending", "users",
}
