// Generates a detailed Word doc for "शोध व फिल्टर" (Search & Filter) of सर्व सर्वेक्षणे.
// Usage: bun scripts/generate-filter-doc.mjs

import fs from "node:fs";
import path from "node:path";
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  PageOrientation, LevelFormat, PageBreak, BorderStyle,
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
  P([T("कोहळी समाज विकास मंडळ, नागपूर", { bold: true, size: 40, color: C.primary })],
    { alignment: AlignmentType.CENTER, before: 900, after: 120 }),
  P([T("सर्व सर्वेक्षणे — शोध व फिल्टर", { bold: true, size: 34, color: C.accent })],
    { alignment: AlignmentType.CENTER, after: 60 }),
  P([T("All Surveys — Search & Filter : Complete Structure", { size: 24, color: C.en })],
    { alignment: AlignmentType.CENTER, after: 300 }),
  P([T("९ फिल्टर गट · ८० हून अधिक फिल्टर fields · प्रत्येक पर्याय, वर्तन व जुळणी नियम", { italics: true, size: 22 })],
    { alignment: AlignmentType.CENTER, after: 40 }),
  P([T("9 filter groups · 80+ filter fields · every option, behaviour and matching rule", { italics: true, size: 20, color: C.muted })],
    { alignment: AlignmentType.CENTER, after: 200 }),
  P([T(`Generated: ${new Date().toISOString().slice(0, 10)}`, { color: C.muted, size: 18 })],
    { alignment: AlignmentType.CENTER }),
  Br(),
);

/* ---------- Colour key ---------- */
nodes.push(H1("रंग संकेत (Colour Key)"));
[
  ["गडद निळा — मुख्य विभाग / फिल्टर गट (Main section / filter group)", C.primary],
  ["हिरवट निळा — फिल्टर field चे नाव (Filter field label)", C.accent],
  ["निळा — इंग्रजी नाव (English label)", C.en],
  ["जांभळा — उप-गट व data key (Sub-group & data key)", C.violet],
  ["करडा — field प्रकार व पर्याय (Field type & options)", C.muted],
  ["केशरी ↳ — जुळणी नियम / cascading logic (Matching rule)", C.amber],
  ["हिरवा ★ — महत्त्वाची टीप (Important note)", C.green],
].forEach(([t, col]) => nodes.push(B(t, 0, { size: 21, color: col, bold: true })));

/* ---------- 1. Overview ---------- */
nodes.push(H1("१. आढावा (Overview)"));
nodes.push(P([T("\"सर्व सर्वेक्षणे\" पानावरील \"शोध व फिल्टर\" कार्डात दोन स्तर आहेत: (१) मुक्त शोध पट्टी आणि (२) ९ गटांचा प्रगत फिल्टर accordion. दोन्ही client-side वर, लोड झालेल्या rows वर लागू होतात — त्यामुळे निकाल तात्काळ दिसतो.", { size: 21 })], { after: 40 }));
nodes.push(P([T("The Search & Filter card has two layers: (1) a free-text search bar, and (2) an advanced filter accordion of 9 groups. Both run client-side on the loaded rows, so results update instantly.", { size: 20, color: C.muted })], { after: 100 }));

nodes.push(H3("नियंत्रण प्रकार (Control Types)"));
[
  "MultiSelect — popover + शोध पट्टी + checkbox यादी. बटणावर \"सर्व\" / निवडलेला पर्याय / \"N निवडले\" दिसते. \"निवड रद्द करा\" ने सर्व निवड मोकळी.",
  "TriSelect — तीन स्थिती dropdown: सर्व (रिकामे) / होय / नाही. \"नाही\" = मूल्य true नाही (null सह).",
  "RangeInput — किमान व कमाल दोन संख्यात्मक inputs; एकच भरले तरी चालते.",
  "TextFilter — मुक्त लेखन; case-insensitive \"contains\" जुळणी.",
  "Select — एकच पर्याय (राज्य, साधन मालकी, वस्तू किमान संख्या).",
].forEach((s) => nodes.push(B(s, 0, { size: 21 })));

