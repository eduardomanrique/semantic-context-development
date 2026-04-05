# Trace For User Story 1

## User story

As an employee, I want to create an expense claim with the relevant expense details and submit it for review, so that I can request reimbursement.

## Expected behaviors

1. An authenticated employee can create a draft claim with all required fields.
2. Invalid claim data is rejected by backend validation.
3. An employee can submit their own draft claim.
4. Submission transitions the claim from `draft` to `submitted`.
5. A submitted claim is no longer editable by the employee.
6. Non-employees cannot create claims on behalf of employees or for themselves.

## Proposed automated tests

- Create a valid draft claim as an employee
- Reject invalid claim payloads
- Submit a draft claim
- Reject editing after submission
- Reject claim creation by a non-employee user

## Implementation areas

- Python web routes for session, claims, validation, and submission
- SQLite schema for users and claims
- Server-rendered employee flow for demo login, claim creation, claim listing, and submission
