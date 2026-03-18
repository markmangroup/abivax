'use strict';
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, VerticalAlign, PageNumber, PageBreak, TableOfContents,
  LevelFormat, ExternalHyperlink, TabStopType, TabStopPosition
} = require('docx');
const fs   = require('fs');
const path = require('path');

// ─── Paths ────────────────────────────────────────────────────────────────────
const REPO_MOUNT = path.resolve(__dirname, "mnt/abivax-1");
const REPO = fs.existsSync(REPO_MOUNT) ? REPO_MOUNT : path.resolve(__dirname, "..");
const DATA   = path.join(REPO, 'data/abivax');
const OUT    = path.join(REPO, 'outputs/ERP_Program_Encyclopedia.docx');

// ─── Load data ────────────────────────────────────────────────────────────────
const people      = JSON.parse(fs.readFileSync(path.join(DATA, 'people.json'))).people;
const timeline    = JSON.parse(fs.readFileSync(path.join(DATA, 'timeline.json')));
const synth       = JSON.parse(fs.readFileSync(path.join(DATA, 'pillar_synthesis.json')));
const queue       = JSON.parse(fs.readFileSync(path.join(DATA, 'claude_lane_queue.json')));
const implOpts    = JSON.parse(fs.readFileSync(path.join(DATA, 'implementation_options.json')));

// ─── Colors ───────────────────────────────────────────────────────────────────
const NAVY   = '1F3864';
const BLUE   = '2E5EA8';
const LTBLUE = 'D6E4F7';
const GREEN  = '1A5C38';
const GREENLT= 'D4EDDA';
const AMBER  = 'BF6C00';
const AMBERLT= 'FFF3CD';
const RED    = '8B1A1A';
const REDLT  = 'FDECEA';
const GRAY1  = 'F5F6F8';
const GRAY2  = 'E8EAED';
const GRAY3  = '6C757D';
const WHITE  = 'FFFFFF';
const BLACK  = '1A1A1A';
const TEAL   = '0B5E5E';
const TEALLT = 'D0EDEC';
const PURPLE = '3B0764';
const PURPLT = 'EDE9FE';

// ─── Page ─────────────────────────────────────────────────────────────────────
const PW   = 12240;
const PH   = 15840;
const MAR  = 1440;
const CW   = PW - MAR * 2;  // 9360

// ─── Borders ──────────────────────────────────────────────────────────────────
const thin  = { style: BorderStyle.SINGLE, size: 1, color: 'C8CDD3' };
const none  = { style: BorderStyle.NONE,   size: 0, color: 'FFFFFF' };
const allT  = { top: thin, bottom: thin, left: thin, right: thin };
const allN  = { top: none, bottom: none, left: none, right: none };

// ─── Cell margins ─────────────────────────────────────────────────────────────
const pm  = { top: 90,  bottom: 90,  left: 140, right: 140 };
const pml = { top: 120, bottom: 120, left: 140, right: 140 };

// ─── Helpers ─────────────────────────────────────────────────────────────────
function run(text, o = {}) {
  return new TextRun({ text: String(text), font: 'Arial', size: o.size || 20,
    bold: o.bold || false, color: o.color || BLACK, italics: o.italic || false });
}
function para(children, o = {}) {
  return new Paragraph({
    alignment: o.align || AlignmentType.LEFT,
    spacing: { before: o.before || 0, after: o.after || 80, line: o.line || 276 },
    children: Array.isArray(children) ? children : [children]
  });
}
function sp(pts) { return new Paragraph({ spacing: { before: 0, after: pts }, children: [run('')] }); }
function pb() { return new Paragraph({ children: [new PageBreak()] }); }

function h1(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1,
    spacing: { before: 320, after: 160 },
    children: [new TextRun({ text, font: 'Arial', size: 32, bold: true, color: NAVY })]
  });
}
function h2(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2,
    spacing: { before: 220, after: 120 },
    children: [new TextRun({ text, font: 'Arial', size: 26, bold: true, color: BLUE })]
  });
}
function h3(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_3,
    spacing: { before: 160, after: 80 },
    children: [new TextRun({ text, font: 'Arial', size: 22, bold: true, color: NAVY })]
  });
}

function cell(content, w, fill = WHITE) {
  return new TableCell({ borders: allT, width: { size: w, type: WidthType.DXA }, margins: pm,
    shading: { fill, type: ShadingType.CLEAR },
    children: [Array.isArray(content) ? new Paragraph({ spacing: { after: 60 }, children: content })
                                      : para(content)] });
}
function hdrCell(text, w, fill = NAVY) {
  return new TableCell({ borders: allT, width: { size: w, type: WidthType.DXA }, margins: pm,
    shading: { fill, type: ShadingType.CLEAR },
    children: [para(run(text, { bold: true, size: 18, color: WHITE }))] });
}
function lbl(text, w, fill = GRAY1) {
  return new TableCell({ borders: allT, width: { size: w, type: WidthType.DXA }, margins: pm,
    shading: { fill, type: ShadingType.CLEAR },
    children: [para(run(text, { bold: true, size: 18 }))] });
}
function ctr(text, w, fill = WHITE, color = GRAY3) {
  return new TableCell({ borders: allT, width: { size: w, type: WidthType.DXA }, margins: pm,
    shading: { fill, type: ShadingType.CLEAR },
    children: [para(run(text, { size: 17, color }), { align: AlignmentType.CENTER })] });
}
function callout(children, borderColor = NAVY, bgColor = LTBLUE, w = CW) {
  return new Table({
    width: { size: w, type: WidthType.DXA }, columnWidths: [w],
    rows: [new TableRow({ children: [new TableCell({
      borders: {
        top:    { style: BorderStyle.SINGLE, size: 4, color: borderColor },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
        left:   { style: BorderStyle.SINGLE, size: 8, color: borderColor },
        right:  { style: BorderStyle.SINGLE, size: 4, color: borderColor },
      },
      width: { size: w, type: WidthType.DXA },
      margins: { top: 160, bottom: 160, left: 220, right: 220 },
      shading: { fill: bgColor, type: ShadingType.CLEAR },
      children
    })]})],
  });
}

// ─── Header / Footer ─────────────────────────────────────────────────────────
function makeHeader() {
  return new Header({ children: [
    new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: BLUE } },
      spacing: { after: 80 },
      children: [
        run('Abivax ERP Program Encyclopedia', { size: 17, color: NAVY, bold: true }),
        run('   |   Confidential — Program Director Use', { size: 16, color: GRAY3 }),
      ],
      tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
    }),
  ]});
}
function makeFooter() {
  return new Footer({ children: [
    new Paragraph({
      border: { top: { style: BorderStyle.SINGLE, size: 2, color: GRAY2 } },
      spacing: { before: 80 },
      alignment: AlignmentType.CENTER,
      children: [
        run('Page ', { size: 16, color: GRAY3 }),
        new TextRun({ children: [PageNumber.CURRENT], font: 'Arial', size: 16, color: GRAY3 }),
        run(' of ', { size: 16, color: GRAY3 }),
        new TextRun({ children: [PageNumber.TOTAL_PAGES], font: 'Arial', size: 16, color: GRAY3 }),
      ],
    }),
  ]});
}

// ─── Data helpers ─────────────────────────────────────────────────────────────
const ps  = synth.programState;
const milestones = (timeline.milestones || [])
  .filter(m => m.date && m.label)
  .sort((a, b) => a.date.localeCompare(b.date));

// People lookup
const abivaxTeam = people || [];

// Queue items — filter out stale front-end items
const activeQueueItems = (queue.items || []).filter(i =>
  !['claude-design-today-layout-1','claude-design-today-program-signals-1',
    'claude-design-program-layout-1','claude-design-page-patterns-1'].includes(i.id)
);

// ─── TODAY'S DATE ────────────────────────────────────────────────────────────
const TODAY = '2026-03-18';

// =============================================================================
// DOCUMENT BUILD
// =============================================================================

const children = [];