nodes.push(H3("जुळणीचे सामान्य नियम (General Matching Rules)"));
[
  "रिकामे field = कोणतेही निर्बंध नाहीत (सर्व नोंदी पास).",
  "एका field मधील अनेक निवडी = OR (कोणतीही एक जुळली तरी पुरे).",
  "वेगवेगळी fields = AND (सर्व अटी एकाच वेळी पूर्ण व्हाव्यात).",
  "व्यक्तिगत fields (लिंग, वय, वैवाहिक, शिक्षण, व्यवसाय) कुटुंब प्रमुख + सर्व सदस्य यांच्यावर तपासली जातात; किमान एक व्यक्ती सर्व व्यक्तिगत अटी पूर्ण करत असेल तर कुटुंब निवडले जाते.",
  "फिल्टर गटाच्या शीर्षकावर सक्रिय fields ची संख्या badge मध्ये दिसते; वरील \"रीसेट\" सर्व फिल्टर मोकळे करते.",
].forEach((s) => nodes.push(B(s, 0, { size: 21 })));

/* ---------- 2. Quick search ---------- */
nodes.push(H1("२. मुक्त शोध पट्टी (Quick Search Bar)"));
nodes.push(Field("शोध", "Search", "Text input"));
nodes.push(P([T("placeholder: \"नाव / मोबाईल / गाव / तालुका / जिल्हा / पिनकोड शोधा...\"", { color: C.muted, size: 20 })], { indent: { left: 700 }, after: 30 }));
[
  "कुटुंब प्रमुखाचे नाव (head_name)",
  "मोबाईल क्रमांक (mobile)",
  "गाव (village)",
  "तालुका (taluka)",
  "जिल्हा (district)",
  "पिनकोड (pincode)",
].forEach((s) => nodes.push(Opt(s, 700)));
nodes.push(Logic("जुळणी: case-insensitive substring; कोणत्याही एका क्षेत्रात मजकूर सापडला तरी नोंद दिसते. प्रगत फिल्टरसह AND प्रमाणे लागू होते.", 500));

/* ---------- helper to render a group ---------- */
function group(title, en, keys, blocks) {
  nodes.push(H1(title + (en ? ` (${en})` : "")));
  nodes.push(P([T("गट id: ", { color: C.muted, size: 19 }), T(keys.id, { color: C.violet, bold: true, size: 19 }),
    T("   ·   fields: ", { color: C.muted, size: 19 }), T(String(keys.count), { color: C.violet, bold: true, size: 19 })], { after: 60 }));
  blocks();
}

/* ---------- 3. LOCATION ---------- */
group("३. स्थान", "Location", { id: "loc", count: 5 }, () => {
  nodes.push(Field("राज्य", "State", "Select (एक)"));
  nodes.push(Opt("सर्व राज्ये (डिफॉल्ट)"));
  STATES.forEach((s) => nodes.push(Opt(s)));
  nodes.push(Key("state"));

  nodes.push(Field("जिल्हा", "District", "MultiSelect"));
  nodes.push(Logic("पर्याय डेटामधून स्वयंचलित (loaded surveys मधील unique जिल्हे, मराठी क्रमाने).", 700));
  nodes.push(Logic("जिल्हा बदलल्यास तालुका, गाव व पिनकोड निवडी रिकाम्या होतात.", 700));
  nodes.push(Key("districts[]"));

  nodes.push(Field("तालुका", "Taluka", "MultiSelect"));
  nodes.push(Logic("फक्त निवडलेल्या जिल्ह्यांतील तालुके दिसतात. बदलल्यास गाव व पिनकोड रिकामे.", 700));
  nodes.push(Key("talukas[]"));

  nodes.push(Field("गाव", "Village", "MultiSelect"));
  nodes.push(Logic("निवडलेल्या जिल्हा + तालुक्यानुसार गाळलेले. बदलल्यास पिनकोड रिकामा.", 700));
  nodes.push(Key("villages[]"));

  nodes.push(Field("पिनकोड", "Pincode", "MultiSelect"));
  nodes.push(Logic("जिल्हा → तालुका → गाव या साखळीनुसार गाळलेले पिनकोड.", 700));
  nodes.push(Key("pincodes[]"));
  nodes.push(Note("स्थान फिल्टर कुटुंब-स्तरीय आहेत (survey row वरील थेट columns).", 500));
});

