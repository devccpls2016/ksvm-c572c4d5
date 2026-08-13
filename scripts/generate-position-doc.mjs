// Generates a detailed Word doc for Section D — धारण केलेले पद (Positions Held)
// with the full cascading structure, every field, option and conditional rule.
// Usage: bun scripts/generate-position-doc.mjs

import fs from "node:fs";
import path from "node:path";
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  PageOrientation, LevelFormat, PageBreak, BorderStyle,
} from "docx";
import {
  POSITION_TYPES, POSITION_STATUS, POLITICAL_LEVELS, REPRESENTATIVES,
  SOCIAL_ORGS, REPRESENTATIVE_ROLES,
} from "../src/lib/marathi.ts";

const FONT = "Nirmala UI";
const C = {
  primary: "1E3A8A",   // sections
  accent: "0F766E",    // groups / options
  violet: "6D28D9",    // steps
  amber: "B45309",      // logic
  muted: "6B7280",
  text: "111827",
  en: "1D4ED8",
};

const POLITICAL_PARTIES = [
  "भारतीय जनता पक्ष (BJP)",
  "भारतीय राष्ट्रीय काँग्रेस (INC)",
  "राष्ट्रवादी काँग्रेस पक्ष (NCP)",
  "राष्ट्रवादी काँग्रेस पक्ष (शरदचंद्र पवार)",
  "शिवसेना",
  "शिवसेना (उद्धव बाळासाहेब ठाकरे)",
  "महाराष्ट्र नवनिर्माण सेना (MNS)",
  "अपक्ष (Independent)",
  "इतर (Other)",
];
const YEARS = "१९५० ते २०५० (1950 – 2050, dropdown)";

const T = (text, o = {}) => new TextRun({
  text: String(text), font: FONT, bold: o.bold, italics: o.italics,
  color: o.color || C.text, size: o.size ?? 22,
});
const P = (runs, o = {}) => new Paragraph({
  children: runs, alignment: o.alignment, indent: o.indent,
  spacing: { before: o.before ?? 0, after: o.after ?? 60 },
  border: o.border, pageBreakBefore: o.pageBreakBefore,
});
const B = (text, level = 0, o = {}) => new Paragraph({
  numbering: { reference: "bul", level: Math.min(level, 4) },
  spacing: { after: o.after ?? 30 },
  children: [T(text, o)],
});
const H1 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_1, spacing: { before: 260, after: 140 },
  pageBreakBefore: !!text.__break,
  children: [T(text, { bold: true, size: 30, color: C.primary })],
});
const H2 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_2, spacing: { before: 220, after: 90 },
  border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "D1D5DB", space: 3 } },
  children: [T(text, { bold: true, size: 26, color: C.accent })],
});
const H3 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_3, spacing: { before: 180, after: 70 },
  children: [T(text, { bold: true, size: 23, color: C.violet })],
});
const Field = (mr, en, type, o = {}) => P([
  T("•  ", { bold: true, color: C.accent, size: 24 }),
  T(mr, { bold: true, size: 23 }),
  ...(en ? [T(` (${en})`, { color: C.en, size: 21 })] : []),
  ...(type ? [T(`   [${type}]`, { color: C.muted, size: 20 })] : []),
], { indent: { left: o.left ?? 360, hanging: 200 }, before: 90, after: 30 });
const Opt = (text, left = 900) => P([
  T("◦  ", { color: C.muted }),
  T(text, { size: 21 }),
], { indent: { left, hanging: 200 }, after: 18 });
const Logic = (text, left = 700) => P([
  T("↳ ", { bold: true, color: C.amber }),
  T(text, { italics: true, color: C.amber, size: 20 }),
], { indent: { left, hanging: 220 }, before: 30, after: 30 });
const Br = () => new Paragraph({ children: [new PageBreak()] });

const nodes = [];

