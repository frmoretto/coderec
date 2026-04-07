# Verification Status - Template

**Project:** {{project_name}}
**Date:** {{date}}
**SOT_ROOT:** {{absolute_path}}
**SOT_MODE:** {{git|snapshot}}
**COMMIT_SHA:** {{sha_or_N/A}}
**SNAPSHOT_HASH:** {{sha256_merkle_or_N/A}}
**DIRTY_AT_START:** {{yes|no|N/A}}
**DIRTY_FINGERPRINT_START:** {{sha256_or_N/A}}
**CID STATUS:** `VALID` | `INVALID ({{n}} failures)` | `STALE (source changed during run)` | `DEGRADED ({{n}} warnings)`
**CID STATUS MACHINE VALUE:** `VALID` | `INVALID` | `DEGRADED` | `STALE`

> **Status truth table:**
> - Any FAIL in Gate 1, 3, 6, or 7 -> CID STATUS: **INVALID**. Fix and re-verify. Do not pass to downstream tools.
> - No INVALID failures, but FAIL in Gate 2, 4, 5 or any coverage-limit condition -> CID STATUS: **DEGRADED**.
> - Dirty mode (`DIRTY_AT_START=yes`) caps status at **DEGRADED** even if all gates pass.
> - End-of-run staleness (`HEAD_MOVED` or `CONTENT_CHANGED`) sets **STALE** unless status is already INVALID.
> - All gates 0 FAIL, no ceilings, no staleness -> CID STATUS: **VALID**.

---

## SOT Verification

| Check | Method | Result |
|-------|--------|--------|
| SOT_ROOT exists | `ls SOT_ROOT/` | PASS / FAIL |
| SOT mode recorded | Header field | PASS / FAIL |
| COMMIT_SHA pinned (git mode) | `git -C SOT_ROOT rev-parse HEAD` | {{sha}} / N/A |
| SNAPSHOT_HASH pinned (snapshot mode) | Merkle content hash at run start | {{hash}} / N/A |
| Working tree clean (git clean mode) | `git -C SOT_ROOT status --porcelain` | PASS (empty) / FAIL (dirty) / N/A |
| Dirty mode acknowledged | `DIRTY_AT_START=yes` with diff summary recorded | PASS / FAIL / N/A |
| Dirty fingerprint captured (git dirty mode) | SHA-256(`git diff --binary`) at run start | PASS / FAIL / N/A |

---

## Gate Results

### Gate 1 - Path Verification

> Every file path in the CID must resolve against SOT_ROOT. Spot-check directory structure.
> Import paths may use aliases (@/, ~/, workspace links) - resolve these before globbing.

| Check | Method | Result |
|-------|--------|--------|
| All module card paths exist | `glob SOT_ROOT/<path>` for each `module_path` | PASS / {{n}} FAIL |
| All entry point files exist | `read SOT_ROOT/<path>` for each entry point | PASS / {{n}} FAIL |
| All import paths in composition tables resolve | See resolver policy below | PASS / {{n}} FAIL |
| Directory structure spot-check (5-10 dirs) | `ls SOT_ROOT/<dir>` + count files | PASS / {{n}} FAIL |
| Export ownership check | verify ALL claimed exports exist in file (not single-sample) | PASS / {{n}} FAIL |

#### Resolver policy for import paths

> `glob` alone cannot resolve aliased imports. Before verifying composition table paths:

1. **Read resolver config** at SOT_ROOT:
   - TypeScript: `tsconfig.json` -> `compilerOptions.paths` and `baseUrl`
   - Vite: `vite.config.*` -> `resolve.alias`
   - Webpack: `webpack.config.*` -> `resolve.alias`
   - Python: N/A (use filesystem paths directly)
   - Go: N/A (use module paths from `go.mod`)

2. **Resolve each aliased import** to a filesystem path before globbing:
   - `@/components/Button` + tsconfig `"@/*": ["src/*"]` -> `SOT_ROOT/src/components/Button`
   - Add `.ts`, `.tsx`, `.js`, `.jsx`, `/index.ts`, `/index.js` suffixes if needed

3. **If resolver config cannot be read** (missing or unsupported bundler):
   - Flag as UNRESOLVED (not FAIL)
   - Record which imports could not be resolved
   - Note: "{{n}} imports could not be verified due to missing resolver config"

