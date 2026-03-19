'use strict';
const fs   = require('fs');
const path = require('path');

const REPO_MOUNT = path.resolve(__dirname, "mnt/abivax-1");
const REPO = fs.existsSync(REPO_MOUNT) ? REPO_MOUNT : path.resolve(__dirname, "..");
const DATA  = path.join(REPO, 'data/abivax');
const OUT   = path.join(REPO, 'outputs/ERP_Program_Encyclopedia.html');

// ── Load data ─────────────────────────────────────────────────────────────────
const people   = JSON.parse(fs.readFileSync(path.join(DATA, 'people.json'))).people;
const timeline = JSON.parse(fs.readFileSync(path.join(DATA, 'timeline.json')));
const synth    = JSON.parse(fs.readFileSync(path.join(DATA, 'pillar_synthesis.json')));
const queue    = JSON.parse(fs.readFileSync(path.join(DATA, 'claude_lane_queue.json')));

const ps = synth.programState;
const TODAY = '2026-03-18';

const milestones = (timeline.milestones || [])
  .filter(m => m.date && m.label)
  .sort((a, b) => a.date.localeCompare(b.date))
  .slice(0, 12);

const activeQueue = (queue.items || []).filter(i =>
  !['claude-design-today-layout-1','claude-design-today-program-signals-1',
    'claude-design-program-layout-1','claude-design-page-patterns-1'].includes(i.id));

// ── HTML helpers ──────────────────────────────────────────────────────────────
const e = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');

function table(headers, rows, opts = {}) {
  const accent = opts.accent || '#2E5EA8';
  const ths = headers.map((h, i) => {
    const w = opts.widths ? `style="width:${opts.widths[i]}"` : '';
    return `<th ${w}>${e(h)}</th>`;
  }).join('');
  const trs = rows.map((row, ri) => {
    const cls = ri % 2 === 0 ? 'even' : 'odd';
    const tds = row.map((cell, ci) => {
      const style = opts.cellStyle ? opts.cellStyle(ri, ci, cell) : '';
      return `<td style="${style}">${e(cell)}</td>`;
    }).join('');
    return `<tr class="${cls}">${tds}</tr>`;
  }).join('');
  return `<table class="data-table" style="--accent:${accent}"><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`;
}

function callout(title, body, color = '#1F3864', bg = '#D6E4F7') {
  return `<div class="callout" style="border-left-color:${color};background:${bg}">
    <div class="callout-title" style="color:${color}">${e(title)}</div>
    <div class="callout-body">${e(body)}</div>
  </div>`;
}

function badge(text, color, bg) {
  return `<span class="badge" style="color:${color};background:${bg}">${e(text)}</span>`;
}

function kv(pairs, accent = '#2E5EA8') {
  const rows = pairs.map(([k, v], i) => {
    const bg = i % 2 === 0 ? '#F5F6F8' : '#fff';
    return `<tr style="background:${bg}"><td class="kv-key">${e(k)}</td><td class="kv-val">${e(v)}</td></tr>`;
  }).join('');
  return `<table class="kv-table" style="--accent:${accent}"><tbody>${rows}</tbody></table>`;
}

// ── Sections ──────────────────────────────────────────────────────────────────
const navGroups = [
  {
    label: 'Foundation',
    sections: [
      { id: 's1',  num: '1',  title: 'Program Overview' },
      { id: 's2',  num: '2',  title: 'Key Decisions Log' },
      { id: 's3',  num: '3',  title: 'System Selection' },
      { id: 's4',  num: '4',  title: 'Delivery Model' },
    ]
  },
  {
    label: 'Program Detail',
    sections: [
      { id: 's5',  num: '5',  title: 'SOX and Controls' },
      { id: 's6',  num: '6',  title: 'Program Budget' },
      { id: 's7',  num: '7',  title: 'Timeline' },
      { id: 's8',  num: '8',  title: 'Risk Register' },
      { id: 's9',  num: '9',  title: 'Vendor Profiles' },
      { id: 's10', num: '10', title: 'ERP Pillars' },
      { id: 's15', num: '15', title: 'Integrations & Migration' },
    ]
  },
  {
    label: 'Reference',
    sections: [
      { id: 's11', num: '11', title: 'Governance' },
      { id: 's12', num: '12', title: 'Open Items' },
      { id: 's13', num: '13', title: 'Outputs Registry' },
      { id: 's14', num: '14', title: 'Change Log' },
    ]
  },
];

// Flat list for IntersectionObserver
const sections = navGroups.flatMap(g => g.sections);

const nav = navGroups.map(g => `
  <div class="nav-group-label">${g.label}</div>
  ${g.sections.map(s =>
    `<a href="#${s.id}" class="nav-link"><span class="nav-num">${s.num}</span>${s.title}</a>`
  ).join('')}
`).join('');

// ── Section content ───────────────────────────────────────────────────────────

function s1() {
  const risks = (ps.topProgramRisks || []).map((r, i) =>
    `<li style="color:${i < 2 ? '#8B1A1A' : '#1A1A1A'}">${e(r)}</li>`
  ).join('');
  return `
<section id="s1">
  <h1><span class="sec-num">1</span>Program Overview</h1>
  <p>Abivax is implementing NetSuite (Oracle) as its ERP platform, replacing the current multi-system finance environment. The program targets a <strong>January 1, 2027 go-live</strong> — non-negotiable, tied to the US public launch in December 2027.</p>
  ${kv([
    ['Current phase',       ps.phase || 'Post-selection / mobilization planning'],
    ['Current focus',       ps.currentFocus || ''],
    ['Go-live target',      'January 1, 2027 (non-negotiable)'],
    ['Mobilization target', 'April 2026'],
    ['Program Director',    'Mike Markman'],
    ['Executive Sponsor',   'Didier Blondel, CFO'],
    ['Finance Lead',        'Hema Keshava'],
  ])}
  <h2>Top Program Risks</h2>
  <ol class="risk-list">${risks}</ol>
</section>`;
}

function s2() {
  const rows = [
    ['2026-02-26', 'NetSuite selected as ERP platform',          'Selected over SAP following structured RFP with KPMG advisory support. Basis: TCO, timeline, native multi-GAAP, fit for Abivax scale.'],
    ['2026-02-26', 'January 1, 2027 go-live non-negotiable',     'Tied to US public launch December 2027. Compressing phases preferred over extending go-live date.'],
    ['2026-03-18', 'NetSuite Customer Success confirmed as SI',   'Paris-based team confirmed: Hafid Irbaiyne, Mazdak Sayyedelar, Ali Brahmi, Mathieu Lair, Sukeyna Ouled. French-speaking, on-site for milestones.'],
    ['2026-03-18', 'CFGI confirmed as integrated support partner','Three workstreams: controls oversight (Ken Schatz / Guy Morissette), program governance (Walid / Youness), change management (Walid / Youness). Target EUR 175-225K.'],
    ['2026-03-18', 'KPMG scoped to selection advisory only',      'KPMG engagement covered SAP vs NetSuite evaluation and is complete. No ongoing implementation role.'],
    ['2026-03-18', 'Front-end app shelved; encyclopedia adopted', 'Static HTML pages retired. Today page shelved. Program record lives in this document, generated from canonical JSON.'],
  ];
  return `
<section id="s2">
  <h1><span class="sec-num">2</span>Key Decisions Log</h1>
  <p>Authoritative decision trail for board, audit, and operational reference.</p>
  ${table(['Date','Decision','Rationale / Notes'], rows, {
    widths: ['110px','220px','auto'],
    accent: '#1F3864',
    cellStyle: (r, c) => c === 1 ? 'font-weight:600' : '',
  })}
</section>`;
}