// ---------- Cover ----------
nodes.push(
  P([T("कोहळी समाज विकास मंडळ, नागपूर", { bold: true, size: 40, color: C.primary })],
    { alignment: AlignmentType.CENTER, before: 900, after: 120 }),
  P([T("विभाग D — धारण केलेले पद", { bold: true, size: 34, color: C.accent })],
    { alignment: AlignmentType.CENTER, after: 60 }),
  P([T("Section D — Positions Held (राजकीय, सामाजिक, लोकप्रतिनिधी)", { size: 24, color: C.en })],
    { alignment: AlignmentType.CENTER, after: 300 }),
  P([T("संपूर्ण cascading रचना — प्रत्येक field, प्रत्येक पर्याय व प्रत्येक जर-तर नियम", { italics: true, size: 22 })],
    { alignment: AlignmentType.CENTER, after: 40 }),
  P([T("Complete cascading structure — every field, option and conditional rule", { italics: true, size: 20, color: C.muted })],
    { alignment: AlignmentType.CENTER, after: 200 }),
  P([T(`Generated: ${new Date().toISOString().slice(0, 10)}`, { color: C.muted, size: 18 })],
    { alignment: AlignmentType.CENTER }),
  Br(),
);

// ---------- 1. Overview ----------
nodes.push(H1("१. रचना आढावा (Structure Overview)"));
nodes.push(P([T("हा विभाग कुटुंबातील एक किंवा अनेक व्यक्तींची पदे नोंदवतो. प्रत्येक पद एक स्वतंत्र नोंद (entry) असते, जी dialog मध्ये भरून यादीत जतन होते आणि नंतर संपादित / हटवता येते.", { size: 21 })], { after: 40 }));
nodes.push(P([T("This section records one or many positions held by household persons. Each position is a separate entry created in a dialog, saved to a list, and later editable / deletable.", { size: 20, color: C.muted })], { after: 100 }));

nodes.push(H3("प्रवाह (Flow)"));
[
  "पायरी 1 — कुटुंबातील कोणी धारण केलेले पद आहे का?  (होय / नाही)",
  "पायरी 2 — \"होय\" असल्यास पदांची यादी दिसते + \"पद जोडा\" बटण",
  "पायरी 3 — dialog: व्यक्तीचे नाव → पदाचा प्रकार → वर्तमान स्थिती",
  "पायरी 4 — पदाच्या प्रकारानुसार cascading उप-fields (राजकीय / सामाजिक / लोकप्रतिनिधी)",
  "पायरी 5 — \"पद जतन करा\" → नोंद यादीत जोडली जाते (संपादित करा / हटवा उपलब्ध)",
].forEach((s) => nodes.push(B(s, 0, { size: 21 })));

// ---------- 2. Root ----------
nodes.push(H1("२. मूळ प्रश्न (Root Question)"));
nodes.push(Field("कुटुंबातील कोणी धारण केलेले पद आहे का?", "Does anyone in the family hold a position?", "Radio (होय / नाही)"));
nodes.push(Opt("होय (Yes)"));
nodes.push(Opt("नाही (No)"));
nodes.push(Logic("जर \"होय\" → पदांची यादी व \"पद जोडा\" बटण दिसते. जर \"नाही\" → संपूर्ण यादी रिकामी केली जाते (positions = []).", 500));
nodes.push(P([T("यादी रिकामी असल्यास संदेश: \"अजून कोणतेही पद जोडलेले नाही. खालील बटणावर क्लिक करून जोडा.\"", { italics: true, color: C.muted, size: 20 })], { indent: { left: 500 }, after: 40 }));

// ---------- 3. Common fields ----------
nodes.push(H1("३. प्रत्येक पद नोंदीतील समान fields (Common Fields in Every Entry)"));

nodes.push(Field("व्यक्तीचे नाव *", "Person Name", "Dropdown (आवश्यक)"));
nodes.push(Opt("कुटुंब प्रमुखाचे नाव + \" (कुटुंब प्रमुख)\" — Section A मधून स्वयंचलित"));
nodes.push(Opt("प्रत्येक कुटुंब सदस्याचे नाव + \" (नाते)\" — Section C मधून स्वयंचलित"));
nodes.push(Logic("नावे भरलेली नसल्यास सूचना: \"कृपया आधी कुटुंब प्रमुख किंवा सदस्य जोडा.\"", 700));
nodes.push(Logic("जतन करताना व्यक्ती निवडली नसेल तर त्रुटी: \"कृपया व्यक्ती निवडा\".", 700));

