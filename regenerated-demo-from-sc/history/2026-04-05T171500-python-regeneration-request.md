# Python Regeneration Request

Timestamp: 2026-04-05T17:15:00+01:00

## User request

Regenerate this project with Python.

## Semantic impact identified

- The existing Semantic Context described a React frontend and Node/Express backend for the first implementation slice.
- The user request changes that technical direction and therefore requires Semantic Context updates before or alongside implementation.

## Decisions made during this task

- Regenerate the application as a Python web application with a server-rendered UI.
- Keep SQLite as the persistence layer.
- Preserve the existing seeded demo login model with backend-enforced role checks.
- Implement the traced behaviors for draft creation, submission, manager review, finance payment, and rejected-claim reopening.
- Keep the Python implementation dependency-free so the project can run with the standard library available in the environment.

## Follow-up expectations

- Automated tests should cover the behaviors traced in `semantic-context/trace/`.
- Any implementation-local behavior introduced to make the Python version concrete should be recorded in Semantic Context when it affects validation or future regeneration.
