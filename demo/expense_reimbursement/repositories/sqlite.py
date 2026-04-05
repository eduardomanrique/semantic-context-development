from __future__ import annotations

import sqlite3
from contextlib import contextmanager
from datetime import datetime
from decimal import Decimal
from pathlib import Path
from typing import Iterator

from expense_reimbursement.domain.expense_claim import (
    ClaimAuditEvent,
    ClaimAuditEventType,
    ClaimReviewDecision,
    ExpenseClaim,
    ExpenseClaimStatus,
)
from expense_reimbursement.domain.user import User, UserRole


def _serialize_datetime(value: datetime | None) -> str | None:
    return value.isoformat() if value is not None else None


def _deserialize_datetime(value: str | None) -> datetime | None:
    return datetime.fromisoformat(value) if value else None


class SQLiteDatabase:
    def __init__(self, database_path: str | Path) -> None:
        self.database_path = Path(database_path)

    def initialize(self) -> None:
        self.database_path.parent.mkdir(parents=True, exist_ok=True)
        with self.connect() as connection:
            connection.executescript(
                """
                CREATE TABLE IF NOT EXISTS users (
                    username TEXT PRIMARY KEY,
                    role TEXT NOT NULL,
                    password_salt TEXT NOT NULL,
                    password_hash TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS claims (
                    id TEXT PRIMARY KEY,
                    owner_employee_id TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    description TEXT,
                    amount TEXT,
                    category TEXT,
                    status TEXT NOT NULL,
                    submitted_at TEXT,
                    reviewed_by_manager_id TEXT,
                    paid_by_finance_user_id TEXT,
                    paid_at TEXT
                );

                CREATE TABLE IF NOT EXISTS claim_audit_events (
                    claim_id TEXT NOT NULL,
                    sequence_number INTEGER NOT NULL,
                    event_type TEXT NOT NULL,
                    actor_id TEXT NOT NULL,
                    occurred_at TEXT NOT NULL,
                    status_after TEXT NOT NULL,
                    review_decision TEXT,
                    PRIMARY KEY (claim_id, sequence_number),
                    FOREIGN KEY (claim_id) REFERENCES claims(id) ON DELETE CASCADE
                );
                """
            )

    @contextmanager
    def connect(self) -> Iterator[sqlite3.Connection]:
        connection = sqlite3.connect(self.database_path)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = ON")
        try:
            yield connection
            connection.commit()
        finally:
            connection.close()


class SQLiteUserRepository:
    def __init__(self, database: SQLiteDatabase) -> None:
        self.database = database

    def create(self, user: User) -> User:
        with self.database.connect() as connection:
            connection.execute(
                """
                INSERT INTO users (username, role, password_salt, password_hash)
                VALUES (?, ?, ?, ?)
                """,
                (user.username, user.role.value, user.password_salt, user.password_hash),
            )
        return user

    def get_by_username(self, username: str) -> User | None:
        with self.database.connect() as connection:
            row = connection.execute(
                """
                SELECT username, role, password_salt, password_hash
                FROM users
                WHERE username = ?
                """,
                (username,),
            ).fetchone()

        if row is None:
            return None

        return User(
            username=row["username"],
            role=UserRole(row["role"]),
            password_salt=row["password_salt"],
            password_hash=row["password_hash"],
        )


