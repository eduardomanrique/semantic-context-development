# FastAPI web app evolution

## User request

- evolve the current implementation into a small Python web application
- use FastAPI
- use in-memory persistence for now
- preserve the established business behavior
- move from a standalone class into a minimal web app structure with endpoints and tests

## Semantic outcome

- the claim behavior did not change
- the implementation form changed to a FastAPI web application with process-local in-memory persistence
- business rules remain owned by the domain model and are exposed through HTTP endpoints

## Implementation actions

- created a small application structure with domain, service, repository, API schema, and FastAPI app modules
- added HTTP endpoints for health, claim creation, draft update, claim retrieval, and claim submission
- converted tests to endpoint-level FastAPI tests
- added a local `requirements.txt` for the current dependency set
- verified the endpoint suite in the project virtual environment
