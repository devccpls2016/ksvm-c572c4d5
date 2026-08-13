// संपूर्ण फॉर्म रचना — मराठी (Marathi-only master document)
// विभाग A–I चे सर्व labels + पर्याय + जर-तर तर्क, शिक्षण वृक्ष, नौकरी/व्यवसाय वृक्ष.
//
// Usage: bun scripts/generate-marathi-form-doc.mjs

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  LevelFormat, PageBreak, TableOfContents, BorderStyle,
} from "docx";
import { sections } from "./generate-form-structure-doc.mjs";

const FONT = "Nirmala UI";
const C = {
  primary: "1E3A8A",
  accent: "0F766E",
  amber: "B45309",
  muted: "6B7280",
  text: "1F2937",
};

const T = (text, o = {}) => new TextRun({
  text: String(text), font: FONT, bold: o.bold, italics: o.italics,
  color: o.color || C.text, size: o.size,
});
const P = (runs, o = {}) => new Paragraph({
  spacing: { before: o.before ?? 0, after: o.after ?? 60 },
  indent: o.indent, alignment: o.alignment, border: o.border, children: runs,
});
const Bullet = (text, level = 0, o = {}) => new Paragraph({
  numbering: { reference: "bul", level: Math.min(level, 4) },
  spacing: { after: 20 },
  children: [T(text, o)],
});
const H1 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_1,
  spacing: { before: 240, after: 120 },
  children: [T(text, { bold: true, color: C.primary, size: 32 })],
});
const H2 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  spacing: { before: 200, after: 80 },
  children: [T(text, { bold: true, color: C.accent, size: 26 })],
});
const H3 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_3,
  spacing: { before: 140, after: 60 },
  children: [T(text, { bold: true, color: C.primary, size: 23 })],
});
const Break = () => new Paragraph({ children: [new PageBreak()] });
const mr = (v) => (typeof v === "string" ? v : v.mr);

// ---------------- Part 1: विभाग A–I ----------------
function renderField(f, idx) {
  const out = [];
  out.push(P([
    T(`${idx}. `, { bold: true, color: C.accent }),
    T(mr(f.name), { bold: true, size: 23 }),
  ], { before: 120, after: 20, indent: { left: 200 } }));

  out.push(P([T("प्रकार: ", { bold: true, color: C.primary }), T(mr(f.type))],
    { indent: { left: 460 } }));

  if (f.options?.length) {
    out.push(P([T("पर्याय:", { bold: true, color: C.primary })],
      { indent: { left: 460 }, after: 20 }));
    f.options.forEach((o) => out.push(Bullet(mr(o), 1)));
  }
  if (f.logic?.length) {
    out.push(P([T("जर-तर तर्क:", { bold: true, color: C.amber })],
      { indent: { left: 460 }, before: 40, after: 20 }));
    f.logic.forEach((o) => out.push(Bullet(mr(o), 1, { color: C.amber })));
  }
  return out;
}

function renderSection(s, isFirst) {
  const out = [];
  if (!isFirst) out.push(Break());
  out.push(new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 120, after: 120 },
    children: [
      T(`विभाग ${s.badge}:  `, { bold: true, color: C.accent, size: 28 }),
      T(mr(s.title), { bold: true, color: C.primary, size: 32 }),
    ],
  }));
  s.groups.forEach((g) => {
    out.push(H2(mr(g.title)));
    (g.notes || []).forEach((n) => out.push(P([
      T("टीप: ", { bold: true, color: C.accent }),
      T(mr(n), { italics: true }),
    ], { indent: { left: 260 }, after: 60 })));
    if (!g.fields?.length) {
      out.push(P([T("(या गटात थेट fields नाहीत — वरील टीप पहा.)", { italics: true, color: C.muted })],
        { indent: { left: 260 } }));
    } else {
      g.fields.forEach((f, i) => out.push(...renderField(f, i + 1)));
    }
  });
  return out;
}

