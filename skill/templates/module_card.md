# Module Intelligence Card - Template

**Module:** {{module_name}}
**Module ID:** {{mod_<first16_sha256_of_normalized_module_path>}}
**Path:** {{module_path}}
**Language:** {{TypeScript / Python / Go / Rust / Java / etc.}}
**Module Type:** {{page / layout / component / middleware / api-route / service / utility / library}}
**Feature Flagged:** {{no / yes: FLAG_NAME - conditional on feature flag}}
**Layer:** 2 - Module Intelligence
**Date:** {{date}}
**SOT_MODE:** {{git|snapshot}}
**COMMIT_SHA:** {{sha_at_generation_time}}
**SNAPSHOT_HASH_AT_GENERATION:** {{sha256_merkle_or_N/A}}
**DIRTY_AT_GENERATION:** {{yes|no|N/A}}
**DIRTY_FINGERPRINT_AT_GENERATION:** {{sha256_or_N/A}}
**Source files hash:** {{SHA-256 of concatenated source file contents in this module}}
**Dependency footprint:** {{normalized list of shared files this module reads}}
**Dependency footprint hash:** {{SHA-256 of dependency footprint file contents}}

> **Provenance header is mandatory.** Scoped mode merge/invalidation uses these fields
> to detect staleness. A card missing mode/hash metadata is invalid for merge.
> `Module ID` format is deterministic: `mod_` + first 16 hex chars of `SHA-256(normalized_module_path)`.
> `normalized_module_path` uses SOT-relative path with `/` separators and no trailing slash.
>
> **Module Type** is determined from file extensions, imports, and framework markers - not agent judgment.
> Detection decision tree (first match wins):
> 1. `middleware.*` or framework middleware registration markers -> `middleware`
> 2. `route.*`/`api/*` or HTTP handler signatures -> `api-route`
> 3. framework page/layout conventions (`app/**/page.*`, `app/**/layout.*`, equivalent) -> `page` / `layout`
> 4. JSX/template rendering with exported UI primitive and no route ownership -> `component`
> 5. shared code with external callable API and side effects -> `service`
> 6. shared code with pure helpers and no side effects -> `utility`
> 7. package-style reusable surface (multiple exports consumed cross-module) -> `library`
> Tie-breaks for mixed signals: middleware > api-route > page/layout > component > service > utility > library.
> Gate 6 mandatory behavior coverage is enforced based on this field.
> Misclassifying a UI module as "utility" to skip Behavior Contracts will cause Gate 6 FAIL.

---

## Purpose

{{one_paragraph_description_of_what_this_module_does}}

## Public API (semantic - for humans)

> This table describes WHAT the module does in human-readable terms.
> It is NOT a verification artifact - Gate 3 does not check this table.
> For verified signatures, see Verbatim Contracts > Exports below.
> Every entry here MUST correspond to an entry in the Exports table.

| Function/Method | Input | Output | Side Effects |
|----------------|-------|--------|-------------|
| {{name}} | {{params_described}} | {{return_described}} | {{side_effects}} |

## Verbatim Contracts (literal - for verification)

> Copy from source - never paraphrase. These enable identical regeneration.
> Every entry MUST include a provenance anchor: `Source: file_path:line_number` + content hash.
> Gate 3 reads the source at that exact location, computes hash, and compares. No anchor = unverifiable.
> Hash display = first 16 chars of SHA-256 of the exact signature string.
> For automated verification, compare full SHA-256 value.
>
> **Secret redaction policy:** Before copying any verbatim snippet, scan for secrets (API keys,
> tokens, passwords, connection strings, private keys). Replace secret values with `[REDACTED]`.
> This applies to ALL verbatim sections including Behavior Contracts, metadata, and routing logic.
> A CID containing unredacted secrets is invalid regardless of gate results.
>
> **Redaction + gate verification:** When a snippet contains `[REDACTED]`, gates cannot do exact
> string match. Use this dual representation:
> - **Display text:** the redacted version (what appears in the CID)
> - **Content hash:** computed from the ORIGINAL unredacted source (what gates verify against)
> Gates 3/6 verify via hash match when `[REDACTED]` marker is present in the CID snippet.
> The hash proves the snippet was copied from the correct source location without exposing the secret.

