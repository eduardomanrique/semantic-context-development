from __future__ import annotations

from decimal import Decimal
from typing import Optional

from expense_reimbursement.domain.expense_claim import ExpenseClaim
from expense_reimbursement.repositories.in_memory import ExpenseClaimRepository


class ExpenseClaimService:
    def __init__(self, repository: ExpenseClaimRepository) -> None:
        self.repository = repository

    def create_claim(self, owner_employee_id: str) -> ExpenseClaim:
        claim = ExpenseClaim.create(owner_employee_id=owner_employee_id)
        return self.repository.save(claim)

    def get_claim(self, claim_id: str) -> ExpenseClaim:
        return self.repository.get(claim_id)

    def update_claim(
        self,
        claim_id: str,
        actor_employee_id: str,
        *,
        description: Optional[str] = None,
        amount: Decimal | int | float | str | None = None,
        category: Optional[str] = None,
    ) -> ExpenseClaim:
        claim = self.repository.get(claim_id)
        updated_claim = claim.update_draft(
            actor_employee_id,
            description=description,
            amount=amount,
            category=category,
        )
        return self.repository.save(updated_claim)

    def submit_claim(self, claim_id: str, actor_employee_id: str) -> ExpenseClaim:
        claim = self.repository.get(claim_id)
        submitted_claim = claim.submit(actor_employee_id)
        return self.repository.save(submitted_claim)