// ─────────────────────────────────────────────────────────────────────────────
// COVER PAGE
// ─────────────────────────────────────────────────────────────────────────────
children.push(
  sp(1200),
  new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: NAVY, space: 12 } },
    spacing: { before: 0, after: 200 },
    children: [run('Abivax ERP Program', { size: 48, bold: true, color: NAVY })]
  }),
  new Paragraph({
    spacing: { before: 0, after: 120 },
    children: [run('Program Encyclopedia', { size: 38, bold: true, color: BLUE })]
  }),
  sp(60),
  para([run('Program Director: Mike Markman   |   Executive Sponsor: Didier Blondel, CFO', { size: 20, color: GRAY3 })], { after: 40 }),
  para([run('Status: Post-Selection / Mobilization Planning   |   Go-Live: January 1, 2027', { size: 20, color: GRAY3 })], { after: 40 }),
  para([run('Last generated: ' + TODAY, { size: 18, color: GRAY3 })], { after: 0 }),
  sp(400),
  callout([
    para(run('How to use this document', { bold: true, size: 20, color: NAVY }), { after: 80 }),
    para([run('This encyclopedia is the canonical reference for the Abivax ERP program. It is generated from the program\'s canonical data files and should be regenerated whenever underlying data is updated. Each section is independently extractable for board decks, vendor communications, or audit committee briefs. The change log at the end tracks what has been updated and when.', { size: 18 })], { after: 0 }),
  ], NAVY, LTBLUE, CW),
  pb()
);