### Exports
| Export | Type | Exact Signature | Source | Hash |
|--------|------|-----------------|--------|------|
| {{name}} | named / default | {{copy the full signature from source}} | {{file_path}}:L{{line}} | {{first_16_sha256}} |

### Schema / Types (if applicable - all typed languages)

> For interfaces with >30 fields: record location, field count, and content hash.
> Copy first 5 + last 3 fields verbatim. Reference source for full definition.
> Gate 4 verifies via hash for large types, field-by-field for small types.

```
// Source: {{file_path}}:L{{start_line}}-L{{end_line}}
// Fields: {{count}} | Hash: {{first_16_chars_sha256}}
{{exact type definitions - copy `any` if source uses `any`}}
{{include optionality: which fields are required vs optional}}
```

### CSS / Tokens (if frontend - omit for backend-only modules)
```
// Source: {{file_path}}:L{{line_range}}
{{imports required (e.g., @import "shadcn/tailwind.css")}}
{{custom properties this module defines or requires}}
{{utility classes this module defines}}
```

### Composition (if page or layout)

> For page/layout/wrapper/shell components, include the Render Tree showing actual
> JSX nesting order - not just a flat import list. This captures provider chain order,
> conditional wrappers, and wrapper scope (error A-14 pattern).

| Import | From | Why | Source |
|--------|------|-----|--------|
| {{component}} | {{path}} | {{role in this page}} | {{file_path}}:L{{line}} |

#### Render Tree
```
// Source: {{layout_file_path}}:L{{start}}-L{{end}}
{{OuterWrapper}}
  {{MiddleWrapper condition="{{if applicable}}"}}
    {{InnerComponent}}
    {{SiblingComponent}}
```

## Behavior Contracts (mandatory for UI components, pages, layouts, middleware, API routes)

> Verbatim Contracts capture SIGNATURES (what the module exports).
> Behavior Contracts capture WHAT THE MODULE DOES at runtime - render logic,
> conditional branches, literal output values, HTML attributes.
> Gate 6 verifies these by reading the source snippets at the provenance anchors.

### Minimum coverage requirement

> Gate 6 only checks declared entries - omitted behavior is invisible.
> To prevent omission-based bypass, the following are MANDATORY (not optional):

| Module type | Required behavior captures |
|-------------|--------------------------|
| Page / Layout | At least: 1 render path, all `<html>`/`<body>` attributes, metadata object |
| UI Component with conditional rendering | At least: each conditional branch (if/ternary/switch) |
| Middleware / API route | At least: each routing condition / auth guard |
| Pure utility / library | Behavior Contracts section may be omitted - write "N/A: non-behavioral module" |

> If a module matches a type above and has 0 behavior contract entries, Gate 6 FAILS
> with "missing required behavior coverage." This prevents the skip-and-pass exploit.

### Critical Render Paths (if UI)

> Copy the exact conditional logic that determines what the user sees.
> These are the behaviors that, if wrong, produce a visually broken or functionally
> incorrect application - even when all export signatures are correct.

| # | Behavior | Code Snippet (verbatim) | Source | Hash |
|---|----------|------------------------|--------|------|
| BC-001 | {{what the user sees/experiences}} | `{{exact code from source}}` | {{file}}:L{{line}} | {{first_16_sha256_of_original_snippet}} |

Examples of what to capture:
- Conditional rendering: `{isLoading ? <Spinner /> : <Content />}` (error A-09 pattern)
- Display logic: `{score}/100` vs `Math.round(score)` (error A-08 pattern)
- Icon/symbol choices: `"-"` vs `<LucideIcon />` (error A-10 pattern)

### Critical HTML Attributes (if page/layout)

> Literal attribute values that affect functionality or locale.

| Attribute | Element | Value (verbatim) | Source | Hash |
|-----------|---------|------------------|--------|------|
| {{attr}} | {{tag}} | `{{exact value}}` | {{file}}:L{{line}} | {{first_16_sha256_of_original_value}} |

Examples: `lang="it"` on `<html>` (error A-11), `className="font-sans antialiased"` on `<body>` (error A-13)

### Metadata / Config Objects (if page)

> Next.js metadata, head tags, OpenGraph, or equivalent config that is NOT an export signature
> but IS a critical output of the module.

```
// Source: {{file}}:L{{start}}-L{{end}}
// Hash: {{first_16_sha256_of_original_snippet}}
{{exact metadata object or config - copy verbatim}}
```