**Gate 1 status:**
- Any path FAIL -> CID **INVALID**
- Unresolved imports <=20% of total -> warning (CID remains VALID)
- Unresolved imports >20% -> CID **DEGRADED**
- Unresolved imports >50% -> CID **INVALID**
- Unresolved internal dependency edges <=10% -> warning
- Unresolved internal dependency edges >10% -> CID **DEGRADED**
- Unresolved internal dependency edges >30% -> CID **INVALID**

Denominator definitions:
- Unresolved import ratio denominator = total aliased import references requiring resolver mapping
- Unresolved internal-edge ratio denominator = total internal edges discovered before unresolved filtering

**Unresolved count:** {{n}} of {{total}} imports ({{%}})
**Unresolved internal edges:** {{n}} of {{total}} edges ({{%}})

### Gate 2 - Version Verification

> Every version in system_map matches the lock file at SOT_ROOT.
> Per-ecosystem resolution: use lock file (npm/Python/Rust/Java) or manifest (Go).
> If no lock file exists, mark UNVERIFIABLE - not MATCH or MISMATCH.

| Dependency | CID Version | Lock File Version | Source | Ecosystem | Status |
|-----------|------------|------------------|--------|-----------|--------|
| {{name}} | {{cid_says}} | {{lockfile_says}} | {{lockfile_path}} | npm / pip / go / cargo / maven | MATCH / MISMATCH / UNVERIFIABLE |

**Gate 2 status:**
- MISMATCH -> CID **DEGRADED**
- UNVERIFIABLE (no lock file) -> CID **DEGRADED** (note: versions cannot be confirmed)
- All MATCH -> PASS

### Secret Scan (pre-step for Gates 3/6)

> Before verifying contracts/behavior, scan ALL verbatim sections for unredacted secrets.
> A CID containing live secrets is INVALID regardless of other gate results.

| Pattern | Matches found | Locations | Status |
|---------|--------------|-----------|--------|
| API key patterns (`sk_`, `pk_`, `AKIA`, `ghp_`, `glpat-`) | {{n}} | {{module:section}} | CLEAN / LEAKED |
| Connection strings (`://.*:.*@`) | {{n}} | {{module:section}} | CLEAN / LEAKED |
| Private key headers (`-----BEGIN.*PRIVATE KEY`) | {{n}} | {{module:section}} | CLEAN / LEAKED |
| High-entropy strings (>40 chars, base64/hex-like) in config/env contexts | {{n}} | {{module:section}} | CLEAN / LEAKED |

> If any LEAKED -> CID STATUS: **INVALID**. Redact the value and re-run affected gates.
> This check runs once before Gate 3 and covers all verbatim content (contracts + behavior).

### Gate 3 - Contract Verification

> Every verbatim contract in module cards matches source at the provenance anchor.

| Module | Export | CID Signature | Source Signature | Provenance | CID Hash | Source Hash | Status |
|--------|--------|--------------|-----------------|------------|----------|------------|--------|
| {{module}} | {{export}} | {{from_card}} | {{from_file}} | {{file:line}} | {{card_hash}} | {{source_hash}} | MATCH / MISMATCH |

> If CID snippet contains `[REDACTED]`, verify by hash + provenance anchor, not raw string equality.

#### Public API <-> Exports consistency check

> Every entry in the Public API table must have a corresponding entry in the Exports table.
> If Public API lists a function that Exports doesn't have (or vice versa), the card is internally inconsistent.

| Module | Discrepancy | Detail | Status |
|--------|------------|--------|--------|
| {{module}} | {{API entry missing from Exports / Export missing from API}} | {{name}} | CONSISTENT / INCONSISTENT |

**Gate 3 FAIL = CID INVALID.** Contract mismatches or internal inconsistencies mean the CID misrepresents the codebase.

### Gate 4 - Schema Verification

> Every schema type in module cards matches the actual schema file at SOT_ROOT.
> Gate 4 verifies accuracy ("does CID match source?"), NOT quality ("is source good?").
> If source uses `any`, CID must say `any`. Type improvement is a Quality Flag, not a gate failure.

| Table.Field | CID Type | Source Type | Provenance | CID Hash | Source Hash | Status |
|------------|----------|------------|------------|----------|------------|--------|
| {{table.field}} | {{from_card}} | {{from_schema}} | {{file:line}} | {{card_hash}} | {{computed_hash}} | MATCH / MISMATCH |

> For large types (>30 fields): verify via hash match only. For small types: field-by-field comparison.
> Display hash = first 16 chars of SHA-256. Automated checks should compare full SHA-256.

**Gate 4 FAIL = CID DEGRADED.** Schema mismatches affect type accuracy.

### Gate 5 - CSS Token Verification

