# coderec — Codebase Reconnaissance for Spec-Driven Development

**The brownfield on-ramp for any SDD methodology.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> *"You wouldn't send troops into unknown terrain without reconnaissance. Why are you sending your AI agent into 50,000 lines of code blind?"*

---

## The Problem

Every SDD tool assumes you start with a blank page. Most developers don't.

You have 50,000 lines of code, undocumented decisions, and a team that left six months ago. You can't write specs for the future without understanding the past.

When an AI agent was asked to document a production codebase for regeneration, it produced **29 factual errors** — wrong file paths, wrong package versions, wrong schema types, wrong CSS values, wrong component interfaces. Root cause: the agent read from the wrong directory, used versions from npm latest instead of the lockfile, and listed file names from memory instead of the filesystem.

**The failure happened because there was no protocol.**

---

## What Is coderec?

coderec is a **codebase reconnaissance protocol** that transforms existing codebases into **Codebase Intelligence Documents (CIDs)** — verified, structured artifacts that any SDD methodology can consume as input.

Four progressive layers, each building on the last:

| Layer | Name | What it does |
|-------|------|-------------|
| 1 | **Cartography** | Map system boundaries, modules, dependencies, entry points |
| 2 | **Module Intelligence** | Per-module intelligence cards: purpose, contracts, assumptions, behavior |
| 3 | **Cross-Module Synthesis** | Find contradictions, dead code, implicit coupling, version conflicts |
| 4 | **Decision Archaeology** | Recover the "why" from git history with confidence levels |

Each layer's output is **compacted context** for the next layer. Code is read primarily in Layer 2, with minimal targeted re-reads in Layers 3-4 for evidence verification.

---

## How It Works

### Source of Truth Enforcement

Every coderec run binds to a **Source of Truth** — a specific codebase at a specific commit:

```
coderec full --sot /path/to/production/codebase
```

All reads use absolute paths prefixed with SOT_ROOT. No CWD resolution. No reading from memory. The exact commit SHA is pinned at run start and revalidated at run end. This is the mechanism that prevents the 29-error class of failures.

Supports three modes:
- **Clean git** (default) — pinned to HEAD, clean working tree required
- **Dirty git** (`--allow-dirty`) — proceeds with uncommitted changes, CID capped at DEGRADED
- **Snapshot** (`--sot-mode snapshot`) — for non-git codebases (tarballs, vendor drops)

### 7-Gate Verification

The CID is a derived artifact — it can be wrong. Before use, 7 internal gates verify it against source:

| Gate | What it checks | Failure severity |
|------|---------------|-----------------|
| 1 — Path | Every file path resolves against SOT_ROOT | INVALID |
| 2 — Version | Every version matches lock file | DEGRADED |
| 3 — Contract | Every verbatim export signature matches source | INVALID |
| 4 — Schema | Every type definition matches source exactly | DEGRADED |
| 5 — CSS | Every CSS token matches globals/theme | DEGRADED |
| 6 — Behavior | Render logic, HTML attributes, metadata, routing match source | INVALID |
| 7 — Cross-ref | All CID files agree on names, paths, IDs | INVALID |

Plus: secret scan (pre-step), end-of-run SOT revalidation (TOCTOU protection).

CID status: **VALID** | **INVALID** | **DEGRADED** | **STALE**

### Verbatim Contracts with Provenance

Module cards copy exact signatures from source — never paraphrase. Every entry includes a provenance anchor (`Source: file:line`) and content hash. Gate 3 reads the source at that exact location, computes the hash, and compares. When snippets contain redacted secrets, verification uses hash comparison instead of string matching.

---

## The Ecosystem

```
coderec       ->  understand your codebase  ->  CID (what IS)
specverify    ->  verify your specs         ->  report
stream-coding ->  write your specs          ->  code (what SHOULD BE)
```

Three tools, three jobs, zero overlap. Each works standalone with any SDD framework.

| Tool | Input | Output | Repo |
|------|-------|--------|------|
| **coderec** | Existing codebase | Codebase Intelligence Document | This repo |
| [specverify](https://github.com/frmoretto/specverify) | Specifications | Verification report | frmoretto/specverify |
| [Stream Coding](https://github.com/frmoretto/stream-coding) | Verified specs | Production code | frmoretto/stream-coding |

---

## Quick Start

### Option 1: Claude Code / Claude Desktop

The skill file is at `skill/SKILL.md`. Load it as a skill or paste it into your conversation context.

```
Read: skill/SKILL.md
```

Then: *"Run coderec full on /path/to/my/codebase"*

### Option 2: Any AI Agent

1. Read `skill/SKILL.md` (protocol definition)
2. Read `skill/commands/full.md` (execution flow)
3. Read the templates in `skill/templates/` (output format)
4. Execute the protocol against your codebase

### Option 3: Manual

Read the skill definition and templates. Follow the 4-layer process manually, using the templates as checklists. Run the 7-gate verification against your output.

---

## Repository Structure

```
coderec/
+-- README.md              <- this file
+-- AGENTS.md              <- agent discovery file
+-- LICENSE                 <- MIT
+-- skill/                  <- the protocol
|   +-- SKILL.md            <- main skill definition
|   +-- commands/           <- execution flows (full, scope, cartography)
|   \-- templates/          <- output templates (5 files)
\-- schema/                 <- CID machine-readable contract
    +-- cid.schema.json     <- JSON Schema for CID output
    +-- examples/           <- example fixture
    \-- validate-cid.mjs    <- validator
```

---

## CID Schema

Machine-readable CID contract for downstream tool integration:

```bash
# Validate a CID JSON
npm install ajv
node schema/validate-cid.mjs path/to/cid.json
```

See [schema/README.md](schema/README.md) for details.

---

## Design Process

This protocol was designed through **12 adversarial review passes** across 3 AI models (Claude Haiku 4.5, Claude Opus 4.6, OpenAI Codex). Each pass attacked the design for flaws, and each flaw was fixed before the next pass. The original 29-error case study that motivated the design is documented internally.

---

## Roadmap

| Phase | Status |
|-------|--------|
| Protocol design (skill + templates + gates) | Done |
| Adversarial hardening (12 passes, 3 models) | Done |
| CID JSON Schema + validator | Done |
| Namespace claims (npm + PyPI) | Done |
| First real-world test | Next |
| CLI tool implementation | Planned |
| Claude Code skill distribution | Planned |

---

## Related Projects

| Project | Purpose | URL |
|---------|---------|-----|
| Stream Coding | Documentation-first methodology | [stream-coding.com](https://stream-coding.com) |
| specverify | Specification verification | [github.com/frmoretto/specverify](https://github.com/frmoretto/specverify) |
| Clarity Gate | Epistemic quality for RAG | [github.com/frmoretto/clarity-gate](https://github.com/frmoretto/clarity-gate) |

---

## Contributing

This is an early-stage protocol. Areas seeking input:

- **Real-world testing** — Run coderec on your brownfield codebase and report what works/breaks
- **Language support** — Boundary heuristics and template sections for languages beyond JS/TS/Python/Go/Rust/Java
- **Gate implementations** — Tooling that automates the 7-gate verification

---

## License

MIT

## Author

Francesco Marinoni Moretto
- [LinkedIn](https://linkedin.com/in/francesco-moretto)
- [GitHub](https://github.com/frmoretto)
