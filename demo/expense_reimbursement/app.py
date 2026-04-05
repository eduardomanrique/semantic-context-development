from __future__ import annotations

import base64
import hashlib
import hmac
import os
from collections.abc import Callable
from datetime import datetime
from pathlib import Path

from fastapi import Depends, FastAPI, Response, status
from fastapi.requests import Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from expense_reimbursement.api.schemas import (
    AuthSessionResponse,
    ClaimListItemResponse,
    ClaimResponse,
    CreateUserRequest,
    LoginRequest,
    ReviewClaimRequest,
    UpdateClaimRequest,
    UserResponse,
)
from expense_reimbursement.domain.expense_claim import (
    ClaimNotEditableError,
    ClaimNotPayableError,
    ClaimNotReopenableError,
    ClaimNotReviewableError,
    ClaimNotSubmittableError,
    ClaimPaymentError,
    ClaimReviewError,
    ClaimSubmissionError,
    ClaimViewerRole,
    ClaimVisibilityError,
    UnauthorizedClaimAccessError,
)
from expense_reimbursement.domain.user import (
    AuthenticationError,
    AuthorizationError,
    DuplicateUserError,
    InvalidUserError,
    User,
    UserRole,
)
from expense_reimbursement.repositories.sqlite import (
    SQLiteDatabase,
    SQLiteExpenseClaimRepository,
    SQLiteUserRepository,
)
from expense_reimbursement.services.claims import ExpenseClaimService
from expense_reimbursement.services.users import UserService


def _default_database_path() -> Path:
    return Path(__file__).resolve().parent.parent / "expense_reimbursement.db"


