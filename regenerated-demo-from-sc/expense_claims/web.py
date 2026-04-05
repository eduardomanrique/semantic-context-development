from __future__ import annotations

import hmac
from hashlib import sha256
from html import escape
from http import cookies
from pathlib import Path
from typing import Callable, Iterable
from urllib.parse import parse_qs

from .services import (
    AppError,
    DB_PATH,
    NotFound,
    PermissionDenied,
    StateConflict,
    User,
    ValidationError,
    create_claim,
    get_claim_detail,
    get_connection,
    get_user_by_id,
    get_user_by_username,
    initialize_database,
    list_approved_claims,
    list_demo_users,
    list_employee_claims,
    list_submitted_claims,
    pay_claim,
    reopen_claim,
    review_claim,
    submit_claim,
    update_claim,
)


SESSION_COOKIE = "expense_claims_session"
SECRET = b"expense-claims-demo-secret"


def sign_user_id(user_id: int) -> str:
    return hmac.new(SECRET, str(user_id).encode("utf-8"), sha256).hexdigest()


def encode_session(user: User) -> str:
    return f"{user.id}:{sign_user_id(user.id)}"


def decode_session(raw_value: str | None) -> int | None:
    if not raw_value:
        return None
    if ":" not in raw_value:
        return None
    raw_user_id, signature = raw_value.split(":", 1)
    if not raw_user_id.isdigit():
        return None
    expected = sign_user_id(int(raw_user_id))
    if not hmac.compare_digest(signature, expected):
        return None
    return int(raw_user_id)


def parse_request_body(environ: dict) -> dict[str, str]:
    length = int(environ.get("CONTENT_LENGTH") or 0)
    body = environ["wsgi.input"].read(length).decode("utf-8") if length else ""
    return {key: values[-1] for key, values in parse_qs(body, keep_blank_values=True).items()}


def request_cookies(environ: dict) -> cookies.SimpleCookie[str]:
    jar = cookies.SimpleCookie()
    jar.load(environ.get("HTTP_COOKIE", ""))
    return jar


def current_user(environ: dict, db_path: Path) -> User | None:
    cookie = request_cookies(environ)
    session_value = cookie[SESSION_COOKIE].value if SESSION_COOKIE in cookie else None
    user_id = decode_session(session_value)
    if not user_id:
        return None
    with get_connection(db_path) as connection:
        return get_user_by_id(connection, user_id)


def text_response(start_response: Callable, status: str, body: str, headers: list[tuple[str, str]] | None = None) -> Iterable[bytes]:
    response_headers = [("Content-Type", "text/html; charset=utf-8")]
    if headers:
        response_headers.extend(headers)
    start_response(status, response_headers)
    return [body.encode("utf-8")]


def redirect(start_response: Callable, location: str, headers: list[tuple[str, str]] | None = None) -> Iterable[bytes]:
    response_headers = [("Location", location)]
    if headers:
        response_headers.extend(headers)
    start_response("303 See Other", response_headers)
    return [b""]


def page(title: str, body: str, user: User | None = None) -> str:
    nav_links = ""
    if user:
        nav_links = f"""
        <div class="nav-actions">
          <span class="role-pill">{escape(user.role)}</span>
          <span class="user-name">{escape(user.full_name)}</span>
          <form method="post" action="/logout">
            <button class="secondary" type="submit">Log out</button>
          </form>
        </div>
        """

    return f"""<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{escape(title)}</title>
    <link rel="stylesheet" href="/static/styles.css">
  </head>
  <body>
    <div class="backdrop"></div>
    <main class="shell">
      <header class="topbar">
        <div>
          <p class="eyebrow">Semantic Context Demo</p>
          <h1>{escape(title)}</h1>
        </div>
        {nav_links}
      </header>
      {body}
    </main>
  </body>
</html>
"""


def render_login(db_path: Path) -> str:
    with get_connection(db_path) as connection:
        users = list_demo_users(connection)
    cards = "".join(
        f"""
        <form class="card user-card" method="post" action="/login">
          <input type="hidden" name="username" value="{escape(user.username)}">
          <p class="eyebrow">{escape(user.role)}</p>
          <h2>{escape(user.full_name)}</h2>
          <p>@{escape(user.username)}</p>
          <button type="submit">Continue as {escape(user.full_name.split()[0])}</button>
        </form>
        """
        for user in users
    )
    body = f"""
    <section class="hero card">
      <p class="eyebrow">Expense Reimbursement Application</p>
      <h2>Seeded demo login</h2>
      <p class="lede">Choose a user to exercise employee drafting, manager review, and finance payment flows.</p>
    </section>
    <section class="grid">{cards}</section>
    """
    return page("Expense Claims", body)


