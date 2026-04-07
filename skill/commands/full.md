# coderec full - Complete Codebase Reconnaissance

> STATUS: DESIGN PHASE

Runs all four layers sequentially on the entire codebase, then executes all verification gates.

## Usage

```
coderec full --sot /absolute/path/to/codebase
```

**`--sot` is required.** See SKILL.md "Critical Rule: Source of Truth."

## Flow

```
0. SOT Initialization (mandatory)
   - Validate SOT_ROOT exists: ls SOT_ROOT/
   - Detect SOT mode:
     a. If --sot-mode snapshot (or no .git directory):
         - Compute SNAPSHOT_HASH: Merkle tree of per-file content hashes (see SKILL.md)
         - Record SOT_MODE=snapshot, SNAPSHOT_HASH, SNAPSHOT_DATE
         - Skip git checks. Layer 4 runs in code-only mode (no blame).
         - CID STATUS ceiling: VALID (snapshot mode is a valid SOT)
     b. If --allow-dirty:
         - Pin COMMIT_SHA: git -C SOT_ROOT rev-parse HEAD
         - Record SOT_MODE=git, DIRTY_AT_START=yes
         - Record diff summary: git -C SOT_ROOT diff --stat
         - Record DIRTY_FINGERPRINT_START: SHA-256(`git -C SOT_ROOT diff --binary`)
         - CID STATUS ceiling: DEGRADED (dirty source)
     c. Default (clean git):
         - Pin COMMIT_SHA: git -C SOT_ROOT rev-parse HEAD
         - Record SOT_MODE=git, DIRTY_AT_START=no
         - Check clean state: git -C SOT_ROOT status --porcelain (must be empty)
         - FAIL THE RUN if dirty and --allow-dirty not set
   - All subsequent reads use absolute paths prefixed with SOT_ROOT

1. Layer 1: Cartography
   - Read file tree + dependency graph from SOT_ROOT
   - Identify module boundaries (see SKILL.md boundary heuristics)
   - Map external dependencies
   - Output: system_map.md (includes mode-specific SOT header fields)

2. Layer 2: Module Intelligence (loop)
   - For each module identified in Layer 1:
     - Read module source code from SOT_ROOT + system_map as context
     - Extract: purpose, public API, internal state, contracts, assumptions
     - Every verbatim contract entry includes Source: file_path:line_number
     - Output: modules/<name>.md

3. Layer 3: Cross-Module Synthesis
   - Input: ALL Layer 2 intelligence cards
   - Targeted source re-reads permitted for specific evidence verification
   - Find: contradictions, dead code, implicit coupling, undocumented invariants
   - Output: coherence_report.md

3.5. Adversarial Validation (Steelman)
   - For EVERY finding in the coherence report, execute three checks:
     a. Steelman: argue AGAINST it being a problem, citing codebase evidence
        (comments, ADRs, commit messages, architectural patterns, SEC-* docs).
        The argument must be specific to THIS codebase, not generic.
     b. RWIA (Real-World Impact Assessment): describe a concrete scenario where
        this finding causes a production failure. If no scenario can be
        constructed, state "none found."
     c. Evidence grade: classify as STRUCTURAL (import graph, type system,
        gate-verified contracts) or SPECULATIVE (naming, conventions, absence
        of evidence).
   - Assign verdict per finding:
     - CONFIRMED: steelman fails + RWIA scenario exists + structural evidence
     - DOWNGRADED: steelman partially holds or RWIA scenario is unlikely
     - DROPPED: steelman fully holds + no RWIA scenario + speculative evidence
   - CONFIRMED and DOWNGRADED findings proceed to triage (with steelman attached).
   - DROPPED findings go to the Adversarial Validation Appendix in coherence_report.md.
   - Targeted source re-reads permitted within Layer 3 re-read budget.
   - Output: updated coherence_report.md (Adversarial Validation section + Appendix)

4. Layer 4: Decision Archaeology
   - If SOT_MODE = git (default):
     - Input: Layer 2 cards + git blame + comments + commit messages from SOT_ROOT
     - git blame requires reading source - this is a mandated re-read
   - If SOT_MODE = snapshot (non-git):
     - Skip git blame entirely. Analyze code comments and naming patterns only.
     - All decisions default to "Inferred" or "Unknown" confidence.
     - Record: "SOT_MODE: snapshot - no git history available"
   - Classify each decision: documented / inferred (high) / inferred (low) / contradicted / unknown / no history
   - Output: decision_register.md

5. Verification: Internal Gates (mandatory, blocking)
   - Gates 1-7 execute sequentially.
   - Gate severity determines CID status (see truth table below).
   - CID must not be passed to downstream tools while status is INVALID.

   5a. Gate 1 - Path Verification
       For each file path in system_map.md and all module cards:
       - Run: glob SOT_ROOT/<path>
       - Verify file exists at SOT_ROOT (not CWD)
       - Spot-check 5-10 directories: count files, verify structure matches system_map
       - For each module card: verify ALL claimed exports exist in the file (full export-set, not single-sample)
       - Resolve aliased imports via resolver config before path checks
       - Denominator for unresolved-import ratio = total aliased import references that require resolver mapping
       - Track unresolved aliased import ratio:
         <=20% warning only, >20% DEGRADED, >50% INVALID
       - Denominator for unresolved internal dependency-edge ratio = total internal edges discovered in Layer 1 before unresolved filtering
       - Track unresolved internal dependency-edge ratio from Layer 1:
         <=10% warning only, >10% DEGRADED, >30% INVALID
       - FAIL if any path does not resolve against SOT_ROOT

   5b. Gate 2 - Version Verification
       For each dependency in system_map Version Snapshot:
       - Detect ecosystem from manifest type
       - Read deterministic version source at SOT_ROOT per ecosystem:
         npm: package-lock.json / yarn.lock / pnpm-lock.yaml
         Python: poetry.lock / requirements.txt (pinned) / uv.lock
         Go: go.mod required module versions (go.sum for checksum corroboration only)
         Rust: Cargo.lock
         Java: gradle.lockfile or committed dependency lock/tree artifact
       - Compare CID version against lock file pinned version
       - If deterministic source is absent: mark UNVERIFIABLE (not MATCH or FAIL)
       - MISMATCH = FAIL. UNVERIFIABLE = DEGRADED.

   5c-pre. Secret Scan (pre-step for Gates 3/6)
       - Scan ALL verbatim sections in ALL module cards for unredacted secrets
       - Check for: API key patterns, connection strings, private key headers, high-entropy strings
       - If ANY secret found -> CID STATUS: INVALID. Redact and re-run.

   5c. Gate 3 - Contract Verification
       For each verbatim contract in module cards:
       - Read source file at the provenance anchor (Source: file_path:line_number)
       - Verify the export NAME at the provenance line matches the Export column (not just hash)
       - If CID snippet has no [REDACTED]: compare CID signature against source signature
       - If CID snippet contains [REDACTED]: compare CID hash against source hash (not raw text)
       - FAIL if any signature mismatches OR if export name at anchor doesn't match claimed name

   5d. Gate 4 - Schema Verification
       For each schema/type in module cards:
       - Read source schema file at SOT_ROOT
       - Compare CID type against source type exactly (if source says `any`, CID must say `any`)
       - FAIL if any type mismatches

   5e. Gate 5 - CSS Token Verification
       For each CSS value in module cards:
       - Read globals.css / theme file at SOT_ROOT
       - Compare CID value against source value
       - FAIL if any value mismatches

   5f. Gate 6 - Behavior Verification
       Pre-check (Module Type independent verification):
       - For each module card, check if directory contains .tsx/.jsx/.vue/.svelte files
         or route/middleware markers
       - If yes but Module Type is utility/library/service -> flag SUSPICIOUS
       - SUSPICIOUS modules MUST have Behavior Contracts regardless of claimed type
       - FAIL if SUSPICIOUS module has 0 behavior entries

       For each Behavior Contract entry in module cards:
       - Read source file at the provenance anchor (Source: file:line)
       - If CID snippet has no [REDACTED]: compare CID code snippet against source text
       - If CID snippet contains [REDACTED]: compare CID hash against source hash (not raw text)
       - Verify critical HTML attributes match source
       - Verify metadata/config objects match source
       - Verify middleware/routing logic matches source
       - Enforce completeness by module type:
         - Determine required behavior checklist from Module Type
         - Count required items vs observed captured items
         - FAIL if any required behavior item is missing, even if all declared snippets match
       - FAIL if any behavior contract mismatches

   5g. Gate 7 - Cross-Reference Consistency
       Verify all CID files agree on module names, paths, IDs, and references (BIDIRECTIONAL):
       - Every module in system_map MUST have a corresponding module card (detect skipped modules)
       - Every module card MUST correspond to a system_map entry (detect orphan cards)
       - Module paths in all coherence_report sections exist as module cards
       - Module IDs follow the deterministic algorithm everywhere
       - File paths in decision_register match system_map paths
       - No orphan references in either direction across CID files
       - FAIL if any inconsistency found

   5h. End-of-Run SOT Revalidation
       - If SOT_MODE=snapshot:
         - Re-compute SNAPSHOT_HASH and compare to initial value
         - If changed -> CID STATUS: STALE (reason: CONTENT_CHANGED)
       - If SOT_MODE=git and DIRTY_AT_START=yes:
         - Re-check: git -C SOT_ROOT rev-parse HEAD == original COMMIT_SHA
         - Re-compute DIRTY_FINGERPRINT_END: SHA-256(`git -C SOT_ROOT diff --binary`)
         - If HEAD changed -> CID STATUS: STALE (reason: HEAD_MOVED)
         - If dirty fingerprint changed -> CID STATUS: STALE (reason: DIRTY_CONTENT_CHANGED)
       - If SOT_MODE=git and DIRTY_AT_START=no:
         - Re-check: git -C SOT_ROOT rev-parse HEAD == original COMMIT_SHA
         - Re-check: git -C SOT_ROOT status --porcelain is empty
         - If HEAD moved or tree became dirty -> CID STATUS: STALE

   Gate status truth table:

   | Gate | FAIL severity | What it means |
   |------|--------------|---------------|
   | 1 - Path/Resolver quality | INVALID/DEGRADED | Wrong files or excessive unresolved imports/edges |
   | 2 - Version | DEGRADED | Versions inaccurate, structure still correct |
   | 3 - Contract | INVALID | CID misrepresents the codebase |
   | 4 - Schema | DEGRADED | Type accuracy issue |
   | 5 - CSS | DEGRADED | Visual accuracy issue |
   | 6 - Behavior | INVALID | CID misrepresents runtime behavior |
   | 7 - Cross-ref | INVALID | CID files internally inconsistent |

   CID status resolution:
   - Gate-derived status: INVALID if any INVALID gate fails; else DEGRADED if any DEGRADED condition exists; else VALID.
   - Apply run-state ceiling: if DIRTY_AT_START=yes, status cannot exceed DEGRADED.
   - Apply end-of-run staleness: STALE overrides DEGRADED/VALID, but never overrides INVALID.
   - Publish both human status text and machine status enum (`VALID|INVALID|DEGRADED|STALE`) in verification output.

6. CID Handoff: Triage (human decision artifact)
   - Generate triage.md from coherence_report.md findings
   - For each finding (contradictions, dead code, type gaps, coupling, invariants, duplication):
     - Present the finding with its severity and CID evidence
     - List decision options (FIX / ACCEPT / DEFER / INVESTIGATE)
     - Leave the Decision column blank for human input
   - The human fills in decisions before passing to downstream tools
   - Stream Coding (or any SDD tool) reads triage.md and generates specs
     ONLY for items marked FIX. Items marked ACCEPT are ratified.
   - Output: triage.md

7. STOP. Do not modify SOT_ROOT.
   - The CID is complete. coderec's job ends here.
   - Triage decisions marked FIX are handed off to downstream tooling
     (stream-coding, manual dev). coderec MUST NOT act on them.
   - If the user asks to "fix" or "apply" triage findings during the
     coderec run, record the decision in triage.md and explain that
     remediation is a downstream responsibility.

8. Verification: External Gates (recommended, not blocking)
   - Run Clarity Gate on CID -> epistemic quality
   - Run specverify base on CID -> structural completeness
   - Human review of decision register
   - Output: verification_status.md
```

