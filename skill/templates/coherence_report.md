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

## Summary

| Category | Count | Critical |
|----------|-------|----------|
| Contradictions | {{n}} | {{n}} |
| Dead code | {{n}} | - |
| Implicit coupling | {{n}} | {{n}} |
| Undocumented invariants | {{n}} | {{n}} |
| Type gaps | {{n}} | - |
| Duplication | {{n}} | - |
| Version conflicts | {{n}} | {{n}} |
