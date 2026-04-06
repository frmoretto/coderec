# coderec cartography - Quick System Map

> STATUS: DESIGN PHASE

Layer 1 only. Fastest mode - produces a system map without deep analysis.

## Usage

```
coderec cartography --sot /absolute/path/to/codebase
coderec cartography --sot /absolute/path/to/codebase --output system_map.md
```

**`--sot` is required.** See SKILL.md "Critical Rule: Source of Truth" for initialization steps.

## What It Does

Reads only file names, directory structure, imports, and entry points from SOT_ROOT. All reads use absolute paths prefixed with SOT_ROOT.

### Steps

```
1. SOT Initialization (see SKILL.md)
2. Read file tree from SOT_ROOT (apply exclusion list)
   - Also exclude generated/minified files: *.min.js, *.bundle.js, *.map,
     files matching "generated" in path, files with @generated or auto-generated headers
   - Record exclusions in system_map (both directory-level and file-level)
3. Identify module boundaries using the Module Boundary Algorithm (SKILL.md)
   - Apply precedence: manifest > deploy unit > barrel > framework > domain > fallback
   - Apply nesting: package boundaries contain framework submodules
   - Score each boundary: High / Medium / Low confidence
4. Detect entry points, external dependencies, communication patterns
5. Extract dependency edges for topological sort (see SKILL.md edge extraction algorithm)
6. Run Layer 1 Verification Gate:
   - Sample boundaries: max(5, ceil(10% of total)), stratified by confidence tier
   - ALL Low-confidence boundaries must be checked (not just sampled)
   - If >2 checked boundaries fail re-check -> MANDATORY re-cartography with coarser grouping
7. Run Gate 1 (path verification) standalone on the system_map output
8. Output: system_map.md
```

### Output includes

- Module boundaries with confidence scores
- Processing order (topological by dependency, alphabetical tie-break)
- External dependencies (what third-party services/libraries are used)
- Communication patterns (REST, events, shared DB, message queue)
- Entry points (where does execution start)
- Approximate module sizes (file count, LOC range)
- Exclusions applied (default + .coderecignore)

## When To Use

- First contact with an unfamiliar codebase
- Before deciding which modules to scope for full reconnaissance
- Quick orientation for a new team member
- Estimating effort for a full coderec run

## Context Window Usage

Minimal. File names and import statements only - no source code read.