def create_app(
    *,
    database_path: str | Path | None = None,
    now_provider: Callable[[], datetime] | None = None,
    session_secret: str | None = None,
) -> FastAPI:
    frontend_dir = Path(__file__).resolve().parent / "frontend"
    app = FastAPI(title="Expense Reimbursement System")
    app.state.session_secret = session_secret or os.getenv(
        "EXPENSE_REIMBURSEMENT_SESSION_SECRET",
        "dev-session-secret",
    )

    database = SQLiteDatabase(database_path or _default_database_path())
    database.initialize()

    user_service = UserService(SQLiteUserRepository(database))
    user_service.ensure_default_admin()

    app.state.database = database
    app.state.user_service = user_service
    app.state.claim_service = ExpenseClaimService(
        SQLiteExpenseClaimRepository(database),
        now_provider=now_provider,
    )
    app.mount("/static", StaticFiles(directory=frontend_dir / "static"), name="static")

    @app.get("/", include_in_schema=False)
    def index() -> FileResponse:
        return FileResponse(frontend_dir / "index.html")

    @app.get("/health")
    def health_check() -> dict[str, str]:
        return {"status": "ok"}

    @app.get("/auth/me", response_model=AuthSessionResponse)
    def current_session(request: Request) -> AuthSessionResponse:
        user = _get_session_user(request, required=False)
        if user is None:
            return AuthSessionResponse(authenticated=False, user=None)
        return AuthSessionResponse(authenticated=True, user=UserResponse.from_domain(user))

    @app.post("/auth/login", response_model=AuthSessionResponse)
    def login(payload: LoginRequest) -> JSONResponse:
        user = _get_user_service(app).authenticate(payload.username, payload.password)
        response = JSONResponse(
            status_code=status.HTTP_200_OK,
            content=AuthSessionResponse(authenticated=True, user=UserResponse.from_domain(user)).model_dump(),
        )
        response.set_cookie(
            key="expense_session",
            value=_sign_username(app, user.username),
            httponly=True,
            samesite="lax",
        )
        return response

    @app.post("/auth/logout", status_code=status.HTTP_204_NO_CONTENT)
    def logout() -> Response:
        response = Response(status_code=status.HTTP_204_NO_CONTENT)
        response.delete_cookie("expense_session")
        return response

    @app.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
    def create_user(
        payload: CreateUserRequest,
        current_user: User = Depends(_require_admin_user),
    ) -> UserResponse:
        user = _get_user_service(app).create_user(current_user, payload.username, payload.password, payload.role)
        return UserResponse.from_domain(user)

    @app.post("/claims", response_model=ClaimResponse, status_code=status.HTTP_201_CREATED)
    def create_claim(current_user: User = Depends(_require_user_role(UserRole.EMPLOYEE))) -> ClaimResponse:
        claim = _get_claim_service(app).create_claim(current_user.username)
        return ClaimResponse.from_domain(claim)

    @app.get("/claims", response_model=list[ClaimListItemResponse])
    def list_claims(current_user: User = Depends(_require_claim_user)) -> list[ClaimListItemResponse]:
        claims = _get_claim_service(app).list_claims(_to_claim_viewer_role(current_user.role), current_user.username)
        return [ClaimListItemResponse.from_domain(claim) for claim in claims]

    @app.get("/claims/{claim_id}", response_model=ClaimResponse)
    def get_claim(claim_id: str, current_user: User = Depends(_require_claim_user)) -> ClaimResponse:
        claim = _get_claim_service(app).get_claim(
            claim_id,
            _to_claim_viewer_role(current_user.role),
            current_user.username,
        )
        return ClaimResponse.from_domain(claim)

    @app.put("/claims/{claim_id}", response_model=ClaimResponse)
    def update_claim(
        claim_id: str,
        payload: UpdateClaimRequest,
        current_user: User = Depends(_require_user_role(UserRole.EMPLOYEE)),
    ) -> ClaimResponse:
        claim = _get_claim_service(app).update_claim(
            claim_id,
            current_user.username,
            description=payload.description,
            amount=payload.amount,
            category=payload.category,
        )
        return ClaimResponse.from_domain(claim)

    @app.post("/claims/{claim_id}/submit", response_model=ClaimResponse)
    def submit_claim(
        claim_id: str,
        current_user: User = Depends(_require_user_role(UserRole.EMPLOYEE)),
    ) -> ClaimResponse:
        claim = _get_claim_service(app).submit_claim(claim_id, current_user.username)
        return ClaimResponse.from_domain(claim)

    @app.post("/claims/{claim_id}/reopen", response_model=ClaimResponse)
    def reopen_claim(
        claim_id: str,
        current_user: User = Depends(_require_user_role(UserRole.EMPLOYEE)),
    ) -> ClaimResponse:
        claim = _get_claim_service(app).reopen_claim(claim_id, current_user.username)
        return ClaimResponse.from_domain(claim)

    @app.post("/claims/{claim_id}/review", response_model=ClaimResponse)
    def review_claim(
        claim_id: str,
        payload: ReviewClaimRequest,
        current_user: User = Depends(_require_user_role(UserRole.MANAGER)),
    ) -> ClaimResponse:
        claim = _get_claim_service(app).review_claim(claim_id, current_user.username, payload.decision)
        return ClaimResponse.from_domain(claim)

    @app.post("/claims/{claim_id}/pay", response_model=ClaimResponse)
    def mark_claim_paid(
        claim_id: str,
        current_user: User = Depends(_require_user_role(UserRole.FINANCE)),
    ) -> ClaimResponse:
        claim = _get_claim_service(app).mark_claim_paid(claim_id, current_user.username)
        return ClaimResponse.from_domain(claim)

    @app.exception_handler(KeyError)
    def handle_not_found(_: Request, __: KeyError) -> JSONResponse:
        return JSONResponse(status_code=status.HTTP_404_NOT_FOUND, content={"detail": "Claim not found."})

    @app.exception_handler(AuthenticationError)
    def handle_authentication_error(_: Request, exc: AuthenticationError) -> JSONResponse:
        return JSONResponse(status_code=status.HTTP_401_UNAUTHORIZED, content={"detail": str(exc)})

    @app.exception_handler(AuthorizationError)
    def handle_authorization_error(_: Request, exc: AuthorizationError) -> JSONResponse:
        return JSONResponse(status_code=status.HTTP_403_FORBIDDEN, content={"detail": str(exc)})

    @app.exception_handler(DuplicateUserError)
    def handle_duplicate_user(_: Request, exc: DuplicateUserError) -> JSONResponse:
        return JSONResponse(status_code=status.HTTP_409_CONFLICT, content={"detail": str(exc)})

    @app.exception_handler(InvalidUserError)
    def handle_invalid_user(_: Request, exc: InvalidUserError) -> JSONResponse:
        return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST, content={"detail": str(exc)})

    @app.exception_handler(UnauthorizedClaimAccessError)
    def handle_unauthorized(_: Request, exc: UnauthorizedClaimAccessError) -> JSONResponse:
        return JSONResponse(status_code=status.HTTP_403_FORBIDDEN, content={"detail": str(exc)})

    @app.exception_handler(ClaimVisibilityError)
    def handle_visibility_error(_: Request, exc: ClaimVisibilityError) -> JSONResponse:
        return JSONResponse(status_code=status.HTTP_403_FORBIDDEN, content={"detail": str(exc)})

    @app.exception_handler(ClaimSubmissionError)
    def handle_submission_error(_: Request, exc: ClaimSubmissionError) -> JSONResponse:
        return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST, content={"detail": str(exc)})

    @app.exception_handler(ClaimNotEditableError)
    def handle_not_editable(_: Request, exc: ClaimNotEditableError) -> JSONResponse:
        return JSONResponse(status_code=status.HTTP_409_CONFLICT, content={"detail": str(exc)})

    @app.exception_handler(ClaimNotSubmittableError)
    def handle_not_submittable(_: Request, exc: ClaimNotSubmittableError) -> JSONResponse:
        return JSONResponse(status_code=status.HTTP_409_CONFLICT, content={"detail": str(exc)})

    @app.exception_handler(ClaimNotReopenableError)
    def handle_not_reopenable(_: Request, exc: ClaimNotReopenableError) -> JSONResponse:
        return JSONResponse(status_code=status.HTTP_409_CONFLICT, content={"detail": str(exc)})

    @app.exception_handler(ClaimNotReviewableError)
    def handle_not_reviewable(_: Request, exc: ClaimNotReviewableError) -> JSONResponse:
        return JSONResponse(status_code=status.HTTP_409_CONFLICT, content={"detail": str(exc)})

    @app.exception_handler(ClaimReviewError)
    def handle_review_error(_: Request, exc: ClaimReviewError) -> JSONResponse:
        return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST, content={"detail": str(exc)})

    @app.exception_handler(ClaimNotPayableError)
    def handle_not_payable(_: Request, exc: ClaimNotPayableError) -> JSONResponse:
        return JSONResponse(status_code=status.HTTP_409_CONFLICT, content={"detail": str(exc)})

    @app.exception_handler(ClaimPaymentError)
    def handle_payment_error(_: Request, exc: ClaimPaymentError) -> JSONResponse:
        return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST, content={"detail": str(exc)})

    return app


