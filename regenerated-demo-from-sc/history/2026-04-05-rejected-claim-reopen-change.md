# 2026-04-05 rejected claim reopen change

## Request

Business rule change:

- rejected claims should no longer be terminal
- the owner of a rejected claim should be allowed to reopen it, edit it, and submit it again for review
- validate the semantic impact before implementation

## Semantic impact identified

- the existing lifecycle and invariants treated `REJECTED` as terminal and fully read-only
- the change introduced a new owner-only transition from `REJECTED` to `DRAFT`
- the change also introduced repeated submission and review cycles for the same claim
- preserving audit history became more important because current-cycle fields alone are not enough after reopen and resubmission

## Resolution

- updated the Semantic Context to make rejected claims reopenable by their owner
- kept manager review limited to `SUBMITTED`
- kept `APPROVED` read-only and `PAID` terminal
- implemented a reopen endpoint and employee UI action
- added lifecycle audit events in the domain model to preserve submission, review, reopen, and payment history across cycles
