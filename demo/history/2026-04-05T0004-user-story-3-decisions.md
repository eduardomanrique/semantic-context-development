# User Story 3 Decisions

Timestamp: 2026-04-05

## User-confirmed scope

- Resulting state is `approved` to `paid`
- Any seeded finance user can mark any approved claim as paid
- Payment note is optional
- Payment timestamp is recorded automatically
- Once a claim is marked paid, it is locked in v1 with no undo
- Only approved claims can be marked paid
- Draft, submitted, and rejected claims cannot be marked paid

## Confirmed test expectations

- finance can list approved claims waiting for payment
- finance can open an approved claim and inspect details
- finance can mark an approved claim as paid
- only approved claims can be marked paid
- non-finance users cannot perform finance payment actions
- once paid, the claim cannot be marked paid again in v1