function s3() {
  return `
<section id="s3">
  <h1><span class="sec-num">3</span>System Selection</h1>
  <p>NetSuite (Oracle SuiteSuccess Financials Premium) was selected over SAP S/4HANA on <strong>February 26, 2026</strong> following a competitive RFP process managed with KPMG France as advisory support. The decision was unanimous.</p>
  <h2>Selection Rationale</h2>
  ${table(['Factor','NetSuite Outcome'], [
    ['Multi-GAAP reporting',       'Native multi-book: IFRS, French GAAP, and US GAAP in a single system — eliminates manual bridging and quarterly IFRS adjustments'],
    ['Multi-entity consolidation', 'OneWorld handles Abivax parent + two subsidiaries (France, US) with automated intercompany eliminations'],
    ['Implementation team',        'Paris-based European delivery team; French-speaking; on-site for blueprint, UAT, and cutover'],
    ['SOX / controls readiness',   'SuiteSuccess delivery includes SoD design and controls documentation as standard scope'],
    ['Total cost vs SAP',          'Materially lower across Year 1 and 5-year horizon; SAP implementation complexity would require significantly more resources'],
    ['Timeline to Jan 1, 2027',    'Achievable from April 2026 kickoff under SuiteSuccess model; SAP timeline was not credible within this constraint'],
    ['French regulatory fit',      'E-invoicing module available; French accounting standards native; Hafid Irbaiyne (ex-CFO, French CPA) leads delivery'],
  ], { widths: ['220px','auto'] })}
  <h2>What Was Evaluated</h2>
  ${table(['Vendor','Outcome','Notes'], [
    ['NetSuite (Oracle)',       'SELECTED',          'SuiteSuccess Financials Premium; Paris-based team; selected Feb 26, 2026'],
    ['SAP S/4HANA',            'Not selected',      'Higher TCO; timeline risk; implementation complexity mismatched to Abivax scale'],
    ['KPMG France (advisory)', 'Selection only',    'Managed RFP; evaluated both platforms; no ongoing implementation role'],
  ], {
    widths: ['200px','130px','auto'],
    cellStyle: (r, c) => c === 1 && r === 0 ? 'color:#1A5C38;font-weight:700' : '',
  })}
</section>`;
}

function s4() {
  const nsTeam = [
    ['Hafid Irbaiyne',    'Practice Manager France/MEA', 'Paris — on-site',    '18 yrs; ex-CFO; French CPA; 4 yrs NetSuite; program escalation lead'],
    ['Mazdak Sayyedelar', 'Project Manager Europe',      'Paris — on-site',    '7 yrs international IT PM; 6 yrs Oracle/NetSuite'],
    ['Ali Brahmi',        'Senior Functional Consultant','Paris — on-site',    '8 yrs ERP finance; 4+ yrs Oracle NetSuite; R2R and multi-GAAP specialist'],
    ['Sukeyna Ouled',     'Technical / Dev Lead',        'Remote (on-demand)', '9+ yrs IT development; 7 yrs Oracle NetSuite; integrations'],
    ['Mathieu Lair',      'Trainer',                     'Paris — on-site',    '10 yrs ERP experience; tailored training in French'],
  ];
  const cfgiTeam = [
    ['Technical and Controls Oversight', 'Kenneth Schatz (MD)\nGuy Morissette (Director)', 'Independent design checkpoint reviews at blueprint, build, and UAT. Controls-by-design deliverable at blueprint. Written go/no-go at cutover.'],
    ['Program Governance',               'Walid Bouassida (Director)\nYouness Tyamaz (Consultant)', 'On-the-ground program coordination in Paris. Weekly flash report. Steering committee facilitation. Risk and issue escalation.'],
    ['Change Management and Adoption',   'Walid Bouassida\nYouness Tyamaz', 'Stakeholder and adoption risk mapping at kickoff. Communication plan. Training coordination in French. Post-go-live adoption checks at 30 and 60 days.'],
  ];
  const abivaxTeam = [
    ['Didier Blondel',    'CFO / Executive Sponsor',             'Global',       'Program sponsor; final escalation; board and audit committee reporting'],
    ['Mike Markman',      'ERP Program Director',                'US / Global',  'Day-to-day program ownership; vendor management; scope and budget decisions'],
    ['Hema Keshava',      'Finance Lead (FP&A, Treasury, Tax)',  'US / Global',  'Finance scope decisions; reporting model; R2R and multi-GAAP design'],
    ['Trinidad Mesa',     'Accounting Manager / Consolidation',  'France',       'French consolidation; COA; close process; primary France accounting BPO'],
    ['Frederick Golly',   'FP&A Lead',                          'France',       'FP&A and reporting model; cost center design; reporting extract requirements'],
    ['Adrian Holbrook',   'FP&A / Reporting',                   'US / Global',  'Cost center design; data-access quality; US reporting bridge (reports to Frederick)'],
    ['Juliette Courtot',  'P2P Process Owner',                   'France',       'France P2P BPO; invoice processing; workflow design; vendor master'],
    ['Kimberly Gordon',   'P2P Contractor',                      'US',           'US-side P2P; AP coordination; US workflow counterpart to Juliette'],
    ['Philippe Goncalves','Finance Manager',                     'France',       'P2P governance chain; Juliette manager; France P2P escalation'],
    ['Matt Epley',        'US Accounting / SEC Reporting',       'US',           'SEC/NASDAQ; equity (Certent); IFRS adjustments; US GAAP outputs'],
    ['Jade Nguyen',       'IT Lead / ERP Integration',           'France',       'IT integration architecture; system access; infrastructure and controls'],
    ['Benjamin Talmant',  'IT Project Manager',                  'France',       'IT delivery coordination; integration workstream PM; IT capacity'],
  ];
  return `
<section id="s4">
  <h1><span class="sec-num">4</span>Delivery Model</h1>
  <p>Two-layer external model: NetSuite as the sole system integrator, CFGI as integrated program support. Abivax retains internal ownership of all decisions, data, and business process sign-off.</p>
  <h2>Layer 1 — NetSuite Implementation Team</h2>
  <p>Paris-based Customer Success team. Solely accountable for configuration, integration delivery, data migration support, and go-live.</p>
  ${table(['Name','Role','Location','Background'], nsTeam, { widths: ['170px','190px','150px','auto'] })}
  <h2>Layer 2 — CFGI Integrated Program Support</h2>
  <p>Independent program support across three workstreams. Engaged on Abivax SOX remediation since September 2025. Jean-Arnold Coutareau (Partner) leads; Walid Bouassida (Director) is Paris-based day-to-day lead.</p>
  ${table(['Workstream','CFGI Lead','Scope'], cfgiTeam, {
    widths: ['200px','190px','auto'],
    accent: '#2E5EA8',
    cellStyle: (r, c) => c === 0 ? 'font-weight:600;background:#D6E4F7' : '',
  })}
  <h2>Abivax Internal Program Team</h2>
  ${table(['Name','Role','Location','ERP Responsibility'], abivaxTeam, { widths: ['160px','210px','110px','auto'] })}
</section>`;
}

function s5() {
  return `
<section id="s5">
  <h1><span class="sec-num">5</span>SOX and Controls</h1>
  <p>SOX readiness is a first-order program requirement embedded in the delivery model from day one. The program has <strong>143 active controls</strong> in the CFTI register.</p>
  <h2>CFTI Control Register</h2>
  ${table(['Category','Count','Notes'], [
    ['Controls / Audit',     '84',   'Core SOX controls; audit evidence and remediation tracking'],
    ['Reporting / Data',     '39',   'Financial reporting integrity; data model and close controls'],
    ['P2P',                  '20',   'Procure-to-pay transaction controls; vendor and payment flows'],
    ['Total in-scope',       '143',  ''],
    ['Out-of-scope',         '45',   'Assessed and excluded from ERP program scope'],
    ['ERP-signal controls',  '9',    'Must be addressed explicitly in blueprint before build begins'],
  ], {
    widths: ['220px','80px','auto'],
    accent: '#3B0764',
    cellStyle: (r, c) => r === 3 ? 'font-weight:700;background:#E8EAED' : '',
  })}
  ${callout('Controls-by-design approach',
    'CFGI holds the SOX remediation program and has documented Abivax\'s control gaps since September 2025. At blueprint stage, CFGI delivers a controls-by-design document mapping each ERP configuration decision to the relevant SOX control requirement. Controls are built into the system — not retrofitted after go-live.',
    '#3B0764', '#EDE9FE')}
  <h2>SOX Program Response</h2>
  ${table(['Requirement','Program Response'], [
    ['Controls-by-design at blueprint',  'CFGI deliverable mapping ERP configuration to SOX register — produced before build begins'],
    ['Segregation of duties (SoD)',       'SoD-compliant role design reviewed by CFGI at blueprint; validated at UAT'],
    ['ITGC / SDLC controls',             'NetSuite SuiteSuccess delivery includes SDLC controls as standard scope'],
    ['Audit trail and data integrity',    'NetSuite native audit logging; CFGI reviews at each milestone'],
    ['Go-live readiness',                 'CFGI written go/no-go against SOX criteria; required before cutover approved'],
    ['Post-go-live validation',           'CFGI adoption checks at 30 and 60 days confirm controls operating as designed'],
  ], { widths: ['250px','auto'], accent: '#3B0764' })}
</section>`;
}

