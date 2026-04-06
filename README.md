<!-- TODO: VISUAL ASSET — Banner image
     BRIEF: Dark background, "coderec" in monospace/terminal font, tagline below.
     Style reference: Repomix banner (clean, branded, tagline baked in).
     Text: "coderec — Verified codebase intelligence for spec-driven development"
     File: assets/banner.png
-->

<p align="center">
  <strong>coderec</strong><br>
  <em>The first open protocol for verified codebase intelligence.</em>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License"></a>
  <a href="https://www.npmjs.com/package/coderec"><img src="https://img.shields.io/npm/v/coderec.svg" alt="npm"></a>
  <a href="https://pypi.org/project/coderec/"><img src="https://img.shields.io/pypi/v/coderec.svg" alt="PyPI"></a>
  <a href="https://github.com/frmoretto/coderec"><img src="https://img.shields.io/github/stars/frmoretto/coderec?style=social" alt="GitHub Stars"></a>
</p>

<p align="center">
  <a href="#why-coderec-exists">Why</a> &bull;
  <a href="#what-coderec-produces">CID</a> &bull;
  <a href="#how-it-works">How it works</a> &bull;
  <a href="#verification-gates">Gates</a> &bull;
  <a href="#quick-start">Quick start</a> &bull;
  <a href="#real-world-results">Results</a> &bull;
  <a href="#ecosystem">Ecosystem</a> &bull;
  <a href="#roadmap">Roadmap</a>
</p>

---

> *"You wouldn't send troops into unknown terrain without reconnaissance. Why are you sending your AI agent into 50,000 lines of code blind?"*

## Why coderec exists

Every spec-driven methodology assumes you start from a blank page. Most teams don't.

If all you have is a 10-year-old monolith and a handful of tickets, you face three bad options:

- Dump the whole repo into an LLM and hope it "understands."
- Spend weeks spelunking the code by hand before you can write a single spec.
- Pretend the legacy system is a black box and write specs that don't match reality.

**coderec formalizes a fourth option:**

> **First:** turn the codebase into a verified, structured **CID** (what *IS*). <br>
> **Then:** feed that into any SDD tool to define what *SHOULD BE*.

An AI agent was asked to document a production codebase. It produced **29 factual errors** -- wrong file paths, wrong package versions, wrong interfaces, wrong CSS values. All because it read from the wrong directory and listed things from memory. coderec exists so that never happens again.

<!-- TODO: VISUAL ASSET — Before/After diagram
     LEFT:  "Without coderec" — scattered files, question marks, red X errors
     RIGHT: "With coderec" — structured CID, green checkmarks, 7 gates PASS
     File: assets/before-after.svg
-->

---

## What coderec produces

Running coderec on a codebase emits a **Codebase Intelligence Document (CID)**:

```
CID/
+-- system_map.md          <- Layer 1: boundaries, modules, dependencies
+-- modules/
|   +-- auth.md            <- Layer 2: intelligence card + verbatim contracts
|   +-- billing.md
|   \-- ...
+-- coherence_report.md    <- Layer 3: contradictions, dead code, type gaps
+-- decision_register.md   <- Layer 4: documented / inferred / unknown decisions
+-- verification_status.md <- 7-gate results + CID status
\-- triage.md              <- human decisions: FIX / ACCEPT / DEFER
```

Think of the CID as **verified documentation for what exists right now** -- not a spec, not a plan, not a refactor proposal.

### CID vs Spec

coderec is deliberately non-prescriptive:

|  | CID (coderec) | Spec (Stream Coding / Spec Kit / OpenSpec / your SDD) |
|--|---------------|-------------------------------------------------------|
| **Purpose** | Document what **exists** | Prescribe what **should** exist |
| **Tense** | Present -- "the system does X" | Future -- "the system shall do X" |
| **Quality issues** | Observed and flagged | Resolved with prescribed fix |
| **Type gaps** | "field currently uses `any`" | "field shall use `string`" |
| **Dead code** | Marked as candidate | Decision: remove, keep, or quarantine |
| **Decisions** | Classified by confidence | Ratified, changed, or explicitly re-made |

