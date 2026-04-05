from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, field_serializer

from expense_reimbursement.domain.expense_claim import (
    ClaimReviewDecision,
    ExpenseClaim,
    ExpenseClaimStatus,
)
from expense_reimbursement.domain.user import User, UserRole


class LoginRequest(BaseModel):
    username: str
    password: str


class CreateUserRequest(BaseModel):
    username: str
    password: str
    role: UserRole


class UpdateClaimRequest(BaseModel):
    description: Optional[str] = None
    amount: Decimal | int | float | str | None = None
    category: Optional[str] = None


class ReviewClaimRequest(BaseModel):
    decision: ClaimReviewDecision


class UserResponse(BaseModel):
    model_config = ConfigDict(use_enum_values=True)

    username: str
    role: UserRole

    @classmethod
    def from_domain(cls, user: User) -> "UserResponse":
        return cls(username=user.username, role=user.role)


class AuthSessionResponse(BaseModel):
    authenticated: bool
    user: Optional[UserResponse] = None


class ClaimListItemResponse(BaseModel):
    model_config = ConfigDict(use_enum_values=True)

    id: str
    owner_employee_id: str
    description: Optional[str] = None
    amount: Optional[Decimal] = None
    category: Optional[str] = None
    status: ExpenseClaimStatus

    @field_serializer("amount")
    def serialize_amount(self, amount: Optional[Decimal]) -> Optional[str]:
        if amount is None:
            return None
        return str(amount)

    @classmethod
    def from_domain(cls, claim: ExpenseClaim) -> "ClaimListItemResponse":
        return cls(
            id=claim.id,
            owner_employee_id=claim.owner_employee_id,
            description=claim.description,
            amount=claim.amount,
            category=claim.category,
            status=claim.status,
        )


class ClaimResponse(BaseModel):
    model_config = ConfigDict(use_enum_values=True)

    id: str
    owner_employee_id: str
    created_at: datetime
    description: Optional[str] = None
    amount: Optional[Decimal] = None
    category: Optional[str] = None
    status: ExpenseClaimStatus
    can_submit: bool
    is_corrected_draft: bool
    submitted_at: Optional[datetime] = None
    reviewed_by_manager_id: Optional[str] = None
    paid_by_finance_user_id: Optional[str] = None
    paid_at: Optional[datetime] = None

    @field_serializer("amount")
    def serialize_amount(self, amount: Optional[Decimal]) -> Optional[str]:
        if amount is None:
            return None
        return str(amount)

    @classmethod
    def from_domain(cls, claim: ExpenseClaim) -> "ClaimResponse":
        return cls(
            id=claim.id,
            owner_employee_id=claim.owner_employee_id,
            created_at=claim.created_at,
            description=claim.description,
            amount=claim.amount,
            category=claim.category,
            status=claim.status,
            can_submit=claim.can_submit,
            is_corrected_draft=claim.is_corrected_draft,
            submitted_at=claim.submitted_at,
            reviewed_by_manager_id=claim.reviewed_by_manager_id,
            paid_by_finance_user_id=claim.paid_by_finance_user_id,
            paid_at=claim.paid_at,
        )
