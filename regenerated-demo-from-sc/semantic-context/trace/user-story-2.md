# Trace For User Story 2

## User story

As a manager, I want to open submitted expense claims, inspect their details, and make a review decision, so that the claim can either move forward or be rejected according to the review outcome.

## Expected behaviors

1. A manager can list submitted claims.
2. A manager can open a submitted claim and inspect all of its expense details.
3. A manager can approve a submitted claim.
4. A manager can reject a submitted claim.
5. Only a `submitted` claim can be reviewed.
6. Employee users cannot perform manager review actions.
7. Once reviewed, the claim cannot be reviewed again in v1.
8. A review note is optional and may be stored with the decision.

## Proposed automated tests

- Manager can list submitted claims
- Manager can open a submitted claim and inspect details
- Manager can approve a submitted claim
- Manager can reject a submitted claim
- Reject reviewing a non-submitted claim
- Reject manager review actions from employee sessions
- Reject re-review after a decision is already recorded

## Implementation areas

- Python web routes for manager claim queue, claim detail, and review action
- SQLite schema for approved and rejected states plus review metadata
- Server-rendered manager flow for claim inspection and review decisions
