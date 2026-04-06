# Decision Register - Template

**Project:** {{project_name}}
**Layer:** 4 - Decision Archaeology
**Date:** {{date}}

---

## Confidence Rubric

> Every decision must be classified using this rubric. The minimum evidence bar
> prevents vague pattern-matching from being labeled "Documented."

| Level | Definition | Minimum evidence |
|-------|-----------|-----------------|
| **Documented** | Decision traceable to explicit artifact | Requires at least one of: ADR or design doc (strongest), code comment with explicit "why" (strong), or commit message with rationale beyond a single keyword (acceptable). A commit message alone is sufficient only if it contains an explicit rationale sentence - not just "decided to use X." Do NOT rely on keyword matching. |
| **Inferred (high)** | Decision reconstructed from clear code pattern | Requires: consistent pattern across 3+ files, or a well-known design pattern (singleton, repository, etc.) with clear structural evidence. |
| **Inferred (low)** | Decision reconstructed from absence or ambiguity | Based on: what is NOT present (no tests -> deliberate?), single occurrence, or vague commit messages. Mark why confidence is low. |
| **Contradicted** | Evidence conflicts across sources | Commit message says X, code comment says Y, current implementation does Z. List all sources. |
| **Unknown** | Decision lost - no evidence found | No comment, no meaningful commit message, no pattern. Must be re-made explicitly before spec generation. |
| **No History** | Git history unavailable | For non-git codebases (`--sot-mode snapshot`) or migrated repos with no meaningful history. All decisions default to Unknown or Inferred based on code patterns only. |

### Anti-recency-bias rules

- Do NOT weight recent commits more heavily than older ones unless the recent commit explicitly supersedes the older decision.
- ADRs and design docs outweigh commit messages regardless of age.
- If a recent noisy commit ("fix lint", "WIP") contradicts an older deliberate commit, the older commit has higher evidence weight.
- **Skip these commit types** (no evidence value):
  - Merge commits (`Merge branch...`, `Merge pull request...`)
  - Single-word messages (`fix`, `wip`, `update`, `cleanup`)
  - Automated commits (dependabot, renovate, github-actions, CI bots)
  - Revert commits (the revert itself is signal, but the original commit it reverts may be noise)
- **Squash-merged history:** If repo uses squash merges, the squash commit message is the evidence source. Individual pre-squash commits are lost - treat as equivalent to single deliberate commit.
- **Lookback window:** Analyze commits that touch the module's files (`git log -- module_path/`), up to 200 commits per module. If the module has fewer than 200 relevant commits, use all of them. Record the lookback limit used in the register header.

## Decisions

> Every decision entry MUST include `File Path` (or `N/A` if module-level with no single file).

### DEC-001: {{decision_title}}

**What:** {{what_was_decided}}
**Where:** {{file_or_module}}
**File Path:** {{absolute_or_SOT_relative_path_or_N/A}}
**Confidence:** Documented | Inferred (high) | Inferred (low) | Contradicted | Unknown

**Evidence:**
- {{source - ADR link, code comment at file:line, commit SHA + message, or pattern description}}

**Contradictory evidence (if any):**
- {{conflicting source - what it says and where}}

**Alternatives considered:** {{if_known}}
**Rationale:** {{why_this_choice - if documented or inferable}}

---

### DEC-002: {{decision_title}}

...

---

## Summary

| Confidence | Count | Percentage |
|-----------|-------|-----------|
| Documented | {{n}} | {{%}} |
| Inferred (high) | {{n}} | {{%}} |
| Inferred (low) | {{n}} | {{%}} |
| Contradicted | {{n}} | {{%}} |
| Unknown | {{n}} | {{%}} |

## Action Required

**Decisions marked "Unknown" must be re-made explicitly before spec generation.**
These represent lost institutional knowledge. A human must decide whether to:
- Keep the current implementation (ratify)
- Change it (document new decision + rationale)
- Flag for investigation (need more context)

**Decisions marked "Contradicted" must be resolved before spec generation.**
The contradiction must be examined and one source designated as authoritative.

**Decisions marked "Inferred (low)" should be reviewed by someone with domain knowledge.**
These are guesses - they may be wrong.