> Every CSS value in module cards matches globals.css / theme at SOT_ROOT.

| Token | CID Value | Source Value | Provenance | Status |
|-------|----------|-------------|------------|--------|
| {{token}} | {{from_card}} | {{from_css}} | {{file:line}} | MATCH / MISMATCH |

**Gate 5 FAIL = CID DEGRADED.** CSS mismatches affect visual accuracy.

### Gate 6 - Behavior Verification

#### 6a. Module Type independent verification (pre-check)

> The agent classifies Module Type during Layer 2. Gate 6 obligations depend on this classification.
> To prevent misclassification bypass, independently verify Module Type before checking behavior coverage.

| Module | Claimed Type | Has UI files (.tsx/.jsx/.vue/.svelte)? | Has route/middleware markers? | Independent Type | Match? |
|--------|-------------|---------------------------------------|------------------------------|-----------------|--------|
| {{module}} | {{claimed}} | yes / no | yes / no | {{derived_from_files}} | YES / SUSPICIOUS |

> If SUSPICIOUS (e.g., module has .tsx files but claims "utility"): override Module Type for coverage
> purposes and require Behavior Contracts regardless of the agent's classification.
> Gate 6 FAILS if a SUSPICIOUS module has no Behavior Contracts.

#### 6b. Behavior contract verification

> Every Behavior Contract entry in module cards must match source at the provenance anchor.
> This gate covers the 11/35 case study errors that are behavioral (render logic,
> HTML attributes, metadata values, routing conditions) and cannot be caught by signature-level gates.

#### Critical Render Paths

| Module | BC # | Behavior | CID Snippet | Source Snippet | Provenance | CID Hash | Source Hash | Status |
|--------|------|----------|-------------|---------------|------------|----------|------------|--------|
| {{module}} | BC-001 | {{behavior}} | `{{from_card}}` | `{{from_source_or_redacted}}` | {{file:line}} | {{card_hash}} | {{source_hash}} | MATCH / MISMATCH |

#### Critical HTML Attributes

| Module | Attribute | Element | CID Value | Source Value | Provenance | CID Hash | Source Hash | Status |
|--------|-----------|---------|-----------|-------------|------------|----------|------------|--------|
| {{module}} | {{attr}} | {{tag}} | `{{from_card}}` | `{{from_source_or_redacted}}` | {{file:line}} | {{card_hash}} | {{source_hash}} | MATCH / MISMATCH |

#### Metadata / Config Objects

| Module | Object | CID Value | Source Value | Provenance | CID Hash | Source Hash | Status |
|--------|--------|-----------|-------------|------------|----------|------------|--------|
| {{module}} | {{object}} | `{{from_card}}` | `{{from_source_or_redacted}}` | {{file:line}} | {{card_hash}} | {{source_hash}} | MATCH / MISMATCH |

#### Middleware / Routing Logic

| Module | Route/Guard | CID Logic | Source Logic | Provenance | CID Hash | Source Hash | Status |
|--------|------------|-----------|-------------|------------|----------|------------|--------|
| {{module}} | {{route}} | `{{from_card}}` | `{{from_source_or_redacted}}` | {{file:line}} | {{card_hash}} | {{source_hash}} | MATCH / MISMATCH |

> Gate 6 redaction rule: when CID field contains `[REDACTED]`, `MATCH` requires hash equality at the provenance anchor.

#### Coverage Completeness (mandatory)

| Module | Module Type | Required Items | Observed Items | Missing Items | Status |
|--------|-------------|----------------|----------------|---------------|--------|
| {{module}} | {{type}} | {{count_or_checklist}} | {{count_or_checklist}} | {{none_or_list}} | COMPLETE / INCOMPLETE |

> Gate 6 completeness rule: `INCOMPLETE` is a Gate 6 FAIL even if all declared snippets match.

**Gate 6 FAIL = CID INVALID.** Behavior mismatches mean the CID misrepresents what the application does.

### Gate 7 - Cross-Reference Consistency

> Verify that all CID files agree on module names, paths, IDs, and references.
> This catches R-06 (name corrected in one file but not another).

| Check | Method | Result |
|-------|--------|--------|
| Module names consistent across system_map and module cards | Compare names | PASS / {{n}} FAIL |
| Module paths consistent across system_map and module cards | Compare paths | PASS / {{n}} FAIL |
| Module IDs follow deterministic ID algorithm | Recompute from normalized module paths | PASS / {{n}} FAIL |
| All module IDs in coherence_report exist as module cards | Cross-reference `Module ID` fields | PASS / {{n}} FAIL |
| All `File Path` fields in decision_register match system_map paths | Cross-reference | PASS / {{n}} FAIL |
| No orphan references (name/path in one file, missing from another) | Full graph check | PASS / {{n}} FAIL |

