// Generates the ENGLISH edition of the "Search & Filter" documentation for All Surveys.
// Field labels are shown in English with the original Marathi label in brackets.
// Option values that exist only in Marathi in the app are kept exactly as-is.
// Usage: bun scripts/generate-filter-doc-en.mjs

import fs from "node:fs";
import path from "node:path";
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  PageOrientation, LevelFormat, PageBreak, BorderStyle,
  Table, TableRow, TableCell, WidthType, ShadingType, VerticalAlign,
} from "docx";
import {
  HOUSEHOLD_ITEMS, HOUSE_TYPES, LIVING_STATUS, MAJOR_CROP_TYPES, MARITAL,
  POLITICAL_LEVELS, POSITION_STATUS, POSITION_TYPES, REPRESENTATIVES, REPRESENTATIVE_ROLES,
} from "../src/lib/marathi.ts";
import { EDUCATION_TREE, INSTITUTION_TYPES } from "../src/lib/education-data.ts";
import {
  BANK_DESIGNATIONS, BUSINESS_TYPES, CENTRAL_ARMED_FORCES_RANKS, EDU_DESIGNATIONS_BY_LEVEL,
  ENG_DESIGNATIONS, FARMING_TYPES, GOVT_CLASS_DESIGNATIONS, JUDICIARY_DESIGNATIONS,
  LAND_SIZES, LOAN_PURPOSE_OPTIONS, MED_DESIGNATIONS, MILITARY_RANKS, POLICE_RANKS,
  PRIMARY_CATEGORIES, SELF_EMPLOYED_TYPES, WCD_DESIGNATIONS,
} from "../src/lib/occupation-data.ts";
import {
  AGE_GROUPS, FAMILY_SIZES, GENDER_OPTS, IRRIGATION_KEYS, LADKI_BAHIN_REASONS,
  MARRIAGE_TYPES, PUMP_TYPES, SPORT_LEVELS, STATES, TOOL_KEYS, EMPLOYMENT_TYPES,
} from "../src/lib/survey-filters.ts";

