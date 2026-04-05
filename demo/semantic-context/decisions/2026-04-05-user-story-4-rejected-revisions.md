# User Story 4 Rejected Claim Revision Decisions

Date: 2026-04-05

## Product decisions

- The same claim is reopened when an employee corrects a rejected claim.
- Starting the edit transitions the claim from `rejected` to `draft`.
- The employee can edit the reopened draft and resubmit it.
- The previous manager review note remains visible as historical context.
- After resubmission, the claim must go through manager review again.
- Paid claims remain immutable.

## Technical decisions

- Reopening is an explicit backend transition instead of an implicit side effect of form changes.
- Historical manager review notes are preserved as claim review history rather than being overwritten.
- The claim record stores the active workflow state, while a separate review history store preserves prior review cycles for later display.

## Rationale

This keeps the workflow understandable for users and preserves auditability without introducing duplicate claims for each correction cycle.
