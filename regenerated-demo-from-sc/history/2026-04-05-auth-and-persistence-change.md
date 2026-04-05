# 2026-04-05 auth and persistence change

## Request

- replace in-memory persistence with real database persistence
- add user registration and login
- introduce a default admin user with credentials `admin` / `admin`
- only the admin can create new users
- persisted data should survive application restarts

## Clarifications

- there is no self-service signup
- registration means admin-only user creation
- each authenticated user has exactly one role from `ADMIN`, `EMPLOYEE`, `MANAGER`, or `FINANCE`
- authenticated username becomes the canonical identity used by the claim workflow

## Semantic impact identified

- protected claim flows can no longer rely on explicit viewer or actor identifiers from the client
- authorization must be enforced from the authenticated server-side user context
- `ADMIN` becomes a new role that is distinct from the claim workflow roles in the current slice
- persistence must move from process-local memory to a durable database model
