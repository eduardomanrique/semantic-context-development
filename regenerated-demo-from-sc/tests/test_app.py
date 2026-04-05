from __future__ import annotations

import unittest

from expense_claims.services import (
    PermissionDenied,
    StateConflict,
    ValidationError,
    create_claim,
    get_claim_detail,
    get_connection,
    get_user_by_username,
    initialize_database,
    list_approved_claims,
    list_submitted_claims,
    pay_claim,
    reopen_claim,
    review_claim,
    submit_claim,
    update_claim,
)


class ExpenseClaimsTests(unittest.TestCase):
    def setUp(self) -> None:
        self.connection = get_connection(":memory:")
        initialize_database(self.connection)
        self.alice = get_user_by_username(self.connection, "alice")
        self.bob = get_user_by_username(self.connection, "bob")
        self.manager = get_user_by_username(self.connection, "maria")
        self.finance = get_user_by_username(self.connection, "frank")

    def tearDown(self) -> None:
        self.connection.close()

    def create_draft(self, actor=None) -> int:
        return create_claim(
            self.connection,
            actor or self.alice,
            {
                "title": "Client dinner",
                "expense_date": "2026-04-04",
                "amount": "48.30",
                "category": "Meals",
                "description": "Dinner with a client after a sales meeting.",
            },
        )

    def test_employee_can_create_valid_draft_claim(self) -> None:
        claim_id = self.create_draft()
        detail = get_claim_detail(self.connection, self.alice, claim_id)
        self.assertEqual(detail["status"], "draft")
        self.assertEqual(detail["amount"], "48.30")
        self.assertEqual(detail["employee_name"], "Alice Employee")

    def test_invalid_claim_payload_is_rejected(self) -> None:
        with self.assertRaises(ValidationError) as context:
            create_claim(
                self.connection,
                self.alice,
                {
                    "title": "",
                    "expense_date": "bad-date",
                    "amount": "12.345",
                    "category": "",
                    "description": "",
                },
            )
        self.assertIn("title", context.exception.errors)
        self.assertIn("expense_date", context.exception.errors)
        self.assertIn("amount", context.exception.errors)
        self.assertIn("category", context.exception.errors)
        self.assertIn("description", context.exception.errors)

    def test_employee_can_submit_and_cannot_edit_after_submission(self) -> None:
        claim_id = self.create_draft()
        submit_claim(self.connection, self.alice, claim_id)
        detail = get_claim_detail(self.connection, self.alice, claim_id)
        self.assertEqual(detail["status"], "submitted")
        with self.assertRaises(StateConflict):
            update_claim(
                self.connection,
                self.alice,
                claim_id,
                {
                    "title": "Changed",
                    "expense_date": "2026-04-04",
                    "amount": "48.30",
                    "category": "Meals",
                    "description": "Changed",
                },
            )

    def test_non_employee_cannot_create_claims(self) -> None:
        with self.assertRaises(PermissionDenied):
            self.create_draft(actor=self.manager)

    def test_manager_can_list_submitted_claims_and_approve(self) -> None:
        claim_id = self.create_draft()
        submit_claim(self.connection, self.alice, claim_id)
        submitted = list_submitted_claims(self.connection, self.manager)
        self.assertEqual([claim["id"] for claim in submitted], [claim_id])
        review_claim(self.connection, self.manager, claim_id, "approve", "Looks correct.")
        detail = get_claim_detail(self.connection, self.alice, claim_id)
        self.assertEqual(detail["status"], "approved")
        self.assertEqual(detail["reviews"][0]["note"], "Looks correct.")

    def test_manager_can_reject_and_re_review_requires_resubmission(self) -> None:
        claim_id = self.create_draft()
        submit_claim(self.connection, self.alice, claim_id)
        review_claim(self.connection, self.manager, claim_id, "reject", "Missing attendee names.")
        with self.assertRaises(StateConflict):
            review_claim(self.connection, self.manager, claim_id, "approve", "Second pass")

    def test_non_manager_cannot_review(self) -> None:
        claim_id = self.create_draft()
        submit_claim(self.connection, self.alice, claim_id)
        with self.assertRaises(PermissionDenied):
            review_claim(self.connection, self.alice, claim_id, "approve")

    def test_finance_can_list_approved_claims_and_mark_paid(self) -> None:
        claim_id = self.create_draft()
        submit_claim(self.connection, self.alice, claim_id)
        review_claim(self.connection, self.manager, claim_id, "approve", "Approved for payment.")
        approved = list_approved_claims(self.connection, self.finance)
        self.assertEqual([claim["id"] for claim in approved], [claim_id])
        pay_claim(self.connection, self.finance, claim_id, "Paid in payroll batch 12.")
        detail = get_claim_detail(self.connection, self.alice, claim_id)
        self.assertEqual(detail["status"], "paid")
        self.assertEqual(detail["payment"]["note"], "Paid in payroll batch 12.")

    def test_non_finance_or_non_approved_claims_cannot_be_paid(self) -> None:
        claim_id = self.create_draft()
        submit_claim(self.connection, self.alice, claim_id)
        with self.assertRaises(PermissionDenied):
            pay_claim(self.connection, self.alice, claim_id)
        with self.assertRaises(StateConflict):
            pay_claim(self.connection, self.finance, claim_id)

    def test_rejected_claim_can_be_reopened_edited_and_resubmitted(self) -> None:
        claim_id = self.create_draft()
        submit_claim(self.connection, self.alice, claim_id)
        review_claim(self.connection, self.manager, claim_id, "reject", "Need a more precise purpose.")
        reopen_claim(self.connection, self.alice, claim_id)
        update_claim(
            self.connection,
            self.alice,
            claim_id,
            {
                "title": "Client dinner",
                "expense_date": "2026-04-04",
                "amount": "48.30",
                "category": "Meals",
                "description": "Dinner with a named client after the April account review.",
            },
        )
        submit_claim(self.connection, self.alice, claim_id)
        detail = get_claim_detail(self.connection, self.alice, claim_id)
        self.assertEqual(detail["status"], "submitted")
        self.assertEqual(len(detail["reviews"]), 1)
        self.assertEqual(detail["reviews"][0]["note"], "Need a more precise purpose.")
        review_claim(self.connection, self.manager, claim_id, "approve", "Now complete.")
        final_detail = get_claim_detail(self.connection, self.alice, claim_id)
        self.assertEqual(final_detail["status"], "approved")
        self.assertEqual(len(final_detail["reviews"]), 2)

    def test_employee_cannot_reopen_another_employees_rejected_claim(self) -> None:
        claim_id = self.create_draft()
        submit_claim(self.connection, self.alice, claim_id)
        review_claim(self.connection, self.manager, claim_id, "reject", "Rejected.")
        with self.assertRaises(PermissionDenied):
            reopen_claim(self.connection, self.bob, claim_id)

    def test_paid_claims_remain_immutable(self) -> None:
        claim_id = self.create_draft()
        submit_claim(self.connection, self.alice, claim_id)
        review_claim(self.connection, self.manager, claim_id, "approve", "")
        pay_claim(self.connection, self.finance, claim_id, "")
        with self.assertRaises(StateConflict):
            reopen_claim(self.connection, self.alice, claim_id)
        with self.assertRaises(StateConflict):
            pay_claim(self.connection, self.finance, claim_id, "Again")


if __name__ == "__main__":
    unittest.main()
