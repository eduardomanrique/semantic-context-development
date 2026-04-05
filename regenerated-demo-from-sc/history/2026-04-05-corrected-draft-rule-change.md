# 2026-04-05 corrected draft rule change

## Request

- a rejected claim may be edited
- a rejected claim cannot be resubmitted
- after reopen, it must remain only as a corrected draft

## Semantic impact identified

- the immediately prior semantic revision allowed rejected claims to be reopened, edited, and resubmitted
- the new rule removes repeated review cycles for a single rejected claim
- the new rule introduces a non-submittable kind of `DRAFT`
- the implementation and UI need a way to distinguish an initial draft from a corrected draft

## Resolution

- revised the Semantic Context so reopen returns a rejected claim to `DRAFT` only as a corrected draft
- preserved owner-only editing after reopen
- blocked further submission from corrected drafts
- kept manager review limited to the original `SUBMITTED` phase