> **Rule:** coderec observes. It does **not** prescribe. Remediation lives downstream.

---

## How it works

coderec uses **progressive disclosure** -- each layer compacts the codebase into smaller, more semantic artifacts and feeds the next.

| Layer | Name | Input | Output |
|-------|------|-------|--------|
| 1 | **Cartography** | File tree, imports, entry points | System map (boundaries, modules, dependencies) |
| 2 | **Module Intelligence** | One module + system map | Intelligence card (contracts, behavior, assumptions) |
| 3 | **Cross-Module Synthesis** | All Layer 2 cards (not code) | Coherence report (contradictions, dead code, coupling) |
| 4 | **Decision Archaeology** | Cards + git blame + commits | Decision register (documented / inferred / unknown) |

Code is read primarily in Layer 2. Layers 3-4 work from compacted cards with minimal targeted re-reads for evidence verification.

### Source of Truth enforcement

Every run pins to a specific commit. Every read uses absolute paths prefixed with `SOT_ROOT`. Three modes:

- **Clean git** (default) -- pinned to HEAD, clean tree required
- **Dirty git** (`--allow-dirty`) -- proceeds with uncommitted changes, CID capped at DEGRADED
- **Snapshot** (`--sot-mode snapshot`) -- for non-git codebases (tarballs, vendor drops)

This is the mechanism that prevents the 29-error class of failures. Not a suggestion -- an enforcement primitive.

---

## Verification gates

The CID is derived -- it can be wrong. 7 gates verify it against source before anyone trusts it.

| Gate | Checks | Failure |
|------|--------|---------|
| 1 -- Path | File paths resolve against SOT | INVALID |
| 2 -- Version | Versions match lock file | DEGRADED |
| 3 -- Contract | Export signatures match source at provenance anchor | INVALID |
| 4 -- Schema | Types match source exactly | DEGRADED |
| 5 -- CSS | Tokens match theme/globals | DEGRADED |
| 6 -- Behavior | Render logic, HTML attrs, metadata, routing match source | INVALID |
| 7 -- Cross-ref | All CID files internally consistent | INVALID |

Plus: secret scan (pre-step), end-of-run SOT revalidation (TOCTOU protection).

**CID Status:** `VALID` | `DEGRADED` | `STALE` | `INVALID`

Downstream tools treat `INVALID` as a hard stop.

<!-- TODO: VISUAL ASSET — Terminal screenshot/SVG
     Show `coderec full` running with colored gate results, ending with "CID STATUS: VALID"
     File: assets/terminal-output.svg
-->

---

## Quick start

### Use as an AI skill (recommended)

```
coderec full --sot /path/to/your/codebase
```

The skill is in [`skill/SKILL.md`](skill/SKILL.md). Load it into Claude Code, Codex, or any agent.

### Scoped reconnaissance (one area)

```
coderec scope src/auth --sot /path/to/codebase --depth 1
```

Runs Layer 1 on the full repo, then Layers 2-4 only for `auth` + its dependencies.

### Cartography only (quick orientation)

```
coderec cartography --sot /path/to/codebase
```

Layer 1 only. Fast pass for first contact with an unfamiliar codebase.

### Install placeholder (CLI coming soon)

```bash
npx coderec          # npm
pip install coderec   # PyPI
```

---

## Real-world results

<!-- TODO: VISUAL ASSET — Results card (4 stats, dark card, green accents)
     File: assets/results-card.svg
-->

First test: the exact production codebase that produced the original 29 errors.

- **CID Status: VALID** -- all 7 gates passed
- **44 findings** surfaced (contradictions, dead code, type gaps, duplications)
- **7 actionable specs** generated from triage decisions
- **0 of the original 29 errors** would recur with this CID as input

---

## Design rigor

The protocol was hardened through **12 adversarial review passes** across 3 AI models (Claude Haiku, Claude Opus, OpenAI Codex). Each pass attacked the design; each flaw was fixed before the next pass.

