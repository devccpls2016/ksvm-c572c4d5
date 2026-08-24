// Generates a complete Word document describing Dashboard 2 and Dashboard 3:
// every section, KPI card, chart, table (with columns) and applicable filters.
// Usage: bun scripts/generate-dashboard-doc.mjs

import fs from "node:fs";
import path from "node:path";
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  PageOrientation, LevelFormat, PageBreak, TableOfContents,
} from "docx";

const FONT = "Nirmala UI";
const C = { primary: "1E3A8A", accent: "0F766E", amber: "B45309", muted: "6B7280", text: "1F2937", en: "374151" };

const T = (text, o = {}) => new TextRun({
  text: String(text), font: FONT, bold: o.bold, italics: o.italics,
  color: o.color || C.text, size: o.size,
});
const P = (runs, o = {}) => new Paragraph({
  spacing: { before: o.before ?? 0, after: o.after ?? 60 },
  indent: o.indent, alignment: o.alignment, children: runs,
});
const Bullet = (text, level = 0, o = {}) => new Paragraph({
  numbering: { reference: "bul", level: Math.min(level, 4) },
  spacing: { after: 30 },
  children: [T(text, o)],
});
const H = (text, level, color) => new Paragraph({
  heading: level, spacing: { before: 240, after: 120 },
  children: [T(text, { bold: true, color: color || C.primary })],
});
const Break = () => new Paragraph({ children: [new PageBreak()] });

/* ------------------------------------------------------------ parsing */

const read = (p) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

function parseSections(src) {
  const block = src.match(/const SECTIONS = \[([\s\S]*?)\n\];/)[1];
  return [...block.matchAll(/\{\s*id:\s*"([^"]+)",\s*no:\s*"([^"]+)",\s*label:\s*"([^"]+)"/g)]
    .map((m) => ({ id: m[1], no: m[2], label: m[3] }));
}

function parseSectionFilters(src) {
  const block = src.match(/const SECTION_FILTERS[^=]*= \{([\s\S]*?)\n\};/)[1];
  const out = {};
  for (const m of block.matchAll(/(\w+):\s*\[([^\]]*)\]/g)) {
    out[m[1]] = [...m[2].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
  }
  return out;
}

function parseSwitch(src) {
  const block = src.match(/switch \(id\) \{([\s\S]*?)\n\}/)[1];
  const map = {};
  for (const m of block.matchAll(/case "([^"]+)": return <(\w+)/g)) map[m[1]] = m[2];
  const def = block.match(/default: return <(\w+)/);
  return { map, def: def ? def[1] : null };
}

/** slice each top-level `function Name(` body */
function functionBodies(src) {
  const lines = src.split("\n");
  const starts = [];
  lines.forEach((l, i) => {
    const m = l.match(/^function (\w+)\s*\(/);
    if (m) starts.push({ name: m[1], line: i });
  });
  const out = {};
  starts.forEach((s, i) => {
    const end = i + 1 < starts.length ? starts[i + 1].line : lines.length;
    out[s.name] = lines.slice(s.line, end).join("\n");
  });
  return out;
}

const clean = (s) => s
  .replace(/\$\{[^}]*\}/g, "…")
  .replace(/\s+/g, " ")
  .trim();

function extractKpis(body) {
  const out = [];
  for (const m of body.matchAll(/<Kpi\b([^>]*?)\/>/g)) {
    const attrs = m[1];
    const lab = attrs.match(/label="([^"]*)"/) || attrs.match(/label=\{`([^`]*)`\}/);
    if (!lab) continue;
    const val = attrs.match(/value=\{([^}]*(?:\}[^}]*)*)\}/);
    const hint = attrs.match(/hint="([^"]*)"/) || attrs.match(/hint=\{`([^`]*)`\}/);
    out.push({
      label: clean(lab[1]),
      value: val ? clean(val[1]).slice(0, 120) : "",
      hint: hint ? clean(hint[1]) : "",
    });
  }
  return out;
}