def claim_table(claims: list[dict], base_path: str) -> str:
    if not claims:
        return '<div class="card empty-state"><p>No claims in this queue.</p></div>'
    rows = "".join(
        f"""
        <tr>
          <td><a href="{base_path}/{claim['id']}">#{claim['id']} {escape(claim['title'])}</a></td>
          <td>{escape(claim['employee_name'])}</td>
          <td>{escape(claim['expense_date'])}</td>
          <td>{escape(claim['category'])}</td>
          <td>${escape(claim['amount'])}</td>
          <td><span class="status status-{escape(claim['status'])}">{escape(claim['status'])}</span></td>
        </tr>
        """
        for claim in claims
    )
    return f"""
    <div class="card">
      <table>
        <thead>
          <tr>
            <th>Claim</th>
            <th>Employee</th>
            <th>Date</th>
            <th>Category</th>
            <th>Amount</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
    </div>
    """


def claim_form(action: str, claim: dict | None = None, submit_label: str = "Save draft") -> str:
    claim = claim or {}
    return f"""
    <form class="card form-card" method="post" action="{action}">
      <label>Title<input name="title" value="{escape(claim.get('title', ''))}" required></label>
      <label>Expense date<input type="date" name="expense_date" value="{escape(claim.get('expense_date', ''))}" required></label>
      <label>Amount<input type="number" min="0.01" step="0.01" name="amount" value="{escape(claim.get('amount', ''))}" required></label>
      <label>Category<input name="category" value="{escape(claim.get('category', ''))}" required></label>
      <label>Description<textarea name="description" rows="5" required>{escape(claim.get('description', ''))}</textarea></label>
      <button type="submit">{escape(submit_label)}</button>
    </form>
    """


def render_employee_dashboard(db_path: Path, user: User) -> str:
    with get_connection(db_path) as connection:
        claims = list_employee_claims(connection, user)
    body = f"""
    <section class="split">
      <div>
        <div class="card intro">
          <p class="eyebrow">Employee flow</p>
          <h2>Create a new expense claim</h2>
          <p>Drafts stay editable until you submit them for manager review.</p>
        </div>
        {claim_form('/claims', submit_label='Create draft')}
      </div>
      <div>
        <div class="card intro">
          <p class="eyebrow">Your claims</p>
          <h2>Owned by {escape(user.full_name)}</h2>
        </div>
        {claim_table(claims, '/claims')}
      </div>
    </section>
    """
    return page("Employee Dashboard", body, user=user)


def render_manager_dashboard(db_path: Path, user: User) -> str:
    with get_connection(db_path) as connection:
        claims = list_submitted_claims(connection, user)
    body = f"""
    <section class="card intro">
      <p class="eyebrow">Manager queue</p>
      <h2>Submitted claims awaiting a decision</h2>
      <p>Open a claim to approve or reject it with an optional review note.</p>
    </section>
    {claim_table(claims, '/manager/claims')}
    """
    return page("Manager Dashboard", body, user=user)


def render_finance_dashboard(db_path: Path, user: User) -> str:
    with get_connection(db_path) as connection:
        claims = list_approved_claims(connection, user)
    body = f"""
    <section class="card intro">
      <p class="eyebrow">Finance queue</p>
      <h2>Approved claims awaiting payment</h2>
      <p>Open a claim to complete reimbursement and record the payment note.</p>
    </section>
    {claim_table(claims, '/finance/claims')}
    """
    return page("Finance Dashboard", body, user=user)


def definition_row(label: str, value: str) -> str:
    return f"<div><dt>{escape(label)}</dt><dd>{escape(value)}</dd></div>"


def detail_back_link() -> str:
    return '<p class="back-link"><a href="/">Return to dashboard</a></p>'


def review_history(claim: dict) -> str:
    reviews = claim["reviews"]
    if not reviews:
        return '<div class="card empty-state"><p>No review history recorded yet.</p></div>'
    items = "".join(
        f"""
        <article class="timeline-item">
          <p><strong>{escape(review['reviewer_name'])}</strong> decided <strong>{escape(review['decision'])}</strong></p>
          <p>{escape(review['reviewed_at'])}</p>
          <p>{escape(review['note'] or 'No note provided.')}</p>
        </article>
        """
        for review in reviews
    )
    return f'<section class="card timeline">{items}</section>'


