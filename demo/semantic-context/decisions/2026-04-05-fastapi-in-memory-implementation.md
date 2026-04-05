# Decision: Initial web application shape

## Status

Accepted for the current implementation slice.

This initial delivery decision was later superseded for persistence and authentication by [2026-04-05-authenticated-database-backed-app.md](/Users/eduardokmanrique/Work/semantic-context-development/demo/semantic-context/decisions/2026-04-05-authenticated-database-backed-app.md).

## Decision

The initial executable application is a small Python web application using FastAPI with in-memory persistence.

This means:

- claim behavior is exposed through HTTP endpoints
- persistence exists only for the lifetime of the running process
- no database, background jobs, or external integrations are part of the current slice
- business rules remain defined by the domain model rather than by transport-specific handlers

## Rationale

The user requested evolution from a standalone class into a minimal web application while preserving the established claim behavior.

FastAPI provides a lightweight way to expose the behavior and test it at endpoint level without prematurely committing to a database or broader architecture.

## Consequences

- tests should verify behavior through HTTP endpoints as well as the underlying business rules where helpful
- the application is suitable for local development and semantic validation, not for durable storage
- later persistence changes must preserve the same business semantics for `DRAFT` editing and `SUBMITTED` locking
