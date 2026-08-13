// v2 — Full bilingual (Marathi + English) survey form structure document
// with COLOUR-CODED hierarchy and two deep-detail appendices:
//   परिशिष्ट 1 : शिक्षण (Education)  — every Level → Stream → Course
//   परिशिष्ट 2 : नौकरी / व्यवसाय     — every category → step → option
//
// Run with bun (TS data files are imported directly):
//   bun scripts/generate-form-bilingual-doc-v2.mjs

import fs from "node:fs";
import path from "node:path";
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  PageOrientation, BorderStyle,
} from "docx";
import { sections } from "./generate-form-structure-doc.mjs";
import { EDUCATION_TREE, INSTITUTION_TYPES } from "../src/lib/education-data.ts";
import * as O from "../src/lib/occupation-data.ts";

// ---------------- COLOUR SYSTEM (easy to read) ----------------
const C = {
  section: "1D4ED8",   // Level 1 – section heading (blue)
  group:   "0F766E",   // Level 2 – group heading (teal)
  sub:     "7C2D91",   // Level 3 – sub-step heading (purple)
  label:   "111827",   // field label (near-black)
  english: "1D4ED8",   // English translation (blue)
  option:  "1F2937",   // option text (dark grey)
  optEn:   "0F766E",   // option English (teal)
  type:    "6D28D9",   // field type badge (violet)
  logic:   "B45309",   // conditional logic (amber)
  note:    "047857",   // notes (green)
  muted:   "6B7280",
};
const FONT = "Nirmala UI";

const T = (text, o = {}) => new TextRun({
  text, bold: o.bold, italics: o.italics, size: o.size ?? 22,
  color: o.color ?? C.label, font: FONT,
});
const P = (runs, o = {}) => new Paragraph({
  children: runs, alignment: o.alignment, indent: o.indent,
  spacing: { before: o.before ?? 0, after: o.after ?? 60 },
  border: o.border, pageBreakBefore: o.pageBreakBefore,
});

// "मराठी (English)" — auto-splits strings already written as "मराठी (English)"
function bilingualRuns(v, o = {}) {
  let mr, en;
  if (typeof v === "string") {
    const m = v.match(/^(.*?)\s*\(([^()]*(?:\([^()]*\)[^()]*)*)\)\s*$/);
    if (m) { mr = m[1].trim(); en = m[2].trim(); } else { mr = v; en = null; }
  } else { mr = v.mr; en = v.en; }
  const runs = [T(mr, { bold: o.bold, size: o.size, color: o.color ?? C.label })];
  if (en && en !== mr) runs.push(T(` (${en})`, { size: o.size, color: o.enColor ?? C.english }));
  return runs;
}

function typeLabel(t) {
  const mr = typeof t === "string" ? t : t.mr;
  const en = typeof t === "string" ? null : t.en;
  if (!en || en === mr) return mr;
  const strip = (x) => x.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (strip(mr).includes(strip(en)) && strip(en).length > 2) return mr;
  return `${mr} (${en})`;
}

// ---------------- generic renderers ----------------
const H1 = (runs, pageBreak = true) => new Paragraph({
  heading: HeadingLevel.HEADING_1, pageBreakBefore: pageBreak,
  spacing: { before: 200, after: 140 }, children: runs,
});

const groupHeading = (v) => P(bilingualRuns(v, { bold: true, size: 26, color: C.group, enColor: C.section }), {
  before: 220, after: 60,
  border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "CBD5E1", space: 3 } },
});

const subHeading = (text) => P([T(text, { bold: true, size: 23, color: C.sub })],
  { before: 140, after: 40, indent: { left: 200 } });

const fieldLine = (name, type) => P([
  T("•  ", { bold: true, color: C.group, size: 24 }),
  ...bilingualRuns(name, { bold: true, size: 23, color: C.label, enColor: C.english }),
  ...(type ? [T(`   [${typeLabel(type)}]`, { color: C.type, size: 20 })] : []),
], { indent: { left: 360, hanging: 200 }, before: 80, after: 30 });

const optionLine = (op, extraIndent = 0) => P([
  T("◦  ", { color: C.group }),
  ...bilingualRuns(op, { size: 21, color: C.option, enColor: C.optEn }),
], { indent: { left: 900 + extraIndent, hanging: 200 }, after: 20 });