function s6() {
  return `
<section id="s6">
  <h1><span class="sec-num">6</span>Program Budget</h1>
  <p class="note">All figures in EUR, excluding VAT. CFGI fees are targets communicated to the firm, subject to contract execution. Budget sized to approximately EUR 1.0M.</p>

  <div class="budget-block" style="--bcolor:#1F3864">
    <div class="budget-header" style="background:#1F3864">NetSuite — System and Implementation</div>
    ${table(['Line','Amount','Type','Notes'], [
      ['Recurring license (Year 1)',    'EUR 148,589', 'Annual recurring', 'Base platform, multi-entity, multi-book; after negotiated discount'],
      ['Implementation (fixed bid)',    'EUR 388,700', 'Fixed fee',        'V3 SOW 17 Mar 2026; Phase 1: R2R, P2P, multi-GAAP; O2C/Inventory in base SOW, not activated Phase 1'],
      ['Tailored training',             'EUR 7,647',   'Fixed fee',        'After discount'],
      ['Travel (capped)',               'EUR 18,000',  'Capped T&M',       'Paris team travel; hard cap in contract'],
      ['Subtotal',                      'EUR 562,936', '',                 ''],
    ], {
      widths: ['200px','120px','120px','auto'],
      accent: '#1F3864',
      cellStyle: (r, c) => r === 4 ? 'font-weight:700;background:#E8EAED' : '',
    })}
  </div>

  <div class="budget-block" style="--bcolor:#2E5EA8;margin-top:16px">
    <div class="budget-header" style="background:#2E5EA8">CFGI — Integrated Program Support</div>
    ${table(['Line','Amount','Type','Notes'], [
      ['Technical and controls oversight',       'EUR 70,000',  'Fixed fee',    'Ken Schatz / Guy Morissette; design checkpoints, controls-by-design, go/no-go'],
      ['Program governance (Walid / Youness)',   'EUR 110,000', 'T&M (capped)', 'Paris-based PMO; flash reporting; steering facilitation; 35 weeks'],
      ['Change management and adoption',         'EUR 40,000',  'T&M (capped)', 'Stakeholder mapping; comms plan; training coordination; adoption checks'],
      ['Subtotal',                               'EUR 220,000', '',             ''],
    ], {
      widths: ['240px','120px','120px','auto'],
      accent: '#2E5EA8',
      cellStyle: (r, c) => r === 3 ? 'font-weight:700;background:#E8EAED' : '',
    })}
  </div>

  <div class="budget-block" style="--bcolor:#0B5E5E;margin-top:16px">
    <div class="budget-header" style="background:#0B5E5E">Management Reserve — Finance Team Capacity</div>
    ${table(['Line','Amount','Type','Notes'], [
      ['Interim / fractional finance support', 'EUR 85,000',  'T&M (reserve)', 'Backstop capacity during peak phases; interim or advisory resources'],
      ['Training, readiness, enablement',      'EUR 37,000',  'Reserve',        'Supplemental training, system admin ramp-up, or third-party enablement'],
      ['Data migration and cutover prep',      'EUR 35,000',  'Reserve',        'Third-party support for data cleansing, mock loads, or cutover coordination'],
      ['Contingency and scope buffer',         'EUR 60,000',  'Reserve',        'Regulatory adjustments, integration complexity, or unforeseen scope'],
      ['Subtotal',                             'EUR 217,000', '',               'Held by program director; written approval required to release'],
    ], {
      widths: ['240px','120px','120px','auto'],
      accent: '#0B5E5E',
      cellStyle: (r, c) => r === 4 ? 'font-weight:700;background:#E8EAED' : '',
    })}
  </div>

  <div class="budget-total">
    <span>TOTAL PROGRAM BUDGET (YEAR 1)</span>
    <span>EUR 999,936</span>
  </div>
  <p class="note">Phase 2 scope (O2C, Inventory) contracted separately post-go-live.</p>
</section>`;
}

function s7() {
  const mRows = milestones.map(m => [m.date || '', m.label || '', m.status || m.notes || '']);
  return `
<section id="s7">
  <h1><span class="sec-num">7</span>Implementation Timeline</h1>
  <p>Eight-month implementation from April 2026 to January 1, 2027. No schedule float after October — any slippage from UAT or cutover directly threatens the go-live date.</p>
  <h2>Phase Plan</h2>
  ${table(['Phase','Timing','Key Activities'], [
    ['Mobilization',      'April 2026',       'Contracts signed; teams onboarded; governance established; kickoff; CFGI controls-by-design scope confirmed'],
    ['Blueprint',         'April – May 2026', 'Business process design; ERP configuration decisions; controls-by-design deliverable (CFGI); data migration planning; integration architecture confirmed'],
    ['Build',             'June – Aug 2026',  'System configuration; integration development; data cleansing (Abivax); mock data loads; change communications begin'],
    ['UAT',               'Aug – Oct 2026',   'User acceptance testing; defect resolution; SoD role validation; cutover planning and dry run'],
    ['Cutover / Deploy',  'Oct – Dec 2026',   'Final data migration; parallel run; CFGI written go/no-go; production cutover approval by CFO and Program Director'],
    ['Go-Live',           'Jan 1, 2027',      'Production go-live; hypercare; CFGI adoption checks at 30 and 60 days'],
  ], { widths: ['150px','160px','auto'], cellStyle: (r,c) => c===0?'font-weight:600;background:#D6E4F7':'' })}
  <h2>Key Milestones</h2>
  ${table(['Date','Milestone','Status'], mRows, { widths: ['120px','300px','auto'] })}
</section>`;
}

function s8() {
  const risks = [
    ['Commercial terms not signed before April mobilization window closes',                 'High',   'Mike / Hema',       'Accelerate contract review; Didier escalation path confirmed; target signature March 31'],
    ['NetSuite scope not locked at blueprint (O2C / Inventory ambiguity)',                  'High',   'Mike / Jamal',      'Confirm Phase 1/2 boundary on Jamal call; enforce through CFGI checkpoint reviews'],
    ['Multi-GAAP configuration complexity causes late rework',                              'Medium', 'Hafid / CFGI',      'Hafid Irbaiyne (ex-CFO, French CPA) leads design; CFGI controls-by-design at blueprint'],
    ['Finance team capacity constrained during peak implementation',                        'Medium', 'Mike / Walid',      'EUR 85K reserve for interim/fractional support; Walid manages workload visibility'],
    ['French e-invoicing regulatory scope underestimated',                                  'Medium', 'Jade / NetSuite',   'Confirm coverage in final NetSuite SOW; reserve budget available'],
    ['Data migration quality issues delay UAT',                                             'Medium', 'Abivax BPOs',       'RACI: Abivax owns data cleansing; EUR 35K reserve for third-party migration support'],
    ['NetSuite delivery lead changes post-signing',                                         'Low-Med','Mike',             'Named team contractually confirmed; Hafid as escalation; CFGI at all milestones'],
    ['CFGI engagement not executed before April',                                           'Low-Med','Mike / Jean-Arnold','Email to Ken + Jean-Arnold sent 18 Mar; combined target EUR 175-225K'],
    ['Program deprioritized due to M&A or corporate event',                                 'Low',    'Didier',           'Phase 1 scope deliberately narrow; contracts structured with clear pause/exit provisions'],
  ];
  const levelStyle = l =>
    l === 'High'   ? 'color:#8B1A1A;background:#FDECEA;font-weight:700' :
    l === 'Medium' ? 'color:#BF6C00;background:#FFF3CD;font-weight:600' :
                     'color:#1A5C38;background:#D4EDDA';
  return `
<section id="s8">
  <h1><span class="sec-num">8</span>Risk Register</h1>
  <p class="note">Living register. Update after each steering committee or when a risk status changes.</p>
  ${table(['Risk','Level','Owner','Mitigation'], risks, {
    widths: ['260px','80px','130px','auto'],
    cellStyle: (r, c) => c === 1 ? levelStyle(risks[r][1]) : '',
  })}
</section>`;
}

