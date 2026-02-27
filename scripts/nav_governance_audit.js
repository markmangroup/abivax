/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");

function writeJsonNoBom(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + "\n", "utf8");
}

function parseNavItems(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  const matches = [...text.matchAll(/\{\s*href:\s*"([^"]+)",\s*label:\s*"([^"]+)"/g)];
  return matches.map((m) => ({ href: m[1], label: m[2] }));
}

function classify(label) {
  const l = label.toLowerCase();
  if (["today", "presentations", "agents"].includes(l)) return "daily";
  if (["people", "meetings", "notes", "wiki", "overview"].includes(l)) return "working";
  if (["timeline", "budget", "company intel", "plan"].includes(l)) return "reference";
  return "working";
}

function main() {
  const root = path.resolve(__dirname, "..");
  const navPath = path.join(root, "src", "app", "abivax", "spine", "SpineNav.tsx");
  const reportPath = path.join(root, "temp", "nav-governance-report.json");
  fs.mkdirSync(path.join(root, "temp"), { recursive: true });

  const navItems = parseNavItems(navPath).map((n) => ({ ...n, category: classify(n.label) }));
  const groups = {
    daily: navItems.filter((n) => n.category === "daily"),
    working: navItems.filter((n) => n.category === "working"),
    reference: navItems.filter((n) => n.category === "reference"),
  };

  const recommendations = [];
  if (groups.reference.length >= 3) {
    recommendations.push("Collapse reference pages behind a single 'Reference' group by default.");
  }
  if (groups.daily.length > 3) {
    recommendations.push("Reduce daily group to top 3 priority pages to keep focus tight.");
  }
  if (navItems.length > 10) {
    recommendations.push("Consider role-based nav modes (Operator vs Knowledge) to reduce cognitive load.");
  }

  writeJsonNoBom(reportPath, {
    generatedAt: new Date().toISOString(),
    navCount: navItems.length,
    groups,
    recommendations,
  });

  console.log(`nav governance: pages=${navItems.length} recommendations=${recommendations.length}`);
}

try {
  main();
} catch (err) {
  console.error(`nav_governance_audit failed: ${err?.message || String(err)}`);
  process.exit(1);
}
