# Role-focused UX refactor

## User request

- improve the UX because the current page is too crowded
- keep the current business behavior unchanged
- make the app feel more like a normal product flow instead of an admin playground
- separate employee, manager, and finance experiences
- hide irrelevant actions for the current role or claim status
- make claim lists easier to scan
- make read-only claim details cleaner and less form-heavy

## Semantic outcome

- business behavior did not change
- the frontend interaction model changed to role-focused workflows
- the UI now derives actions from current role and current claim status instead of exposing all controls together

## Implementation actions

- updated the Semantic Context with a role-focused frontend decision
- replaced the single mixed-control screen with role tabs, role-specific claim queues, and a cleaner detail view
- removed separate actor, manager, and finance id controls from the main claim workspace in favor of current-user context
- kept the backend API and business rules unchanged
- ran the full automated test suite successfully
