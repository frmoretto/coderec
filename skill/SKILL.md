---
name: coderec
description: "Codebase reconnaissance for brownfield projects. Progressive disclosure protocol that transforms existing codebases into Codebase Intelligence Documents (CIDs) - verified, structured artifacts that any SDD methodology can consume. Four layers: Cartography -> Module Intelligence -> Cross-Module Synthesis -> Decision Archaeology. Triggers on 'analyze codebase', 'brownfield', 'understand existing code', 'coderec', 'code reconnaissance', 'reverse engineer specs'. Use BEFORE writing specs for existing codebases."
---

# coderec v0.1 - Codebase Reconnaissance Protocol

> **STATUS: DESIGN PHASE.** This skill defines the protocol. Implementation in progress.

## What coderec Does

Transforms brownfield codebases into **Codebase Intelligence Documents (CIDs)** through progressive disclosure - four layers, each building on the previous layer's compacted output.

| Layer | Name | Input | Output |
|-------|------|-------|--------|
| 1 | **Cartography** | File tree, imports, entry points | System map (boundaries, modules, dependencies) |
| 2 | **Module Intelligence** | One module + Layer 1 map | Intelligence card (purpose, contracts, assumptions) |
| 3 | **Cross-Module Synthesis** | All Layer 2 cards (NOT code) | Coherence report (contradictions, dead paths, coupling) |
| 3.5 | **Adversarial Validation** | All Layer 3 findings | Steelmanned findings (confirmed / downgraded / dropped) |
| 4 | **Decision Archaeology** | Cards + git blame + comments | Decision register (documented / inferred / unknown) |

### Layer 3.5: Adversarial Validation (Steelman)

Before findings reach triage, the agent challenges each one adversarially. For every finding in the coherence report:

1. **Steelman** — argue FOR the current behavior being correct, using codebase evidence (not generic reasoning).
2. **RWIA (Real-World Impact Assessment)** — describe a concrete production failure scenario, or state "none found."
3. **Evidence grade** — classify as STRUCTURAL (import graph, type system, gate-verified) or SPECULATIVE (naming, conventions, absence of evidence).

Verdicts: **CONFIRMED** (steelman fails, real impact, structural evidence) | **DOWNGRADED** (partial steelman or unlikely impact) | **DROPPED** (steelman holds, no impact, speculative). Dropped findings are retained in an appendix for audit but do not reach triage. This prevents false positives from generating unnecessary specs downstream.

## Critical Rule: Source of Truth

Before any reconnaissance, **bind** the Source of Truth as a required parameter:

```
SOT_ROOT: /absolute/path/to/production/codebase
SOT_MODE: git | snapshot
COMMIT_SHA: abc123def (git mode only; output of `git rev-parse HEAD` at SOT_ROOT)
SNAPSHOT_HASH: <sha256-merkle> (snapshot mode only)
DIRTY_AT_START: no | yes (git mode only; output of `git status --porcelain`)
DIRTY_FINGERPRINT_START: <sha256> (git dirty mode only)
```

### Initialization (mandatory, before Layer 1)

1. Validate `SOT_ROOT` exists: `ls SOT_ROOT/` - fail the run if directory does not exist.
2. In git mode, pin `COMMIT_SHA`: run `git -C SOT_ROOT rev-parse HEAD` - record the result.
3. In git clean mode, check clean state: run `git -C SOT_ROOT status --porcelain` - fail if output is non-empty (unless `--allow-dirty` is set).
4. Record run-state fields in CID headers and verification_status.md:
   - Always: `SOT_ROOT`, `SOT_MODE`
   - Git mode: `COMMIT_SHA`, `DIRTY_AT_START`, `DIRTY_FINGERPRINT_START` (if dirty)
   - Snapshot mode: `SNAPSHOT_HASH`, `SNAPSHOT_DATE`

### Non-git mode (`--sot-mode snapshot`)

If SOT_ROOT is not a git repository (tarball drop, vendor snapshot, SVN checkout):