function s9() {
  return `
<section id="s9">
  <h1><span class="sec-num">9</span>Vendor Profiles</h1>
  <h2>NetSuite (Oracle) — System Integrator</h2>
  ${kv([
    ['Engagement type',    'System integrator — SuiteSuccess Financials Premium'],
    ['Contract status',    'V3 SOW dated 17 March 2026; under legal review; target signature March 31'],
    ['Implementation fee', 'EUR 388,700 fixed bid (V3 SOW)'],
    ['Recurring license',  'EUR 148,589 / year after discount'],
    ['Training',           'EUR 7,647 after discount'],
    ['Travel',             'EUR 18,000 capped'],
    ['Phase 1 scope',      'R2R, P2P, multi-GAAP (IFRS / French GAAP / US GAAP), OneWorld, 5 integrations'],
    ['Phase 2 scope',      'O2C, Inventory — in base SOW but not activated Phase 1; contracted separately post-go-live'],
    ['Key contact',        'Jamal Azil (Account Executive); Hafid Irbaiyne (Practice Manager, Paris)'],
    ['Watch-outs',         'O2C / Inventory still in base SOW — enforce Phase 1 boundary in contract. Abivax owns data cleansing, BPO decisions, and UAT coordination per RACI.'],
  ])}
  <h2>CFGI — Integrated Program Support</h2>
  ${kv([
    ['Engagement type',   'Integrated program support — controls oversight, governance, change management'],
    ['Contract status',   'Proposals received; combined engagement letter pending; target April mobilization'],
    ['Engagement target', 'EUR 175-225K combined; fixed fee where possible'],
    ['Current SOX role',  'SOX remediation since September 2025; Walid on-site ~2 days/week'],
    ['Paris team',        'Walid Bouassida (Director, 16 yrs, French CPA); Youness Tyamaz (Consultant, IFRS / French / US GAAP)'],
    ['US oversight',      'Kenneth Schatz (MD); Guy Morissette (Director) — technical and controls review'],
    ['Engagement lead',   'Jean-Arnold Coutareau (Partner, 30 yrs); contract and escalation through him'],
    ['Watch-outs',        'Two separate proposals (Ken + Walid) need consolidation into one engagement. NetSuite implementation references from CFGI not yet provided — outstanding diligence item.'],
  ], '#2E5EA8')}
  <h2>KPMG France — Selection Advisory (Completed)</h2>
  <p class="note">KPMG\'s engagement was scoped to the ERP selection process only. Complete as of February 26, 2026. No ongoing role.</p>
  ${kv([
    ['Engagement type', 'ERP selection advisory — SAP vs NetSuite evaluation, RFP management'],
    ['Status',          'COMPLETED — concluded at selection decision February 26, 2026'],
    ['AMOA proposal',   'EUR 370,100 total (302 man-days) — not accepted for implementation phase'],
    ['Key contact',     'Olivia Berry (Assistant Manager); 3 years experience; SAP-focused; no NetSuite experience'],
    ['Why not ongoing', 'Thin NetSuite credentials; CFGI\'s existing SOX engagement made CFGI the stronger choice'],
  ], '#6C757D')}
</section>`;
}