nodes.push(Field("पदाचा प्रकार *", "Position Type", "Dropdown (आवश्यक)"));
POSITION_TYPES.forEach((t) => nodes.push(Opt(t)));
nodes.push(Logic("प्रकार बदलल्यास खालील सर्व अवलंबित fields रिकामी होतात: राजकीय पद, लोकप्रतिनिधी पद, पद, संस्थेचे नाव, संस्था, सामाजिक पद.", 700));
nodes.push(Logic("प्रकार निवडला नसेल तर जतन करताना त्रुटी: \"कृपया पदाचा प्रकार निवडा\".", 700));

nodes.push(Field("वर्तमान स्थिती", "Current Status", "Dropdown"));
POSITION_STATUS.forEach((t) => nodes.push(Opt(`${t} ${t === "आजी" ? "(Current)" : "(Former)"}`)));

// ---------- 4. Branch: राजकीय ----------
nodes.push(H1("४. शाखा A — पदाचा प्रकार = राजकीय (Political)"));
nodes.push(Field("राजकीय पद", "Political Post Level", "Dropdown"));
POLITICAL_LEVELS.forEach((t) => nodes.push(Opt(t)));
nodes.push(Field("पक्षाचे नाव", "Party Name", "Text input (मुक्त लेखन)"));
nodes.push(Logic("राजकीय शाखेत पक्षाचे नाव मुक्त text म्हणून भरले जाते (dropdown नाही).", 500));

// ---------- 5. Branch: सामाजिक ----------
nodes.push(H1("५. शाखा B — पदाचा प्रकार = सामाजिक (Social)"));
nodes.push(Field("संस्था", "Organisation", "Dropdown"));
SOCIAL_ORGS.forEach((s) => nodes.push(Opt(s.name)));
nodes.push(Logic("संस्था निवडल्यानंतरच \"पद\" dropdown दिसते; संस्था बदलल्यास पद रिकामे होते.", 500));
SOCIAL_ORGS.forEach((s) => {
  nodes.push(H3(`${s.name} → पद (Role)`));
  s.roles.forEach((r) => nodes.push(Opt(r, 700)));
});

// ---------- 6. Branch: लोकप्रतिनिधी ----------
nodes.push(Br());
nodes.push(H1("६. शाखा C — पदाचा प्रकार = लोकप्रतिनिधी (Public Representative)"));
nodes.push(Field("लोकप्रतिनिधी पद", "Representative Body / Post", "Dropdown"));
REPRESENTATIVES.forEach((t) => nodes.push(Opt(t)));
nodes.push(Logic("निवडलेल्या पदानुसार \"पद\" (role) dropdown ची यादी बदलते. पद बदलल्यास role रिकामे होते.", 500));

nodes.push(H2("६.१ प्रत्येक लोकप्रतिनिधी पदासाठी उपलब्ध \"पद\" (Cascading Roles)"));
REPRESENTATIVES.forEach((r) => {
  const roles = REPRESENTATIVE_ROLES[r] || [];
  nodes.push(H3(`${r} → पद`));
  roles.forEach((x) => nodes.push(Opt(x, 700)));
  if (["Co-operative Bank (सहकारी बँक)", "Co-operative Society (सहकारी संस्था)", "पतसंस्था"].includes(r)) {
    nodes.push(Logic(
      r === "पतसंस्था"
        ? "अतिरिक्त field: पतसंस्थेचे नाव (Credit Society Name) — Text input"
        : "अतिरिक्त field: संस्थेचे नाव (Organisation Name) — Text input",
      700,
    ));
  }
});

nodes.push(H2("६.२ पद (role) निवडल्यानंतर उघडणारे अतिरिक्त गट"));
nodes.push(H3("१. कार्यकाळ (Period)"));
nodes.push(Field("वर्ष (पासून)", "Year From", "Dropdown", { left: 700 }));
nodes.push(Opt(YEARS, 1000));
nodes.push(Field("वर्ष (पर्यंत)", "Year To", "Dropdown", { left: 700 }));
nodes.push(Opt(YEARS, 1000));

nodes.push(H3("२. पक्ष (Political Party)"));
nodes.push(Field("पक्षाचे नाव", "Party Name", "Dropdown", { left: 700 }));
POLITICAL_PARTIES.forEach((p) => nodes.push(Opt(p, 1000)));
nodes.push(Logic("जर \"इतर (Other)\" → अतिरिक्त field: पक्षाचे नाव लिहा (Text input). इतर पर्याय निवडल्यास हे field रिकामे होते.", 900));