const logicLines = (lg) => {
  const out = [P([
    T("↳ ", { bold: true, color: C.logic }),
    T(typeof lg === "string" ? lg : lg.mr, { italics: true, color: C.logic, size: 20 }),
  ], { indent: { left: 900, hanging: 220 }, before: 20, after: 10 })];
  if (typeof lg !== "string" && lg.en) {
    out.push(P([T(lg.en, { italics: true, color: C.muted, size: 19 })], { indent: { left: 1120 }, after: 30 }));
  }
  return out;
};

const noteLines = (n) => {
  const out = [P([
    T("टीप (Note): ", { bold: true, color: C.note, size: 20 }),
    T(typeof n === "string" ? n : n.mr, { italics: true, color: C.note, size: 20 }),
  ], { indent: { left: 360 }, after: 20 })];
  if (typeof n !== "string" && n.en) {
    out.push(P([T(n.en, { italics: true, color: C.muted, size: 19 })], { indent: { left: 640 }, after: 40 }));
  }
  return out;
};

// ---------------- main sections ----------------
function renderField(f) {
  const nodes = [fieldLine(f.name, f.type)];
  (f.options || []).forEach((op) => nodes.push(optionLine(op)));
  (f.logic || []).forEach((lg) => nodes.push(...logicLines(lg)));
  return nodes;
}
function renderGroup(g) {
  const nodes = [groupHeading(g.title)];
  (g.notes || []).forEach((n) => nodes.push(...noteLines(n)));
  if (!g.fields || !g.fields.length) {
    nodes.push(P([T("(थेट fields नाहीत / No direct fields)", { italics: true, color: C.muted, size: 20 })], { indent: { left: 360 } }));
  } else g.fields.forEach((f) => nodes.push(...renderField(f)));
  return nodes;
}
function renderSection(s) {
  const nodes = [H1([
    T(`विभाग ${s.badge} (Section ${s.badge}):  `, { bold: true, size: 30, color: C.group }),
    ...bilingualRuns(s.title, { bold: true, size: 32, color: C.section, enColor: C.group }),
  ])];
  s.groups.forEach((g) => nodes.push(...renderGroup(g)));
  return nodes;
}

// ---------------- APPENDIX 1 : EDUCATION ----------------
function appendixEducation() {
  const n = [];
  n.push(H1([
    T("परिशिष्ट 1 (Appendix 1):  ", { bold: true, size: 30, color: C.group }),
    T("शिक्षण — संपूर्ण तपशील", { bold: true, size: 32, color: C.section }),
    T(" (Education — Full Detail)", { size: 28, color: C.group }),
  ]));
  n.push(P([T("फॉर्म प्रवाह (Form flow): ", { bold: true, color: C.note }),
    T("शिक्षण स्तर (Level) → शाखा / गट (Stream) → अभ्यासक्रम (Course) → संस्था प्रकार (Institution Type)", { color: C.label })],
    { after: 120 }));

  n.push(P([T("पायरी 1 (Step 1): शिक्षण स्तर (Education Level) ", { bold: true, size: 24, color: C.sub }),
    T("[Dropdown]", { color: C.type, size: 20 })], { before: 80, after: 40 }));
  EDUCATION_TREE.forEach((lv) => n.push(optionLine(lv.level)));

  EDUCATION_TREE.forEach((lv) => {
    n.push(groupHeading(lv.level));
    n.push(P([
      T("पायरी 2 (Step 2): शाखा / गट (Stream / Group) ", { bold: true, size: 22, color: C.sub }),
      T("[Dropdown]", { color: C.type, size: 19 }),
    ], { indent: { left: 200 }, after: 30 }));
    lv.streams.forEach((st) => {
      n.push(P([
        T("▪ ", { bold: true, color: C.group }),
        ...bilingualRuns(st.stream, { bold: true, size: 22, color: C.label, enColor: C.english }),
      ], { indent: { left: 500, hanging: 200 }, before: 60, after: 20 }));
      n.push(P([T("पायरी 3 (Step 3): अभ्यासक्रम (Course) — पर्याय:", { italics: true, size: 19, color: C.muted })],
        { indent: { left: 700 }, after: 10 }));
      st.courses.forEach((cr) => n.push(optionLine(cr, 100)));
    });
    if (lv.askInstitution) {
      n.push(P([
        T("पायरी 4 (Step 4): संस्था प्रकार (Institution Type) ", { bold: true, size: 22, color: C.sub }),
        T("[Dropdown]", { color: C.type, size: 19 }),
      ], { indent: { left: 200 }, before: 80, after: 20 }));
      INSTITUTION_TYPES.forEach((it) => n.push(optionLine(it)));
    } else {
      n.push(...noteLines("या स्तरासाठी संस्था प्रकार विचारला जात नाही. (Institution Type is not asked for this level.)"));
    }
  });
  return n;
}

