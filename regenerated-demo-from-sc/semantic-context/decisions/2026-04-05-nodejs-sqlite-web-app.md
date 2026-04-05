# Decision: Node.js SQLite web app regeneration

## Status

Accepted for the current implementation slice.

This decision supersedes the earlier Python and FastAPI implementation posture while preserving the same business semantics.

## Context

This repository already contains the semantic definition of the expense reimbursement system, including:

- authenticated server-owned identity
- persisted user records
- a small same-process browser UI and backend delivery model
- role-based claim visibility and transitions

The current regeneration task is to recreate the executable application in Node.js without changing those semantics.

## Decision

For the current slice:

- the executable application is a small Node.js web app
- the backend exposes the existing claim behavior through HTTP endpoints
- the same process serves a simple browser-based frontend
- persistence remains database-backed using SQLite
- authenticated sessions remain required for protected flows
- business rules remain authoritative in the application service and persistence layers, not in the frontend

## Rationale

The semantic context already defines the reimbursement behavior, so the stack change is an implementation-posture change rather than a business-rule change.

Using Node.js with SQLite keeps the application small while preserving the persisted, authenticated, full-web-app shape already established in the semantic context.

## Consequences

- executable tests should continue to verify the same lifecycle, visibility, audit, and authorization behavior
- the frontend must remain a thin client over server-enforced rules
- future stack changes must preserve the same corrected-draft, review, payment, and role-visibility semantics
