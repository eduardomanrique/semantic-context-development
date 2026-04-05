# Story 3 history

## User story

As a finance user, I want to mark an approved expense claim as paid, so that the reimbursement process can be completed.

## Semantic clarifications accepted for this story

- any finance user can mark any approved claim as paid in the current slice
- only claims in `APPROVED` can be marked as paid
- payment changes status directly from `APPROVED` to `PAID`
- after a claim is marked `PAID`, it is read-only for everyone
- payment records who marked the claim as paid and when
- `PAID` is terminal in this story
- reversal or marking a claim unpaid is not supported yet

## Implementation actions

- updated the Semantic Context for finance payment rules and the `PAID` state
- extended the domain model and API with a payment action and payment audit fields
- added frontend controls for finance payment completion
- added and ran automated tests for the payment flow
