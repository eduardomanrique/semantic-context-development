# Decision: Rejected claims become corrected drafts

## Context

The previous rejection-reopen decision allowed a rejected claim to be reopened, edited, and submitted again for another review cycle.

The revised business rule is narrower:

- a rejected claim may be edited
- a rejected claim may not be resubmitted
- after reopen, it must remain only as a corrected draft

## Decision

For the current slice, rejected claims behave as follows:

- `REJECTED` is still non-terminal because the owner may reopen it
- only the claim owner may reopen a rejected claim
- reopening is allowed only from `REJECTED`
- reopening changes the claim status from `REJECTED` to `DRAFT`
- a reopened claim becomes a corrected draft
- a corrected draft may be edited under the normal owner-only draft editing rules
- a corrected draft may be saved
- a corrected draft may not be submitted again in the current slice
- manager review still applies only to `SUBMITTED` claims
- `APPROVED` remains read-only in the current slice
- `PAID` remains terminal in the current slice

## Structural impact

This change means not every `DRAFT` has the same capabilities.

The system must preserve whether a draft is:

- an initial draft that may still be submitted
- a corrected draft created by reopening a rejected claim, which may not be submitted

That distinction must be available to the implementation and to the UI so submission controls are not shown for an ineligible corrected draft.

## Audit impact

The implementation must preserve audit history for:

- submission events
- manager review events
- reopen events
- payment events

Reopening may clear current-cycle review fields, but it must not erase the fact that the claim was previously rejected.