const CHART_NAMES = { PieCh: "Pie / Donut chart", BarCh: "Bar chart", LineCh: "Line chart", StackedBar: "Stacked bar chart", CompletionList: "Completion progress list", DataTable: "Data table", Empty: "Empty state" };

function extractCharts(body) {
  const out = [];
  const re = /<ChartCard\s+title=(?:"([^"]*)"|\{`([^`]*)`\})([\s\S]*?)<\/ChartCard>/g;
  for (const m of body.matchAll(re)) {
    const title = clean(m[1] ?? m[2]);
    const inner = m[3];
    const kinds = [...new Set([...inner.matchAll(/<(PieCh|BarCh|LineCh|StackedBar|CompletionList|DataTable|Empty)\b/g)].map((k) => k[1]))];
    const cols = [...inner.matchAll(/columns=\{\[([\s\S]*?)\]\}/g)]
      .flatMap((c) => [...c[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]));
    out.push({
      title,
      kinds: kinds.map((k) => CHART_NAMES[k] || k),
      series: [...new Set(cols)],
      horizontal: /horizontal/.test(inner),
      donut: /donut/.test(inner),
    });
  }
  return out;
}

function extractTables(body) {
  const out = [];
  const re = /<DataTable([\s\S]*?)(?:\/>|>)/g;
  for (const m of body.matchAll(re)) {
    const a = m[1];
    const t = a.match(/title=(?:"([^"]*)"|\{`([^`]*)`\})/);
    const colsBlock = a.match(/columns=\{\[([\s\S]*?)\]\}/);
    const cols = colsBlock
      ? [...colsBlock[1].matchAll(/label:\s*"([^"]+)"/g)].map((x) => x[1])
      : [];
    if (!t && !cols.length) continue;
    out.push({ title: t ? clean(t[1] ?? t[2]) : "(untitled table)", cols });
  }
  return out;
}

function extractCardTitles(body) {
  return [...body.matchAll(/<CardTitle[^>]*>([^<]+)<\/CardTitle>/g)]
    .map((m) => clean(m[1]))
    .filter((s) => s && !s.startsWith("{"));
}

function extractExtras(body) {
  const extras = [];
  if (/<CompletionList/.test(body)) extras.push("Section-wise completion progress list");
  if (/<StatBars|StatBars/.test(body)) extras.push("Ranked stat bars");
  if (/<Select/.test(body)) extras.push("In-section dropdown selectors (dimension / metric pickers)");
  if (/<Input/.test(body)) extras.push("In-section text/number inputs");
  return extras;
}

/* ------------------------------------------------------------ filters */

function parseFilterModel() {
  const src = read("src/lib/survey-filters.ts");
  const typeBlock = src.match(/export type SurveyFilters = \{([\s\S]*?)\n\};/)[1];
  const groups = [];
  let cur = null;
  for (const raw of typeBlock.split("\n")) {
    const line = raw.trim();
    const g = line.match(/^\/\/\s*(\d+\.\s*.+)$/);
    if (g) { cur = { title: g[1], fields: [] }; groups.push(cur); continue; }
    const f = line.match(/^(\w+)\??:\s*([^;]+);/);
    if (f && cur) cur.fields.push({ name: f[1], type: f[2].trim() });
  }
  return groups;
}

const GROUP_LABELS = {
  loc: "स्थान / Location", fam: "कुटुंब व लोकसंख्या / Family & Demographics",
  edu: "शिक्षण / Education", occ: "नौकरी व व्यवसाय / Occupation",
  agri: "शेती / Agriculture", house: "घर व मालमत्ता / House & Assets",
  ben: "योजना व लाभ / Benefits", pos: "धारण केलेले पद / Positions Held",
  biz: "व्यवसाय व उद्योजकता / Business & Entrepreneurship",
};

/* ------------------------------------------------------------ renderer */

