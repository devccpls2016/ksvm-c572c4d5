/**
 * Analytics engine for the Community Survey Dashboard (Dashboard 2).
 * Pure data helpers — no UI. Works on raw `surveys` rows from the database.
 */

export type Row = any;
export type Datum = { name: string; value: number };

/* ------------------------------------------------------------------ utils */

export const num = (v: any): number => {
  if (typeof v === "number") return isFinite(v) ? v : 0;
  if (typeof v === "string") {
    const m = v.replace(/,/g, "").match(/-?\d+(\.\d+)?/);
    return m ? parseFloat(m[0]) : 0;
  }
  return 0;
};

export const txt = (v: any): string => (v == null ? "" : String(v).trim());

export const pct = (part: number, total: number) =>
  total > 0 ? Math.round((part / total) * 1000) / 10 : 0;

export function groupCount(arr: Row[], get: (r: Row) => string): Datum[] {
  const map: Record<string, number> = {};
  arr.forEach((r) => {
    const k = get(r) || "—";
    map[k] = (map[k] || 0) + 1;
  });
  return Object.entries(map)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function countMulti(arr: Row[], get: (r: Row) => string[]): Datum[] {
  const map: Record<string, number> = {};
  arr.forEach((r) => {
    (get(r) || []).forEach((k) => {
      const key = txt(k);
      if (!key) return;
      map[key] = (map[key] || 0) + 1;
    });
  });
  return Object.entries(map)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function uniq(arr: Row[], get: (r: Row) => string): string[] {
  const s = new Set<string>();
  arr.forEach((r) => {
    const v = get(r);
    if (v) s.add(v);
  });
  return [...s].sort();
}

/* ------------------------------------------------------- people flattening */

export type Person = {
  name: string;
  gender: string;
  age: number | null;
  marital_status: string;
  marriage_type: string;
  spouse_caste: string;
  education: string;
  occupation: string;
  job_type: string;
  relationship: string;
  isHead: boolean;
  bachat_gat?: any;
  row: Row;
};

export function personsOf(r: Row): Person[] {
  const head: Person = {
    name: txt(r.head_name),
    gender: txt(r.gender),
    age: typeof r.age === "number" ? r.age : r.age ? num(r.age) : null,
    marital_status: txt(r.marital_status),
    marriage_type: txt(r.marriage_type),
    spouse_caste: txt(r.spouse_caste),
    education: txt(r.education),
    occupation: txt(r.occupation),
    job_type: "",
    relationship: "कुटुंब प्रमुख",
    isHead: true,
    row: r,
  };
  const members = (Array.isArray(r.members) ? r.members : []).map((m: any) => ({
    name: txt(m?.name),
    gender: txt(m?.gender),
    age: typeof m?.age === "number" ? m.age : m?.age ? num(m.age) : null,
    marital_status: txt(m?.marital_status),
    marriage_type: txt(m?.marriage_type),
    spouse_caste: txt(m?.spouse_caste),
    education: txt(m?.education),
    occupation: txt(m?.occupation),
    job_type: txt(m?.job_type),
    relationship: txt(m?.relationship),
    isHead: false,
    bachat_gat: m?.mahila_bachat_gat,
    row: r,
  }));
  return [head, ...members];
}

export function allPersons(rows: Row[]): Person[] {
  return rows.flatMap(personsOf);
}

/* ---------------------------------------------------------------- buckets */

export const AGE_BANDS: { name: string; test: (a: number) => boolean }[] = [
  { name: "0–5", test: (a) => a <= 5 },
  { name: "6–14", test: (a) => a >= 6 && a <= 14 },
  { name: "15–24", test: (a) => a >= 15 && a <= 24 },
  { name: "25–44", test: (a) => a >= 25 && a <= 44 },
  { name: "45–59", test: (a) => a >= 45 && a <= 59 },
  { name: "60+", test: (a) => a >= 60 },
];

export const ageBand = (a: number | null) =>
  a == null ? "—" : (AGE_BANDS.find((b) => b.test(a))?.name ?? "—");

export const FAMILY_SIZE_BANDS = ["1–2", "3–5", "6–8", "9–10", "10+"];
export const familySizeBand = (n: number) =>
  n <= 2 ? "1–2" : n <= 5 ? "3–5" : n <= 8 ? "6–8" : n <= 10 ? "9–10" : "10+";

export const LAND_BANDS = ["1 एकरपेक्षा कमी", "1–5 एकर", "5–10 एकर", "10–20 एकर", "20+ एकर"];
export const landBand = (acres: number) =>
  acres < 1 ? LAND_BANDS[0]! : acres <= 5 ? LAND_BANDS[1]! : acres <= 10 ? LAND_BANDS[2]! : acres <= 20 ? LAND_BANDS[3]! : LAND_BANDS[4]!;

export const familySize = (r: Row) => 1 + (Array.isArray(r.members) ? r.members.length : 0);

/* ------------------------------------------------------- keyword matchers */

const has = (s: string, ...keys: string[]) => keys.some((k) => s.toLowerCase().includes(k.toLowerCase()));

export const OCC_GROUPS: { name: string; match: (o: string) => boolean }[] = [
  { name: "शेतकरी / Farmer", match: (o) => has(o, "शेतकरी") && !has(o, "व्यवसाय", "मजू") },
  { name: "शेती + व्यवसाय", match: (o) => has(o, "शेती") && has(o, "व्यवसाय") },
  { name: "शेतमजूर / Farm Labour", match: (o) => has(o, "मजू") },
  { name: "स्वरोजगार / Self Employed", match: (o) => has(o, "स्वरोजगार", "self employ") },
  { name: "व्यवसाय / Business Owner", match: (o) => has(o, "व्यवसाय") && !has(o, "शेती") },
  { name: "सरकारी कर्मचारी", match: (o) => has(o, "सरकारी") },
  { name: "खाजगी कर्मचारी", match: (o) => has(o, "खाजगी") },
  { name: "शिक्षण क्षेत्र", match: (o) => has(o, "शिक्षण") },
  { name: "वैद्यकीय क्षेत्र", match: (o) => has(o, "वैद्यकीय", "डॉक्टर") },
  { name: "महिला व बालविकास", match: (o) => has(o, "बालविकास") },
  { name: "अभियंता / Engineering", match: (o) => has(o, "अभियंता", "engineer") },
  { name: "बँकिंग व वित्तीय", match: (o) => has(o, "बँक", "वित्त") },
  { name: "न्यायालयीन / Judiciary", match: (o) => has(o, "न्याय", "वकील") },
  { name: "संरक्षण व सुरक्षा", match: (o) => has(o, "संरक्षण", "पोलीस", "सुरक्षा") },
  { name: "निवृत्त / Pensioner", match: (o) => has(o, "निवृत्त") },
  { name: "बेरोजगार / Unemployed", match: (o) => has(o, "बेरोजगार") },
  { name: "परदेशस्थ / NRI", match: (o) => has(o, "परदेश", "nri") },
];

export const occGroup = (o: string) => {
  if (!o) return "—";
  const g = OCC_GROUPS.find((x) => x.match(o));
  return g ? g.name : "इतर / Other";
};

export const EDU_LEVELS: { name: string; match: (e: string) => boolean }[] = [
  { name: "निरक्षर / Illiterate", match: (e) => has(e, "निरक्षर") },
  { name: "पूर्व-प्राथमिक", match: (e) => has(e, "पूर्व-प्राथमिक", "पूर्व प्राथमिक", "nursery", "kg") },
  { name: "प्राथमिक", match: (e) => has(e, "प्राथमिक") },
  { name: "माध्यमिक", match: (e) => has(e, "माध्यमिक") && !has(e, "उच्च") },
  { name: "उच्च माध्यमिक", match: (e) => has(e, "उच्च माध्यमिक") },
  { name: "पदविका / Diploma", match: (e) => has(e, "पदविका", "diploma", "आयटीआय", "iti") },
  { name: "पदवी / Graduate", match: (e) => has(e, "पदवी") && !has(e, "पदव्युत्तर", "पदविका") },
  { name: "पदव्युत्तर / Postgraduate", match: (e) => has(e, "पदव्युत्तर", "post graduate") },
  { name: "डॉक्टरेट / Ph.D.", match: (e) => has(e, "डॉक्टरेट", "पीएच", "ph.d", "phd") },
];

export const eduLevel = (e: string) => {
  if (!e) return "—";
  const l = EDU_LEVELS.find((x) => x.match(e));
  return l ? l.name : "इतर / Other";
};

export const EDU_STREAMS = [
  "कला / Arts", "वाणिज्य / Commerce", "विज्ञान / Science", "अभियांत्रिकी / Engineering",
  "वैद्यकीय / Medical", "फार्मसी / Pharmacy", "कृषी / Agriculture", "विधी / Law",
  "शिक्षणशास्त्र / Education", "व्यवस्थापन / Management", "संगणक / Computer-IT",
];
const STREAM_KEYS: Record<string, string[]> = {
  "कला / Arts": ["कला", "arts", "b.a"],
  "वाणिज्य / Commerce": ["वाणिज्य", "commerce", "b.com"],
  "विज्ञान / Science": ["विज्ञान", "science", "b.sc"],
  "अभियांत्रिकी / Engineering": ["अभियांत्रिकी", "engineering", "b.e", "b.tech"],
  "वैद्यकीय / Medical": ["वैद्यकीय", "mbbs", "medical", "bams", "bhms"],
  "फार्मसी / Pharmacy": ["फार्मसी", "pharm"],
  "कृषी / Agriculture": ["कृषी", "agri"],
  "विधी / Law": ["विधी", "ll.b", "law"],
  "शिक्षणशास्त्र / Education": ["शिक्षणशास्त्र", "b.ed", "d.ed"],
  "व्यवस्थापन / Management": ["व्यवस्थापन", "mba", "bba", "management"],
  "संगणक / Computer-IT": ["संगणक", "computer", "bca", "mca", "b.c.a"],
};
export const eduStream = (e: string) => {
  if (!e) return "—";
  for (const [name, keys] of Object.entries(STREAM_KEYS)) if (has(e, ...keys)) return name;
  return "इतर / Other";
};

export const PROFESSIONS: { name: string; match: (o: string) => boolean }[] = [
  { name: "डॉक्टर / Doctors", match: (o) => has(o, "वैद्यकीय", "डॉक्टर", "doctor") },
  { name: "अभियंता / Engineers", match: (o) => has(o, "अभियंता", "engineer") },
  { name: "शिक्षक / Teachers", match: (o) => has(o, "शिक्षण", "शिक्षक", "teacher", "professor") },
  { name: "वकील / Lawyers", match: (o) => has(o, "वकील", "न्याय", "advocate") },
  { name: "शासकीय अधिकारी / Govt Officers", match: (o) => has(o, "सरकारी") },
  { name: "बँकिंग / Banking", match: (o) => has(o, "बँक", "वित्त") },
  { name: "आयटी / IT", match: (o) => has(o, "संगणक", "it ", "software") },
  { name: "संरक्षण / Defence", match: (o) => has(o, "संरक्षण", "पोलीस", "सुरक्षा", "army") },
  { name: "व्यवसायिक / Business Owners", match: (o) => has(o, "व्यवसाय") },
  { name: "स्वरोजगार / Skilled & Self Employed", match: (o) => has(o, "स्वरोजगार") },
];
export const professionOf = (o: string) => PROFESSIONS.find((p) => p.match(o))?.name ?? null;

/* --------------------------------------------------------------- position */

export const positionEntries = (r: Row) => {
  const pd = (r.position_data || {}) as any;
  const list = Array.isArray(pd.positions) ? pd.positions : [];
  if (list.length) return list;
  return pd.type || pd.status ? [pd] : [];
};

export const allPositions = (rows: Row[]) =>
  rows.filter((r) => r.has_position).flatMap((r) => positionEntries(r).map((p: any) => ({ ...p, row: r })));

/* ------------------------------------------------------------ irrigation */

export const IRRIGATION_KEYS: { key: string; label: string }[] = [
  { key: "tubewell", label: "ट्युबवेल / बोअरवेल" },
  { key: "well", label: "विहीर" },
  { key: "farm_pond", label: "शेततळे" },
  { key: "pond", label: "तलाव" },
  { key: "river", label: "नदी" },
  { key: "canal", label: "नहर / कालवा" },
];

export const TOOL_KEYS: { key: string; label: string }[] = [
  { key: "tractor", label: "ट्रॅक्टर" },
  { key: "harvester", label: "हार्वेस्टर" },
  { key: "rotavator", label: "रोटावेटर" },
  { key: "cultivator", label: "कल्टिवेटर" },
  { key: "tractor_trolley", label: "ट्रॅक्टर ट्रॉली" },
];

export const ASSET_LIST = [
  "मोबाईल", "टी.व्ही.", "फ्रिज", "गॅस शेगडी", "संगणक",
  "सायकल", "दुचाकी", "ऑटो", "चारचाकी",
];

/* ------------------------------------------------------------- state name */

export const stateOf = (r: Row) => {
  const d = txt(r.district).toLowerCase();
  const MP = ["balaghat", "बालाघाट", "seoni", "सिवनी", "chhindwara", "छिंदवाडा", "छिंदवाड़ा"];
  return MP.some((k) => d.includes(k)) ? "मध्य प्रदेश" : "महाराष्ट्र";
};

/* ------------------------------------------------------ location roll-ups */

export type LocRow = {
  name: string;
  families: number;
  members: number;
  male: number;
  female: number;
  pctOfTotal: number;
};

export function locationRollup(rows: Row[], key: (r: Row) => string): LocRow[] {
  const map: Record<string, Row[]> = {};
  rows.forEach((r) => {
    const k = key(r) || "—";
    (map[k] ||= []).push(r);
  });
  const total = rows.length;
  return Object.entries(map)
    .map(([name, rs]) => {
      const ppl = allPersons(rs);
      return {
        name,
        families: rs.length,
        members: ppl.length,
        male: ppl.filter((p) => p.gender === "पुरुष").length,
        female: ppl.filter((p) => p.gender === "स्त्री").length,
        pctOfTotal: pct(rs.length, total),
      };
    })
    .sort((a, b) => b.families - a.families);
}

/* --------------------------------------------------------- cross analytics */

export const DIMENSIONS: { id: string; label: string; level: "family" | "person"; get: (x: any) => string }[] = [
  { id: "state", label: "राज्य / State", level: "family", get: (r) => stateOf(r) },
  { id: "district", label: "जिल्हा / District", level: "family", get: (r) => txt(r.district) || "—" },
  { id: "taluka", label: "तालुका / Taluka", level: "family", get: (r) => txt(r.taluka) || "—" },
  { id: "village", label: "गाव / Village", level: "family", get: (r) => txt(r.village) || "—" },
  { id: "pincode", label: "पिनकोड / Pincode", level: "family", get: (r) => txt(r.pincode) || "—" },
  { id: "house_type", label: "घर प्रकार / House Type", level: "family", get: (r) => txt(r.house_type) || "—" },
  { id: "living_status", label: "राहण्याची स्थिती / Living Status", level: "family", get: (r) => txt(r.living_status) || "—" },
  { id: "gharkul", label: "घरकुल / Gharkul", level: "family", get: (r) => (r.gharkul_received ? "मिळाले" : r.gharkul_wanted ? "आवश्यक" : "नाही") },
  { id: "farmland", label: "शेतजमीन / Farmland", level: "family", get: (r) => (r.has_farmland ? "आहे" : "नाही") },
  { id: "land_band", label: "जमीन आकार / Land Size", level: "family", get: (r) => (r.has_farmland ? landBand(num(r.total_farmland)) : "शेती नाही") },
  { id: "family_size", label: "कुटुंब आकार / Family Size", level: "family", get: (r) => familySizeBand(familySize(r)) },
  { id: "crop_type", label: "मुख्य पीक प्रकार / Crop Type", level: "family", get: (r) => (Array.isArray(r.major_crop_types) && r.major_crop_types[0]) || "—" },
  { id: "irrigation", label: "सिंचन साधन / Irrigation", level: "family", get: (r) => (Array.isArray(r.irrigation_sources) && r.irrigation_sources[0]) || "—" },
  { id: "solar", label: "सोलर / Solar", level: "family", get: (r) => (r.solar_panel_installed ? "बसवले" : r.solar_panel_wanted ? "आवश्यक" : "नाही") },
  { id: "ladki_bahin", label: "लाडकी बहीण / Ladki Bahin", level: "family", get: (r) => ((r.benefits_info || {}).ladki_bahin ? "लाभार्थी" : "लाभार्थी नाही") },
  { id: "gender", label: "लिंग / Gender", level: "person", get: (p: Person) => p.gender || "—" },
  { id: "age_group", label: "वयोगट / Age Group", level: "person", get: (p: Person) => ageBand(p.age) },
  { id: "marital", label: "वैवाहिक स्थिती / Marital", level: "person", get: (p: Person) => p.marital_status || "—" },
  { id: "education", label: "शिक्षण स्तर / Education", level: "person", get: (p: Person) => eduLevel(p.education) },
  { id: "stream", label: "शिक्षण शाखा / Stream", level: "person", get: (p: Person) => eduStream(p.education) },
  { id: "occupation", label: "व्यवसाय / Occupation", level: "person", get: (p: Person) => occGroup(p.occupation) },
];

export function crossTab(rows: Row[], dim1Id: string, dim2Id: string) {
  const d1 = DIMENSIONS.find((d) => d.id === dim1Id)!;
  const d2 = DIMENSIONS.find((d) => d.id === dim2Id)!;
  const usePerson = d1.level === "person" || d2.level === "person";
  const units: any[] = usePerson ? allPersons(rows) : rows;
  const val = (d: typeof d1, u: any) => (d.level === "person" ? d.get(u) : d.get(usePerson ? u.row : u));

  const cols = new Set<string>();
  const map: Record<string, Record<string, number>> = {};
  units.forEach((u) => {
    const a = val(d1, u) || "—";
    const b = val(d2, u) || "—";
    cols.add(b);
    (map[a] ||= {});
    map[a]![b] = (map[a]![b] || 0) + 1;
  });
  const columns = [...cols].sort();
  const data = Object.entries(map)
    .map(([name, r]) => {
      const total = Object.values(r).reduce((a, b) => a + b, 0);
      return { name, total, ...columns.reduce<Record<string, number>>((a, c) => ((a[c] = r[c] || 0), a), {}) };
    })
    .sort((a, b) => b.total - a.total);
  return { columns, data, unit: usePerson ? "सदस्य / Members" : "कुटुंबे / Families" };
}

/* --------------------------------------------------------- data quality */

export const QUALITY_SECTIONS: { name: string; fields: (r: Row) => any[] }[] = [
  { name: "पत्ता / Address", fields: (r) => [r.district, r.taluka, r.village, r.pincode] },
  { name: "कुटुंब तपशील / Family Details", fields: (r) => [r.head_name, r.mobile, r.gender, r.age, r.marital_status] },
  { name: "शिक्षण / Education", fields: (r) => [r.education] },
  { name: "व्यवसाय / Occupation", fields: (r) => [r.occupation] },
  { name: "शेती / Agriculture", fields: (r) => [r.has_farmland, r.has_farmland ? r.total_farmland : "x"] },
  { name: "लाभ / Benefits", fields: (r) => [(r.benefits_info || {}).ladki_bahin, (r.benefits_info || {}).critical_illness] },
];

const filled = (v: any) => v !== null && v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0);

export function completeness(rows: Row[]) {
  const per = QUALITY_SECTIONS.map((s) => {
    let ok = 0, total = 0;
    rows.forEach((r) => {
      const f = s.fields(r);
      total += f.length;
      ok += f.filter(filled).length;
    });
    return { name: s.name, value: pct(ok, total) };
  });
  const overall = per.length ? Math.round(per.reduce((a, b) => a + b.value, 0) / per.length) : 0;
  return { per, overall };
}

export function duplicates(rows: Row[]) {
  const seen: Record<string, number> = {};
  rows.forEach((r) => {
    const k = `${txt(r.head_name).toLowerCase()}|${txt(r.village).toLowerCase()}|${txt(r.mobile)}`;
    seen[k] = (seen[k] || 0) + 1;
  });
  return Object.values(seen).reduce((a, n) => a + (n > 1 ? n - 1 : 0), 0);
}

/* ------------------------------------------------------------ time trend */

export function trend(rows: Row[], days = 30): Datum[] {
  const out: Datum[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    out.push({
      name: d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
      value: rows.filter((r) => {
        const c = new Date(r.created_at);
        return c >= d && c < next;
      }).length,
    });
  }
  return out;
}