function s10() {
  const diagrams   = JSON.parse(fs.readFileSync(path.join(DATA, 'process_flow_diagram_payloads.json'), 'utf8'));
  const pillarsData = synth.pillars.filter(p => p.id);
  const p2p        = pillarsData.find(p => p.id === 'p2p') || {};
  const p2pFlow    = (diagrams.payloads || []).find(d => d.flowId === 'p2p-france-current-to-future') || {};
  const p2pSteps   = (p2pFlow.nodes || []).filter(n => n.lane === 'process').sort((a,b) => a.stepIndex - b.stepIndex);

  // ── shared helpers ──────────────────────────────────────────────────────────
  const ul = (arr, limit = 999, style = '') => {
    const items = arr.slice(0, limit).map(item => {
      const text  = typeof item === 'string' ? item : (item.decision || item.move || item.action || JSON.stringify(item));
      const owner = typeof item === 'object' ? (item.owner || '') : '';
      return owner
        ? `<li><span style="color:#1F3864;font-weight:600">[${e(owner)}]</span> ${e(text)}</li>`
        : `<li>${e(text)}</li>`;
    }).join('');
    const more = arr.length > limit ? `<li style="color:#888;list-style:none">+ ${arr.length - limit} more in source JSON</li>` : '';
    return `<ul style="font-size:12px;color:#333;padding-left:18px;margin:0;line-height:1.8;${style}">${items}${more}</ul>`;
  };

  const areaLabel = (icon, title, color = '#1F3864', bg = '#F0F5FF') =>
    `<div style="background:${bg};border-left:4px solid ${color};padding:8px 14px;font-size:13px;font-weight:700;color:${color};margin:0">${icon} ${e(title)}</div>`;

  // ── Req mapping by step keyword ─────────────────────────────────────────────
  const reqMap = {
    vendor:  [0, 1, 4, 7, 8],   // DoA, contractor PO, Trustpair integration, vendor workflow, SOD
    invoice: [2, 3, 5, 6, 10, 12], // PO approval, routing, 2-way match, tolerance, commitment reg, entity sep
    payment: [9, 8, 12],         // payment traceability, SOD, entity sep
    phase2:  [13],
  };
  const reqs = p2p.erpDesignRequirements || [];

  function reqList(indices) {
    return ul(indices.map(i => reqs[i]).filter(Boolean), 999,
      'background:#F8FAFF;padding:8px 8px 8px 24px;border-radius:0 0 4px 4px');
  }

  // ── P2P Mermaid flow (4-step, source: SOP0084_V01 + ABIVAX_Purchase process ENG) ─
  const mermaidDef = `flowchart LR
    subgraph RECEIPT["1 · Receipt"]
      direction TB
      R1["Invoice arrives\\nDocuShare + email inbox\\nJuliette · Fatma · Philippe"]
      R2["Invoice logged\\nJuliette Excel tracker"]
      R1 --> R2
    end
    subgraph ENTRY["2 · Entry & Coding"]
      direction TB
      E1["AP codes invoice\\nADM/RAD 20/80 split\\nProject code + cost center"]
      E2["Book in Sage\\nACHA journal entry"]
      E1 --> E2
    end
    subgraph VALIDATION["3 · Validation (DocuShare)"]
      direction TB
      D1["Route for approval\\nDocuShare — per DoA threshold"]
      D2["Approval email received\\nAdded to Excel tracker"]
      D1 --> D2
    end
    subgraph PAYMENT["4 · Payment Execution"]
      direction TB
      P1["Trustpair gate\\nMandatory — hard stop\\n48hr cutoff before campaign"]
      P2["Bank transfer\\nAgicap · Wells Fargo · SocGen\\n10th & 25th campaigns"]
      P1 --> P2
    end
    RECEIPT -->|"~4,000 invoices/yr"| ENTRY
    ENTRY --> VALIDATION
    VALIDATION -->|"650 POs/yr"| PAYMENT
    style RECEIPT    fill:#D6E4F7,stroke:#2E5EA8,color:#1F3864
    style ENTRY      fill:#D6E4F7,stroke:#2E5EA8,color:#1F3864
    style VALIDATION fill:#FFF3CD,stroke:#BF6C00,color:#5C3D00
    style PAYMENT    fill:#E8F5E9,stroke:#2E7D32,color:#1B5E20`;

  // ── Per-step detail cards ───────────────────────────────────────────────────
  function stepCard(step, reqIndices, ctrlLabel) {
    const systems = (step.systems || []).map(s => `<span style="background:#E8EDF5;border-radius:3px;padding:1px 7px;font-size:11px;font-weight:600;color:#1F3864;margin:2px">${e(s)}</span>`).join(' ');
    const pains   = step.painPoints || [];
    return `
  <div style="border:1px solid #D6E4F7;border-radius:6px;overflow:hidden;margin-bottom:12px">
    ${areaLabel('', step.label + ' — ' + (step.subtitle || ''), '#1F3864', '#EBF2FC')}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0">
      <div style="padding:12px 16px;border-right:1px solid #F0F4FA">
        <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.8px;color:#888;margin-bottom:6px">Current State Pain Points</div>
        ${ul(pains)}
        <div style="margin-top:10px;font-size:10px;text-transform:uppercase;letter-spacing:0.8px;color:#888;margin-bottom:4px">Systems (current)</div>
        <div>${systems || '<span style="font-size:12px;color:#aaa">TBC</span>'}</div>
        ${ctrlLabel ? `<div style="margin-top:8px;font-size:11px;color:#2E5EA8;font-weight:600">Controls: ${e(ctrlLabel)}</div>` : ''}
      </div>
      <div style="padding:12px 16px">
        <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.8px;color:#1F6830;margin-bottom:6px">NetSuite Requirements (Phase 1)</div>
        ${reqList(reqIndices)}
      </div>
    </div>
  </div>`;
  }

  // ── Generic pillar card for R2R / Reporting ─────────────────────────────────
  function genericPillarCard(p) {
    const known   = p.currentStateKnown     || [];
    const unknown = p.currentStateUnknown   || [];
    const reqs    = p.erpDesignRequirements || [];
    const pending = p.keyDecisionsPending   || [];
    const moves   = p.nextMoves             || [];
    const waiting = p.waitingOn             || [];
    const people  = p.keyPeople             || [];
    const cfti    = p.cftiControls          || {};
    const labelMap = { 'record-to-report': 'Record to Report (R2R)', 'reporting-planning': 'Reporting & Planning' };
    const label   = labelMap[p.id] || p.label || p.id;
    const cftiStr = cfti.total ? `${cfti.total} controls (${cfti.erpSignal||0} ERP-signal)` : '';
    const conf    = p.confidenceLevel || '';

    return `
  <div style="margin:0 0 24px;border:1px solid #E0E8F5;border-radius:6px;overflow:hidden">
    <div style="background:#2E5EA8;color:#fff;padding:10px 16px;display:flex;align-items:center;justify-content:space-between">
      <span style="font-size:14px;font-weight:700">${e(label)}</span>
      ${conf ? `<span style="font-size:11px;opacity:0.7">Confidence: ${e(conf)}</span>` : ''}
    </div>
    <div style="padding:16px;display:grid;grid-template-columns:1fr 1fr;gap:16px;border-bottom:1px solid #F0F4FA">
      <div>
        <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.8px;color:#888;margin-bottom:5px">Current State</div>
        <p style="font-size:13px;color:#333;margin:0;line-height:1.6">${e(p.currentStateSummary||'')}</p>
        ${cftiStr ? `<p style="font-size:11px;color:#2E5EA8;margin:8px 0 0;font-weight:600">CFTI: ${cftiStr}</p>` : ''}
      </div>
      <div>
        <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.8px;color:#1F6830;margin-bottom:5px">Target State (Phase 1)</div>
        <p style="font-size:13px;color:#333;margin:0;line-height:1.6">${e(p.futureStateSummary||'')}</p>
      </div>
    </div>
    ${people.length ? `<div style="padding:10px 16px;border-bottom:1px solid #F0F4FA"><span style="font-size:10px;text-transform:uppercase;letter-spacing:0.8px;color:#888">Key People: </span><span style="font-size:12px;color:#1F3864;font-weight:600">${e(people.join(' · '))}</span></div>` : ''}
    ${reqs.length ? `<div style="padding:12px 16px;border-bottom:1px solid #F0F4FA"><div style="font-size:10px;text-transform:uppercase;letter-spacing:0.8px;color:#1F6830;margin-bottom:6px">ERP Design Requirements (${reqs.length})</div>${ul(reqs, 8)}</div>` : ''}
    ${pending.length ? `<div style="padding:12px 16px;border-bottom:1px solid #F0F4FA;background:#FFFBF0"><div style="font-size:10px;text-transform:uppercase;letter-spacing:0.8px;color:#BF6C00;margin-bottom:6px">⚠ Open Decisions</div>${ul(pending)}</div>` : ''}
    ${moves.length ? `<div style="padding:12px 16px;border-bottom:1px solid #F0F4FA"><div style="font-size:10px;text-transform:uppercase;letter-spacing:0.8px;color:#666;margin-bottom:6px">Next Moves (${moves.length})</div>${ul(moves, 6)}</div>` : ''}
    ${waiting.length ? `<div style="padding:12px 16px;border-bottom:1px solid #F0F4FA;background:#F5F0FF"><div style="font-size:10px;text-transform:uppercase;letter-spacing:0.8px;color:#5B2D8E;margin-bottom:6px">Waiting On</div>${ul(waiting)}</div>` : ''}
    ${unknown.length ? `<div style="padding:12px 16px;background:#FFF0F0"><div style="font-size:10px;text-transform:uppercase;letter-spacing:0.8px;color:#8B1A1A;margin-bottom:6px">Data Gaps — Unknown (${unknown.length})</div>${ul(unknown)}</div>` : ''}
  </div>`;
  }

  // ── P2P control labels per step ─────────────────────────────────────────────
  const ctrlNodes = (p2pFlow.nodes || []).filter(n => n.lane === 'controls');
  const ctrl = i => (ctrlNodes[i] || {}).label || '';

  return `
<section id="s10">
  <h1><span class="sec-num">10</span>ERP Pillars and Process Scope</h1>

  <h2>Pillar Overview</h2>
  <p>Three primary pillars plus one cross-cutting enablement layer. Each has named business process owners and a clear definition of done.</p>
  ${table(['Pillar','BPOs','Core Scope','Done Means...'], [
    ['Record to Report (R2R)',  'Trinidad Mesa · Matt Epley',        'COA; multi-entity; FX; multi-GAAP (IFRS / French GAAP / US GAAP); close process; reporting extracts; consolidation', 'COA design agreed. Reporting extract supports FP&A. Multi-entity and multi-GAAP explicitly designed. Close is system-enforced.'],
    ['Procure to Pay (P2P)',    'Juliette Courtot · Kimberly Gordon', 'Req-to-PO; invoice processing; vendor master; payment execution; approval workflows; expense; 1099 / evidence', 'Workflow approvals system-enforced. Vendor validation and payment flow ownership explicit. Manual handoffs eliminated.'],
    ['SOX / Controls',         'CFGI (Walid) · Adrian Holbrook',     'Control design; audit trail; SoD; access controls; evidence repository; automation split', 'Key controls mapped to owners and system steps. Audit evidence paths defined. Design supports testable controls.'],
    ['Platform / Enablement',  'Jade Nguyen · Benjamin Talmant',     'IT integrations; system admin; access validation; architecture; change management', 'Integration architecture confirmed. Admin ownership explicit. IT capacity committed. Change plan live.'],
  ], { widths: ['165px','175px','210px','auto'] })}

  <h2>Procure to Pay (P2P) — France SA</h2>
  <p>P2P is the highest-priority pillar for Phase 1. 20 CFTI controls, 5 ERP-signal. Current state is manual and fragmented across Sage, DocuShare, Trustpair, and Agicap. Below is the France SA flow with per-area current state, pain points, and NetSuite requirements.</p>

  <div style="margin:20px 0;padding:16px;background:#F8FAFF;border:1px solid #D6E4F7;border-radius:6px">
    <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.8px;color:#666;margin-bottom:12px">France SA — Current State Process Flow</div>
    <div class="mermaid">
${mermaidDef}
    </div>
  </div>

  ${p2pSteps[0] ? stepCard(p2pSteps[0], reqMap.vendor,  ctrl(0)) : ''}
  ${p2pSteps[1] ? stepCard(p2pSteps[1], reqMap.invoice, ctrl(1)) : ''}
  ${p2pSteps[2] ? stepCard(p2pSteps[2], reqMap.payment, ctrl(2)) : ''}

  <h3 style="margin:24px 0 10px;font-size:14px;color:#1F3864;border-bottom:2px solid #D6E4F7;padding-bottom:6px">Approval Authority Matrices — Source: Formal Policy Documents (Mar 2026)</h3>
  <p style="font-size:12px;color:#555;margin:0 0 14px">Current-state approval thresholds. These are the DoA matrices NetSuite must enforce. Separate from contract signature authority (Didier ≤€500K · Marc de Garidel >€500K).</p>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">

    <div style="border:1px solid #D6E4F7;border-radius:6px;overflow:hidden">
      <div style="background:#2E5EA8;color:#fff;padding:8px 14px;font-size:12px;font-weight:700">PO / Contract Approval Matrix</div>
      <table style="width:100%;border-collapse:collapse;font-size:11px">
        <thead>
          <tr style="background:#EBF2FC">
            <th style="padding:6px 10px;text-align:left;color:#1F3864;border-bottom:1px solid #D6E4F7">Amount Threshold</th>
            <th style="padding:6px 10px;text-align:left;color:#1F3864;border-bottom:1px solid #D6E4F7">Required Approver</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom:1px solid #F0F4FA"><td style="padding:5px 10px;color:#333">≤ €50,000</td><td style="padding:5px 10px;color:#333">SVP · VPs · Sr Directors</td></tr>
          <tr style="background:#FAFBFF;border-bottom:1px solid #F0F4FA"><td style="padding:5px 10px;color:#333">€50K – €500K</td><td style="padding:5px 10px;color:#333">Chiefs (C-suite −1)</td></tr>
          <tr style="border-bottom:1px solid #F0F4FA"><td style="padding:5px 10px;color:#333">€500K – €750K</td><td style="padding:5px 10px;color:#333;font-weight:600">SVP Finance (Hema Keshava)</td></tr>
          <tr style="background:#FAFBFF;border-bottom:1px solid #F0F4FA"><td style="padding:5px 10px;color:#333">€750K – €1M</td><td style="padding:5px 10px;color:#333;font-weight:600">CFO (Didier Blondel)</td></tr>
          <tr><td style="padding:5px 10px;color:#8B1A1A;font-weight:700">> €1M</td><td style="padding:5px 10px;color:#8B1A1A;font-weight:700">CEO (Marc de Garidel)</td></tr>
        </tbody>
      </table>
    </div>

    <div style="border:1px solid #D6E4F7;border-radius:6px;overflow:hidden">
      <div style="background:#2E5EA8;color:#fff;padding:8px 14px;font-size:12px;font-weight:700">Invoice Approval Matrix</div>
      <table style="width:100%;border-collapse:collapse;font-size:11px">
        <thead>
          <tr style="background:#EBF2FC">
            <th style="padding:6px 10px;text-align:left;color:#1F3864;border-bottom:1px solid #D6E4F7">Amount</th>
            <th style="padding:6px 10px;text-align:left;color:#1F3864;border-bottom:1px solid #D6E4F7">Without PO</th>
            <th style="padding:6px 10px;text-align:left;color:#1F3864;border-bottom:1px solid #D6E4F7">With PO</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom:1px solid #F0F4FA"><td style="padding:5px 10px;color:#333">≤ €50K</td><td style="padding:5px 10px;color:#333">PM + SVP/VP</td><td style="padding:5px 10px;color:#1F6830">PM only</td></tr>
          <tr style="background:#FAFBFF;border-bottom:1px solid #F0F4FA"><td style="padding:5px 10px;color:#333">≤ €200K</td><td style="padding:5px 10px;color:#333">—</td><td style="padding:5px 10px;color:#1F6830">PM + SVP/VP</td></tr>
          <tr style="border-bottom:1px solid #F0F4FA"><td style="padding:5px 10px;color:#333">> €50K – €500K</td><td style="padding:5px 10px;color:#333">Chiefs</td><td style="padding:5px 10px;color:#333">—</td></tr>
          <tr style="background:#FAFBFF;border-bottom:1px solid #F0F4FA"><td style="padding:5px 10px;color:#333">> €200K – €750K</td><td style="padding:5px 10px;color:#333">—</td><td style="padding:5px 10px;color:#333">Chiefs</td></tr>
          <tr style="border-bottom:1px solid #F0F4FA"><td style="padding:5px 10px;color:#333">> €500K – €750K</td><td style="padding:5px 10px;color:#333;font-weight:600">SVP Finance</td><td style="padding:5px 10px;color:#333">—</td></tr>
          <tr style="background:#FAFBFF;border-bottom:1px solid #F0F4FA"><td style="padding:5px 10px;color:#333">> €750K – €1M</td><td style="padding:5px 10px;color:#333;font-weight:600">CFO</td><td style="padding:5px 10px;color:#333">—</td></tr>
          <tr style="border-bottom:1px solid #F0F4FA"><td style="padding:5px 10px;color:#333">> €750K – €2M</td><td style="padding:5px 10px;color:#333">—</td><td style="padding:5px 10px;color:#333;font-weight:600">SVP Finance + CFO</td></tr>
          <tr><td style="padding:5px 10px;color:#8B1A1A;font-weight:700">> €1M / >€2M</td><td style="padding:5px 10px;color:#8B1A1A;font-weight:700">CEO</td><td style="padding:5px 10px;color:#8B1A1A;font-weight:700">CEO</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <div style="background:#F0F5FF;border:1px solid #C0D4F0;border-radius:4px;padding:8px 14px;font-size:11px;color:#1F3864;margin-bottom:20px">
    <strong>Key control insight:</strong> With-PO invoices require fewer approvers at every tier — the PO acts as the pre-committed control layer. The largest gap today: PO coverage for CROs is near-zero, pushing those invoices onto the higher-scrutiny without-PO track at large dollar amounts. NetSuite must enforce this matrix and make the PO track the default.
  </div>

  <div style="margin:16px 0;border:1px solid #E8F5E9;border-radius:6px;overflow:hidden">
    ${areaLabel('📋', 'Pre-ERP Governance Requirements (before blueprint)', '#1F6830', '#E8F5E9')}
    <div style="padding:12px 16px">
      <p style="font-size:12px;color:#555;margin:0 0 8px">These items must be resolved by Abivax leadership before NetSuite configuration begins. ERP enforces decisions — it does not make them.</p>
      ${ul([reqs[0], reqs[1]].filter(Boolean))}
    </div>
  </div>

  <div style="margin:16px 0;border:1px solid #FFF3CD;border-radius:6px;overflow:hidden">
    ${areaLabel('⚠', 'Open Decisions — P2P', '#BF6C00', '#FFF8E6')}
    <div style="padding:12px 16px">
      ${ul(p2p.keyDecisionsPending || [])}
    </div>
  </div>

  <div style="margin:16px 0;border:1px solid #F3E5FF;border-radius:6px;overflow:hidden">
    ${areaLabel('→', 'Next Moves — P2P', '#5B2D8E', '#F9F0FF')}
    <div style="padding:12px 16px">
      ${ul(p2p.nextMoves || [], 8)}
    </div>
  </div>

  <h2>Record to Report (R2R)</h2>

  <%R2R_SECTION%>

  <h2>Reporting &amp; Planning</h2>
  ${genericPillarCard(pillarsData.find(p => p.id === 'reporting-planning') || {})}
</section>`;
}