/* ---------- 4. FAMILY ---------- */
group("४. कुटुंब व लोकसंख्याशास्त्र", "Family & Demographics", { id: "fam", count: 8 }, () => {
  nodes.push(Field("लिंग", "Gender", "MultiSelect"));
  GENDER_OPTS.forEach((g) => nodes.push(Opt(g)));
  nodes.push(Key("genders[]"));

  nodes.push(Field("वयोगट", "Age Group", "MultiSelect"));
  AGE_GROUPS.forEach((g) => nodes.push(Opt(`${g.label} — ${g.min} ते ${g.max === 200 ? "∞" : g.max}`)));
  nodes.push(Key("ageGroups[]"));

  nodes.push(Field("वय श्रेणी", "Age Range", "RangeInput (किमान – कमाल)"));
  nodes.push(Logic("वय थेट age field मधून; रिकामे असल्यास जन्मतारखेवरून (dob) गणना केली जाते.", 700));
  nodes.push(Key("ageMin / ageMax"));

  nodes.push(Field("वैवाहिक स्थिती", "Marital Status", "MultiSelect"));
  MARITAL.forEach((m) => nodes.push(Opt(m)));
  nodes.push(Key("maritalStatuses[]"));

  nodes.push(Field("विवाहाचा प्रकार", "Marriage Type", "MultiSelect"));
  MARRIAGE_TYPES.forEach((m) => nodes.push(Opt(m)));
  nodes.push(Key("marriageTypes[]"));

  nodes.push(Field("जोडीदाराची जात", "Spouse Caste", "TextFilter"));
  nodes.push(Logic("substring जुळणी; आंतरजातीय विवाहात नोंदवलेल्या जातीवर लागू.", 700));
  nodes.push(Key("spouseCaste"));

  nodes.push(Field("कुटुंब आकार", "Family Size", "MultiSelect"));
  FAMILY_SIZES.forEach((g) => nodes.push(Opt(`${g.label} — ${g.min}–${g.max === 999 ? "∞" : g.max}`)));
  nodes.push(Key("familySizes[]"));

  nodes.push(Field("कुटुंब आकार श्रेणी", "Family Size Range", "RangeInput"));
  nodes.push(Logic("आकार = कुटुंब प्रमुख (१) + सदस्यांची संख्या.", 700));
  nodes.push(Key("familyMin / familyMax"));
});

/* ---------- 5. EDUCATION ---------- */
nodes.push(Br());
group("५. शिक्षण", "Education", { id: "edu", count: 4 }, () => {
  nodes.push(Field("शिक्षण स्तर", "Level", "MultiSelect"));
  EDUCATION_TREE.forEach((l) => nodes.push(Opt(l.level)));
  nodes.push(Logic("स्तर बदलल्यास शाखा व अभ्यासक्रम निवडी रिकाम्या होतात.", 700));
  nodes.push(Key("eduLevels[]"));

  nodes.push(Field("शाखा / गट", "Stream", "MultiSelect"));
  nodes.push(Logic("पर्याय फक्त निवडलेल्या स्तरांतील शाखा (\"—\" वगळून). बदलल्यास अभ्यासक्रम रिकामा.", 700));
  nodes.push(Key("eduStreams[]"));
  nodes.push(H3("स्तरनिहाय उपलब्ध शाखा"));
  EDUCATION_TREE.forEach((l) => {
    const st = l.streams.map((s) => s.stream).filter((s) => s !== "—");
    if (st.length) nodes.push(B(`${l.level} → ${st.join(" · ")}`, 0, { size: 20 }));
  });

  nodes.push(Field("अभ्यासक्रम", "Course", "MultiSelect"));
  nodes.push(Logic("स्तर + शाखा साखळीनुसार गाळलेले अभ्यासक्रम.", 700));
  nodes.push(Key("eduCourses[]"));

  nodes.push(Field("संस्था प्रकार", "Institution Type", "MultiSelect"));
  INSTITUTION_TYPES.forEach((i) => nodes.push(Opt(i)));
  nodes.push(Key("eduInstitutions[]"));
  nodes.push(Note("शिक्षण फिल्टर व्यक्तिगत आहेत — कुटुंबातील कोणत्याही एका व्यक्तीचे शिक्षण जुळल्यास कुटुंब निवडले जाते.", 500));
});

