// Generates ONE complete end-to-end Survey Form structure document
// (bilingual Marathi + English) into /mnt/documents/.
//
// Usage: bun scripts/generate-complete-doc.mjs

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  PageOrientation, LevelFormat, PageBreak, TableOfContents,
} from "docx";
import { sections } from "./generate-form-structure-doc.mjs";

const FONT = "Nirmala UI";
const C = {
  primary: "1E3A8A",
  accent: "0F766E",
  amber: "B45309",
  muted: "6B7280",
  text: "1F2937",
  en: "374151",
};

const T = (text, o = {}) => new TextRun({
  text, font: FONT, bold: o.bold, italics: o.italics,
  color: o.color || C.text, size: o.size,
});
const P = (runs, o = {}) => new Paragraph({
  spacing: { before: o.before ?? 0, after: o.after ?? 60 },
  indent: o.indent, alignment: o.alignment, children: runs,
});
const Bullet = (text, level = 0, o = {}) => new Paragraph({
  numbering: { reference: "bul", level },
  spacing: { after: 30 },
  children: [T(text, o)],
});
const H = (text, level, color) => new Paragraph({
  heading: level,
  spacing: { before: 240, after: 120 },
  children: [T(text, { bold: true, color: color || C.primary })],
});

const pick = (v, lang) => (typeof v === "string" ? v : v[lang]);
const both = (v) => (typeof v === "string" ? v : `${v.mr}  |  ${v.en}`);

// ---------- Part 1: full bilingual section walk ----------
function renderField(f, idx) {
  const out = [];
  out.push(P([
    T(`${idx}. `, { bold: true, color: C.accent }),
    T(pick(f.name, "mr"), { bold: true, size: 24 }),
    T(`   /   ${pick(f.name, "en")}`, { bold: true, color: C.en, size: 22 }),
  ], { before: 120, after: 30, indent: { left: 200 } }));

  out.push(P([
    T("प्रकार / Type: ", { bold: true, color: C.primary }),
    T(both(f.type)),
  ], { indent: { left: 460 } }));

  if (f.options?.length) {
    out.push(P([T("पर्याय / Options:", { bold: true, color: C.primary })],
      { indent: { left: 460 }, after: 20 }));
    f.options.forEach((o) => out.push(Bullet(both(o), 1)));
  }
  if (f.logic?.length) {
    out.push(P([T("जर-तर तर्क / Conditional Logic:", { bold: true, color: C.amber })],
      { indent: { left: 460 }, before: 40, after: 20 }));
    f.logic.forEach((o) => out.push(Bullet(both(o), 1, { color: C.amber })));
  }
  return out;
}

function renderSection(s, isFirst) {
  const out = [];
  if (!isFirst) out.push(new Paragraph({ children: [new PageBreak()] }));
  out.push(new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 160, after: 120 },
    children: [
      T(`विभाग ${s.badge} / Section ${s.badge}:  `, { bold: true, color: C.accent, size: 28 }),
      T(pick(s.title, "mr"), { bold: true, color: C.primary, size: 32 }),
      T(`  /  ${pick(s.title, "en")}`, { bold: true, color: C.en, size: 26 }),
    ],
  }));
  s.groups.forEach((g) => {
    out.push(new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 60 },
      children: [
        T(pick(g.title, "mr"), { bold: true, color: C.accent, size: 26 }),
        T(`  /  ${pick(g.title, "en")}`, { bold: true, color: C.en, size: 22 }),
      ],
    }));
    (g.notes || []).forEach((n) => out.push(P([
      T("टीप / Note: ", { bold: true, color: C.accent }),
      T(both(n), { italics: true }),
    ], { indent: { left: 260 }, after: 60 })));
    if (!g.fields?.length) {
      out.push(P([T("(थेट fields नाहीत / No direct fields — see notes.)", { italics: true, color: C.muted })],
        { indent: { left: 260 } }));
    } else {
      g.fields.forEach((f, i) => out.push(...renderField(f, i + 1)));
    }
  });
  return out;
}

// ---------- Part 2 & 3: appendix dumps of cascading data trees ----------
const titleize = (k) => k
  .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
  .replace(/_/g, " ")
  .toLowerCase()
  .replace(/\b\w/g, (m) => m.toUpperCase());

function dumpValue(key, value, out) {
  if (Array.isArray(value)) {
    out.push(H(titleize(key), HeadingLevel.HEADING_3, C.accent));
    value.forEach((v) => {
      if (typeof v === "string") out.push(Bullet(v, 0));
      else if (v && typeof v === "object") dumpNode(v, out, 0);
    });
  } else if (value && typeof value === "object") {
    out.push(H(titleize(key), HeadingLevel.HEADING_3, C.accent));
    for (const [k, v] of Object.entries(value)) {
      out.push(P([T(k, { bold: true, color: C.primary })], { before: 80, after: 20, indent: { left: 200 } }));
      if (Array.isArray(v)) v.forEach((x) => out.push(Bullet(typeof x === "string" ? x : JSON.stringify(x), 1)));
      else if (v && typeof v === "object") dumpNode(v, out, 1);
      else out.push(Bullet(String(v), 1));
    }
  }
}