1. Skip steps 2-3 (no `git rev-parse`, no dirty check).
2. Compute `SNAPSHOT_HASH`: SHA-256 of a Merkle tree built from per-file content hashes (sorted by path). Do NOT use file sizes or timestamps - only content digests.
   Canonicalization rules for Merkle input:
   - Path key is SOT-relative with `/` separators and no leading `./`
   - Sort path keys byte-wise ascending
   - Hash raw file bytes exactly (no line-ending normalization)
   - Do not follow symlinks; treat symlink target text as link-content for hashing
   - Include regular files only; exclude VCS/cache/build folders from the exclusion list
3. Record `SOT_MODE: snapshot`, `SNAPSHOT_HASH`, and `SNAPSHOT_DATE` in CID header.
4. End-of-run revalidation: re-compute Merkle hash and compare. If changed -> STALE.
5. Staleness detection in scoped mode uses content hash comparison instead of git diff.

**Limitations in snapshot mode:**
- **Layer 4 (Decision Archaeology) is conditional:** skip git blame entirely. Layer 4 runs in "code-only" mode - analyze code comments and naming patterns only. All decisions default to "Inferred" or "Unknown" confidence. Mark `SOT_MODE: snapshot - no git history` in decision register header.
- Staleness detection is coarser (any content change invalidates, no per-path diffing).
- Version verification (Gate 2) may be limited if no lock files exist.

### Dirty mode (`--allow-dirty`)

If the working tree has uncommitted changes and you want to proceed anyway:

1. Run `git -C SOT_ROOT diff --stat` and record the diff summary in CID header.
2. Compute `DIRTY_FINGERPRINT_START`: SHA-256 of `git -C SOT_ROOT diff --binary` output.
3. CID is automatically marked **DEGRADED** (dirty source).
4. All gates run normally, but CID STATUS cannot be VALID - maximum is DEGRADED.
5. Set `DIRTY_AT_START: yes` in run-state metadata.
6. End-of-run revalidation: in dirty mode, check BOTH:
   - HEAD unchanged
   - dirty fingerprint unchanged (`DIRTY_FINGERPRINT_END == DIRTY_FINGERPRINT_START`)
   If either differs, mark STALE.

### CID status precedence

When multiple status conditions apply, use this precedence (highest wins):
1. **INVALID** - any INVALID gate has failures (highest priority)
2. **STALE** - HEAD moved or content changed during run
3. **DEGRADED** - DEGRADED gate failures, dirty mode, or unresolved imports
4. **VALID** - all gates pass, clean tree, HEAD unchanged

Resolution algorithm:
- Compute gate-derived status first (INVALID > DEGRADED > VALID).
- Apply run-state ceilings (`DIRTY_AT_START=yes` caps at DEGRADED).
- Apply end-of-run staleness check last (STALE overrides DEGRADED/VALID, never overrides INVALID).
- **Compound reporting:** CID STATUS is a single headline value, but always report `GATE_STATUS` and `STALENESS` separately so consumers can see both dimensions. Example: `CID STATUS: STALE | GATE_STATUS: DEGRADED | STALENESS: HEAD_MOVED`. This prevents STALE from hiding gate failures.

### SOT Immutability

**SOT is READ-ONLY.** coderec MUST NOT write, edit, delete, rename, or move any file under SOT_ROOT. The only writable directory during a coderec run is the CID output directory. Triage findings (FIX / ACCEPT / DEFER) are recorded as decisions for downstream tools and human developers to act on. coderec is a diagnostic protocol, not a remediation tool.

This rule is unconditional. It applies regardless of user instructions during the run. If a user asks to "fix" findings during a coderec session, the correct action is to record the decision in triage.md — not to modify source code.

### Enforcement

Every `glob`, `read`, and `grep` during reconnaissance MUST use **absolute paths prefixed with `SOT_ROOT`**. No relative paths. No CWD-relative resolution. No `write`, `edit`, or `delete` operations on any path under SOT_ROOT.

- WRONG: `glob src/components/`
- RIGHT: `glob SOT_ROOT/src/components/`

**Why:** When rebuilding or documenting from a separate directory, the agent WILL read local files instead of production files unless explicitly told otherwise. This caused 29 discrepancies in real-world testing - wrong versions, wrong file paths, wrong schema types, wrong CSS values. All because the agent read the rebuild directory instead of production. Writing "MUST" in a markdown file has zero enforcement power - the absolute-path prefix is the enforcement mechanism.