/* ---------- 6. OCCUPATION ---------- */
nodes.push(Br());
group("६. नौकरी / व्यवसाय", "Occupation", { id: "occ", count: 5 }, () => {
  nodes.push(Field("मुख्य श्रेणी", "Category", "MultiSelect"));
  PRIMARY_CATEGORIES.forEach((c) => nodes.push(Opt(c)));
  nodes.push(Key("occCategories[]"));

  nodes.push(Field("रोजगार प्रकार", "Employment Type", "MultiSelect"));
  EMPLOYMENT_TYPES.forEach((c) => nodes.push(Opt(c)));
  nodes.push(Logic("मुख्य श्रेणीवरून अंतर्गत नकाशाद्वारे रोजगार प्रकार ठरतो (उदा. शेतकरी → शेती, सरकारी कर्मचारी → सरकारी).", 700));
  nodes.push(Key("employmentTypes[]"));

  nodes.push(Field("विभाग / संस्था", "Department", "TextFilter"));
  nodes.push(Logic("पुढील उप-fields मध्ये substring शोध: संस्था प्रकार, संस्था स्तर, शाखा (engineering), दल (defence), बँक प्रकार, क्षेत्र, रुग्णालय प्रकार, सेवा प्रकार.", 700));
  nodes.push(Key("department"));

  nodes.push(Field("पदनाम", "Designation", "MultiSelect"));
  nodes.push(Logic("यादी सर्व क्षेत्रांतील पदनाम व रँक एकत्र करून बनते; जुळणी designation किंवा rank वर.", 700));
  nodes.push(Key("designations[]"));
  const desGroups = [
    ["सरकारी वर्गनिहाय", uniq(Object.values(GOVT_CLASS_DESIGNATIONS).flat())],
    ["शिक्षण क्षेत्र (स्तरनिहाय)", uniq(Object.values(EDU_DESIGNATIONS_BY_LEVEL).flat())],
    ["वैद्यकीय क्षेत्र", MED_DESIGNATIONS],
    ["महिला व बाल विकास", WCD_DESIGNATIONS],
    ["अभियांत्रिकी", ENG_DESIGNATIONS],
    ["बँकिंग व वित्त", BANK_DESIGNATIONS],
    ["न्यायव्यवस्था", JUDICIARY_DESIGNATIONS],
    ["सैन्य दल रँक", MILITARY_RANKS],
    ["पोलीस रँक", POLICE_RANKS],
    ["केंद्रीय सशस्त्र दल रँक", CENTRAL_ARMED_FORCES_RANKS],
  ];
  desGroups.forEach(([t, list]) => {
    nodes.push(H3(`पदनाम स्रोत — ${t} (${list.length})`));
    list.forEach((d) => nodes.push(Opt(d, 700)));
  });

  nodes.push(Field("व्यवसाय प्रकार", "Business Type", "MultiSelect"));
  nodes.push(Logic("यादी = व्यवसाय प्रकार + स्वरोजगार कौशल्ये एकत्र. जुळणी businessType, businessTypes[] किंवा selfEmployedTypes[] वर.", 700));
  nodes.push(Key("occBusinessTypes[]"));
  nodes.push(H3("व्यवसाय प्रकार (Business Owner)"));
  BUSINESS_TYPES.forEach((b) => nodes.push(Opt(b, 700)));
  nodes.push(H3("स्वरोजगार कौशल्ये (Self Employed)"));
  SELF_EMPLOYED_TYPES.forEach((b) => nodes.push(Opt(b, 700)));
});