**Gate 7 FAIL = CID INVALID.** Internal inconsistency means consumers will get contradictory information.

### End-of-Run SOT Revalidation

> Re-check that SOT_ROOT has not changed since run start (TOCTOU protection).

| Check | Method | Result |
|-------|--------|--------|
| Snapshot mode content unchanged | recompute Merkle hash == original SNAPSHOT_HASH | PASS / FAIL / N/A |
| Git HEAD unchanged | `git -C SOT_ROOT rev-parse HEAD` == original COMMIT_SHA | PASS / FAIL / N/A |
| Working tree still clean (only if DIRTY_AT_START=no) | `git -C SOT_ROOT status --porcelain` | PASS / FAIL / N/A |
| Dirty fingerprint unchanged (only if DIRTY_AT_START=yes) | recompute SHA-256(`git diff --binary`) == DIRTY_FINGERPRINT_START | PASS / FAIL / N/A |

> STALE reason codes:
> - `CONTENT_CHANGED` (snapshot hash changed)
> - `HEAD_MOVED` (git HEAD changed)
> - `TREE_DIRTIED` (git clean run became dirty)
> - `DIRTY_CONTENT_CHANGED` (dirty fingerprint changed)

---

## External Gates (recommended, not blocking)

### Clarity Gate (if run)

| Item | Score | Notes |
|------|-------|-------|
| {{clarity_gate_item}} | PASS / FAIL | {{detail}} |

### specverify base (if run)

| Item | Score | Notes |
|------|-------|-------|
| {{specverify_item}} | PASS / FAIL | {{detail}} |

---

## Coverage Limitations

| Limitation | Present? | Affected Scope | Status Impact |
|-----------|----------|----------------|---------------|
| Partial coverage due token budget | yes / no | {{modules_or_layers}} | DEGRADED if yes |
| Verification batched with unverified remainder | yes / no | {{gates_or_modules}} | DEGRADED if yes |
| Re-read budget exhausted | yes / no | {{findings}} | DEGRADED if yes |
| Inbound caller confidence low (scoped mode) | yes / no | {{module_scope}} | DEGRADED if yes |

---

## Summary

| Gate | Pass | Fail | Total | Severity |
|------|------|------|-------|----------|
| 1 - Path verification | {{n}} | {{n}} | {{n}} | INVALID on path FAIL; DEGRADED/INVALID on unresolved thresholds |
| 2 - Version verification | {{n}} | {{n}} | {{n}} | DEGRADED if >0 FAIL |
| 3 - Contract verification | {{n}} | {{n}} | {{n}} | INVALID if >0 FAIL |
| 4 - Schema verification | {{n}} | {{n}} | {{n}} | DEGRADED if >0 FAIL |
| 5 - CSS token verification | {{n}} | {{n}} | {{n}} | DEGRADED if >0 FAIL |
| 6 - Behavior verification | {{n}} | {{n}} | {{n}} | INVALID if >0 FAIL |
| 7 - Cross-reference consistency | {{n}} | {{n}} | {{n}} | INVALID if >0 FAIL |
| **Total** | **{{n}}** | **{{n}}** | **{{n}}** | |
| **SOT revalidation** | | | | STALE on HEAD/content change (mode-specific) |

**CID STATUS:** `VALID` / `INVALID` / `DEGRADED` / `STALE`

## Staleness Risk

> CID is pinned to the recorded source reference for the active SOT mode.

| Layer | Generated | Source Reference | Risk |
|-------|-----------|------------------|------|
| 1 - System Map | {{date}} | {{COMMIT_SHA or SNAPSHOT_HASH}} | Stale if source reference changes |
| 2 - Module Cards | {{date}} | {{COMMIT_SHA or SNAPSHOT_HASH}} | Stale if source reference changes |
| 3 - Coherence Report | {{date}} | {{COMMIT_SHA or SNAPSHOT_HASH}} | Stale if source reference changes |
| 4 - Decision Register | {{date}} | {{COMMIT_SHA or SNAPSHOT_HASH}} | Stale if source reference changes |

**Rule (git mode):** Re-run affected layers when `git -C SOT_ROOT rev-parse HEAD` != recorded COMMIT_SHA.  
**Rule (snapshot mode):** Re-run affected layers when recomputed Merkle hash != recorded SNAPSHOT_HASH.
