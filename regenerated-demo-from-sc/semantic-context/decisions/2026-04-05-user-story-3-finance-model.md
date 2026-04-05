# User Story 3 Finance Model Decisions

Date: 2026-04-05

## Product decisions

- Finance completion transitions `approved` claims to `paid`.
- Any seeded finance user may mark any approved claim as paid in the small demo scope.
- Payment notes are optional.
- The payment timestamp is recorded automatically when finance marks a claim as paid.
- Once a claim is marked paid, it is locked in v1 with no undo.
- Draft, submitted, and rejected claims cannot be marked as paid.

## Technical decisions

- Finance authorization is enforced by the backend session role, not by frontend state.
- Payment persistence records the finance user identity, the optional payment note, and the paid timestamp.
- The finance UI will show an approved-claims queue and a claim detail panel for marking claims as paid.

## Rationale

This keeps finance completion behavior explicit and auditable while staying small enough for the demo workflow.