/* ---------- 7. AGRICULTURE ---------- */
nodes.push(Br());
group("७. शेती", "Agriculture", { id: "agri", count: 18 }, () => {
  nodes.push(Field("शेती आहे का?", "Has Farmland", "TriSelect (सर्व / होय / नाही)"));
  nodes.push(Key("hasFarmland"));

  nodes.push(Field("जमिनीचे क्षेत्र", "Land Size", "MultiSelect"));
  LAND_SIZES.forEach((l) => nodes.push(Opt(l)));
  nodes.push(Key("landSizes[]"));

  nodes.push(Field("क्षेत्र श्रेणी (एकर)", "Land Area Range", "RangeInput"));
  nodes.push(Logic("गणना: बागायती क्षेत्र + कोरडवाहू क्षेत्र; दोन्ही रिकामे असल्यास एकूण शेतजमिनीतील संख्या वापरली जाते.", 700));
  nodes.push(Key("landMin / landMax"));

  nodes.push(Field("हंगाम", "Crop Season", "MultiSelect"));
  ["खरीप", "रब्बी (धान सोडून)", "उन्हाळी (धानासह)"].forEach((s) => nodes.push(Opt(s)));
  nodes.push(Logic("जुळणी crops[].season वर, तसेच खरीप / रब्बी / उन्हाळी क्षेत्र भरलेले असल्यास तो हंगाम गृहीत धरला जातो.", 700));
  nodes.push(Key("cropSeasons[]"));

  nodes.push(Field("प्रमुख पीक प्रकार", "Major Crop Type", "MultiSelect"));
  MAJOR_CROP_TYPES.forEach((s) => nodes.push(Opt(s)));
  nodes.push(Key("majorCropTypes[]"));

  nodes.push(Field("सिंचन स्रोत", "Irrigation Source", "MultiSelect"));
  IRRIGATION_KEYS.forEach((i) => nodes.push(Opt(`${i.label}   [key: ${i.key}]`)));
  nodes.push(Logic("स्रोत निवडल्यास त्याचा तपशील (संख्या / इलेक्ट्रिक / सोलर) भरलेला असावा, किंवा तो स्रोत यादीत निवडलेला असावा.", 700));
  nodes.push(Key("irrigationSources[]"));

  nodes.push(Field("पंप प्रकार", "Pump Type", "MultiSelect"));
  PUMP_TYPES.forEach((s) => nodes.push(Opt(s)));
  nodes.push(Logic("कोणत्याही एका सिंचन स्रोतावर संबंधित पंप (electric / solar) खरे असल्यास जुळते.", 700));
  nodes.push(Key("pumpTypes[]"));

  nodes.push(Field("कोहळी मालगुजारी तलाव", "Kohli Malguzari Pond", "TriSelect"));
  nodes.push(Logic("फक्त तलाव (pond) स्रोताच्या is_kohli_malguzari मूल्यावर तपासले जाते.", 700));
  nodes.push(Key("malguzariPond"));

  nodes.push(Field("मोफत सिंचन पाणी", "Free Water for Irrigation", "TriSelect"));
  nodes.push(Logic("कोणत्याही स्रोतावर water_free_for_irrigation = होय असल्यास \"होय\" जुळते.", 700));
  nodes.push(Key("freeWater"));

  nodes.push(Field("शेतीचा प्रकार", "Farming Type", "MultiSelect"));
  FARMING_TYPES.forEach((s) => nodes.push(Opt(s)));
  nodes.push(Logic("कुटुंबातील कोणत्याही व्यक्तीच्या व्यवसाय तपशिलातील शेती प्रकारांवर जुळणी.", 700));
  nodes.push(Key("farmingTypes[]"));

  nodes.push(Field("शेती साधने", "Equipment", "MultiSelect"));
  TOOL_KEYS.forEach((t) => nodes.push(Opt(`${t.label}   [key: ${t.key}]`)));
  nodes.push(Key("farmingTools[]"));

  nodes.push(Field("साधन मालकी", "Ownership", "Select"));
  ["सर्व", "स्वतःचे आहे (own)", "नाही (not own)"].forEach((s) => nodes.push(Opt(s)));
  nodes.push(Key("toolOwnership"));

  nodes.push(Field("खरेदी करण्याची इच्छा?", "Want to Buy", "TriSelect"));
  nodes.push(Key("toolWantBuy"));
  nodes.push(Field("कर्जाची आवश्यकता? (साधनांसाठी)", "Equipment Loan Needed", "TriSelect"));
  nodes.push(Key("toolLoan"));
  nodes.push(Logic("साधन फिल्टर एकत्र काम करतात: निवडलेल्या साधनांपैकी किमान एक साधन मालकी + खरेदी इच्छा + कर्ज या तिन्ही अटी पूर्ण करत असावे. साधन निवडले पण इतर अटी रिकाम्या असल्यास \"ते साधन आहे\" असे गृहीत धरले जाते. कोणतेही साधन निवडले नसल्यास सर्व सहा साधनांवर तपासणी होते.", 500));

  nodes.push(Field("ठेका / बटाई शेती", "Contract / Share Farming", "TriSelect"));
  nodes.push(Key("contractFarming"));
  nodes.push(Field("ठेका / बटाई क्षेत्र (एकर)", "Contract Area Range", "RangeInput"));
  nodes.push(Key("contractMin / contractMax"));
});

