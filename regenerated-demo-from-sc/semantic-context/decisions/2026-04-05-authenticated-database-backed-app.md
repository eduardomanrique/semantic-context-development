# Decision: Authenticated database-backed app

## Context

The earlier implementation used in-memory persistence and explicit actor or viewer identifiers supplied by the client.

The new requirements are:

- persisted data must survive application restarts
- users must authenticate
- there is no self-service signup
- only the admin may create users
- the system must seed a default admin user with username `admin` and password `admin`
- authenticated username becomes the canonical identity used by protected claim flows

## Decision

For the current slice:

- persistence is database-backed rather than in-memory
- protected flows require an authenticated session
- the system supports exactly one role per user: `ADMIN`, `EMPLOYEE`, `MANAGER`, or `FINANCE`
- authenticated username replaces explicit actor and viewer identifiers in protected claim flows
- only `ADMIN` users may create new users
- there is no self-service registration
- the system seeds a default admin user with username `admin` and password `admin`
- `ADMIN` is a user-management role only in the current slice and does not participate in claim-state transitions

## Rationale

This keeps the current claim semantics intact while moving identity and authorization to the server boundary.

Using authenticated usernames as canonical actor identifiers also removes the previous ambiguity where a client could claim any actor identity in a protected request.
