// ============================================================
// Professional dashboard filter model for सर्व सर्वेक्षणे
// Family-level + member-level (any member matches) filtering.
// ============================================================
import { decodeEducation } from "./education-data";
import { decodeOccupation, type OccupationValue } from "./occupation-data";

export type Tri = "" | "yes" | "no";

export type SurveyFilters = {
  // 1. LOCATION
  state: string;
  districts: string[];
  talukas: string[];
  villages: string[];
  pincodes: string[];
  // 2. FAMILY & DEMOGRAPHICS
  genders: string[];
  ageGroups: string[];
  ageMin: string;
  ageMax: string;
  maritalStatuses: string[];
  marriageTypes: string[];
  spouseCaste: string;
  familySizes: string[];
  familyMin: string;
  familyMax: string;
  // 3. EDUCATION
  eduLevels: string[];
  eduStreams: string[];
  eduCourses: string[];
  eduInstitutions: string[];
  // 4. OCCUPATION
  occCategories: string[];
  employmentTypes: string[];
  department: string;
  designations: string[];
  occBusinessTypes: string[];
  // 5. AGRICULTURE
  hasFarmland: Tri;
  landSizes: string[];
  landMin: string;
  landMax: string;
  cropSeasons: string[];
  majorCropTypes: string[];
  irrigationSources: string[];
  pumpTypes: string[];
  malguzariPond: Tri;
  freeWater: Tri;
  farmingTypes: string[];
  farmingTools: string[];
  toolOwnership: "" | "own" | "not_own";
  toolWantBuy: Tri;
  toolLoan: Tri;
  contractFarming: Tri;
  contractMin: string;
  contractMax: string;
  // 6. HOUSE & ASSETS
  ownsHouse: Tri;
  houseTypes: string[];
  livingStatuses: string[];
  gharkulReceived: Tri;
  gharkulWanted: Tri;
  solarInstalled: Tri;
  solarWanted: Tri;
  assets: string[];
  assetMinQty: string;
  // 7. BENEFITS
  ladkiBahin: Tri;
  ladkiBahinRegular: Tri;
  ladkiBahinReasons: string[];
  criticalIllness: Tri;
  medicalAidNeeded: Tri;
  hasSportsperson: Tri;
  sportLevels: string[];
  sportType: string;
  // 8. POSITION
  hasPosition: Tri;
  positionTypes: string[];
  positionStatuses: string[];
  politicalLevels: string[];
  party: string;
  representativeTypes: string[];
  representativeRoles: string[];
  organisation: string;
  // 9. BUSINESS
  entrepreneur: Tri;
  bizTypes: string[];
  sideBusiness: Tri;
  loanRequired: Tri;
  loanMin: string;
  loanMax: string;
  loanPurposes: string[];
};

export const emptyFilters: SurveyFilters = {
  state: "", districts: [], talukas: [], villages: [], pincodes: [],
  genders: [], ageGroups: [], ageMin: "", ageMax: "",
  maritalStatuses: [], marriageTypes: [], spouseCaste: "",
  familySizes: [], familyMin: "", familyMax: "",
  eduLevels: [], eduStreams: [], eduCourses: [], eduInstitutions: [],
  occCategories: [], employmentTypes: [], department: "", designations: [], occBusinessTypes: [],
  hasFarmland: "", landSizes: [], landMin: "", landMax: "",
  cropSeasons: [], majorCropTypes: [], irrigationSources: [], pumpTypes: [],
  malguzariPond: "", freeWater: "", farmingTypes: [], farmingTools: [],
  toolOwnership: "", toolWantBuy: "", toolLoan: "",
  contractFarming: "", contractMin: "", contractMax: "",
  ownsHouse: "", houseTypes: [], livingStatuses: [],
  gharkulReceived: "", gharkulWanted: "", solarInstalled: "", solarWanted: "",
  assets: [], assetMinQty: "",
  ladkiBahin: "", ladkiBahinRegular: "", ladkiBahinReasons: [],
  criticalIllness: "", medicalAidNeeded: "", hasSportsperson: "", sportLevels: [], sportType: "",
  hasPosition: "", positionTypes: [], positionStatuses: [], politicalLevels: [],
  party: "", representativeTypes: [], representativeRoles: [], organisation: "",
  entrepreneur: "", bizTypes: [], sideBusiness: "", loanRequired: "",
  loanMin: "", loanMax: "", loanPurposes: [],
};

