# Semantic Context Development

## Tagline

Semantic Context is the source. Code is the compiled artifact.

## Thesis

Semantic Context Development is a software development model in which the primary source of truth is not code, but a living Semantic Context continuously maintained by AI agents and validated by humans through interaction.

As features are implemented, tested, corrected, clarified, and refined, the AI updates the Semantic Context to preserve intent, constraints, flows, invariants, edge cases, decision rationale, and all behaviorally relevant details required to keep the system understandable, evolvable, and compatibly regenerable.

Code becomes a derived artifact; semantic continuity becomes the main development asset. In this model, code is a compiled artifact of semantic intent: we no longer primarily compile source code into software, but compile Semantic Context into code, tests, and runnable behavior. The Semantic Context must therefore be rich enough not only to explain the system, but also to support regeneration of a behaviorally compatible implementation, including semantically relevant structures such as data models, interfaces, contracts, states, externally observable constraints, and the full set of behaviors that the system is expected to satisfy in tests.

## What it is

- A development model centered on a living semantic source of truth
- Maintained by AI, validated by humans
- Operationalized through agents that follow a reusable SCD repository standard and create or maintain the required Semantic Context structure inside each adopting project
- Incremental from the start: when a project has no established Semantic Context yet, the first step is initialization of semantic structure, not premature implementation of detailed behavior
- Task-driven rather than product-steering: the model should wait for concrete user tasks instead of proactively shaping the product through broad semantic decisions unless the user explicitly asks for that guidance
- Continuously enriched through implementation, tests, failures, corrections, and clarifications, with every behaviorally relevant test expectation reflected in the Semantic Context
- Test-driven at the semantic level: for every task, the model must propose the tests that should be written, and humans validate or refine that proposal
- Explicit about autonomous decisions: whenever the model decides UI, design, flow, structure, or any other relevant detail on its own, that decision must be reflected in the Semantic Context
- Used to validate new tasks, detect conflicts, explain system behavior, guide implementation, and preserve the information required for behaviorally compatible regeneration
- Security-aware by default: agents should continuously surface security concerns, permission issues, unsafe flows, and other semantically relevant risks
- Rich enough to preserve current user-visible UI behavior and UX structure when those affect system meaning, regeneration fidelity, or explicit user intent
- Based on a canonical Semantic Context used as primary agent memory, while raw interaction history remains non-canonical supporting evidence

## What it is not

- Not just better documentation
- Not just business rules
- Not just prompt engineering
- Not just feature specs
- Not a replacement for testing

## Difference from current Spec-Driven Development

Current Spec-Driven Development treats specifications as primary artifacts that guide or generate implementation. Semantic Context Development extends this by making the semantic source continuously maintained by AI agents across the whole system, not just per feature, and continuously refined through development and testing rather than assumed to be complete upfront.

## Difference from vibe coding

Vibe coding optimizes primarily for generation speed and fast iteration through output. Semantic Context Development addresses the problem that appears after generation speed stops being the main bottleneck: preserving meaning, validating change, and maintaining a canonical semantic source as generated code volume grows.

In SCD, a task is not accepted merely because generated output seems to work. It must be reconciled with the Semantic Context, with existing business rules, flows, invariants, security constraints, and expected tests. In this sense, SCD is not a variant of vibe coding, but a more disciplined semantic layer intended to govern AI-driven development once code generation becomes cheap and abundant.

## Validation model

- AI maintains the Semantic Context
- When a project is still being initialized, the model should capture only high-level purpose, actors, and open semantic questions unless more detailed behavior is explicitly requested
- The model should not escalate initialization into detailed product-definition questioning when the immediate goal is only to prepare the project to receive later tasks
- After initialization artifacts are created, the model should stop in a ready state instead of continuing into implementation-preparation questioning
- Initialization should result in created structure and initial Semantic Context artifacts, not only in questions or requests for clarification
- Humans validate semantic evolution through interaction
- Agent behavior must follow a stable SCD operational standard, while project semantic evolution happens through the Semantic Context
- No meaningful code change is complete unless the Semantic Context is reconciled with it
- The Semantic Context must capture not only intent, but also all semantically relevant details required to regenerate a behaviorally compatible system
- Every test the system is expected to pass must correspond to behavior described or derivable from the Semantic Context
- For every task, the model must propose which tests should exist; humans validate that proposal and may refine it with additional tests
- Security concerns must be treated as first-class semantic concerns, not as optional implementation polish
- User-visible UI behavior, validations, flows, and explicitly requested style decisions must be reflected in the Semantic Context when they matter to current system meaning or future regeneration
- Any relevant decision made autonomously by the model must be promoted into the Semantic Context and surfaced explicitly to humans after implementation
- Bugs, edge cases, failed tests, security discoveries, and clarified ambiguities must all be treated as mandatory review points for Semantic Context maintenance
- Raw conversation history should not be treated as the primary working context of the agent; only semantically consolidated knowledge should enter the Semantic Context

## Initial hypothesis

