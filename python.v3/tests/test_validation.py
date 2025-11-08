"""
Tests for validation module
"""

import pytest
from github_sdk_core.errors import ValidationError
from github_sdk_core.validation import (
    validate_branch_name,
    validate_repository_name,
    validate_tag_name,
    validate_username,
)


class TestRepositoryNameValidation:
    """Test repository name validation."""

    def test_valid_repository_name(self) -> None:
        """Test valid repository names."""
        validate_repository_name("my-repo")
        validate_repository_name("my_repo")
        validate_repository_name("my.repo")
        validate_repository_name("MyRepo123")

    def test_empty_repository_name(self) -> None:
        """Test empty repository name raises error."""
        with pytest.raises(ValidationError, match="cannot be empty"):
            validate_repository_name("")

    def test_repository_name_too_long(self) -> None:
        """Test repository name exceeds max length."""
        with pytest.raises(ValidationError, match="exceeds maximum length"):
            validate_repository_name("a" * 101)

    def test_repository_name_reserved(self) -> None:
        """Test reserved repository names."""
        with pytest.raises(ValidationError, match="is reserved"):
            validate_repository_name("admin")

    def test_repository_name_starts_with_dot(self) -> None:
        """Test repository name starting with dot."""
        with pytest.raises(ValidationError, match="cannot start or end with a dot"):
            validate_repository_name(".myrepo")

    def test_repository_name_invalid_chars(self) -> None:
        """Test repository name with invalid characters."""
        with pytest.raises(ValidationError, match="can only contain"):
            validate_repository_name("my repo")  # space not allowed


class TestUsernameValidation:
    """Test username validation."""

    def test_valid_username(self) -> None:
        """Test valid usernames."""
        validate_username("user")
        validate_username("my-user")
        validate_username("user123")

    def test_empty_username(self) -> None:
        """Test empty username raises error."""
        with pytest.raises(ValidationError, match="cannot be empty"):
            validate_username("")

    def test_username_too_long(self) -> None:
        """Test username exceeds max length."""
        with pytest.raises(ValidationError, match="exceeds maximum length"):
            validate_username("a" * 40)

    def test_username_starts_with_hyphen(self) -> None:
        """Test username starting with hyphen."""
        with pytest.raises(ValidationError, match="cannot start or end with a hyphen"):
            validate_username("-user")

    def test_username_consecutive_hyphens(self) -> None:
        """Test username with consecutive hyphens."""
        with pytest.raises(ValidationError, match="consecutive hyphens"):
            validate_username("my--user")


class TestBranchNameValidation:
    """Test branch name validation."""

    def test_valid_branch_name(self) -> None:
        """Test valid branch names."""
        validate_branch_name("main")
        validate_branch_name("feature/new-feature")
        validate_branch_name("bugfix-123")

    def test_empty_branch_name(self) -> None:
        """Test empty branch name raises error."""
        with pytest.raises(ValidationError, match="cannot be empty"):
            validate_branch_name("")

    def test_branch_name_ends_with_lock(self) -> None:
        """Test branch name ending with .lock."""
        with pytest.raises(ValidationError, match="cannot end with .lock"):
            validate_branch_name("feature.lock")

    def test_branch_name_consecutive_slashes(self) -> None:
        """Test branch name with consecutive slashes."""
        with pytest.raises(ValidationError, match="consecutive slashes"):
            validate_branch_name("feature//test")

    def test_branch_name_forbidden_chars(self) -> None:
        """Test branch name with forbidden characters."""
        with pytest.raises(ValidationError, match="forbidden characters"):
            validate_branch_name("feature~test")


class TestTagNameValidation:
    """Test tag name validation."""

    def test_valid_tag_name(self) -> None:
        """Test valid tag names."""
        validate_tag_name("v1.0.0")
        validate_tag_name("release-2024")

    def test_invalid_tag_name(self) -> None:
        """Test invalid tag names."""
        with pytest.raises(ValidationError):
            validate_tag_name("tag..name")