// ---------------- APPENDIX 2 : OCCUPATION ----------------
const COMMON = {
  org: "संस्था / कंपनीचे नाव (Organisation / Company Name)",
  place: "कार्यरत ठिकाण (Place of Posting)",
  notes: "इतर तपशील (Other Notes)",
};

const loanFlow = (mode) => mode === "self" ? [
  { q: "आपल्याला स्वतःचे दुकान किंवा व्यवसाय सुरू करण्याची इच्छा आहे का? (Do you wish to start your own shop / business?)", opts: ["होय (Yes)", "नाही (No)"] },
  { q: "जर होय — व्यवसाय सुरू करण्यासाठी कर्जाची आवश्यकता आहे का? (If Yes — Is a loan required?)", opts: ["होय (Yes)", "नाही (No)"] },
  { q: "जर होय — आवश्यक कर्ज रक्कम (Required Loan Amount)", opts: O.LOAN_AMOUNT_OPTIONS },
  { q: "'इतर' निवडल्यास — रक्कम नमूद करा (If 'Other' — specify amount)", type: "Text" },
] : [
  { q: "व्यवसाय विस्तारासाठी / नवीन व्यवसायासाठी कर्जाची आवश्यकता आहे का? (Is a loan required for expansion / new business?)", opts: ["होय (Yes)", "नाही (No)"] },
  { q: "जर होय — आवश्यक कर्ज रक्कम (Required Loan Amount)", opts: O.LOAN_AMOUNT_OPTIONS },
  { q: "कर्जाचा उद्देश (Loan Purpose)", opts: O.LOAN_PURPOSE_OPTIONS },
  { q: "'इतर' निवडल्यास — उद्देश नमूद करा (If 'Other' — specify purpose)", type: "Text" },
];

