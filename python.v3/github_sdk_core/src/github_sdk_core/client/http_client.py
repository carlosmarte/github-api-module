"""
Async HTTP client for GitHub API with retry logic and rate limiting
"""

import asyncio
from datetime import datetime, timezone
from typing import Any, AsyncGenerator
from dataclasses import dataclass

import httpx

from github_sdk_core.auth import Auth
from github_sdk_core.constants import (
    ACCEPT_HEADER,
    API_VERSION_HEADER_NAME,
    DEFAULT_API_VERSION,
    DEFAULT_BASE_URL,
    DEFAULT_MAX_RETRIES,
    DEFAULT_RATE_LIMIT_PADDING,
    DEFAULT_RETRY_BACKOFF_FACTOR,
    DEFAULT_TIMEOUT,
    DEFAULT_USER_AGENT,
    LINK_HEADER,
    RATE_LIMIT_LIMIT_HEADER,
    RATE_LIMIT_REMAINING_HEADER,
    RATE_LIMIT_RESET_HEADER,
    RATE_LIMIT_RESOURCE_HEADER,
    RATE_LIMIT_USED_HEADER,
    RETRYABLE_STATUS_CODES,
    USER_AGENT_HEADER_NAME,
)
from github_sdk_core.errors import (
    AuthenticationError,
    ForbiddenError,
    GitHubAPIError,
    NetworkError,
    NotFoundError,
    RateLimitError,
    ServerError,
    ValidationError,
)


@dataclass
class RateLimitInfo:
    """
    Rate limit information from GitHub API response headers.

    Attributes:
        limit: Total rate limit for the resource
        remaining: Remaining requests in current window
        used: Number of requests used in current window
        reset_at: When the rate limit resets
        resource: Rate limit resource type (core, search, graphql, etc.)
    """

    limit: int
    remaining: int
    used: int
    reset_at: datetime
    resource: str = "core"

    @property
    def is_exhausted(self) -> bool:
        """Check if rate limit is exhausted."""
        return self.remaining == 0

    @property
    def seconds_until_reset(self) -> int:
        """Calculate seconds until rate limit resets."""
        now = datetime.now(timezone.utc)
        delta = self.reset_at - now
        return max(0, int(delta.total_seconds()))

    def __str__(self) -> str:
        """Return human-readable rate limit info."""
        return (
            f"RateLimit(resource={self.resource}, "
            f"{self.remaining}/{self.limit} remaining, "
            f"resets in {self.seconds_until_reset}s)"
        )


