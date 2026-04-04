from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI, status
from fastapi.requests import Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from expense_reimbursement.api.schemas import (
    ClaimResponse,
    CreateClaimRequest,
    SubmitClaimRequest,
    UpdateClaimRequest,
)
from expense_reimbursement.domain.expense_claim import (
    ClaimNotEditableError,
    ClaimSubmissionError,
    UnauthorizedClaimAccessError,
)
from expense_reimbursement.repositories.in_memory import InMemoryExpenseClaimRepository
from expense_reimbursement.services.claims import ExpenseClaimService


def create_app() -> FastAPI:
    frontend_dir = Path(__file__).resolve().parent / "frontend"
    app = FastAPI(title="Expense Reimbursement System")
    app.state.claim_service = ExpenseClaimService(InMemoryExpenseClaimRepository())
    app.mount("/static", StaticFiles(directory=frontend_dir / "static"), name="static")

    @app.get("/", include_in_schema=False)
    def index() -> FileResponse:
        return FileResponse(frontend_dir / "index.html")

    @app.get("/health")
    def health_check() -> dict[str, str]:
        return {"status": "ok"}

    @app.post("/claims", response_model=ClaimResponse, status_code=status.HTTP_201_CREATED)
    def create_claim(payload: CreateClaimRequest) -> ClaimResponse:
        claim = app.state.claim_service.create_claim(payload.owner_employee_id)
        return ClaimResponse.from_domain(claim)

    @app.get("/claims/{claim_id}", response_model=ClaimResponse)
    def get_claim(claim_id: str) -> ClaimResponse:
        claim = _get_claim_service(app).get_claim(claim_id)
        return ClaimResponse.from_domain(claim)

    @app.put("/claims/{claim_id}", response_model=ClaimResponse)
    def update_claim(claim_id: str, payload: UpdateClaimRequest) -> ClaimResponse:
        service = _get_claim_service(app)
        claim = service.update_claim(
            claim_id,
            payload.actor_employee_id,
            description=payload.description,
            amount=payload.amount,
            category=payload.category,
        )
        return ClaimResponse.from_domain(claim)

    @app.post("/claims/{claim_id}/submit", response_model=ClaimResponse)
    def submit_claim(claim_id: str, payload: SubmitClaimRequest) -> ClaimResponse:
        claim = _get_claim_service(app).submit_claim(claim_id, payload.actor_employee_id)
        return ClaimResponse.from_domain(claim)

    @app.exception_handler(KeyError)
    def handle_not_found(_: Request, __: KeyError) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"detail": "Claim not found."},
        )

    @app.exception_handler(UnauthorizedClaimAccessError)
    def handle_unauthorized(_: Request, exc: UnauthorizedClaimAccessError) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_403_FORBIDDEN,
            content={"detail": str(exc)},
        )

    @app.exception_handler(ClaimSubmissionError)
    def handle_submission_error(_: Request, exc: ClaimSubmissionError) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"detail": str(exc)},
        )

    @app.exception_handler(ClaimNotEditableError)
    def handle_not_editable(_: Request, exc: ClaimNotEditableError) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={"detail": str(exc)},
        )

    return app


def _get_claim_service(app: FastAPI) -> ExpenseClaimService:
    return app.state.claim_service


app = create_app()
