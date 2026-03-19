#!/usr/bin/env node
/**
 * validate_encyclopedia.js
 * Consistency checker for the Abivax ERP Program Encyclopedia data.
 *
 * Reads canonical JSON files and flags stale data, naming inconsistencies,
 * budget drift, and output freshness issues.
 *
 * Run: node scripts/validate_encyclopedia.js
 * Add to CI or run after each major JSON update before regenerating.
 */

const fs   = require('fs');
const path = require('path');

const REPO  = path.resolve(__dirname, '..');
const DATA  = path.join(REPO, 'data', 'abivax');
const OUT   = path.join(REPO, 'outputs');

// ─── helpers ──────────────────────────────────────────────────────────────────

function load(file) {
  const p = path.join(DATA, file);
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); }
  catch(e) { return null; }
}

let errors = 0, warns = 0, infos = 0;
const results = [];

function report(level, check, message) {
  results.push({ level, check, message });
  if (level === 'ERROR') errors++;
  else if (level === 'WARN')  warns++;
  else infos++;
}

function ok(check, message) {
  results.push({ level: 'OK', check, message });
}

// ─── load files ───────────────────────────────────────────────────────────────

const pillar     = load('pillar_synthesis.json');
const people     = load('people.json');
const timeline   = load('timeline.json');
const budget     = load('budget.json');
const impl       = load('implementation_options.json');
const queue      = load('claude_lane_queue.json');

const ps = pillar?.programState;

// ─── checks ───────────────────────────────────────────────────────────────────

// 1. Go-live year
(function check_goLive_year() {
  if (!ps) return report('ERROR', 'goLive_year', 'pillar_synthesis.json missing or programState absent');
  const yr = String(ps.goLive || '').slice(0,4);
  if (yr !== '2027') report('ERROR', 'goLive_year', `programState.goLive is "${ps.goLive}" — expected 2027-01-01`);
  else ok('goLive_year', `programState.goLive = ${ps.goLive} ✓`);

  // also check timeline
  if (timeline) {
    const phases = timeline.phases || timeline;
    const str = JSON.stringify(phases);
    const m = str.match(/"20\d\d-\d\d-\d\d"/g) || [];
    const bad = m.filter(d => d.includes('2026') && d.toLowerCase().includes('go') );
    // check top-level go_live_date
    const tlGol = timeline.go_live_date || timeline.goLive;
    if (tlGol && String(tlGol).slice(0,4) !== '2027') {
      report('WARN', 'goLive_year', `timeline.json go_live_date = "${tlGol}" — expected 2027`);
    }
  }
})();

// 2. KPMG references in data files
(function check_kpmg_references() {
  // For implementation_options.json: use structured analysis.
  // Warn only if KPMG appears in a non-superseded, non-historical model
  // or in forward-looking fields (selected, kpmgScope, evidenceStillNeeded).
  if (impl) {
    // Check top-level selected decision — KPMG should not be the selected model
    const sel = JSON.stringify(impl.selected || {}).toLowerCase();
    if (/kpmg/.test(sel) && !/audit|statutory/.test(sel)) {
      report('WARN', 'kpmg_references', `implementation_options.json: selected model still references KPMG in an implementation capacity`);
    }

    // kpmgScope must exist and role must be "statutory-audit-only" (or equivalent)
    if (!impl.kpmgScope) {
      report('WARN', 'kpmg_references', `implementation_options.json: missing kpmgScope field — KPMG role not formally bounded`);
    } else if (!/statutory|audit.only/i.test(impl.kpmgScope.role || '')) {
      report('WARN', 'kpmg_references', `implementation_options.json: kpmgScope.role is "${impl.kpmgScope.role}" — expected "statutory-audit-only"`);
    } else {
      ok('kpmg_references', `implementation_options.json kpmgScope.role = "${impl.kpmgScope.role}" ✓`);
    }

    // Active (non-superseded) models should not frame KPMG as implementation partner
    const activeModels = (impl.models || []).filter(m => m.status !== 'superseded' && m.status !== 'not-selected');
    activeModels.forEach(m => {
      const teamShape = (m.teamShape || '').toLowerCase();
      if (/kpmg/.test(teamShape) && !/audit|statutory/.test(teamShape)) {
        report('WARN', 'kpmg_references', `implementation_options.json: active model "${m.id}" teamShape still references KPMG: "${m.teamShape}"`);
      }
    });

    // evidenceStillNeeded should not list KPMG scope confirmation as open
    const evidence = JSON.stringify(impl.evidenceStillNeeded || []).toLowerCase();
    if (/kpmg.*scope.*confirm|confirm.*kpmg.*scope/i.test(evidence)) {
      report('WARN', 'kpmg_references', `implementation_options.json: evidenceStillNeeded still lists KPMG scope confirmation as open — decision is closed`);
    }
  }

  // For other files: line-based check, skipping lines inside superseded/not-selected model blocks
  // and lines that are clearly historical narrative (descriptions, summaries of evaluated options)
  const filesToCheck = [
    'pillar_synthesis.json',
    'people.json',
    'timeline.json',
  ];

  // Fields in pillar_synthesis that are expected to reference KPMG historically
  const ALLOWED_KPMG_CONTEXTS = /currentStateSummary|whyItMatters|currentState|history|archive|_archived|changeLog|legacy|previous|old|notes|summary|description/i;

  filesToCheck.forEach(f => {
    const raw = (() => {
      const p = path.join(DATA, f);
      return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
    })();
    const lines = raw.split('\n');
    lines.forEach((line, i) => {
      if (/kpmg/i.test(line)) {
        // Skip if line key is a known historical/narrative field
        if (ALLOWED_KPMG_CONTEXTS.test(line)) return;
        // Skip if line is clearly a changeLog entry
        if (/"date"|"change"|"by"/.test(line)) return;
        report('WARN', 'kpmg_references', `${f}:${i+1} — possible stale KPMG reference: ${line.trim().slice(0,120)}`);
      }
    });
  });

  if (!results.find(r => r.check === 'kpmg_references' && r.level === 'WARN')) {
    ok('kpmg_references', 'No live KPMG references found outside expected historical/audit contexts ✓');
  }
})();

