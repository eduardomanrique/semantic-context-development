from __future__ import annotations

from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, field_serializer

from expense_reimbursement.domain.expense_claim import ExpenseClaim, ExpenseClaimStatus


class CreateClaimRequest(BaseModel):
    owner_employee_id: str


class UpdateClaimRequest(BaseModel):
    actor_employee_id: str
    description: Optional[str] = None
    amount: Decimal | int | float | str | None = None
    category: Optional[str] = None


class SubmitClaimRequest(BaseModel):
    actor_employee_id: str


class ClaimResponse(BaseModel):
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
    def from_domain(cls, claim: ExpenseClaim) -> "ClaimResponse":
        return cls(
            id=claim.id,
            owner_employee_id=claim.owner_employee_id,
            description=claim.description,
            amount=claim.amount,
            category=claim.category,
            status=claim.status,
        )