const OCC_SPEC = [
  { cat: "शेतकरी (Farmer)", steps: [
    { q: "शेतीचा प्रकार (Farming Type) — बहुपर्यायी (multi-select)", opts: O.FARMING_TYPES, type: "Checkbox (multi)" },
    { q: "जमीन क्षेत्र (Land Size)", opts: O.LAND_SIZES },
    { q: COMMON.notes, type: "Text" },
  ]},
  { cat: "शेती + व्यवसाय (Agriculture + Business)", steps: [
    { q: "शेतीचा प्रकार (Farming Type)", opts: O.FARMING_TYPES, type: "Checkbox (multi)" },
    { q: "जमीन क्षेत्र (Land Size)", opts: O.LAND_SIZES },
    { q: "व्यवसाय प्रकार (Business Type)", opts: O.BUSINESS_TYPES },
    { q: "व्यवसायाचे नाव (Business Name) — व्यवसाय प्रकार निवडल्यानंतर दिसते", type: "Text" },
  ]},
  { cat: "कृषी मजूर / शेतमजूर (Farm Labour)", steps: [
    { q: COMMON.place, type: "Text" }, { q: COMMON.notes, type: "Text" },
  ]},
  { cat: "स्वरोजगार (Self Employed)", steps: [
    { q: "कौशल्य / Trade — बहुपर्यायी checkbox grid (multi-select)", opts: O.SELF_EMPLOYED_TYPES, type: "Checkbox (multi)" },
    { q: "'इतर (Other)' निवडल्यास — कौशल्य नमूद करा (specify trade)", type: "Text" },
    { q: COMMON.place, type: "Text" },
    ...loanFlow("self"),
  ]},
  { cat: "व्यवसाय (Business Owner)", steps: [
    { q: "व्यवसाय प्रकार (Business Type) — बहुपर्यायी checkbox grid (multi-select)", opts: O.BUSINESS_TYPES, type: "Checkbox (multi)" },
    { q: "'इतर (Other)' निवडल्यास — व्यवसाय नमूद करा (specify business)", type: "Text" },
    { q: "व्यवसायाचे नाव (Business Name)", type: "Text" },
    { q: "व्यवसायामार्फत रोजगार दिलेल्या व्यक्तींची संख्या (People Employed)", type: "Number" },
    { q: COMMON.place, type: "Text" },
    ...loanFlow("biz"),
  ]},
  { cat: "मानधनधारक पदाधिकारी (Honorarium Based Position)", steps: [
    { q: "पद (Position)", opts: O.HONORARIUM_POSITIONS },
    { q: COMMON.place, type: "Text" },
  ]},
  { cat: "सरकारी कर्मचारी (Government Employee)", steps: [
    { q: "सेवा प्रकार (Service Type)", opts: O.GOVT_SERVICE_TYPES },
    { q: "वर्ग (Class)", opts: O.GOVT_CLASSES },
    { q: "पदनाम (Designation) — निवडलेल्या वर्गानुसार बदलते (depends on Class)", tree: O.GOVT_CLASS_DESIGNATIONS },
    { q: "विभाग / खाते (Department)", type: "Text" },
    { q: COMMON.org, type: "Text" }, { q: COMMON.place, type: "Text" },
  ]},
  { cat: "खाजगी कर्मचारी (Private Employee)", steps: [
    { q: "क्षेत्र (Sector)", opts: O.PRIVATE_SECTORS },
    { q: "पदनाम (Designation)", type: "Text" },
    { q: COMMON.org, type: "Text" }, { q: COMMON.place, type: "Text" },
  ]},
  { cat: "शिक्षण क्षेत्र (Education Sector)", steps: [
    { q: "पायरी 1 — संस्था प्रकार (Institution Type)", opts: O.EDU_INSTITUTION_TYPES },
    { q: "पायरी 2 — संस्था स्तर (Institution Level) — 'University' निवडल्यास फक्त University / Other", opts: [...new Set([...O.EDU_LEVELS_NON_UNIVERSITY, ...O.EDU_LEVELS_UNIVERSITY])] },
    { q: "पायरी 3 — पदनाम (Designation) — संस्था स्तरानुसार बदलते (depends on Level)", tree: O.EDU_DESIGNATIONS_BY_LEVEL },
    { q: "पायरी 4 — संस्थेचे नाव (Institution Name)", type: "Text" },
    { q: "पायरी 5 — कार्यरत ठिकाण (Place of Posting)", type: "Text" },
  ]},
  { cat: "वैद्यकीय क्षेत्र (Medical Sector)", steps: [
    { q: "पायरी 1 — संस्था प्रकार (Institution Type)", opts: O.MED_INSTITUTION_TYPES },
    { q: "पायरी 2 — पदनाम (Designation) — संस्था प्रकारानुसार बदलते", tree: Object.fromEntries(O.MED_INSTITUTION_TYPES.map((t) => [t, O.medDesignationsForType(t)])) },
    { q: "विभाग / युनिट (Department / Unit)", type: "Text" },
    { q: "रुग्णालय / संस्थेचे नाव व कार्यरत ठिकाण (Hospital Name & Place) — सरकारी / खाजगी रुग्णालय, PHC, वैद्यकीय महाविद्यालय यासाठी", type: "Text" },
    { q: "स्वतःचा सेटअप (Own Setup) — नाव, संपूर्ण पत्ता, गाव / शहर, जिल्हा, पिनकोड", type: "Text × 5" },
  ]},
  { cat: "महिला व बाल विकास (Women & Child Development)", steps: [
    { q: "पदनाम (Designation)", opts: O.WCD_DESIGNATIONS },
    { q: COMMON.org, type: "Text" }, { q: COMMON.place, type: "Text" },
  ]},
  { cat: "अभियंता (Engineering Sector)", steps: [
    { q: "पायरी 1 — संस्था प्रकार (Institution Type)", opts: O.ENG_INSTITUTION_TYPES },
    { q: "पायरी 2 — शाखा (Branch)", opts: O.ENG_BRANCHES },
    { q: "पायरी 3 — पदनाम (Designation) — शाखेनुसार बदलते (IT शाखांसाठी वेगळी यादी)", tree: { "IT / Computer / Software / Network शाखा": O.engDesignationsForBranch("IT Engineering (माहिती तंत्रज्ञान)"), "इतर सर्व शाखा (Core branches)": O.engDesignationsForBranch("Civil Engineering (स्थापत्य अभियंता)") } },
    { q: COMMON.org, type: "Text" }, { q: COMMON.place, type: "Text" },
  ]},
  { cat: "बँकिंग व वित्तीय क्षेत्र (Banking & Finance)", steps: [
    { q: "पायरी 1 — बँक / संस्था प्रकार (Bank / Institution Type)", opts: O.BANK_TYPES },
    { q: "पायरी 2 — पदनाम (Designation) — बँक प्रकारानुसार बदलते", tree: O.BANK_DESIGNATIONS_BY_TYPE },
    { q: "बँक / शाखेचे नाव (Bank / Branch Name)", type: "Text" },
    { q: COMMON.place, type: "Text" },
  ]},
  { cat: "न्यायव्यवस्था (Judiciary)", steps: [
    { q: "पदनाम (Designation)", opts: O.JUDICIARY_DESIGNATIONS },
    { q: COMMON.place, type: "Text" },
  ]},
  { cat: "संरक्षण व सुरक्षा सेवा (Defence & Security)", steps: [
    { q: "पायरी 1 — दल (Force)", opts: O.DEFENCE_FORCES },
    { q: "पायरी 2 — हुद्दा (Rank) — दलानुसार बदलते", tree: {
      "भारतीय सैन्य / नौदल / वायुदल (Army / Navy / Air Force)": O.MILITARY_RANKS,
      "महाराष्ट्र पोलीस / SRPF / GRP / RPF (Police)": O.POLICE_RANKS,
      "BSF / CRPF / CISF / ITBP / SSB / Assam Rifles / Coast Guard (CAPFs)": O.CENTRAL_ARMED_FORCES_RANKS,
    } },
    { q: COMMON.place, type: "Text" },
  ]},
  { cat: "निवृत्त / पेन्शनधारक (Retired / Pensioner)", steps: [
    { q: "पूर्वीचा विभाग / सेवा (Retired From)", opts: O.RETIRED_FROM },
    { q: "शेवटचे पदनाम (Last Designation)", type: "Text" },
    { q: COMMON.org, type: "Text" },
  ]},
  { cat: "बेरोजगार (Unemployed)", steps: [
    { q: "1. आपण सध्या नोकरीच्या शोधात आहात का? (Are you currently seeking a job?)", opts: ["होय (Yes)", "नाही (No)"] },
    { q: "2. जर होय — कोणत्या क्षेत्रात रोजगार हवा आहे? (Desired employment sector)", type: "Text" },
    { q: "3. आपल्याला कौशल्य प्रशिक्षण घ्यायचे आहे का? (Do you want skill training?)", opts: ["होय (Yes)", "नाही (No)"] },
    { q: "4. आपल्याला स्वतःचा व्यवसाय सुरू करायचा आहे का? (Do you want to start a business?)", opts: ["होय (Yes)", "नाही (No)"] },
    { q: "5. जर होय — कोणता व्यवसाय? (Which business?)", type: "Text" },
    { q: "6. व्यवसायासाठी कर्जाची आवश्यकता आहे का? (Is a loan required?)", opts: ["होय (Yes)", "नाही (No)"] },
    { q: "7. आवश्यक कर्ज रक्कम (Required Loan Amount)", opts: O.LOAN_AMOUNT_OPTIONS },
    { q: "8. आपल्याला मार्गदर्शनाची अपेक्षा आहे का? (Do you expect guidance?)", opts: ["होय (Yes)", "नाही (No)"] },
  ]},
  { cat: "परदेशस्थ (NRI)", steps: [
    { q: "देश (Country)", type: "Text" },
    { q: "शहर (City)", type: "Text" },
    { q: "पदनाम / व्यवसाय (Designation / Work)", type: "Text" },
    { q: "समाजासाठी योगदान (Contribution to Community) — बहुपर्यायी", opts: O.NRI_CONTRIBUTIONS, type: "Checkbox (multi)" },
  ]},
  { cat: "इतर (Other)", steps: [
    { q: "तपशील नमूद करा (Please specify)", type: "Text" },
  ]},
];

