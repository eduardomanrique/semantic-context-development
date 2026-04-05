import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

from fastapi.testclient import TestClient

from expense_reimbursement.app import create_app


class ExpenseClaimApiTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.database_path = Path(self.temp_dir.name) / "test-expense-reimbursement.db"
        self._current_time = datetime(2026, 4, 5, 12, 0, tzinfo=timezone.utc)
        self.client = self._build_client()

        self.admin_username = "admin"
        self.admin_password = "admin"
        self.employee_username = "employee-123"
        self.employee_password = "employee-pass"
        self.other_employee_username = "employee-456"
        self.other_employee_password = "other-employee-pass"
        self.manager_username = "manager-001"
        self.manager_password = "manager-pass"
        self.finance_username = "finance-001"
        self.finance_password = "finance-pass"

        self._login(self.admin_username, self.admin_password)
        self._create_user(self.employee_username, self.employee_password, "EMPLOYEE")
        self._create_user(self.other_employee_username, self.other_employee_password, "EMPLOYEE")
        self._create_user(self.manager_username, self.manager_password, "MANAGER")
        self._create_user(self.finance_username, self.finance_password, "FINANCE")
        self._logout()

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def test_health_check(self) -> None:
        response = self.client.get("/health")

        self.assertEqual(200, response.status_code)
        self.assertEqual({"status": "ok"}, response.json())

    def test_root_serves_frontend_html(self) -> None:
        response = self.client.get("/")

        self.assertEqual(200, response.status_code)
        self.assertIn("text/html", response.headers["content-type"])
        self.assertIn("Expense Reimbursement System", response.text)
        self.assertIn("Sign in", response.text)
        self.assertIn("Create draft claim", response.text)
        self.assertIn("Review a submitted claim", response.text)
        self.assertIn("Mark an approved claim as paid", response.text)
        self.assertIn("Create a user", response.text)

    def test_static_assets_are_served(self) -> None:
        css_response = self.client.get("/static/app.css")
        js_response = self.client.get("/static/app.js")

        self.assertEqual(200, css_response.status_code)
        self.assertIn("text/css", css_response.headers["content-type"])
        self.assertIn(".status-badge", css_response.text)

        self.assertEqual(200, js_response.status_code)
        self.assertIn("text/javascript", js_response.headers["content-type"])
        self.assertIn("login", js_response.text)
        self.assertIn("createUser", js_response.text)
        self.assertIn("createClaim", js_response.text)
        self.assertIn("listClaims", js_response.text)
        self.assertIn("reviewClaim", js_response.text)
        self.assertIn("markClaimPaid", js_response.text)

    def test_default_admin_can_log_in(self) -> None:
        response = self.client.post(
            "/auth/login",
            json={"username": self.admin_username, "password": self.admin_password},
        )

        self.assertEqual(200, response.status_code)
        self.assertTrue(response.json()["authenticated"])
        self.assertEqual("ADMIN", response.json()["user"]["role"])

    def test_invalid_credentials_are_rejected(self) -> None:
        response = self.client.post(
            "/auth/login",
            json={"username": self.admin_username, "password": "wrong-password"},
        )

        self.assertEqual(401, response.status_code)
        self.assertEqual("Invalid username or password.", response.json()["detail"])

    def test_unauthenticated_users_cannot_access_protected_flows(self) -> None:
        claims_response = self.client.get("/claims")
        users_response = self.client.post(
            "/users",
            json={"username": "new-user", "password": "pass", "role": "EMPLOYEE"},
        )

        self.assertEqual(401, claims_response.status_code)
        self.assertEqual("Authentication is required.", claims_response.json()["detail"])
        self.assertEqual(401, users_response.status_code)
        self.assertEqual("Authentication is required.", users_response.json()["detail"])

    def test_admin_can_create_users(self) -> None:
        self._login(self.admin_username, self.admin_password)

        response = self.client.post(
            "/users",
            json={"username": "manager-002", "password": "manager-pass-2", "role": "MANAGER"},
        )

        self.assertEqual(201, response.status_code)
        self.assertEqual("manager-002", response.json()["username"])
        self.assertEqual("MANAGER", response.json()["role"])

    def test_only_admin_can_create_users(self) -> None:
        self._login(self.employee_username, self.employee_password)

        response = self.client.post(
            "/users",
            json={"username": "employee-789", "password": "employee-pass-789", "role": "EMPLOYEE"},
        )

        self.assertEqual(403, response.status_code)
        self.assertEqual("Only admins can create users.", response.json()["detail"])

    def test_duplicate_username_is_rejected(self) -> None:
        self._login(self.admin_username, self.admin_password)

        response = self.client.post(
            "/users",
            json={"username": self.employee_username, "password": "another-pass", "role": "EMPLOYEE"},
        )

        self.assertEqual(409, response.status_code)
        self.assertEqual("Username already exists.", response.json()["detail"])

    def test_admin_cannot_access_claim_workflow(self) -> None:
        self._login(self.admin_username, self.admin_password)

        response = self.client.get("/claims")

        self.assertEqual(403, response.status_code)
        self.assertEqual("Current user role cannot access claim workflow.", response.json()["detail"])

    def test_employee_can_create_edit_and_submit_own_claim(self) -> None:
        self._login(self.employee_username, self.employee_password)
        claim = self._create_claim()

        updated = self.client.put(
            f"/claims/{claim['id']}",
            json={
                "description": "Taxi ride",
                "amount": "18.40",
                "category": "Travel",
            },
        )
        submitted = self.client.post(f"/claims/{claim['id']}/submit")

        self.assertEqual(200, updated.status_code)
        self.assertEqual("Taxi ride", updated.json()["description"])
        self.assertEqual("18.40", updated.json()["amount"])
        self.assertEqual("Travel", updated.json()["category"])
        self.assertEqual("DRAFT", updated.json()["status"])

        self.assertEqual(200, submitted.status_code)
        self.assertEqual("SUBMITTED", submitted.json()["status"])

    def test_non_employee_roles_cannot_create_claims(self) -> None:
        self._login(self.manager_username, self.manager_password)
        manager_response = self.client.post("/claims")

        self._login(self.finance_username, self.finance_password)
        finance_response = self.client.post("/claims")

        self.assertEqual(403, manager_response.status_code)
        self.assertEqual("Current user role cannot perform this action.", manager_response.json()["detail"])
        self.assertEqual(403, finance_response.status_code)
        self.assertEqual("Current user role cannot perform this action.", finance_response.json()["detail"])

    def test_submission_requires_description(self) -> None:
        self._login(self.employee_username, self.employee_password)
        claim = self._create_claim()
        self.client.put(
            f"/claims/{claim['id']}",
            json={"amount": "10.00", "category": "Travel"},
        )

        response = self.client.post(f"/claims/{claim['id']}/submit")

        self.assertEqual(400, response.status_code)
        self.assertEqual("Description is required.", response.json()["detail"])

    def test_submission_requires_positive_amount(self) -> None:
        self._login(self.employee_username, self.employee_password)
        claim = self._create_claim()
        self.client.put(
            f"/claims/{claim['id']}",
            json={"description": "Taxi ride", "amount": "0", "category": "Travel"},
        )

        response = self.client.post(f"/claims/{claim['id']}/submit")

        self.assertEqual(400, response.status_code)
        self.assertEqual("Amount must be greater than 0.", response.json()["detail"])

    def test_submission_requires_category(self) -> None:
        self._login(self.employee_username, self.employee_password)
        claim = self._create_claim()
        self.client.put(
            f"/claims/{claim['id']}",
            json={"description": "Taxi ride", "amount": "18.40"},
        )

        response = self.client.post(f"/claims/{claim['id']}/submit")

        self.assertEqual(400, response.status_code)
        self.assertEqual("Category is required.", response.json()["detail"])

    def test_employee_list_shows_only_their_own_claims_newest_first(self) -> None:
        self._login(self.employee_username, self.employee_password)
        first_claim = self._create_claim()
        newest_claim = self._create_claim()

        self._login(self.other_employee_username, self.other_employee_password)
        self._create_claim()

        self._login(self.employee_username, self.employee_password)
        response = self.client.get("/claims")

        self.assertEqual(200, response.status_code)
        claims = response.json()
        self.assertEqual([newest_claim["id"], first_claim["id"]], [claim["id"] for claim in claims])
        self.assertEqual(
            {"id", "owner_employee_id", "description", "amount", "category", "status"},
            set(claims[0].keys()),
        )

    def test_manager_list_shows_all_claims_newest_first(self) -> None:
        self._login(self.employee_username, self.employee_password)
        first_claim = self._create_claim()

        self._login(self.other_employee_username, self.other_employee_password)
        second_claim = self._create_claim()

        self._login(self.employee_username, self.employee_password)
        third_claim = self._create_claim()

        self._login(self.manager_username, self.manager_password)
        response = self.client.get("/claims")

        self.assertEqual(200, response.status_code)
        claims = response.json()
        self.assertEqual(
            [third_claim["id"], second_claim["id"], first_claim["id"]],
            [claim["id"] for claim in claims],
        )

    def test_finance_list_shows_all_claims(self) -> None:
        self._login(self.employee_username, self.employee_password)
        self._create_claim()

        self._login(self.other_employee_username, self.other_employee_password)
        other_claim = self._create_claim()

        self._login(self.finance_username, self.finance_password)
        response = self.client.get("/claims")

        self.assertEqual(200, response.status_code)
        claims = response.json()
        self.assertEqual(2, len(claims))
        self.assertEqual(other_claim["id"], claims[0]["id"])

    def test_employee_cannot_view_another_employee_claim_detail(self) -> None:
        self._login(self.other_employee_username, self.other_employee_password)
        claim = self._create_claim()

        self._login(self.employee_username, self.employee_password)
        response = self.client.get(f"/claims/{claim['id']}")

        self.assertEqual(403, response.status_code)
        self.assertEqual("Employees can view only their own claims.", response.json()["detail"])

    def test_manager_can_approve_a_submitted_claim(self) -> None:
        claim = self._create_submitted_claim()

        self._login(self.manager_username, self.manager_password)
        response = self.client.post(
            f"/claims/{claim['id']}/review",
            json={"decision": "APPROVED"},
        )

        self.assertEqual(200, response.status_code)
        self.assertEqual("APPROVED", response.json()["status"])
        self.assertEqual(self.manager_username, response.json()["reviewed_by_manager_id"])

    def test_manager_can_reject_a_submitted_claim(self) -> None:
        claim = self._create_submitted_claim()

        self._login(self.manager_username, self.manager_password)
        response = self.client.post(
            f"/claims/{claim['id']}/review",
            json={"decision": "REJECTED"},
        )

        self.assertEqual(200, response.status_code)
        self.assertEqual("REJECTED", response.json()["status"])
        self.assertEqual(self.manager_username, response.json()["reviewed_by_manager_id"])

    def test_manager_can_only_review_submitted_claims(self) -> None:
        self._login(self.employee_username, self.employee_password)
        claim = self._create_claim()

        self._login(self.manager_username, self.manager_password)
        response = self.client.post(
            f"/claims/{claim['id']}/review",
            json={"decision": "APPROVED"},
        )

        self.assertEqual(409, response.status_code)
        self.assertEqual("Only submitted claims can be reviewed.", response.json()["detail"])

    def test_finance_user_can_mark_approved_claim_as_paid(self) -> None:
        claim = self._create_approved_claim()

        self._login(self.finance_username, self.finance_password)
        response = self.client.post(f"/claims/{claim['id']}/pay")

        self.assertEqual(200, response.status_code)
        self.assertEqual("PAID", response.json()["status"])
        self.assertEqual(self.finance_username, response.json()["paid_by_finance_user_id"])
        self.assertIsNotNone(response.json()["paid_at"])

    def test_finance_user_can_only_mark_approved_claims_as_paid(self) -> None:
        claim = self._create_submitted_claim()

        self._login(self.finance_username, self.finance_password)
        response = self.client.post(f"/claims/{claim['id']}/pay")

        self.assertEqual(409, response.status_code)
        self.assertEqual("Only approved claims can be marked as paid.", response.json()["detail"])

    def test_rejected_claim_can_be_reopened_and_saved_but_not_resubmitted(self) -> None:
        claim = self._create_rejected_claim()

        self._login(self.employee_username, self.employee_password)
        reopen_response = self.client.post(f"/claims/{claim['id']}/reopen")
        self.assertEqual(200, reopen_response.status_code)
        self.assertEqual("DRAFT", reopen_response.json()["status"])
        self.assertTrue(reopen_response.json()["is_corrected_draft"])
        self.assertFalse(reopen_response.json()["can_submit"])

        save_response = self.client.put(
            f"/claims/{claim['id']}",
            json={
                "description": "Updated taxi ride",
                "amount": "21.10",
                "category": "Travel",
            },
        )
        self.assertEqual(200, save_response.status_code)
        self.assertEqual("DRAFT", save_response.json()["status"])

        submit_response = self.client.post(f"/claims/{claim['id']}/submit")
        self.assertEqual(409, submit_response.status_code)
        self.assertEqual(
            "Corrected drafts from rejected claims cannot be submitted again.",
            submit_response.json()["detail"],
        )

    def test_persisted_data_survives_application_restart(self) -> None:
        claim = self._create_submitted_claim()

        restarted_client = self._build_client()
        self._login(self.employee_username, self.employee_password, client=restarted_client)
        response = restarted_client.get("/claims")

        self.assertEqual(200, response.status_code)
        claims = response.json()
        self.assertEqual(1, len(claims))
        self.assertEqual(claim["id"], claims[0]["id"])
        self.assertEqual("SUBMITTED", claims[0]["status"])

    def test_logout_blocks_access_to_protected_flows(self) -> None:
        self._login(self.employee_username, self.employee_password)
        logout_response = self.client.post("/auth/logout")
        claims_response = self.client.get("/claims")

        self.assertEqual(204, logout_response.status_code)
        self.assertEqual(401, claims_response.status_code)
        self.assertEqual("Authentication is required.", claims_response.json()["detail"])

    def test_missing_claim_returns_not_found(self) -> None:
        self._login(self.manager_username, self.manager_password)
        response = self.client.get("/claims/missing-claim")

        self.assertEqual(404, response.status_code)
        self.assertEqual("Claim not found.", response.json()["detail"])

    def _build_client(self) -> TestClient:
        app = create_app(
            database_path=self.database_path,
            now_provider=self._next_time,
            session_secret="test-session-secret",
        )
        return TestClient(app)

    def _login(self, username: str, password: str, *, client: TestClient | None = None) -> dict:
        active_client = client or self.client
        response = active_client.post("/auth/login", json={"username": username, "password": password})
        self.assertEqual(200, response.status_code)
        return response.json()

    def _logout(self) -> None:
        response = self.client.post("/auth/logout")
        self.assertEqual(204, response.status_code)

    def _create_user(self, username: str, password: str, role: str) -> dict:
        response = self.client.post(
            "/users",
            json={"username": username, "password": password, "role": role},
        )
        self.assertEqual(201, response.status_code)
        return response.json()

    def _create_claim(self) -> dict:
        response = self.client.post("/claims")
        self.assertEqual(201, response.status_code)
        return response.json()

    def _create_completed_claim(self) -> dict:
        self._login(self.employee_username, self.employee_password)
        claim = self._create_claim()
        response = self.client.put(
            f"/claims/{claim['id']}",
            json={
                "description": "Taxi ride",
                "amount": "18.40",
                "category": "Travel",
            },
        )
        self.assertEqual(200, response.status_code)
        return response.json()

    def _create_submitted_claim(self) -> dict:
        claim = self._create_completed_claim()
        response = self.client.post(f"/claims/{claim['id']}/submit")
        self.assertEqual(200, response.status_code)
        return response.json()

    def _create_approved_claim(self) -> dict:
        claim = self._create_submitted_claim()
        self._login(self.manager_username, self.manager_password)
        response = self.client.post(
            f"/claims/{claim['id']}/review",
            json={"decision": "APPROVED"},
        )
        self.assertEqual(200, response.status_code)
        return response.json()

    def _create_rejected_claim(self) -> dict:
        claim = self._create_submitted_claim()
        self._login(self.manager_username, self.manager_password)
        response = self.client.post(
            f"/claims/{claim['id']}/review",
            json={"decision": "REJECTED"},
        )
        self.assertEqual(200, response.status_code)
        return response.json()

    def _next_time(self) -> datetime:
        current = self._current_time
        self._current_time += timedelta(seconds=1)
        return current


if __name__ == "__main__":
    unittest.main()