function s11() {
  return `
<section id="s11">
  <h1><span class="sec-num">11</span>Governance and Oversight</h1>
  <p>Five forums covering the full escalation chain. Mike remains the day-to-day decision owner; issues surface to Didier or the Audit Committee only when warranted.</p>
  ${table(['Forum','Cadence','Attendees and Purpose'], [
    ['Program Flash Report',   'Weekly',                    'Prepared by Walid / CFGI; delivered to Mike. Status, milestones, open risks, decisions needed. Two-page max.'],
    ['Design Authority',       'As needed (blueprint/build)','NetSuite functional team, CFGI controls lead, Abivax BPOs. Configuration and design decisions; scope change management.'],
    ['Steering Committee',     'Every 4-6 weeks',           'CFO (Didier Blondel), ERP Program Director (Mike), NetSuite Practice Manager (Hafid), CFGI Program Lead (Walid). Status, risk escalation, scope and budget decisions.'],
    ['Audit Committee Update', 'Quarterly / as required',   'Audit Committee, CFO (Didier Blondel), ERP Program Director. SOX status, controls-by-design progress, go-live readiness.'],
    ['Go / No-Go Review',      'Pre-cutover (Dec 2026)',    'CFO (Didier Blondel), ERP Program Director, NetSuite PM, CFGI. Written readiness assessment before production cutover approved.'],
  ], { widths: ['190px','160px','auto'], cellStyle: (r,c) => c===0?'font-weight:600;background:#D6E4F7':'' })}
</section>`;
}

function s12() {
  const qRows = activeQueue.map(i => [i.lane || '', i.title || i.description || '', i.id || '']);

  // Immediate actions derived from program state — only current open items
  const ps = synth.programState;
  const risks = ps.topProgramRisks || [];

  // Build action rows from active risks (first 2 are highest priority by convention)
  const actionRows = [
    ['Mike / Hema',        'Sign NetSuite SOW (V3)',                    'Target March 31. EUR 388,700 fixed bid confirmed. Legal review in progress.'],
    ['Mike / Jean-Arnold', 'Consolidate CFGI proposals — one engagement','Email sent 18 Mar to Ken Schatz + Jean-Arnold Coutareau. Target EUR 175-225K combined. April start.'],
    ['Mike',               'CFGI NetSuite implementation references',    'CFGI-2 NOT FOUND in diligence — obtain before contract signature.'],
    ['Mike / Didier',      'Budget written authorization',               'Verbal approval confirmed (Didier, EUR 999,936). Formal written sign-off needed before contract execution.'],
    ['Mike / Jade',        'IT integration architecture — blueprint',    'Integration ownership and monitoring for Concur, ADP, Trustpair, Agicap not yet assigned for NetSuite build.'],
    ['Mike / Hema',        'Workiva scope confirmation',                 'Confirm with Hema whether Workiva is in scope for Phase 1 — touches reporting data model design.'],
  ];

  return `
<section id="s12">
  <h1><span class="sec-num">12</span>Open Items and Decision Queue</h1>

  <h2>Immediate Actions (This Week)</h2>
  ${table(['Owner','Item','Notes'], actionRows, {
    widths: ['155px','235px','auto'],
    cellStyle: (r, c) => c === 1 ? 'font-weight:600' : c === 0 ? 'background:#FFF3CD;color:#BF6C00;font-weight:600' : '',
  })}

  <h2>Active Risk Register Summary</h2>
  ${table(['#','Risk','Owner'], risks.map((r, i) => [String(i+1), r, '']), {
    widths: ['30px','auto','120px'],
    cellStyle: (r, c) => r < 2 && c === 1 ? 'color:#8B1A1A;font-weight:600' : '',
  })}

  <h2>Program Queue (Claude Lane)</h2>
  <p class="note">Active tasks for Claude / AI synthesis. Retired items not shown.</p>
  ${table(['Lane','Item','ID'], qRows, { widths: ['120px','340px','auto'] })}
</section>`;
}

