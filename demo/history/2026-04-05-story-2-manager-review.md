# Story 2 history

## User story

As a manager, I want to review a submitted expense claim and decide whether it should move forward or not.

## Semantic clarifications accepted for this story

- only managers can review claims
- any manager can review any submitted claim in the current slice
- review outcomes are only `APPROVED` and `REJECTED`
- only claims in `SUBMITTED` can be reviewed
- the manager decision immediately changes the claim status
- after review, the claim becomes read-only for everyone
- managers cannot change their decision later in this story
- no review reason or comment is captured yet

## Implementation actions

- updated the Semantic Context for manager review and terminal review states
- extended the domain model and API with a manager review action
- added frontend controls for manager approval and rejection
- added and ran automated tests for the manager review flow
