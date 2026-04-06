# coderec scope - Scoped Reconnaissance

> STATUS: DESIGN PHASE

Runs all four layers scoped to a specific module or directory.

## Usage

```
coderec scope auth/ --sot /absolute/path/to/codebase
coderec scope src/billing/ --sot /absolute/path/to/codebase
```

**`--sot` is required.** See SKILL.md "Critical Rule: Source of Truth" for initialization steps. All reads use absolute paths prefixed with SOT_ROOT.

## Why Scoped

You don't need to understand billing to fix auth. Scoped mode:
- Runs Layer 1 on the full codebase (fast - file tree only)
- Runs Layers 2-4 only on the specified scope
- Identifies cross-module dependencies **both directions**:
  - Outbound: what does auth call?
  - Inbound: who calls auth? (scan all modules' imports for references to the scoped module)
- Ignores modules that don't interact with the scope

## Dependency Closure

Scoped analysis includes **inbound + outbound** dependencies:

```
Outbound: auth -> billing.createCharge(), auth -> db.getUser()
Inbound:  api.handleLogin() -> auth, middleware.protect() -> auth
```

**Why inbound matters:** If you change `auth.validateSession()` based on a scoped CID that doesn't show `billing` calls it, you'll break `billing` without warning.

**Configurable depth:** Default depth is 1 (direct callers/callees). Use `--depth 2` for transitive deps.

**Closure size cap:** If the dependency closure at the requested depth exceeds 50% of total modules, warn and suggest `coderec full` instead. Record closure size and percentage in the CID header. Override with `--force-scope` if scoped analysis is intentional despite large closure.

**Inbound confidence:** Static import scanning cannot detect all callers (misses DI, reflection, event subscriptions, string-based route registration). Report inbound closure with confidence:
- **High:** all callers found via static imports
- **Medium:** some callers may use runtime wiring (framework detected that uses DI/events)
- **Low:** framework uses heavy reflection or plugin loading - many callers likely missed

Status impact:
- High: no status impact
- Medium: warning in verification_status
- Low: scoped CID status ceiling becomes DEGRADED unless explicitly waived

Record confidence in the module card's Dependencies > Incoming section.

## Incremental Coverage

Each scoped run adds to the CID. Over time, coverage compounds:

```
Sprint 1: coderec scope auth/        -> CID/modules/auth.md
Sprint 2: coderec scope billing/     -> CID/modules/billing.md
Sprint 3: coderec scope api/         -> CID/modules/api.md
...
Layer 3 re-run: coherence across existing modules
```

## Merge and Invalidation Strategy

### Module card provenance

Every module card includes a provenance header:

```
**Module ID:** {{unique_id - module_path hash}}
**Generated:** {{date}}
**SOT_MODE:** {{git|snapshot}}
**COMMIT_SHA:** {{sha at generation time}}
**SNAPSHOT_HASH_AT_GENERATION:** {{snapshot hash if SOT_MODE=snapshot}}
**DIRTY_AT_GENERATION:** {{yes|no|N/A}}
**DIRTY_FINGERPRINT_AT_GENERATION:** {{sha256_or_N/A}}
**Source files hash:** {{SHA-256 of concatenated source file contents}}
**Dependency footprint:** {{normalized list of shared files this module reads: config, env schema, shared types}}
**Dependency footprint hash:** {{SHA-256 of normalized dependency footprint file contents}}
```

### Before a new scoped run

1. **Re-run Layer 1 full** (file tree only - fast). This detects boundary changes since the last run.
2. **Check existing cards for staleness:**
   - For each existing card in CID/modules/, branch by card `SOT_MODE`:
   - If `SOT_MODE=git`:
     - Compare `COMMIT_SHA` to current HEAD.
     - If HEAD != card's COMMIT_SHA, check if any source files in that module changed: `git diff card_sha..HEAD -- module_path/`
     - Also check dependency footprint: `git diff card_sha..HEAD -- <shared_config_paths>`
     - Recompute `Source files hash` and compare with card value.
     - Recompute `Dependency footprint hash` and compare with card value.
     - If module files changed, dependency footprint changed, source hash mismatched, or footprint hash mismatched -> card is **STALE**. Flag it.
   - If `SOT_MODE=snapshot`:
     - Recompute content hash for module source files and compare with `Source files hash`.
     - Recompute dependency footprint hash and compare with `Dependency footprint hash`.
     - If either hash differs -> card is **STALE**. Flag it.
3. **Detect structural changes:**
   - If Layer 1 finds a module that existed before but has been renamed/split/deleted, mark old cards as **INVALIDATED**.
   - If a module was split (e.g., `auth/` -> `auth/` + `identity/`), both the old `auth.md` and the new split need (re)generation.

### Merge rules

| Situation | Action |
|-----------|--------|
| New module, no existing card | Generate new card |
| Existing card, same source reference and same content hashes | Keep existing card (no change) |
| Existing card, stale (files changed) | Regenerate card for that module |
| Existing card, module renamed | Delete old card, generate under new name |
| Existing card, module split | Delete old card, generate cards for each new module |
| Existing card, module deleted | Delete card, note in coherence report |

### Layer 3 on scoped CID

When Layer 3 runs on a partial CID (not all modules analyzed):
- State coverage explicitly: "This report covers {{n}} of {{total}} modules ({{%}})."
- Analyze only modules with current (non-stale) cards.
- Flag stale cards as excluded from coherence analysis.
- Cross-module findings are limited to analyzed modules - do not infer about unanalyzed modules.

### Stale card garbage collection

Cards older than the configured threshold (default: no auto-delete) are flagged but not deleted. Deletion requires explicit user action: `coderec gc --stale-days 30`.