// ---------- option masters ----------
export const STATES = ["महाराष्ट्र (Maharashtra)", "मध्य प्रदेश (Madhya Pradesh)"];
export const GENDER_OPTS = ["पुरुष", "स्त्री", "इतर"];
export const AGE_GROUPS: { label: string; min: number; max: number }[] = [
  { label: "0–5 वर्षे", min: 0, max: 5 },
  { label: "6–14 वर्षे", min: 6, max: 14 },
  { label: "15–24 वर्षे", min: 15, max: 24 },
  { label: "25–44 वर्षे", min: 25, max: 44 },
  { label: "45–59 वर्षे", min: 45, max: 59 },
  { label: "60+ वर्षे", min: 60, max: 200 },
];
export const FAMILY_SIZES: { label: string; min: number; max: number }[] = [
  { label: "1–2 सदस्य", min: 1, max: 2 },
  { label: "3–5 सदस्य", min: 3, max: 5 },
  { label: "6–8 सदस्य", min: 6, max: 8 },
  { label: "9–10 सदस्य", min: 9, max: 10 },
  { label: "10+ सदस्य", min: 11, max: 999 },
];
export const MARRIAGE_TYPES = ["जातीय विवाह", "आंतरजातीय विवाह"];
export const PUMP_TYPES = ["इलेक्ट्रिक पंप (Electric)", "सोलर पंप (Solar)"];
export const IRRIGATION_KEYS: { key: string; label: string }[] = [
  { key: "tubewell", label: "ट्युबवेल / बोअरवेल" },
  { key: "well", label: "विहीर" },
  { key: "farm_pond", label: "शेततळे" },
  { key: "pond", label: "तलाव" },
  { key: "river", label: "नदी" },
  { key: "canal", label: "नहर / कालवा" },
];
export const TOOL_KEYS: { key: string; label: string }[] = [
  { key: "tractor", label: "ट्रॅक्टर (Tractor)" },
  { key: "harvester", label: "हार्वेस्टर (Harvester)" },
  { key: "rotavator", label: "रोटावेटर (Rotavator)" },
  { key: "cultivator", label: "कल्टिवेटर (Cultivator)" },
  { key: "tractor_trolley", label: "ट्रॅक्टर ट्रॉली (Trolley)" },
  { key: "other", label: "इतर आधुनिक साधने (Other)" },
];
export const EMPLOYMENT_TYPES = [
  "सरकारी (Government)", "खाजगी (Private)", "स्वयंरोजगार (Self-employed)",
  "व्यवसाय (Business)", "शेती (Agriculture)", "मजुरी (Labour)",
  "निवृत्त / पेन्शनधारक (Retired)", "बेरोजगार (Unemployed)",
  "परदेशस्थ (NRI)", "इतर (Other)",
];
const EMPLOYMENT_MAP: Record<string, string> = {
  "शेतकरी (Farmer)": "शेती (Agriculture)",
  "शेती + व्यवसाय (Agriculture + Business)": "व्यवसाय (Business)",
  "कृषी मजूर / शेतमजूर (Farm Labour)": "मजुरी (Labour)",
  "स्वरोजगार (Self Employed)": "स्वयंरोजगार (Self-employed)",
  "व्यवसाय (Business Owner)": "व्यवसाय (Business)",
  "मानधनधारक पदाधिकारी (Honorarium Based Position)": "सरकारी (Government)",
  "सरकारी कर्मचारी (Government Employee)": "सरकारी (Government)",
  "खाजगी कर्मचारी (Private Employee)": "खाजगी (Private)",
  "शिक्षण क्षेत्र (Education Sector)": "सरकारी (Government)",
  "वैद्यकीय क्षेत्र (Medical Sector)": "खाजगी (Private)",
  "महिला व बाल विकास (Women & Child Development)": "सरकारी (Government)",
  "अभियंता (Engineering Sector)": "खाजगी (Private)",
  "बँकिंग व वित्तीय क्षेत्र (Banking & Finance)": "खाजगी (Private)",
  "न्यायव्यवस्था (Judiciary)": "सरकारी (Government)",
  "संरक्षण व सुरक्षा सेवा (Defence & Security)": "सरकारी (Government)",
  "निवृत्त / पेन्शनधारक (Retired / Pensioner)": "निवृत्त / पेन्शनधारक (Retired)",
  "बेरोजगार (Unemployed)": "बेरोजगार (Unemployed)",
  "परदेशस्थ (NRI)": "परदेशस्थ (NRI)",
  "इतर (Other)": "इतर (Other)",
};
export const LADKI_BAHIN_REASONS = [
  "KYC अपूर्ण / प्रलंबित",
  "आधार बँक खात्याशी लिंक नाही",
  "DBT सक्रिय नाही",
  "अर्ज पडताळणी प्रलंबित",
  "अर्ज / कागदपत्रांमध्ये त्रुटी",
  "बँक खाते बंद / चुकीचे",
  "इतर",
];
export const SPORT_LEVELS = ["राज्य (State)", "राष्ट्रीय (National)", "आंतरराष्ट्रीय (International)"];

