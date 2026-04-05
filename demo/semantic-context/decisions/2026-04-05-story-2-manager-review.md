# Decision: Story 2 manager review

## Status

Accepted for the current product slice.

The manager-review permissions and decision outcomes remain active.
The original terminal-rejection rule was later revised by [2026-04-05-rejected-claims-can-be-reopened.md](/Users/eduardokmanrique/Work/semantic-context-development/demo/semantic-context/decisions/2026-04-05-rejected-claims-can-be-reopened.md).

## Decision

For story 2, submitted claims may be reviewed by managers under the following rules:

- only managers may review claims
- any manager may review any submitted claim in the current slice
- managers may review only claims in `SUBMITTED`
- review outcomes are only `APPROVED` and `REJECTED`
- the manager decision immediately changes the claim status
- an approved claim becomes read-only for everyone in the current slice
- a rejected claim remains read-only until its owner reopens it
- manager decisions cannot be changed later in this story
- no review reason or comment is captured yet

## Rationale

This story extends the claim lifecycle beyond employee submission without introducing multi-stage approvals, comments, or return flows.

It keeps the review model narrow and explicit enough to implement without guessing later approval semantics.
