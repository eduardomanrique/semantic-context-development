# Semantic Context Development

**Semantic Context is the source. Code is the compiled artifact.**

This repository explores **Semantic Context Development (SCD)**, a software development method in which the primary source of truth for a system is not code, but a living **Semantic Context** maintained through AI-assisted development.

In SCD, code is treated as a compiled artifact generated from semantic intent. The Semantic Context is expected to preserve business meaning, flows, invariants, compatibility-relevant structures, and the behaviors that the system is expected to satisfy in tests.

This repository is also an experiment motivated by a practical hypothesis: as AI increases the speed and volume of code generation, the main bottleneck may shift from writing code to validating ever-larger amounts of generated change. A large share of human code review has historically helped keep code understandable and maintainable for humans operating under strong cognitive limits. If implementation is increasingly generated and manipulated by AI, that part of review may lose relative importance over time, while validation may move upward toward intent, rules, constraints, and semantic coherence. SCD explores whether a Semantic Context can become a better primary artifact for preserving intent, validating behavior, guiding change, and regenerating systems, while humans remain responsible for goals, priorities, concerns, and final semantic judgment.

This should be read as an experiment, not as a prediction that SCD is "the future" of software engineering. The repository explores a possible shift in emphasis under AI-assisted development, while remaining compatible with ordinary current practice, including human code review. The hypothesis is not that review disappears, but that more of the validation burden may gradually move upward from line-by-line code reading toward semantic review of intent, rules, constraints, and system coherence.

For the core principles and rationale, see the [SCD manifesto](./SCD-manifesto.md).

The repository is also intentionally honest about process: both the method and the demo were developed with heavy AI assistance. That is not treated here as something to hide, but as part of the experimental setup. The point is not that humans disappear, but that human guidance, semantic validation, and decision-making become more important as generated code becomes cheaper and more abundant.

## What this repository contains

This repository contains the **method**, not just a production project built with it.

It currently includes:

- the SCD concept and manifesto
- the base agent operating standard in `AGENTS.md.tmpl`, derived from the SCD manifesto
- a demo project showing the method in use (see [demo walkthrough](./demo-walkthrough.md))
- the demo interaction history
- a regenerated version of the demo recreated from Semantic Context
- ongoing notes and experiments around the method
- an explicit experiment in AI-assisted development, where the Semantic Context is maintained as consolidated semantic memory rather than allowed to grow as an unstructured pile of specs

## How to use SCD in a project

The `AGENTS.md.tmpl` file in this repository was generated from the SCD manifesto and expresses the method as an operational agent standard.

To use SCD in a real project:

1. Copy `AGENTS.md.tmpl` into your target project as `AGENTS.md`.
2. Start working with an AI coding agent such as Codex or Claude Code inside that target repository. If this is a new project, provide a short high-level initial description so the agent can initialize the project and create the required SCD structure, including:
   - `semantic-context/` as the canonical semantic memory
   - `history/` as raw interaction history for audit and reference
3. After initialization, work mainly through short user stories or small concrete changes rather than large vague requests.
4. Use the agent normally for feature work, but expect it to:
   - validate semantic conflicts before implementing
   - update the Semantic Context as the project evolves
   - keep required test behavior traceable to the Semantic Context
   - answer business-rule and project-behavior questions from the Semantic Context rather than from reverse-engineering code
   - make major technical decisions explicit instead of leaving them buried in generated code
   - maintain the Semantic Context as consolidated semantic memory rather than as an ever-growing pile of appended specifications
   - treat code as a derived artifact rather than the primary source of truth
5. In practice, the intended usage is close to the demo flow in this repository: initialize from a short project description, move forward story by story, let ambiguities be clarified when they actually matter, and preserve the raw history alongside the consolidated Semantic Context.

## Demo status


A demo project has already been created and used to exercise the method in practice.

For a more practical step-by-step view of what was done in the demo, see the [demo walkthrough](./demo-walkthrough.md).

If you want to understand how the demo was actually generated step by step, including the task flow, clarifications, conflict checks, and semantic refinements, see the demo history stored in the demo project's `history/` directory.

The demo includes:

- a real `semantic-context/` created and evolved through AI-assisted development
- a `history/` area preserving the interaction trail used during the demo
- business-rule questions answered from Semantic Context rather than code
- semantically invalid change attempts being detected before implementation

## Demo experience


The demo was used as a practical exercise of the method rather than as a hand-crafted example, starting from a short project description and evolving through normal agent interaction. The corresponding raw interaction trail was preserved in the demo project's `history/` directory so that the generation process can be inspected afterward.

The demo is also intentionally honest about authorship conditions: it was heavily AI-assisted, and that is part of what the experiment is trying to examine. The point is not to present a hand-crafted artifact pretending AI was absent, but to see whether a human-guided, semantically maintained process can produce something more controlled than ordinary vibe coding while remaining more continuous than static spec-driven work.

In broad terms, the process was:

- start from a short natural-language prompt describing the project
- let the agent initialize the project first, then clarify only the ambiguities that actually mattered to each story while building the Semantic Context incrementally
- implement a small set of user stories
- intentionally send invalid or conflicting stories to verify that semantic validation happened before implementation
- evolve the UI/UX while keeping business behavior aligned with the Semantic Context
- ask multiple business-rule questions to verify that the agent could answer from the Semantic Context rather than from implementation details
- regenerate the application in a fresh project using only the demo Semantic Context


The implementation was created in Node.js. After that, the Semantic Context from the demo was copied into a new project directory, and the application was regenerated in Python from just one prompt, without reusing the original codebase.

So the repository contains both the resulting demo artifacts and the historical trail that led to them. The Semantic Context shows the consolidated meaning of the project, while the demo `history/` directory shows how that meaning was clarified, challenged, corrected, and expanded over time.

The demo also reflects an important practical idea behind SCD: the Semantic Context is not meant to become an ever-growing pile of specs. It is maintained as consolidated semantic memory, updated as the project evolves, so that the AI can operate on current intended meaning rather than on an unstructured accumulation of old requirements. In that sense, the Semantic Context is optimized primarily for AI operation and semantic continuity, while humans can still inspect it directly or ask the agent questions and get answers grounded in it.

## Important distinction

In an adopting project:

- `semantic-context/` is the **canonical semantic memory**
- `history/` is **non-canonical raw history**
- implementation code is a **compiled artifact generated from Semantic Context**
- human review can still exist, but SCD explores whether more of the validation burden can move from line-by-line code reading toward semantic review of intent, rules, and constraints
- the Semantic Context is maintained primarily as working semantic memory for AI operation and continuity, while humans can inspect it directly or query it through the agent when they need answers about the project

## Status

Research / prototype.
