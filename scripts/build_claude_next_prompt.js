const fs = require("fs");
const path = require("path");

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
  } catch {
    return fallback;
  }
}

function writeText(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text, "utf8");
}

function nowDate() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function pickNext(items) {
  const pr = (p) => (p === "urgent" ? 0 : p === "high" ? 1 : p === "medium" ? 2 : 3);
  return (items || [])
    .filter((item) => !item || !item.status || item.status === "open")
    .slice()
    .sort((a, b) => pr(a.priority) - pr(b.priority) || String(a.title || "").localeCompare(String(b.title || "")))[0];
}

function getOptionalContextFiles(root) {
  const files = [];
  const currentBrief = path.join(root, "collab", "shared", "CURRENT_OPERATING_BRIEF.md");
  if (fs.existsSync(currentBrief)) {
    files.push("collab/shared/CURRENT_OPERATING_BRIEF.md");
  }
  const sourceSystemFlow = path.join(root, "collab", "shared", "SOURCE_SYSTEM_FLOW.md");
  if (fs.existsSync(sourceSystemFlow)) {
    files.push("collab/shared/SOURCE_SYSTEM_FLOW.md");
  }
  const currentContext = path.join(root, "data", "abivax", "current_context.json");
  if (fs.existsSync(currentContext)) {
    files.push("data/abivax/current_context.json");
  }

  const promptDir = path.join(root, "collab", "claude", "prompts");
  try {
    const mikeBriefs = fs
      .readdirSync(promptDir)
      .filter((name) => /_mike-.*brief\.md$/i.test(name))
      .sort()
      .reverse();
    if (mikeBriefs[0]) {
      files.push(`collab/claude/prompts/${mikeBriefs[0]}`);
    }
  } catch {
    // ignore optional context discovery failures
  }

  return files;
}

const root = process.cwd();
const queueFile = path.join(root, "data", "abivax", "claude_lane_queue.json");
const queue = readJson(queueFile, { items: [] });
const next = pickNext(queue.items || []);

const promptPath = path.join(root, "collab", "claude", "prompts", "NEXT_PROMPT.md");
const metaPath = path.join(root, "temp", "claude-next-prompt.json");

if (!next) {
  writeText(promptPath, "# Claude Next Prompt\n\nNo queue items available.\n");
  fs.writeFileSync(metaPath, JSON.stringify({ generatedAt: new Date().toISOString(), hasPrompt: false }, null, 2));
  console.log(promptPath);
  process.exit(0);
}

const slug = String(next.title || "task")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "")
  .slice(0, 60);
const outFile = `collab/claude/outputs/${nowDate()}_${slug}.md`;

const files = Array.isArray(next.files) ? next.files : [];
const targets = Array.isArray(next.targets) ? next.targets : [];
const optionalContextFiles = getOptionalContextFiles(root);

const prompt = `# Claude Next Prompt

Work only on queue item: \`${next.id}\`

## Context Files (read first)
- \`CLAUDE.md\`
- \`collab/claude/WORKFLOW.md\`
- \`data/abivax/claude_lane_queue.json\`
${optionalContextFiles.map((f) => `- \`${f}\``).join("\n")}

## Additional Context
- Architecture pivot on \`2026-03-18\`: front-end/UI work is shelved unless Mike explicitly revives it.
- Use the current operating brief to align to the live board-to-May-21 objective before acting on the queue item.

${files.length ? `## Focus Files (read only if needed)\n${files.map((f) => `- \`${f}\``).join("\n")}\n` : ""}
${targets.length ? `## Targets\n${targets.map((t) => `- ${t}`).join("\n")}\n` : ""}
## Task
${next.title}

## Why this matters
${next.why || "Improve clarity and usefulness for Mike without adding production pipeline complexity."}

## Specific ask
${next.promptHint || "Provide a concrete writing/design critique output that Codex can implement."}

## Constraints
- Do **not** modify production code or canonical data files.
- Do **not** create agent/pipeline changes.
- Focus on writing/design critique/planning only.
- Be concrete and implementation-oriented (for Codex), but do not write production code.
- Ignore retired queue items and historical front-end critiques unless the current brief explicitly calls for them.

## Output
Save your response to:
- \`${outFile}\`

Use the format defined in \`collab/claude/WORKFLOW.md\`.
`;

writeText(promptPath, prompt);
fs.writeFileSync(
  metaPath,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      hasPrompt: true,
      queueItemId: next.id,
      outputFile: outFile,
      promptPath,
    },
    null,
    2
  )
);

console.log(promptPath);
