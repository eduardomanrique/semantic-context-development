# Decision: Role-focused UX structure

## Status

Accepted for the current implementation slice.

## Decision

The frontend should present the system through role-focused workflows instead of a single screen that mixes employee, manager, and finance actions together.

This means:

- employees primarily see claim creation, their own claim list, and claim details
- managers primarily see submitted claims requiring review, claim details, and approve or reject actions only when relevant
- finance users primarily see approved claims ready for payment, claim details, and payment actions only when relevant
- actions not relevant to the current role or current claim status are hidden rather than merely disabled whenever practical
- read-only claims should render as clean summaries rather than as form-heavy editing layouts

## Rationale

The existing frontend exposed too many responsibilities on one screen and felt like an internal control panel instead of a product workflow.

Separating the interaction model by role improves clarity without changing business semantics.

## Consequences

- the frontend must remain a thin client over the existing backend rules
- role-focused views should respect the authenticated user role supplied by the backend
- authenticated identity changes the session shell, but not the high-level role-oriented structure
