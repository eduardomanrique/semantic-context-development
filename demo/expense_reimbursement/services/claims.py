from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal
from typing import Callable, Optional

from expense_reimbursement.domain.expense_claim import (
    ClaimReviewDecision,
    ClaimViewerRole,
    ClaimVisibilityError,
    ExpenseClaim,
)
from expense_reimbursement.repositories.in_memory import ExpenseClaimRepository


class ExpenseClaimService:
    def __init__(
        self,
        repository: ExpenseClaimRepository,
        now_provider: Callable[[], datetime] | None = None,
    ) -> None:
        self.repository = repository
        self.now_provider = now_provider or (lambda: datetime.now(timezone.utc))

    def create_claim(self, owner_employee_id: str) -> ExpenseClaim:
        claim = ExpenseClaim.create(
            owner_employee_id=owner_employee_id,
            created_at=self.now_provider(),
        )
        return self.repository.save(claim)

    def get_claim(self, claim_id: str, viewer_role: ClaimViewerRole, viewer_id: str) -> ExpenseClaim:
        claim = self.repository.get(claim_id)
        self._assert_visible(claim, viewer_role, viewer_id)
        return claim

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
        submitted_claim = claim.submit(actor_employee_id, self.now_provider())
        return self.repository.save(submitted_claim)

    def review_claim(
        self,
        claim_id: str,
        manager_id: str,
        decision: ClaimReviewDecision,
    ) -> ExpenseClaim:
        claim = self.repository.get(claim_id)
        reviewed_claim = claim.review(manager_id, decision, self.now_provider())
        return self.repository.save(reviewed_claim)

    def reopen_claim(self, claim_id: str, actor_employee_id: str) -> ExpenseClaim:
        claim = self.repository.get(claim_id)
        reopened_claim = claim.reopen(actor_employee_id, self.now_provider())
        return self.repository.save(reopened_claim)

    def mark_claim_paid(self, claim_id: str, finance_user_id: str) -> ExpenseClaim:
        claim = self.repository.get(claim_id)
        paid_claim = claim.mark_paid(finance_user_id, self.now_provider())
        return self.repository.save(paid_claim)

    def list_claims(self, viewer_role: ClaimViewerRole, viewer_id: str) -> list[ExpenseClaim]:
        claims = self.repository.list_all()
        visible_claims = [claim for claim in claims if self._is_visible(claim, viewer_role, viewer_id)]
        return sorted(visible_claims, key=lambda claim: claim.created_at, reverse=True)

    def _assert_visible(
        self,
        claim: ExpenseClaim,
        viewer_role: ClaimViewerRole,
        viewer_id: str,
    ) -> None:
        if not self._is_visible(claim, viewer_role, viewer_id):
            raise ClaimVisibilityError("Employees can view only their own claims.")

    def _is_visible(
        self,
        claim: ExpenseClaim,
        viewer_role: ClaimViewerRole,
        viewer_id: str,
    ) -> bool:
        if viewer_role in {ClaimViewerRole.MANAGER, ClaimViewerRole.FINANCE}:
            return True
        return viewer_role == ClaimViewerRole.EMPLOYEE and claim.owner_employee_id == viewer_id
