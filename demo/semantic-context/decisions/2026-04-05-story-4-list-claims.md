# Decision: Story 4 claim listing visibility

## Status

Accepted for the current product slice.

The visibility rules remain active.
The earlier explicit viewer-context implementation note was later replaced by [2026-04-05-authenticated-database-backed-app.md](/Users/eduardokmanrique/Work/semantic-context-development/demo/semantic-context/decisions/2026-04-05-authenticated-database-backed-app.md).

## Decision

For story 4, users may list and view claims under the following rules:

- employees may list and view only their own claims
- managers may list and view all claims
- finance users may list and view all claims
- list items show claim id, owner, description, amount, category, and status
- claim lists are ordered with newest claims first
- no filtering is included in this story

## Rationale

This story introduces user-visible navigation of existing claims without broadening the current role model beyond employees, managers, and finance users.

The explicit visibility rules prevent the current slice from exposing all claims to employees.