function dumpNode(node, out, level) {
  const label = node.label || node.name || node.value || node.title
    || node.level || node.stream || node.force || node.category || node.type || "(item)";
  out.push(Bullet(String(label), level, { bold: level === 0 }));
  for (const [k, v] of Object.entries(node)) {
    if (["label", "name", "value", "title", "level", "stream", "force", "category", "type"].includes(k)) continue;
    if (Array.isArray(v) && v.length) {
      if (typeof v[0] === "string") {
        out.push(Bullet(`${titleize(k)}: ${v.join(", ")}`, Math.min(level + 1, 4), { color: C.muted }));
      } else {
        out.push(Bullet(`${titleize(k)} →`, Math.min(level + 1, 4), { color: C.muted }));
        v.forEach((c) => dumpNode(c, out, Math.min(level + 2, 4)));
      }
    } else if (v && typeof v === "object") {
      out.push(Bullet(`${titleize(k)} →`, Math.min(level + 1, 4), { color: C.muted }));
      for (const [kk, vv] of Object.entries(v)) {
        out.push(Bullet(`${kk}: ${Array.isArray(vv) ? vv.join(", ") : String(vv)}`, Math.min(level + 2, 4)));
      }
    } else if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
      out.push(Bullet(`${titleize(k)}: ${v}`, Math.min(level + 1, 4), { color: C.muted }));
    }
  }
}

async function appendixFromModule(relPath, heading, intro) {
  const mod = await import(pathToFileURL(path.join(process.cwd(), relPath)).href);
  const out = [];
  out.push(new Paragraph({ children: [new PageBreak()] }));
  out.push(H(heading, HeadingLevel.HEADING_1));
  out.push(P([T(intro, { italics: true, color: C.muted })], { after: 120 }));
  for (const [key, value] of Object.entries(mod)) {
    if (typeof value === "function") continue;
    dumpValue(key, value, out);
  }
  return out;
}

async function main() {
  const cover = [
    P([T("कोहळी समाज विकास मंडळ, नागपूर", { bold: true, color: C.primary, size: 40 })],
      { alignment: AlignmentType.CENTER, before: 900, after: 100 }),
    P([T("Kohli Samaj Vikas Mandal, Nagpur", { bold: true, color: C.en, size: 26 })],
      { alignment: AlignmentType.CENTER, after: 200 }),
    P([T("कुटुंब सर्वेक्षण — संपूर्ण फॉर्म संरचना (End-to-End)", { bold: true, color: C.accent, size: 32 })],
      { alignment: AlignmentType.CENTER, after: 80 }),
    P([T("Family Survey — Complete End-to-End Form Structure", { bold: true, color: C.en, size: 26 })],
      { alignment: AlignmentType.CENTER, after: 240 }),
    P([T("प्रत्येक विभाग, field, पर्याय व जर-तर तर्क — मराठी + English एकत्र, तसेच शिक्षण आणि नौकरी/व्यवसाय यांच्या संपूर्ण cascading याद्या परिशिष्टात.", { italics: true, color: C.muted, size: 22 })],
      { alignment: AlignmentType.CENTER, after: 60 }),
    P([T("Every section, field, option and conditional rule — bilingual, with full cascading Education and Occupation trees in the appendices.", { italics: true, color: C.muted, size: 20 })],
      { alignment: AlignmentType.CENTER, after: 200 }),
    P([T(`Generated: ${new Date().toISOString().slice(0, 10)}`, { color: C.muted, size: 18 })],
      { alignment: AlignmentType.CENTER }),
    new Paragraph({ children: [new PageBreak()] }),
    H("अनुक्रमणिका / Table of Contents", HeadingLevel.HEADING_1),
    new TableOfContents("Contents", { hyperlink: true, headingStyleRange: "1-2" }),
    new Paragraph({ children: [new PageBreak()] }),
  ];

  const part1 = [
    H("Part 1 — फॉर्म विभाग / Form Sections (A–I)", HeadingLevel.HEADING_1),
    ...sections.flatMap((s, i) => renderSection(s, i === 0)),
  ];

  const eduAppendix = await appendixFromModule(
    "src/lib/education-data.ts",
    "Part 2 — परिशिष्ट अ: शिक्षण संपूर्ण रचना / Appendix A: Education Complete Tree",
    "शिक्षण स्तर → शाखा / गट → अभ्यासक्रम — प्रत्येक निवडीवर उघडणारे पुढील पर्याय. / Education level → stream → course cascade: every option that opens on each selection.",
  );

  const occAppendix = await appendixFromModule(
    "src/lib/occupation-data.ts",
    "Part 3 — परिशिष्ट ब: नौकरी / व्यवसाय संपूर्ण रचना / Appendix B: Job / Occupation Complete Tree",
    "मुख्य प्रवर्ग → उपप्रकार → पदनाम → अतिरिक्त fields (कर्ज, स्थळ, संस्थेचे नाव इ.). / Primary category → sub-type → designation → dependent fields (loan, posting, organisation name, etc.).",
  );

  const doc = new Document({
    numbering: {
      config: [{
        reference: "bul",
        levels: [0, 1, 2, 3, 4].map((level) => ({
          level, format: LevelFormat.BULLET,
          text: ["•", "◦", "▪", "-", "·"][level],
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720 + level * 360, hanging: 300 } } },
        })),
      }],
    },
    styles: {
      default: { document: { run: { font: FONT, size: 22 } } },
      paragraphStyles: [
        { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 32, bold: true, font: FONT, color: C.primary },
          paragraph: { spacing: { before: 240, after: 140 }, outlineLevel: 0 } },
        { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 27, bold: true, font: FONT, color: C.accent },
          paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 1 } },
        { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 24, bold: true, font: FONT, color: C.accent },
          paragraph: { spacing: { before: 160, after: 80 }, outlineLevel: 2 } },
      ],
    },
    sections: [{
      properties: {
        page: {
          size: { width: 12240, height: 15840, orientation: PageOrientation.PORTRAIT },
          margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
        },
      },
      children: [...cover, ...part1, ...eduAppendix, ...occAppendix],
    }],
  });

  const buf = await Packer.toBuffer(doc);
  const outPath = "/mnt/documents/Survey-Form-Complete-End-to-End-Structure.docx";
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, buf);
  console.log("Wrote", outPath, buf.length, "bytes");
}

await main();