function appendixOccupation() {
  const n = [];
  n.push(H1([
    T("परिशिष्ट 2 (Appendix 2):  ", { bold: true, size: 30, color: C.group }),
    T("नौकरी / व्यवसाय — संपूर्ण तपशील", { bold: true, size: 32, color: C.section }),
    T(" (Job / Occupation — Full Detail)", { size: 28, color: C.group }),
  ]));
  n.push(P([T("फॉर्म प्रवाह (Form flow): ", { bold: true, color: C.note }),
    T("मुख्य श्रेणी (Main Category) → उप-पायऱ्या (Cascading Steps) → तपशील fields", { color: C.label })], { after: 100 }));

  n.push(P([T("पायरी 1 (Step 1): मुख्य श्रेणी (Main Category) ", { bold: true, size: 24, color: C.sub }),
    T("[Dropdown — 19 पर्याय]", { color: C.type, size: 20 })], { before: 60, after: 40 }));
  O.PRIMARY_CATEGORIES.forEach((c) => n.push(optionLine(c)));

  OCC_SPEC.forEach((spec) => {
    n.push(groupHeading(spec.cat));
    spec.steps.forEach((st) => {
      n.push(fieldLine(st.q, st.type || (st.opts ? "Dropdown" : st.tree ? "Dropdown (cascading)" : "Text")));
      (st.opts || []).forEach((op) => n.push(optionLine(op)));
      if (st.tree) {
        Object.entries(st.tree).forEach(([k, list]) => {
          n.push(subHeading(`↳ ${k}`));
          list.forEach((op) => n.push(optionLine(op, 100)));
        });
      }
    });
  });
  return n;
}

