from __future__ import annotations

import hashlib
import hmac
import os
from typing import Protocol

from expense_reimbursement.domain.user import (
    AuthenticationError,
    AuthorizationError,
    DuplicateUserError,
    InvalidUserError,
    User,
    UserRole,
)


class UserRepository(Protocol):
    def create(self, user: User) -> User:
        raise NotImplementedError

    def get_by_username(self, username: str) -> User | None:
        raise NotImplementedError


def _normalize_username(username: str) -> str:
    normalized = username.strip()
    if not normalized:
        raise InvalidUserError("Username is required.")
    return normalized


def _validate_password(password: str) -> str:
    normalized = password.strip()
    if not normalized:
        raise InvalidUserError("Password is required.")
    return normalized


def _hash_password(password: str, salt_hex: str | None = None) -> tuple[str, str]:
    salt = bytes.fromhex(salt_hex) if salt_hex else os.urandom(16)
    password_hash = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 120_000)
    return salt.hex(), password_hash.hex()


class UserService:
    def __init__(self, repository: UserRepository) -> None:
        self.repository = repository

    def ensure_default_admin(self) -> None:
        if self.repository.get_by_username("admin") is not None:
            return
        self._create_user_record("admin", "admin", UserRole.ADMIN)

    def authenticate(self, username: str, password: str) -> User:
        normalized_username = _normalize_username(username)
        normalized_password = _validate_password(password)
        user = self.repository.get_by_username(normalized_username)
        if user is None:
            raise AuthenticationError("Invalid username or password.")

        _, candidate_hash = _hash_password(normalized_password, user.password_salt)
        if not hmac.compare_digest(candidate_hash, user.password_hash):
            raise AuthenticationError("Invalid username or password.")

        return user

    def get_user(self, username: str) -> User | None:
        return self.repository.get_by_username(username.strip())

    def create_user(self, actor: User, username: str, password: str, role: UserRole) -> User:
        if actor.role != UserRole.ADMIN:
            raise AuthorizationError("Only admins can create users.")
        return self._create_user_record(username, password, role)

    def _create_user_record(self, username: str, password: str, role: UserRole) -> User:
        normalized_username = _normalize_username(username)
        normalized_password = _validate_password(password)
        if self.repository.get_by_username(normalized_username) is not None:
            raise DuplicateUserError("Username already exists.")

        salt_hex, password_hash = _hash_password(normalized_password)
        return self.repository.create(
            User(
                username=normalized_username,
                role=role,
                password_salt=salt_hex,
                password_hash=password_hash,
            )
        )

