"""
Pagination support for GitHub API responses
"""

from dataclasses import dataclass
from typing import Any, AsyncIterator, TYPE_CHECKING

from github_sdk_core.constants import DEFAULT_PER_PAGE, MAX_PAGES, MAX_PER_PAGE

if TYPE_CHECKING:
    from github_sdk_core.client import HTTPClient


@dataclass
class PaginationParams:
    """
    Parameters for paginated requests.

    Attributes:
        page: Page number (1-indexed)
        per_page: Items per page (max 100)
        sort: Sort field
        direction: Sort direction (asc or desc)
        since: For time-based pagination
        before: For time-based pagination (end date)
        after: For cursor-based pagination
    """

    page: int = 1
    per_page: int = DEFAULT_PER_PAGE
    sort: str | None = None
    direction: str | None = None
    since: str | None = None
    before: str | None = None
    after: str | None = None

    def to_dict(self) -> dict[str, Any]:
        """
        Convert to dictionary for use in request parameters.

        Returns:
            Dictionary with non-None values
        """
        params: dict[str, Any] = {
            "page": self.page,
            "per_page": min(self.per_page, MAX_PER_PAGE),
        }

        if self.sort:
            params["sort"] = self.sort
        if self.direction:
            params["direction"] = self.direction
        if self.since:
            params["since"] = self.since
        if self.before:
            params["before"] = self.before
        if self.after:
            params["after"] = self.after

        return params


class Paginator:
    """
    Async iterator for paginated GitHub API responses.

    Handles Link header parsing and automatic page fetching.

    Example:
        ```python
        paginator = Paginator(client, "/repos/owner/repo/issues")
        async for issue in paginator:
            print(issue["title"])

        # Or fetch all at once
        all_issues = await paginator.fetch_all(max_items=100)
        ```
    """

    def __init__(
        self,
        client: "HTTPClient",
        path: str,
        params: dict[str, Any] | None = None,
        per_page: int = DEFAULT_PER_PAGE,
    ) -> None:
        """
        Initialize paginator.

        Args:
            client: HTTP client for making requests
            path: API endpoint path
            params: Additional query parameters
            per_page: Items per page
        """
        self.client = client
        self.path = path
        self.params = params or {}
        self.per_page = min(per_page, MAX_PER_PAGE)

        # Pagination state
        self._current_page = 1
        self._next_url: str | None = None
        self._has_more = True
        self._items_buffer: list[Any] = []
        self._total_pages = 0

    def reset(self) -> None:
        """Reset paginator to initial state."""
        self._current_page = 1
        self._next_url = None
        self._has_more = True
        self._items_buffer = []
        self._total_pages = 0

    async def _fetch_page(self) -> tuple[list[Any], dict[str, str]]:
        """
        Fetch a single page of results.

        Returns:
            Tuple of (items, link_headers)

        Raises:
            GitHubAPIError: On API error
        """
        # Prepare request parameters
        request_params = {**self.params, "per_page": self.per_page}

        if self._current_page > 1:
            request_params["page"] = self._current_page

        # Make request (need to get raw response for Link header)
        # For now, we'll use the request method which returns parsed data
        # TODO: Enhance HTTPClient to optionally return response object
        data = await self.client.get(self.path, params=request_params)

        # Extract items (response can be list or dict)
        if isinstance(data, list):
            items = data
        elif isinstance(data, dict):
            # Some endpoints return items in a wrapper
            # e.g., search results have 'items' key
            items = data.get("items", [data])
        else:
            items = []

        # TODO: Parse Link header when HTTPClient provides access to it
        link_headers: dict[str, str] = {}

        return items, link_headers

    async def fetch_next_page(self) -> list[Any]:
        """
        Fetch the next page of results.

        Returns:
            List of items from the next page

        Raises:
            GitHubAPIError: On API error
            StopIteration: If no more pages available
        """
        if not self._has_more:
            raise StopIteration("No more pages available")

        if self._total_pages >= MAX_PAGES:
            raise RuntimeError(f"Exceeded maximum page limit ({MAX_PAGES})")

        items, link_headers = await self._fetch_page()

        self._current_page += 1
        self._total_pages += 1

        # Check if there are more pages
        # If we got fewer items than per_page, we're likely on the last page
        if len(items) < self.per_page:
            self._has_more = False
        elif "next" not in link_headers:
            self._has_more = False
        else:
            self._next_url = link_headers.get("next")

        return items

    async def fetch_all(self, max_items: int | None = None) -> list[Any]:
        """
        Fetch all pages and return all items.

        Args:
            max_items: Maximum number of items to fetch (None for unlimited)

        Returns:
            List of all items

        Raises:
            GitHubAPIError: On API error
        """
        all_items: list[Any] = []

        while self._has_more:
            items = await self.fetch_next_page()
            all_items.extend(items)

            if max_items and len(all_items) >= max_items:
                return all_items[:max_items]

        return all_items

    def __aiter__(self) -> AsyncIterator[Any]:
        """Return async iterator."""
        return self

    async def __anext__(self) -> Any:
        """
        Get next item from pagination.

        Returns:
            Next item

        Raises:
            StopAsyncIteration: When no more items available
        """
        # If buffer is empty, fetch next page
        if not self._items_buffer:
            if not self._has_more:
                raise StopAsyncIteration

            try:
                self._items_buffer = await self.fetch_next_page()
            except StopIteration:
                raise StopAsyncIteration

            # If still empty after fetch, we're done
            if not self._items_buffer:
                self._has_more = False
                raise StopAsyncIteration

        # Return first item from buffer
        return self._items_buffer.pop(0)

    @property
    def has_more(self) -> bool:
        """Check if there are more pages to fetch."""
        return self._has_more

    @property
    def current_page(self) -> int:
        """Get current page number."""
        return self._current_page

    @property
    def total_pages_fetched(self) -> int:
        """Get total number of pages fetched so far."""
        return self._total_pages

    def __repr__(self) -> str:
        """Return developer-friendly representation."""
        return (
            f"Paginator(path={self.path!r}, "
            f"page={self._current_page}, "
            f"has_more={self._has_more})"
        )