function s13() {
  return `
<section id="s13">
  <h1><span class="sec-num">13</span>Outputs Registry</h1>
  <p>All program outputs in the <code>outputs/</code> folder. Regenerate via the corresponding script when underlying data changes.</p>
  ${table(['Document','Audience','Last Updated','Status'], [
    ['ERP Program Encyclopedia (this doc)',            'Program Director',        '2026-03-18', 'Canonical reference. Regenerate: scripts/generate_encyclopedia.js'],
    ['ERP Program Encyclopedia (.docx)',               'Program Director',        '2026-03-18', 'Word version for extraction / sharing. Same generator.'],
    ['Board ERP Readout (Mar 19, 2026)',               'Board of Directors',      '2026-03-18', 'Needs CFGI/KPMG story updated. outputs/Board_ERP_Readout_Mar19_2026.pptx'],
    ['Audit Committee ERP Controls Readout',           'Audit Committee',         '2026-03-06', 'outputs/Audit_Committee_ERP_Controls_Mar2026.pptx'],
    ['Audit Committee Program Brief',                  'Audit Committee',         '2026-03-18', 'outputs/ERP_Program_Audit_Committee_Brief_Mar2026.docx'],
    ['Vendor Comparison V2',                           'Internal — Mike',         '2026-03-18', 'Superseded by decisions. outputs/Vendor_Comparison_V2_Mar18_2026.docx'],
    ['CFGI Integrated Engagement Brief',               'CFGI (Ken + Jean-Arnold)','2026-03-18', 'collab/claude/outputs/cfgi-integrated-brief-2026-03-18.md'],
  ], { widths: ['240px','160px','110px','auto'] })}
</section>`;
}

function s14() {
  return `
<section id="s14">
  <h1><span class="sec-num">14</span>Change Log</h1>
  <p class="note">Record every material update. This is the audit trail for the program record.</p>
  ${table(['Date','Author','Changes'], [
    ['2026-03-18', 'Claude / Mike', 'Initial encyclopedia created. All March 18 decisions recorded: NetSuite as SI (Paris team confirmed), CFGI as integrated support, KPMG selection-only, front-end shelved, encyclopedia model adopted. Budget EUR 999,936 confirmed from V3 SOW. Full team roster, risk register, governance, and outputs registry included.'],
    ['2026-03-18', 'Claude', 'Section 15 (Integrations & Data Migration) added. Integration inventory sourced from integrations.json. Data migration and Workiva gaps documented.'],
  ], { widths: ['110px','130px','auto'] })}
</section>`;
}

function s15() {
  const integ = JSON.parse(fs.readFileSync(path.join(DATA, 'integrations.json'), 'utf8'));
  const integList = integ.integrations || [];

  const integRows = integList.map(i => [
    i.sourceSystem || '',
    i.targetSystem || '',
    i.feedType || '',
    i.owner || '',
    i.status || '',
    i.notes || '',
  ]);

  return `
<section id="s15">
  <h1><span class="sec-num">15</span>Integrations &amp; Data Migration</h1>

  <h2>Current Integration Stack (Sage-era)</h2>
  <p>Every integration below currently terminates in or originates from Sage, which NetSuite replaces.
  All feeds must be re-pointed or rebuilt as part of the NetSuite implementation.
  NetSuite SI is responsible for building the integration layer; Jade / IT owns technical infrastructure and ongoing monitoring;
  CFGI reviews integration design at blueprint to ensure controls are embedded.</p>

  ${table(
    ['Source System','Target System','Feed Type','Owner','Status','Notes'],
    integRows,
    { widths: ['130px','120px','110px','140px','70px','auto'] }
  )}

  <h2>Integration Responsibility Matrix</h2>
  ${table(
    ['Workstream','Owner','CFGI Role','IT / Jade Role'],
    [
      ['Integration design & build', 'NetSuite SI', 'Design review — controls embedded at blueprint', 'Technical access, credentials, network'],
      ['Trustpair feed (Sage → NetSuite)', 'Finance Controls + IT', 'Controls validation', 'Feed monitoring, failure escalation'],
      ['Agicap / Treasury feeds', 'Treasury (confirm)', 'N/A unless payment controls in scope', 'Connection config and monitoring'],
      ['ADP / Concur / Docushare', 'HR + Finance + P2P team', 'N/A', 'File transfer and error handling'],
      ['Workiva (SEC/XBRL reporting)', '⚠️ TBC — confirm with Hema', 'Reporting data model review', 'API / file connection'],
    ],
    { widths: ['180px','160px','180px','auto'] }
  )}

  <h2>Workiva — Confirmation Required</h2>
  ${callout(
    '⚠️ Open Gap: Workiva Scope',
    'Workiva is not currently in integrations.json. If Abivax uses Workiva for SEC/XBRL reporting, this integration must be designed before blueprint closes — it touches the NetSuite reporting data model directly. Confirm with Hema whether Workiva is in scope for Phase 1.',
    '#8B4000', '#FFF3E0'
  )}

  <h2>Data Migration</h2>
  ${callout(
    '⚠️ Open Gap: Data Migration Plan',
    'Data migration is not yet formally owned or scoped. Current-state data lives in Sage (chart of accounts, vendor master, open AP/AR balances, historical transactions). Migrating this to NetSuite is typically one of the top three implementation risks on a program this size. KPMG\'s proposal covered this under functional assistance — with KPMG out, this must be explicitly assigned. Candidates: NetSuite SI (primary), CFGI (design and validation oversight). Formal data migration plan with ownership, scope, and cutover approach should be a blueprint deliverable.',
    '#8B1A1A', '#FFF0F0'
  )}

  ${table(
    ['Migration Workstream','Complexity','Proposed Owner','Status'],
    [
      ['Chart of accounts', 'Medium — multi-GAAP mapping required', 'NetSuite SI + Hema', '⚠️ Not assigned'],
      ['Vendor master (497 vendors confirmed)', 'Medium — Trustpair integration dependency', 'NetSuite SI + Finance Controls', '⚠️ Not assigned'],
      ['Open AP / AR balances', 'High — cutover timing critical', 'NetSuite SI + CFGI oversight', '⚠️ Not assigned'],
      ['Historical transaction data', 'Medium — reporting baseline dependency', 'NetSuite SI (confirm scope)', '⚠️ Not assigned'],
      ['Employee / cost center data', 'Low-Medium', 'HR + Finance (ADP source)', '⚠️ Not assigned'],
    ],
    {
      widths: ['200px','220px','200px','auto'],
      cellStyle: (r, c, v) => c === 3 && v.includes('⚠️') ? 'color:#8B4000;font-weight:600' : ''
    }
  )}
</section>`;
}

