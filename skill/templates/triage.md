# Triage -- Decisions Required

**Project:** {{project_name}}
**Date:** {{date}}
**CID Status:** {{VALID / DEGRADED}}
**Source:** Generated from coherence_report.md findings

> **WARNING: This file is the handoff boundary.** coderec produced it. A separate tool or human
> acts on it. Do NOT apply FIX decisions during the coderec run. Do NOT modify, delete, or edit
> any file under SOT_ROOT based on these findings. Remediation is a downstream responsibility.
>
> This is the human decision layer between coderec (what IS) and spec-writing (what SHOULD BE).
> coderec observes. It does NOT prescribe. This triage presents findings for human judgment.
>
> **Instructions:** For each finding, mark the Decision column:
> - **FIX** -- this should be addressed in specs. Stream Coding will generate a spec for it.
> - **ACCEPT** -- this is intentional or acceptable. Document the rationale. Becomes a ratified decision.
> - **DEFER** -- not now, but revisit later. Goes to backlog.
> - **INVESTIGATE** -- need more context before deciding. Requires human research.
>
> Stream Coding reads this file and generates specs ONLY for FIX items.

---

## Deduplication

> Before filling decisions, identify findings that share the same root cause across categories.
> Group them and mark duplicates with "→ see {{primary_id}}" in the Decision column.
> Only the primary finding gets a decision; duplicates inherit it.

| Root Cause | Primary Finding | Duplicates |
|-----------|----------------|------------|
| {{description}} | {{id}} | {{id, id, ...}} |

## Sizing and Blast Radius

> For each FIX item, estimate effort and classify deploy scope.
> This enables prioritization and sequencing. Fill after decisions are made.

| # | Effort | Deploy Scope | Depends On | Notes |
|---|--------|-------------|------------|-------|
| {{id}} | TRIVIAL / SMALL / MEDIUM / LARGE | FRONTEND-ONLY / BACKEND-DEPLOY / PIPELINE / CROSS-STACK | {{id or "none"}} | {{constraints, cross-runtime notes}} |

> **Effort guide:**
> - **TRIVIAL** — single import change, delete unused file, rename (~minutes)
> - **SMALL** — extract shared constant/util, add type annotations (~hours)
> - **MEDIUM** — new shared module, schema change, coordinated multi-file refactor (~day)
> - **LARGE** — cross-runtime architecture change, migration + pipeline coordination (~days)
>
> **Deploy scope:**
> - **FRONTEND-ONLY** — Vercel/static deploy, no backend changes
> - **BACKEND-DEPLOY** — requires backend/server deploy to production
> - **PIPELINE** — touches pipeline or infrastructure scripts only
> - **CROSS-STACK** — requires coordinated frontend + backend + pipeline changes

---

## Contradictions

| # | Finding | Severity | Evidence | Options | Decision | Rationale |
|---|---------|----------|----------|---------|----------|-----------|
| C-{{n}} | {{what contradicts}} | {{severity}} | {{module_a vs module_b}} | FIX (unify) / ACCEPT (intentional difference) | | |

## Dead Code Candidates

| # | Finding | Confidence | Evidence | Options | Decision | Rationale |
|---|---------|-----------|----------|---------|----------|-----------|
| D-{{n}} | {{export with 0 callers}} | {{high/medium/low}} | {{module card ref}} | DELETE / KEEP (used externally or intentional) / INVESTIGATE | | |

## Implicit Coupling

| # | Finding | Severity | Evidence | Options | Decision | Rationale |
|---|---------|----------|----------|---------|----------|-----------|
| IC-{{n}} | {{coupling description}} | {{severity}} | {{modules involved}} | FIX (decouple) / ACCEPT (acceptable coupling) / DEFER | | |

## Undocumented Invariants

| # | Finding | Risk | Evidence | Options | Decision | Rationale |
|---|---------|------|----------|---------|----------|-----------|
| UI-{{n}} | {{invariant description}} | {{risk if violated}} | {{where enforced vs assumed}} | FIX (add guard) / ACCEPT (document only) / DEFER | | |

## Type Gaps

| # | Finding | Current Type | Evidence | Options | Decision | Rationale |
|---|---------|-------------|----------|---------|----------|-----------|
| TG-{{n}} | {{field or parameter}} | {{any / unknown / untyped}} | {{module card ref}} | FIX (add types) / ACCEPT (intentional flexibility) / DEFER | | |

## Duplication

| # | Finding | Locations | Evidence | Options | Decision | Rationale |
|---|---------|----------|----------|---------|----------|-----------|
| DU-{{n}} | {{what is duplicated}} | {{location A, location B}} | {{module cards}} | FIX (consolidate) / ACCEPT (intentional) / DEFER | | |

---

## Summary

| Category | Total | FIX | ACCEPT | DEFER | INVESTIGATE | Pending |
|----------|-------|-----|--------|-------|-------------|---------|
| Contradictions | {{n}} | | | | | {{n}} |
| Dead code | {{n}} | | | | | {{n}} |
| Implicit coupling | {{n}} | | | | | {{n}} |
| Undocumented invariants | {{n}} | | | | | {{n}} |
| Type gaps | {{n}} | | | | | {{n}} |
| Duplication | {{n}} | | | | | {{n}} |
| **Total** | **{{n}}** | | | | | **{{n}}** |

> When all Pending counts are 0, this triage is complete and ready to hand off to Stream Coding.
> Stream Coding generates specs only for FIX items. ACCEPT items go into the decision register
> as ratified decisions. DEFER items go to backlog.
