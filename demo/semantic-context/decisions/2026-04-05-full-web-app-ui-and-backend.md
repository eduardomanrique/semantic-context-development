# Decision: Initial full web app shape

## Status

Accepted for the current implementation slice.

The full-web-app delivery shape remains active.
Its original in-memory implementation note was later superseded by [2026-04-05-authenticated-database-backed-app.md](/Users/eduardokmanrique/Work/semantic-context-development/demo/semantic-context/decisions/2026-04-05-authenticated-database-backed-app.md).

## Decision

The initial executable application is a small full web application composed of:

- a FastAPI backend
- a simple frontend served by the same application
- process-local in-memory persistence

This means:

- claim behavior is available through HTTP endpoints for programmatic access
- the same behavior is available through a browser UI for human interaction
- the frontend does not own claim rules; it only collects input and renders backend state
- no database, background jobs, or external integrations are part of the current slice

## Rationale

The user requested a minimal full web app structure with backend, frontend, and tests while preserving the established business behavior.

Serving a small frontend from the same FastAPI application keeps the delivery model simple and preserves a clean boundary where domain logic remains authoritative.

## Consequences

- tests should verify both API behavior and delivery of the UI shell
- later frontend changes must preserve the same draft and submission semantics already defined in the Semantic Context
- later persistence changes must not alter the meaning of `DRAFT`, `SUBMITTED`, owner-only editing, or submission validation
