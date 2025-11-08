"""
Basic usage example for GitHub SDK Python

This example demonstrates:
- Authentication
- Making API requests
- Error handling
- Rate limit tracking
"""

import asyncio
import os
from github_sdk_core import HTTPClient
from github_sdk_core.auth import TokenAuth
from github_sdk_core.errors import (
    AuthenticationError,
    GitHubAPIError,
    NotFoundError,
    RateLimitError,
)


async def main() -> None:
    """Main example function."""

    # Check for token
    if not os.getenv("GITHUB_TOKEN"):
        print("Error: GITHUB_TOKEN environment variable not set")
        print("Please set your GitHub token: export GITHUB_TOKEN=ghp_...")
        return

    try:
        # Create authentication from environment
        auth = TokenAuth.from_environment()
        print(f"✓ Authenticated with token type: {auth.token_type}")

        # Create HTTP client
        async with HTTPClient(auth=auth, debug=True) as client:
            print("\n--- Fetching authenticated user info ---")
            user = await client.get("/user")
            print(f"Logged in as: {user['login']}")
            print(f"Name: {user.get('name', 'N/A')}")
            print(f"Public repos: {user['public_repos']}")
            print(f"Followers: {user['followers']}")

            # Fetch a specific repository
            print("\n--- Fetching repository info ---")
            try:
                repo = await client.get("/repos/octocat/Hello-World")
                print(f"Repository: {repo['full_name']}")
                print(f"Description: {repo.get('description', 'N/A')}")
                print(f"Stars: {repo['stargazers_count']}")
                print(f"Forks: {repo['forks_count']}")
                print(f"Language: {repo.get('language', 'N/A')}")
            except NotFoundError:
                print("Repository not found or not accessible")

            # List user's repositories
            print("\n--- Fetching your repositories (first 5) ---")
            repos = await client.get("/user/repos", params={"per_page": 5, "sort": "updated"})
            for repo in repos[:5]:
                print(f"  - {repo['name']} ({repo['stargazers_count']} stars)")

    except AuthenticationError as e:
        print(f"\n❌ Authentication failed: {e}")
        print("Please check your GitHub token")

    except RateLimitError as e:
        print(f"\n❌ Rate limit exceeded: {e}")
        print(f"Please wait {e.retry_after} seconds")

    except GitHubAPIError as e:
        print(f"\n❌ GitHub API error: {e}")
        if e.status_code:
            print(f"Status code: {e.status_code}")
        if e.docs_url:
            print(f"See: {e.docs_url}")

    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")


if __name__ == "__main__":
    print("GitHub SDK Python - Basic Usage Example")
    print("=" * 50)
    asyncio.run(main())