// ---------- helpers ----------
const num = (v: any): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const m = String(v).match(/-?\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : null;
};
const truthy = (arr?: any[]) => Array.isArray(arr) && arr.length > 0;
const triOk = (t: Tri, v: any) => t === "" || (t === "yes" ? v === true : v !== true);
const anyIn = (sel: string[], vals: (string | undefined | null)[]) =>
  sel.length === 0 || vals.some((v) => v && sel.includes(v));
const textOk = (q: string, vals: (string | undefined | null)[]) =>
  !q.trim() || vals.some((v) => (v || "").toLowerCase().includes(q.trim().toLowerCase()));

type Person = {
  gender?: string; age?: any; dob?: string; marital_status?: string;
  marriage_type?: string; spouse_caste?: string; education?: string; occupation?: string;
};

function people(row: any): Person[] {
  const members: Person[] = Array.isArray(row.members) ? row.members : [];
  return [row as Person, ...members];
}

function ageOf(p: Person): number | null {
  const a = num(p.age);
  if (a !== null) return a;
  if (!p.dob) return null;
  const d = new Date(p.dob);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  let y = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) y--;
  return y >= 0 ? y : null;
}

function occOf(p: Person): OccupationValue {
  try { return decodeOccupation(p.occupation); } catch { return { category: "" }; }
}

/** Does at least one person (head or member) satisfy all person-level filters? */
function personMatch(row: any, f: SurveyFilters): boolean {
  const usesPerson =
    f.genders.length || f.ageGroups.length || f.ageMin || f.ageMax ||
    f.maritalStatuses.length || f.marriageTypes.length || f.spouseCaste ||
    f.eduLevels.length || f.eduStreams.length || f.eduCourses.length || f.eduInstitutions.length ||
    f.occCategories.length || f.employmentTypes.length || f.department ||
    f.designations.length || f.occBusinessTypes.length;
  if (!usesPerson) return true;

  return people(row).some((p) => {
    if (f.genders.length && !(p.gender && f.genders.includes(p.gender))) return false;

    const age = ageOf(p);
    if (f.ageGroups.length) {
      const ok = AGE_GROUPS.filter((g) => f.ageGroups.includes(g.label))
        .some((g) => age !== null && age >= g.min && age <= g.max);
      if (!ok) return false;
    }
    const amin = num(f.ageMin), amax = num(f.ageMax);
    if (amin !== null && (age === null || age < amin)) return false;
    if (amax !== null && (age === null || age > amax)) return false;

    if (f.maritalStatuses.length && !(p.marital_status && f.maritalStatuses.includes(p.marital_status))) return false;
    if (f.marriageTypes.length && !(p.marriage_type && f.marriageTypes.some((m) => (p.marriage_type || "").includes(m)))) return false;
    if (!textOk(f.spouseCaste, [p.spouse_caste])) return false;

    const e = decodeEducation(p.education || "");
    if (f.eduLevels.length && !f.eduLevels.includes(e.level)) return false;
    if (f.eduStreams.length && !f.eduStreams.includes(e.stream)) return false;
    if (f.eduCourses.length && !f.eduCourses.includes(e.course)) return false;
    if (f.eduInstitutions.length && !f.eduInstitutions.includes(e.institution)) return false;

    const o = occOf(p);
    if (f.occCategories.length && !(o.category && f.occCategories.includes(o.category))) return false;
    if (f.employmentTypes.length) {
      const et = EMPLOYMENT_MAP[o.category || ""] || "";
      if (!et || !f.employmentTypes.includes(et)) return false;
    }
    if (!textOk(f.department, [
      o.institutionType, o.institutionLevel, o.branch, o.force, o.bankType,
      o.sector, o.hospitalType, o.serviceType,
    ])) return false;
    if (f.designations.length && !anyIn(f.designations, [o.designation, o.rank])) return false;
    if (f.occBusinessTypes.length) {
      const bt = [o.businessType, ...(o.businessTypes || []), ...(o.selfEmployedTypes || [])];
      if (!bt.some((b) => b && f.occBusinessTypes.includes(b))) return false;
    }
    return true;
  });
}