const FONT = "Nirmala UI";
const C = {
  primary: "1E3A8A", accent: "0F766E", violet: "6D28D9",
  amber: "B45309", muted: "6B7280", text: "111827", en: "1D4ED8", green: "15803D",
};

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
/** English label first, Marathi label (as used in the UI) in brackets. */
const Field = (en, mr, type, o = {}) => P([
  T("•  ", { bold: true, color: C.accent, size: 24 }),
  T(en, { bold: true, size: 23 }),
  ...(mr ? [T(`  (${mr})`, { color: C.en, size: 21 })] : []),
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
const Note = (text, left = 700) => P([
  T("★ ", { bold: true, color: C.green }),
  T(text, { italics: true, color: C.green, size: 20 }),
], { indent: { left, hanging: 220 }, before: 30, after: 30 });
const Key = (text, left = 700) => P([
  T("data key: ", { color: C.muted, size: 19 }),
  T(text, { size: 19, color: C.violet, bold: true }),
], { indent: { left }, after: 40 });
const Br = () => new Paragraph({ children: [new PageBreak()] });

const uniq = (a) => Array.from(new Set(a.filter(Boolean)));
const nodes = [];

/* ---------- Cover ---------- */
nodes.push(
  P([T("Kohali Samaj Vikas Mandal, Nagpur", { bold: true, size: 40, color: C.primary })],
    { alignment: AlignmentType.CENTER, before: 900, after: 120 }),
  P([T("All Surveys — Search & Filter", { bold: true, size: 34, color: C.accent })],
    { alignment: AlignmentType.CENTER, after: 60 }),
  P([T("Complete end-to-end structure of the filter section (English edition)", { size: 24, color: C.en })],
    { alignment: AlignmentType.CENTER, after: 300 }),
  P([T("9 filter groups · 69 filter fields + 1 quick-search bar · every option, behaviour and matching rule", { italics: true, size: 21 })],
    { alignment: AlignmentType.CENTER, after: 40 }),
  P([T("Marathi labels and option values are reproduced exactly as they appear in the application.", { italics: true, size: 20, color: C.muted })],
    { alignment: AlignmentType.CENTER, after: 200 }),
  P([T(`Generated: ${new Date().toISOString().slice(0, 10)}`, { color: C.muted, size: 18 })],
    { alignment: AlignmentType.CENTER }),
  Br(),
);

/* ---------- Colour key ---------- */
nodes.push(H1("Colour Key"));
[
  ["Dark blue — main section / filter group", C.primary],
  ["Teal — filter field label (English)", C.accent],
  ["Blue — original Marathi label as shown in the app", C.en],
  ["Violet — sub-group headings & data keys", C.violet],
  ["Grey — control type and option values", C.muted],
  ["Amber ↳ — matching rule / cascading logic", C.amber],
  ["Green ★ — important note", C.green],
].forEach(([t, col]) => nodes.push(B(t, 0, { size: 21, color: col, bold: true })));

/* ---------- 1. Overview ---------- */
nodes.push(H1("1. Overview"));
nodes.push(P([T("The \"Search & Filter\" card on the All Surveys page has two layers: (1) a free-text quick-search bar, and (2) an advanced filter accordion made of 9 groups. Both run entirely client-side on the already-loaded rows, so results update instantly with no extra database queries.", { size: 21 })], { after: 100 }));

nodes.push(H3("Control Types"));
[
  "MultiSelect — a popover containing a search box and a checkbox list. The trigger button shows \"All\" / the selected option / \"N selected\". A \"Clear selection\" action empties the field.",
  "TriSelect — a three-state dropdown: All (empty) / Yes / No. \"No\" means the value is not true (this also covers empty and null values).",
  "RangeInput — two numeric inputs (minimum and maximum); filling only one of them is allowed.",
  "TextFilter — free text; case-insensitive \"contains\" matching.",
  "Select — a single-choice dropdown (State, Equipment ownership, Minimum asset quantity).",
].forEach((s) => nodes.push(B(s, 0, { size: 21 })));

nodes.push(H3("General Matching Rules"));
[
  "An empty field applies no restriction — every record passes it.",
  "Multiple selections inside one field are combined with OR (any one match is enough).",
  "Different fields are combined with AND (all conditions must hold at the same time).",
  "Person-level fields (gender, age, marital status, education, occupation) are evaluated against the family head plus every family member; the family is kept if at least one person satisfies all person-level conditions simultaneously.",
  "Each filter group heading shows a badge with the number of active fields in that group; the top-level \"Reset\" clears every filter.",
].forEach((s) => nodes.push(B(s, 0, { size: 21 })));

/* ---------- 2. Quick search ---------- */
nodes.push(H1("2. Quick Search Bar"));
nodes.push(Field("Search", "शोध", "Text input"));
nodes.push(P([T("placeholder: \"नाव / मोबाईल / गाव / तालुका / जिल्हा / पिनकोड शोधा...\"  (Search name / mobile / village / taluka / district / pincode)", { color: C.muted, size: 20 })], { indent: { left: 700 }, after: 30 }));
[
  "Family head name — कुटुंब प्रमुखाचे नाव (head_name)",
  "Mobile number — मोबाईल क्रमांक (mobile)",
  "Village — गाव (village)",
  "Taluka — तालुका (taluka)",
  "District — जिल्हा (district)",
  "Pincode — पिनकोड (pincode)",
].forEach((s) => nodes.push(Opt(s, 700)));
nodes.push(Logic("Matching: case-insensitive substring; a record is shown if the text is found in any one of the six fields. It is combined with the advanced filters using AND.", 500));

/* ---------- group helper ---------- */
function group(title, mr, keys, blocks) {
  nodes.push(H1(title + (mr ? ` (${mr})` : "")));
  nodes.push(P([T("group id: ", { color: C.muted, size: 19 }), T(keys.id, { color: C.violet, bold: true, size: 19 }),
    T("   ·   fields: ", { color: C.muted, size: 19 }), T(String(keys.count), { color: C.violet, bold: true, size: 19 })], { after: 60 }));
  blocks();
}

/* ---------- 3. LOCATION ---------- */
group("3. Location", "स्थान", { id: "loc", count: 5 }, () => {
  nodes.push(Field("State", "राज्य", "Select (single)"));
  nodes.push(Opt("All states (default)"));
  STATES.forEach((s) => nodes.push(Opt(s)));
  nodes.push(Key("state"));

  nodes.push(Field("District", "जिल्हा", "MultiSelect"));
  nodes.push(Logic("Options are derived automatically from the data (unique districts across the loaded surveys, sorted in Marathi collation order).", 700));
  nodes.push(Logic("Changing the district clears the taluka, village and pincode selections.", 700));
  nodes.push(Key("districts[]"));

  nodes.push(Field("Taluka", "तालुका", "MultiSelect"));
  nodes.push(Logic("Only talukas belonging to the selected districts are listed. Changing it clears village and pincode.", 700));
  nodes.push(Key("talukas[]"));

  nodes.push(Field("Village", "गाव", "MultiSelect"));
  nodes.push(Logic("Filtered by the selected district + taluka. Changing it clears the pincode.", 700));
  nodes.push(Key("villages[]"));

  nodes.push(Field("Pincode", "पिनकोड", "MultiSelect"));
  nodes.push(Logic("Pincodes filtered along the District → Taluka → Village chain.", 700));
  nodes.push(Key("pincodes[]"));
  nodes.push(Note("Location filters are family-level — they read columns stored directly on the survey row.", 500));
});

/* ---------- 4. FAMILY ---------- */
group("4. Family & Demographics", "कुटुंब व लोकसंख्याशास्त्र", { id: "fam", count: 8 }, () => {
  nodes.push(Field("Gender", "लिंग", "MultiSelect"));
  GENDER_OPTS.forEach((g) => nodes.push(Opt(g)));
  nodes.push(Key("genders[]"));

  nodes.push(Field("Age Group", "वयोगट", "MultiSelect"));
  AGE_GROUPS.forEach((g) => nodes.push(Opt(`${g.label} — ${g.min} to ${g.max === 200 ? "∞" : g.max}`)));
  nodes.push(Key("ageGroups[]"));

  nodes.push(Field("Age Range", "वय श्रेणी", "RangeInput (min – max)"));
  nodes.push(Logic("Age is taken from the age field; when it is empty the age is calculated from the date of birth (dob).", 700));
  nodes.push(Key("ageMin / ageMax"));

  nodes.push(Field("Marital Status", "वैवाहिक स्थिती", "MultiSelect"));
  MARITAL.forEach((m) => nodes.push(Opt(m)));
  nodes.push(Key("maritalStatuses[]"));

  nodes.push(Field("Marriage Type", "विवाहाचा प्रकार", "MultiSelect"));
  MARRIAGE_TYPES.forEach((m) => nodes.push(Opt(m)));
  nodes.push(Key("marriageTypes[]"));

  nodes.push(Field("Spouse Caste", "जोडीदाराची जात", "TextFilter"));
  nodes.push(Logic("Substring matching; applies to the caste recorded for an inter-caste marriage.", 700));
  nodes.push(Key("spouseCaste"));

  nodes.push(Field("Family Size", "कुटुंब आकार", "MultiSelect"));
  FAMILY_SIZES.forEach((g) => nodes.push(Opt(`${g.label} — ${g.min}–${g.max === 999 ? "∞" : g.max}`)));
  nodes.push(Key("familySizes[]"));

  nodes.push(Field("Family Size Range", "कुटुंब आकार श्रेणी", "RangeInput"));
  nodes.push(Logic("Size = family head (1) + number of recorded members.", 700));
  nodes.push(Key("familyMin / familyMax"));
});

/* ---------- 5. EDUCATION ---------- */
nodes.push(Br());
group("5. Education", "शिक्षण", { id: "edu", count: 4 }, () => {
  nodes.push(Field("Level", "शिक्षण स्तर", "MultiSelect"));
  EDUCATION_TREE.forEach((l) => nodes.push(Opt(l.level)));
  nodes.push(Logic("Changing the level clears the stream and course selections.", 700));
  nodes.push(Key("eduLevels[]"));

  nodes.push(Field("Stream / Group", "शाखा / गट", "MultiSelect"));
  nodes.push(Logic("Options are limited to the streams of the selected levels (entries marked \"—\" are excluded). Changing it clears the course.", 700));
  nodes.push(Key("eduStreams[]"));
  nodes.push(H3("Streams available per level"));
  EDUCATION_TREE.forEach((l) => {
    const st = l.streams.map((s) => s.stream).filter((s) => s !== "—");
    if (st.length) nodes.push(B(`${l.level} → ${st.join(" · ")}`, 0, { size: 20 }));
  });

  nodes.push(Field("Course", "अभ्यासक्रम", "MultiSelect"));
  nodes.push(Logic("Courses filtered along the Level + Stream chain.", 700));
  nodes.push(Key("eduCourses[]"));

  nodes.push(Field("Institution Type", "संस्था प्रकार", "MultiSelect"));
  INSTITUTION_TYPES.forEach((i) => nodes.push(Opt(i)));
  nodes.push(Key("eduInstitutions[]"));
  nodes.push(Note("Education filters are person-level — the family is kept if any one person's education matches.", 500));
});

/* ---------- 6. OCCUPATION ---------- */
nodes.push(Br());
group("6. Occupation", "नौकरी / व्यवसाय", { id: "occ", count: 5 }, () => {
  nodes.push(Field("Category", "मुख्य श्रेणी", "MultiSelect"));
  PRIMARY_CATEGORIES.forEach((c) => nodes.push(Opt(c)));
  nodes.push(Key("occCategories[]"));

  nodes.push(Field("Employment Type", "रोजगार प्रकार", "MultiSelect"));
  EMPLOYMENT_TYPES.forEach((c) => nodes.push(Opt(c)));
  nodes.push(Logic("Each occupation category is mapped to one broad employment type (for example \"शेतकरी (Farmer)\" maps to \"शेती (Agriculture)\" and \"सरकारी कर्मचारी\" maps to \"सरकारी (Government)\").", 700));
  nodes.push(Key("employmentTypes[]"));

  nodes.push(Field("Department / Institution", "विभाग / संस्था", "TextFilter"));
  nodes.push(Logic("Substring search across eight sub-fields: institution type, institution level, engineering branch, defence force, bank type, sector, hospital type and service type.", 700));
  nodes.push(Key("department"));

  nodes.push(Field("Designation", "पदनाम", "MultiSelect"));
  nodes.push(Logic("The list is built by merging designations and ranks from every sector; matching is done on the designation or the rank value.", 700));
  nodes.push(Key("designations[]"));
  const desGroups = [
    ["Government (by class)", uniq(Object.values(GOVT_CLASS_DESIGNATIONS).flat())],
    ["Education sector (by level)", uniq(Object.values(EDU_DESIGNATIONS_BY_LEVEL).flat())],
    ["Medical sector", MED_DESIGNATIONS],
    ["Women & Child Development", WCD_DESIGNATIONS],
    ["Engineering", ENG_DESIGNATIONS],
    ["Banking & Finance", BANK_DESIGNATIONS],
    ["Judiciary", JUDICIARY_DESIGNATIONS],
    ["Military ranks", MILITARY_RANKS],
    ["Police ranks", POLICE_RANKS],
    ["Central armed forces ranks", CENTRAL_ARMED_FORCES_RANKS],
  ];
  desGroups.forEach(([t, list]) => {
    nodes.push(H3(`Designation source — ${t} (${list.length})`));
    list.forEach((d) => nodes.push(Opt(d, 700)));
  });

  nodes.push(Field("Business Type", "व्यवसाय प्रकार", "MultiSelect"));
  nodes.push(Logic("The list merges business types with self-employment skills. Matching is done on businessType, businessTypes[] or selfEmployedTypes[].", 700));
  nodes.push(Key("occBusinessTypes[]"));
  nodes.push(H3("Business types (Business Owner)"));
  BUSINESS_TYPES.forEach((b) => nodes.push(Opt(b, 700)));
  nodes.push(H3("Self-employment skills (Self Employed)"));
  SELF_EMPLOYED_TYPES.forEach((b) => nodes.push(Opt(b, 700)));
});

/* ---------- 7. AGRICULTURE ---------- */
nodes.push(Br());
group("7. Agriculture", "शेती", { id: "agri", count: 18 }, () => {
  nodes.push(Field("Has Farmland", "शेती आहे का?", "TriSelect (All / Yes / No)"));
  nodes.push(Key("hasFarmland"));

  nodes.push(Field("Land Size", "जमिनीचे क्षेत्र", "MultiSelect"));
  LAND_SIZES.forEach((l) => nodes.push(Opt(l)));
  nodes.push(Key("landSizes[]"));

  nodes.push(Field("Land Area Range (acres)", "क्षेत्र श्रेणी (एकर)", "RangeInput"));
  nodes.push(Logic("Calculation: irrigated area + dryland area; when both are empty, the numeric value inside the total farmland field is used.", 700));
  nodes.push(Key("landMin / landMax"));

  nodes.push(Field("Crop Season", "हंगाम", "MultiSelect"));
  ["खरीप (Kharif)", "रब्बी (धान सोडून) — Rabi (excluding paddy)", "उन्हाळी (धानासह) — Summer (including paddy)"].forEach((s) => nodes.push(Opt(s)));
  nodes.push(Logic("Matched against crops[].season; in addition, if the Kharif / Rabi / Summer area is filled in, that season is assumed to be present.", 700));
  nodes.push(Key("cropSeasons[]"));

  nodes.push(Field("Major Crop Type", "प्रमुख पीक प्रकार", "MultiSelect"));
  MAJOR_CROP_TYPES.forEach((s) => nodes.push(Opt(s)));
  nodes.push(Key("majorCropTypes[]"));

  nodes.push(Field("Irrigation Source", "सिंचन स्रोत", "MultiSelect"));
  IRRIGATION_KEYS.forEach((i) => nodes.push(Opt(`${i.label}   [key: ${i.key}]`)));
  nodes.push(Logic("A source matches when its detail block is filled (count / electric / solar) or when the source is present in the recorded source list.", 700));
  nodes.push(Key("irrigationSources[]"));

  nodes.push(Field("Pump Type", "पंप प्रकार", "MultiSelect"));
  PUMP_TYPES.forEach((s) => nodes.push(Opt(s)));
  nodes.push(Logic("Matches when the corresponding pump flag (electric / solar) is true on any one irrigation source.", 700));
  nodes.push(Key("pumpTypes[]"));

  nodes.push(Field("Kohli Malguzari Pond", "कोहळी मालगुजारी तलाव", "TriSelect"));
  nodes.push(Logic("Evaluated only on the pond source's is_kohli_malguzari value.", 700));
  nodes.push(Key("malguzariPond"));

  nodes.push(Field("Free Water for Irrigation", "मोफत सिंचन पाणी", "TriSelect"));
  nodes.push(Logic("\"Yes\" matches when water_free_for_irrigation is true on any source.", 700));
  nodes.push(Key("freeWater"));

  nodes.push(Field("Farming Type", "शेतीचा प्रकार", "MultiSelect"));
  FARMING_TYPES.forEach((s) => nodes.push(Opt(s)));
  nodes.push(Logic("Matched against the farming types recorded inside any family member's occupation details.", 700));
  nodes.push(Key("farmingTypes[]"));

  nodes.push(Field("Equipment", "शेती साधने", "MultiSelect"));
  TOOL_KEYS.forEach((t) => nodes.push(Opt(`${t.label}   [key: ${t.key}]`)));
  nodes.push(Key("farmingTools[]"));

  nodes.push(Field("Ownership", "साधन मालकी", "Select"));
  ["All (सर्व)", "Owns it (स्वतःचे आहे) — own", "Does not own (नाही) — not_own"].forEach((s) => nodes.push(Opt(s)));
  nodes.push(Key("toolOwnership"));

  nodes.push(Field("Want to Buy", "खरेदी करण्याची इच्छा?", "TriSelect"));
  nodes.push(Key("toolWantBuy"));
  nodes.push(Field("Equipment Loan Needed", "कर्जाची आवश्यकता? (साधनांसाठी)", "TriSelect"));
  nodes.push(Key("toolLoan"));
  nodes.push(Logic("The equipment filters work together: at least one of the selected tools must satisfy the ownership + purchase-intent + loan conditions at the same time. If a tool is selected but the other three conditions are empty, ownership of that tool is assumed. If no tool is selected, all six tools are checked.", 500));

  nodes.push(Field("Contract / Share Farming", "ठेका / बटाई शेती", "TriSelect"));
  nodes.push(Key("contractFarming"));
  nodes.push(Field("Contract Area Range (acres)", "ठेका / बटाई क्षेत्र (एकर)", "RangeInput"));
  nodes.push(Key("contractMin / contractMax"));
});

/* ---------- 8. HOUSE ---------- */
nodes.push(Br());
group("8. House & Assets", "घर व मालमत्ता", { id: "house", count: 9 }, () => {
  nodes.push(Field("Own House", "स्वतःचे घर?", "TriSelect")); nodes.push(Key("ownsHouse"));
  nodes.push(Field("House Type", "घराचा प्रकार", "MultiSelect"));
  HOUSE_TYPES.forEach((s) => nodes.push(Opt(s)));
  nodes.push(Key("houseTypes[]"));
  nodes.push(Field("Living Status", "निवास स्थिती", "MultiSelect"));
  LIVING_STATUS.forEach((s) => nodes.push(Opt(s)));
  nodes.push(Key("livingStatuses[]"));
  nodes.push(Field("Gharkul Benefit Received", "घरकुल लाभ मिळाला?", "TriSelect")); nodes.push(Key("gharkulReceived"));
  nodes.push(Field("Gharkul Required", "घरकुल आवश्यक?", "TriSelect")); nodes.push(Key("gharkulWanted"));
  nodes.push(Field("Solar Installed", "सोलर बसविले?", "TriSelect")); nodes.push(Key("solarInstalled"));
  nodes.push(Field("Solar Required", "सोलर आवश्यक?", "TriSelect")); nodes.push(Key("solarWanted"));
  nodes.push(Field("Household Assets", "घरगुती वस्तू", "MultiSelect"));
  HOUSEHOLD_ITEMS.forEach((s) => nodes.push(Opt(s)));
  nodes.push(Logic("This field uses AND matching — the family must own every selected asset.", 700));
  nodes.push(Key("assets[]"));
  nodes.push(Field("Minimum Quantity", "वस्तू किमान संख्या", "Select (1+ to 10+)"));
  nodes.push(Logic("Every selected asset must have a recorded quantity greater than or equal to this value; when no quantity is recorded, 1 is assumed.", 700));
  nodes.push(Key("assetMinQty"));
});

/* ---------- 9. BENEFITS ---------- */
group("9. Benefits & Assistance", "लाभ / सहाय्य", { id: "ben", count: 8 }, () => {
  nodes.push(Field("Ladki Bahin Beneficiary", "लाडकी बहीण लाभार्थी", "TriSelect")); nodes.push(Key("ladkiBahin"));
  nodes.push(Field("Payment Received Regularly", "लाभ नियमित मिळतो?", "TriSelect")); nodes.push(Key("ladkiBahinRegular"));
  nodes.push(Field("Reason", "कारण", "MultiSelect"));
  LADKI_BAHIN_REASONS.forEach((s) => nodes.push(Opt(s)));
  nodes.push(Logic("Matched against reasons recorded in both the beneficiary and non-beneficiary lists.", 700));
  nodes.push(Key("ladkiBahinReasons[]"));
  nodes.push(Field("Critical Illness", "गंभीर आजार", "TriSelect")); nodes.push(Key("criticalIllness"));
  nodes.push(Field("Medical Aid Needed", "वैद्यकीय मदत आवश्यक?", "TriSelect")); nodes.push(Key("medicalAidNeeded"));
  nodes.push(Field("Sportsperson in Family", "खेळाडू आहे का?", "TriSelect")); nodes.push(Key("hasSportsperson"));
  nodes.push(Field("Sport Level", "स्तर", "MultiSelect"));
  SPORT_LEVELS.forEach((s) => nodes.push(Opt(s)));
  nodes.push(Key("sportLevels[]"));
  nodes.push(Field("Sport Type", "खेळाचा प्रकार", "TextFilter")); nodes.push(Key("sportType"));
});

/* ---------- 10. POSITION ---------- */
nodes.push(Br());
group("10. Positions Held", "धारण केलेले पद", { id: "pos", count: 8 }, () => {
  nodes.push(Field("Has Position", "पद आहे का?", "TriSelect")); nodes.push(Key("hasPosition"));
  nodes.push(Field("Position Type", "पदाचा प्रकार", "MultiSelect"));
  POSITION_TYPES.forEach((s) => nodes.push(Opt(s)));
  nodes.push(Key("positionTypes[]"));
  nodes.push(Field("Current / Former", "आजी / माजी", "MultiSelect"));
  POSITION_STATUS.forEach((s) => nodes.push(Opt(s)));
  nodes.push(Key("positionStatuses[]"));
  nodes.push(Field("Political Level", "राजकीय स्तर", "MultiSelect"));
  POLITICAL_LEVELS.forEach((s) => nodes.push(Opt(s)));
  nodes.push(Key("politicalLevels[]"));
  nodes.push(Field("Party", "पक्ष", "TextFilter"));
  nodes.push(Logic("Substring matching on both the selected party name and the free-text name entered under \"Other\".", 700));
  nodes.push(Key("party"));
  nodes.push(Field("Representative Type", "लोकप्रतिनिधी प्रकार", "MultiSelect"));
  REPRESENTATIVES.forEach((s) => nodes.push(Opt(s)));
  nodes.push(Logic("Changing the type clears the Role selection.", 700));
  nodes.push(Key("representativeTypes[]"));
  nodes.push(Field("Role", "भूमिका", "MultiSelect"));
  nodes.push(Logic("Options are limited to the roles of the selected representative types; when nothing is selected, all roles are listed. Matching is done on both coop_role and social_role.", 700));
  nodes.push(Key("representativeRoles[]"));
  nodes.push(H3("Cascading roles per representative type"));
  REPRESENTATIVES.forEach((r) => {
    const roles = REPRESENTATIVE_ROLES[r] || [];
    if (roles.length) nodes.push(B(`${r} → ${roles.join(" · ")}`, 0, { size: 20 }));
  });
  nodes.push(Field("Organisation", "संस्था", "TextFilter"));
  nodes.push(Logic("Substring matching on both the social organisation name and the co-operative organisation name.", 700));
  nodes.push(Key("organisation"));
  nodes.push(Note("Position filters are applied per position entry: a single entry must satisfy all selected position conditions at the same time.", 500));
});

/* ---------- 11. BUSINESS ---------- */
group("11. Business & Entrepreneurship", "व्यवसाय / उद्योजक", { id: "biz", count: 7 }, () => {
  nodes.push(Field("Entrepreneur", "उद्योजक आहे का?", "TriSelect")); nodes.push(Key("entrepreneur"));
  nodes.push(Field("Business Type", "व्यवसाय प्रकार", "MultiSelect"));
  BUSINESS_TYPES.forEach((s) => nodes.push(Opt(s)));
  nodes.push(Logic("Matched against the business types of individual members as well as the free text of the entrepreneur / side-business description.", 700));
  nodes.push(Key("bizTypes[]"));
  nodes.push(Field("Side Business", "जोड व्यवसाय", "TriSelect")); nodes.push(Key("sideBusiness"));
  nodes.push(Field("Loan Required", "कर्जाची आवश्यकता", "TriSelect"));
  nodes.push(Logic("\"Yes\" when any family member's business / self-employment details record a loan requirement.", 700));
  nodes.push(Key("loanRequired"));
  nodes.push(Field("Loan Amount Range (₹ lakh)", "कर्ज रक्कम (₹ लाख)", "RangeInput")); nodes.push(Key("loanMin / loanMax"));
  nodes.push(Field("Loan Purpose", "कर्जाचा उद्देश", "MultiSelect"));
  LOAN_PURPOSE_OPTIONS.forEach((s) => nodes.push(Opt(s)));
  nodes.push(Key("loanPurposes[]"));
});

/* ---------- 12. Master field index ---------- */
nodes.push(Br());
nodes.push(H1("12. Master Field Index"));
nodes.push(P([T("The table below lists every field of the Search & Filter section with its group, control type, data key and matching level — no field is omitted.", { size: 21 })], { after: 80 }));

const CW = [520, 2400, 1500, 1900, 3040];
const cell = (text, o = {}) => new TableCell({
  width: { size: o.w, type: WidthType.DXA },
  shading: o.fill ? { fill: o.fill, type: ShadingType.CLEAR } : undefined,
  margins: { top: 60, bottom: 60, left: 100, right: 100 },
  verticalAlign: VerticalAlign.TOP,
  borders: {
    top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
    left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
    right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
  },
  children: [P([T(text, { size: o.size ?? 18, bold: o.bold, color: o.color })], { after: 0 })],
});
const FIELD_INDEX = [
  ["loc", "State (राज्य)", "Select", "state", "Family level · exact"],
  ["loc", "District (जिल्हा)", "MultiSelect", "districts[]", "Family level · OR · exact"],
  ["loc", "Taluka (तालुका)", "MultiSelect", "talukas[]", "Depends on district · OR"],
  ["loc", "Village (गाव)", "MultiSelect", "villages[]", "Depends on taluka · OR"],
  ["loc", "Pincode (पिनकोड)", "MultiSelect", "pincodes[]", "Depends on village · OR"],
  ["fam", "Gender (लिंग)", "MultiSelect", "genders[]", "Person level · any person"],
  ["fam", "Age Group (वयोगट)", "MultiSelect", "ageGroups[]", "Person level · range"],
  ["fam", "Age Range (वय श्रेणी)", "RangeInput", "ageMin / ageMax", "Person level · age or dob"],
  ["fam", "Marital Status (वैवाहिक स्थिती)", "MultiSelect", "maritalStatuses[]", "Person level · exact"],
  ["fam", "Marriage Type (विवाहाचा प्रकार)", "MultiSelect", "marriageTypes[]", "Person level · contains"],
  ["fam", "Spouse Caste (जोडीदाराची जात)", "TextFilter", "spouseCaste", "Person level · contains"],
  ["fam", "Family Size (कुटुंब आकार)", "MultiSelect", "familySizes[]", "Family level · range"],
  ["fam", "Family Size Range", "RangeInput", "familyMin / familyMax", "Family level · numeric"],
  ["edu", "Level (शिक्षण स्तर)", "MultiSelect", "eduLevels[]", "Person level · exact"],
  ["edu", "Stream (शाखा / गट)", "MultiSelect", "eduStreams[]", "Depends on level"],
  ["edu", "Course (अभ्यासक्रम)", "MultiSelect", "eduCourses[]", "Depends on level + stream"],
  ["edu", "Institution Type (संस्था प्रकार)", "MultiSelect", "eduInstitutions[]", "Person level · exact"],
  ["occ", "Category (मुख्य श्रेणी)", "MultiSelect", "occCategories[]", "Person level · exact"],
  ["occ", "Employment Type (रोजगार प्रकार)", "MultiSelect", "employmentTypes[]", "Mapped from category"],
  ["occ", "Department (विभाग / संस्था)", "TextFilter", "department", "Contains across 8 sub-fields"],
  ["occ", "Designation (पदनाम)", "MultiSelect", "designations[]", "designation or rank"],
  ["occ", "Business Type (व्यवसाय प्रकार)", "MultiSelect", "occBusinessTypes[]", "businessType(s) / selfEmployedTypes"],
  ["agri", "Has Farmland (शेती आहे का?)", "TriSelect", "hasFarmland", "Family level · boolean"],
  ["agri", "Land Size (जमिनीचे क्षेत्र)", "MultiSelect", "landSizes[]", "Family level · exact"],
  ["agri", "Land Area Range (क्षेत्र श्रेणी)", "RangeInput", "landMin / landMax", "Irrigated + dryland acres"],
  ["agri", "Crop Season (हंगाम)", "MultiSelect", "cropSeasons[]", "crops[].season + season area"],
  ["agri", "Major Crop Type (प्रमुख पीक प्रकार)", "MultiSelect", "majorCropTypes[]", "OR · array contains"],
  ["agri", "Irrigation Source (सिंचन स्रोत)", "MultiSelect", "irrigationSources[]", "Source detail or list"],
  ["agri", "Pump Type (पंप प्रकार)", "MultiSelect", "pumpTypes[]", "Any irrigation source"],
  ["agri", "Kohli Malguzari Pond", "TriSelect", "malguzariPond", "pond.is_kohli_malguzari"],
  ["agri", "Free Irrigation Water", "TriSelect", "freeWater", "Any source"],
  ["agri", "Farming Type (शेतीचा प्रकार)", "MultiSelect", "farmingTypes[]", "From member occupation details"],
  ["agri", "Equipment (शेती साधने)", "MultiSelect", "farmingTools[]", "6 equipment keys"],
  ["agri", "Ownership (साधन मालकी)", "Select", "toolOwnership", "own / not_own"],
  ["agri", "Want to Buy", "TriSelect", "toolWantBuy", "Equipment detail want_to_buy"],
  ["agri", "Loan Needed (equipment)", "TriSelect", "toolLoan", "Equipment detail needs_loan"],
  ["agri", "Contract / Share Farming", "TriSelect", "contractFarming", "farm_management"],
  ["agri", "Contract Area", "RangeInput", "contractMin / contractMax", "Acre value"],
  ["house", "Own House (स्वतःचे घर?)", "TriSelect", "ownsHouse", "Family level"],
  ["house", "House Type (घराचा प्रकार)", "MultiSelect", "houseTypes[]", "exact"],
  ["house", "Living Status (निवास स्थिती)", "MultiSelect", "livingStatuses[]", "exact"],
  ["house", "Gharkul Received", "TriSelect", "gharkulReceived", "boolean"],
  ["house", "Gharkul Required", "TriSelect", "gharkulWanted", "boolean"],
  ["house", "Solar Installed", "TriSelect", "solarInstalled", "boolean"],
  ["house", "Solar Required", "TriSelect", "solarWanted", "boolean"],
  ["house", "Household Assets (घरगुती वस्तू)", "MultiSelect", "assets[]", "AND — all assets must exist"],
  ["house", "Minimum Quantity", "Select 1+…10+", "assetMinQty", "Per selected asset"],
  ["ben", "Ladki Bahin Beneficiary", "TriSelect", "ladkiBahin", "benefits_info"],
  ["ben", "Payment Regular", "TriSelect", "ladkiBahinRegular", "benefits_info"],
  ["ben", "Reason (कारण)", "MultiSelect", "ladkiBahinReasons[]", "Reasons from both lists"],
  ["ben", "Critical Illness (गंभीर आजार)", "TriSelect", "criticalIllness", "benefits_info"],
  ["ben", "Medical Aid Needed", "TriSelect", "medicalAidNeeded", "benefits_info"],
  ["ben", "Sportsperson (खेळाडू)", "TriSelect", "hasSportsperson", "benefits_info"],
  ["ben", "Sport Level (स्तर)", "MultiSelect", "sportLevels[]", "contains"],
  ["ben", "Sport Type (खेळाचा प्रकार)", "TextFilter", "sportType", "contains"],
  ["pos", "Has Position (पद आहे का?)", "TriSelect", "hasPosition", "Family level"],
  ["pos", "Position Type (पदाचा प्रकार)", "MultiSelect", "positionTypes[]", "Position entry level"],
  ["pos", "Current / Former (आजी / माजी)", "MultiSelect", "positionStatuses[]", "Position entry level"],
  ["pos", "Political Level (राजकीय स्तर)", "MultiSelect", "politicalLevels[]", "Position entry level"],
  ["pos", "Party (पक्ष)", "TextFilter", "party", "party_name + other"],
  ["pos", "Representative Type", "MultiSelect", "representativeTypes[]", "Position entry level"],
  ["pos", "Role (भूमिका)", "MultiSelect", "representativeRoles[]", "Depends on type"],
  ["pos", "Organisation (संस्था)", "TextFilter", "organisation", "social_org + coop_org_name"],
  ["biz", "Entrepreneur (उद्योजक)", "TriSelect", "entrepreneur", "employment_info"],
  ["biz", "Business Type (व्यवसाय प्रकार)", "MultiSelect", "bizTypes[]", "Members + description text"],
  ["biz", "Side Business (जोड व्यवसाय)", "TriSelect", "sideBusiness", "employment_info"],
  ["biz", "Loan Required (कर्जाची आवश्यकता)", "TriSelect", "loanRequired", "Any person"],
  ["biz", "Loan Amount (कर्ज रक्कम)", "RangeInput", "loanMin / loanMax", "₹ lakh range"],
  ["biz", "Loan Purpose (कर्जाचा उद्देश)", "MultiSelect", "loanPurposes[]", "contains"],
];
const headerRow = new TableRow({
  tableHeader: true,
  children: ["#", "Filter field", "Control", "data key", "Matching level / rule"].map((h, i) =>
    cell(h, { w: CW[i], fill: "DBEAFE", bold: true, color: C.primary, size: 19 })),
});
nodes.push(new Table({
  width: { size: 9360, type: WidthType.DXA },
  columnWidths: CW,
  rows: [headerRow, ...FIELD_INDEX.map((r, i) => new TableRow({
    children: [
      cell(String(i + 1), { w: CW[0] }),
      cell(r[1], { w: CW[1], bold: true, color: C.text }),
      cell(r[2], { w: CW[2], color: C.muted }),
      cell(r[3], { w: CW[3], color: C.violet }),
      cell(r[4], { w: CW[4], color: C.amber }),
    ],
  }))],
}));
nodes.push(P([T(`Total ${FIELD_INDEX.length} filter fields + 1 quick-search bar = the complete Search & Filter section.`, { bold: true, size: 21, color: C.green })], { before: 120 }));

/* ---------- Education full tree ---------- */
nodes.push(Br());
nodes.push(H1("13. Appendix A — Complete Education Options Tree"));
nodes.push(P([T("Every option available across the three cascading MultiSelect fields of the Education group: Level → Stream → Course.", { size: 20, color: C.muted })], { after: 80 }));
EDUCATION_TREE.forEach((l) => {
  nodes.push(H2(l.level));
  l.streams.forEach((s) => {
    nodes.push(H3(s.stream === "—" ? "No stream" : s.stream));
    if (!s.courses || s.courses.length === 0) nodes.push(Opt("No course list", 700));
    else s.courses.forEach((c) => nodes.push(Opt(c, 700)));
  });
});

/* ---------- Behaviour ---------- */
nodes.push(Br());
nodes.push(H1("14. Appendix B — Section Behaviour"));
[
  "The filters are fully client-side — results change instantly without any additional query.",
  "The count shown in the section heading is: records remaining after filtering / total records.",
  "Excel and PDF exports always operate on the filtered set — what you see is what gets exported.",
  "The three per-record actions (View / Edit / PDF) keep working unchanged after filtering.",
  "Data is already restricted by the user's access scope (district / taluka / village); the filters narrow down that permitted data further.",
  "The search box inside each MultiSelect exists to find options quickly in long lists such as designations and courses.",
  "Reset: on the main page it clears all 9 groups; inside a dashboard section panel it clears only the groups shown in that panel.",
].forEach((s) => nodes.push(B(s, 0, { size: 21 })));

/* ---------- Reuse ---------- */
nodes.push(Br());
nodes.push(H1("15. Group Reuse & Active Count"));
nodes.push(P([T("The same filter panel is reused section-by-section inside Dashboard 2 and Dashboard 3 — there only the relevant groups are rendered and \"Reset\" clears just those groups' fields.", { size: 21 })], { after: 60 }));
[
  "loc — Location: state, districts, talukas, villages, pincodes",
  "fam — Family: genders, ageGroups, ageMin/Max, maritalStatuses, marriageTypes, spouseCaste, familySizes, familyMin/Max",
  "edu — Education: eduLevels, eduStreams, eduCourses, eduInstitutions",
  "occ — Occupation: occCategories, employmentTypes, department, designations, occBusinessTypes",
  "agri — Agriculture: hasFarmland, landSizes, landMin/Max, cropSeasons, majorCropTypes, irrigationSources, pumpTypes, malguzariPond, freeWater, farmingTypes, farmingTools, toolOwnership, toolWantBuy, toolLoan, contractFarming, contractMin/Max",
  "house — House & Assets: ownsHouse, houseTypes, livingStatuses, gharkulReceived, gharkulWanted, solarInstalled, solarWanted, assets, assetMinQty",
  "ben — Benefits: ladkiBahin, ladkiBahinRegular, ladkiBahinReasons, criticalIllness, medicalAidNeeded, hasSportsperson, sportLevels, sportType",
  "pos — Positions: hasPosition, positionTypes, positionStatuses, politicalLevels, party, representativeTypes, representativeRoles, organisation",
  "biz — Business: entrepreneur, bizTypes, sideBusiness, loanRequired, loanMin/Max, loanPurposes",
].forEach((s) => nodes.push(B(s, 0, { size: 20 })));
nodes.push(Note("Active filter count: each filled field counts as 1. The badge on a group heading shows the active fields of that group; the badge at the top shows the overall active count.", 500));

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
const out = "/mnt/documents/All-Surveys-Search-and-Filter-Complete-Structure_EN.docx";
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, buf);
console.log("Wrote", out, buf.length, "bytes");