Example: `export const metadata = { title: "My App - Product description..." }` (error A-15)

### Middleware / Routing Logic (if middleware or API route)

> Conditional routing, auth guards, redirects - runtime behavior that determines
> which code path executes. Copy the branching logic verbatim.

```
// Source: {{file}}:L{{start}}-L{{end}}
// Hash: {{first_16_sha256_of_original_snippet}}
{{exact routing/guard logic}}
```

Example: hostname-based routing, `auth.protect()` patterns (error R-04)

## Internal State

{{what_state_does_this_module_maintain - databases, caches, files, in-memory}}

## Dependencies

**Incoming (who calls this module):**
- {{caller_module}} -> {{which_function}}

**Outgoing (what this module calls):**
- {{called_module}} -> {{which_function}}

**External:**
- {{third_party_service_or_library}}

## Public Exports with Known Callers

> This table enables Layer 3 dead code detection without re-reading source.
> List every public export and its known callers (from import analysis in Layer 1).
> If an export has 0 known callers and is not an entry point, it is a dead code candidate.

| Export | Type | Known Callers | Entry Point? | Framework Registered? | Dead Code Candidate? |
|--------|------|--------------|-------------|----------------------|---------------------|
| {{name}} | function / class / const / type | {{module_a, module_b}} or `none` | yes / no | yes ({{mechanism}}) / no / unknown | yes / no |

> **Dead code = 0 known callers AND not entry point AND not framework-registered.**
> Before marking dead, check for: string-based registration (e.g., `app.use(name)`),
> framework conventions (e.g., Next.js page exports, Django URL patterns, Express route handlers),
> event/message subscriptions, DI container bindings, and reflection-based invocation.
> If any secondary evidence exists, mark Framework Registered = yes and Dead Code = no.

## Contracts

**Preconditions:** {{what_must_be_true_before_this_module_works}}
**Postconditions:** {{what_is_guaranteed_after_this_module_runs}}
**Invariants:** {{what_is_always_true_during_execution}}

## Implicit Assumptions

> Check each category systematically. Do not rely on free-form discovery.

| Category | Assumption | Evidence | Confidence |
|----------|-----------|----------|-----------|
| **Preconditions** | {{must X be truthy/defined/non-null before use?}} | {{code location}} | Documented / Inferred / Unknown |
| **Timing/Ordering** | {{must Y be called before Z?}} | {{code location}} | Documented / Inferred / Unknown |
| **State** | {{hidden state in globals, React context, module scope, DB?}} | {{code location}} | Documented / Inferred / Unknown |
| **Environment** | {{assumes browser? Node? specific OS? env vars?}} | {{code location}} | Documented / Inferred / Unknown |
| **Concurrency** | {{is this reentrant? async-safe? thread-safe?}} | {{code location}} | Documented / Inferred / Unknown |

> If a category has no assumptions, write "None identified" - do not skip the row.

## Anti-patterns Observed

| Pattern | Location | Risk |
|---------|----------|------|
| {{what}} | {{where}} | {{impact}} |

## Quality Flags

> Verbatim contracts record WHAT IS. Quality flags record WHAT SHOULD CHANGE.
> The CID is a photograph, not an endorsement. Flag bad code - don't hide it, don't fix it here.
> Decisions about what to keep vs. improve happen downstream (spec phase), not during reconnaissance.
>
> **Mandatory:** Generate during Layer 2 while source is in context. Do not defer to Layer 3.
> If no quality issues observed, write "None observed" - do not omit the section.

| # | What | Where | Flag | Impact |
|---|------|-------|------|--------|
| QF-001 | {{description of quality issue}} | {{file:line}} | DEBT / SMELL / INCONSISTENCY / SECURITY | {{what downstream impact this has - NOT a prescriptive fix}} |

**Flag types:**
- **DEBT** - works but known shortcut (e.g., `v.any()` instead of typed schema)
- **SMELL** - code pattern that causes friction (e.g., string concat instead of `cn()`)
- **INCONSISTENCY** - same thing done differently across modules (e.g., PascalCase vs kebab-case)
- **SECURITY** - potential vulnerability (describe the risk, not the fix)

## Notes

{{anything_else_relevant - tech debt, known issues, quirks}}
