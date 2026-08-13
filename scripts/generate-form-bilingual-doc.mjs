// Generates ONE professional Word file with the ENTIRE survey form
// in Marathi, with the English equivalent in brackets, for every
// section, group, field label, field type and option.
//
// Style:
//   लिंग (Gender)  [Dropdown]
//     ◦ पुरुष (Male)
//
// Usage: node scripts/generate-form-bilingual-doc.mjs

import fs from "node:fs";
import path from "node:path";
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  PageOrientation, PageBreak, BorderStyle,
} from "docx";
import { sections } from "./generate-form-structure-doc.mjs";

const C = {
  primary: "1E3A8A",
  accent: "0F766E",
  amber: "B45309",
  muted: "6B7280",
  text: "1F2937",
  light: "9CA3AF",
};

const FONT = "Nirmala UI";

const T = (text, o = {}) => new TextRun({
  text, bold: o.bold, italics: o.italics, size: o.size ?? 22,
  color: o.color ?? C.text, font: FONT,
});

const P = (runs, o = {}) => new Paragraph({
  children: runs,
  alignment: o.alignment,
  indent: o.indent,
  spacing: { before: o.before ?? 0, after: o.after ?? 60 },
  border: o.border,
  pageBreakBefore: o.pageBreakBefore,
});

// "मराठी (English)" pair renderer
const pair = (v, o = {}) => {
  const mr = typeof v === "string" ? v : v.mr;
  const en = typeof v === "string" ? null : v.en;
  const runs = [T(mr, o)];
  if (en && en !== mr) runs.push(T(` (${en})`, { ...o, bold: false, color: o.enColor ?? C.muted }));
  return runs;
};

function renderField(f) {
  const nodes = [];
  nodes.push(P([
    T("•  ", { bold: true, color: C.accent, size: 24 }),
    ...pair(f.name, { bold: true, size: 23, color: C.text, enColor: C.accent }),
    ...(f.type ? [T("   [", { color: C.light }), ...pair(f.type, { color: C.light, enColor: C.light, size: 20 }), T("]", { color: C.light })] : []),
  ], { indent: { left: 360, hanging: 200 }, before: 80, after: 30 }));

  (f.options || []).forEach((op) => {
    nodes.push(P([
      T("◦  ", { color: C.muted }),
      ...pair(op, { color: C.text, enColor: C.muted, size: 21 }),
    ], { indent: { left: 900, hanging: 200 }, after: 20 }));
  });

  (f.logic || []).forEach((lg) => {
    nodes.push(P([
      T("↳ ", { bold: true, color: C.amber }),
      T(typeof lg === "string" ? lg : lg.mr, { italics: true, color: C.text, size: 20 }),
    ], { indent: { left: 900, hanging: 220 }, before: 20, after: 10 }));
    if (typeof lg !== "string" && lg.en) {
      nodes.push(P([T(lg.en, { italics: true, color: C.muted, size: 19 })],
        { indent: { left: 1120 }, after: 30 }));
    }
  });
  return nodes;
}

function renderGroup(g) {
  const nodes = [];
  nodes.push(P(pair(g.title, { bold: true, size: 26, color: C.accent, enColor: C.primary }), {
    before: 220, after: 60,
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "D1D5DB", space: 3 } },
  }));

  (g.notes || []).forEach((n) => {
    nodes.push(P([
      T("टीप (Note): ", { bold: true, color: C.amber, size: 20 }),
      T(typeof n === "string" ? n : n.mr, { italics: true, size: 20 }),
    ], { indent: { left: 360 }, after: 20 }));
    if (typeof n !== "string" && n.en) {
      nodes.push(P([T(n.en, { italics: true, color: C.muted, size: 19 })],
        { indent: { left: 640 }, after: 40 }));
    }
  });

  if (!g.fields || !g.fields.length) {
    nodes.push(P([T("(थेट fields नाहीत / No direct fields)", { italics: true, color: C.muted, size: 20 })],
      { indent: { left: 360 } }));
  } else {
    g.fields.forEach((f) => nodes.push(...renderField(f)));
  }
  return nodes;
}

function renderSection(s, isFirst) {
  const nodes = [];
  nodes.push(new Paragraph({
    heading: HeadingLevel.HEADING_1,
    pageBreakBefore: !isFirst,
    spacing: { before: 200, after: 140 },
    children: [
      T(`विभाग ${s.badge} (Section ${s.badge}):  `, { bold: true, size: 30, color: C.accent }),
      ...pair(s.title, { bold: true, size: 32, color: C.primary, enColor: C.accent }),
    ],
  }));
  s.groups.forEach((g) => nodes.push(...renderGroup(g)));
  return nodes;
}

function build() {
  const cover = [
    P([T("कोहळी समाज विकास मंडळ, नागपूर", { bold: true, size: 40, color: C.primary })],
      { alignment: AlignmentType.CENTER, before: 900, after: 120 }),
    P([T("कुटुंब सर्वेक्षण फॉर्म — संपूर्ण संरचना", { bold: true, size: 30, color: C.accent })],
      { alignment: AlignmentType.CENTER, after: 60 }),
    P([T("Family Survey Form — Complete Field Structure (Marathi with English)", { size: 24, color: C.muted })],
      { alignment: AlignmentType.CENTER, after: 300 }),
    P([T("प्रत्येक विभाग, गट, फील्ड लेबल, फील्ड प्रकार, पर्याय व जर-तर तर्क", { italics: true, size: 22, color: C.text })],
      { alignment: AlignmentType.CENTER, after: 40 }),
    P([T("Every section, group, field label, field type, option and conditional logic", { italics: true, size: 20, color: C.muted })],
      { alignment: AlignmentType.CENTER, after: 400 }),

    new Paragraph({
      heading: HeadingLevel.HEADING_1, spacing: { before: 200, after: 160 },
      children: [T("अनुक्रमणिका (Table of Contents)", { bold: true, size: 30, color: C.primary })],
    }),
    ...sections.map((s) => P([
      T(`विभाग ${s.badge}.  `, { bold: true, color: C.accent }),
      ...pair(s.title, { color: C.text, enColor: C.muted }),
    ], { indent: { left: 320 }, after: 40 })),
  ];

  const body = sections.flatMap((s, i) => renderSection(s, false));

  return new Document({
    styles: {
      default: { document: { run: { font: FONT, size: 22 } } },
      paragraphStyles: [{
        id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 30, bold: true, font: FONT, color: C.primary },
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
      children: [...cover, ...body],
    }],
  });
}

const buf = await Packer.toBuffer(build());
const out = path.join("/mnt/documents", "Kutumb-Survey-Form-Marathi-English-Structure.docx");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, buf);
console.log("Wrote", out, buf.length, "bytes");
