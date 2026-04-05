# Claim Detail Navigation Fix

Timestamp: 2026-04-05T17:32:00+01:00

## User request

On the claim page, there is no link to get back to the main page.

## Semantic impact identified

- This is a user-visible UI behavior change.
- The return path from claim detail views to the role dashboard should be explicit in Semantic Context so future regenerations preserve it.

## Changes made

- Added a visible "Return to dashboard" link to employee, manager, and finance claim-detail pages.
- Added a small web-layer test to ensure the employee claim-detail page renders that navigation affordance.
