# Vision

## Purpose

The Semantic Context is the primary semantic source of truth for the system.

Its purpose is to preserve, organize, and evolve the meaning of the system independently of any specific implementation. It must be rich enough to explain how the system is expected to behave, answer business and flow questions without relying on code, support generation of tests, validate new tasks against existing meaning, and preserve the semantically relevant details required for behaviorally compatible regeneration.

## Core principle

Code is implementation. Semantic Context is truth.

## What the Semantic Context must preserve

The Semantic Context must preserve, in structured form:

- business meaning
- system flows
- invariants and constraints
- expected externally observable behavior
- data structures and compatibility-relevant models
- interfaces, contracts, and states
- test-relevant expected behaviors
- decision rationale when behavior depends on interpretation or trade-off
- incidents and corrections that revealed missing meaning
- unresolved ambiguities and open semantic questions

## What the Semantic Context is for

The Semantic Context exists so that an AI agent should be able to:

- explain how the system works without reading code
- answer business questions about the system
- detect when a proposed task conflicts with existing meaning
- identify ambiguities before implementation
- generate or validate tests from intended behavior
- preserve compatibility-relevant knowledge for future regeneration
- support semantic merge and reconciliation across concurrent changes

## Human validation model

The Semantic Context is maintained continuously by AI agents, but semantic evolution is validated by humans through interaction.

Humans are not required to read the full Semantic Context directly. Instead, agents propose interpretations, updates, and clarifications during normal development work, and humans validate whether the understanding is correct.

## Agent behavior model

Agent operational behavior should be derived from the Semantic Context itself, through a defined operational standard.

Repository-level instructions such as `AGENTS.md` should be treated as a generated operational view of the Semantic Context, not as an independent semantic source of truth.

## Compatibility principle

The Semantic Context must preserve not only abstract intent, but also all semantically relevant details required for future behaviorally compatible regeneration.

This includes any structural, contractual, or externally visible detail that would be necessary to rebuild the system in another implementation while preserving expected behavior.

## Test principle

Every behavior the system is expected to satisfy in tests must be explicitly described in, or validly derivable from, the Semantic Context.

If a behavior is required but cannot be traced back to the Semantic Context, then the Semantic Context is incomplete.

## Evolution principle

If implementation, testing, debugging, integration, or user validation reveals meaning that was not previously captured, the Semantic Context must be updated before the task is considered complete.
