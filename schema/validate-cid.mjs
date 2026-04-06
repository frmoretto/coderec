#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import Ajv from "ajv";

function usage() {
  console.error("Usage: node schema/validate-cid.mjs <cid-json-path> [schema-path]");
  process.exit(2);
}

const cidPath = process.argv[2];
const schemaPath = process.argv[3] || path.join("schema", "cid.schema.json");
if (!cidPath) usage();

const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
const cid = JSON.parse(fs.readFileSync(cidPath, "utf8"));

const ajv = new Ajv({ allErrors: true, strict: false });
const validate = ajv.compile(schema);
const ok = validate(cid);

if (ok) {
  console.log("CID schema validation: PASS");
  process.exit(0);
}

console.error("CID schema validation: FAIL");
for (const err of validate.errors || []) {
  const at = err.instancePath || "/";
  console.error(`- ${at} ${err.message}`);
}
process.exit(1);
