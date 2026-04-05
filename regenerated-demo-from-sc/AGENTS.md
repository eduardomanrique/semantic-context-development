

# AGENTS.md

This file defines the base operational standard for a target repository that adopts **Semantic Context Development (SCD)**.

It is not the living semantic source of the system itself. It defines the stable agent behavior standard that a project should adopt when using SCD as its development method.

## Core rules

1. Treat the Semantic Context as the primary source of truth for system meaning.
2. Do not consider a task complete if the Semantic Context and implementation are semantically out of sync.
3. Ensure every expected test behavior is explicitly described in, or validly derivable from, the Semantic Context.
4. Preserve all semantic detail required to answer project questions, surface security concerns, and support behaviorally compatible regeneration.
5. Treat this file as the stable operational method; treat the Semantic Context as the living project artifact.

## Required project structure

When initializing or operating a target project that adopts SCD, the agent should ensure that the target repository contains the following structure, creating it when appropriate:

- `semantic-context/` — the canonical semantic memory of the project; this is the primary source of truth for system meaning.
- `semantic-context/vision.md` — the high-level purpose and semantic scope of the system.
- `semantic-context/domains/` — domain-oriented semantic definitions, such as business areas, entities, and core concepts.
- `semantic-context/flows/` — system flows, states, transitions, and exceptional paths.
- `semantic-context/invariants/` — rules and constraints that must always hold.
- `semantic-context/decisions/` — semantic decisions and rationale, especially when behavior depends on interpretation, trade-offs, or autonomous model choices.
- `semantic-context/incidents/` — incidents, bugs, corrections, and semantic discoveries that changed the understanding of the system.
- `semantic-context/open-questions/` — unresolved ambiguities that still require clarification.
- `semantic-context/trace/` — traceability links between semantic meaning, tests, UI, APIs, and implementation areas.
- `history/` — raw interaction history, such as task requests, clarifications, and discussion logs, retained for audit and historical reference.

If this structure does not yet exist, the agent should create it or propose creating it before substantial project work begins.

At minimum, initialization should leave behind concrete initial artifacts such as `semantic-context/vision.md` and one or more open-question records, so that the project has actually entered SCD rather than merely discussing it.

## Project initialization mode

If the project does not yet have an established Semantic Context, the agent must begin in initialization mode rather than implementation mode.

On a repository without established Semantic Context structure, the first user prompt must always be treated as project initialization input. This remains true even if that first prompt is phrased as a request to build the application, implement features, or clarify ambiguities before implementation.

In initialization mode, the agent must:

1. create or propose the required project structure
2. capture the user's initial description as high-level product purpose, main actors, and broad workflow intent
3. create an initial Semantic Context skeleton, especially vision and open questions
4. record unresolved semantic ambiguities as open questions instead of forcing early decisions
5. avoid prematurely deciding detailed business rules, defaults, lifecycle outcomes, UI assumptions, authentication behavior, test suites, or other lower-level semantics
6. avoid implementation during initialization mode
7. stop in a ready state once the initial structure and first semantic artifacts have been created
8. leave the project ready to receive the first concrete user task

During this first-response initialization phase, ambiguities must be recorded as open questions rather than turned into immediate clarification requests. The expected outcome of the first prompt is initialization plus a short statement that the project has been initialized, the initial description has been recorded, and the repository is ready for the first concrete task.

Implementation may begin only in a later prompt, after initialization artifacts already exist.

## Agent responsibilities

When working in a repository that follows SCD, always do the following:

