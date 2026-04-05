# Story 4 history

## User story

As a user, I want to view a list of expense claims, so that I can see existing claims and their current status.

## Semantic clarifications accepted for this story

- employees can see only their own claims
- managers can see all claims
- finance users can see all claims
- each list item shows claim id, owner, description, amount, category, and status
- lists are ordered newest first
- no filtering is included in this story
- the same visibility rules also apply to direct claim viewing by id
- until authentication exists, viewer role and user id are passed explicitly to list and detail reads

## Implementation actions

- updated the Semantic Context for claim listing, visibility scope, and ordering
- added a role-scoped claim list endpoint and aligned claim detail access with the same visibility rules
- added stable creation and submission timestamps to support ordered listing and better lifecycle alignment
- extended the frontend with current-user context inputs and a visible-claims list
- added and ran automated tests for listing, ordering, and read visibility
