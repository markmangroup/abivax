/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

const TARGET_FILES = [
  "data/abivax/emails_staging/emails_2026-03-02.json",
  "collab/claude/outputs/emails_2026-03-02_extracted.json",
  "collab/claude/outputs/emails_2026-03-02_complete.md",
  "collab/claude/outputs/emails_2026-03-02_extracted.csv",
];

const EXACT_REPLACEMENTS = [
  ["Password: [REDACTED]", "Password: [REDACTED]"],
  ["Password: [REDACTED]", "Password: [REDACTED]"],
  ["Username: csi\\\\mmarkman", "Username: [REDACTED]"],
  ["Username: [REDACTED]", "Username: [REDACTED]"],
  ["PWD: [REDACTED]
  ["PWD: [REDACTED]
];

const REGEX_REPLACEMENTS = [
  [/PWD\s*:\s*(?!\[REDACTED\])[^\r\n]+/g, "PWD: [REDACTED]
];

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

  for (const relPath of TARGET_FILES) {
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