// 3. Stale deadlines
(function check_stale_deadlines() {
  if (!ps?.nextHardDeadlines) return report('WARN', 'stale_deadlines', 'nextHardDeadlines missing from programState');
  const today = new Date();
  today.setHours(0,0,0,0);
  ps.nextHardDeadlines.forEach(d => {
    const dt = new Date(d.date);
    if (dt < today) {
      report('WARN', 'stale_deadlines', `Past deadline still in nextHardDeadlines: ${d.date} — "${d.event}"`);
    }
  });
  if (!results.find(r => r.check === 'stale_deadlines' && r.level === 'WARN')) {
    ok('stale_deadlines', `All ${ps.nextHardDeadlines.length} deadlines are future-dated ✓`);
  }
})();

// 4. Sponsor naming
(function check_sponsor_naming() {
  if (!ps?.keyPeople) return report('ERROR', 'sponsor_naming', 'keyPeople missing from programState');
  const kp = ps.keyPeople;

  // executiveSponsor should reference Didier
  const exec = JSON.stringify(kp.executiveSponsor || '').toLowerCase();
  if (!exec.includes('didier')) {
    report('ERROR', 'sponsor_naming', `executiveSponsor does not reference Didier: ${JSON.stringify(kp.executiveSponsor)}`);
  } else {
    ok('sponsor_naming', `executiveSponsor references Didier ✓`);
  }

  // financeLead should reference Hema
  const fin = JSON.stringify(kp.financeLead || '').toLowerCase();
  if (!fin.includes('hema')) {
    report('ERROR', 'sponsor_naming', `financeLead does not reference Hema: ${JSON.stringify(kp.financeLead)}`);
  } else {
    ok('sponsor_naming', `financeLead references Hema ✓`);
  }

  // should NOT have internalSponsors array (old structure)
  if (kp.internalSponsors) {
    report('WARN', 'sponsor_naming', 'keyPeople still has legacy "internalSponsors" array — should be removed');
  }

  // should NOT have kpmgReporting (retired)
  if (kp.kpmgReporting) {
    report('WARN', 'sponsor_naming', 'keyPeople still has legacy "kpmgReporting" field — should be removed');
  }
})();

// 5. Risk count
(function check_risk_count() {
  if (!ps?.topProgramRisks) return report('WARN', 'risk_count', 'topProgramRisks missing from programState');
  const n = ps.topProgramRisks.length;
  if (n < 3) report('WARN', 'risk_count', `Only ${n} risks in topProgramRisks — suspiciously low`);
  else if (n > 12) report('WARN', 'risk_count', `${n} risks in topProgramRisks — consider trimming to top 10`);
  else ok('risk_count', `topProgramRisks has ${n} items ✓`);
})();

// 6. Open items staleness
(function check_open_items_staleness() {
  if (!queue) return report('INFO', 'open_items_staleness', 'claude_lane_queue.json not found — skipping');
  const items = queue.items || queue;
  if (!Array.isArray(items)) return report('WARN', 'open_items_staleness', 'claude_lane_queue items is not an array');
  const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const INACTIVE = new Set(['done', 'completed', 'retired', 'closed']);
  let stale = 0;
  items.forEach(item => {
    if (INACTIVE.has(item.status)) return;
    const updated = item.updatedAt || item.createdAt;
    if (!updated) {
      stale++;
    } else if (new Date(updated) < cutoff) {
      stale++;
    }
  });
  const open = items.filter(i => !INACTIVE.has(i.status)).length;
  if (stale > 0) report('WARN', 'open_items_staleness', `${stale} of ${open} open queue items have no update in 14+ days`);
  else ok('open_items_staleness', `All ${open} open items updated within 14 days ✓`);
})();