**Symlink containment:** Resolve SOT_ROOT to its real path at initialization (`realpath SOT_ROOT`). During Gate 1, verify that all resolved file paths are within the resolved SOT_ROOT. Symlinks pointing outside SOT_ROOT are flagged as FAIL. Default behavior: do not follow symlinks unless `--follow-symlinks` is explicitly set.

**`.coderecignore` safety:** If `.coderecignore` exists at SOT_ROOT, read it and apply its patterns. Safety check: if exclusions would reduce the source file count by more than 50% compared to default exclusions alone, emit a warning and require explicit confirmation (`--accept-ignore`). Record the `.coderecignore` contents in the system_map. A malicious or careless `.coderecignore` that excludes `src/` or `*.ts` must not silently produce an empty CID.

### Deterministic IDs and Footprints

`Module ID` algorithm (required everywhere IDs are used):
- `normalized_module_path` = SOT-relative path, `/` separators, no trailing slash
- `module_id` = `mod_` + first 16 hex chars of `SHA-256(normalized_module_path)`

`Dependency footprint` algorithm (for scoped staleness):
1. Collect SOT-relative files outside the module that the module directly depends on:
   - env/config/schema files it reads
   - shared types/contracts imported from shared directories
   - framework/global runtime config consumed by the module
2. Normalize each path using the same normalization as Module ID input.
3. Sort + deduplicate.
4. `dependency_footprint_hash` = SHA-256 of joined lines:
   - `<normalized_path>\t<sha256_of_file_bytes>\n`

## Module Boundary Algorithm

Layer 1 (Cartography) must identify module boundaries deterministically. Different agents analyzing the same codebase at the same commit MUST produce equivalent boundaries. Use the following precedence - first match wins:

### Precedence (highest to lowest)

Boundaries are **nestable**: a package (level 1) can contain framework submodules (level 4). When a higher-level boundary contains a lower-level boundary, the lower-level boundary creates a sub-module within the parent. Example: workspace package `packages/web/` (level 1) contains Next.js `app/`, `pages/`, `api/` (level 4) - result is 3 sub-modules inside 1 package.

1. **Package boundary** - a directory with its own `package.json`, `go.mod`, `pyproject.toml`, `Cargo.toml`, or equivalent manifest. Each is one module. In monorepos, each workspace package is a module. Framework conventions (level 4) apply WITHIN each package.

2. **Deploy unit** - a directory that represents an independently deployable unit. Required markers (at least 2 of 3): own manifest file, own deploy descriptor (`Dockerfile`, `serverless.yml`, CI job config), own entrypoint. A single marker is insufficient - flag as Medium confidence.

3. **Barrel/index boundary** - a directory with an `index.ts`, `index.js`, `__init__.py`, or `mod.rs` that re-exports a public API. The directory and its contents are one module.

4. **Framework convention** - directories matching framework patterns:
   - Next.js: `app/`, `pages/`, `api/` are separate modules WITHIN their parent package
   - Django: each app (`models.py` + `views.py` + `urls.py`) is one module
   - Express: `routes/`, `middleware/`, `models/` are separate modules
   - Go: each directory with `.go` files is one module (Go package = directory)
   - Rust: each directory with `mod.rs` or `lib.rs` is one module
   - Python: each directory with `__init__.py` is one module
   - For unlisted frameworks: use the framework's own grouping conventions if identifiable, otherwise fall through to level 5

5. **Domain directory** - directories at depth 1-2 under `src/` (or project root) that share a domain name: `src/auth/`, `src/billing/`, `src/api/`. Each is one module.

6. **Fallback: directory grouping** - any remaining directory with 3+ source files is one module. Directories with 1-2 files are grouped into the nearest ancestor that is itself a module (walk up the tree until a module boundary is found).

### Tie-break rules

