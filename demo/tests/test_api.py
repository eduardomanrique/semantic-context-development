import unittest

from fastapi.testclient import TestClient

from expense_reimbursement.app import create_app
from expense_reimbursement.repositories.in_memory import InMemoryExpenseClaimRepository
from expense_reimbursement.services.claims import ExpenseClaimService


class ExpenseClaimApiTests(unittest.TestCase):
    def setUp(self) -> None:
        self.app = create_app()
        self.app.state.claim_service = ExpenseClaimService(InMemoryExpenseClaimRepository())
        self.client = TestClient(self.app)
        self.owner_id = "employee-123"
        self.other_employee_id = "employee-456"

    def test_health_check(self) -> None:
        response = self.client.get("/health")

        self.assertEqual(200, response.status_code)
        self.assertEqual({"status": "ok"}, response.json())

    def test_root_serves_frontend_html(self) -> None:
        response = self.client.get("/")

        self.assertEqual(200, response.status_code)
        self.assertIn("text/html", response.headers["content-type"])
        self.assertIn("Expense Reimbursement System", response.text)
        self.assertIn("Create draft claim", response.text)

    def test_static_assets_are_served(self) -> None:
        css_response = self.client.get("/static/app.css")
        js_response = self.client.get("/static/app.js")

        self.assertEqual(200, css_response.status_code)
        self.assertIn("text/css", css_response.headers["content-type"])
        self.assertIn(".status-badge", css_response.text)

        self.assertEqual(200, js_response.status_code)
        self.assertIn("text/javascript", js_response.headers["content-type"])
        self.assertIn("createClaim", js_response.text)

    def test_new_claim_starts_in_draft(self) -> None:
        response = self.client.post("/claims", json={"owner_employee_id": self.owner_id})

        self.assertEqual(201, response.status_code)
        self.assertEqual("DRAFT", response.json()["status"])

    def test_owner_can_edit_and_save_a_draft_claim(self) -> None:
        claim = self._create_claim()

        response = self.client.put(
            f"/claims/{claim['id']}",
            json={
                "actor_employee_id": self.owner_id,
                "description": "Client dinner",
                "amount": "42.50",
                "category": "Meals",
            },
        )

        self.assertEqual(200, response.status_code)
        self.assertEqual("Client dinner", response.json()["description"])
        self.assertEqual("42.50", response.json()["amount"])
        self.assertEqual("Meals", response.json()["category"])
        self.assertEqual("DRAFT", response.json()["status"])

    def test_only_owner_can_edit_a_draft_claim(self) -> None:
        claim = self._create_claim()

        response = self.client.put(
            f"/claims/{claim['id']}",
            json={
                "actor_employee_id": self.other_employee_id,
                "description": "Unauthorized change",
            },
        )

        self.assertEqual(403, response.status_code)
        self.assertEqual("Only the claim owner can modify the claim.", response.json()["detail"])

    def test_submission_requires_description(self) -> None:
        claim = self._create_claim()
        self.client.put(
            f"/claims/{claim['id']}",
            json={
                "actor_employee_id": self.owner_id,
                "amount": "10.00",
                "category": "Travel",
            },
        )

        response = self.client.post(
            f"/claims/{claim['id']}/submit",
            json={"actor_employee_id": self.owner_id},
        )

        self.assertEqual(400, response.status_code)
        self.assertEqual("Description is required.", response.json()["detail"])

    def test_submission_requires_positive_amount(self) -> None:
        claim = self._create_claim()
        self.client.put(
            f"/claims/{claim['id']}",
            json={
                "actor_employee_id": self.owner_id,
                "description": "Taxi ride",
                "amount": "0",
                "category": "Travel",
            },
        )

        response = self.client.post(
            f"/claims/{claim['id']}/submit",
            json={"actor_employee_id": self.owner_id},
        )

        self.assertEqual(400, response.status_code)
        self.assertEqual("Amount must be greater than 0.", response.json()["detail"])

    def test_submission_requires_category(self) -> None:
        claim = self._create_claim()
        self.client.put(
            f"/claims/{claim['id']}",
            json={
                "actor_employee_id": self.owner_id,
                "description": "Taxi ride",
                "amount": "18.40",
            },
        )

        response = self.client.post(
            f"/claims/{claim['id']}/submit",
            json={"actor_employee_id": self.owner_id},
        )

        self.assertEqual(400, response.status_code)
        self.assertEqual("Category is required.", response.json()["detail"])

    def test_successful_submission_changes_status_to_submitted(self) -> None:
        claim = self._create_and_complete_claim()

        response = self.client.post(
            f"/claims/{claim['id']}/submit",
            json={"actor_employee_id": self.owner_id},
        )

        self.assertEqual(200, response.status_code)
        self.assertEqual("SUBMITTED", response.json()["status"])

    def test_employee_cannot_edit_after_submission(self) -> None:
        claim = self._create_and_complete_claim()
        self.client.post(
            f"/claims/{claim['id']}/submit",
            json={"actor_employee_id": self.owner_id},
        )

        response = self.client.put(
            f"/claims/{claim['id']}",
            json={
                "actor_employee_id": self.owner_id,
                "description": "Updated after submission",
            },
        )

        self.assertEqual(409, response.status_code)
        self.assertEqual("Only draft claims can be edited.", response.json()["detail"])

    def test_can_fetch_saved_claim(self) -> None:
        claim = self._create_and_complete_claim()

        response = self.client.get(f"/claims/{claim['id']}")

        self.assertEqual(200, response.status_code)
        self.assertEqual(claim["id"], response.json()["id"])
        self.assertEqual("Taxi ride", response.json()["description"])
        self.assertEqual("18.40", response.json()["amount"])
        self.assertEqual("Travel", response.json()["category"])
        self.assertEqual("DRAFT", response.json()["status"])

    def test_missing_claim_returns_not_found(self) -> None:
        response = self.client.get("/claims/missing-claim")

        self.assertEqual(404, response.status_code)
        self.assertEqual("Claim not found.", response.json()["detail"])

    def _create_claim(self) -> dict:
        response = self.client.post("/claims", json={"owner_employee_id": self.owner_id})
        self.assertEqual(201, response.status_code)
        return response.json()

    def _create_and_complete_claim(self) -> dict:
        claim = self._create_claim()
        response = self.client.put(
            f"/claims/{claim['id']}",
            json={
                "actor_employee_id": self.owner_id,
                "description": "Taxi ride",
                "amount": "18.40",
                "category": "Travel",
            },
        )
        self.assertEqual(200, response.status_code)
        return response.json()


if __name__ == "__main__":
    unittest.main()