def render_employee_claim_detail(db_path: Path, user: User, claim_id: int) -> str:
    with get_connection(db_path) as connection:
        claim = get_claim_detail(connection, user, claim_id)

    controls = ""
    if claim["status"] == "draft":
        controls = f"""
        {claim_form(f"/claims/{claim_id}/edit", claim, submit_label='Update draft')}
        <form method="post" action="/claims/{claim_id}/submit">
          <button type="submit">Submit for review</button>
        </form>
        """
    elif claim["status"] == "rejected":
        controls = f"""
        <div class="card">
          <p>This claim was rejected and can be reopened by its owner.</p>
          <form method="post" action="/claims/{claim_id}/reopen">
            <button type="submit">Reopen to draft</button>
          </form>
        </div>
        """
    else:
        controls = '<div class="card"><p>This claim is locked for employee editing in its current state.</p></div>'

    payment = ""
    if claim["payment"]:
        payment = f"""
        <section class="card">
          <p class="eyebrow">Payment</p>
          <h2>Reimbursement completed</h2>
          <p>{escape(claim['payment']['payer_name'])} marked this claim paid at {escape(claim['payment']['paid_at'])}.</p>
          <p>{escape(claim['payment']['note'] or 'No payment note provided.')}</p>
        </section>
        """

    body = f"""
    {detail_back_link()}
    <section class="split detail-layout">
      <div>
        <section class="card">
          <p class="eyebrow">Claim #{claim['id']}</p>
          <h2>{escape(claim['title'])}</h2>
          <dl class="details">
            {definition_row('Status', claim['status'])}
            {definition_row('Expense date', claim['expense_date'])}
            {definition_row('Amount', f"${claim['amount']}")}
            {definition_row('Category', claim['category'])}
            {definition_row('Description', claim['description'])}
          </dl>
        </section>
        {controls}
        {payment}
      </div>
      <div>
        <section class="card">
          <p class="eyebrow">Review history</p>
          <h2>Preserved across reopen and resubmit</h2>
        </section>
        {review_history(claim)}
      </div>
    </section>
    """
    return page(f"Claim #{claim_id}", body, user=user)


def render_manager_claim_detail(db_path: Path, user: User, claim_id: int) -> str:
    with get_connection(db_path) as connection:
        claim = get_claim_detail(connection, user, claim_id)
    body = f"""
    {detail_back_link()}
    <section class="split detail-layout">
      <section class="card">
        <p class="eyebrow">Submitted claim</p>
        <h2>{escape(claim['title'])}</h2>
        <dl class="details">
          {definition_row('Employee', claim['employee_name'])}
          {definition_row('Expense date', claim['expense_date'])}
          {definition_row('Amount', f"${claim['amount']}")}
          {definition_row('Category', claim['category'])}
          {definition_row('Description', claim['description'])}
        </dl>
      </section>
      <form class="card form-card" method="post" action="/manager/claims/{claim_id}/review">
        <label>Decision
          <select name="decision">
            <option value="approve">Approve</option>
            <option value="reject">Reject</option>
          </select>
        </label>
        <label>Review note<textarea name="note" rows="5"></textarea></label>
        <button type="submit">Record review</button>
      </form>
    </section>
    """
    return page(f"Review Claim #{claim_id}", body, user=user)


def render_finance_claim_detail(db_path: Path, user: User, claim_id: int) -> str:
    with get_connection(db_path) as connection:
        claim = get_claim_detail(connection, user, claim_id)
    body = f"""
    {detail_back_link()}
    <section class="split detail-layout">
      <section class="card">
        <p class="eyebrow">Approved claim</p>
        <h2>{escape(claim['title'])}</h2>
        <dl class="details">
          {definition_row('Employee', claim['employee_name'])}
          {definition_row('Expense date', claim['expense_date'])}
          {definition_row('Amount', f"${claim['amount']}")}
          {definition_row('Category', claim['category'])}
          {definition_row('Description', claim['description'])}
        </dl>
      </section>
      <form class="card form-card" method="post" action="/finance/claims/{claim_id}/pay">
        <label>Payment note<textarea name="note" rows="5"></textarea></label>
        <button type="submit">Mark as paid</button>
      </form>
    </section>
    """
    return page(f"Pay Claim #{claim_id}", body, user=user)


def error_page(user: User | None, title: str, message: str) -> str:
    body = f"""
    <section class="card error-card">
      <p class="eyebrow">Request error</p>
      <h2>{escape(title)}</h2>
      <p>{escape(message)}</p>
      <p><a href="/">Return to dashboard</a></p>
    </section>
    """
    return page(title, body, user=user)


