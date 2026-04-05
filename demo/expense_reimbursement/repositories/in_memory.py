from __future__ import annotations

from typing import Protocol

from expense_reimbursement.domain.expense_claim import ExpenseClaim


class ExpenseClaimRepository(Protocol):
    def save(self, claim: ExpenseClaim) -> ExpenseClaim:
        raise NotImplementedError

    def get(self, claim_id: str) -> ExpenseClaim:
        raise NotImplementedError

    def list_all(self) -> list[ExpenseClaim]:
        raise NotImplementedError


class InMemoryExpenseClaimRepository:
    def __init__(self) -> None:
        self._claims: dict[str, ExpenseClaim] = {}

    def save(self, claim: ExpenseClaim) -> ExpenseClaim:
        self._claims[claim.id] = claim
        return claim

    def get(self, claim_id: str) -> ExpenseClaim:
        return self._claims[claim_id]

    def list_all(self) -> list[ExpenseClaim]:
        return list(self._claims.values())