// 7. Budget sum (~€1M target)
(function check_budget_sum() {
  if (!budget) return report('INFO', 'budget_sum', 'budget.json not found — skipping');
  const total = budget.grandTotal || budget.totalBudget || budget.total;
  if (!total) return report('INFO', 'budget_sum', 'budget.json found but no grandTotal/total field');
  const EUR_TOTAL = parseFloat(String(total).replace(/[^0-9.]/g,''));
  if (EUR_TOTAL < 900000 || EUR_TOTAL > 1100000) {
    report('WARN', 'budget_sum', `Grand total ${total} is outside €900K–€1.1M range — verify alignment with program budget`);
  } else {
    ok('budget_sum', `Grand total ${total} within expected ~€1M range ✓`);
  }
})();

// 8. O2C/Inventory Phase 1 scope flag
(function check_phase1_scope() {
  if (!impl) return report('INFO', 'phase1_scope', 'implementation_options.json not found — skipping');
  const str = JSON.stringify(impl);
  const hasO2C = /o2c|order.to.cash/i.test(str);
  const hasPhase1Flag = /phase.?1/i.test(str);
  if (hasO2C && !hasPhase1Flag) {
    report('WARN', 'phase1_scope', 'O2C/Order-to-Cash appears in implementation_options but no Phase 1 scope flag found — confirm boundary is documented');
  } else if (hasO2C) {
    ok('phase1_scope', 'O2C reference found with Phase 1 qualifier ✓');
  } else {
    report('INFO', 'phase1_scope', 'No O2C reference in implementation_options.json');
  }
})();

// 9. People active cross-reference
(function check_people_active() {
  if (!ps?.keyPeople || !people) return;
  const pplList = Array.isArray(people) ? people : (people.people || Object.values(people));
  const allNames = pplList.map(p => (p.name || p.fullName || '').toLowerCase());

  const keyNames = [];
  const kp = ps.keyPeople;
  Object.values(kp).forEach(v => {
    if (typeof v === 'string') keyNames.push(v);
    else if (v && typeof v === 'object') {
      const n = v.name || v.fullName;
      if (n) keyNames.push(n);
    }
    else if (Array.isArray(v)) v.forEach(item => {
      if (typeof item === 'string') keyNames.push(item);
      else if (item?.name) keyNames.push(item.name);
    });
  });

  let unmatched = 0;
  keyNames.forEach(name => {
    const lower = name.toLowerCase();
    const found = allNames.some(n => n.includes(lower.split(' ')[0]) || lower.includes(n.split(' ')[0]));
    if (!found) {
      report('WARN', 'people_active', `keyPeople "${name}" has no matching record in people.json`);
      unmatched++;
    }
  });
  if (unmatched === 0) ok('people_active', `All keyPeople names matched in people.json ✓`);
})();

// 10. Output freshness
(function check_output_freshness() {
  const htmlPath = path.join(OUT, 'ERP_Program_Encyclopedia.html');
  const docxPath = path.join(OUT, 'ERP_Program_Encyclopedia.docx');

  const dataFiles = [
    'pillar_synthesis.json', 'people.json', 'timeline.json',
    'implementation_options.json', 'claude_lane_queue.json'
  ].map(f => path.join(DATA, f));

  const latestData = dataFiles.reduce((max, f) => {
    if (!fs.existsSync(f)) return max;
    const mtime = fs.statSync(f).mtimeMs;
    return mtime > max ? mtime : max;
  }, 0);

  [{ file: htmlPath, label: 'Encyclopedia HTML' }, { file: docxPath, label: 'Encyclopedia DOCX' }].forEach(({file, label}) => {
    if (!fs.existsSync(file)) {
      report('WARN', 'output_freshness', `${label} does not exist — run generator`);
      return;
    }
    const outMtime = fs.statSync(file).mtimeMs;
    if (latestData > outMtime) {
      const dataDate = new Date(latestData).toISOString().slice(0,16);
      const outDate  = new Date(outMtime).toISOString().slice(0,16);
      report('INFO', 'output_freshness', `${label} (${outDate}) is older than latest JSON data (${dataDate}) — consider regenerating`);
    } else {
      ok('output_freshness', `${label} is up to date ✓`);
    }
  });
})();

// ─── report ───────────────────────────────────────────────────────────────────

const WIDTH = 80;
const pad = (s, n) => String(s).padEnd(n);
const SEP = '─'.repeat(WIDTH);

console.log('\n' + SEP);
console.log('  ERP ENCYCLOPEDIA VALIDATOR');
console.log('  ' + new Date().toISOString().slice(0,16).replace('T', ' '));
console.log(SEP);

['ERROR', 'WARN', 'INFO', 'OK'].forEach(level => {
  const group = results.filter(r => r.level === level);
  if (group.length === 0) return;
  const icons = { ERROR: '🔴', WARN: '🟡', INFO: '🔵', OK: '✅' };
  console.log(`\n${icons[level]}  ${level} (${group.length})`);
  group.forEach(r => {
    const prefix = `   [${r.check}] `;
    const wrap = r.message;
    console.log(prefix + wrap);
  });
});

console.log('\n' + SEP);
const status = errors > 0 ? '🔴 FAIL' : warns > 0 ? '🟡 PASS with warnings' : '✅ PASS';
console.log(`  ${status}  |  Errors: ${errors}  Warnings: ${warns}  Info: ${infos}`);
console.log(SEP + '\n');

process.exit(errors > 0 ? 1 : 0);