def create_app(db_path: Path | str = DB_PATH):
    resolved_db_path = Path(db_path)
    with get_connection(resolved_db_path) as connection:
        initialize_database(connection)

    def app(environ: dict, start_response: Callable):
        path = environ.get("PATH_INFO", "/")
        method = environ.get("REQUEST_METHOD", "GET").upper()
        user = current_user(environ, resolved_db_path)

        try:
            if path == "/static/styles.css" and method == "GET":
                css = Path("static/styles.css").read_text(encoding="utf-8")
                start_response("200 OK", [("Content-Type", "text/css; charset=utf-8")])
                return [css.encode("utf-8")]

            if path == "/" and method == "GET":
                if user is None:
                    return text_response(start_response, "200 OK", render_login(resolved_db_path))
                if user.role == "employee":
                    return text_response(start_response, "200 OK", render_employee_dashboard(resolved_db_path, user))
                if user.role == "manager":
                    return text_response(start_response, "200 OK", render_manager_dashboard(resolved_db_path, user))
                return text_response(start_response, "200 OK", render_finance_dashboard(resolved_db_path, user))

            if path == "/login" and method == "POST":
                form = parse_request_body(environ)
                with get_connection(resolved_db_path) as connection:
                    selected_user = get_user_by_username(connection, form.get("username", ""))
                if selected_user is None:
                    return text_response(start_response, "400 Bad Request", error_page(None, "Invalid login", "Unknown demo user."))
                header = ("Set-Cookie", f"{SESSION_COOKIE}={encode_session(selected_user)}; Path=/; HttpOnly; SameSite=Lax")
                return redirect(start_response, "/", headers=[header])

            if path == "/logout" and method == "POST":
                header = ("Set-Cookie", f"{SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax")
                return redirect(start_response, "/", headers=[header])

            if user is None:
                return redirect(start_response, "/")

            if path == "/claims" and method == "POST":
                form = parse_request_body(environ)
                with get_connection(resolved_db_path) as connection:
                    claim_id = create_claim(connection, user, form)
                return redirect(start_response, f"/claims/{claim_id}")

            if path.startswith("/claims/"):
                parts = [part for part in path.split("/") if part]
                if len(parts) == 2 and method == "GET":
                    return text_response(start_response, "200 OK", render_employee_claim_detail(resolved_db_path, user, int(parts[1])))
                if len(parts) == 3 and method == "POST":
                    claim_id = int(parts[1])
                    action = parts[2]
                    form = parse_request_body(environ)
                    with get_connection(resolved_db_path) as connection:
                        if action == "edit":
                            update_claim(connection, user, claim_id, form)
                        elif action == "submit":
                            submit_claim(connection, user, claim_id)
                        elif action == "reopen":
                            reopen_claim(connection, user, claim_id)
                        else:
                            raise NotFound("Unknown employee claim action.")
                    return redirect(start_response, f"/claims/{claim_id}")

            if path == "/manager/claims" and method == "GET":
                return text_response(start_response, "200 OK", render_manager_dashboard(resolved_db_path, user))

            if path.startswith("/manager/claims/"):
                parts = [part for part in path.split("/") if part]
                claim_id = int(parts[2])
                if len(parts) == 3 and method == "GET":
                    return text_response(start_response, "200 OK", render_manager_claim_detail(resolved_db_path, user, claim_id))
                if len(parts) == 4 and parts[3] == "review" and method == "POST":
                    form = parse_request_body(environ)
                    with get_connection(resolved_db_path) as connection:
                        review_claim(connection, user, claim_id, form.get("decision", ""), form.get("note", ""))
                    return redirect(start_response, "/manager/claims")

            if path == "/finance/claims" and method == "GET":
                return text_response(start_response, "200 OK", render_finance_dashboard(resolved_db_path, user))

            if path.startswith("/finance/claims/"):
                parts = [part for part in path.split("/") if part]
                claim_id = int(parts[2])
                if len(parts) == 3 and method == "GET":
                    return text_response(start_response, "200 OK", render_finance_claim_detail(resolved_db_path, user, claim_id))
                if len(parts) == 4 and parts[3] == "pay" and method == "POST":
                    form = parse_request_body(environ)
                    with get_connection(resolved_db_path) as connection:
                        pay_claim(connection, user, claim_id, form.get("note", ""))
                    return redirect(start_response, "/finance/claims")

            return text_response(start_response, "404 Not Found", error_page(user, "Not found", "The requested page does not exist."))
        except ValidationError as exc:
            return text_response(start_response, "400 Bad Request", error_page(user, "Validation failed", "; ".join(exc.errors.values())))
        except PermissionDenied as exc:
            return text_response(start_response, "403 Forbidden", error_page(user, "Permission denied", str(exc)))
        except StateConflict as exc:
            return text_response(start_response, "409 Conflict", error_page(user, "Invalid workflow transition", str(exc)))
        except NotFound as exc:
            return text_response(start_response, "404 Not Found", error_page(user, "Not found", str(exc)))

    return app
