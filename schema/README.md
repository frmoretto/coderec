# CID Schema Assets

- Schema: `schema/cid.schema.json`
- Example fixture: `schema/examples/cid.minimal.json`
- Validator: `schema/validate-cid.mjs`

## Validate a CID JSON

Prerequisite:
- Node.js 18+
- `npm install ajv`

Command:

```bash
node schema/validate-cid.mjs path/to/cid.json
```

Optional custom schema path:

```bash
node schema/validate-cid.mjs path/to/cid.json schema/cid.schema.json
```