## Context Window Management

### Token budgets (concrete limits)

> Expressed as concrete, measurable limits - not percentages of context window (which agents cannot measure).

| Layer | Concrete limit | Overflow behavior |
|-------|---------------|-------------------|
| 1 - Cartography | Max 500 files' import statements in a single pass | If >500 files: split by top-level directory, process sequentially, merge system_map |
| 2 - Module Intelligence | Max 2000 LOC per module per pass | If >2000 LOC: process in deterministic chunks (split by file, alphabetical). Keep Layer 1 boundary fixed. Do NOT create new sub-modules. |
| 3 - Cross-Module Synthesis | Max 30 module cards in a single pass | If >30: process in batches, then run cross-batch reconciliation pass on extracted findings |
| 4 - Decision Archaeology | Max 200 commits per module | If >200 relevant commits: use most recent 200, record lookback limit |
| 5-7 - Verification | Max 50 verification checks per gate per pass | If >50: verify in batches. Do not skip gates. |

### Re-read budget

- Layer 3 targeted re-reads: max 5 per module, max 50 total across all modules.
- Layer 4 git blame: unlimited (mandated re-read), but limited to files in the module being analyzed.
- If re-read budget is exceeded: stop re-reading, record "re-read budget exhausted" in coherence report. Affected findings marked as "unverified."
- If any layer is marked "partial coverage" or "unverified due budget", CID status ceiling becomes DEGRADED.

### General rules

Code is read primarily in Layer 2. Layers 3-4 work from compacted cards but may re-read source for evidence verification or git blame. The goal is minimal re-reads, not zero re-reads.