class SQLiteExpenseClaimRepository:
    def __init__(self, database: SQLiteDatabase) -> None:
        self.database = database

    def save(self, claim: ExpenseClaim) -> ExpenseClaim:
        with self.database.connect() as connection:
            connection.execute(
                """
                INSERT INTO claims (
                    id,
                    owner_employee_id,
                    created_at,
                    description,
                    amount,
                    category,
                    status,
                    submitted_at,
                    reviewed_by_manager_id,
                    paid_by_finance_user_id,
                    paid_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    owner_employee_id = excluded.owner_employee_id,
                    created_at = excluded.created_at,
                    description = excluded.description,
                    amount = excluded.amount,
                    category = excluded.category,
                    status = excluded.status,
                    submitted_at = excluded.submitted_at,
                    reviewed_by_manager_id = excluded.reviewed_by_manager_id,
                    paid_by_finance_user_id = excluded.paid_by_finance_user_id,
                    paid_at = excluded.paid_at
                """,
                (
                    claim.id,
                    claim.owner_employee_id,
                    _serialize_datetime(claim.created_at),
                    claim.description,
                    str(claim.amount) if claim.amount is not None else None,
                    claim.category,
                    claim.status.value,
                    _serialize_datetime(claim.submitted_at),
                    claim.reviewed_by_manager_id,
                    claim.paid_by_finance_user_id,
                    _serialize_datetime(claim.paid_at),
                ),
            )
            connection.execute("DELETE FROM claim_audit_events WHERE claim_id = ?", (claim.id,))
            for sequence_number, event in enumerate(claim.audit_events):
                connection.execute(
                    """
                    INSERT INTO claim_audit_events (
                        claim_id,
                        sequence_number,
                        event_type,
                        actor_id,
                        occurred_at,
                        status_after,
                        review_decision
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        claim.id,
                        sequence_number,
                        event.event_type.value,
                        event.actor_id,
                        _serialize_datetime(event.occurred_at),
                        event.status_after.value,
                        event.review_decision.value if event.review_decision is not None else None,
                    ),
                )
        return claim

    def get(self, claim_id: str) -> ExpenseClaim:
        with self.database.connect() as connection:
            claim_row = connection.execute(
                """
                SELECT *
                FROM claims
                WHERE id = ?
                """,
                (claim_id,),
            ).fetchone()
            if claim_row is None:
                raise KeyError(claim_id)

            audit_rows = connection.execute(
                """
                SELECT *
                FROM claim_audit_events
                WHERE claim_id = ?
                ORDER BY sequence_number ASC
                """,
                (claim_id,),
            ).fetchall()

        return self._hydrate_claim(claim_row, audit_rows)

    def list_all(self) -> list[ExpenseClaim]:
        with self.database.connect() as connection:
            claim_rows = connection.execute(
                """
                SELECT *
                FROM claims
                """
            ).fetchall()
            audit_rows = connection.execute(
                """
                SELECT *
                FROM claim_audit_events
                ORDER BY claim_id ASC, sequence_number ASC
                """
            ).fetchall()

        events_by_claim_id: dict[str, list[sqlite3.Row]] = {}
        for audit_row in audit_rows:
            events_by_claim_id.setdefault(audit_row["claim_id"], []).append(audit_row)

        return [
            self._hydrate_claim(claim_row, events_by_claim_id.get(claim_row["id"], []))
            for claim_row in claim_rows
        ]

    def _hydrate_claim(
        self,
        claim_row: sqlite3.Row,
        audit_rows: list[sqlite3.Row],
    ) -> ExpenseClaim:
        audit_events = tuple(
            ClaimAuditEvent(
                event_type=ClaimAuditEventType(audit_row["event_type"]),
                actor_id=audit_row["actor_id"],
                occurred_at=datetime.fromisoformat(audit_row["occurred_at"]),
                status_after=ExpenseClaimStatus(audit_row["status_after"]),
                review_decision=ClaimReviewDecision(audit_row["review_decision"])
                if audit_row["review_decision"] is not None
                else None,
            )
            for audit_row in audit_rows
        )

        return ExpenseClaim(
            id=claim_row["id"],
            owner_employee_id=claim_row["owner_employee_id"],
            created_at=datetime.fromisoformat(claim_row["created_at"]),
            description=claim_row["description"],
            amount=Decimal(claim_row["amount"]) if claim_row["amount"] is not None else None,
            category=claim_row["category"],
            status=ExpenseClaimStatus(claim_row["status"]),
            submitted_at=_deserialize_datetime(claim_row["submitted_at"]),
            reviewed_by_manager_id=claim_row["reviewed_by_manager_id"],
            paid_by_finance_user_id=claim_row["paid_by_finance_user_id"],
            paid_at=_deserialize_datetime(claim_row["paid_at"]),
            audit_events=audit_events,
        )