// ─────────────────────────────────────────────────────────────────────────────
// TABLE OF CONTENTS
// ─────────────────────────────────────────────────────────────────────────────
children.push(
  new Paragraph({
    spacing: { before: 0, after: 160 },
    children: [run('Contents', { size: 32, bold: true, color: NAVY })]
  }),
  new TableOfContents('', { hyperlink: true, headingStyleRange: '1-2' }),
  pb()
);

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — PROGRAM OVERVIEW
// ─────────────────────────────────────────────────────────────────────────────
children.push(
  h1('1. Program Overview'),
  para([run('Abivax is implementing NetSuite (Oracle) as its enterprise resource planning platform, replacing the current multi-system finance and accounting environment. The program targets a January 1, 2027 go-live, with implementation focused on core financial operations to support the company\'s French and US reporting requirements.', { size: 19 })], { after: 80 }),
  para([run('The go-live date is non-negotiable. It is tied to the US public launch in December 2027. Every month of delay compounds implementation risk and compresses the stabilization window before the public launch.', { size: 19 })], { after: 160 }),

  h2('Program Phase'),
  new Table({
    width: { size: CW, type: WidthType.DXA }, columnWidths: [2800, CW - 2800],
    rows: [
      ...[
        ['Current phase',         ps.phase || 'Post-selection / mobilization planning'],
        ['Current focus',         ps.currentFocus || ''],
        ['Go-live target',        'January 1, 2027 (non-negotiable)'],
        ['Mobilization target',   'April 2026'],
        ['Program Director',      'Mike Markman'],
        ['Executive Sponsor',     'Didier Blondel, CFO'],
        ['Finance Lead',          'Hema Keshava'],
      ].map(([k, v], i) => new TableRow({ children: [
        lbl(k, 2800, i % 2 === 0 ? GRAY1 : GRAY2),
        cell(run(v, { size: 18 }), CW - 2800, i % 2 === 0 ? WHITE : GRAY1),
      ]}))
    ]
  }),

  sp(200),
  h2('Top Program Risks (Current)'),
  ...(ps.topProgramRisks || []).map((r, i) => new Paragraph({
    numbering: { reference: 'numbers', level: 0 },
    spacing: { before: 40, after: 60 },
    children: [run(r, { size: 18, color: i < 2 ? RED : BLACK })]
  })),
  pb()
);

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — KEY DECISIONS LOG
// ─────────────────────────────────────────────────────────────────────────────
children.push(
  h1('2. Key Decisions Log'),
  para([run('This section records each program-level decision with the date made, what was decided, and the rationale. It is the authoritative decision trail for board, audit, and operational reference.', { size: 19 })], { after: 120 }),

  new Table({
    width: { size: CW, type: WidthType.DXA }, columnWidths: [1400, 2200, CW - 3600],
    rows: [
      new TableRow({ tableHeader: true, children: [
        hdrCell('Date', 1400), hdrCell('Decision', 2200), hdrCell('Rationale / Notes', CW - 3600)
      ]}),
      ...[
        ['2026-02-26', 'NetSuite selected as ERP platform',
          'Selected over SAP following structured RFP process with KPMG advisory support. Basis: total cost of ownership, implementation timeline, native multi-GAAP support, and fit for Abivax\'s current scale.'],
        ['2026-02-26', 'January 1, 2027 go-live confirmed as non-negotiable',
          'Tied to US public launch December 2027. Compressing or splitting phases is preferred over extending the go-live date.'],
        ['2026-03-18', 'NetSuite Customer Success confirmed as system integrator',
          'Paris-based European delivery team confirmed (Hafid Irbaiyne, Mazdak Sayyedelar, Ali Brahmi, Mathieu Lair, Sukeyna Ouled). French-speaking, on-site for milestones.'],
        ['2026-03-18', 'CFGI confirmed as integrated program support partner',
          'Replaces KPMG in the ongoing advisory role. CFGI covers three workstreams: technical and controls oversight (Ken Schatz / Guy Morissette), program governance (Walid Bouassida / Youness Tyamaz), and change management (Walid / Youness). Combined target: EUR 175-225K.'],
        ['2026-03-18', 'KPMG role scoped to selection advisory only',
          'KPMG\'s engagement covered the SAP vs NetSuite evaluation and is complete. KPMG has no ongoing role in the implementation program.'],
        ['2026-03-18', 'Front-end app shelved; encyclopedia model adopted',
          'Static HTML pages retired. Program record lives in this document. Front-end development paused. Codex pipeline continues to maintain canonical JSON data.'],
      ].map(([date, decision, rationale], i) => new TableRow({ children: [
        ctr(date, 1400, i % 2 === 0 ? GRAY1 : GRAY2, GRAY3),
        cell(run(decision, { size: 18, bold: true }), 2200, i % 2 === 0 ? LTBLUE : 'C5D9F0'),
        cell(run(rationale, { size: 17 }), CW - 3600, i % 2 === 0 ? WHITE : GRAY1),
      ]}))
    ]
  }),
  pb()
);

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — SYSTEM SELECTION
// ─────────────────────────────────────────────────────────────────────────────
children.push(
  h1('3. System Selection'),
  para([run('NetSuite (Oracle SuiteSuccess Financials Premium) was selected over SAP S/4HANA on February 26, 2026 following a competitive RFP process managed with KPMG France as advisory support. The selection was unanimous at the decision forum.', { size: 19 })], { after: 120 }),

  h2('Selection Rationale'),
  new Table({
    width: { size: CW, type: WidthType.DXA }, columnWidths: [3000, CW - 3000],
    rows: [
      new TableRow({ tableHeader: true, children: [hdrCell('Factor', 3000), hdrCell('NetSuite Outcome', CW - 3000)] }),
      ...[
        ['Multi-GAAP reporting',       'Native multi-book: IFRS, French GAAP, and US GAAP in a single system — eliminates manual bridging and quarterly IFRS adjustment process'],
        ['Multi-entity consolidation', 'OneWorld module handles Abivax parent + two subsidiaries (France, US) with automated intercompany eliminations'],
        ['Implementation team',        'Paris-based European delivery team; French-speaking; on-site for design workshops, blueprint, UAT, and cutover'],
        ['SOX / controls readiness',   'SuiteSuccess delivery model includes SoD design and controls documentation as part of standard scope'],
        ['Total cost vs SAP',          'Materially lower across Year 1 and 5-year horizon; SAP implementation complexity would require significantly more integration and change management resources'],
        ['Timeline to Jan 1, 2027',    'Achievable under SuiteSuccess model from April 2026 kickoff; SAP timeline was not credible within this constraint'],
        ['French regulatory fit',      'Electronic invoicing module available; French accounting standards supported natively; Hafid Irbaiyne (ex-CFO, French CPA) leads delivery'],
      ].map(([f, o], i) => new TableRow({ children: [
        lbl(f, 3000, i % 2 === 0 ? GRAY1 : GRAY2),
        cell(run(o, { size: 18 }), CW - 3000, i % 2 === 0 ? WHITE : GRAY1),
      ]}))
    ]
  }),

  sp(200),
  h2('What Was Evaluated'),
  new Table({
    width: { size: CW, type: WidthType.DXA }, columnWidths: [2200, 1800, CW - 4000],
    rows: [
      new TableRow({ tableHeader: true, children: [hdrCell('Vendor', 2200), hdrCell('Outcome', 1800), hdrCell('Notes', CW - 4000)] }),
      ...[
        ['NetSuite (Oracle)',   'SELECTED',  'SuiteSuccess Financials Premium; Paris-based team; selected Feb 26, 2026'],
        ['SAP S/4HANA',        'Not selected', 'Higher TCO; timeline risk; implementation complexity mismatched to Abivax scale'],
        ['KPMG France (advisory)', 'Selection only', 'Managed RFP process and evaluated both platforms; no ongoing implementation role'],
      ].map(([v, o, n], i) => new TableRow({ children: [
        lbl(v, 2200, i % 2 === 0 ? GRAY1 : GRAY2),
        ctr(o, 1800, o === 'SELECTED' ? GREENLT : i % 2 === 0 ? WHITE : GRAY1, o === 'SELECTED' ? GREEN : GRAY3),
        cell(run(n, { size: 17 }), CW - 4000, i % 2 === 0 ? WHITE : GRAY1),
      ]}))
    ]
  }),
  pb()
);

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4 — DELIVERY MODEL
// ─────────────────────────────────────────────────────────────────────────────
children.push(
  h1('4. Delivery Model'),
  para([run('The program uses a two-layer external model: NetSuite as the sole system integrator accountable for configuration and delivery, and CFGI as an integrated program support partner. Abivax retains internal ownership of all decisions, data, and business process sign-off.', { size: 19 })], { after: 160 }),

  h2('Layer 1 — NetSuite Implementation Team (SI)'),
  para([run('NetSuite Customer Success is the system integrator. The assigned Paris-based team provides on-site presence for blueprint workshops, build reviews, UAT, and cutover. NetSuite is solely accountable for configuration, integration delivery, data migration support, and go-live.', { size: 18 })], { after: 100 }),

  new Table({
    width: { size: CW, type: WidthType.DXA }, columnWidths: [2200, 2200, 1600, CW - 6000],
    rows: [
      new TableRow({ tableHeader: true, children: [
        hdrCell('Name', 2200), hdrCell('Role', 2200), hdrCell('Location', 1600), hdrCell('Background', CW - 6000)
      ]}),
      ...[
        ['Hafid Irbaiyne',    'Practice Manager France/MEA', 'Paris — on-site',    '18 years experience; ex-CFO; French CPA; 4 years NetSuite; program escalation lead'],
        ['Mazdak Sayyedelar', 'Project Manager Europe',      'Paris — on-site',    '7 years international IT project management; 6 years Oracle/NetSuite'],
        ['Ali Brahmi',        'Senior Functional Consultant','Paris — on-site',    '8 years ERP financial experience; 4+ years Oracle NetSuite; R2R and multi-GAAP specialist'],
        ['Sukeyna Ouled',     'Technical / Dev Lead',        'Remote (on-demand)', '9+ years IT development; 7 years Oracle NetSuite; integrations and customisation'],
        ['Mathieu Lair',      'Trainer',                     'Paris — on-site',    '10 years ERP experience; tailored training delivery in French'],
      ].map(([name, role, loc, bg], i) => new TableRow({ children: [
        lbl(name, 2200, i % 2 === 0 ? GRAY1 : GRAY2),
        cell(run(role, { size: 17 }), 2200, i % 2 === 0 ? WHITE : GRAY1),
        cell(run(loc, { size: 17, color: GRAY3 }), 1600, i % 2 === 0 ? WHITE : GRAY1),
        cell(run(bg, { size: 17 }), CW - 6000, i % 2 === 0 ? WHITE : GRAY1),
      ]}))
    ]
  }),

  sp(200),
  h2('Layer 2 — CFGI Integrated Program Support'),
  para([run('CFGI serves as the independent program support partner across three workstreams. CFGI has been engaged on Abivax\'s SOX remediation since September 2025 and holds direct knowledge of the company\'s control environment and finance team structure. Jean-Arnold Coutareau (Partner) leads the CFGI engagement; Walid Bouassida (Director) is the Paris-based day-to-day lead.', { size: 18 })], { after: 100 }),

  new Table({
    width: { size: CW, type: WidthType.DXA }, columnWidths: [2600, 2000, CW - 4600],
    rows: [
      new TableRow({ tableHeader: true, children: [
        hdrCell('Workstream', 2600, BLUE), hdrCell('CFGI Lead', 2000, BLUE), hdrCell('Scope', CW - 4600, BLUE)
      ]}),
      ...[
        [
          'Technical and Controls Oversight',
          'Kenneth Schatz (MD)\nGuy Morissette (Director)',
          'Independent design checkpoint reviews at blueprint, build, and UAT. Controls-by-design deliverable at blueprint mapping ERP configuration to SOX items. Written go/no-go assessment at cutover.'
        ],
        [
          'Program Governance',
          'Walid Bouassida (Director)\nYouness Tyamaz (Consultant)',
          'On-the-ground program coordination in Paris. Weekly flash report to program director. Steering committee facilitation. Risk and issue escalation. Milestone tracking against Jan 1, 2027.'
        ],
        [
          'Change Management and Adoption',
          'Walid Bouassida\nYouness Tyamaz',
          'Stakeholder and adoption risk mapping at kickoff. Communication plan development. Training coordination in French. Post-go-live adoption checks at 30 and 60 days.'
        ],
      ].map(([ws, lead, scope], i) => new TableRow({ children: [
        lbl(ws, 2600, i % 2 === 0 ? LTBLUE : 'C5D9F0'),
        cell(run(lead, { size: 17 }), 2000, i % 2 === 0 ? WHITE : GRAY1),
        cell(run(scope, { size: 17 }), CW - 4600, i % 2 === 0 ? WHITE : GRAY1),
      ]}))
    ]
  }),

  sp(200),
  h2('Abivax Internal Program Team'),
  para([run('Abivax team members with named ERP program responsibilities. Business process owners are accountable for requirements, design sign-off, data cleansing, and UAT in their areas.', { size: 18 })], { after: 100 }),

  new Table({
    width: { size: CW, type: WidthType.DXA }, columnWidths: [2000, 2400, 1400, CW - 5800],
    rows: [
      new TableRow({ tableHeader: true, children: [
        hdrCell('Name', 2000), hdrCell('Role', 2400), hdrCell('Location', 1400), hdrCell('ERP Responsibility', CW - 5800)
      ]}),
      ...[
        ['Didier Blondel',   'CFO / Executive Sponsor',                 'Global',      'Program sponsor; final escalation; board and audit committee reporting'],
        ['Mike Markman',     'ERP Program Director',                    'US / Global', 'Day-to-day program ownership; vendor management; scope and budget decisions'],
        ['Hema Keshava',     'Finance Lead (FP&A, Treasury, Tax)',      'US / Global', 'Finance scope decisions; reporting model; key stakeholder for R2R and multi-GAAP design'],
        ['Trinidad Mesa',    'Accounting Manager / Consolidation',      'France',      'French consolidation; chart of accounts; close process design; primary France accounting BPO'],
        ['Frederick Golly',  'FP&A Lead',                               'France',      'FP&A and reporting model; cost center design; reporting extract requirements'],
        ['Adrian Holbrook',  'FP&A / Reporting',                       'US / Global', 'Cost center design; data-access quality; US-side reporting bridge (reports to Frederick)'],
        ['Juliette Courtot', 'P2P Process Owner',                       'France',      'France P2P BPO; invoice processing; workflow approval design; vendor master'],
        ['Kimberly Gordon',  'P2P Contractor',                          'US',          'US-side P2P; AP coordination; US workflow counterpart to Juliette'],
        ['Philippe Goncalves','Finance Manager',                        'France',      'P2P governance chain; Juliette\'s manager; France P2P design escalation'],
        ['Matt Epley',       'US Accounting / SEC Reporting',           'US',          'SEC/NASDAQ reporting; equity (Certent); IFRS adjustments; US GAAP reporting outputs'],
        ['Jade Nguyen',      'IT Lead / ERP Integration',               'France',      'IT integration architecture; system access; infrastructure and controls decisions'],
        ['Benjamin Talmant', 'IT Project Manager',                      'France',      'IT delivery coordination; integration workstream PM; IT capacity management'],
      ].map(([name, role, loc, resp], i) => new TableRow({ children: [
        lbl(name, 2000, i % 2 === 0 ? GRAY1 : GRAY2),
        cell(run(role, { size: 17 }), 2400, i % 2 === 0 ? WHITE : GRAY1),
        cell(run(loc, { size: 17, color: GRAY3 }), 1400, i % 2 === 0 ? WHITE : GRAY1),
        cell(run(resp, { size: 17 }), CW - 5800, i % 2 === 0 ? WHITE : GRAY1),
      ]}))
    ]
  }),
  pb()
);

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5 — SOX AND CONTROLS
// ─────────────────────────────────────────────────────────────────────────────
children.push(
  h1('5. SOX and Controls'),
  para([run('SOX readiness is a first-order program requirement embedded in the delivery model from day one, not a post-go-live audit item. The program has 143 active controls in the CFTI register across three categories.', { size: 19 })], { after: 120 }),

  h2('CFTI Control Register Summary'),
  new Table({
    width: { size: CW, type: WidthType.DXA }, columnWidths: [2800, 1400, CW - 4200],
    rows: [
      new TableRow({ tableHeader: true, children: [hdrCell('Category', 2800, PURPLE), hdrCell('Count', 1400, PURPLE), hdrCell('Notes', CW - 4200, PURPLE)] }),
      ...[
        ['Controls / Audit',         '84',  'Core SOX controls; audit evidence and remediation tracking'],
        ['Reporting / Data',         '39',  'Financial reporting integrity; data model and close controls'],
        ['P2P',                      '20',  'Procure-to-pay transaction controls; vendor and payment flows'],
        ['Total in-scope',           '143', ''],
        ['Out-of-scope',             '45',  'Assessed and excluded from ERP program scope'],
        ['ERP-signal controls',      '9',   'Must be addressed explicitly in blueprint phase before build begins'],
      ].map(([cat, cnt, note], i) => {
        const isTotal = cat.includes('Total');
        return new TableRow({ children: [
          lbl(cat, 2800, isTotal ? GRAY2 : i % 2 === 0 ? PURPLT : 'E4D9F5'),
          ctr(cnt, 1400, isTotal ? GRAY2 : i % 2 === 0 ? WHITE : GRAY1, isTotal ? NAVY : PURPLE),
          cell(run(note, { size: 17 }), CW - 4200, isTotal ? GRAY2 : i % 2 === 0 ? WHITE : GRAY1),
        ]});
      })
    ]
  }),

  sp(180),
  callout([
    para(run('Controls-by-design approach', { bold: true, size: 20, color: NAVY }), { after: 80 }),
    para([run('CFGI holds the SOX remediation program and has documented Abivax\'s current control gaps and remediation progress since September 2025. At blueprint stage, CFGI delivers a controls-by-design document mapping each ERP configuration decision to the relevant SOX control requirement. This ensures controls are built into the system rather than retrofitted after go-live.', { size: 19 })], { after: 0 }),
  ], PURPLE, PURPLT, CW),

  sp(180),
  h2('SOX Program Response Summary'),
  new Table({
    width: { size: CW, type: WidthType.DXA }, columnWidths: [3000, CW - 3000],
    rows: [
      new TableRow({ tableHeader: true, children: [hdrCell('Requirement', 3000, PURPLE), hdrCell('Program Response', CW - 3000, PURPLE)] }),
      ...[
        ['Controls-by-design at blueprint',   'CFGI deliverable mapping ERP configuration to SOX control register — produced before build begins'],
        ['Segregation of duties (SoD)',        'SoD-compliant user access and role design reviewed by CFGI at blueprint; validated at UAT'],
        ['ITGC / SDLC controls',              'NetSuite SuiteSuccess delivery model includes system development lifecycle controls as standard scope'],
        ['Audit trail and data integrity',     'NetSuite native audit logging; CFGI reviews configuration against audit requirements at each milestone'],
        ['Go-live readiness',                  'CFGI provides written go/no-go assessment against SOX readiness criteria; required before cutover is approved'],
        ['Post-go-live validation',            'CFGI adoption checks at 30 and 60 days confirm controls are operating as designed'],
      ].map(([req, res], i) => new TableRow({ children: [
        lbl(req, 3000, i % 2 === 0 ? PURPLT : 'E4D9F5'),
        cell(run(res, { size: 18 }), CW - 3000, i % 2 === 0 ? WHITE : GRAY1),
      ]}))
    ]
  }),
  pb()
);

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 6 — PROGRAM BUDGET
// ─────────────────────────────────────────────────────────────────────────────
children.push(
  h1('6. Program Budget'),
  para([run('All figures in EUR, excluding VAT. Budget covers Year 1 across three categories: NetSuite platform and implementation, CFGI integrated program support, and a management reserve sized to bring total program cost to approximately EUR 1.0M. CFGI figures are targets communicated to the firm; subject to contract execution. Phase 2 scope (O2C, Inventory) will be contracted separately.', { size: 18, italic: true, color: GRAY3 })], { after: 140 }),

  new Table({
    width: { size: CW, type: WidthType.DXA }, columnWidths: [3800, 1800, 1800, CW - 7400],
    rows: [
      new TableRow({ tableHeader: true, children: [
        hdrCell('Budget Line', 3800), hdrCell('Amount (EUR)', 1800), hdrCell('Type', 1800), hdrCell('Notes', CW - 7400),
      ]}),

      // NetSuite section header
      new TableRow({ children: [
        new TableCell({ borders: allT, width: { size: CW, type: WidthType.DXA }, margins: pm,
          shading: { fill: NAVY, type: ShadingType.CLEAR }, columnSpan: 4,
          children: [para(run('NetSuite — System and Implementation', { bold: true, size: 18, color: WHITE }))] }),
      ]}),
      ...[
        ['NetSuite recurring license (Year 1)', '148,589', 'Annual recurring', 'Base platform, multi-entity, multi-book; after negotiated discount (V2 offer)'],
        ['Implementation services (fixed bid)',  '388,700', 'Fixed fee',       'V3 SOW dated 17 Mar 2026; Phase 1 activates R2R, P2P, multi-GAAP; O2C and Inventory in base SOW but not activated Phase 1'],
        ['Tailored training',                   '7,647',   'Fixed fee',       'Tailored training package; after discount'],
        ['Travel (capped)',                     '18,000',  'Capped T&M',      'Paris-based team travel; hard cap in contract'],
        ['NetSuite subtotal',                   '562,936', '',                ''],
      ].map(([label, amt, type, note], i) => {
        const isSub = label.includes('subtotal');
        return new TableRow({ children: [
          new TableCell({ borders: allT, width: { size: 3800, type: WidthType.DXA }, margins: pm,
            shading: { fill: isSub ? GRAY2 : i % 2 === 0 ? GRAY1 : WHITE, type: ShadingType.CLEAR },
            children: [para(run(label, { size: 18, bold: isSub }))] }),
          new TableCell({ borders: allT, width: { size: 1800, type: WidthType.DXA }, margins: pm,
            shading: { fill: isSub ? GRAY2 : i % 2 === 0 ? GRAY1 : WHITE, type: ShadingType.CLEAR },
            children: [para(run((isSub ? '' : 'EUR ') + amt, { size: 18, bold: isSub, color: isSub ? NAVY : BLACK }), { align: AlignmentType.RIGHT })] }),
          new TableCell({ borders: allT, width: { size: 1800, type: WidthType.DXA }, margins: pm,
            shading: { fill: isSub ? GRAY2 : i % 2 === 0 ? GRAY1 : WHITE, type: ShadingType.CLEAR },
            children: [para(run(type, { size: 17, color: GRAY3 }), { align: AlignmentType.CENTER })] }),
          new TableCell({ borders: allT, width: { size: CW - 7400, type: WidthType.DXA }, margins: pm,
            shading: { fill: isSub ? GRAY2 : i % 2 === 0 ? GRAY1 : WHITE, type: ShadingType.CLEAR },
            children: [para(run(note, { size: 17 }))] }),
        ]});
      }),

      // CFGI section header
      new TableRow({ children: [
        new TableCell({ borders: allT, width: { size: CW, type: WidthType.DXA }, margins: pm,
          shading: { fill: BLUE, type: ShadingType.CLEAR }, columnSpan: 4,
          children: [para(run('CFGI — Integrated Program Support', { bold: true, size: 18, color: WHITE }))] }),
      ]}),
      ...[
        ['Technical and controls oversight',         '70,000',  'Fixed fee',     'Ken Schatz / Guy Morissette; design checkpoints, controls-by-design deliverable, go/no-go assessment'],
        ['Program governance (Walid / Youness)',     '110,000', 'T&M (capped)',  'Paris-based PMO; flash reporting; steering facilitation; 35 weeks'],
        ['Change management and adoption',           '40,000',  'T&M (capped)', 'Stakeholder mapping; comms plan; training coordination; 30/60-day adoption checks'],
        ['CFGI subtotal',                            '220,000', '',              ''],
      ].map(([label, amt, type, note], i) => {
        const isSub = label.includes('subtotal');
        return new TableRow({ children: [
          new TableCell({ borders: allT, width: { size: 3800, type: WidthType.DXA }, margins: pm,
            shading: { fill: isSub ? GRAY2 : i % 2 === 0 ? GRAY1 : WHITE, type: ShadingType.CLEAR },
            children: [para(run(label, { size: 18, bold: isSub }))] }),
          new TableCell({ borders: allT, width: { size: 1800, type: WidthType.DXA }, margins: pm,
            shading: { fill: isSub ? GRAY2 : i % 2 === 0 ? GRAY1 : WHITE, type: ShadingType.CLEAR },
            children: [para(run((isSub ? '' : 'EUR ') + amt, { size: 18, bold: isSub, color: isSub ? NAVY : BLACK }), { align: AlignmentType.RIGHT })] }),
          new TableCell({ borders: allT, width: { size: 1800, type: WidthType.DXA }, margins: pm,
            shading: { fill: isSub ? GRAY2 : i % 2 === 0 ? GRAY1 : WHITE, type: ShadingType.CLEAR },
            children: [para(run(type, { size: 17, color: GRAY3 }), { align: AlignmentType.CENTER })] }),
          new TableCell({ borders: allT, width: { size: CW - 7400, type: WidthType.DXA }, margins: pm,
            shading: { fill: isSub ? GRAY2 : i % 2 === 0 ? GRAY1 : WHITE, type: ShadingType.CLEAR },
            children: [para(run(note, { size: 17 }))] }),
        ]});
      }),

      // Reserve section header
      new TableRow({ children: [
        new TableCell({ borders: allT, width: { size: CW, type: WidthType.DXA }, margins: pm,
          shading: { fill: TEAL, type: ShadingType.CLEAR }, columnSpan: 4,
          children: [para(run('Management Reserve — Finance Team Capacity', { bold: true, size: 18, color: WHITE }))] }),
      ]}),
      ...[
        ['Interim / fractional finance support', '85,000', 'T&M (reserve)', 'Backstop capacity for finance team during peak implementation phases; interim or advisory resources'],
        ['Training, readiness, and enablement',  '37,000', 'Reserve',       'Supplemental training, system admin ramp-up, or third-party enablement tools beyond base NetSuite package'],
        ['Data migration and cutover prep',      '35,000', 'Reserve',       'Third-party support for data cleansing, mock loads, or cutover coordination if internal capacity is insufficient'],
        ['Contingency and scope buffer',         '60,000', 'Reserve',       'Held for regulatory adjustments (e.g., French e-invoicing), integration complexity, or unforeseen scope'],
        ['Reserve subtotal',                     '217,000', '',             'Held by program director; written approval required to release any reserve line'],
      ].map(([label, amt, type, note], i) => {
        const isSub = label.includes('subtotal');
        return new TableRow({ children: [
          new TableCell({ borders: allT, width: { size: 3800, type: WidthType.DXA }, margins: pm,
            shading: { fill: isSub ? GRAY2 : i % 2 === 0 ? TEALLT : WHITE, type: ShadingType.CLEAR },
            children: [para(run(label, { size: 18, bold: isSub }))] }),
          new TableCell({ borders: allT, width: { size: 1800, type: WidthType.DXA }, margins: pm,
            shading: { fill: isSub ? GRAY2 : i % 2 === 0 ? TEALLT : WHITE, type: ShadingType.CLEAR },
            children: [para(run((isSub ? '' : 'EUR ') + amt, { size: 18, bold: isSub, color: isSub ? NAVY : BLACK }), { align: AlignmentType.RIGHT })] }),
          new TableCell({ borders: allT, width: { size: 1800, type: WidthType.DXA }, margins: pm,
            shading: { fill: isSub ? GRAY2 : i % 2 === 0 ? TEALLT : WHITE, type: ShadingType.CLEAR },
            children: [para(run(type, { size: 17, color: GRAY3 }), { align: AlignmentType.CENTER })] }),
          new TableCell({ borders: allT, width: { size: CW - 7400, type: WidthType.DXA }, margins: pm,
            shading: { fill: isSub ? GRAY2 : i % 2 === 0 ? TEALLT : WHITE, type: ShadingType.CLEAR },
            children: [para(run(note, { size: 17 }))] }),
        ]});
      }),

      // Grand total
      new TableRow({ children: [
        new TableCell({ borders: allT, width: { size: 3800, type: WidthType.DXA }, margins: pml,
          shading: { fill: NAVY, type: ShadingType.CLEAR },
          children: [para(run('TOTAL PROGRAM BUDGET (YEAR 1)', { bold: true, size: 20, color: WHITE }))] }),
        new TableCell({ borders: allT, width: { size: 1800, type: WidthType.DXA }, margins: pml,
          shading: { fill: NAVY, type: ShadingType.CLEAR },
          children: [para(run('999,936', { bold: true, size: 20, color: WHITE }), { align: AlignmentType.RIGHT })] }),
        new TableCell({ borders: allT, width: { size: 1800, type: WidthType.DXA }, margins: pml,
          shading: { fill: NAVY, type: ShadingType.CLEAR }, children: [para(run(''))] }),
        new TableCell({ borders: allT, width: { size: CW - 7400, type: WidthType.DXA }, margins: pml,
          shading: { fill: NAVY, type: ShadingType.CLEAR },
          children: [para(run('Excl. VAT. Sized to ~EUR 1.0M. CFGI fees subject to contract execution.', { size: 17, color: LTBLUE }))] }),
      ]}),
    ]
  }),
  pb()
);

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 7 — IMPLEMENTATION TIMELINE
// ─────────────────────────────────────────────────────────────────────────────
children.push(
  h1('7. Implementation Timeline'),
  para([run('Eight-month implementation from April 2026 to January 1, 2027. No schedule float after October — any slippage from UAT or cutover directly threatens the go-live date.', { size: 19 })], { after: 120 }),

  h2('Phase Plan'),
  new Table({
    width: { size: CW, type: WidthType.DXA }, columnWidths: [2000, 2000, CW - 4000],
    rows: [
      new TableRow({ tableHeader: true, children: [hdrCell('Phase', 2000), hdrCell('Timing', 2000), hdrCell('Key Activities and Deliverables', CW - 4000)] }),
      ...[
        ['Mobilization',     'April 2026',        'Contracts signed; teams onboarded; governance established; project kick-off with NetSuite and CFGI; CFGI controls-by-design scope confirmed'],
        ['Blueprint',        'April – May 2026',  'Business process design sessions; ERP configuration decisions; controls-by-design deliverable (CFGI); data migration planning; integration architecture confirmed'],
        ['Build',            'June – Aug 2026',   'System configuration; integration development; data cleansing (Abivax responsibility); mock data loads; change communications begin'],
        ['UAT',              'Aug – Oct 2026',    'User acceptance testing across all process areas; defect resolution; SoD role validation; cutover planning and dry run'],
        ['Cutover / Deploy', 'Oct – Dec 2026',    'Final data migration; parallel run; CFGI written go/no-go assessment; production cutover approval by CFO and Program Director'],
        ['Go-Live',          'January 1, 2027',   'Production go-live; hypercare support; CFGI adoption checks at 30 and 60 days post-go-live'],
      ].map(([phase, timing, acts], i) => new TableRow({ children: [
        lbl(phase, 2000, i % 2 === 0 ? LTBLUE : 'C5D9F0'),
        ctr(timing, 2000, i % 2 === 0 ? WHITE : GRAY1, GRAY3),
        cell(run(acts, { size: 17 }), CW - 4000, i % 2 === 0 ? WHITE : GRAY1),
      ]}))
    ]
  }),

  sp(180),
  h2('Key Milestones (from program data)'),
  new Table({
    width: { size: CW, type: WidthType.DXA }, columnWidths: [1800, 2400, CW - 4200],
    rows: [
      new TableRow({ tableHeader: true, children: [hdrCell('Date', 1800), hdrCell('Milestone', 2400), hdrCell('Status / Notes', CW - 4200)] }),
      ...milestones.slice(0, 12).map((m, i) => new TableRow({ children: [
        ctr(m.date || '', 1800, i % 2 === 0 ? GRAY1 : WHITE, GRAY3),
        cell(run(m.label || '', { size: 18 }), 2400, i % 2 === 0 ? GRAY1 : WHITE),
        cell(run(m.status || m.notes || '', { size: 17, color: GRAY3 }), CW - 4200, i % 2 === 0 ? GRAY1 : WHITE),
      ]}))
    ]
  }),
  pb()
);

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 8 — RISK REGISTER
// ─────────────────────────────────────────────────────────────────────────────
children.push(
  h1('8. Risk Register'),
  para([run('Living risk register. Update this section each time a risk is added, resolved, or escalated. Risk owner is the program director unless otherwise noted.', { size: 18, italic: true, color: GRAY3 })], { after: 120 }),

  new Table({
    width: { size: CW, type: WidthType.DXA }, columnWidths: [2800, 900, 1200, CW - 4900],
    rows: [
      new TableRow({ tableHeader: true, children: [
        hdrCell('Risk', 2800), hdrCell('Level', 900), hdrCell('Owner', 1200), hdrCell('Mitigation', CW - 4900)
      ]}),
      ...[
        ['Commercial terms not signed before April mobilization window closes', 'High',   'Mike / Hema', 'Accelerate contract review; Didier escalation path confirmed; target signature by March 31'],
        ['NetSuite implementation scope not locked at blueprint (O2C / Inventory ambiguity)', 'High', 'Mike / Jamal', 'Confirm Phase 1/2 boundary on Jamal call; enforce scope discipline through CFGI checkpoint reviews'],
        ['Multi-GAAP configuration complexity causes late rework', 'Medium', 'Hafid / CFGI', 'Hafid Irbaiyne (ex-CFO, French CPA) leads design; CFGI controls-by-design review at blueprint'],
        ['Finance team capacity constrained during peak implementation', 'Medium', 'Mike / Walid', 'EUR 85K reserve for interim/fractional support; Walid manages workload visibility on the ground'],
        ['French e-invoicing regulatory scope underestimated', 'Medium', 'Jade / NetSuite', 'Confirm coverage in final NetSuite SOW; reserve budget available for additional scope'],
        ['Data migration quality issues delay UAT', 'Medium', 'Abivax BPOs', 'RACI confirmed: Abivax owns data cleansing; EUR 35K reserve available for third-party migration support'],
        ['NetSuite delivery lead changes post-signing', 'Low-Med', 'Mike', 'Named team contractually confirmed; Hafid is practice sponsor and escalation path; CFGI at all milestones'],
        ['CFGI integration agreement not executed before April', 'Low-Med', 'Mike / Jean-Arnold', 'Email to Ken Schatz and Jean-Arnold Coutareau sent 18 Mar; combined engagement target EUR 175-225K'],
        ['Program deprioritized due to M&A or corporate event', 'Low', 'Didier', 'Phase 1 scope is deliberately narrow; contracts structured with clear pause/exit provisions'],
      ].map(([risk, level, owner, mit], i) => {
        const fill = level === 'High' ? REDLT : level === 'Medium' ? AMBERLT : GREENLT;
        const col  = level === 'High' ? RED   : level === 'Medium' ? AMBER   : GREEN;
        return new TableRow({ children: [
          cell(run(risk, { size: 17 }), 2800, i % 2 === 0 ? GRAY1 : WHITE),
          ctr(level, 900, fill, col),
          cell(run(owner, { size: 17, color: GRAY3 }), 1200, i % 2 === 0 ? GRAY1 : WHITE),
          cell(run(mit, { size: 17 }), CW - 4900, i % 2 === 0 ? GRAY1 : WHITE),
        ]});
      })
    ]
  }),
  pb()
);

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 9 — VENDOR PROFILES
// ─────────────────────────────────────────────────────────────────────────────
children.push(
  h1('9. Vendor Profiles'),

  h2('NetSuite (Oracle) — System Integrator'),
  new Table({
    width: { size: CW, type: WidthType.DXA }, columnWidths: [2400, CW - 2400],
    rows: [
      ...[
        ['Engagement type',    'System integrator — SuiteSuccess Financials Premium delivery model'],
        ['Contract status',    'V3 SOW dated 17 March 2026; under legal review; target signature March 31'],
        ['Implementation fee', 'EUR 388,700 fixed bid (V3 SOW)'],
        ['Recurring license',  'EUR 148,589 / year after discount (V2 offer)'],
        ['Training',           'EUR 7,647 after discount (tailored training pack)'],
        ['Travel',             'EUR 18,000 capped'],
        ['Phase 1 scope',      'R2R, P2P, multi-GAAP (IFRS / French GAAP / US GAAP), OneWorld, 5 integrations'],
        ['Phase 2 scope',      'O2C, Inventory Management — in base SOW but not activated Phase 1; contracted separately post-go-live'],
        ['Key contact',        'Jamal Azil (Account Executive); Hafid Irbaiyne (Practice Manager, Paris)'],
        ['Watch-outs',         'O2C / Inventory still in base SOW — enforce Phase 1 boundary in contract. RACI confirms Abivax owns data cleansing, business process decisions, and UAT coordination.'],
      ].map(([k, v], i) => new TableRow({ children: [
        lbl(k, 2400, i % 2 === 0 ? GRAY1 : GRAY2),
        cell(run(v, { size: 18 }), CW - 2400, i % 2 === 0 ? WHITE : GRAY1),
      ]}))
    ]
  }),

  sp(200),
  h2('CFGI — Integrated Program Support'),
  new Table({
    width: { size: CW, type: WidthType.DXA }, columnWidths: [2400, CW - 2400],
    rows: [
      ...[
        ['Engagement type',    'Integrated program support — three workstreams (controls oversight, governance, change management)'],
        ['Contract status',    'Proposal received; combined engagement letter pending; target April mobilization'],
        ['Engagement target',  'EUR 175-225K combined; fixed fee where possible'],
        ['Current SOX role',   'CFGI has held Abivax SOX remediation since September 2025; Walid on-site ~2 days/week'],
        ['Paris presence',     'Walid Bouassida (Director, 16 years, French CPA); Youness Tyamaz (Consultant, IFRS / French / US GAAP)'],
        ['US oversight',       'Kenneth Schatz (MD); Guy Morissette (Director) — technical and controls review'],
        ['Engagement lead',    'Jean-Arnold Coutareau (Partner, 30 years); reports through him for contract and escalation'],
        ['Watch-outs',         'Two separate proposals (Ken\'s team and Walid\'s team) need to be consolidated into one engagement. CFGI implementation references for NetSuite not yet provided — outstanding diligence item.'],
      ].map(([k, v], i) => new TableRow({ children: [
        lbl(k, 2400, i % 2 === 0 ? LTBLUE : 'C5D9F0'),
        cell(run(v, { size: 18 }), CW - 2400, i % 2 === 0 ? WHITE : GRAY1),
      ]}))
    ]
  }),

  sp(200),
  h2('KPMG France — Selection Advisory (Completed)'),
  para([run('KPMG France\'s engagement was scoped to the ERP selection process only (SAP vs NetSuite evaluation). That engagement is complete. KPMG has no role in the implementation program.', { size: 18, color: GRAY3, italic: true })], { after: 100 }),
  new Table({
    width: { size: CW, type: WidthType.DXA }, columnWidths: [2400, CW - 2400],
    rows: [
      ...[
        ['Engagement type',    'ERP selection advisory — SAP vs NetSuite evaluation, RFP management'],
        ['Status',             'COMPLETED — engagement concluded at selection decision February 26, 2026'],
        ['AMOA proposal',      'EUR 370,100 total (302 man-days) — not accepted for implementation phase'],
        ['Key contact',        'Olivia Berry (Assistant Manager); 3 years experience; SAP-focused; no NetSuite experience'],
        ['Why not ongoing',    'Olivia Berry\'s thin NetSuite credentials and CFGI\'s existing SOX engagement made CFGI the stronger implementation support choice'],
      ].map(([k, v], i) => new TableRow({ children: [
        lbl(k, 2400, i % 2 === 0 ? GRAY1 : GRAY2),
        cell(run(v, { size: 18 }), CW - 2400, i % 2 === 0 ? WHITE : GRAY1),
      ]}))
    ]
  }),
  pb()
);

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 10 — ERP PILLARS
// ─────────────────────────────────────────────────────────────────────────────
children.push(
  h1('10. ERP Pillars and Process Scope'),
  para([run('The program is organized around three primary pillars and one cross-cutting enablement layer. Each pillar has a named set of business process owners and a clear definition of what "done" means by go-live.', { size: 19 })], { after: 120 }),

  new Table({
    width: { size: CW, type: WidthType.DXA }, columnWidths: [1800, 1600, 2400, CW - 5800],
    rows: [
      new TableRow({ tableHeader: true, children: [
        hdrCell('Pillar', 1800), hdrCell('BPOs', 1600), hdrCell('Core Scope', 2400), hdrCell('Done Means...', CW - 5800)
      ]}),
      ...[
        [
          'Record to Report (R2R)',
          'Trinidad Mesa\nMatt Epley',
          'Chart of accounts; multi-entity; FX; multi-GAAP (IFRS / French GAAP / US GAAP); close process; reporting extracts; consolidation',
          'Target COA / cost-center design agreed. Reporting extract model supports FP&A. Multi-entity, FX, and multi-GAAP requirements explicitly designed. Close process is system-enforced.'
        ],
        [
          'Procure to Pay (P2P)',
          'Juliette Courtot\nKimberly Gordon',
          'Requisition to PO; invoice processing; vendor master; payment execution; approval workflows; expense management; 1099 / evidence retention',
          'Workflow approvals are system-enforced. Vendor validation and payment flow ownership are explicit. Key manual handoffs are reduced or intentionally controlled. Exception handling paths are defined.'
        ],
        [
          'SOX / Controls / Auditability',
          'CFGI (Walid)\nAdrian Holbrook',
          'Control design; audit trail; remediation tracking; SoD; access controls; evidence repository; control automation vs manual split',
          'Key controls mapped to owners and system steps. Audit evidence retention paths defined. Deficiency / remediation tracking repository is live. ERP design supports testable, traceable controls.'
        ],
        [
          'Platform / Enablement',
          'Jade Nguyen\nBenjamin Talmant',
          'IT integrations (5 confirmed); system ownership and admin; access validation; architecture mapping; timeline dependencies; change management',
          'Integration architecture confirmed. System admin ownership is explicit. IT capacity is planned and committed. Change management plan is live.'
        ],
      ].map(([pillar, bpo, scope, done], i) => new TableRow({ children: [
        lbl(pillar, 1800, i % 2 === 0 ? LTBLUE : 'C5D9F0'),
        cell(run(bpo, { size: 17 }), 1600, i % 2 === 0 ? WHITE : GRAY1),
        cell(run(scope, { size: 17 }), 2400, i % 2 === 0 ? WHITE : GRAY1),
        cell(run(done, { size: 17, color: GRAY3 }), CW - 5800, i % 2 === 0 ? WHITE : GRAY1),
      ]}))
    ]
  }),
  pb()
);

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 11 — GOVERNANCE
// ─────────────────────────────────────────────────────────────────────────────
children.push(
  h1('11. Governance and Oversight'),
  para([run('Five governance forums cover the full escalation chain from weekly operational pulse to board-level reporting. The model is designed to keep Mike as the day-to-day decision owner while surfacing issues to Didier or the Audit Committee only when warranted.', { size: 19 })], { after: 120 }),

  new Table({
    width: { size: CW, type: WidthType.DXA }, columnWidths: [2000, 1800, CW - 3800],
    rows: [
      new TableRow({ tableHeader: true, children: [
        hdrCell('Forum', 2000), hdrCell('Cadence', 1800), hdrCell('Attendees and Purpose', CW - 3800)
      ]}),
      ...[
        ['Program Flash Report',   'Weekly',                        'Prepared by Walid / CFGI; delivered to Mike. Status, milestones, open risks, decisions needed. Two-page maximum.'],
        ['Design Authority',       'As needed (blueprint / build)', 'NetSuite functional team, CFGI controls lead, Abivax BPOs. Configuration and design decisions; scope change management.'],
        ['Steering Committee',     'Every 4-6 weeks',               'CFO (Didier Blondel), ERP Program Director (Mike), NetSuite Practice Manager (Hafid), CFGI Program Lead (Walid). Program status, risk escalation, scope and budget decisions.'],
        ['Audit Committee Update', 'Quarterly / as required',       'Audit Committee, CFO (Didier Blondel), ERP Program Director. SOX integration status, controls-by-design progress, go-live readiness.'],
        ['Go / No-Go Review',      'Pre-cutover (Dec 2026)',        'CFO (Didier Blondel), ERP Program Director, NetSuite PM, CFGI. Written readiness assessment against SOX and operational criteria before production cutover is approved.'],
      ].map(([forum, cadence, purpose], i) => new TableRow({ children: [
        lbl(forum, 2000, i % 2 === 0 ? LTBLUE : 'C5D9F0'),
        ctr(cadence, 1800, i % 2 === 0 ? WHITE : GRAY1, GRAY3),
        cell(run(purpose, { size: 17 }), CW - 3800, i % 2 === 0 ? WHITE : GRAY1),
      ]}))
    ]
  }),
  pb()
);

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 12 — OPEN ITEMS
// ─────────────────────────────────────────────────────────────────────────────
children.push(
  h1('12. Open Items and Decision Queue'),
  para([run('Active items requiring action or decision. Generated from the program\'s canonical queue data. Front-end design items have been removed following the March 18, 2026 architecture decision to shelf the front-end app.', { size: 18, italic: true, color: GRAY3 })], { after: 120 }),

  h2('Immediate Action Items (This Week)'),
  new Table({
    width: { size: CW, type: WidthType.DXA }, columnWidths: [1400, 2200, CW - 3600],
    rows: [
      new TableRow({ tableHeader: true, children: [hdrCell('Owner', 1400), hdrCell('Item', 2200), hdrCell('Notes', CW - 3600)] }),
      ...[
        ['Mike',                'Sign NetSuite SOW (V3 17 Mar 2026)',                    'Target: March 31. Confirm Phase 1/2 scope boundary with Jamal call. Legal review in progress.'],
        ['Mike / Jean-Arnold',  'Consolidate CFGI proposals into one engagement',          'Email drafted 18 Mar to Ken Schatz + Jean-Arnold Coutareau. Target combined fee EUR 175-225K. April mobilization deadline.'],
        ['Mike / Jamal',        'Confirm O2C / Inventory Phase 1/2 boundary',             'O2C and Inventory removal from Phase 1 activation not yet contractually confirmed. Resolve on Jamal call.'],
        ['Mike',                'CFGI NetSuite implementation references',                 'CFGI-2 NOT FOUND in diligence — no NetSuite implementation references provided yet. Request before contract.'],
        ['Mike / Hema',         'Get budget authorization from Hema and Didier',          'BUD-1/BUD-2 NOT FOUND — no confirmed written budget approval yet. EUR 1M program budget needs sign-off.'],
        ['Mike / Camille',      'Confirm Audit Committee meeting date',                    'Camille Girard (audit liaison) availability on March 6 not confirmed. Deck ready.'],
      ].map(([owner, item, note], i) => new TableRow({ children: [
        ctr(owner, 1400, i % 2 === 0 ? AMBERLT : WHITE, AMBER),
        cell(run(item, { size: 18, bold: true }), 2200, i % 2 === 0 ? GRAY1 : WHITE),
        cell(run(note, { size: 17 }), CW - 3600, i % 2 === 0 ? GRAY1 : WHITE),
      ]}))
    ]
  }),

  sp(180),
  h2('Program Queue (from claude_lane_queue.json)'),
  new Table({
    width: { size: CW, type: WidthType.DXA }, columnWidths: [1400, 2400, CW - 3800],
    rows: [
      new TableRow({ tableHeader: true, children: [hdrCell('Lane', 1400), hdrCell('Item', 2400), hdrCell('ID', CW - 3800)] }),
      ...activeQueueItems.map((item, i) => new TableRow({ children: [
        ctr(item.lane || '', 1400, i % 2 === 0 ? GRAY1 : WHITE, BLUE),
        cell(run(item.title || '', { size: 17 }), 2400, i % 2 === 0 ? GRAY1 : WHITE),
        cell(run(item.id || '', { size: 16, color: GRAY3 }), CW - 3800, i % 2 === 0 ? GRAY1 : WHITE),
      ]}))
    ]
  }),
  pb()
);

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 13 — PRESENTATIONS AND OUTPUTS
// ─────────────────────────────────────────────────────────────────────────────
children.push(
  h1('13. Presentations and Key Outputs'),
  para([run('Program outputs are stored in the outputs/ folder in the repository. Decks are generated from the canonical data and should be refreshed whenever underlying data changes.', { size: 18 })], { after: 120 }),

  new Table({
    width: { size: CW, type: WidthType.DXA }, columnWidths: [2400, 1600, 1400, CW - 5400],
    rows: [
      new TableRow({ tableHeader: true, children: [
        hdrCell('Document', 2400), hdrCell('Audience', 1600), hdrCell('Last Updated', 1400), hdrCell('Status / Notes', CW - 5400)
      ]}),
      ...[
        ['ERP Program Encyclopedia\n(this document)',                'Program Director',       '2026-03-18', 'Canonical program reference. Regenerate via scripts/generate_encyclopedia.js.'],
        ['Board ERP Readout (Mar 19, 2026)',                         'Board of Directors',     '2026-03-18', 'Board checkpoint deck. At outputs/Board_ERP_Readout_Mar19_2026.pptx. Needs CFGI/KPMG story updated.'],
        ['Audit Committee ERP Controls Readout',                     'Audit Committee',        '2026-03-06', 'Controls-focused deck. At outputs/Audit_Committee_ERP_Controls_Mar2026.pptx.'],
        ['Audit Committee Program Brief',                            'Audit Committee',        '2026-03-18', 'Comprehensive delivery model and budget brief. At outputs/ERP_Program_Audit_Committee_Brief_Mar2026.docx.'],
        ['Vendor Comparison: CFGI vs KPMG (V2)',                     'Internal — Mike',        '2026-03-18', 'Decision support document. At outputs/Vendor_Comparison_V2_Mar18_2026.docx. Superseded by decisions.'],
        ['CFGI Integrated Engagement Brief',                         'CFGI (Ken + Jean-Arnold)','2026-03-18', 'Email / brief proposing combined CFGI engagement. At collab/claude/outputs/cfgi-integrated-brief-2026-03-18.md.'],
      ].map(([doc, aud, date, notes], i) => new TableRow({ children: [
        cell(run(doc, { size: 17, bold: true }), 2400, i % 2 === 0 ? GRAY1 : WHITE),
        cell(run(aud, { size: 17 }), 1600, i % 2 === 0 ? GRAY1 : WHITE),
        ctr(date, 1400, i % 2 === 0 ? GRAY1 : WHITE, GRAY3),
        cell(run(notes, { size: 17, color: GRAY3 }), CW - 5400, i % 2 === 0 ? GRAY1 : WHITE),
      ]}))
    ]
  }),
  pb()
);

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 14 — CHANGE LOG
// ─────────────────────────────────────────────────────────────────────────────
children.push(
  h1('14. Change Log'),
  para([run('Record every material update to this document. Include date, what changed, and who made the change. This log is the audit trail for the program record.', { size: 18, italic: true, color: GRAY3 })], { after: 120 }),

  new Table({
    width: { size: CW, type: WidthType.DXA }, columnWidths: [1400, 1600, CW - 3000],
    rows: [
      new TableRow({ tableHeader: true, children: [hdrCell('Date', 1400), hdrCell('Author', 1600), hdrCell('Changes', CW - 3000)] }),
      ...[
        ['2026-03-18', 'Claude / Mike', 'Initial encyclopedia created. Sections 1-14. Incorporates all decisions made March 18, 2026: NetSuite as SI (Paris team confirmed), CFGI as integrated support partner, KPMG scoped to selection only, front-end app shelved, encyclopedia model adopted. Budget confirmed at EUR 999,936 from V3 SOW. Audit Committee brief content merged. Full Abivax team roster added.'],
      ].map(([date, author, changes], i) => new TableRow({ children: [
        ctr(date, 1400, GRAY1, GRAY3),
        cell(run(author, { size: 17 }), 1600, GRAY1),
        cell(run(changes, { size: 17 }), CW - 3000, WHITE),
      ]}))
    ]
  })
);

// =============================================================================
// ASSEMBLE DOCUMENT
// =============================================================================
const doc = new Document({
  styles: {
    default: { document: { run: { font: 'Arial', size: 20 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run:       { size: 32, bold: true, font: 'Arial', color: NAVY },
        paragraph: { spacing: { before: 320, after: 160 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run:       { size: 26, bold: true, font: 'Arial', color: BLUE },
        paragraph: { spacing: { before: 220, after: 120 }, outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run:       { size: 22, bold: true, font: 'Arial', color: NAVY },
        paragraph: { spacing: { before: 160, after: 80 }, outlineLevel: 2 } },
    ]
  },
  numbering: {
    config: [
      { reference: 'numbers',
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: 'bullets',
        levels: [{ level: 0, format: LevelFormat.BULLET, text: '\u2022', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: PW, height: PH },
        margin: { top: MAR, right: MAR, bottom: MAR, left: MAR }
      }
    },
    headers: { default: makeHeader() },
    footers: { default: makeFooter() },
    children
  }]
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(OUT, buf);
  console.log('Encyclopedia written to: ' + OUT);
}).catch(e => { console.error(e); process.exit(1); });