// ---------------- Part 2: शिक्षण ----------------
async function educationPart() {
  const edu = await import(pathToFileURL(path.join(process.cwd(), "src/lib/education-data.ts")).href);
  const out = [Break(), H1("भाग २ — शिक्षण (Education) संपूर्ण रचना")];
  out.push(P([T("शिक्षण field तीन टप्प्यांत भरले जाते: शिक्षण स्तर → शाखा / गट → अभ्यासक्रम. लागू असल्यास चौथा टप्पा — संस्था प्रकार. साठवण स्वरूप: “स्तर | शाखा | अभ्यासक्रम | संस्था प्रकार”.", { italics: true, color: C.muted })], { after: 140 }));

  out.push(H2("टप्पा १ — शिक्षण स्तर (सर्व पर्याय)"));
  edu.EDUCATION_TREE.forEach((l) => out.push(Bullet(l.level, 0)));

  out.push(H2("टप्पा ४ — संस्था प्रकार (सर्व पर्याय)"));
  edu.INSTITUTION_TYPES.forEach((t) => out.push(Bullet(t, 0)));

  out.push(H2("टप्पा २ व ३ — प्रत्येक स्तरानुसार शाखा व अभ्यासक्रम"));
  edu.EDUCATION_TREE.forEach((l) => {
    out.push(H3(l.level));
    out.push(P([
      T("संस्था प्रकार विचारला जातो का? ", { bold: true, color: C.primary }),
      T(l.askInstitution ? "होय" : "नाही"),
    ], { indent: { left: 300 }, after: 40 }));
    l.streams.forEach((s) => {
      out.push(Bullet(`शाखा / गट: ${s.stream}`, 0, { bold: true }));
      s.courses.forEach((c) => out.push(Bullet(c, 1)));
    });
  });
  return out;
}