function renderDashboard(label, file, out) {
  const src = read(file);
  const sections = parseSections(src);
  const secFilters = parseSectionFilters(src);
  const { map, def } = parseSwitch(src);
  const bodies = functionBodies(src);

  out.push(Break());
  out.push(H(`${label} — संपूर्ण संरचना / Complete Structure`, HeadingLevel.HEADING_1));
  out.push(P([T(`Route: ${file.replace("src/routes/_authenticated/", "/").replace(".tsx", "")}   •   विभाग / Sections: ${sections.length}`, { italics: true, color: C.muted })], { after: 120 }));

  out.push(H("वैश्विक नियंत्रणे / Global Controls", HeadingLevel.HEADING_2, C.accent));
  [
    "Section navigation — dropdown (mobile) + numbered button rail (desktop) for every section listed below.",
    "सर्व फिल्टर (All fields) — full collapsible filter panel with all 9 filter groups.",
    "या विभागाचे फिल्टर / Section filters — only the filter groups relevant to the active section.",
    "Date range — From / To date pickers filtering surveys by submission date (created_at).",
    "Active filter count badge + Reset button (RotateCcw) to clear all filters.",
    "Role scoping — admins see all surveys; surveyors see only their own submissions.",
  ].forEach((s) => out.push(Bullet(s, 0)));

  sections.forEach((s) => {
    const comp = map[s.id] || def;
    const body = bodies[comp] || "";
    out.push(H(`${s.no}. ${s.label}`, HeadingLevel.HEADING_2, C.accent));
    out.push(P([
      T("Section id: ", { bold: true, color: C.primary }), T(s.id),
      T("     Component: ", { bold: true, color: C.primary }), T(comp || "—"),
    ], { indent: { left: 200 }, after: 40 }));

    const fg = secFilters[s.id] || [];
    out.push(P([T("लागू फिल्टर गट / Applicable filter groups: ", { bold: true, color: C.amber }),
      T(fg.map((g) => GROUP_LABELS[g] || g).join("  •  ") || "—")], { indent: { left: 200 }, after: 60 }));

    const kpis = extractKpis(body);
    if (kpis.length) {
      out.push(P([T(`KPI कार्ड / KPI cards (${kpis.length}):`, { bold: true, color: C.primary })], { indent: { left: 200 }, after: 20 }));
      kpis.forEach((k) => {
        out.push(Bullet(k.label, 0, { bold: true }));
        if (k.value) out.push(Bullet(`गणना / Computed from: ${k.value}`, 1, { color: C.muted }));
        if (k.hint) out.push(Bullet(`Hint: ${k.hint}`, 1, { color: C.muted }));
      });
    }

    const charts = extractCharts(body);
    if (charts.length) {
      out.push(P([T(`आकृत्या / Charts (${charts.length}):`, { bold: true, color: C.primary })], { indent: { left: 200 }, before: 60, after: 20 }));
      charts.forEach((c) => {
        out.push(Bullet(c.title, 0, { bold: true }));
        const kind = [...c.kinds, c.donut ? "donut style" : null, c.horizontal ? "horizontal orientation" : null].filter(Boolean).join(", ");
        if (kind) out.push(Bullet(`प्रकार / Type: ${kind}`, 1, { color: C.muted }));
        if (c.series.length) out.push(Bullet(`Series / stacked keys: ${c.series.join(", ")}`, 1, { color: C.muted }));
      });
    }

    const tables = extractTables(body);
    if (tables.length) {
      out.push(P([T(`तक्ते / Data tables (${tables.length}):`, { bold: true, color: C.primary })], { indent: { left: 200 }, before: 60, after: 20 }));
      tables.forEach((t) => {
        out.push(Bullet(t.title, 0, { bold: true }));
        if (t.cols.length) out.push(Bullet(`स्तंभ / Columns: ${t.cols.join(" | ")}`, 1, { color: C.muted }));
      });
    }

    const cardTitles = extractCardTitles(body).filter((t) => !charts.some((c) => c.title === t));
    if (cardTitles.length) {
      out.push(P([T("इतर पॅनेल / Other panels:", { bold: true, color: C.primary })], { indent: { left: 200 }, before: 60, after: 20 }));
      cardTitles.forEach((t) => out.push(Bullet(t, 0)));
    }

    const extras = extractExtras(body);
    if (extras.length) {
      out.push(P([T("घटक / Widgets:", { bold: true, color: C.primary })], { indent: { left: 200 }, before: 60, after: 20 }));
      extras.forEach((t) => out.push(Bullet(t, 0, { color: C.muted })));
    }

    if (!kpis.length && !charts.length && !tables.length && !cardTitles.length) {
      out.push(Bullet("(No declarative widgets detected — dynamic/computed content.)", 0, { italics: true, color: C.muted }));
    }
  });
}

