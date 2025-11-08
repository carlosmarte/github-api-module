"""
Validation functions for GitHub API inputs
"""

import re
from typing import Any

from github_sdk_core.constants import (
    MAX_BRANCH_NAME_LENGTH,
    MAX_PER_PAGE,
    MAX_REPO_NAME_LENGTH,
    MAX_TAG_NAME_LENGTH,
    MAX_USERNAME_LENGTH,
    RESERVED_REPO_NAMES,
)
from github_sdk_core.errors import ValidationError


def validate_repository_name(name: str) -> None:
    """
    Validate a GitHub repository name.

    Rules:
    - Alphanumeric, hyphens, underscores, and dots allowed
    - Cannot start or end with a dot
    - Maximum 100 characters
    - Cannot be a reserved name

    Args:
        name: Repository name to validate

    Raises:
        ValidationError: If repository name is invalid
    """
    if not name:
        raise ValidationError("Repository name cannot be empty")

    if len(name) > MAX_REPO_NAME_LENGTH:
        raise ValidationError(
            f"Repository name exceeds maximum length of {MAX_REPO_NAME_LENGTH} characters"
        )

    if name.lower() in RESERVED_REPO_NAMES:
        raise ValidationError(f"Repository name '{name}' is reserved")

    if name.startswith(".") or name.endswith("."):
        raise ValidationError("Repository name cannot start or end with a dot")

    if not re.match(r"^[a-zA-Z0-9._-]+$", name):
        raise ValidationError(
            "Repository name can only contain alphanumeric characters, "
            "hyphens, underscores, and dots"
        )


def validate_username(username: str) -> None:
    """
    Validate a GitHub username.

    Rules:
    - Alphanumeric and hyphens allowed
    - Cannot start or end with a hyphen
    - Cannot have consecutive hyphens
    - Maximum 39 characters

    Args:
        username: Username to validate

    Raises:
        ValidationError: If username is invalid
    """
    if not username:
        raise ValidationError("Username cannot be empty")

    if len(username) > MAX_USERNAME_LENGTH:
        raise ValidationError(
            f"Username exceeds maximum length of {MAX_USERNAME_LENGTH} characters"
        )

    if username.startswith("-") or username.endswith("-"):
        raise ValidationError("Username cannot start or end with a hyphen")

    if "--" in username:
        raise ValidationError("Username cannot contain consecutive hyphens")

    if not re.match(r"^[a-zA-Z0-9-]+$", username):
        raise ValidationError("Username can only contain alphanumeric characters and hyphens")


def validate_branch_name(name: str) -> None:
    """
    Validate a Git branch name.

    Rules follow Git reference naming conventions:
    - Cannot start or end with a slash
    - Cannot contain consecutive slashes
    - Cannot contain special characters like ~, ^, :, ?, *, [, \\, etc.
    - Cannot end with .lock
    - Maximum 255 characters

    Args:
        name: Branch name to validate

    Raises:
        ValidationError: If branch name is invalid
    """
    if not name:
        raise ValidationError("Branch name cannot be empty")

    if len(name) > MAX_BRANCH_NAME_LENGTH:
        raise ValidationError(
            f"Branch name exceeds maximum length of {MAX_BRANCH_NAME_LENGTH} characters"
        )

    if name.startswith("/") or name.endswith("/"):
        raise ValidationError("Branch name cannot start or end with a slash")

    if "//" in name:
        raise ValidationError("Branch name cannot contain consecutive slashes")

    if name.endswith(".lock"):
        raise ValidationError("Branch name cannot end with .lock")

    # Git ref name forbidden characters
    forbidden_chars = r"[~^:?*\[\\\s@{]"
    if re.search(forbidden_chars, name):
        raise ValidationError("Branch name contains forbidden characters")

    # Cannot be a single @
    if name == "@":
        raise ValidationError("Branch name cannot be '@'")

    # Cannot contain ..
    if ".." in name:
        raise ValidationError("Branch name cannot contain '..'")