// ---------------- Part 3: नौकरी / व्यवसाय ----------------
async function occupationPart() {
  const o = await import(pathToFileURL(path.join(process.cwd(), "src/lib/occupation-data.ts")).href);
  const out = [Break(), H1("भाग ३ — नौकरी / व्यवसाय (Job / Occupation) संपूर्ण रचना")];
  out.push(P([T("प्रथम मुख्य श्रेणी निवडली जाते; निवडीनुसार पुढील उप-fields दिसतात. खाली प्रत्येक श्रेणीची संपूर्ण साखळी व सर्व पर्याय दिले आहेत.", { italics: true, color: C.muted })], { after: 140 }));

  out.push(H2("टप्पा १ — मुख्य श्रेणी (सर्व पर्याय)"));
  o.PRIMARY_CATEGORIES.forEach((c) => out.push(Bullet(c, 0)));

  const list = (title, arr) => {
    out.push(H3(title));
    arr.forEach((x) => out.push(Bullet(x, 0)));
  };
  const record = (title, rec, keyLabel = "गट") => {
    out.push(H3(title));
    Object.entries(rec).forEach(([k, v]) => {
      out.push(Bullet(`${keyLabel}: ${k}`, 0, { bold: true }));
      (Array.isArray(v) ? v : [String(v)]).forEach((x) => out.push(Bullet(x, 1)));
    });
  };

  out.push(H2("शेतकरी / शेती + व्यवसाय / कृषी मजूर"));
  list("शेतीचा प्रकार (बहु-निवड)", o.FARMING_TYPES);
  list("जमीन धारणा", o.LAND_SIZES);
  out.push(P([T("शेती + व्यवसाय निवडल्यास: व्यवसाय प्रकार (खालील यादी) → व्यवसायाचे नाव (मजकूर).", { color: C.amber })], { indent: { left: 300 } }));

  out.push(H2("स्वरोजगार (Self Employed)"));
  list("कौशल्य / Trade (बहु-निवड, checkbox)", o.SELF_EMPLOYED_TYPES);
  out.push(P([T("‘इतर (Other)’ निवडल्यास — इतर कौशल्य नमूद करा (मजकूर). त्यानंतर: कार्यरत ठिकाण → स्वतःचे दुकान/व्यवसाय सुरू करण्याची इच्छा (होय/नाही) → कर्जाची आवश्यकता (होय/नाही) → आवश्यक कर्ज रक्कम.", { color: C.amber })], { indent: { left: 300 } }));

  out.push(H2("व्यवसाय (Business Owner)"));
  list("व्यवसाय प्रकार (बहु-निवड, checkbox)", o.BUSINESS_TYPES);
  out.push(P([T("त्यानंतर: व्यवसायाचे नाव → कार्यरत ठिकाण → रोजगार दिलेल्या व्यक्तींची संख्या → कर्जाची आवश्यकता (होय/नाही) → कर्ज रक्कम → कर्जाचा उद्देश.", { color: C.amber })], { indent: { left: 300 } }));
  list("कर्ज रक्कम (पर्याय)", o.LOAN_AMOUNT_OPTIONS);
  list("कर्जाचा उद्देश (पर्याय)", o.LOAN_PURPOSE_OPTIONS);

  out.push(H2("मानधनधारक पदाधिकारी"));
  list("पद", o.HONORARIUM_POSITIONS);

  out.push(H2("सरकारी कर्मचारी"));
  list("सेवा प्रकार", o.GOVT_SERVICE_TYPES);
  list("वर्ग (Class)", o.GOVT_CLASSES);
  record("वर्गानुसार पदनाम", o.GOVT_CLASS_DESIGNATIONS, "वर्ग");

  out.push(H2("खाजगी कर्मचारी"));
  list("क्षेत्र (Sector)", o.PRIVATE_SECTORS);

  out.push(H2("शिक्षण क्षेत्र"));
  list("टप्पा १ — संस्था प्रकार", o.EDU_INSTITUTION_TYPES);
  list("टप्पा २ — संस्था स्तर (विद्यापीठ वगळता)", o.EDU_LEVELS_NON_UNIVERSITY);
  list("टप्पा २ — संस्था स्तर (विद्यापीठ प्रकार निवडल्यास)", o.EDU_LEVELS_UNIVERSITY);
  record("टप्पा ३ — स्तरानुसार पदनाम", o.EDU_DESIGNATIONS_BY_LEVEL, "स्तर");
  out.push(P([T("टप्पा ४ — संस्थेचे नाव (मजकूर), टप्पा ५ — कार्यरत ठिकाण (मजकूर).", { color: C.amber })], { indent: { left: 300 } }));

  out.push(H2("वैद्यकीय क्षेत्र"));
  list("संस्था प्रकार", o.MED_INSTITUTION_TYPES);
  list("रुग्णालय प्रकार", o.MED_HOSPITAL_TYPES);
  list("पदनाम", o.MED_DESIGNATIONS);
  list("पदनाम — महिला व बाल विकास", o.WCD_DESIGNATIONS);
  out.push(P([T("स्वतःचा Setup निवडल्यास: Setup नाव, विभाग, संपूर्ण पत्ता, शहर, जिल्हा, पिनकोड.", { color: C.amber })], { indent: { left: 300 } }));

  out.push(H2("अभियंता (Engineering)"));
  list("संस्था प्रकार", o.ENG_INSTITUTION_TYPES);
  list("शाखा", o.ENG_BRANCHES);
  list("पदनाम", o.ENG_DESIGNATIONS);

  out.push(H2("बँकिंग व वित्तीय क्षेत्र"));
  list("संस्था प्रकार", o.BANK_TYPES);
  record("संस्था प्रकारानुसार पदनाम", o.BANK_DESIGNATIONS_BY_TYPE, "संस्था प्रकार");

  out.push(H2("न्यायव्यवस्था"));
  list("पदनाम", o.JUDICIARY_DESIGNATIONS);

  out.push(H2("संरक्षण व सुरक्षा सेवा"));
  list("दल (Force)", o.DEFENCE_FORCES);
  list("रँक — सैन्य दल", o.MILITARY_RANKS);
  list("रँक — केंद्रीय सशस्त्र दल (CAPF)", o.CENTRAL_ARMED_FORCES_RANKS);
  list("रँक — पोलीस", o.POLICE_RANKS);

  out.push(H2("निवृत्त / पेन्शनधारक"));
  list("पूर्वीचा विभाग", o.RETIRED_FROM);

  out.push(H2("बेरोजगार"));
  [
    "रोजगाराच्या शोधात आहात का? (होय / नाही)",
    "इच्छित क्षेत्र (मजकूर / निवड)",
    "कौशल्य प्रशिक्षण घेण्याची इच्छा आहे का? (होय / नाही)",
    "इच्छित व्यवसाय (मजकूर)",
    "व्यवसायासाठी कर्जाची आवश्यकता आहे का? (होय / नाही)",
    "आवश्यक कर्ज रक्कम",
    "स्पर्धा परीक्षेची तयारी करत आहात का? (होय / नाही)",
    "मार्गदर्शनाची इच्छा आहे का? (होय / नाही)",
  ].forEach((x) => out.push(Bullet(x, 0)));

  out.push(H2("परदेशस्थ (NRI)"));
  ["देश (मजकूर)", "शहर (मजकूर)", "कार्यरत संस्था (मजकूर)"].forEach((x) => out.push(Bullet(x, 0)));
  list("समाजासाठी योगदान (बहु-निवड)", o.NRI_CONTRIBUTIONS);

  out.push(H2("सर्व श्रेणींसाठी सामायिक fields"));
  ["कंपनी / संस्था / रुग्णालयाचे नाव (मजकूर)", "कार्यरत ठिकाण (मजकूर)", "इतर तपशील (मजकूर)"]
    .forEach((x) => out.push(Bullet(x, 0)));

  return out;
}

