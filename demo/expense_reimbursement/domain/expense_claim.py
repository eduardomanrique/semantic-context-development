from __future__ import annotations

from dataclasses import dataclass, replace
from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Optional
from uuid import uuid4


class ExpenseClaimStatus(str, Enum):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    PAID = "PAID"


class ClaimViewerRole(str, Enum):
    EMPLOYEE = "EMPLOYEE"
    MANAGER = "MANAGER"
    FINANCE = "FINANCE"


class ClaimReviewDecision(str, Enum):
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class ClaimSubmissionError(ValueError):
    pass


class ClaimNotEditableError(ValueError):
    pass


class ClaimNotSubmittableError(ValueError):
    pass


class ClaimNotReviewableError(ValueError):
    pass


class ClaimNotPayableError(ValueError):
    pass


class ClaimNotReopenableError(ValueError):
    pass


class ClaimVisibilityError(PermissionError):
    pass


class UnauthorizedClaimAccessError(PermissionError):
    pass


class ClaimReviewError(ValueError):
    pass


class ClaimPaymentError(ValueError):
    pass


class ClaimAuditEventType(str, Enum):
    CREATED = "CREATED"
    SUBMITTED = "SUBMITTED"
    REVIEWED = "REVIEWED"
    REOPENED = "REOPENED"
    PAID = "PAID"


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
class ClaimAuditEvent:
    event_type: ClaimAuditEventType
    actor_id: str
    occurred_at: datetime
    status_after: ExpenseClaimStatus
    review_decision: Optional[ClaimReviewDecision] = None


@dataclass(frozen=True)
class ExpenseClaim:
    id: str
    owner_employee_id: str
    created_at: datetime
    description: Optional[str] = None
    amount: Optional[Decimal] = None
    category: Optional[str] = None
    status: ExpenseClaimStatus = ExpenseClaimStatus.DRAFT
    submitted_at: Optional[datetime] = None
    reviewed_by_manager_id: Optional[str] = None
    paid_by_finance_user_id: Optional[str] = None
    paid_at: Optional[datetime] = None
    audit_events: tuple[ClaimAuditEvent, ...] = ()

    @property
    def is_corrected_draft(self) -> bool:
        return self.status == ExpenseClaimStatus.DRAFT and any(
            event.event_type == ClaimAuditEventType.REOPENED for event in self.audit_events
        )

    @property
    def can_submit(self) -> bool:
        return self.status == ExpenseClaimStatus.DRAFT and not self.is_corrected_draft

    @classmethod
    def create(cls, owner_employee_id: str, created_at: datetime) -> "ExpenseClaim":
        return cls(
            id=str(uuid4()),
            owner_employee_id=owner_employee_id,
            created_at=created_at,
            status=ExpenseClaimStatus.DRAFT,
            audit_events=(
                ClaimAuditEvent(
                    event_type=ClaimAuditEventType.CREATED,
                    actor_id=owner_employee_id,
                    occurred_at=created_at,
                    status_after=ExpenseClaimStatus.DRAFT,
                ),
            ),
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

    def submit(self, actor_employee_id: str, submitted_at: datetime) -> "ExpenseClaim":
        self._assert_owner(actor_employee_id)
        self._assert_editable()
        self._assert_submittable()
        self._validate_for_submission()
        return replace(
            self,
            status=ExpenseClaimStatus.SUBMITTED,
            submitted_at=submitted_at,
            audit_events=self.audit_events
            + (
                ClaimAuditEvent(
                    event_type=ClaimAuditEventType.SUBMITTED,
                    actor_id=actor_employee_id,
                    occurred_at=submitted_at,
                    status_after=ExpenseClaimStatus.SUBMITTED,
                ),
            ),
        )

    def review(
        self,
        manager_id: str,
        decision: ClaimReviewDecision,
        reviewed_at: datetime,
    ) -> "ExpenseClaim":
        self._assert_reviewable()

        normalized_manager_id = _normalize_text(manager_id)
        if not normalized_manager_id:
            raise ClaimReviewError("Manager ID is required.")

        return replace(
            self,
            status=ExpenseClaimStatus(decision.value),
            reviewed_by_manager_id=normalized_manager_id,
            audit_events=self.audit_events
            + (
                ClaimAuditEvent(
                    event_type=ClaimAuditEventType.REVIEWED,
                    actor_id=normalized_manager_id,
                    occurred_at=reviewed_at,
                    status_after=ExpenseClaimStatus(decision.value),
                    review_decision=decision,
                ),
            ),
        )

    def mark_paid(self, finance_user_id: str, paid_at: datetime) -> "ExpenseClaim":
        self._assert_payable()

        normalized_finance_user_id = _normalize_text(finance_user_id)
        if not normalized_finance_user_id:
            raise ClaimPaymentError("Finance user ID is required.")

        return replace(
            self,
            status=ExpenseClaimStatus.PAID,
            paid_by_finance_user_id=normalized_finance_user_id,
            paid_at=paid_at,
            audit_events=self.audit_events
            + (
                ClaimAuditEvent(
                    event_type=ClaimAuditEventType.PAID,
                    actor_id=normalized_finance_user_id,
                    occurred_at=paid_at,
                    status_after=ExpenseClaimStatus.PAID,
                ),
            ),
        )

    def reopen(self, actor_employee_id: str, reopened_at: datetime) -> "ExpenseClaim":
        self._assert_owner(actor_employee_id)
        self._assert_reopenable()

        return replace(
            self,
            status=ExpenseClaimStatus.DRAFT,
            submitted_at=None,
            reviewed_by_manager_id=None,
            audit_events=self.audit_events
            + (
                ClaimAuditEvent(
                    event_type=ClaimAuditEventType.REOPENED,
                    actor_id=actor_employee_id,
                    occurred_at=reopened_at,
                    status_after=ExpenseClaimStatus.DRAFT,
                ),
            ),
        )

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

    def _assert_submittable(self) -> None:
        if self.is_corrected_draft:
            raise ClaimNotSubmittableError(
                "Corrected drafts from rejected claims cannot be submitted again."
            )

    def _assert_reviewable(self) -> None:
        if self.status != ExpenseClaimStatus.SUBMITTED:
            raise ClaimNotReviewableError("Only submitted claims can be reviewed.")

    def _assert_payable(self) -> None:
        if self.status != ExpenseClaimStatus.APPROVED:
            raise ClaimNotPayableError("Only approved claims can be marked as paid.")

    def _assert_reopenable(self) -> None:
        if self.status != ExpenseClaimStatus.REJECTED:
            raise ClaimNotReopenableError("Only rejected claims can be reopened.")
