# Decision: Story 3 finance payment completion

## Status

Accepted for the current product slice.

## Decision

For story 3, approved claims may be marked as paid under the following rules:

- any finance user may mark any approved claim as paid in the current slice
- only claims in `APPROVED` may be marked as paid
- payment changes the claim status directly from `APPROVED` to `PAID`
- once paid, the claim becomes read-only for everyone
- payment records which finance user marked the claim as paid and when
- `PAID` is terminal in this story
- reversal or marking a claim unpaid is not supported yet

## Rationale

This story completes the current reimbursement flow without introducing payment queues, failures, or reversals.

It preserves a narrow and explicit payment model while still capturing the minimum audit data required for the paid outcome.
