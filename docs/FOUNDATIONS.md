# Causality — Phase 0 Foundations

## Project Name

**Causality**

---

## Project Statement

**Causality** is a framework for capturing, reconstructing, and explaining the causal execution of distributed systems, from user intent to system behavior.

---

## Problem Statement

Modern systems generate logs, metrics, and traces, but they rarely explain _why_ something happened.

Teams spend significant time and resources:

- Reproducing bugs
- Understanding silent failures that degrade UX
- Identifying why specific features consume excessive resources

Causality focuses on _causes_, not just events.

---

## Core Principles

1. **Semantics First**  
   Meaning is more important than volume of data.

2. **Deterministic Core**  
   The system must provide value without AI.

3. **Actions Over Logs**  
   Actions are the fundamental unit of execution.

4. **Explainability by Design**  
   Every output must be explainable to a human.

5. **Extensible Reasoning**  
   MCP and agents are layers, not dependencies.

---

## Glossary

### Action

A semantic unit of execution representing an intent or meaningful step in the system.

### Trace Causal

A structured reconstruction of what happened, in what order, and why.

### Silent Error

A failure mode that does not break functionality but degrades UX, performance, or cost efficiency.

### Correlator

A deterministic component that reconstructs causal traces from actions, metrics, and timing.

---

## What Causality Is Not

- A log aggregator
- A traditional APM
- A generic alerting system
- An AI-only debugger

---

## Repository Direction

Primary repository:

```
causality
```

Planned packages:

- `@causality/sdk-core`
- `@causality/collector`
- `@causality/correlator`

---

## Phase Status

Phase 0 — **Completed**

This document defines the foundation for all future phases.
