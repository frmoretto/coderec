# AGENTS.md - coderec

> Universal discovery file for AI agents and coding assistants.

## What This Repository Does

**coderec** is a codebase reconnaissance protocol that transforms existing (brownfield) codebases into **Codebase Intelligence Documents (CIDs)** — verified, structured artifacts that specification-driven development tools can consume as input.

**Core question:** "What does this codebase actually do, and can we prove our understanding is correct?"

## Quick Start for Agents

### 1. Load the Skill

The main skill file is at: `skill/SKILL.md`

```
Read: skill/SKILL.md
```

### 2. Understand the Protocol

| Document | Purpose | Location |
|----------|---------|----------|
| Skill definition | Protocol spec, boundary algorithm, SOT enforcement | `skill/SKILL.md` |
| Full command | 4-layer flow + 7-gate verification | `skill/commands/full.md` |
| Scope command | Scoped reconnaissance + merge strategy | `skill/commands/scope.md` |
| Cartography command | Layer 1 only (quick system map) | `skill/commands/cartography.md` |

### 3. Understand the Output Templates

| Template | Layer | Location |
|----------|-------|----------|
| System Map | 1 — Cartography | `skill/templates/system_map.md` |
| Module Card | 2 — Module Intelligence | `skill/templates/module_card.md` |
| Coherence Report | 3 — Cross-Module Synthesis | `skill/templates/coherence_report.md` |
| Decision Register | 4 — Decision Archaeology | `skill/templates/decision_register.md` |
| Verification Status | Gates 1-7 | `skill/templates/verification_status.md` |

### 4. Trigger Phrases

Use any of these to activate coderec:
- "analyze codebase"
- "brownfield"
- "understand existing code"
- "coderec"
- "code reconnaissance"
- "reverse engineer specs"
- "run coderec full"
- "run coderec scope"

## Key Concepts

### Source of Truth (SOT)

Every coderec run requires `--sot /absolute/path`. All reads use absolute paths prefixed with SOT_ROOT. Commit SHA is pinned at start and revalidated at end. Three modes: git clean, git dirty (`--allow-dirty`), snapshot (`--sot-mode snapshot`).

### 4 Progressive Layers

1. **Cartography** — file tree, boundaries, dependencies (no source code read)
2. **Module Intelligence** — one module at a time, verbatim contracts with provenance
3. **Cross-Module Synthesis** — contradictions, dead code, coupling (from cards, targeted re-reads)
4. **Decision Archaeology** — git blame, confidence levels (documented/inferred/unknown)

### 7-Gate Verification

Gates execute after Layer 4, before CID finalization. Status: VALID | INVALID | DEGRADED | STALE.

| Gate | Checks | Failure |
|------|--------|---------|
| 1 — Path | File paths resolve against SOT_ROOT | INVALID |
| 2 — Version | Versions match lock file | DEGRADED |
| 3 — Contract | Verbatim signatures match source | INVALID |
| 4 — Schema | Types match source exactly | DEGRADED |
| 5 — CSS | CSS tokens match theme | DEGRADED |
| 6 — Behavior | Render logic, HTML attrs, metadata, routing | INVALID |
| 7 — Cross-ref | All CID files internally consistent | INVALID |

### Module Boundary Algorithm

6-level precedence: manifest > deploy unit > barrel file > framework convention > domain directory > fallback. Boundaries are nestable (package contains framework submodules). Deterministic processing order (topological + alphabetical).

### CID Schema

Machine-readable JSON contract at `schema/cid.schema.json`. Validator at `schema/validate-cid.mjs`.

## Ecosystem

```
coderec       ->  understand codebase  ->  CID
specverify    ->  verify specs         ->  report
stream-coding ->  write specs          ->  code
```

## License

MIT

## Author

Francesco Marinoni Moretto
