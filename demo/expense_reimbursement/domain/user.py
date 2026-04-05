from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class UserRole(str, Enum):
    ADMIN = "ADMIN"
    EMPLOYEE = "EMPLOYEE"
    MANAGER = "MANAGER"
    FINANCE = "FINANCE"


class AuthenticationError(PermissionError):
    pass


class AuthorizationError(PermissionError):
    pass


class DuplicateUserError(ValueError):
    pass


class InvalidUserError(ValueError):
    pass


@dataclass(frozen=True)
class User:
    username: str
    role: UserRole
    password_salt: str
    password_hash: str