def _get_claim_service(app: FastAPI) -> ExpenseClaimService:
    return app.state.claim_service


def _get_user_service(app: FastAPI) -> UserService:
    return app.state.user_service


def _get_session_user(request: Request, *, required: bool) -> User | None:
    username = _extract_username_from_cookie(request.app, request.cookies.get("expense_session"))
    if not username:
        if required:
            raise AuthenticationError("Authentication is required.")
        return None

    user = _get_user_service(request.app).get_user(username)
    if user is None:
        if required:
            raise AuthenticationError("Authentication is required.")
        return None
    return user


def _require_authenticated_user(request: Request) -> User:
    user = _get_session_user(request, required=True)
    assert user is not None
    return user


def _require_admin_user(request: Request) -> User:
    user = _require_authenticated_user(request)
    if user.role != UserRole.ADMIN:
        raise AuthorizationError("Only admins can create users.")
    return user


def _require_claim_user(request: Request) -> User:
    user = _require_authenticated_user(request)
    if user.role not in {UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.FINANCE}:
        raise AuthorizationError("Current user role cannot access claim workflow.")
    return user


def _require_user_role(*allowed_roles: UserRole):
    def dependency(request: Request) -> User:
        user = _require_authenticated_user(request)
        if user.role not in set(allowed_roles):
            raise AuthorizationError("Current user role cannot perform this action.")
        return user

    return dependency


def _to_claim_viewer_role(user_role: UserRole) -> ClaimViewerRole:
    if user_role == UserRole.EMPLOYEE:
        return ClaimViewerRole.EMPLOYEE
    if user_role == UserRole.MANAGER:
        return ClaimViewerRole.MANAGER
    if user_role == UserRole.FINANCE:
        return ClaimViewerRole.FINANCE
    raise AuthorizationError("Current user role cannot access claim workflow.")


def _sign_username(app: FastAPI, username: str) -> str:
    encoded_username = base64.urlsafe_b64encode(username.encode("utf-8")).decode("ascii")
    signature = hmac.new(
        app.state.session_secret.encode("utf-8"),
        encoded_username.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    return f"{encoded_username}.{signature}"


def _extract_username_from_cookie(app: FastAPI, cookie_value: str | None) -> str | None:
    if not cookie_value or "." not in cookie_value:
        return None

    encoded_username, signature = cookie_value.split(".", 1)
    expected_signature = hmac.new(
        app.state.session_secret.encode("utf-8"),
        encoded_username.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    if not hmac.compare_digest(signature, expected_signature):
        return None

    try:
        return base64.urlsafe_b64decode(encoded_username.encode("ascii")).decode("utf-8")
    except Exception:
        return None


app = create_app()
