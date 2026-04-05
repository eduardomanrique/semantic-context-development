from __future__ import annotations

import sqlite3
from dataclasses import dataclass
from datetime import date, datetime, timezone
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Any


DB_PATH = Path("expense_claims.db")


class AppError(Exception):
    """Base class for application errors."""


class ValidationError(AppError):
    """Raised when user input is invalid."""

    def __init__(self, errors: dict[str, str]):
        super().__init__("Validation failed")
        self.errors = errors


class PermissionDenied(AppError):
    """Raised when a user tries an action outside their role or ownership."""


class StateConflict(AppError):
    """Raised when a workflow transition is invalid."""


class NotFound(AppError):
    """Raised when a requested record does not exist."""


@dataclass(frozen=True)
class User:
    id: int
    username: str
    full_name: str
    role: str


DEMO_USERS: tuple[tuple[str, str, str], ...] = (
    ("alice", "Alice Employee", "employee"),
    ("bob", "Bob Employee", "employee"),
    ("maria", "Maria Manager", "manager"),
    ("frank", "Frank Finance", "finance"),
)


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def get_connection(db_path: Path | str = DB_PATH) -> sqlite3.Connection:
    connection = sqlite3.connect(str(db_path))
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def initialize_database(connection: sqlite3.Connection) -> None:
    connection.executescript(
        """
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            full_name TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('employee', 'manager', 'finance'))
        );

        CREATE TABLE IF NOT EXISTS claims (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            employee_id INTEGER NOT NULL REFERENCES users(id),
            title TEXT NOT NULL,
            expense_date TEXT NOT NULL,
            amount_cents INTEGER NOT NULL CHECK(amount_cents > 0),
            category TEXT NOT NULL,
            description TEXT NOT NULL,
            status TEXT NOT NULL CHECK(status IN ('draft', 'submitted', 'approved', 'rejected', 'paid')),
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            submitted_at TEXT
        );

        CREATE TABLE IF NOT EXISTS reviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            claim_id INTEGER NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
            reviewer_id INTEGER NOT NULL REFERENCES users(id),
            decision TEXT NOT NULL CHECK(decision IN ('approve', 'reject')),
            note TEXT,
            reviewed_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            claim_id INTEGER NOT NULL UNIQUE REFERENCES claims(id) ON DELETE CASCADE,
            payer_id INTEGER NOT NULL REFERENCES users(id),
            note TEXT,
            paid_at TEXT NOT NULL
        );
        """
    )

    existing_users = connection.execute("SELECT COUNT(*) AS count FROM users").fetchone()["count"]
    if existing_users == 0:
        connection.executemany(
            "INSERT INTO users (username, full_name, role) VALUES (?, ?, ?)",
            DEMO_USERS,
        )
    connection.commit()


def list_demo_users(connection: sqlite3.Connection) -> list[User]:
    rows = connection.execute(
        "SELECT id, username, full_name, role FROM users ORDER BY id"
    ).fetchall()
    return [user_from_row(row) for row in rows]


def user_from_row(row: sqlite3.Row) -> User:
    return User(id=row["id"], username=row["username"], full_name=row["full_name"], role=row["role"])


def get_user_by_username(connection: sqlite3.Connection, username: str) -> User | None:
    row = connection.execute(
        "SELECT id, username, full_name, role FROM users WHERE username = ?",
        (username,),
    ).fetchone()
    return user_from_row(row) if row else None


def get_user_by_id(connection: sqlite3.Connection, user_id: int) -> User | None:
    row = connection.execute(
        "SELECT id, username, full_name, role FROM users WHERE id = ?",
        (user_id,),
    ).fetchone()
    return user_from_row(row) if row else None


def require_role(actor: User, role: str) -> None:
    if actor.role != role:
        raise PermissionDenied(f"{role.title()} role required")


def parse_amount_to_cents(raw_value: Any) -> int:
    value_text = str(raw_value or "").strip()
    if not value_text:
        raise ValidationError({"amount": "Amount is required."})

    try:
        value = Decimal(value_text)
    except InvalidOperation as exc:
        raise ValidationError({"amount": "Amount must be a valid decimal number."}) from exc

    if value <= 0:
        raise ValidationError({"amount": "Amount must be positive."})

    quantized = value.quantize(Decimal("0.01"))
    if quantized != value:
        raise ValidationError({"amount": "Amount must use at most two decimal places."})

    return int(quantized * 100)