// ── Assemble ──────────────────────────────────────────────────────────────────
const body = [s1,s2,s3,s4,s5,s6,s7,s8,s9,s10,s11,s12,s13,s14,s15].map(f => f()).join('\n');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Abivax ERP Program Encyclopedia</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --navy:   #1F3864;
    --blue:   #2E5EA8;
    --ltblue: #D6E4F7;
    --gray1:  #F5F6F8;
    --gray2:  #E8EAED;
    --gray3:  #6C757D;
    --black:  #1A1A1A;
    --white:  #ffffff;
    --sidebar-w: 250px;
    --font: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif;
  }

  body { font-family: var(--font); font-size: 14px; color: var(--black);
         background: #f0f2f5; display: flex; min-height: 100vh; }

  /* ── Sidebar ── */
  #sidebar {
    width: var(--sidebar-w); min-width: var(--sidebar-w);
    background: var(--navy); color: #fff;
    position: fixed; top: 0; left: 0; bottom: 0;
    overflow-y: auto; display: flex; flex-direction: column;
    z-index: 100;
  }
  #sidebar-header {
    padding: 20px 16px 14px;
    border-bottom: 1px solid rgba(255,255,255,0.12);
  }
  #sidebar-header .logo { font-size: 11px; text-transform: uppercase;
    letter-spacing: 1.2px; color: rgba(255,255,255,0.5); margin-bottom: 4px; }
  #sidebar-header .title { font-size: 15px; font-weight: 700; color: #fff; line-height: 1.3; }
  #sidebar-header .meta { font-size: 11px; color: rgba(255,255,255,0.4);
    margin-top: 6px; line-height: 1.5; }

  .nav-section-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px;
    color: rgba(255,255,255,0.35); padding: 14px 16px 4px; }
  .nav-group-label { font-size: 9px; text-transform: uppercase; letter-spacing: 1.2px;
    color: rgba(255,255,255,0.28); padding: 16px 16px 3px; margin-top: 4px;
    border-top: 1px solid rgba(255,255,255,0.07); }
  .nav-group-label:first-child { border-top: none; margin-top: 0; }

  a.nav-link {
    display: flex; align-items: center; gap: 10px;
    padding: 8px 16px; font-size: 13px; font-weight: 500;
    color: rgba(255,255,255,0.75); text-decoration: none;
    border-left: 3px solid transparent;
    transition: all 0.15s ease;
  }
  a.nav-link:hover { color: #fff; background: rgba(255,255,255,0.08);
    border-left-color: rgba(255,255,255,0.3); }
  a.nav-link.active { color: #fff; background: rgba(255,255,255,0.12);
    border-left-color: #60A5FA; }
  .nav-num { font-size: 11px; color: rgba(255,255,255,0.35);
    min-width: 18px; text-align: right; }

  #sidebar-footer { margin-top: auto; padding: 14px 16px;
    border-top: 1px solid rgba(255,255,255,0.1);
    font-size: 11px; color: rgba(255,255,255,0.3); line-height: 1.6; }

  /* ── Main ── */
  #main { margin-left: var(--sidebar-w); flex: 1; padding: 0 0 80px; }

  #page-header {
    background: var(--white); border-bottom: 2px solid var(--ltblue);
    padding: 28px 48px 24px; position: sticky; top: 0; z-index: 50;
  }
  #page-header h1 { font-size: 22px; font-weight: 800; color: var(--navy); margin-bottom: 4px; }
  #page-header .meta { font-size: 13px; color: var(--gray3); }
  #page-header .pills { display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap; }
  .pill { font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 20px;
    background: var(--ltblue); color: var(--blue); }
  .pill.green  { background: #D4EDDA; color: #1A5C38; }
  .pill.amber  { background: #FFF3CD; color: #BF6C00; }
  .pill.red    { background: #FDECEA; color: #8B1A1A; }

  /* ── Sections ── */
  section { background: var(--white); margin: 24px 32px 0;
    border-radius: 8px; padding: 36px 40px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06); }

  section h1 { font-size: 20px; font-weight: 800; color: var(--navy);
    margin-bottom: 12px; padding-bottom: 10px;
    border-bottom: 2px solid var(--ltblue); display: flex; align-items: center; gap: 10px; }
  .sec-num { display: inline-flex; align-items: center; justify-content: center;
    width: 28px; height: 28px; border-radius: 50%;
    background: var(--navy); color: #fff; font-size: 13px; font-weight: 700; flex-shrink: 0; }

  section h2 { font-size: 15px; font-weight: 700; color: var(--blue);
    margin: 24px 0 10px; }

  section p { font-size: 14px; line-height: 1.65; color: var(--black); margin-bottom: 14px; }
  section p.note { font-size: 12px; color: var(--gray3); font-style: italic; }
  section code { font-family: "SF Mono", Consolas, monospace; font-size: 12px;
    background: var(--gray1); padding: 1px 5px; border-radius: 3px; }

  /* ── Tables ── */
  .data-table { width: 100%; border-collapse: collapse; font-size: 13px; margin: 8px 0 16px; }
  .data-table thead tr { background: var(--accent, var(--navy)); }
  .data-table th { padding: 9px 12px; text-align: left; font-weight: 600;
    font-size: 12px; color: #fff; white-space: nowrap; }
  .data-table td { padding: 8px 12px; vertical-align: top; line-height: 1.5;
    border-bottom: 1px solid var(--gray2); }
  .data-table tr.even td { background: var(--gray1); }
  .data-table tr.odd td { background: var(--white); }
  .data-table tr:hover td { background: var(--ltblue) !important; }

  .kv-table { width: 100%; border-collapse: collapse; font-size: 13px; margin: 8px 0 16px; }
  .kv-key { width: 200px; font-weight: 600; padding: 8px 12px;
    vertical-align: top; white-space: nowrap; color: var(--navy); }
  .kv-val { padding: 8px 12px; vertical-align: top; line-height: 1.5; }

  /* ── Callout ── */
  .callout { border-left: 4px solid; border-radius: 0 6px 6px 0;
    padding: 14px 18px; margin: 16px 0; }
  .callout-title { font-weight: 700; font-size: 14px; margin-bottom: 6px; }
  .callout-body  { font-size: 13px; line-height: 1.65; }

  /* ── Budget ── */
  .budget-block { border-radius: 6px; overflow: hidden; border: 1px solid var(--gray2); }
  .budget-header { color: #fff; font-weight: 700; font-size: 13px; padding: 9px 14px; }
  .budget-total { background: var(--navy); color: #fff; font-weight: 800;
    font-size: 16px; padding: 14px 20px; border-radius: 6px; margin-top: 16px;
    display: flex; justify-content: space-between; align-items: center; }

  /* ── Badge ── */
  .badge { display: inline-block; font-size: 11px; font-weight: 700;
    padding: 2px 8px; border-radius: 10px; }

  /* ── Risk list ── */
  ol.risk-list { padding-left: 20px; margin: 8px 0 16px; }
  ol.risk-list li { font-size: 13px; line-height: 1.6; margin-bottom: 6px; padding-left: 4px; }

  /* ── Print ── */
  @media print {
    #sidebar { display: none; }
    #main { margin-left: 0; }
    section { box-shadow: none; border: 1px solid #ddd; margin: 16px 0; break-inside: avoid; }
  }
</style>
</head>
<body>

<nav id="sidebar">
  <div id="sidebar-header">
    <div class="logo">Abivax ERP Program</div>
    <div class="title">Program Encyclopedia</div>
    <div class="meta">Program Director: Mike Markman<br>Generated: ${TODAY}</div>
  </div>
  ${nav}
  <div id="sidebar-footer">
    Confidential — Program Director Use<br>
    Regenerate: <code style="background:rgba(255,255,255,0.1);color:#ccc">scripts/generate_encyclopedia.js</code>
  </div>
</nav>

<div id="main">
  <div id="page-header">
    <h1>Abivax ERP Program Encyclopedia</h1>
    <div class="meta">Executive Sponsor: Didier Blondel, CFO &nbsp;|&nbsp; Go-Live: January 1, 2027 &nbsp;|&nbsp; Last generated: ${TODAY}</div>
    <div class="pills">
      <span class="pill">Post-Selection</span>
      <span class="pill amber">Mobilization: April 2026</span>
      <span class="pill green">Platform: NetSuite</span>
      <span class="pill green">SI: NetSuite Paris Team</span>
      <span class="pill green">Support: CFGI</span>
      <span class="pill">Budget: EUR 999,936</span>
    </div>
  </div>

  ${body}
</div>

<script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
<script>
  mermaid.initialize({ startOnLoad: true, theme: 'base',
    themeVariables: { primaryColor: '#D6E4F7', primaryTextColor: '#1F3864',
      primaryBorderColor: '#2E5EA8', lineColor: '#2E5EA8',
      secondaryColor: '#F5F6F8', tertiaryColor: '#fff',
      edgeLabelBackground: '#fff', fontFamily: 'Inter, system-ui, sans-serif' }
  });

  // Highlight active nav link on scroll
  const links = document.querySelectorAll('a.nav-link');
  const secs  = document.querySelectorAll('section[id]');
  const obs   = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + en.target.id));
      }
    });
  }, { rootMargin: '-20% 0px -70% 0px' });
  secs.forEach(s => obs.observe(s));

  // Smooth scroll
  links.forEach(l => l.addEventListener('click', e => {
    e.preventDefault();
    const t = document.querySelector(l.getAttribute('href'));
    if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));
</script>
</body>
</html>`;

fs.writeFileSync(OUT, html);
console.log('HTML encyclopedia written to: ' + OUT);