async function main() {
  const cover = [
    P([T("कोहळी समाज विकास मंडळ, नागपूर", { bold: true, color: C.primary, size: 40 })], { alignment: AlignmentType.CENTER, before: 900, after: 100 }),
    P([T("Kohli Samaj Vikas Mandal, Nagpur", { bold: true, color: C.en, size: 26 })], { alignment: AlignmentType.CENTER, after: 200 }),
    P([T("विश्लेषण डॅशबोर्ड २ व ३ — संपूर्ण रचना दस्तऐवज", { bold: true, color: C.accent, size: 32 })], { alignment: AlignmentType.CENTER, after: 80 }),
    P([T("Analytics Dashboard 2 & Dashboard 3 — Complete Structure Document", { bold: true, color: C.en, size: 26 })], { alignment: AlignmentType.CENTER, after: 240 }),
    P([T("प्रत्येक विभाग, KPI कार्ड, आकृती, तक्ता व स्तंभ, तसेच लागू फिल्टर गट आणि संपूर्ण फिल्टर मॉडेल — एकही field न वगळता.", { italics: true, color: C.muted, size: 22 })], { alignment: AlignmentType.CENTER, after: 60 }),
    P([T("Every section, KPI card, chart, table and column, plus applicable filter groups and the complete filter model — nothing omitted.", { italics: true, color: C.muted, size: 20 })], { alignment: AlignmentType.CENTER, after: 200 }),
    P([T(`Generated: ${new Date().toISOString().slice(0, 10)}`, { color: C.muted, size: 18 })], { alignment: AlignmentType.CENTER }),
    Break(),
    H("अनुक्रमणिका / Table of Contents", HeadingLevel.HEADING_1),
    new TableOfContents("Contents", { hyperlink: true, headingStyleRange: "1-2" }),
  ];

  const body = [];
  renderDashboard("Dashboard 2", "src/routes/_authenticated/dashboard2.tsx", body);
  renderDashboard("Dashboard 3", "src/routes/_authenticated/dashboard3.tsx", body);

  // filter model appendix
  const fm = parseFilterModel();
  body.push(Break());
  body.push(H("परिशिष्ट — संपूर्ण फिल्टर मॉडेल / Appendix: Complete Filter Model", HeadingLevel.HEADING_1));
  body.push(P([T("दोन्ही डॅशबोर्डमध्ये वापरलेले सर्व फिल्टर fields व त्यांचा प्रकार. / All filter fields used by both dashboards, with data types.", { italics: true, color: C.muted })], { after: 120 }));
  let total = 0;
  fm.forEach((g) => {
    body.push(H(g.title, HeadingLevel.HEADING_2, C.accent));
    g.fields.forEach((f) => { total += 1; body.push(Bullet(`${f.name}  —  ${f.type}`, 0)); });
  });
  body.push(P([T(`एकूण फिल्टर fields / Total filter fields: ${total}`, { bold: true, color: C.primary })], { before: 120 }));

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
          run: { size: 32, bold: true, font: FONT, color: C.primary },
          paragraph: { spacing: { before: 240, after: 140 }, outlineLevel: 0 } },
        { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 27, bold: true, font: FONT, color: C.accent },
          paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 1 } },
      ],
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

  const buf = await Packer.toBuffer(doc);
  const outPath = "/mnt/documents/Dashboard-2-and-3-Complete-Structure.docx";
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, buf);
  console.log("Wrote", outPath, buf.length, "bytes");
}

await main();