1. Read the current Semantic Context before planning, implementing, or answering questions about the system.
2. Ensure that the required SCD project structure exists inside the target repository, creating or proposing the required Semantic Context and history directories when they are missing.
3. If the project is still in initialization mode, initialize structure, write the first semantic artifacts from the user's initial description, and then stop in a ready state.
4. Do not treat the first prompt in a repository without Semantic Context structure as an implementation task, even if it appears to ask for implementation.
5. Do not escalate the first-response initialization phase into implementation-level semantic decisions, default proposals, or clarification questionnaires.
6. Treat every later concrete task as both an implementation task and a semantic maintenance task.
7. Interpret every new task after initialization as a proposed semantic change, not merely as a coding request.
8. Before implementing, check whether the requested change conflicts with existing business rules, flows, invariants, security constraints, permissions, compatibility constraints, or other semantic commitments already present in the Semantic Context.
9. Detect ambiguity, missing constraints, contradictions, hidden impact, and security concerns before implementation whenever possible.
10. If more than one semantic interpretation is plausible, stop and ask for human clarification before proceeding, except during the first-response initialization phase of a project with no Semantic Context structure yet; in that case, record the ambiguity as an open question and stop after initialization.
11. If initialization has completed and no concrete task has yet been given, do not propose default product choices, do not request implementation-facing clarifications, do not begin implementation, and do not proceed further; simply state that initialization has been completed and wait for the next user task.
12. For every task, propose the tests that should exist based on the intended semantic change, and let humans validate or refine that proposal.
13. Update the Semantic Context before or alongside implementation changes whenever the task changes system meaning, tested behavior, security posture, structural compatibility requirements, user-visible UI behavior, explicitly requested style decisions, or externally observable behavior.
14. Treat failed tests, bug fixes, edge cases, user clarifications, compatibility discoveries, and security discoveries as required Semantic Context review points.
15. Never finish a task with implementation changes, tested behaviors, business implications, security implications, UI decisions, compatibility constraints, or major technical choices that are not reflected in the Semantic Context.
16. Ensure that every test the system is expected to pass corresponds to behavior explicitly described in, or validly derivable from, the Semantic Context.
17. Preserve all semantically relevant structural details required for future behaviorally compatible regeneration, including data models, interfaces, contracts, states, transitions, permissions, security-relevant constraints, observable behavior, and materially relevant technical choices.
18. When asked about business rules, flows, expected behavior, security constraints, UI behavior, compatibility, or other project-level questions, prefer answering from the Semantic Context rather than inferring only from code.
19. Prefer semantic reconciliation over textual reconciliation when merging Semantic Context changes.
20. If implementation, testing, debugging, integration, or user validation reveals meaning that was not previously captured, update the Semantic Context before considering the task complete.
21. If the model makes autonomous decisions to fill gaps — including UI layout, navigation flow, validation behavior, design choices, naming, structural decisions, or implementation-local technical choices — explicitly state those decisions to humans and record them in the Semantic Context.
22. Architecturally significant technical choices should be explicitly requested, inherited from established project context, or surfaced for human validation rather than silently assumed.
23. Smaller implementation-local technical choices may be made autonomously, but they must still be recorded when they materially affect regeneration, validation, or future understanding.
24. At minimum, the model should explicitly surface the main technical decisions it made for a task whenever they are materially relevant — for example implementation stack, persistence approach, authentication approach, testing strategy, runtime assumptions, or other architectural choices that affect how the system is built, validated, or later regenerated.
25. This reporting of main technical decisions must happen automatically as part of task completion, not only when a human remembers to ask for it.
26. Optimize the Semantic Context for AI reasoning first, while keeping it reasonably readable for humans.
27. Maintain raw interaction history in a separate history area, but do not treat that history as canonical semantic memory.
28. Ensure that history artifacts make ordering explicit enough for a human to reconstruct the exact sequence of events, even when multiple entries happen on the same day.
29. Treat human feedback as the final validator of semantic correctness.

## Validation duties

For every new concrete task after initialization, the agent must explicitly validate whether the requested change:

- contradicts an existing business rule
- breaks an invariant
- conflicts with an existing flow
- weakens or violates a security constraint or permission rule
- introduces behavior incompatible with previously established semantics
- changes user-visible UI behavior or validations in a way that should be semantically recorded
- requires new tests or invalidates existing expected tests
- requires new structural detail in the Semantic Context to preserve future compatibility
- depends on architecturally significant technical choices that must be asked, inherited, or surfaced for validation

If such a conflict or dependency exists, the agent must surface it before implementation rather than silently proceeding.

However, during project initialization, the agent should not demand resolution of implementation-specific decisions merely to create the initial SCD structure and semantic skeleton. Those decisions should be recorded as open questions and left unresolved until a later concrete task requires them.

Initialization is successful once the structure and first semantic artifacts have been created. It should not continue into implementation-preparation questioning merely because open questions remain unresolved.

## Semantic Context expectations

A project Semantic Context should be able to support all of the following without requiring direct code inspection:

- explanation of business rules
- explanation of system flows and states
- explanation of expected and forbidden behaviors
- explanation of relevant security constraints and permission boundaries
- explanation of important user-visible UI behavior and validations
- traceability from expected tests to intended behavior
- validation of whether a proposed task is semantically valid
- preservation of compatibility-relevant knowledge for future regeneration
- direct answers to important project questions without reverse-engineering code
- visibility into the main technical decisions that materially shape the system

If the agent cannot answer these from the Semantic Context, then the Semantic Context is incomplete.

## History expectations

A repository that follows SCD should also retain a raw `history/` area for interaction and task history.

History is useful for:

- audit
- explanation of how understanding evolved
- reconstruction of prior decisions
- dispute resolution when semantic meaning is unclear

However, history is not canonical semantic memory. The agent must not rely on raw history as its primary working context when the same meaning has already been consolidated into the Semantic Context.

History should also preserve ordering clearly enough for humans to reconstruct the exact sequence of events. File names and metadata should not rely on date alone when that would make same-day ordering ambiguous. When needed, include timestamps, sequence numbers, or other explicit ordering markers.

## Relationship to code

In SCD, implementation code is not the primary development asset. It is a compiled artifact generated from Semantic Context.

This means the agent should treat code generation, code modification, and executable test generation as downstream activities derived from semantic intent, not as the place where system meaning is primarily stored.

## Relationship to this file

This file is the stable operational template of the SCD method itself.
When copied into a target project as its working AGENTS.md, it should guide the creation and maintenance of that project's Semantic Context structure and its separate raw history area.

Projects may adopt it, version it, or extend it deliberately, but it should not drift implicitly as part of ordinary feature work. The Semantic Context evolves continuously with the project; this agent standard should evolve only through explicit method-level changes.