// ---------------- COVER + BUILD ----------------
function build() {
  const cover = [
    P([T("कोहळी समाज विकास मंडळ, नागपूर", { bold: true, size: 40, color: C.section })],
      { alignment: AlignmentType.CENTER, before: 900, after: 120 }),
    P([T("कुटुंब सर्वेक्षण फॉर्म — संपूर्ण संरचना", { bold: true, size: 30, color: C.group })],
      { alignment: AlignmentType.CENTER, after: 60 }),
    P([T("Family Survey Form — Complete Field Structure (Marathi with English)", { size: 24, color: C.english })],
      { alignment: AlignmentType.CENTER, after: 260 }),
    P([T("आवृत्ती 2 (Version 2) — शिक्षण व नौकरी / व्यवसाय यांचे सविस्तर परिशिष्ट समाविष्ट", { italics: true, size: 22, color: C.note })],
      { alignment: AlignmentType.CENTER, after: 300 }),

    P([T("रंग संकेत (Colour Key)", { bold: true, size: 26, color: C.section })], { alignment: AlignmentType.CENTER, after: 80 }),
    ...[
      ["विभाग शीर्षक (Section heading)", C.section],
      ["गट / श्रेणी शीर्षक (Group / Category heading)", C.group],
      ["उप-पायरी (Sub-step heading)", C.sub],
      ["फील्ड लेबल (Field label)", C.label],
      ["इंग्रजी अनुवाद (English translation)", C.english],
      ["फील्ड प्रकार (Field type)", C.type],
      ["जर-तर तर्क (Conditional logic)", C.logic],
      ["टीप (Note)", C.note],
    ].map(([txt, col]) => P([T("■  ", { color: col, size: 24 }), T(txt, { color: col, bold: true, size: 21 })],
      { indent: { left: 1800 }, after: 30 })),

    H1([T("अनुक्रमणिका (Table of Contents)", { bold: true, size: 30, color: C.section })]),
    ...sections.map((s) => P([
      T(`विभाग ${s.badge}.  `, { bold: true, color: C.group }),
      ...bilingualRuns(s.title, { color: C.label, enColor: C.english }),
    ], { indent: { left: 320 }, after: 40 })),
    P([T("परिशिष्ट 1.  ", { bold: true, color: C.group }), T("शिक्षण — संपूर्ण तपशील", { color: C.label }), T(" (Education — Full Detail)", { color: C.english })], { indent: { left: 320 }, after: 40 }),
    P([T("परिशिष्ट 2.  ", { bold: true, color: C.group }), T("नौकरी / व्यवसाय — संपूर्ण तपशील", { color: C.label }), T(" (Job / Occupation — Full Detail)", { color: C.english })], { indent: { left: 320 }, after: 40 }),
  ];

  const body = sections.flatMap((s) => renderSection(s));

  return new Document({
    styles: {
      default: { document: { run: { font: FONT, size: 22 } } },
      paragraphStyles: [{
        id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 30, bold: true, font: FONT, color: C.section },
        paragraph: { spacing: { before: 240, after: 140 }, outlineLevel: 0 },
      }],
    },
    sections: [{
      properties: {
        page: {
          size: { width: 12240, height: 15840, orientation: PageOrientation.PORTRAIT },
          margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
        },
      },
      children: [...cover, ...body, ...appendixEducation(), ...appendixOccupation()],
    }],
  });
}

const buf = await Packer.toBuffer(build());
const out = path.join("/mnt/documents", "Kutumb-Survey-Form-Marathi-English-Structure_v2.docx");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, buf);
console.log("Wrote", out, buf.length, "bytes");