When multiple precedence levels could apply to the same directory:
- **Higher number wins for subdivision**: if a directory matches level 1 (package) AND level 4 (framework), level 4 creates sub-modules WITHIN the level 1 module.
- **Same-level conflict** (polyglot-safe):
  1. Use ecosystem-specific manifests first (`package.json`, `pyproject.toml`, `go.mod`, `Cargo.toml`, `pom.xml`, `build.gradle`) to detect the active framework.
  2. If still ambiguous, use marker-file density (which framework's canonical files are more prevalent in that subtree).
  3. If still tied, choose lexicographically by module path and mark confidence as Medium.
- **"Nearest ancestor" for fallback**: level 6 files are grouped into the closest ancestor module, not the root. Walk up the directory tree.

### Exclusion list (never modules)

These directories are excluded from boundary detection. Never treat them as modules:

```
node_modules/  dist/  build/  .next/  .nuxt/  out/  coverage/
vendor/  __pycache__/  .git/  .svn/  .hg/  target/  bin/
*.min.js  *.bundle.js  *.map  generated/  .cache/
```

Override: if a `.coderecignore` file exists at SOT_ROOT, read it and add to the exclusion list (gitignore syntax).

### Confidence scoring

Each boundary gets a confidence level:

| Confidence | Criteria | Action |
|-----------|----------|--------|
| **High** | Matched precedence 1-3 (manifest, deploy unit, or barrel file) | Proceed to Layer 2 |
| **Medium** | Matched precedence 4-5 (framework or domain convention) | Proceed, flag for human review |
| **Low** | Matched precedence 6 (fallback directory grouping) | Proceed, but list alternatives in system_map |

### Layer 1 Verification Gate

Before proceeding to Layer 2, verify boundary decisions:

1. Sample boundaries: `max(5, ceil(10% of total))`, stratified by both confidence tier AND precedence level (at least 1 boundary per precedence level used).
2. ALL Low-confidence boundaries must be checked (not just sampled).
3. For each checked boundary, re-check:
   - Does the directory exist at SOT_ROOT?
   - Does the boundary match one of the precedence rules above?
   - Are there obvious alternative groupings that would be better?
4. If >2 checked boundaries fail re-check, re-cartography with coarser grouping is mandatory.
5. Record all confidence levels in system_map.md Module Boundaries table.

### Processing order

Modules are processed in Layer 2 in **dependency-topological order** (leaf modules first, root modules last). If cycles exist, break by alphabetical order of module path. Record the processing order in the system_map.

### Edge extraction algorithm (for topological sort)

A dependency edge exists from module A to module B when A imports from B. Extract edges as follows:

1. **Static imports:** scan all source files in module A for import/require statements. Resolve the target to a module using the boundary map from Layer 1.
   - TypeScript/JS: `import ... from '...'`, `require('...')`
   - Python: `import ...`, `from ... import ...`
   - Go: `import "..."`
   - Rust: `use ...`, `mod ...`

2. **Alias resolution:** if the import target uses an alias (`@/`, `~/`, workspace links), resolve using the project's resolver config (tsconfig paths, vite aliases, etc.). If unresolvable, record as "unresolved edge" and exclude from sort.

3. **Dynamic imports:** `import('...')`, `__import__()`, `require.resolve()` - include if target is a string literal. Ignore if target is a variable (cannot resolve statically).

4. **Unresolved edges:** edges where the target module cannot be determined are excluded from the topological sort but recorded in the system_map as "unresolved dependencies."
   Denominator for unresolved-edge ratio = total internal dependency edges discovered before unresolved filtering.
   - Unresolved edge ratio <=10% of internal edges: warning only
   - >10%: CID status ceiling DEGRADED
   - >30%: CID INVALID (dependency order not trustworthy)

5. **Cycle breaking:** if the dependency graph has cycles, break by removing the edge with the fewest import statements (weakest coupling). If tied, break alphabetically by module path. Record which edges were broken and why.

## Commands

### `coderec full`
Run all four layers sequentially. Full codebase analysis. Read [commands/full.md](commands/full.md).

### `coderec scope <path>`
Run layers 1-4 scoped to a specific module or directory. Read [commands/scope.md](commands/scope.md).

### `coderec cartography`
Layer 1 only - quick system map. Read [commands/cartography.md](commands/cartography.md).

## Output: Codebase Intelligence Document (CID)

```
CID/
+-- system_map.md          <- Layer 1: boundaries, versions, env, conventions
+-- modules/
|   +-- auth.md            <- Layer 2: intelligence card + verbatim contracts
|   +-- billing.md
|   \-- ...
+-- coherence_report.md    <- Layer 3: contradictions, dead code, type gaps
+-- decision_register.md   <- Layer 4: documented / inferred / unknown
+-- verification_status.md <- 7-gate verification against source
\-- triage.md              <- Handoff: human decisions (FIX/ACCEPT/DEFER/INVESTIGATE)
```

## Templates

| Template | Layer | Purpose |
|----------|-------|---------|
| [system_map.md](templates/system_map.md) | 1 | Version snapshot, entry points, module boundaries, env contract, conventions |
| [module_card.md](templates/module_card.md) | 2 | Public API, verbatim contracts (exports, schema, CSS, composition), assumptions |
| [coherence_report.md](templates/coherence_report.md) | 3 | Contradictions, dead code, implicit coupling, type gaps, duplication |
| [decision_register.md](templates/decision_register.md) | 4 | Decisions with confidence levels + action required for unknowns |
| [verification_status.md](templates/verification_status.md) | Gate | 7-gate verification: paths, versions, contracts, schema, CSS, behavior, cross-reference |
| [triage.md](templates/triage.md) | Handoff | Human decision menu: FIX / ACCEPT / DEFER / INVESTIGATE per finding |

## Verification

The CID is a derived artifact - it can be wrong. Before using as spec input:

### Internal gates (automated, run by coderec - blocking)

1. **Path verification** -> every file path resolves against SOT_ROOT + spot-check structure + export ownership + resolver-quality thresholds for unresolved imports/internal edges. **Hard path FAIL = INVALID; resolver-threshold breach = DEGRADED/INVALID per threshold.**
2. **Version verification** -> every version matches lock file at SOT_ROOT. **FAIL = DEGRADED.**
3. **Contract verification** -> every verbatim contract matches source at provenance anchor. **FAIL = INVALID.**
4. **Schema verification** -> every type matches source exactly (`any` if source says `any`). **FAIL = DEGRADED.**
5. **CSS token verification** -> every CSS value matches globals.css / theme at SOT_ROOT. **FAIL = DEGRADED.**
6. **Behavior verification** -> every behavior contract (render paths, HTML attrs, metadata, routing) matches source. **FAIL = INVALID.**
7. **Cross-reference consistency** -> all CID files agree on module names, paths, IDs, references. **FAIL = INVALID.**

### External gates (separate tools - recommended, not blocking)

8. **Clarity Gate** -> epistemic quality (assumptions marked? inferences qualified?)
9. **specverify base** -> structural completeness (can SDD tool consume this?)
10. **Human review** -> decision register accuracy (only humans know if inferences are correct)

See [templates/verification_status.md](templates/verification_status.md) for the full verification template.

## CID/Spec Boundary

coderec produces a CID. A CID is NOT a spec. The boundary:

| | CID (coderec) | Spec (stream-coding / other SDD) |
|-|---------------|----------------------------------|
| **Purpose** | Document what EXISTS | Prescribe what SHOULD exist |
| **Tense** | Present - "the system does X" | Future - "the system shall do X" |
| **Quality issues** | Observed and flagged (Quality Flags) | Resolved with prescribed fix |
| **Type gaps** | Observed: "field uses `any`" | Prescribed: "field shall use `string`" |
| **Dead code** | Identified as candidate | Decision: remove or keep |
| **Decisions** | Classified by confidence | Ratified, changed, or deferred |

**Rule:** coderec observes. It does NOT prescribe. Quality Flags and Type Gaps in the CID record what's wrong without saying how to fix it. Remediation is downstream spec work.

## Ecosystem

```
coderec      ->  understand your codebase  ->  CID (what IS)
specverify   ->  verify your specs         ->  report
stream-coding -> write your specs          ->  code (what SHOULD BE)
```

---

*coderec by Francesco Marinoni Moretto - MIT License*
*github.com/frmoretto/coderec*
