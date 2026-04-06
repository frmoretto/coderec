# System Map - Template

**Project:** {{project_name}}
**Layer:** 1 - Cartography
**Date:** {{date}}
**SOT_ROOT:** {{absolute_path_to_production_codebase}}
**SOT_MODE:** {{git|snapshot}}
**COMMIT_SHA:** {{git_rev_parse_HEAD_output_or_N/A}}
**SNAPSHOT_HASH:** {{sha256_merkle_or_N/A}}
**SNAPSHOT_DATE:** {{date_or_N/A}}
**DIRTY_AT_START:** {{no|yes|N/A}}
**DIRTY_DIFF_STAT:** {{git_diff_stat_or_N/A}}
**DIRTY_FINGERPRINT_START:** {{sha256_or_N/A}}
**Languages:** {{TypeScript, Python, Go, Rust, Java, etc.}}

---

## Languages Detected

> Detected from file extensions and manifests at SOT_ROOT.
> Language determines which template sections apply per module card.

| Language | Manifest | Files | Modules |
|----------|----------|-------|---------|
| {{language}} | {{package.json / pyproject.toml / go.mod / Cargo.toml}} | {{count}} | {{module_names}} |

### Per-language template applicability

| Module card section | TypeScript/JS | Python | Go | Rust | Java |
|--------------------|---------------|--------|-----|------|------|
| Exports (verbatim) | export statements | public functions/classes | Exported functions/types | pub items | public methods |
| Schema / Types | TS interfaces, Zod | type hints, Pydantic, dataclasses | struct definitions | struct/enum defs | DTOs, records |
| CSS / Tokens | Yes (if frontend) | N/A | N/A | N/A | N/A |
| Composition / Render Tree | Yes (if React/Vue/Svelte) | Yes (if Django templates/Jinja) | Yes (if templ/HTML) | N/A | Yes (if Thymeleaf/JSP) |
| Behavior Contracts | Yes (if UI) | Yes (if web) | Yes (if HTTP handlers) | N/A | Yes (if web) |

> Sections marked N/A should be omitted from module cards for that language.
> Gate 5 (CSS) only runs on modules with CSS/Token sections.

## Version Snapshot

> Read from **lock files** (not manifests) at SOT_ROOT - never from memory.
> Lock files contain pinned/resolved versions. Manifests contain specifiers (ranges).
> Gate 2 verifies against lock file values.

### Ecosystem resolution policy

| Ecosystem | Manifest | Deterministic version source (preferred) | Fallback if absent |
|-----------|----------|----------------------|--------------------------|
| npm | `package.json` | `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml` | Use manifest specifier, mark as UNVERIFIABLE |
| Python | `pyproject.toml`, `setup.py` | `requirements.txt` (pinned), `poetry.lock`, `uv.lock` | Use manifest specifier, mark as UNVERIFIABLE |
| Go | `go.mod` | `go.mod` required module versions (`go.sum` corroborates checksums only) | Mark non-required/transitive-only entries UNVERIFIABLE |
| Rust | `Cargo.toml` | `Cargo.lock` | Use manifest specifier, mark as UNVERIFIABLE |
| Java | `pom.xml`, `build.gradle` | `gradle.lockfile` or committed dependency lock/tree artifact | Use manifest specifier, mark as UNVERIFIABLE |

**Monorepo rule:** If multiple package roots exist (workspaces), list each root's dependencies separately. Note which workspace each dependency belongs to.

| Dependency | Resolved Version | Specifier | Lock File | Workspace | Role |
|-----------|-----------------|-----------|-----------|-----------|------|
| {{name}} | {{from_lockfile}} | {{from_manifest}} | {{lockfile_path}} | {{workspace_or_root}} | {{what it does}} |

## Entry Points

| Entry | File | Type |
|-------|------|------|
| {{name}} | {{path}} | page / API route / CLI / cron / worker |

## Module Boundaries

> Detected using the Module Boundary Algorithm (SKILL.md).
> Precedence: manifest > deploy unit > barrel > framework > domain > fallback.

| Module | Module ID | Directory | Responsibility | Files | Approx LOC | Precedence | Confidence |
|--------|-----------|-----------|---------------|-------|-----------|-----------|-----------|
| {{name}} | {{mod_<first16_sha256_of_normalized_module_path>}} | {{path}} | {{one_line}} | {{count}} | {{range}} | {{1-6}} | High / Medium / Low |

### Module Disposition (Layer 2)

> Every module in the boundary table MUST appear here with a disposition.
> Gate 7 verifies this table matches the actual module card files.
> This prevents silent skips — every omission must be justified.

