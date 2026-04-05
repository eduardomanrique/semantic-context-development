# User Story 1 Decisions

Timestamp: 2026-04-05

## User-confirmed scope

- A claim has a single expense entry in v1
- Required fields are title, expense date, amount, category, and description
- Currency is out of scope
- Receipts are out of scope
- After submission, the employee cannot edit the claim
- Seeded demo login with fixed roles is acceptable
- Tech stack is React, Node/Express, and SQLite

## Confirmed test expectations

- employee can create a draft claim with valid required fields
- invalid claim data is rejected by backend validation
- employee can submit a draft claim
- submitted claim transitions to a reviewable state
- submitted claim is no longer editable by the employee
- non-employee users cannot create claims on behalf of others
