const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, VerticalAlign, PageNumber, TabStopType, TabStopPosition
} = require('/usr/local/lib/node_modules_global/lib/node_modules/docx');
const fs = require('fs');

// ─── Colors ───────────────────────────────────────────────────────────────────
const NAVY   = "1F3864";
const BLUE   = "2E5EA8";
const LTBLUE = "D6E4F7";
const GREEN  = "1A5C38";
const GREENLT= "D4EDDA";
const AMBER  = "BF6C00";
const AMBERLT= "FFF3CD";
const RED    = "8B1A1A";
const REDLT  = "FDECEA";
const GRAY1  = "F5F6F8";
const GRAY2  = "E8EAED";
const GRAY3  = "6C757D";
const WHITE  = "FFFFFF";
const BLACK  = "1A1A1A";
const TEAL   = "0B5E5E";
const TEALLT = "D0EDEC";
const PURPLE = "3B0764";
const PURPLT = "EDE9FE";

// ─── Borders ──────────────────────────────────────────────────────────────────
const thin = { style: BorderStyle.SINGLE, size: 1, color: "C8CDD3" };
const none = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const allT = { top: thin, bottom: thin, left: thin, right: thin };

// ─── Helpers ─────────────────────────────────────────────────────────────────
const pm  = { top: 90,  bottom: 90,  left: 140, right: 140 };
const pml = { top: 120, bottom: 120, left: 140, right: 140 };

function run(text, o = {}) {
  return new TextRun({ text, font: "Arial", size: o.size || 20,
    bold: o.bold || false, color: o.color || BLACK, italics: o.italic || false });
}
function para(children, o = {}) {
  return new Paragraph({
    alignment: o.align || AlignmentType.LEFT,
    spacing: { before: o.before || 0, after: o.after || 80, line: o.line || 276 },
    children: Array.isArray(children) ? children : [children]
  });
}
function sp(pts) { return new Paragraph({ spacing: { before: 0, after: pts }, children: [run("")] }); }
function h1(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 300, after: 140 },
    children: [new TextRun({ text, font: "Arial", bold: true, size: 28, color: NAVY })] });
}
function h2(text, color) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 220, after: 100 },
    children: [new TextRun({ text, font: "Arial", bold: true, size: 23, color: color || BLUE })] });
}