/* ---------- 8. HOUSE ---------- */
nodes.push(Br());
group("८. घर व मालमत्ता", "House & Assets", { id: "house", count: 9 }, () => {
  nodes.push(Field("स्वतःचे घर?", "Own House", "TriSelect")); nodes.push(Key("ownsHouse"));
  nodes.push(Field("घराचा प्रकार", "House Type", "MultiSelect"));
  HOUSE_TYPES.forEach((s) => nodes.push(Opt(s)));
  nodes.push(Key("houseTypes[]"));
  nodes.push(Field("निवास स्थिती", "Living Status", "MultiSelect"));
  LIVING_STATUS.forEach((s) => nodes.push(Opt(s)));
  nodes.push(Key("livingStatuses[]"));
  nodes.push(Field("घरकुल लाभ मिळाला?", "Gharkul Received", "TriSelect")); nodes.push(Key("gharkulReceived"));
  nodes.push(Field("घरकुल आवश्यक?", "Gharkul Wanted", "TriSelect")); nodes.push(Key("gharkulWanted"));
  nodes.push(Field("सोलर बसविले?", "Solar Installed", "TriSelect")); nodes.push(Key("solarInstalled"));
  nodes.push(Field("सोलर आवश्यक?", "Solar Wanted", "TriSelect")); nodes.push(Key("solarWanted"));
  nodes.push(Field("घरगुती वस्तू", "Household Assets", "MultiSelect"));
  HOUSEHOLD_ITEMS.forEach((s) => nodes.push(Opt(s)));
  nodes.push(Logic("येथे AND जुळणी — निवडलेल्या सर्व वस्तू कुटुंबाकडे असाव्यात.", 700));
  nodes.push(Key("assets[]"));
  nodes.push(Field("वस्तू किमान संख्या", "Min Quantity", "Select (1+ ते 10+)"));
  nodes.push(Logic("निवडलेल्या प्रत्येक वस्तूची संख्या या मूल्याइतकी किंवा अधिक असावी; संख्या नोंद नसल्यास १ गृहीत.", 700));
  nodes.push(Key("assetMinQty"));
});