| Module | Disposition | Card file | Reason |
|--------|------------|-----------|--------|
| {{name}} | CARD | modules/{{name}}.md | Full card produced |
| {{name}} | MERGED into {{target}} | modules/{{target}}.md | {{why — e.g., "1-file module, cohesive with target"}} |
| {{name}} | SKIPPED | -- | {{why — must match a skip rule below}} |

**Valid skip reasons:**
- **Generated code** — auto-generated files with no custom logic (e.g., shadcn/ui primitives)
- **Declarative-only** — markdown/config/prompt files, not executable code
- **Trivial wrapper** — <50 LOC, delegates entirely to a component already covered in another card
- **Infrastructure** — test harness, CI config, build scripts (not business logic)

**Valid merge reasons:**
- **Cohesive unit** — 2-3 small modules (<100 LOC each) that form one logical domain and share tight coupling
- **Same-concern split** — files split by convention (hooks/, contexts/, lib/) but serving one feature

**NOT valid reasons to skip:**
- "Too small" alone (a 20 LOC page that is the only consumer of a mutation must be documented)
- "Similar to another module" (similar is not identical)
- Context window pressure (split into chunks instead)

### Processing Order (for Layer 2)

> Dependency-topological: leaf modules first, root modules last. Alphabetical tie-break.
> Only modules with disposition CARD or MERGED are processed.

1. {{module_name}} (leaf - no internal dependencies)
2. {{module_name}} (depends on #1)
3. ...

### Exclusions Applied

```
Default: node_modules/ dist/ build/ .next/ vendor/ __pycache__/ .git/ ...
Custom (.coderecignore): {{additional patterns if any}}
```

## External Dependencies

| Service | Protocol | Used By | Config Location |
|---------|----------|---------|----------------|
| {{name}} | REST / GraphQL / SDK / CLI | {{which_modules}} | {{env_var_or_config_file}} |

## Communication Patterns

| From | To | Mechanism | Data Shape |
|------|-----|-----------|-----------|
| {{module_a}} | {{module_b}} | import / HTTP / event / shared DB / file | {{brief}} |

## Environment Contract

> All env vars required to run this project.
> **Secret redaction policy:** For rows where Secret = yes, do NOT include real values.
> Use placeholder format only: `postgresql://USER:PASS@HOST:PORT/DB`.
> Reference `.env.example` for non-secret defaults. A CID containing unredacted secrets is invalid.

| Variable | Required By | Secret? | Example |
|----------|------------|---------|---------|
| {{name}} | {{module}} | yes/no | {{placeholder_only_if_secret}} |

## File Tree (Annotated)

```
{{project_root}}/
+-- {{dir}}/         <- {{what this dir contains}}
|   +-- {{subdir}}/  <- {{what this subdir contains}}
|   \-- ...
\-- ...
```

## Conventions Observed

| Convention | Example | Where |
|-----------|---------|-------|
| Naming | {{PascalCase components, kebab-case routes, etc.}} | {{dirs}} |
| Exports | {{default vs named, barrel files, etc.}} | {{dirs}} |
| Styling | {{CSS modules / Tailwind / inline / tokens}} | {{dirs}} |
| Testing | {{pattern, framework, location}} | {{dirs}} |

## Feature Flags

> Modules or code paths gated behind feature flags. Distinguish from dead code in coherence report.

| Flag | Modules Affected | Status | Config Location |
|------|-----------------|--------|----------------|
| {{FLAG_NAME}} | {{module_a, module_b}} | active / inactive / unknown | {{env var / config file / service}} |

> If no feature flags detected, write "None detected."

## Operational Artifacts

> Non-code artifacts that are critical for understanding the production system.
> These are NOT modules but affect how modules behave in production.

| Artifact | Type | Path | Modules Affected | Notes |
|----------|------|------|-----------------|-------|
| {{name}} | CI/CD / Migration / Dockerfile / K8s / IaC / Config | {{path}} | {{which_modules}} | {{brief}} |

Artifact types to inventory:
- **CI/CD:** GitHub Actions, GitLab CI, Jenkins, CircleCI pipelines
- **Migrations:** Database migration files (SQL, Prisma, Alembic, Flyway)
- **Containers:** Dockerfiles, docker-compose.yml
- **Orchestration:** Kubernetes manifests, Helm charts, Terraform, Pulumi
- **Config:** nginx.conf, serverless.yml, vercel.json, netlify.toml

> If none exist, write "None detected." This section is observational - it inventories what exists,
> it does not prescribe what should exist.