Key mechanisms designed through adversarial review:

- Module boundary algorithm (6-level precedence, deterministic, nested)
- Provenance anchors (file:line + content hash on every contract)
- Secret redaction with dual-representation (redacted display + original hash for gate checks)
- Module disposition table (explicit skip/merge justification -- no silent omissions)
- Dependency footprint tracking for scoped staleness detection
- Concrete token budgets per layer with overflow reporting

---

## When to use coderec

**Use coderec when:**

- You're introducing SDD into a **legacy project** and need a verified starting point
- You need a **shared, trustworthy map** across teams (architecture, product, QA, ops)
- You want an AI agent to operate on a brownfield codebase **without hallucinating** what the code does

**Skip coderec when:**

- You have a small, well-understood repo and just need a quick answer about one function
- You're doing pure greenfield with a clean spec already in place

---

## Ecosystem

coderec is **complementary**, not competitive:

```
coderec       ->  understand your codebase  ->  CID (what IS)
specverify    ->  verify your specs         ->  report
Stream Coding ->  write your specs          ->  code (what SHOULD BE)
Spec Kit      ->  spec + plan.md            ->  code
OpenSpec      ->  proposal / spec deltas    ->  code
```

<!-- TODO: VISUAL ASSET — Ecosystem flow diagram (horizontal pipeline)
     File: assets/ecosystem.svg
-->

The CID is **framework-agnostic** -- a machine-readable contract that any SDD tool can consume.

| Tool | Purpose | Link |
|------|---------|------|
| **coderec** | Understand your codebase | This repo |
| [specverify](https://github.com/frmoretto/specverify) | Verify your specs | frmoretto/specverify |
| [Stream Coding](https://github.com/frmoretto/stream-coding) | Write your specs | frmoretto/stream-coding |
| [Clarity Gate](https://github.com/frmoretto/clarity-gate) | Epistemic quality for docs | frmoretto/clarity-gate |

---

## CID Schema

Machine-readable CID contract for downstream tool integration:

```bash
node schema/validate-cid.mjs path/to/cid.json
```

See [`schema/`](schema/) for JSON Schema, example fixture, and validator.

---

## Prior art and philosophy

coderec builds on decades of work:

- **Software Architecture Recovery** research (SAR, ModARO, ArchAgent, Code2DFD)
- **AI documentation generators** (CodeWiki, KT Studio, Swimm, GitLoop)
- **Enterprise modernization** tools (EPAM ART, Augment Context Engine, Thoughtworks CodeConcise)
- **SDD frameworks** (Spec Kit, OpenSpec, DocDD, intent-driven.dev)

What's new is the combination: **layered analysis + verified artifact + standard schema + SDD handoff.** No existing tool publishes a framework-agnostic, gate-verified intermediate document for brownfield-to-spec workflows.

---

## Roadmap

| Phase | Status |
|-------|--------|
| Protocol design (skill + templates + 7 gates) | Done |
| Adversarial hardening (12 passes, 3 models) | Done |
| CID JSON Schema + validator | Done |
| First real-world test (VALID CID on production codebase) | Done |
| Namespace claims (npm + PyPI) | Done |
| CLI tool + MCP server | Planned |
| Triage dashboard (visual decision UI) | Planned |
| Language profiles (JVM, COBOL, PHP, C#) | Planned |

---

## Contributing

Areas seeking input:

- **Real-world testing** -- Run coderec on your brownfield codebase and report what works/breaks
- **Language support** -- Boundary heuristics beyond JS/TS/Python/Go/Rust/Java
- **Gate implementations** -- Tooling that automates the 7-gate verification

---

## License

MIT -- see [`LICENSE`](LICENSE).

## Author

**Francesco Marinoni Moretto**
&bull; [GitHub](https://github.com/frmoretto)
&bull; [LinkedIn](https://linkedin.com/in/francesco-moretto)
&bull; [Stream Coding](https://stream-coding.com)