/* ---------- 9. BENEFITS ---------- */
group("९. लाभ / सहाय्य", "Benefits", { id: "ben", count: 8 }, () => {
  nodes.push(Field("लाडकी बहीण लाभार्थी", "Ladki Bahin Beneficiary", "TriSelect")); nodes.push(Key("ladkiBahin"));
  nodes.push(Field("लाभ नियमित मिळतो?", "Payment Regular", "TriSelect")); nodes.push(Key("ladkiBahinRegular"));
  nodes.push(Field("कारण", "Reason", "MultiSelect"));
  LADKI_BAHIN_REASONS.forEach((s) => nodes.push(Opt(s)));
  nodes.push(Logic("लाभार्थी व अलाभार्थी दोन्ही याद्यांतील कारणांवर जुळणी.", 700));
  nodes.push(Key("ladkiBahinReasons[]"));
  nodes.push(Field("गंभीर आजार", "Critical Illness", "TriSelect")); nodes.push(Key("criticalIllness"));
  nodes.push(Field("वैद्यकीय मदत आवश्यक?", "Medical Aid Needed", "TriSelect")); nodes.push(Key("medicalAidNeeded"));
  nodes.push(Field("खेळाडू आहे का?", "Sportsperson", "TriSelect")); nodes.push(Key("hasSportsperson"));
  nodes.push(Field("स्तर", "Sport Level", "MultiSelect"));
  SPORT_LEVELS.forEach((s) => nodes.push(Opt(s)));
  nodes.push(Key("sportLevels[]"));
  nodes.push(Field("खेळाचा प्रकार", "Sport Type", "TextFilter")); nodes.push(Key("sportType"));
});

/* ---------- 10. POSITION ---------- */
nodes.push(Br());
group("१०. धारण केलेले पद", "Position", { id: "pos", count: 8 }, () => {
  nodes.push(Field("पद आहे का?", "Has Position", "TriSelect")); nodes.push(Key("hasPosition"));
  nodes.push(Field("पदाचा प्रकार", "Position Type", "MultiSelect"));
  POSITION_TYPES.forEach((s) => nodes.push(Opt(s)));
  nodes.push(Key("positionTypes[]"));
  nodes.push(Field("आजी / माजी", "Status", "MultiSelect"));
  POSITION_STATUS.forEach((s) => nodes.push(Opt(s)));
  nodes.push(Key("positionStatuses[]"));
  nodes.push(Field("राजकीय स्तर", "Political Level", "MultiSelect"));
  POLITICAL_LEVELS.forEach((s) => nodes.push(Opt(s)));
  nodes.push(Key("politicalLevels[]"));
  nodes.push(Field("पक्ष", "Party", "TextFilter"));
  nodes.push(Logic("पक्षाचे नाव व \"इतर\" मध्ये लिहिलेले नाव — दोन्हीवर substring जुळणी.", 700));
  nodes.push(Key("party"));
  nodes.push(Field("लोकप्रतिनिधी प्रकार", "Representative Type", "MultiSelect"));
  REPRESENTATIVES.forEach((s) => nodes.push(Opt(s)));
  nodes.push(Logic("प्रकार बदलल्यास \"भूमिका\" निवड रिकामी होते.", 700));
  nodes.push(Key("representativeTypes[]"));
  nodes.push(Field("भूमिका", "Role", "MultiSelect"));
  nodes.push(Logic("पर्याय निवडलेल्या लोकप्रतिनिधी प्रकारांच्या भूमिकांपुरते मर्यादित; काहीच निवडले नसल्यास सर्व भूमिका दिसतात. जुळणी coop_role व social_role दोन्हीवर.", 700));
  nodes.push(Key("representativeRoles[]"));
  nodes.push(H3("प्रकारनिहाय भूमिका (Cascading Roles)"));
  REPRESENTATIVES.forEach((r) => {
    const roles = REPRESENTATIVE_ROLES[r] || [];
    if (roles.length) nodes.push(B(`${r} → ${roles.join(" · ")}`, 0, { size: 20 }));
  });
  nodes.push(Field("संस्था", "Organisation", "TextFilter"));
  nodes.push(Logic("सामाजिक संस्था व सहकारी संस्थेचे नाव — दोन्हीवर substring जुळणी.", 700));
  nodes.push(Key("organisation"));
  nodes.push(Note("पद फिल्टर प्रत्येक पद-नोंदीवर लागू होतात: एका नोंदीने सर्व निवडलेल्या पद-अटी एकाच वेळी पूर्ण कराव्यात.", 500));
});

