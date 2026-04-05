# Python Regeneration Decisions

Date: 2026-04-05

## Product decisions

- Category values are free-form text in v1.
- Amount entry uses a positive decimal value with up to two fractional digits.
- The regenerated demo presents a role-specific web dashboard for employees, managers, and finance users.

## Technical decisions

- The regenerated application uses Python 3 with a standard-library WSGI web application instead of the earlier React and Node/Express stack.
- The frontend is server-rendered HTML and CSS served by the Python application.
- SQLite remains the persistence layer.
- Authentication remains a seeded demo login with backend-enforced role authorization.
- Session state is stored in an HMAC-signed cookie containing the selected demo user identity.
- Automated verification uses Python `unittest` so the project does not depend on external test packages.

## Rationale

These choices satisfy the user request to regenerate the project with Python while preserving the existing product semantics, keeping the stack small, and avoiding dependency installation in the current environment.