A continuously evolving Semantic Context can preserve system intent better than code alone because code reveals behavior, but does not always clearly reveal intention, rationale, whether a behavior is accidental, which structural details are essential for future compatible regeneration, which tested behaviors are part of the intended system contract, or which parts of prior interaction history should remain evidence rather than become canonical system meaning.

## Priority of semantic fidelity

Not all parts of the Semantic Context need the same degree of precision.

Business rules, invariants, security constraints, permissions, flows, contracts, data models, and compatibility-relevant behavior must be explicit and unambiguous. These are core semantic commitments of the system.

UI behavior should also be preserved, including screens, actions, validations visible to the user, navigation flow, role-based visibility, and important UX decisions. However, unless explicitly required, UI does not need the same level of exactness as core business semantics. Visual fidelity is desirable, but semantic fidelity has priority.

When detail is limited, SCD should preserve business truth before visual fidelity.

When the model fills gaps on its own — whether in UI layout, navigation flow, design choices, validation behavior, or structural decisions — those choices must not remain implicit. They should be recorded in the Semantic Context so that regeneration, review, and future change are grounded in explicit semantic decisions rather than hidden implementation defaults.

Such autonomous decisions should be limited to local, implementation-facing gaps. They are not a substitute for user-provided product direction, and they should not silently expand into major business-definition choices that the user has not asked the model to make.

## Short formulation

The system should be understood, validated, and evolved through a living semantic source maintained by AI agents that follow a stable SCD operational standard, such that business behavior and required tests remain answerable even without direct access to code, while code itself is treated as a compiled artifact of Semantic Context.

## Agent standard

Semantic Context Development depends not only on the existence of a Semantic Context, but also on the existence of a stable agent behavior standard. That standard should not be reinvented continuously inside each project. Instead, SCD should provide a reusable operational standard — for example through a base AGENTS.md template — that defines how agents must read, update, validate, reconcile, and merge the Semantic Context.

When a project adopts SCD, agents following that standard are responsible for creating and maintaining the required project structure inside the target repository itself, including the Semantic Context and its supporting areas such as raw history. In this model, the Semantic Context is the living source of system meaning within the adopting project, while the agent standard is the stable method used to maintain it. The Semantic Context evolves continuously with the project; the SCD agent standard evolves much more slowly, as part of the method itself. Projects may adopt or version that standard, but it should not drift implicitly as part of normal feature work.

## Required project structure

An adopting project should contain a minimum SCD structure created and maintained by the agent inside the target repository.

That structure should include at least:

- `semantic-context/` as the canonical semantic memory
- `semantic-context/vision.md` for high-level purpose and scope
- `semantic-context/domains/` for domain-oriented semantics
- `semantic-context/flows/` for flows, states, and transitions
- `semantic-context/invariants/` for rules and constraints that must always hold
- `semantic-context/decisions/` for semantic decisions and rationale
- `semantic-context/incidents/` for corrections, bugs, and discoveries that changed system understanding
- `semantic-context/open-questions/` for unresolved ambiguities
- `semantic-context/trace/` for traceability between semantics, tests, UI, APIs, and implementation areas
- `history/` for raw interaction history retained for audit and reconstruction

The exact shape may evolve, but the method requires a clear separation between canonical semantic memory and non-canonical historical evidence.

At minimum, initialization should leave behind concrete initial artifacts such as `semantic-context/vision.md` and one or more open-question records, so that the project has actually entered SCD rather than merely discussing it.

## Project initialization principle

## Initialization stopping principle

Project initialization should end in a ready state, not in an implementation-preparation interview.

Once the agent has created the required structure, written the initial Semantic Context skeleton, and recorded open questions, it should stop and wait for the first concrete task.

At this stage, unresolved ambiguities should remain recorded as open questions. The agent should not immediately ask the user to resolve implementation-facing decisions, and it should not propose default product choices unless the user explicitly asks to start implementation or provides the first concrete task.

When a project has not yet established a Semantic Context, the first responsibility of the method is project initialization, not feature implementation. Initialization is not optional: the agent should create the initial structure and write the first Semantic Context artifacts before waiting for the first concrete task.

Initialization should create the required project structure, capture the high-level product purpose, identify the main actors and broad workflow intent, and record open semantic questions that still require clarification. It should write an initial Semantic Context skeleton — especially vision and open questions — based on the user's initial description. It should avoid prematurely deciding detailed business rules, defaults, lifecycle outcomes, UI assumptions, authentication behavior, or other lower-level semantics unless the user explicitly asks for them. It should also avoid turning initialization into a product-design interview whose purpose is to define the application in detail before concrete tasks exist.

In other words, the absence of Semantic Context should put the agent into initialization mode rather than implementation mode. The project should become ready to receive concrete user stories and semantic refinement incrementally, instead of front-loading detailed assumptions too early. During this phase, ambiguities should usually be recorded as open questions rather than used to block creation of the initial project skeleton. After initialization, the model should primarily respond to user tasks rather than proactively trying to drive the product definition forward on its own.

