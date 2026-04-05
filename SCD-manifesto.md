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
- Continuously enriched through implementation, tests, failures, corrections, and clarifications, with every behaviorally relevant test expectation reflected in the Semantic Context
- Used to validate new tasks, detect conflicts, explain system behavior, guide implementation, and preserve the information required for behaviorally compatible regeneration
- Based on a canonical Semantic Context used as primary agent memory, while raw interaction history remains non-canonical supporting evidence

## What it is not

- Not just better documentation
- Not just business rules
- Not just prompt engineering
- Not just feature specs
- Not a replacement for testing

## Difference from current Spec-Driven Development

Current Spec-Driven Development treats specifications as primary artifacts that guide or generate implementation. Semantic Context Development extends this by making the semantic source continuously maintained by AI agents across the whole system, not just per feature, and continuously refined through development and testing rather than assumed to be complete upfront.

## Validation model

- AI maintains the Semantic Context
- Humans validate semantic evolution through interaction
- Agent behavior must follow a stable SCD operational standard, while project semantic evolution happens through the Semantic Context
- No meaningful code change is complete unless the Semantic Context is reconciled with it
- The Semantic Context must capture not only intent, but also all semantically relevant details required to regenerate a behaviorally compatible system
- Every test the system is expected to pass must correspond to behavior described or derivable from the Semantic Context
- Raw conversation history should not be treated as the primary working context of the agent; only semantically consolidated knowledge should enter the Semantic Context

## Initial hypothesis

A continuously evolving Semantic Context can preserve system intent better than code alone because code reveals behavior, but does not always clearly reveal intention, rationale, whether a behavior is accidental, which structural details are essential for future compatible regeneration, which tested behaviors are part of the intended system contract, or which parts of prior interaction history should remain evidence rather than become canonical system meaning.

## Research questions

- Can a Semantic Context answer questions about rules, flows, and exceptions better than code alone?
- Can it answer business questions about the system correctly even when the code is hidden?
- Can it detect invalid or conflicting tasks before implementation?
- Can it generate better tests by reasoning over intent instead of implementation?
- Can every required test be traced back to behavior explicitly described or validly derivable from the Semantic Context?
- Can it evolve through implementation feedback without becoming as unreadable as raw code?
- Can it support partial or full reimplementation of a system?
- What level of semantic and structural detail is necessary for compatible regeneration without collapsing back into raw implementation?

## Short formulation

The system should be understood, validated, and evolved through a living semantic source maintained by AI agents that follow a stable SCD operational standard, such that business behavior and required tests remain answerable even without direct access to code, while code itself is treated as a compiled artifact of Semantic Context.

## Agent standard

Semantic Context Development depends not only on the existence of a Semantic Context, but also on the existence of a stable agent behavior standard. That standard should not be reinvented continuously inside each project. Instead, SCD should provide a reusable operational standard — for example through a base AGENTS.md template — that defines how agents must read, update, validate, reconcile, and merge the Semantic Context.

When a project adopts SCD, agents following that standard are responsible for creating and maintaining the required project structure inside the target repository itself, including the Semantic Context and its supporting areas such as raw history. In this model, the Semantic Context is the living source of system meaning within the adopting project, while the agent standard is the stable method used to maintain it. The Semantic Context evolves continuously with the project; the SCD agent standard evolves much more slowly, as part of the method itself. Projects may adopt or version that standard, but it should not drift implicitly as part of normal feature work.

## Canonical memory principle

Semantic Context Development requires a strict distinction between canonical semantic memory and raw interaction history inside each adopting project. The Semantic Context is the canonical memory used by agents to understand, validate, and evolve the system. Raw conversation logs, prompts, and exploratory interaction history may be retained in a separate history area for audit, explanation, or historical reconstruction, but they should not be treated as the agent's primary working context.

Only semantically consolidated knowledge should be promoted into the Semantic Context. This prevents context overload, reduces semantic drift, and keeps the agent focused on the current intended system meaning rather than on unfiltered historical dialogue.