// ---------- 7. Saved entry card ----------
nodes.push(Br());
nodes.push(H1("७. जतन केलेली नोंद (Saved Entry Card)"));
nodes.push(P([T("प्रत्येक जतन केलेली नोंद यादीत card स्वरूपात दिसते:", { size: 21 })], { after: 40 }));
[
  "व्यक्तीचे नाव — ठळक शीर्षक",
  "तपशील ओळ — पदाचा प्रकार · वर्तमान स्थिती · राजकीय पद · लोकप्रतिनिधी पद · पद · संस्था · सामाजिक पद (उपलब्ध तेवढेच, \" · \" ने जोडून)",
  "कार्यकाळ: वर्ष (पासून) — वर्ष (पर्यंत)  (कोणतेही एक भरले असल्यास दिसते)",
  "पक्ष: निवडलेला पक्ष, किंवा \"इतर\" असल्यास लिहिलेले नाव",
  "संस्था: संस्थेचे / पतसंस्थेचे नाव (भरले असल्यास)",
  "क्रिया: संपादित करा (dialog पुन्हा उघडते) · हटवा (नोंद यादीतून काढते)",
].forEach((s) => nodes.push(B(s, 0, { size: 21 })));
nodes.push(Logic("शेवटची नोंद हटवल्यास \"धारण केलेले पद आहे का?\" स्वयंचलित \"नाही\" होते.", 500));
nodes.push(Logic("Dialog मधील बटणे: रद्द करा (Cancel) · पद जतन करा (Save Position). जतनानंतर संदेश: \"पद जोडले\" / \"पद अद्यतनित\".", 500));

// ---------- 8. Data schema ----------
nodes.push(H1("८. साठवलेली माहिती रचना (Stored Data Schema)"));
nodes.push(P([T("surveys.has_position — boolean  |  surveys.position_data — JSON { positions: [ … ] }", { size: 21, color: C.muted })], { after: 60 }));
[
  ["person_name", "व्यक्तीचे नाव", "text"],
  ["type", "पदाचा प्रकार", "text (राजकीय / सामाजिक / लोकप्रतिनिधी)"],
  ["status", "वर्तमान स्थिती", "text (आजी / माजी)"],
  ["political_level", "राजकीय पद", "text"],
  ["party_name", "पक्षाचे नाव", "text"],
  ["party_name_other", "पक्षाचे नाव (इतर)", "text"],
  ["term_from", "कार्यकाळ पासून", "text (वर्ष)"],
  ["term_to", "कार्यकाळ पर्यंत", "text (वर्ष)"],
  ["representative_type", "लोकप्रतिनिधी पद", "text"],
  ["coop_role", "पद (role)", "text"],
  ["coop_org_name", "संस्थेचे / पतसंस्थेचे नाव", "text"],
  ["social_org", "सामाजिक संस्था", "text"],
  ["social_role", "सामाजिक पद", "text"],
].forEach(([k, mr, t]) => nodes.push(B(`${k}  —  ${mr}  —  ${t}`, 0, { size: 21, color: C.text })));

const doc = new Document({
  numbering: {
    config: [{
      reference: "bul",
      levels: [0, 1, 2, 3, 4].map((level) => ({
        level, format: LevelFormat.BULLET,
        text: ["•", "◦", "▪", "-", "·"][level],
        alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 520 + level * 320, hanging: 280 } } },
      })),
    }],
  },
  styles: {
    default: { document: { run: { font: FONT, size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 30, bold: true, font: FONT, color: C.primary },
        paragraph: { spacing: { before: 260, after: 140 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: FONT, color: C.accent },
        paragraph: { spacing: { before: 220, after: 90 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 23, bold: true, font: FONT, color: C.violet },
        paragraph: { spacing: { before: 180, after: 70 }, outlineLevel: 2 } },
    ],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840, orientation: PageOrientation.PORTRAIT },
        margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
      },
    },
    children: nodes,
  }],
});

const buf = await Packer.toBuffer(doc);
const out = "/mnt/documents/Section-D-Dharan-Kelele-Pad-Complete-Structure.docx";
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, buf);
console.log("Wrote", out, buf.length, "bytes");