## Non-steering principle

Semantic Context Development is not a license for the model to guide or shape the product beyond what the user has asked. The model may clarify ambiguities that block a concrete task, and it may make small implementation-facing decisions when necessary, but it should not proactively expand the problem space by proposing broad product-definition choices unless the user explicitly requests product-design help.

If the user provides only an initial project description, the model should initialize the project, write the first semantic artifacts, and then stop in a ready state. It should not refuse initialization merely because future workflow or data-model choices remain unresolved.

Likewise, it should not turn those unresolved choices into immediate follow-up questioning once initialization has already succeeded. They should remain open questions until a later concrete task makes them relevant.

In particular, after project initialization, the default posture of the method is task-driven. The user provides concrete stories or changes; the model validates, records, and implements them semantically. It should not keep the project moving forward by inventing major semantic decisions simply because such decisions will eventually be needed.

## Task completion principle

A task is not complete merely because code was generated or behavior appears to work.

A task is complete only when the Semantic Context and the implementation are semantically reconciled. That includes the intended business meaning, security implications, expected tests, relevant UI behavior, compatibility-relevant structure, and any important autonomous decisions made by the model.

If those are not reflected in the Semantic Context, the task remains incomplete even if the implementation compiles or passes partial tests.

However, task completion should still be evaluated against the task the user actually asked for. The model should not create artificial incompleteness by demanding resolution of unrelated future product questions that are not required to complete the current task.

The same logic applies to initialization: once the initial structure and semantic skeleton have been created, initialization is complete even if many implementation-facing choices remain unresolved.

## Canonical memory principle

Semantic Context Development requires a strict distinction between canonical semantic memory and raw interaction history inside each adopting project. The Semantic Context is the canonical memory used by agents to understand, validate, and evolve the system. Raw conversation logs, prompts, and exploratory interaction history may be retained in a separate history area for audit, explanation, or historical reconstruction, but they should not be treated as the agent's primary working context. Because history is intended to preserve how understanding evolved over time, history artifacts should also make ordering explicit enough for humans to reconstruct the sequence of events reliably, even when multiple entries were created on the same day.

Only semantically consolidated knowledge should be promoted into the Semantic Context. This prevents context overload, reduces semantic drift, and keeps the agent focused on the current intended system meaning rather than on unfiltered historical dialogue.

Open questions created during initialization should remain as open questions rather than being used to trigger immediate clarification loops. Their purpose is to preserve uncertainty explicitly until a later task requires resolution.

Because the Semantic Context is canonical and current, the method also requires that questions about the system be answerable from it directly. If answers depend on rereading raw history or reverse-engineering code, the Semantic Context has failed to capture enough of the intended system meaning.

For that reason, history naming and metadata should not rely on date alone when that would make ordering ambiguous. If multiple history entries occur on the same day, the history should include enough ordering information — such as timestamps, sequence numbers, or other explicit ordering markers — so that the exact progression remains understandable to a human reader.

## Current-state principle

The Semantic Context is not a chronological log of all past system states. It is the canonical description of the system as it currently is meant to behave.

When a rule, flow, screen, validation, or user-visible behavior changes, the canonical Semantic Context should be updated to describe the new current state. Historical dialogue and prior states may still be retained in history or incident-oriented artifacts, but they should not remain mixed into the primary semantic description as if they were still current.

The same principle applies at initialization time: early exploratory prompts and open ambiguities should not be treated as if they were already settled system semantics. Only once a meaning has been clarified or accepted should it become part of the canonical current Semantic Context.

## Answering principle

When agents answer questions about business rules, flows, permissions, expected behavior, security constraints, UI behavior, or compatibility, they should answer from the Semantic Context as the canonical source, not primarily from implementation code.

If the Semantic Context cannot support such answers, that is evidence that it is incomplete.

## Semantic reconciliation principle

Semantic Context Development prefers semantic reconciliation over purely textual reconciliation.

When changes from different tasks or branches interact, the important question is not whether lines of text conflict, but whether meanings conflict, overlap, or require consolidation. The method should therefore treat semantic merge and semantic reconciliation as first-class concerns.

## Test and regeneration principle

Expected tests are part of the Semantic Context even when executable tests are not stored there directly. For every task, the model must propose the tests that should exist based on the intended semantic change, and humans validate or refine that proposal. The Semantic Context must describe what must be verified about the system, and executable tests should be generated or maintained as derived artifacts from that semantic intent.

During project initialization, however, the model should not invent detailed test suites prematurely. At that stage it should propose only the tests justified by already clarified semantics, and leave unresolved behavior as open semantic questions rather than fabricating testable detail too early.

When a system is regenerated from Semantic Context, regeneration should be validated not only by whether code was produced, but by whether the regenerated system still satisfies the expected behaviors, business rules, security constraints, and derived tests described by the Semantic Context.

Likewise, when the model makes autonomous implementation-facing decisions in order to complete a task, it must explicitly state what it decided and ensure that those decisions are reflected in the Semantic Context rather than left buried in generated code.