async function main() {
  const cover = [
    P([T("कोहळी समाज विकास मंडळ, नागपूर", { bold: true, color: C.primary, size: 40 })],
      { alignment: AlignmentType.CENTER, before: 1200, after: 120 }),
    P([T("कुटुंब सर्वेक्षण फॉर्म — संपूर्ण मराठी रचना", { bold: true, color: C.accent, size: 32 })],
      { alignment: AlignmentType.CENTER, after: 80 }),
    P([T("प्रत्येक field, त्याचे label, सर्व पर्याय व जर-तर तर्क", { color: C.muted, size: 24 })],
      { alignment: AlignmentType.CENTER, after: 240 }),
    P([T(`दिनांक: ${new Date().toLocaleDateString("mr-IN")}`, { color: C.muted })],
      { alignment: AlignmentType.CENTER, after: 60,
        border: { top: { style: BorderStyle.SINGLE, size: 6, color: C.primary, space: 6 } } }),
    Break(),
    H1("अनुक्रमणिका"),
    new TableOfContents("अनुक्रमणिका", { hyperlink: true, headingStyleRange: "1-3" }),
    Break(),
    H1("भाग १ — फॉर्मचे विभाग (A–I)"),
    P([T("खालील क्रमाने फॉर्म भरला जातो. * चिन्ह असलेली fields अनिवार्य आहेत.", { italics: true, color: C.muted })], { after: 120 }),
  ];

  const body = [];
  sections.forEach((s, i) => body.push(...renderSection(s, i === 0)));

  const doc = new Document({
    styles: {
      default: { document: { run: { font: FONT, size: 22, color: C.text } } },
      paragraphStyles: [
        { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 32, bold: true, font: FONT, color: C.primary },
          paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 0 } },
        { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 26, bold: true, font: FONT, color: C.accent },
          paragraph: { spacing: { before: 200, after: 80 }, outlineLevel: 1 } },
        { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 23, bold: true, font: FONT, color: C.primary },
          paragraph: { spacing: { before: 140, after: 60 }, outlineLevel: 2 } },
      ],
    },
    numbering: {
      config: [{
        reference: "bul",
        levels: [0, 1, 2, 3, 4].map((level) => ({
          level, format: LevelFormat.BULLET,
          text: ["•", "◦", "▪", "–", "·"][level],
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720 + level * 360, hanging: 280 } } },
        })),
      }],
    },
    sections: [{
      properties: {
        page: { size: { width: 12240, height: 15840 }, margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 } },
      },
      children: [
        ...cover,
        ...body,
        ...(await educationPart()),
        ...(await occupationPart()),
      ],
    }],
  });

  const outPath = path.join("/mnt/documents", "Kutumb-Survey-Form-Marathi-Structure.docx");
  fs.writeFileSync(outPath, await Packer.toBuffer(doc));
  console.log("wrote", outPath);
}

main();
