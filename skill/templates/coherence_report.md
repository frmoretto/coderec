# Coherence Report - Template

**Project:** {{project_name}}
**Layer:** 3 - Cross-Module Synthesis
**Date:** {{date}}

> **Input:** Layer 2 intelligence cards as primary source.
> **Targeted re-reads permitted:** When a specific claim requires source-level evidence
> (e.g., verifying a dead code candidate or confirming a type mismatch), the agent MAY
> re-read the specific file at SOT_ROOT. Keep re-reads minimal and focused.
> Every finding MUST include an evidence link (module card reference or source provenance).

---

## Contradictions

| # | Module A | Module A ID | Module A Path | Module B | Module B ID | Module B Path | Contradiction | Evidence | Severity |
|---|----------|-------------|---------------|----------|-------------|---------------|--------------|----------|----------|
| C-001 | {{module}} | {{module_id}} | {{module_path}} | {{module}} | {{module_id}} | {{module_path}} | {{what contradicts}} | {{card section or source file:line}} | CRITICAL / HIGH / LOW |

## Dead Code Candidates

> Built from "Public Exports with Known Callers" tables in Layer 2 cards.
> An export with 0 known callers, not an entry point, AND not framework-registered is a candidate.
> Before marking dead: check the "Framework Registered?" column in the module card.
> Targeted source re-read permitted to verify each candidate (check for string-based
> registration, event subscriptions, DI bindings, or reflection-based invocation).

| # | Export | Module | Module ID | Module Path | Known Callers | Verified? | Evidence | Confidence |
|---|--------|--------|-----------|-------------|--------------|-----------|----------|-----------|
| D-001 | {{export_name}} | {{module}} | {{module_id}} | {{module_path}} | none (from card) | yes - re-read confirmed / no | {{card ref or source file:line}} | High / Medium / Low |

## Implicit Coupling

| # | Module A | Module A Path | Module B | Module B Path | Coupling Type | Evidence | Risk |
|---|----------|---------------|----------|---------------|--------------|----------|------|
| IC-001 | {{module}} | {{module_path}} | {{module}} | {{module_path}} | {{shared state / timing / ordering / naming convention}} | {{card section}} | {{what breaks if one changes}} |

## Undocumented Invariants

| # | Invariant | Where Enforced | Enforced Path | Where Assumed | Assumed Path(s) | Evidence | Risk if Violated |
|---|-----------|---------------|---------------|--------------|-----------------|----------|-----------------|
| UI-001 | {{what must always be true}} | {{module}} | {{module_path}} | {{other modules}} | {{module_path_list}} | {{card section}} | {{consequence}} |

## Type Gaps

> Schema fields using `any`, untyped configs, loose interfaces - candidates for tightening.
> This section observes gaps. It does NOT prescribe fixes (that is spec-phase work).

| # | Location | Current Type | Evidence | Why it matters |
|---|----------|-------------|----------|---------------|
| TG-001 | {{module: field}} | `any` | {{card Schema section}} | {{based on actual usage}} |

## Duplication

| # | Location A | Location A Path | Location B | Location B Path | What's Duplicated | Evidence |
|---|-----------|-----------------|-----------|-----------------|------------------|----------|
| DU-001 | {{module}} | {{module_path}} | {{module}} | {{module_path}} | {{logic / constant / type}} | {{card sections}} |

## Dependency Version Conflicts (monorepo)

> In monorepos with multiple workspaces, different modules may depend on different
> versions of the same library. Cross-reference system_map's per-workspace dependency
> lists for same-dependency-different-version patterns.

| # | Dependency | Workspace A | Version A | Workspace B | Version B | Risk |
|---|-----------|------------|-----------|------------|-----------|------|
| VC-001 | {{dep_name}} | {{workspace}} | {{version}} | {{workspace}} | {{version}} | {{compatibility risk}} |

> If no version conflicts detected, write "None detected."

## Adversarial Validation (Steelman)

> **Purpose:** Challenge every finding above before it reaches triage. For each finding,
> argue AGAINST it being a problem. Use evidence from the codebase, not generic reasoning.
> This step prevents false positives from generating unnecessary specs downstream.
>
> **Rules:**
> - Every finding MUST be steelmanned — no exceptions.
> - Steelman arguments must cite codebase evidence (comments, ADRs, commit messages, architectural patterns).
> - RWIA must describe a concrete production failure scenario, or state "none found."
> - Downgraded findings still appear in triage with the steelman attached — the human decides.
> - Dropped findings (steelman holds + no RWIA scenario + speculative evidence) move to the Appendix below, not triage.
> - Targeted source re-reads are permitted for steelman evidence gathering (within Layer 3 re-read budget).

| # | Original Severity | Steelman (argument FOR current behavior) | RWIA (concrete failure scenario) | Evidence Grade | Verdict |
|---|-------------------|------------------------------------------|----------------------------------|----------------|---------|
| C-001 | {{severity}} | {{first-principles argument why current state is correct}} | {{specific scenario where this causes a production failure, or "none found"}} | STRUCTURAL / SPECULATIVE | CONFIRMED / DOWNGRADED / DROPPED |
| D-001 | {{severity}} | {{argument why this code is actually used or needed}} | {{scenario or "none found"}} | STRUCTURAL / SPECULATIVE | CONFIRMED / DOWNGRADED / DROPPED |

> **Evidence grades:**
> - **STRUCTURAL** — derived from import graph, type system, runtime paths, or gate-verified contracts. Hard to dispute.
> - **SPECULATIVE** — derived from naming conventions, code patterns, absence of evidence, or assumptions about intent. May be wrong.

> **Verdicts:**
> - **CONFIRMED** — steelman fails, RWIA scenario exists, evidence is structural. Finding proceeds to triage at original severity.
> - **DOWNGRADED** — steelman partially holds or RWIA scenario is unlikely. Finding proceeds to triage at reduced severity.
> - **DROPPED** — steelman fully holds, no RWIA scenario, evidence is speculative. Finding moves to appendix.

---

## Adversarial Validation Appendix (Dropped Findings)

> Findings where the steelman held. Retained for audit trail — not sent to triage.

| # | Original Finding | Original Severity | Steelman | Why Dropped |
|---|-----------------|-------------------|----------|-------------|
| {{id}} | {{finding}} | {{severity}} | {{steelman argument}} | {{steelman held + no RWIA + speculative}} |

---

## Summary

| Category | Count | Critical | Confirmed | Downgraded | Dropped |
|----------|-------|----------|-----------|------------|---------|
| Contradictions | {{n}} | {{n}} | {{n}} | {{n}} | {{n}} |
| Dead code | {{n}} | - | {{n}} | {{n}} | {{n}} |
| Implicit coupling | {{n}} | {{n}} | {{n}} | {{n}} | {{n}} |
| Undocumented invariants | {{n}} | {{n}} | {{n}} | {{n}} | {{n}} |
| Type gaps | {{n}} | - | {{n}} | {{n}} | {{n}} |
| Duplication | {{n}} | - | {{n}} | {{n}} | {{n}} |
| Version conflicts | {{n}} | {{n}} | {{n}} | {{n}} | {{n}} |
