# Trace For User Story 3

## User story

As a finance user, I want to mark an approved claim as paid, so that the reimbursement workflow can be completed.

## Expected behaviors

1. A finance user can list approved claims waiting for payment.
2. A finance user can open an approved claim and inspect all of its details.
3. A finance user can mark an approved claim as paid.
4. Only an `approved` claim can be marked as paid.
5. Non-finance users cannot perform finance payment actions.
6. Once paid, the claim cannot be marked paid again in v1.
7. A payment note is optional and may be stored with the payment action.
8. The paid timestamp is recorded automatically.

## Proposed automated tests

- Finance user can list approved claims
- Finance user can open an approved claim and inspect details
- Finance user can mark an approved claim as paid
- Reject payment for non-approved claims
- Reject finance payment actions from non-finance sessions
- Reject paying an already paid claim

## Implementation areas

- Backend API for finance claim queue, claim detail, and payment action
- SQLite schema for paid state plus payment metadata
- Frontend finance flow for approved-claim inspection and payment completion