def validate_tag_name(name: str) -> None:
    """
    Validate a Git tag name.

    Rules are similar to branch names:
    - Cannot start or end with a slash
    - Cannot contain consecutive slashes
    - Cannot contain special characters
    - Cannot end with .lock
    - Maximum 255 characters

    Args:
        name: Tag name to validate

    Raises:
        ValidationError: If tag name is invalid
    """
    # Tag validation is similar to branch validation
    validate_branch_name(name)


def validate_pagination(
    page: int | None = None,
    per_page: int | None = None,
) -> None:
    """
    Validate pagination parameters.

    Args:
        page: Page number (1-indexed)
        per_page: Items per page

    Raises:
        ValidationError: If pagination parameters are invalid
    """
    if page is not None:
        if not isinstance(page, int):
            raise ValidationError("Page must be an integer")
        if page < 1:
            raise ValidationError("Page must be greater than 0")

    if per_page is not None:
        if not isinstance(per_page, int):
            raise ValidationError("Per page must be an integer")
        if per_page < 1:
            raise ValidationError("Per page must be greater than 0")
        if per_page > MAX_PER_PAGE:
            raise ValidationError(f"Per page cannot exceed {MAX_PER_PAGE}")


def validate_sort(
    sort: str | None,
    allowed_fields: list[str],
) -> None:
    """
    Validate sort field against allowed values.

    Args:
        sort: Sort field name
        allowed_fields: List of allowed sort field names

    Raises:
        ValidationError: If sort field is not allowed
    """
    if sort is not None and sort not in allowed_fields:
        raise ValidationError(
            f"Invalid sort field '{sort}'. Allowed values: {', '.join(allowed_fields)}"
        )


def validate_direction(direction: str | None) -> None:
    """
    Validate sort direction.

    Args:
        direction: Sort direction (asc or desc)

    Raises:
        ValidationError: If direction is invalid
    """
    if direction is not None:
        if direction not in ("asc", "desc"):
            raise ValidationError("Direction must be 'asc' or 'desc'")


def validate_required(value: Any, field_name: str) -> None:
    """
    Validate that a required field is not None or empty.

    Args:
        value: Field value
        field_name: Name of the field for error messages

    Raises:
        ValidationError: If value is None or empty
    """
    if value is None:
        raise ValidationError(f"{field_name} is required")

    if isinstance(value, str) and not value.strip():
        raise ValidationError(f"{field_name} cannot be empty")


def validate_url(url: str) -> None:
    """
    Validate a URL format.

    Args:
        url: URL to validate

    Raises:
        ValidationError: If URL is invalid
    """
    if not url:
        raise ValidationError("URL cannot be empty")

    url_pattern = re.compile(
        r"^https?://"  # http:// or https://
        r"(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|"  # domain...
        r"localhost|"  # localhost...
        r"\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})"  # ...or ip
        r"(?::\d+)?"  # optional port
        r"(?:/?|[/?]\S+)$",
        re.IGNORECASE,
    )

    if not url_pattern.match(url):
        raise ValidationError("Invalid URL format")


def validate_email(email: str) -> None:
    """
    Validate an email address format.

    Args:
        email: Email address to validate

    Raises:
        ValidationError: If email is invalid
    """
    if not email:
        raise ValidationError("Email cannot be empty")

    email_pattern = re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")

    if not email_pattern.match(email):
        raise ValidationError("Invalid email format")


def validate_enum(
    value: str | None,
    allowed_values: list[str],
    field_name: str,
) -> None:
    """
    Validate that a value is one of the allowed enum values.

    Args:
        value: Value to validate
        allowed_values: List of allowed values
        field_name: Name of the field for error messages

    Raises:
        ValidationError: If value is not in allowed values
    """
    if value is not None and value not in allowed_values:
        raise ValidationError(
            f"Invalid {field_name} '{value}'. "
            f"Allowed values: {', '.join(allowed_values)}"
        )
