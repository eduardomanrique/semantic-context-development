# Decision: Rejected claims can be reopened

This decision was later revised by [2026-04-05-rejected-claims-become-corrected-drafts.md](/Users/eduardokmanrique/Work/semantic-context-development/demo/semantic-context/decisions/2026-04-05-rejected-claims-become-corrected-drafts.md).

## Context

The previous lifecycle treated `REJECTED` as terminal and fully read-only.

The requested business change is that the owner of a rejected claim may reopen it, edit it, and submit it again for another review cycle.

## Decision

For the current slice, rejected claims behave as follows:

- `REJECTED` is no longer terminal
- only the claim owner may reopen a rejected claim
- reopening is allowed only from `REJECTED`
- reopening changes the claim status from `REJECTED` to `DRAFT`
- once reopened, the owner may edit the claim under the normal draft rules
- once reopened, the owner may submit the claim again under the normal submission rules
- manager review still applies only to `SUBMITTED` claims
- `APPROVED` remains read-only in the current slice
- `PAID` remains terminal in the current slice

## Audit impact

Allowing reopen introduces multiple submission and decision cycles for the same claim.

The implementation must therefore preserve audit history for:

- submission events
- manager review events
- reopen events
- payment events

Current-cycle fields such as current status and active reviewer may change during reopen, but prior lifecycle events must remain available for audit and future regeneration.

## Rationale

This change supports a realistic reimbursement correction flow without introducing a separate `RETURNED` state yet.

Returning the claim to `DRAFT` keeps the editing and submission semantics already established, while preserving audit history avoids semantic loss across multiple review cycles.
