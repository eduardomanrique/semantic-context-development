# User Story 1 Foundation Decisions

Date: 2026-04-05

## Product decisions

- A claim has a single expense entry in v1.
- Required fields are title, expense date, amount, category, and description.
- Currency is out of scope in v1.
- Receipts are out of scope in v1.
- After submission, the employee cannot edit the claim.

## Technical decisions

- The first slice uses a React frontend.
- The first slice uses a Node/Express backend.
- The first slice uses SQLite persistence.
- Authentication is implemented as a seeded demo login with fixed roles.
- The application will maintain backend-enforced authorization based on the authenticated demo user rather than trusting employee identity from client input.

## Rationale

These choices keep the application small while still exercising real frontend, backend, persistence, state transition, and authorization behavior.
