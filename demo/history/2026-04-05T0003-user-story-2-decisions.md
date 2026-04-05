# User Story 2 Decisions

Timestamp: 2026-04-05

## User-confirmed scope

- Review outcomes are approve and reject
- Resulting states are `submitted` to `approved` and `submitted` to `rejected`
- Rejection is terminal in v1
- Any seeded manager can review any submitted claim
- Review notes are optional
- Once a manager decides, the decision is locked in v1

## Confirmed test expectations

- manager can list submitted claims
- manager can open a submitted claim and inspect all expense details
- manager can approve a submitted claim
- manager can reject a submitted claim
- only `submitted` claims can be reviewed
- employee users cannot perform manager review actions
- once reviewed, the claim cannot be reviewed again in v1