def normalize_claim_payload(payload: dict[str, Any]) -> dict[str, Any]:
    errors: dict[str, str] = {}

    title = str(payload.get("title", "")).strip()
    if not title:
        errors["title"] = "Title is required."

    expense_date = str(payload.get("expense_date", "")).strip()
    if not expense_date:
        errors["expense_date"] = "Expense date is required."
    else:
        try:
            date.fromisoformat(expense_date)
        except ValueError:
            errors["expense_date"] = "Expense date must be a valid ISO date."

    category = str(payload.get("category", "")).strip()
    if not category:
        errors["category"] = "Category is required."

    description = str(payload.get("description", "")).strip()
    if not description:
        errors["description"] = "Description is required."

    amount_cents = None
    try:
        amount_cents = parse_amount_to_cents(payload.get("amount", ""))
    except ValidationError as exc:
        errors.update(exc.errors)

    if errors:
        raise ValidationError(errors)

    return {
        "title": title,
        "expense_date": expense_date,
        "amount_cents": amount_cents,
        "category": category,
        "description": description,
    }


def format_amount(amount_cents: int) -> str:
    return f"{amount_cents / 100:.2f}"


def claim_summary_from_row(row: sqlite3.Row) -> dict[str, Any]:
    return {
        "id": row["id"],
        "employee_id": row["employee_id"],
        "employee_name": row["employee_name"],
        "title": row["title"],
        "expense_date": row["expense_date"],
        "amount": format_amount(row["amount_cents"]),
        "category": row["category"],
        "description": row["description"],
        "status": row["status"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
        "submitted_at": row["submitted_at"],
    }


def get_claim_row(connection: sqlite3.Connection, claim_id: int) -> sqlite3.Row:
    row = connection.execute(
        """
        SELECT
            claims.*,
            users.full_name AS employee_name
        FROM claims
        JOIN users ON users.id = claims.employee_id
        WHERE claims.id = ?
        """,
        (claim_id,),
    ).fetchone()
    if not row:
        raise NotFound("Claim not found.")
    return row


def get_claim_detail(connection: sqlite3.Connection, actor: User, claim_id: int) -> dict[str, Any]:
    row = get_claim_row(connection, claim_id)
    can_view = False

    if actor.role == "employee" and row["employee_id"] == actor.id:
        can_view = True
    elif actor.role == "manager" and row["status"] == "submitted":
        can_view = True
    elif actor.role == "finance" and row["status"] == "approved":
        can_view = True

    if not can_view:
        raise PermissionDenied("You cannot access that claim.")

    claim = claim_summary_from_row(row)
    claim["reviews"] = [
        {
            "id": review["id"],
            "reviewer_name": review["reviewer_name"],
            "decision": review["decision"],
            "note": review["note"] or "",
            "reviewed_at": review["reviewed_at"],
        }
        for review in connection.execute(
            """
            SELECT reviews.id, reviews.decision, reviews.note, reviews.reviewed_at, users.full_name AS reviewer_name
            FROM reviews
            JOIN users ON users.id = reviews.reviewer_id
            WHERE reviews.claim_id = ?
            ORDER BY reviews.id
            """,
            (claim_id,),
        ).fetchall()
    ]

    payment = connection.execute(
        """
        SELECT payments.note, payments.paid_at, users.full_name AS payer_name
        FROM payments
        JOIN users ON users.id = payments.payer_id
        WHERE payments.claim_id = ?
        """,
        (claim_id,),
    ).fetchone()
    if payment:
        claim["payment"] = {
            "payer_name": payment["payer_name"],
            "note": payment["note"] or "",
            "paid_at": payment["paid_at"],
        }
    else:
        claim["payment"] = None

    return claim


def create_claim(connection: sqlite3.Connection, actor: User, payload: dict[str, Any]) -> int:
    require_role(actor, "employee")
    normalized = normalize_claim_payload(payload)
    timestamp = utc_now()
    cursor = connection.execute(
        """
        INSERT INTO claims (
            employee_id, title, expense_date, amount_cents, category, description,
            status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'draft', ?, ?)
        """,
        (
            actor.id,
            normalized["title"],
            normalized["expense_date"],
            normalized["amount_cents"],
            normalized["category"],
            normalized["description"],
            timestamp,
            timestamp,
        ),
    )
    connection.commit()
    return int(cursor.lastrowid)


def update_claim(connection: sqlite3.Connection, actor: User, claim_id: int, payload: dict[str, Any]) -> None:
    normalized = normalize_claim_payload(payload)
    row = get_claim_row(connection, claim_id)

    if actor.role != "employee" or row["employee_id"] != actor.id:
        raise PermissionDenied("Only the owning employee can edit this claim.")
    if row["status"] != "draft":
        raise StateConflict("Only draft claims can be edited.")

    connection.execute(
        """
        UPDATE claims
        SET title = ?, expense_date = ?, amount_cents = ?, category = ?, description = ?, updated_at = ?
        WHERE id = ?
        """,
        (
            normalized["title"],
            normalized["expense_date"],
            normalized["amount_cents"],
            normalized["category"],
            normalized["description"],
            utc_now(),
            claim_id,
        ),
    )
    connection.commit()


def submit_claim(connection: sqlite3.Connection, actor: User, claim_id: int) -> None:
    row = get_claim_row(connection, claim_id)

    if actor.role != "employee" or row["employee_id"] != actor.id:
        raise PermissionDenied("Only the owning employee can submit this claim.")
    if row["status"] != "draft":
        raise StateConflict("Only draft claims can be submitted.")

    timestamp = utc_now()
    connection.execute(
        """
        UPDATE claims
        SET status = 'submitted', submitted_at = ?, updated_at = ?
        WHERE id = ?
        """,
        (timestamp, timestamp, claim_id),
    )
    connection.commit()


def reopen_claim(connection: sqlite3.Connection, actor: User, claim_id: int) -> None:
    row = get_claim_row(connection, claim_id)

    if actor.role != "employee" or row["employee_id"] != actor.id:
        raise PermissionDenied("Only the owning employee can reopen this claim.")
    if row["status"] != "rejected":
        raise StateConflict("Only rejected claims can be reopened.")

    connection.execute(
        "UPDATE claims SET status = 'draft', updated_at = ? WHERE id = ?",
        (utc_now(), claim_id),
    )
    connection.commit()


def list_employee_claims(connection: sqlite3.Connection, actor: User) -> list[dict[str, Any]]:
    require_role(actor, "employee")
    rows = connection.execute(
        """
        SELECT claims.*, users.full_name AS employee_name
        FROM claims
        JOIN users ON users.id = claims.employee_id
        WHERE claims.employee_id = ?
        ORDER BY claims.id DESC
        """,
        (actor.id,),
    ).fetchall()
    return [claim_summary_from_row(row) for row in rows]


def list_submitted_claims(connection: sqlite3.Connection, actor: User) -> list[dict[str, Any]]:
    require_role(actor, "manager")
    rows = connection.execute(
        """
        SELECT claims.*, users.full_name AS employee_name
        FROM claims
        JOIN users ON users.id = claims.employee_id
        WHERE claims.status = 'submitted'
        ORDER BY claims.id DESC
        """
    ).fetchall()
    return [claim_summary_from_row(row) for row in rows]


def review_claim(
    connection: sqlite3.Connection,
    actor: User,
    claim_id: int,
    decision: str,
    note: str = "",
) -> None:
    require_role(actor, "manager")
    row = get_claim_row(connection, claim_id)

    if row["status"] != "submitted":
        raise StateConflict("Only submitted claims can be reviewed.")
    if decision not in {"approve", "reject"}:
        raise ValidationError({"decision": "Decision must be approve or reject."})

    timestamp = utc_now()
    connection.execute(
        "INSERT INTO reviews (claim_id, reviewer_id, decision, note, reviewed_at) VALUES (?, ?, ?, ?, ?)",
        (claim_id, actor.id, decision, note.strip(), timestamp),
    )
    connection.execute(
        "UPDATE claims SET status = ?, updated_at = ? WHERE id = ?",
        ("approved" if decision == "approve" else "rejected", timestamp, claim_id),
    )
    connection.commit()


def list_approved_claims(connection: sqlite3.Connection, actor: User) -> list[dict[str, Any]]:
    require_role(actor, "finance")
    rows = connection.execute(
        """
        SELECT claims.*, users.full_name AS employee_name
        FROM claims
        JOIN users ON users.id = claims.employee_id
        WHERE claims.status = 'approved'
        ORDER BY claims.id DESC
        """
    ).fetchall()
    return [claim_summary_from_row(row) for row in rows]


def pay_claim(connection: sqlite3.Connection, actor: User, claim_id: int, note: str = "") -> None:
    require_role(actor, "finance")
    row = get_claim_row(connection, claim_id)

    if row["status"] != "approved":
        raise StateConflict("Only approved claims can be marked as paid.")

    timestamp = utc_now()
    connection.execute(
        "INSERT INTO payments (claim_id, payer_id, note, paid_at) VALUES (?, ?, ?, ?)",
        (claim_id, actor.id, note.strip(), timestamp),
    )
    connection.execute(
        "UPDATE claims SET status = 'paid', updated_at = ? WHERE id = ?",
        (timestamp, claim_id),
    )
    connection.commit()
