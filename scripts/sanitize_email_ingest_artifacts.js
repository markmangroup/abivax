/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

const STATIC_TARGET_FILES = [
  "collab/claude/outputs/emails_2026-03-02_extracted.json",
  "collab/claude/outputs/emails_2026-03-02_complete.md",
  "collab/claude/outputs/emails_2026-03-02_extracted.csv",
];

const EXACT_REPLACEMENTS = [];

const REGEX_REPLACEMENTS = [
  [/Password\s*:\s*(?!\[REDACTED\])[^\r\n]+/g, "Password: [REDACTED]"],
  [/Username\s*:\s*(?!\[REDACTED\])[^\r\n]+/g, "Username: [REDACTED]"],
  [/PWD\s*:\s*(?!\[REDACTED\])[^\r\n]+/g, "PWD: [REDACTED]"],
];

function getTargetFiles() {
  const targets = [...STATIC_TARGET_FILES];
  const stagingDir = path.join(ROOT, "data", "abivax", "emails_staging");
  if (fs.existsSync(stagingDir)) {
    for (const name of fs.readdirSync(stagingDir)) {
      if (/^emails_\d{4}-\d{2}-\d{2}\.json$/.test(name)) {
        targets.push(path.join("data/abivax/emails_staging", name));
      }
    }
  }
  return targets;
}

function countOccurrences(haystack, needle) {
  if (!needle) return 0;
  return haystack.split(needle).length - 1;
}

function sanitizeText(input) {
  let output = input;
  let replacements = 0;

  for (const [from, to] of EXACT_REPLACEMENTS) {
    const hits = countOccurrences(output, from);
    if (hits > 0) {
      output = output.split(from).join(to);
      replacements += hits;
    }
  }

  for (const [pattern, replacement] of REGEX_REPLACEMENTS) {
    const matches = output.match(pattern);
    if (matches && matches.length > 0) {
      output = output.replace(pattern, replacement);
      replacements += matches.length;
    }
  }

  return { output, replacements };
}

function main() {
  let changedFiles = 0;
  let totalReplacements = 0;

  for (const relPath of getTargetFiles()) {
    const filePath = path.join(ROOT, relPath);
    if (!fs.existsSync(filePath)) continue;
    const before = fs.readFileSync(filePath, "utf8");
    const { output, replacements } = sanitizeText(before);
    if (output !== before) {
      fs.writeFileSync(filePath, output, "utf8");
      changedFiles += 1;
    }
    totalReplacements += replacements;
  }

  console.log(
    `sanitize_email_ingest_artifacts: changed_files=${changedFiles} replacements=${totalReplacements}`
  );
}

main();
