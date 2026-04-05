# User Story 2 Review Model Decisions

Date: 2026-04-05

## Product decisions

- Manager review has exactly two outcomes in v1: approve and reject.
- Review transitions are `submitted` to `approved` and `submitted` to `rejected`.
- Rejection is terminal in v1.
- Any seeded manager can review any submitted claim in the small demo scope.
- Review notes are optional.
- Once a manager decides, that decision is locked in v1.

## Technical decisions

- Manager authorization is enforced by the backend session role, not by frontend state.
- Review persistence records the reviewer identity, the optional note, and the review timestamp.
- The manager UI will show a submitted-claims queue and a claim detail panel for review actions.

## Rationale

This keeps manager review behavior small and explicit while preserving enough audit detail for later finance flow and future stories.
