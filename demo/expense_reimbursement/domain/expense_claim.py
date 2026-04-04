from __future__ import annotations

from dataclasses import dataclass, replace
from decimal import Decimal
from enum import Enum
from typing import Optional
from uuid import uuid4


class ExpenseClaimStatus(str, Enum):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"


class ClaimSubmissionError(ValueError):
    pass


class ClaimNotEditableError(ValueError):
    pass


class UnauthorizedClaimAccessError(PermissionError):
    pass


def _normalize_text(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    normalized = value.strip()
    return normalized or None


def _normalize_amount(value: Decimal | int | float | str | None) -> Optional[Decimal]:
    if value is None:
        return None
    return Decimal(str(value))


@dataclass(frozen=True)
class ExpenseClaim:
    id: str
    owner_employee_id: str
    description: Optional[str] = None
    amount: Optional[Decimal] = None
    category: Optional[str] = None
    status: ExpenseClaimStatus = ExpenseClaimStatus.DRAFT

    @classmethod
    def create(cls, owner_employee_id: str) -> "ExpenseClaim":
        return cls(
            id=str(uuid4()),
            owner_employee_id=owner_employee_id,
            status=ExpenseClaimStatus.DRAFT,
        )

    def update_draft(
        self,
        actor_employee_id: str,
        *,
        description: Optional[str] = None,
        amount: Decimal | int | float | str | None = None,
        category: Optional[str] = None,
    ) -> "ExpenseClaim":
        self._assert_owner(actor_employee_id)
        self._assert_editable()

        updated_fields = {}
        if description is not None:
            updated_fields["description"] = _normalize_text(description)
        if amount is not None:
            updated_fields["amount"] = _normalize_amount(amount)
        if category is not None:
            updated_fields["category"] = _normalize_text(category)

        return replace(self, **updated_fields)

    def submit(self, actor_employee_id: str) -> "ExpenseClaim":
        self._assert_owner(actor_employee_id)
        self._assert_editable()
        self._validate_for_submission()
        return replace(self, status=ExpenseClaimStatus.SUBMITTED)

    def _validate_for_submission(self) -> None:
        if not self.description:
            raise ClaimSubmissionError("Description is required.")
        if self.amount is None or self.amount <= 0:
            raise ClaimSubmissionError("Amount must be greater than 0.")
        if not self.category:
            raise ClaimSubmissionError("Category is required.")

    def _assert_owner(self, actor_employee_id: str) -> None:
        if actor_employee_id != self.owner_employee_id:
            raise UnauthorizedClaimAccessError("Only the claim owner can modify the claim.")

    def _assert_editable(self) -> None:
        if self.status != ExpenseClaimStatus.DRAFT:
            raise ClaimNotEditableError("Only draft claims can be edited.")