export function matchSurvey(row: any, f: SurveyFilters): boolean {
  // 1. LOCATION
  if (f.state && row.state && row.state !== f.state) return false;
  if (f.districts.length && !f.districts.includes(row.district)) return false;
  if (f.talukas.length && !f.talukas.includes(row.taluka)) return false;
  if (f.villages.length && !f.villages.includes(row.village)) return false;
  if (f.pincodes.length && !f.pincodes.includes(row.pincode)) return false;

  // 2. FAMILY SIZE
  const size = 1 + (Array.isArray(row.members) ? row.members.length : 0);
  if (f.familySizes.length) {
    const ok = FAMILY_SIZES.filter((g) => f.familySizes.includes(g.label))
      .some((g) => size >= g.min && size <= g.max);
    if (!ok) return false;
  }
  const fmin = num(f.familyMin), fmax = num(f.familyMax);
  if (fmin !== null && size < fmin) return false;
  if (fmax !== null && size > fmax) return false;

  // 2/3/4 person-level
  if (!personMatch(row, f)) return false;

  // 5. AGRICULTURE
  if (!triOk(f.hasFarmland, row.has_farmland)) return false;
  if (f.landSizes.length && !f.landSizes.includes(row.total_farmland)) return false;
  const acres = num(row.irrigated_area) !== null || num(row.dryland_area) !== null
    ? (num(row.irrigated_area) || 0) + (num(row.dryland_area) || 0)
    : num(row.total_farmland);
  const lmin = num(f.landMin), lmax = num(f.landMax);
  if (lmin !== null && (acres === null || acres < lmin)) return false;
  if (lmax !== null && (acres === null || acres > lmax)) return false;

  if (f.cropSeasons.length) {
    const seasons = (Array.isArray(row.crops) ? row.crops : []).map((c: any) => c?.season).filter(Boolean);
    const areaSeasons: string[] = [];
    if (num(row.kharif_area)) areaSeasons.push("खरीप");
    if (num(row.rabi_area)) areaSeasons.push("रब्बी (धान सोडून)");
    if (num(row.summer_area)) areaSeasons.push("उन्हाळी (धानासह)");
    const all = [...seasons, ...areaSeasons];
    if (!f.cropSeasons.some((s) => all.some((x) => String(x).includes(s.split(" (")[0])))) return false;
  }
  if (f.majorCropTypes.length) {
    const mct: string[] = Array.isArray(row.major_crop_types) ? row.major_crop_types : [];
    if (!f.majorCropTypes.some((c) => mct.includes(c))) return false;
  }
  const idet = row.irrigation_details || {};
  if (f.irrigationSources.length) {
    const srcs: string[] = Array.isArray(row.irrigation_sources) ? row.irrigation_sources : [];
    const ok = f.irrigationSources.some((k) => {
      const label = IRRIGATION_KEYS.find((i) => i.key === k)?.label || "";
      const d = idet[k];
      return (d && (d.count || d.electric || d.solar)) || srcs.some((s) => s === label || s.includes(label));
    });
    if (!ok) return false;
  }
  if (f.pumpTypes.length) {
    const vals = Object.values(idet) as any[];
    const wantsElectric = f.pumpTypes.some((p) => p.includes("Electric"));
    const wantsSolar = f.pumpTypes.some((p) => p.includes("Solar"));
    const ok = vals.some((d) => (wantsElectric && d?.electric) || (wantsSolar && d?.solar));
    if (!ok) return false;
  }
  if (f.malguzariPond !== "" && !triOk(f.malguzariPond, idet?.pond?.is_kohli_malguzari)) return false;
  if (f.freeWater !== "") {
    const vals = Object.values(idet) as any[];
    const hasFree = vals.some((d) => d?.water_free_for_irrigation === true);
    if (f.freeWater === "yes" ? !hasFree : hasFree) return false;
  }
  if (f.farmingTypes.length) {
    const ft: string[] = [];
    people(row).forEach((p) => { const o = occOf(p); (o.farmingTypes || []).forEach((x) => ft.push(x)); });
    if (!f.farmingTypes.some((x) => ft.includes(x))) return false;
  }
  const tdet = row.farming_tools_details || {};
  const toolSel = f.farmingTools.length ? f.farmingTools : TOOL_KEYS.map((t) => t.key);
  const toolDetail = (k: string) => (k === "other" ? { has: tdet.other_uses } : tdet[k]) || {};
  if (f.farmingTools.length || f.toolOwnership || f.toolWantBuy || f.toolLoan) {
    const ok = toolSel.some((k) => {
      const d: any = toolDetail(k);
      if (f.toolOwnership === "own" && d.has !== true) return false;
      if (f.toolOwnership === "not_own" && d.has === true) return false;
      if (f.toolWantBuy !== "" && !triOk(f.toolWantBuy, d.want_to_buy)) return false;
      if (f.toolLoan !== "" && !triOk(f.toolLoan, d.needs_loan)) return false;
      if (f.farmingTools.length && !f.toolOwnership && f.toolWantBuy === "" && f.toolLoan === "")
        return d.has === true;
      return true;
    });
    if (!ok) return false;
  }
  const fm = row.farm_management || {};
  if (!triOk(f.contractFarming, fm.has_contract_or_share)) return false;
  const cmin = num(f.contractMin), cmax = num(f.contractMax), carea = num(fm.contract_farming_area);
  if (cmin !== null && (carea === null || carea < cmin)) return false;
  if (cmax !== null && (carea === null || carea > cmax)) return false;

  // 6. HOUSE & ASSETS
  if (!triOk(f.ownsHouse, row.owns_house)) return false;
  if (f.houseTypes.length && !f.houseTypes.includes(row.house_type)) return false;
  if (f.livingStatuses.length && !f.livingStatuses.includes(row.living_status)) return false;
  if (!triOk(f.gharkulReceived, row.gharkul_received)) return false;
  if (!triOk(f.gharkulWanted, row.gharkul_wanted)) return false;
  if (!triOk(f.solarInstalled, row.solar_panel_installed)) return false;
  if (!triOk(f.solarWanted, row.solar_panel_wanted)) return false;
  if (f.assets.length) {
    const items: string[] = Array.isArray(row.household_items) ? row.household_items : [];
    if (!f.assets.every((a) => items.includes(a))) return false;
    const q = num(f.assetMinQty);
    if (q !== null) {
      const counts = row.household_item_counts || {};
      if (!f.assets.every((a) => (num(counts[a]) || 1) >= q)) return false;
    }
  }

  // 7. BENEFITS
  const b = row.benefits_info || {};
  if (!triOk(f.ladkiBahin, b.ladki_bahin)) return false;
  if (!triOk(f.ladkiBahinRegular, b.ladki_bahin_regular)) return false;
  if (f.ladkiBahinReasons.length) {
    const reasons = [
      ...(b.ladki_bahin_beneficiaries || []).map((x: any) => x?.reason),
      ...(b.ladki_bahin_non_beneficiaries || []).map((x: any) => x?.reason),
    ].filter(Boolean);
    if (!f.ladkiBahinReasons.some((r) => reasons.some((x: string) => x.includes(r.split(" (")[0])))) return false;
  }
  if (!triOk(f.criticalIllness, b.critical_illness)) return false;
  if (!triOk(f.medicalAidNeeded, b.medical_aid_needed)) return false;
  if (!triOk(f.hasSportsperson, b.has_sportsperson)) return false;
  if (f.sportLevels.length && !f.sportLevels.some((l) => (b.sport_level || "").includes(l.split(" (")[0]))) return false;
  if (!textOk(f.sportType, [b.sport_type])) return false;

  // 8. POSITION
  if (!triOk(f.hasPosition, row.has_position)) return false;
  const pd = row.position_data || {};
  const entries: any[] = truthy(pd.positions) ? pd.positions : (pd.type ? [pd] : []);
  const usesPos = f.positionTypes.length || f.positionStatuses.length || f.politicalLevels.length ||
    f.party || f.representativeTypes.length || f.representativeRoles.length || f.organisation;
  if (usesPos) {
    const ok = entries.some((e) =>
      anyIn(f.positionTypes, [e.type]) &&
      anyIn(f.positionStatuses, [e.status]) &&
      anyIn(f.politicalLevels, [e.political_level]) &&
      textOk(f.party, [e.party_name, e.party_name_other]) &&
      anyIn(f.representativeTypes, [e.representative_type]) &&
      anyIn(f.representativeRoles, [e.coop_role, e.social_role]) &&
      textOk(f.organisation, [e.social_org, e.coop_org_name])
    );
    if (!ok) return false;
  }

  // 9. BUSINESS
  const emp = row.employment_info || {};
  if (!triOk(f.entrepreneur, emp.has_entrepreneur)) return false;
  if (!triOk(f.sideBusiness, emp.has_side_business)) return false;
  if (f.bizTypes.length) {
    const bt: string[] = [];
    people(row).forEach((p) => {
      const o = occOf(p);
      if (o.businessType) bt.push(o.businessType);
      (o.businessTypes || []).forEach((x) => bt.push(x));
    });
    const txt = `${emp.entrepreneur_details || ""} ${emp.side_business_details || ""}`;
    if (!f.bizTypes.some((x) => bt.includes(x) || txt.includes(x.split(" (")[0]))) return false;
  }
  const loanFlags: boolean[] = [];
  const loanAmts: (string | undefined)[] = [];
  const loanPurps: (string | undefined)[] = [];
  people(row).forEach((p) => {
    const o: any = occOf(p);
    [o.needsLoan, o.needs_loan, o.businessLoanNeeded].forEach((x) => { if (typeof x === "boolean") loanFlags.push(x); });
    loanAmts.push(o.loanAmount || o.loan_amount);
    loanPurps.push(o.loanPurpose || o.loan_purpose);
  });
  if (f.loanRequired === "yes" && !loanFlags.some(Boolean)) return false;
  if (f.loanRequired === "no" && loanFlags.some(Boolean)) return false;
  const lomin = num(f.loanMin), lomax = num(f.loanMax);
  if (lomin !== null || lomax !== null) {
    const amts = loanAmts.map(num).filter((x): x is number => x !== null);
    if (!amts.some((a) => (lomin === null || a >= lomin) && (lomax === null || a <= lomax))) return false;
  }
  if (f.loanPurposes.length && !f.loanPurposes.some((p) => loanPurps.some((x) => (x || "").includes(p)))) return false;

  return true;
}

export function countActive(f: SurveyFilters): number {
  let n = 0;
  Object.values(f).forEach((v) => {
    if (Array.isArray(v)) { if (v.length) n++; }
    else if (typeof v === "string" && v.trim()) n++;
  });
  return n;
}