/* ---------- 11. BUSINESS ---------- */
group("११. व्यवसाय / उद्योजक", "Business", { id: "biz", count: 7 }, () => {
  nodes.push(Field("उद्योजक आहे का?", "Entrepreneur", "TriSelect")); nodes.push(Key("entrepreneur"));
  nodes.push(Field("व्यवसाय प्रकार", "Business Type", "MultiSelect"));
  BUSINESS_TYPES.forEach((s) => nodes.push(Opt(s)));
  nodes.push(Logic("जुळणी व्यक्तींच्या व्यवसाय प्रकारांवर, तसेच उद्योजक / जोड व्यवसाय वर्णनातील मजकुरावर.", 700));
  nodes.push(Key("bizTypes[]"));
  nodes.push(Field("जोड व्यवसाय", "Side Business", "TriSelect")); nodes.push(Key("sideBusiness"));
  nodes.push(Field("कर्जाची आवश्यकता", "Loan Required", "TriSelect"));
  nodes.push(Logic("कुटुंबातील कोणत्याही व्यक्तीच्या व्यवसाय / स्वरोजगार तपशिलात कर्ज आवश्यकता खरी असल्यास \"होय\".", 700));
  nodes.push(Key("loanRequired"));
  nodes.push(Field("कर्ज रक्कम (₹ लाख)", "Loan Amount Range", "RangeInput")); nodes.push(Key("loanMin / loanMax"));
  nodes.push(Field("कर्जाचा उद्देश", "Loan Purpose", "MultiSelect"));
  LOAN_PURPOSE_OPTIONS.forEach((s) => nodes.push(Opt(s)));
  nodes.push(Key("loanPurposes[]"));
});

/* ---------- 12. Reuse ---------- */
nodes.push(Br());
nodes.push(H1("१२. गटांचा पुनर्वापर व सक्रिय गणना (Group Reuse & Active Count)"));
nodes.push(P([T("हाच फिल्टर panel Dashboard 2 व Dashboard 3 मध्ये विभागनिहाय पुन्हा वापरला जातो — तेथे फक्त संबंधित गट दाखवले जातात आणि \"रीसेट\" फक्त त्या गटांची fields मोकळी करते.", { size: 21 })], { after: 60 }));
[
  "loc — स्थान: state, districts, talukas, villages, pincodes",
  "fam — कुटुंब: genders, ageGroups, ageMin/Max, maritalStatuses, marriageTypes, spouseCaste, familySizes, familyMin/Max",
  "edu — शिक्षण: eduLevels, eduStreams, eduCourses, eduInstitutions",
  "occ — व्यवसाय: occCategories, employmentTypes, department, designations, occBusinessTypes",
  "agri — शेती: hasFarmland, landSizes, landMin/Max, cropSeasons, majorCropTypes, irrigationSources, pumpTypes, malguzariPond, freeWater, farmingTypes, farmingTools, toolOwnership, toolWantBuy, toolLoan, contractFarming, contractMin/Max",
  "house — घर: ownsHouse, houseTypes, livingStatuses, gharkulReceived, gharkulWanted, solarInstalled, solarWanted, assets, assetMinQty",
  "ben — लाभ: ladkiBahin, ladkiBahinRegular, ladkiBahinReasons, criticalIllness, medicalAidNeeded, hasSportsperson, sportLevels, sportType",
  "pos — पद: hasPosition, positionTypes, positionStatuses, politicalLevels, party, representativeTypes, representativeRoles, organisation",
  "biz — व्यवसाय: entrepreneur, bizTypes, sideBusiness, loanRequired, loanMin/Max, loanPurposes",
].forEach((s) => nodes.push(B(s, 0, { size: 20 })));
nodes.push(Note("सक्रिय फिल्टर गणना: भरलेली प्रत्येक field = १. गट शीर्षकावरील badge त्या गटातील सक्रिय fields दाखवते; वरील badge एकूण सक्रिय संख्या दाखवते.", 500));

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
const out = "/mnt/documents/All-Surveys-Shodh-va-Filter-Complete-Structure.docx";
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, buf);
console.log("Wrote", out, buf.length, "bytes");