class HTTPClient:
    """
    Async HTTP client for GitHub API with advanced features:
    - Automatic retry with exponential backoff
    - Rate limit handling and automatic waiting
    - Request/response error handling
    - Pagination support
    - Request timeout management
    """

    def __init__(
        self,
        auth: Auth | None = None,
        base_url: str = DEFAULT_BASE_URL,
        timeout: int = DEFAULT_TIMEOUT,
        max_retries: int = DEFAULT_MAX_RETRIES,
        retry_backoff_factor: float = DEFAULT_RETRY_BACKOFF_FACTOR,
        rate_limit_padding: int = DEFAULT_RATE_LIMIT_PADDING,
        user_agent: str | None = None,
        debug: bool = False,
    ) -> None:
        """
        Initialize HTTP client.

        Args:
            auth: Authentication handler
            base_url: GitHub API base URL
            timeout: Request timeout in seconds
            max_retries: Maximum retry attempts for failed requests
            retry_backoff_factor: Multiplier for exponential backoff
            rate_limit_padding: Milliseconds to wait between requests
            user_agent: Custom user agent string
            debug: Enable debug logging
        """
        self.auth = auth
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self.max_retries = max_retries
        self.retry_backoff_factor = retry_backoff_factor
        self.rate_limit_padding = rate_limit_padding / 1000.0  # Convert to seconds
        self.user_agent = user_agent or DEFAULT_USER_AGENT
        self.debug = debug

        # Track last request time for rate limit padding
        self._last_request_time: float | None = None

        # Create httpx client
        self._client: httpx.AsyncClient | None = None

    async def __aenter__(self) -> "HTTPClient":
        """Async context manager entry."""
        await self._ensure_client()
        return self

    async def __aexit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        """Async context manager exit."""
        await self.close()

    async def _ensure_client(self) -> None:
        """Ensure httpx client is initialized."""
        if self._client is None:
            self._client = httpx.AsyncClient(
                timeout=httpx.Timeout(self.timeout),
                follow_redirects=True,
            )

    async def close(self) -> None:
        """Close the HTTP client and cleanup resources."""
        if self._client:
            await self._client.aclose()
            self._client = None

    def _build_headers(self) -> dict[str, str]:
        """Build default headers for requests."""
        return {
            "Accept": ACCEPT_HEADER,
            API_VERSION_HEADER_NAME: DEFAULT_API_VERSION,
            USER_AGENT_HEADER_NAME: self.user_agent,
        }

    async def _apply_rate_limit_padding(self) -> None:
        """Apply rate limit padding between requests."""
        if self._last_request_time and self.rate_limit_padding > 0:
            elapsed = asyncio.get_event_loop().time() - self._last_request_time
            if elapsed < self.rate_limit_padding:
                await asyncio.sleep(self.rate_limit_padding - elapsed)

    def _parse_rate_limit_headers(self, response: httpx.Response) -> RateLimitInfo | None:
        """
        Parse rate limit information from response headers.

        Args:
            response: HTTP response

        Returns:
            RateLimitInfo if headers present, None otherwise
        """
        headers = response.headers

        if RATE_LIMIT_LIMIT_HEADER not in headers:
            return None

        try:
            limit = int(headers[RATE_LIMIT_LIMIT_HEADER])
            remaining = int(headers[RATE_LIMIT_REMAINING_HEADER])
            used = int(headers.get(RATE_LIMIT_USED_HEADER, 0))
            reset_timestamp = int(headers[RATE_LIMIT_RESET_HEADER])
            resource = headers.get(RATE_LIMIT_RESOURCE_HEADER, "core")

            reset_at = datetime.fromtimestamp(reset_timestamp, tz=timezone.utc)

            return RateLimitInfo(
                limit=limit,
                remaining=remaining,
                used=used,
                reset_at=reset_at,
                resource=resource,
            )
        except (ValueError, KeyError):
            return None

    def _parse_error_response(self, response: httpx.Response) -> dict[str, Any]:
        """
        Parse error information from response.

        Args:
            response: HTTP response

        Returns:
            Dictionary with error information
        """
        try:
            data = response.json()
        except Exception:
            data = {"message": response.text or "Unknown error"}

        return {
            "message": data.get("message", "Unknown error"),
            "documentation_url": data.get("documentation_url"),
            "errors": data.get("errors", []),
            "status": response.status_code,
        }

    def _raise_for_status(self, response: httpx.Response) -> None:
        """
        Raise appropriate exception for error responses.

        Args:
            response: HTTP response

        Raises:
            GitHubAPIError: Appropriate error based on status code
        """
        if response.is_success:
            return

        error_data = self._parse_error_response(response)
        message = error_data["message"]
        docs_url = error_data.get("documentation_url")
        request_id = response.headers.get("x-github-request-id")

        # Check for rate limit error (403 with rate limit headers)
        if response.status_code == 403:
            rate_limit = self._parse_rate_limit_headers(response)
            if rate_limit and rate_limit.is_exhausted:
                raise RateLimitError(
                    message=message,
                    limit=rate_limit.limit,
                    remaining=rate_limit.remaining,
                    reset_at=rate_limit.reset_at,
                    retry_after=rate_limit.seconds_until_reset,
                    resource=rate_limit.resource,
                    response=error_data,
                    docs_url=docs_url,
                    request_id=request_id,
                )
            # Otherwise, it's a forbidden error
            raise ForbiddenError(
                message=message,
                response=error_data,
                docs_url=docs_url,
                request_id=request_id,
            )

        # Handle other error types
        if response.status_code == 401:
            raise AuthenticationError(
                message=message,
                response=error_data,
                docs_url=docs_url,
                request_id=request_id,
            )
        elif response.status_code == 404:
            raise NotFoundError(
                message=message,
                response=error_data,
                docs_url=docs_url,
                request_id=request_id,
            )
        elif response.status_code == 422:
            raise ValidationError(
                message=message,
                errors=error_data.get("errors", []),
                response=error_data,
                docs_url=docs_url,
                request_id=request_id,
            )
        elif response.status_code >= 500:
            raise ServerError(
                message=message,
                status_code=response.status_code,
                response=error_data,
                docs_url=docs_url,
                request_id=request_id,
            )
        else:
            raise GitHubAPIError(
                message=message,
                status_code=response.status_code,
                response=error_data,
                docs_url=docs_url,
                request_id=request_id,
            )

    async def _request_with_retry(
        self,
        method: str,
        url: str,
        **kwargs: Any,
    ) -> httpx.Response:
        """
        Make HTTP request with retry logic.

        Args:
            method: HTTP method
            url: Request URL
            **kwargs: Additional request parameters

        Returns:
            HTTP response

        Raises:
            GitHubAPIError: On request failure after retries
            NetworkError: On network-level failure
        """
        await self._ensure_client()
        assert self._client is not None

        last_exception: Exception | None = None

        for attempt in range(self.max_retries + 1):
            try:
                # Apply rate limit padding
                await self._apply_rate_limit_padding()

                # Track request time
                self._last_request_time = asyncio.get_event_loop().time()

                # Make request
                response = await self._client.request(method, url, **kwargs)

                # Check for errors
                self._raise_for_status(response)

                return response

            except (httpx.TimeoutException, httpx.NetworkError, httpx.ConnectError) as e:
                last_exception = NetworkError(
                    message=f"Network error on attempt {attempt + 1}/{self.max_retries + 1}",
                    original_error=e,
                )

                if attempt < self.max_retries:
                    await self._backoff(attempt)
                    continue

                raise last_exception

            except GitHubAPIError as e:
                # Handle rate limit errors
                if isinstance(e, RateLimitError):
                    if e.retry_after:
                        if self.debug:
                            print(f"Rate limit hit, waiting {e.retry_after}s...")
                        await asyncio.sleep(e.retry_after)
                        continue

                # Retry on server errors and retryable errors
                if e.is_retryable and attempt < self.max_retries:
                    await self._backoff(attempt)
                    continue

                raise

        # Should not reach here, but just in case
        if last_exception:
            raise last_exception

        raise GitHubAPIError("Request failed after all retries")

    async def _backoff(self, attempt: int) -> None:
        """
        Perform exponential backoff.

        Args:
            attempt: Current attempt number (0-indexed)
        """
        delay = self.retry_backoff_factor ** attempt
        if self.debug:
            print(f"Backing off for {delay}s before retry...")
        await asyncio.sleep(delay)

    async def request(
        self,
        method: str,
        path: str,
        params: dict[str, Any] | None = None,
        json: dict[str, Any] | None = None,
        headers: dict[str, str] | None = None,
        **kwargs: Any,
    ) -> dict[str, Any]:
        """
        Make an HTTP request to GitHub API.

        Args:
            method: HTTP method (GET, POST, PUT, PATCH, DELETE)
            path: API endpoint path (will be appended to base_url)
            params: Query parameters
            json: JSON request body
            headers: Additional headers
            **kwargs: Additional httpx request parameters

        Returns:
            Response data as dictionary

        Raises:
            GitHubAPIError: On API error
            NetworkError: On network error
        """
        # Build full URL
        url = f"{self.base_url}/{path.lstrip('/')}"

        # Build headers
        request_headers = self._build_headers()
        if headers:
            request_headers.update(headers)

        # Apply authentication
        if self.auth:
            # Create a temporary request to apply auth
            temp_request = httpx.Request(method, url, headers=request_headers)
            self.auth.apply_auth(temp_request)
            request_headers = dict(temp_request.headers)

        # Make request with retry
        response = await self._request_with_retry(
            method=method,
            url=url,
            params=params,
            json=json,
            headers=request_headers,
            **kwargs,
        )

        # Parse response
        if response.status_code == 204:  # No Content
            return {}

        try:
            return response.json()
        except Exception:
            return {"data": response.text}

    async def get(self, path: str, **kwargs: Any) -> dict[str, Any]:
        """Make a GET request."""
        return await self.request("GET", path, **kwargs)

    async def post(self, path: str, **kwargs: Any) -> dict[str, Any]:
        """Make a POST request."""
        return await self.request("POST", path, **kwargs)

    async def put(self, path: str, **kwargs: Any) -> dict[str, Any]:
        """Make a PUT request."""
        return await self.request("PUT", path, **kwargs)

    async def patch(self, path: str, **kwargs: Any) -> dict[str, Any]:
        """Make a PATCH request."""
        return await self.request("PATCH", path, **kwargs)

    async def delete(self, path: str, **kwargs: Any) -> dict[str, Any]:
        """Make a DELETE request."""
        return await self.request("DELETE", path, **kwargs)

    def parse_link_header(self, link_header: str) -> dict[str, str]:
        """
        Parse GitHub Link header for pagination.

        Args:
            link_header: Link header value

        Returns:
            Dictionary mapping rel types to URLs
        """
        links = {}
        for link in link_header.split(","):
            parts = link.strip().split(";")
            if len(parts) != 2:
                continue

            url = parts[0].strip()[1:-1]  # Remove < and >
            rel = parts[1].strip().split("=")[1].strip('"')
            links[rel] = url

        return links

    async def get_all_pages(
        self,
        path: str,
        params: dict[str, Any] | None = None,
        max_items: int | None = None,
    ) -> AsyncGenerator[dict[str, Any], None]:
        """
        Fetch all pages of a paginated endpoint.

        Args:
            path: API endpoint path
            params: Query parameters
            max_items: Maximum number of items to fetch (None for unlimited)

        Yields:
            Individual items from all pages

        Raises:
            GitHubAPIError: On API error
        """
        items_fetched = 0
        next_url: str | None = None
        first_page = True

        while True:
            if first_page:
                response_data = await self.get(path, params=params)
                first_page = False
            else:
                if not next_url:
                    break
                # For subsequent pages, use the full URL from Link header
                await self._ensure_client()
                assert self._client is not None
                response = await self._request_with_retry("GET", next_url)
                response_data = response.json() if response.content else []

            # Yield items
            if isinstance(response_data, list):
                for item in response_data:
                    yield item
                    items_fetched += 1
                    if max_items and items_fetched >= max_items:
                        return
            else:
                # Single item response
                yield response_data
                return

            # Check for next page in Link header
            # Note: We need access to response headers, so we'll need to adjust this
            # For now, break after first page if we can't access Link header
            break  # TODO: Implement proper Link header handling

    def __repr__(self) -> str:
        """Return developer-friendly representation."""
        return (
            f"HTTPClient(base_url={self.base_url!r}, "
            f"timeout={self.timeout}, "
            f"max_retries={self.max_retries})"
        )