// ─── Table helpers ────────────────────────────────────────────────────────────
function hdr(text, w, fill) {
  return new TableCell({ borders: allT, width: { size: w, type: WidthType.DXA }, margins: pml,
    shading: { fill: fill || NAVY, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER,
    children: [para(new TextRun({ text, font: "Arial", bold: true, size: 18, color: WHITE }),
      { align: AlignmentType.CENTER })] });
}
function lbl(text, w, fill) {
  return new TableCell({ borders: allT, width: { size: w, type: WidthType.DXA }, margins: pm,
    shading: { fill: fill || GRAY1, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER,
    children: [para(new TextRun({ text, font: "Arial", bold: true, size: 18, color: "2C3E50" }))] });
}
function cell(children, w, fill) {
  return new TableCell({ borders: allT, width: { size: w, type: WidthType.DXA }, margins: pm,
    shading: { fill: fill || WHITE, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER,
    children: [para(Array.isArray(children) ? children : [children])] });
}
function ctr(text, w, fill, color) {
  return new TableCell({ borders: allT, width: { size: w, type: WidthType.DXA }, margins: pm,
    shading: { fill: fill || WHITE, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER,
    children: [para(run(text, { size: 18, color: color || BLACK }), { align: AlignmentType.CENTER })] });
}
function callout(items, borderColor, fill, w) {
  return new Table({ width: { size: w, type: WidthType.DXA }, columnWidths: [w],
    rows: [new TableRow({ children: [new TableCell({
      borders: { top: { style: BorderStyle.SINGLE, size: 6, color: borderColor },
                 bottom: { style: BorderStyle.SINGLE, size: 6, color: borderColor },
                 left: { style: BorderStyle.SINGLE, size: 18, color: borderColor },
                 right: { style: BorderStyle.SINGLE, size: 6, color: borderColor } },
      shading: { fill, type: ShadingType.CLEAR },
      margins: { top: 160, bottom: 160, left: 200, right: 200 },
      width: { size: w, type: WidthType.DXA },
      children: items
    })] })]
  });
}

// ─── Page: A4, 1" margins ─────────────────────────────────────────────────────
const PAGE_W = 11906, MARGIN = 1440, CW = 9026;

// ─── Document ─────────────────────────────────────────────────────────────────
const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 20, color: BLACK } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "Arial", color: NAVY },
        paragraph: { spacing: { before: 320, after: 160 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 23, bold: true, font: "Arial", color: BLUE },
        paragraph: { spacing: { before: 220, after: 100 }, outlineLevel: 1 } },
    ]
  },
  sections: [{
    properties: { page: { size: { width: PAGE_W, height: 16838 },
      margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN } } },
    headers: { default: new Header({ children: [new Paragraph({
      alignment: AlignmentType.RIGHT,
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: BLUE } }, spacing: { after: 0 },
      children: [run("CONFIDENTIAL  |  ERP Program — Audit Committee Briefing  |  March 2026", { size: 16, color: GRAY3 })]
    })] }) },
    footers: { default: new Footer({ children: [new Paragraph({
      border: { top: { style: BorderStyle.SINGLE, size: 4, color: BLUE } }, spacing: { before: 80 },
      tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
      children: [run("Abivax  |  Prepared by Mike Markman, ERP Project Director", { size: 16, color: GRAY3 }),
                 run("\t", { size: 16 }),
                 run("Page ", { size: 16, color: GRAY3 }),
                 new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 16, color: GRAY3 })]
    })] }) },

    children: [

      // ── TITLE ─────────────────────────────────────────────────────────────
      new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: BLUE, space: 8 } },
        spacing: { before: 0, after: 160 },
        children: [run("ERP Program — Delivery Model and Budget", { size: 34, bold: true, color: NAVY })]
      }),
      para([run("Audit Committee Briefing  |  March 2026", { size: 20, color: BLUE, bold: true })], { after: 60 }),
      para([run("Prepared by: Mike Markman, ERP Project Director  |  Sponsor: Didier Blondel, CFO", { size: 17, color: GRAY3 })], { after: 280 }),

      // ── EXECUTIVE SUMMARY ─────────────────────────────────────────────────
      h1("Executive Summary"),
      para([run("Abivax selected NetSuite (Oracle) as its ERP platform on February 26, 2026 following a structured RFP process. The program targets a January 1, 2027 go-live, with implementation scope focused on core financial operations — Record to Report, Procure to Pay, and multi-entity / multi-GAAP consolidation to support the company's French and US reporting requirements.")], { after: 80 }),
      para([run("This briefing documents the final delivery model, the program support structure, and the approved budget including a management reserve. The model has been designed to protect the January 1, 2027 deadline, embed SOX controls into the solution design from the outset, and maintain clear accountability across the implementation team and Abivax's internal program leadership.")], { after: 80 }),

      sp(60),
      callout([
        para(run("Key decisions confirmed", { bold: true, size: 20, color: NAVY }), { after: 80 }),
        ...[
          ["System selected", "NetSuite (Oracle) — SuiteSuccess Financials Premium"],
          ["Implementation model", "NetSuite Customer Success as SI, Paris-based European delivery team"],
          ["Program support", "CFGI — integrated controls oversight, program governance, and change management"],
          ["Phase 1 scope", "Record to Report, Procure to Pay, multi-entity, multi-GAAP (IFRS / French GAAP / US GAAP)"],
          ["Go-live target", "January 1, 2027"],
          ["Total budget (with reserve)", "€ 999,936 — see Section 5"],
        ].map(([k, v], i) => new Table({
          width: { size: CW - 400, type: WidthType.DXA }, columnWidths: [2600, CW - 400 - 2600],
          rows: [new TableRow({ children: [
            lbl(k, 2600, i % 2 === 0 ? GRAY1 : GRAY2),
            cell(run(v, { size: 18 }), CW - 400 - 2600, i % 2 === 0 ? WHITE : GRAY1),
          ]})]
        }))
      ], NAVY, LTBLUE, CW),

      sp(260),

      // ── SYSTEM SELECTION ──────────────────────────────────────────────────
      h1("System Selection"),
      para([run("NetSuite was selected over SAP following an RFP process managed with KPMG advisory support. The decision was based on total cost of ownership, fit with Abivax's current operational scale, implementation timeline, and the quality of the implementation model for a company of this size and complexity.")], { after: 80 }),
      para([run("Key selection factors:")], { after: 40 }),

      new Table({
        width: { size: CW, type: WidthType.DXA }, columnWidths: [3000, CW - 3000],
        rows: [
          new TableRow({ tableHeader: true, children: [hdr("Factor", 3000), hdr("NetSuite Outcome", CW - 3000)] }),
          ...[
            ["Multi-GAAP reporting", "Native multi-book support for IFRS, French GAAP, and US GAAP in a single system — critical for dual-footprint reporting"],
            ["Multi-entity consolidation", "OneWorld module supports Abivax parent and two subsidiaries (France, US) with automated intercompany eliminations"],
            ["Implementation team", "Paris-based European delivery team with multi-GAAP experience; on-site presence for milestones"],
            ["SOX readiness", "SuiteSuccess delivery model includes controls and SoD design as part of standard scope"],
            ["Total cost vs SAP", "Materially lower across Year 1 and 5-year horizon"],
            ["Timeline to Jan 1, 2027", "Confirmed achievable under SuiteSuccess model; April 2026 kickoff assumed"],
          ].map(([f, o], i) => new TableRow({ children: [
            lbl(f, 3000, i % 2 === 0 ? GRAY1 : GRAY2),
            cell(run(o, { size: 18 }), CW - 3000, i % 2 === 0 ? WHITE : GRAY1),
          ]}))
        ]
      }),

      sp(260),

      // ── DELIVERY MODEL ────────────────────────────────────────────────────
      h1("Delivery Model"),
      para([run("The program operates on a two-layer model: NetSuite as the system integrator responsible for configuration and delivery, and CFGI as an integrated program support partner responsible for controls oversight, governance, and change management.")], { after: 120 }),

      h2("Layer 1 — NetSuite Implementation Team"),
      para([run("NetSuite's European Customer Success team is the system integrator. The assigned team is Paris-based, providing on-site presence for design workshops, milestone reviews, and UAT.")], { after: 100 }),

      new Table({
        width: { size: CW, type: WidthType.DXA }, columnWidths: [2200, 2000, 2000, CW - 6200],
        rows: [
          new TableRow({ tableHeader: true, children: [
            hdr("Name", 2200), hdr("Role", 2000), hdr("Location", 2000), hdr("Background", CW - 6200)
          ]}),
          ...[
            ["Hafid Irbaiyne",    "Practice Manager France/MEA",   "Paris — on-site",  "18 years experience; ex-CFO; French CPA; 4 years NetSuite"],
            ["Mazdak Sayyedelar", "Project Manager Europe",        "Paris — on-site",  "7 years international IT project management; 6 years Oracle"],
            ["Ali Brahmi",        "Senior Functional Consultant",  "Paris — on-site",  "8 years ERP financial experience; 4+ years Oracle NetSuite"],
            ["Sukeyna Ouled",     "Technical / Dev Lead",          "Remote (on-demand)","9+ years IT development; 7 years Oracle NetSuite"],
            ["Mathieu Lair",      "Trainer",                       "Paris — on-site",  "10 years ERP experience"],
          ].map(([name, role, loc, bg], i) => new TableRow({ children: [
            lbl(name, 2200, i % 2 === 0 ? GRAY1 : GRAY2),
            cell(run(role, { size: 17 }), 2000, i % 2 === 0 ? WHITE : GRAY1),
            cell(run(loc, { size: 17 }), 2000, i % 2 === 0 ? WHITE : GRAY1),
            cell(run(bg, { size: 17 }), CW - 6200, i % 2 === 0 ? WHITE : GRAY1),
          ]}))
        ]
      }),

      sp(160),
      h2("Layer 2 — CFGI Integrated Program Support"),
      para([run("CFGI serves as the independent program support partner across three workstreams. CFGI has been engaged on Abivax's SOX remediation program since September 2025 and brings direct knowledge of the company's control environment, process gaps, and finance team structure.")], { after: 100 }),

      new Table({
        width: { size: CW, type: WidthType.DXA }, columnWidths: [2400, 2400, CW - 4800],
        rows: [
          new TableRow({ tableHeader: true, children: [
            hdr("Workstream", 2400, BLUE),
            hdr("CFGI Lead", 2400, BLUE),
            hdr("Scope", CW - 4800, BLUE),
          ]}),
          ...[
            [
              "Technical and Controls Oversight",
              "Kenneth Schatz (MD)\nGuy Morissette (Director)",
              "Independent design checkpoint reviews at blueprint, build, and UAT stages. Controls-by-design deliverable at blueprint mapping ERP configuration to existing SOX remediation items. Go/no-go written assessment at cutover."
            ],
            [
              "Program Governance",
              "Walid Bouassida (Director)\nYouness Tyamaz (Consultant)",
              "On-the-ground program coordination in Paris. Weekly flash report to program director. Steering committee facilitation and materials. Risk and issue escalation. Milestone tracking against January 1, 2027 deadline."
            ],
            [
              "Change Management and Adoption",
              "Walid Bouassida\nYouness Tyamaz",
              "Stakeholder and adoption risk mapping at kickoff. Communication plan development and execution. Training coordination in French. Post-go-live adoption checks at 30 and 60 days."
            ],
          ].map(([ws, lead, scope], i) => new TableRow({ children: [
            lbl(ws, 2400, i % 2 === 0 ? LTBLUE : "C5D9F0"),
            cell(run(lead, { size: 17 }), 2400, i % 2 === 0 ? WHITE : GRAY1),
            cell(run(scope, { size: 17 }), CW - 4800, i % 2 === 0 ? WHITE : GRAY1),
          ]}))
        ]
      }),

      sp(160),
      h2("Abivax Internal Program Team"),
      para([run("The following Abivax team members carry named responsibilities in the ERP program. Business process owners are accountable for requirements, design sign-off, data cleansing, and UAT in their respective areas.")], { after: 100 }),

      new Table({
        width: { size: CW, type: WidthType.DXA }, columnWidths: [2200, 2400, 1600, CW - 6200],
        rows: [
          new TableRow({ tableHeader: true, children: [
            hdr("Name", 2200), hdr("Role", 2400), hdr("Location", 1600), hdr("ERP Responsibility", CW - 6200)
          ]}),
          ...[
            ["Didier Blondel",    "CFO / Executive Sponsor",                   "Global",        "Program sponsor; final escalation; board and audit committee reporting"],
            ["Mike Markman",      "ERP Program Director",                      "US / Global",   "Day-to-day program ownership; vendor management; scope and budget decisions"],
            ["Hema Keshava",      "Finance Lead (FP&A, Treasury, Tax)",        "US / Global",   "Finance scope decisions; reporting model; critical stakeholder for R2R and multi-GAAP design"],
            ["Trinidad",          "Accounting Manager / Consolidation Lead",   "France",        "French consolidation; chart of accounts; close process design; primary France accounting BPO"],
            ["Frederick",         "FP&A Lead",                                 "France",        "FP&A and reporting model; cost center design; reporting extract requirements"],
            ["Adrian Holbrook",   "FP&A / Reporting (reports to Frederick)",   "US / Global",   "Cost center design; data-access and export quality; US-side reporting bridge"],
            ["Juliette",          "P2P Process Owner",                         "France",        "France-side P2P BPO; invoice processing; workflow approval design; vendor master"],
            ["Kimberly Gordon",   "P2P Contractor",                            "US",            "US-side P2P; AP coordination; Juliette counterpart for US workflows"],
            ["Philippe",          "Finance Manager",                           "France",        "P2P governance chain; Juliette's manager; escalation for France P2P design decisions"],
            ["Matt Epley",        "US Accounting / SEC & Equity Reporting",    "US",            "SEC / NASDAQ reporting; equity (Certent); IFRS adjustments; US GAAP reporting outputs"],
            ["Jade",              "IT Lead / ERP Integration",                 "France",        "IT integration architecture; system access; controls and infrastructure decisions"],
            ["Benjamin Talmant",  "IT Project Manager",                        "France",        "IT delivery coordination; integration workstream PM; IT capacity management"],
          ].map(([name, role, loc, resp], i) => new TableRow({ children: [
            lbl(name, 2200, i % 2 === 0 ? GRAY1 : GRAY2),
            cell(run(role, { size: 17 }), 2400, i % 2 === 0 ? WHITE : GRAY1),
            cell(run(loc, { size: 17, color: GRAY3 }), 1600, i % 2 === 0 ? WHITE : GRAY1),
            cell(run(resp, { size: 17 }), CW - 6200, i % 2 === 0 ? WHITE : GRAY1),
          ]}))
        ]
      }),

      sp(260),

      // ── SOX AND CONTROLS ──────────────────────────────────────────────────
      h1("SOX Integration and Controls"),
      para([run("SOX readiness is a first-order program requirement, not a post-go-live audit item. The delivery model has been structured to ensure controls are embedded in the ERP design from the outset.")], { after: 100 }),

      callout([
        para(run("Controls-by-design approach", { bold: true, size: 20, color: NAVY }), { after: 80 }),
        para([run("CFGI holds Abivax's existing SOX remediation program and has documented the company's current control gaps, process deficiencies, and remediation progress since September 2025. This knowledge is directly incorporated into the ERP implementation through a controls-by-design deliverable at the blueprint stage — mapping each ERP configuration decision to the relevant SOX control requirement before the system is built. This approach eliminates the risk of discovering controls gaps late in the program when remediation is costly and disruptive.", { size: 19 })], { after: 0 }),
      ], PURPLE, PURPLT, CW),

      sp(140),

      new Table({
        width: { size: CW, type: WidthType.DXA }, columnWidths: [3200, CW - 3200],
        rows: [
          new TableRow({ tableHeader: true, children: [hdr("SOX Requirement", 3200, PURPLE), hdr("Program Response", CW - 3200, PURPLE)] }),
          ...[
            ["Controls-by-design at blueprint", "CFGI deliverable mapping ERP configuration to SOX control register — produced before build begins"],
            ["Segregation of duties (SoD)", "SoD-compliant user access and role design reviewed by CFGI at blueprint and validated at UAT"],
            ["ITGC / SDLC controls", "NetSuite SuiteSuccess delivery model includes system development lifecycle controls as standard scope"],
            ["Audit trail and data integrity", "NetSuite native audit logging; CFGI reviews configuration against audit requirements"],
            ["Go-live readiness", "CFGI provides written go/no-go assessment against SOX readiness criteria before cutover is approved"],
            ["Post-go-live validation", "CFGI adoption checks at 30 and 60 days include confirmation that controls are operating as designed"],
          ].map(([req, res], i) => new TableRow({ children: [
            lbl(req, 3200, i % 2 === 0 ? PURPLT : "E4D9F5"),
            cell(run(res, { size: 18 }), CW - 3200, i % 2 === 0 ? WHITE : GRAY1),
          ]}))
        ]
      }),

      sp(260),

      // ── TIMELINE ──────────────────────────────────────────────────────────
      h1("Implementation Timeline"),

      new Table({
        width: { size: CW, type: WidthType.DXA }, columnWidths: [1800, 2000, CW - 3800],
        rows: [
          new TableRow({ tableHeader: true, children: [
            hdr("Phase", 1800), hdr("Timing", 2000), hdr("Key Activities", CW - 3800)
          ]}),
          ...[
            ["Mobilization",    "April 2026",       "Contracts signed; team onboarded; project governance established; kickoff"],
            ["Blueprint",       "April – May 2026", "Business process design; system configuration decisions; controls-by-design deliverable; data migration planning"],
            ["Build",           "June – Aug 2026",  "System configuration; integration development; data preparation and mock loads; change plan execution begins"],
            ["UAT",             "Aug – Oct 2026",   "User acceptance testing; defect resolution; SoD validation; cutover planning"],
            ["Cutover / Deploy","Oct – Dec 2026",   "Final data migration; parallel run; go/no-go assessment; production cutover"],
            ["Go-Live",         "January 1, 2027",  "Production go-live; hypercare support; post-go-live adoption checks"],
            ["Phase 2 (TBD)",   "2027",             "Order to Cash, Inventory Management — scoped and contracted separately"],
          ].map(([phase, timing, acts], i) => new TableRow({ children: [
            lbl(phase, 1800, i % 2 === 0 ? LTBLUE : "C5D9F0"),
            ctr(timing, 2000, i % 2 === 0 ? WHITE : GRAY1, GRAY3),
            cell(run(acts, { size: 17 }), CW - 3800, i % 2 === 0 ? WHITE : GRAY1),
          ]}))
        ]
      }),

      sp(260),

      // ── BUDGET ────────────────────────────────────────────────────────────
      h1("Program Budget"),
      para([run("All figures in EUR, excluding VAT. Budget presented at the program level across three categories: NetSuite implementation and licensing, CFGI program support, and a management reserve.", { size: 18, italic: true, color: GRAY3 })], { after: 120 }),

      new Table({
        width: { size: CW, type: WidthType.DXA }, columnWidths: [3800, 1800, 1800, CW - 7400],
        rows: [
          new TableRow({ tableHeader: true, children: [
            hdr("Budget Line", 3800),
            hdr("Amount (EUR)", 1800),
            hdr("Type", 1800),
            hdr("Notes", CW - 7400),
          ]}),

          // NetSuite header row
          new TableRow({ children: [
            new TableCell({ borders: allT, width: { size: 3800, type: WidthType.DXA }, margins: pm,
              shading: { fill: NAVY, type: ShadingType.CLEAR }, columnSpan: 4,
              children: [para(run("NetSuite — System and Implementation", { bold: true, size: 18, color: WHITE }))] }),
          ]}),
          ...[
            ["NetSuite recurring license (Year 1)", "€ 148,589", "Annual recurring", "Base platform, multi-entity, multi-book; after negotiated discount"],
            ["Implementation services (fixed bid)", "€ 388,700", "Fixed fee", "V3 SOW dated 17 Mar 2026; Phase 1 focus: R2R, P2P, multi-GAAP; O2C and Inventory included in base SOW but not activated Phase 1"],
            ["Training", "€ 7,647", "Fixed fee", "Tailored training package; after negotiated discount"],
            ["Travel (capped)", "€ 18,000", "Capped T&M", "Paris-based team travel; hard cap agreed"],
            ["NetSuite subtotal", "€ 562,936", "", ""],
          ].map(([label, amt, type, note], i) => {
            const isTotal = label.includes("subtotal");
            return new TableRow({ children: [
              new TableCell({ borders: allT, width: { size: 3800, type: WidthType.DXA }, margins: pm,
                shading: { fill: isTotal ? GRAY2 : i % 2 === 0 ? GRAY1 : WHITE, type: ShadingType.CLEAR },
                children: [para(run(label, { size: 18, bold: isTotal }))] }),
              new TableCell({ borders: allT, width: { size: 1800, type: WidthType.DXA }, margins: pm,
                shading: { fill: isTotal ? GRAY2 : i % 2 === 0 ? GRAY1 : WHITE, type: ShadingType.CLEAR },
                children: [para(run(amt, { size: 18, bold: isTotal, color: isTotal ? NAVY : BLACK }), { align: AlignmentType.RIGHT })] }),
              new TableCell({ borders: allT, width: { size: 1800, type: WidthType.DXA }, margins: pm,
                shading: { fill: isTotal ? GRAY2 : i % 2 === 0 ? GRAY1 : WHITE, type: ShadingType.CLEAR },
                children: [para(run(type, { size: 17, color: GRAY3 }), { align: AlignmentType.CENTER })] }),
              new TableCell({ borders: allT, width: { size: CW - 7400, type: WidthType.DXA }, margins: pm,
                shading: { fill: isTotal ? GRAY2 : i % 2 === 0 ? GRAY1 : WHITE, type: ShadingType.CLEAR },
                children: [para(run(note, { size: 17 }))] }),
            ]});
          }),

          // CFGI header row
          new TableRow({ children: [
            new TableCell({ borders: allT, width: { size: 3800, type: WidthType.DXA }, margins: pm,
              shading: { fill: BLUE, type: ShadingType.CLEAR }, columnSpan: 4,
              children: [para(run("CFGI — Integrated Program Support", { bold: true, size: 18, color: WHITE }))] }),
          ]}),
          ...[
            ["Technical and controls oversight", "€ 70,000", "Fixed fee", "Design checkpoint reviews; controls-by-design deliverable; go/no-go assessment"],
            ["Program governance (Walid / Youness)", "€ 110,000", "T&M (capped)", "Paris-based PMO; flash reporting; steering committee facilitation; 35 weeks"],
            ["Change management and adoption", "€ 40,000", "T&M (capped)", "Stakeholder mapping; comms plan; training coordination; adoption checks"],
            ["CFGI subtotal", "€ 220,000", "", ""],
          ].map(([label, amt, type, note], i) => {
            const isTotal = label.includes("subtotal");
            return new TableRow({ children: [
              new TableCell({ borders: allT, width: { size: 3800, type: WidthType.DXA }, margins: pm,
                shading: { fill: isTotal ? GRAY2 : i % 2 === 0 ? LTBLUE : WHITE, type: ShadingType.CLEAR },
                children: [para(run(label, { size: 18, bold: isTotal }))] }),
              new TableCell({ borders: allT, width: { size: 1800, type: WidthType.DXA }, margins: pm,
                shading: { fill: isTotal ? GRAY2 : i % 2 === 0 ? LTBLUE : WHITE, type: ShadingType.CLEAR },
                children: [para(run(amt, { size: 18, bold: isTotal, color: isTotal ? BLUE : BLACK }), { align: AlignmentType.RIGHT })] }),
              new TableCell({ borders: allT, width: { size: 1800, type: WidthType.DXA }, margins: pm,
                shading: { fill: isTotal ? GRAY2 : i % 2 === 0 ? LTBLUE : WHITE, type: ShadingType.CLEAR },
                children: [para(run(type, { size: 17, color: GRAY3 }), { align: AlignmentType.CENTER })] }),
              new TableCell({ borders: allT, width: { size: CW - 7400, type: WidthType.DXA }, margins: pm,
                shading: { fill: isTotal ? GRAY2 : i % 2 === 0 ? LTBLUE : WHITE, type: ShadingType.CLEAR },
                children: [para(run(note, { size: 17 }))] }),
            ]});
          }),

          // Reserve header row
          new TableRow({ children: [
            new TableCell({ borders: allT, width: { size: 3800, type: WidthType.DXA }, margins: pm,
              shading: { fill: TEAL, type: ShadingType.CLEAR }, columnSpan: 4,
              children: [para(run("Management Reserve — Finance Team Capacity", { bold: true, size: 18, color: WHITE }))] }),
          ]}),
          ...[
            ["Interim / fractional finance resource support", "€ 85,000", "T&M (reserve)", "Backstop capacity for finance team during peak phases; covers interim or advisory resources as needed"],
            ["Training, readiness, and user enablement", "€ 37,000", "Reserve", "Supplemental training, system admin ramp-up, or third-party enablement tools beyond base NetSuite package"],
            ["Data migration and cutover preparation", "€ 35,000", "Reserve", "Third-party support for data cleansing, mock loads, or cutover coordination if internal capacity is insufficient"],
            ["Contingency and scope buffer", "€ 60,000", "Reserve", "Held for unforeseen scope, regulatory adjustments (e.g., French e-invoicing confirmation), or integration complexity"],
            ["Reserve subtotal", "€ 217,000", "", ""],
          ].map(([label, amt, type, note], i) => {
            const isTotal = label.includes("subtotal");
            return new TableRow({ children: [
              new TableCell({ borders: allT, width: { size: 3800, type: WidthType.DXA }, margins: pm,
                shading: { fill: isTotal ? GRAY2 : i % 2 === 0 ? TEALLT : WHITE, type: ShadingType.CLEAR },
                children: [para(run(label, { size: 18, bold: isTotal }))] }),
              new TableCell({ borders: allT, width: { size: 1800, type: WidthType.DXA }, margins: pm,
                shading: { fill: isTotal ? GRAY2 : i % 2 === 0 ? TEALLT : WHITE, type: ShadingType.CLEAR },
                children: [para(run(amt, { size: 18, bold: isTotal, color: isTotal ? TEAL : BLACK }), { align: AlignmentType.RIGHT })] }),
              new TableCell({ borders: allT, width: { size: 1800, type: WidthType.DXA }, margins: pm,
                shading: { fill: isTotal ? GRAY2 : i % 2 === 0 ? TEALLT : WHITE, type: ShadingType.CLEAR },
                children: [para(run(type, { size: 17, color: GRAY3 }), { align: AlignmentType.CENTER })] }),
              new TableCell({ borders: allT, width: { size: CW - 7400, type: WidthType.DXA }, margins: pm,
                shading: { fill: isTotal ? GRAY2 : i % 2 === 0 ? TEALLT : WHITE, type: ShadingType.CLEAR },
                children: [para(run(note, { size: 17 }))] }),
            ]});
          }),

          // Grand total
          new TableRow({ children: [
            new TableCell({ borders: allT, width: { size: 3800, type: WidthType.DXA }, margins: pml,
              shading: { fill: NAVY, type: ShadingType.CLEAR },
              children: [para(run("TOTAL PROGRAM BUDGET (YEAR 1)", { bold: true, size: 20, color: WHITE }))] }),
            new TableCell({ borders: allT, width: { size: 1800, type: WidthType.DXA }, margins: pml,
              shading: { fill: NAVY, type: ShadingType.CLEAR },
              children: [para(run("€ 999,936", { bold: true, size: 20, color: WHITE }), { align: AlignmentType.RIGHT })] }),
            new TableCell({ borders: allT, width: { size: 1800, type: WidthType.DXA }, margins: pml,
              shading: { fill: NAVY, type: ShadingType.CLEAR }, children: [para(run(""))] }),
            new TableCell({ borders: allT, width: { size: CW - 7400, type: WidthType.DXA }, margins: pml,
              shading: { fill: NAVY, type: ShadingType.CLEAR },
              children: [para(run("Excl. VAT. Phase 2 (O2C, Inventory) scoped and contracted separately in 2027.", { size: 17, color: LTBLUE }))] }),
          ]}),
        ]
      }),

      sp(100),
      para([run("Notes: (1) NetSuite implementation fee is the fixed bid from V3 SOW dated March 17, 2026 (€388,700). Phase 1 activates R2R, P2P, and multi-GAAP; O2C and Inventory are included in the base SOW but will not be activated in Phase 1. (2) CFGI support fees are subject to contract; figures reflect the target range communicated to CFGI. (3) Management reserve is held by the program director and requires written approval to release.", { size: 16, italic: true, color: GRAY3 })], { after: 0 }),

      sp(260),

      // ── RISKS ─────────────────────────────────────────────────────────────
      h1("Key Risks and Mitigations"),

      new Table({
        width: { size: CW, type: WidthType.DXA }, columnWidths: [2800, 1000, CW - 3800],
        rows: [
          new TableRow({ tableHeader: true, children: [
            hdr("Risk", 2800), hdr("Level", 1000), hdr("Mitigation", CW - 3800)
          ]}),
          ...[
            ["Multi-GAAP configuration complexity causes late rework", "Medium", "Hafid Irbaiyne (ex-CFO, French CPA) leads design; CFGI controls-by-design review at blueprint stage"],
            ["Finance team capacity constrained during peak implementation", "Medium", "€ 85K reserve allocated for interim / fractional support; Walid manages workload visibility on the ground"],
            ["French e-invoicing regulatory scope underestimated", "Medium", "Confirm coverage in final NetSuite SOW before signing; reserve budget available if additional scope required"],
            ["Data migration quality issues delay UAT", "Medium", "RACI confirmed: Abivax owns data cleansing (R). Reserve budget available to support third-party data preparation assistance if needed"],
            ["NetSuite delivery lead changes post-signing", "Low–Medium", "Named team confirmed in contract; escalation path to Hafid as practice sponsor; CFGI present at all milestones as independent checkpoint"],
            ["Program deprioritized due to corporate event", "Low", "Phase 1 scope is deliberately narrow to minimize sunk cost exposure; CFGI and NetSuite contracts structured with clear pause/exit provisions"],
          ].map(([risk, level, mit], i) => {
            const levelColor = level === "Medium" ? AMBER : level.includes("Low") ? GREEN : RED;
            const levelFill  = level === "Medium" ? AMBERLT : level.includes("Low") ? GREENLT : REDLT;
            return new TableRow({ children: [
              cell(run(risk, { size: 17 }), 2800, i % 2 === 0 ? GRAY1 : WHITE),
              ctr(level, 1000, levelFill, levelColor),
              cell(run(mit, { size: 17 }), CW - 3800, i % 2 === 0 ? GRAY1 : WHITE),
            ]});
          })
        ]
      }),

      sp(260),

      // ── GOVERNANCE ────────────────────────────────────────────────────────
      h1("Governance and Oversight"),

      new Table({
        width: { size: CW, type: WidthType.DXA }, columnWidths: [2000, 1800, CW - 3800],
        rows: [
          new TableRow({ tableHeader: true, children: [
            hdr("Forum", 2000), hdr("Cadence", 1800), hdr("Attendees and Purpose", CW - 3800)
          ]}),
          ...[
            ["Steering Committee", "Every 4–6 weeks", "CFO (Didier Blondel), ERP Project Director (Mike Markman), NetSuite Practice Manager (Hafid), CFGI Program Lead (Walid). Program status, risk escalation, scope and budget decisions."],
            ["Program Flash Report", "Weekly", "Prepared by Walid / CFGI; delivered to Mike Markman. Status, milestones, open risks, decisions needed. Two-page maximum."],
            ["Design Authority", "As needed during blueprint and build", "NetSuite functional team, CFGI controls lead, Abivax BPOs. Configuration and design decisions; scope change management."],
            ["Audit Committee Update", "Quarterly / as required", "Audit Committee, CFO (Didier Blondel), ERP Project Director. SOX integration status, controls-by-design progress, go-live readiness."],
            ["Go / No-Go Review", "Pre-cutover (December 2026)", "CFO (Didier Blondel), ERP Project Director, NetSuite PM, CFGI. Written readiness assessment against SOX and operational criteria before production cutover is approved."],
          ].map(([forum, cadence, purpose], i) => new TableRow({ children: [
            lbl(forum, 2000, i % 2 === 0 ? LTBLUE : "C5D9F0"),
            ctr(cadence, 1800, i % 2 === 0 ? WHITE : GRAY1, GRAY3),
            cell(run(purpose, { size: 17 }), CW - 3800, i % 2 === 0 ? WHITE : GRAY1),
          ]}))
        ]
      }),

      sp(300),
      new Paragraph({
        border: { top: { style: BorderStyle.SINGLE, size: 2, color: GRAY2 } },
        spacing: { before: 120, after: 0 },
        children: [run("Prepared for Audit Committee use. Budget figures are estimates pending final contract execution; confirmed figures will be updated prior to board approval. All vendor engagements subject to legal review and execution of formal contracts.", { size: 15, color: GRAY3 })]
      }),
    ]
  }]
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync("/sessions/peaceful-hopeful-cori/mnt/abivax-1/outputs/ERP_Program_Audit_Committee_Brief_Mar2026.docx", buf);
  console.log("Done.");
}).catch(e => { console.error(e); process.exit(1); });
