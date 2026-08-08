import { useMemo, useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronsUpDown, Filter, RotateCcw, Check } from "lucide-react";
import {
  AGE_GROUPS, FAMILY_SIZES, GENDER_OPTS, IRRIGATION_KEYS, LADKI_BAHIN_REASONS,
  MARRIAGE_TYPES, PUMP_TYPES, SPORT_LEVELS, STATES, TOOL_KEYS, EMPLOYMENT_TYPES,
  countActive, emptyFilters, type SurveyFilters, type Tri,
} from "@/lib/survey-filters";
import {
  HOUSEHOLD_ITEMS, HOUSE_TYPES, LIVING_STATUS, MAJOR_CROP_TYPES, MARITAL,
  POLITICAL_LEVELS, POSITION_STATUS, POSITION_TYPES, REPRESENTATIVES, REPRESENTATIVE_ROLES,
} from "@/lib/marathi";
import { EDUCATION_TREE, INSTITUTION_TYPES } from "@/lib/education-data";
import {
  BANK_DESIGNATIONS, BUSINESS_TYPES, CENTRAL_ARMED_FORCES_RANKS, EDU_DESIGNATIONS_BY_LEVEL,
  ENG_DESIGNATIONS, FARMING_TYPES, GOVT_CLASS_DESIGNATIONS, JUDICIARY_DESIGNATIONS,
  LAND_SIZES, LOAN_PURPOSE_OPTIONS, MED_DESIGNATIONS, MILITARY_RANKS, POLICE_RANKS,
  PRIMARY_CATEGORIES, SELF_EMPLOYED_TYPES, WCD_DESIGNATIONS,
} from "@/lib/occupation-data";

/* ---------------- generic multi-select ---------------- */
function MultiSelect({
  label, options, value, onChange, placeholder = "सर्व",
}: {
  label: string; options: string[]; value: string[];
  onChange: (v: string[]) => void; placeholder?: string;
}) {
  const [q, setQ] = useState("");
  const list = useMemo(
    () => options.filter((o) => o && o.toLowerCase().includes(q.toLowerCase())),
    [options, q]
  );
  const toggle = (o: string) =>
    onChange(value.includes(o) ? value.filter((x) => x !== o) : [...value, o]);

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-between font-normal">
            <span className="truncate text-left">
              {value.length === 0 ? placeholder : value.length === 1 ? value[0] : `${value.length} निवडले`}
            </span>
            <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-0 bg-popover" align="start">
          <div className="p-2 border-b">
            <Input placeholder="शोधा..." value={q} onChange={(e) => setQ(e.target.value)} className="h-8" />
          </div>
          <ScrollArea className="max-h-64">
            <div className="p-1">
              {list.length === 0 && <p className="p-3 text-xs text-muted-foreground">पर्याय नाही</p>}
              {list.map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => toggle(o)}
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
                >
                  <Checkbox checked={value.includes(o)} className="pointer-events-none" />
                  <span className="flex-1">{o}</span>
                  {value.includes(o) && <Check className="h-3.5 w-3.5 text-primary" />}
                </button>
              ))}
            </div>
          </ScrollArea>
          {value.length > 0 && (
            <div className="border-t p-2">
              <Button variant="ghost" size="sm" className="w-full" onClick={() => onChange([])}>
                निवड रद्द करा
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}

function TriSelect({ label, value, onChange }: { label: string; value: Tri; onChange: (v: Tri) => void }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <Select value={value || "any"} onValueChange={(v) => onChange(v === "any" ? "" : (v as Tri))}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent className="bg-popover">
          <SelectItem value="any">सर्व</SelectItem>
          <SelectItem value="yes">होय</SelectItem>
          <SelectItem value="no">नाही</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

function RangeInput({
  label, min, max, onMin, onMax, unit,
}: { label: string; min: string; max: string; onMin: (v: string) => void; onMax: (v: string) => void; unit?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}{unit ? ` (${unit})` : ""}</Label>
      <div className="flex items-center gap-2">
        <Input type="number" placeholder="किमान" value={min} onChange={(e) => onMin(e.target.value)} />
        <span className="text-muted-foreground text-xs">–</span>
        <Input type="number" placeholder="कमाल" value={max} onChange={(e) => onMax(e.target.value)} />
      </div>
    </div>
  );
}

function TextFilter({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

function Group({ id, icon, title, count, children }: { id: string; icon: string; title: string; count: number; children: React.ReactNode }) {
  return (
    <AccordionItem value={id} className="border rounded-lg px-3 bg-card">
      <AccordionTrigger className="hover:no-underline py-3">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <span>{icon}</span>{title}
          {count > 0 && <Badge variant="secondary" className="ml-1">{count}</Badge>}
        </span>
      </AccordionTrigger>
      <AccordionContent>
        <div className="grid gap-3 md:grid-cols-3 pb-3">{children}</div>
      </AccordionContent>
    </AccordionItem>
  );
}

/* ---------------- panel ---------------- */
export function SurveyFilterPanel({
  rows, filters, onChange,
}: { rows: any[]; filters: SurveyFilters; onChange: (f: SurveyFilters) => void }) {
  const f = filters;
  const set = <K extends keyof SurveyFilters>(k: K, v: SurveyFilters[K]) => onChange({ ...f, [k]: v });

  /* cascading location options derived from data */
  const districts = useMemo(
    () => uniq(rows.map((r) => r.district)),
    [rows]
  );
  const talukas = useMemo(
    () => uniq(rows.filter((r) => !f.districts.length || f.districts.includes(r.district)).map((r) => r.taluka)),
    [rows, f.districts]
  );
  const villages = useMemo(
    () => uniq(rows
      .filter((r) => (!f.districts.length || f.districts.includes(r.district)) && (!f.talukas.length || f.talukas.includes(r.taluka)))
      .map((r) => r.village)),
    [rows, f.districts, f.talukas]
  );
  const pincodes = useMemo(
    () => uniq(rows
      .filter((r) => (!f.districts.length || f.districts.includes(r.district)) && (!f.talukas.length || f.talukas.includes(r.taluka)) && (!f.villages.length || f.villages.includes(r.village)))
      .map((r) => r.pincode)),
    [rows, f.districts, f.talukas, f.villages]
  );

  const eduLevels = EDUCATION_TREE.map((l) => l.level);
  const eduStreams = useMemo(() => {
    const tree = f.eduLevels.length ? EDUCATION_TREE.filter((l) => f.eduLevels.includes(l.level)) : EDUCATION_TREE;
    return uniq(tree.flatMap((l) => l.streams.map((s) => s.stream)).filter((s) => s !== "—"));
  }, [f.eduLevels]);
  const eduCourses = useMemo(() => {
    const tree = f.eduLevels.length ? EDUCATION_TREE.filter((l) => f.eduLevels.includes(l.level)) : EDUCATION_TREE;
    const streams = tree.flatMap((l) => l.streams).filter((s) => !f.eduStreams.length || f.eduStreams.includes(s.stream));
    return uniq(streams.flatMap((s) => s.courses));
  }, [f.eduLevels, f.eduStreams]);

  const designations = useMemo(() => uniq([
    ...Object.values(GOVT_CLASS_DESIGNATIONS).flat(),
    ...Object.values(EDU_DESIGNATIONS_BY_LEVEL).flat(),
    ...MED_DESIGNATIONS, ...WCD_DESIGNATIONS, ...ENG_DESIGNATIONS,
    ...BANK_DESIGNATIONS, ...JUDICIARY_DESIGNATIONS,
    ...MILITARY_RANKS, ...POLICE_RANKS, ...CENTRAL_ARMED_FORCES_RANKS,
  ]), []);

  const repRoles = useMemo(() => {
    const keys = f.representativeTypes.length ? f.representativeTypes : Object.keys(REPRESENTATIVE_ROLES);
    return uniq(keys.flatMap((k) => REPRESENTATIVE_ROLES[k] || []));
  }, [f.representativeTypes]);

  const c = (...keys: (keyof SurveyFilters)[]) =>
    keys.reduce((n, k) => {
      const v = f[k];
      if (Array.isArray(v)) return n + (v.length ? 1 : 0);
      return n + (typeof v === "string" && v.trim() ? 1 : 0);
    }, 0);

  const active = countActive(f);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <Filter className="h-4 w-4 text-primary" /> प्रगत फिल्टर
          {active > 0 && <Badge>{active} सक्रिय</Badge>}
        </span>
        <Button variant="outline" size="sm" onClick={() => onChange({ ...emptyFilters })}>
          <RotateCcw className="h-3.5 w-3.5 mr-1" /> रीसेट
        </Button>
      </div>

      <Accordion type="multiple" className="space-y-2">
        {/* 1 LOCATION */}
        <Group id="loc" icon="📍" title="स्थान (Location)" count={c("state", "districts", "talukas", "villages", "pincodes")}>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">राज्य (State)</Label>
            <Select value={f.state || "any"} onValueChange={(v) => set("state", v === "any" ? "" : v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="any">सर्व राज्ये</SelectItem>
                {STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <MultiSelect label="जिल्हा (District)" options={districts} value={f.districts}
            onChange={(v) => onChange({ ...f, districts: v, talukas: [], villages: [], pincodes: [] })} />
          <MultiSelect label="तालुका (Taluka)" options={talukas} value={f.talukas}
            onChange={(v) => onChange({ ...f, talukas: v, villages: [], pincodes: [] })} />
          <MultiSelect label="गाव (Village)" options={villages} value={f.villages}
            onChange={(v) => onChange({ ...f, villages: v, pincodes: [] })} />
          <MultiSelect label="पिनकोड (Pincode)" options={pincodes} value={f.pincodes} onChange={(v) => set("pincodes", v)} />
        </Group>

        {/* 2 FAMILY */}
        <Group id="fam" icon="👨‍👩‍👧" title="कुटुंब व लोकसंख्याशास्त्र (Family & Demographics)"
          count={c("genders", "ageGroups", "ageMin", "ageMax", "maritalStatuses", "marriageTypes", "spouseCaste", "familySizes", "familyMin", "familyMax")}>
          <MultiSelect label="लिंग (Gender)" options={GENDER_OPTS} value={f.genders} onChange={(v) => set("genders", v)} />
          <MultiSelect label="वयोगट (Age Group)" options={AGE_GROUPS.map((g) => g.label)} value={f.ageGroups} onChange={(v) => set("ageGroups", v)} />
          <RangeInput label="वय श्रेणी (Age Range)" min={f.ageMin} max={f.ageMax} onMin={(v) => set("ageMin", v)} onMax={(v) => set("ageMax", v)} />
          <MultiSelect label="वैवाहिक स्थिती (Marital Status)" options={MARITAL} value={f.maritalStatuses} onChange={(v) => set("maritalStatuses", v)} />
          <MultiSelect label="विवाहाचा प्रकार (Marriage Type)" options={MARRIAGE_TYPES} value={f.marriageTypes} onChange={(v) => set("marriageTypes", v)} />
          <TextFilter label="जोडीदाराची जात (Spouse Caste)" value={f.spouseCaste} onChange={(v) => set("spouseCaste", v)} placeholder="जात शोधा" />
          <MultiSelect label="कुटुंब आकार (Family Size)" options={FAMILY_SIZES.map((g) => g.label)} value={f.familySizes} onChange={(v) => set("familySizes", v)} />
          <RangeInput label="कुटुंब आकार श्रेणी" min={f.familyMin} max={f.familyMax} onMin={(v) => set("familyMin", v)} onMax={(v) => set("familyMax", v)} />
        </Group>

        {/* 3 EDUCATION */}
        <Group id="edu" icon="🎓" title="शिक्षण (Education)" count={c("eduLevels", "eduStreams", "eduCourses", "eduInstitutions")}>
          <MultiSelect label="शिक्षण स्तर (Level)" options={eduLevels} value={f.eduLevels}
            onChange={(v) => onChange({ ...f, eduLevels: v, eduStreams: [], eduCourses: [] })} />
          <MultiSelect label="शाखा / गट (Stream)" options={eduStreams} value={f.eduStreams}
            onChange={(v) => onChange({ ...f, eduStreams: v, eduCourses: [] })} />
          <MultiSelect label="अभ्यासक्रम (Course)" options={eduCourses} value={f.eduCourses} onChange={(v) => set("eduCourses", v)} />
          <MultiSelect label="संस्था प्रकार (Institution Type)" options={INSTITUTION_TYPES} value={f.eduInstitutions} onChange={(v) => set("eduInstitutions", v)} />
        </Group>

        {/* 4 OCCUPATION */}
        <Group id="occ" icon="💼" title="नौकरी / व्यवसाय (Occupation)" count={c("occCategories", "employmentTypes", "department", "designations", "occBusinessTypes")}>
          <MultiSelect label="मुख्य श्रेणी (Category)" options={PRIMARY_CATEGORIES} value={f.occCategories} onChange={(v) => set("occCategories", v)} />
          <MultiSelect label="रोजगार प्रकार (Employment Type)" options={EMPLOYMENT_TYPES} value={f.employmentTypes} onChange={(v) => set("employmentTypes", v)} />
          <TextFilter label="विभाग / संस्था (Department)" value={f.department} onChange={(v) => set("department", v)} placeholder="विभाग शोधा" />
          <MultiSelect label="पदनाम (Designation)" options={designations} value={f.designations} onChange={(v) => set("designations", v)} />
          <MultiSelect label="व्यवसाय प्रकार (Business Type)" options={[...BUSINESS_TYPES, ...SELF_EMPLOYED_TYPES]} value={f.occBusinessTypes} onChange={(v) => set("occBusinessTypes", v)} />
        </Group>

        {/* 5 AGRICULTURE */}
        <Group id="agri" icon="🌾" title="शेती (Agriculture)"
          count={c("hasFarmland", "landSizes", "landMin", "landMax", "cropSeasons", "majorCropTypes", "irrigationSources", "pumpTypes", "malguzariPond", "freeWater", "farmingTypes", "farmingTools", "toolOwnership", "toolWantBuy", "toolLoan", "contractFarming", "contractMin", "contractMax")}>
          <TriSelect label="शेती आहे का? (Has Farmland)" value={f.hasFarmland} onChange={(v) => set("hasFarmland", v)} />
          <MultiSelect label="जमिनीचे क्षेत्र (Land Size)" options={LAND_SIZES} value={f.landSizes} onChange={(v) => set("landSizes", v)} />
          <RangeInput label="क्षेत्र श्रेणी (Land Area)" unit="एकर" min={f.landMin} max={f.landMax} onMin={(v) => set("landMin", v)} onMax={(v) => set("landMax", v)} />
          <MultiSelect label="हंगाम (Crop Season)" options={["खरीप", "रब्बी (धान सोडून)", "उन्हाळी (धानासह)"]} value={f.cropSeasons} onChange={(v) => set("cropSeasons", v)} />
          <MultiSelect label="प्रमुख पीक प्रकार (Major Crop Type)" options={MAJOR_CROP_TYPES} value={f.majorCropTypes} onChange={(v) => set("majorCropTypes", v)} />
          <MultiSelect label="सिंचन स्रोत (Irrigation Source)" options={IRRIGATION_KEYS.map((i) => i.label)}
            value={f.irrigationSources.map((k) => IRRIGATION_KEYS.find((i) => i.key === k)?.label || k)}
            onChange={(labels) => set("irrigationSources", labels.map((l) => IRRIGATION_KEYS.find((i) => i.label === l)?.key || l))} />
          <MultiSelect label="पंप प्रकार (Pump Type)" options={PUMP_TYPES} value={f.pumpTypes} onChange={(v) => set("pumpTypes", v)} />
          <TriSelect label="कोहळी मालगुजारी तलाव" value={f.malguzariPond} onChange={(v) => set("malguzariPond", v)} />
          <TriSelect label="मोफत सिंचन पाणी" value={f.freeWater} onChange={(v) => set("freeWater", v)} />
          <MultiSelect label="शेतीचा प्रकार (Farming Type)" options={FARMING_TYPES} value={f.farmingTypes} onChange={(v) => set("farmingTypes", v)} />
          <MultiSelect label="शेती साधने (Equipment)" options={TOOL_KEYS.map((t) => t.label)}
            value={f.farmingTools.map((k) => TOOL_KEYS.find((t) => t.key === k)?.label || k)}
            onChange={(labels) => set("farmingTools", labels.map((l) => TOOL_KEYS.find((t) => t.label === l)?.key || l))} />
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">साधन मालकी (Ownership)</Label>
            <Select value={f.toolOwnership || "any"} onValueChange={(v) => set("toolOwnership", v === "any" ? "" : (v as any))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="any">सर्व</SelectItem>
                <SelectItem value="own">स्वतःचे आहे</SelectItem>
                <SelectItem value="not_own">नाही</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <TriSelect label="खरेदी करण्याची इच्छा?" value={f.toolWantBuy} onChange={(v) => set("toolWantBuy", v)} />
          <TriSelect label="कर्जाची आवश्यकता? (Equipment)" value={f.toolLoan} onChange={(v) => set("toolLoan", v)} />
          <TriSelect label="ठेका / बटाई शेती" value={f.contractFarming} onChange={(v) => set("contractFarming", v)} />
          <RangeInput label="ठेका / बटाई क्षेत्र" unit="एकर" min={f.contractMin} max={f.contractMax} onMin={(v) => set("contractMin", v)} onMax={(v) => set("contractMax", v)} />
        </Group>

        {/* 6 HOUSE */}
        <Group id="house" icon="🏠" title="घर व मालमत्ता (House & Assets)"
          count={c("ownsHouse", "houseTypes", "livingStatuses", "gharkulReceived", "gharkulWanted", "solarInstalled", "solarWanted", "assets", "assetMinQty")}>
          <TriSelect label="स्वतःचे घर? (Own House)" value={f.ownsHouse} onChange={(v) => set("ownsHouse", v)} />
          <MultiSelect label="घराचा प्रकार (House Type)" options={HOUSE_TYPES} value={f.houseTypes} onChange={(v) => set("houseTypes", v)} />
          <MultiSelect label="निवास स्थिती (Living Status)" options={LIVING_STATUS} value={f.livingStatuses} onChange={(v) => set("livingStatuses", v)} />
          <TriSelect label="घरकुल लाभ मिळाला?" value={f.gharkulReceived} onChange={(v) => set("gharkulReceived", v)} />
          <TriSelect label="घरकुल आवश्यक?" value={f.gharkulWanted} onChange={(v) => set("gharkulWanted", v)} />
          <TriSelect label="सोलर बसविले?" value={f.solarInstalled} onChange={(v) => set("solarInstalled", v)} />
          <TriSelect label="सोलर आवश्यक?" value={f.solarWanted} onChange={(v) => set("solarWanted", v)} />
          <MultiSelect label="घरगुती वस्तू (Assets)" options={HOUSEHOLD_ITEMS} value={f.assets} onChange={(v) => set("assets", v)} />
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">वस्तू किमान संख्या (Min Qty)</Label>
            <Select value={f.assetMinQty || "any"} onValueChange={(v) => set("assetMinQty", v === "any" ? "" : v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="any">सर्व</SelectItem>
                {Array.from({ length: 10 }, (_, i) => String(i + 1)).map((n) => (
                  <SelectItem key={n} value={n}>{n}+</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Group>

        {/* 7 BENEFITS */}
        <Group id="ben" icon="🎯" title="लाभ / सहाय्य (Benefits)"
          count={c("ladkiBahin", "ladkiBahinRegular", "ladkiBahinReasons", "criticalIllness", "medicalAidNeeded", "hasSportsperson", "sportLevels", "sportType")}>
          <TriSelect label="लाडकी बहीण लाभार्थी" value={f.ladkiBahin} onChange={(v) => set("ladkiBahin", v)} />
          <TriSelect label="लाभ नियमित मिळतो?" value={f.ladkiBahinRegular} onChange={(v) => set("ladkiBahinRegular", v)} />
          <MultiSelect label="कारण (Reason)" options={LADKI_BAHIN_REASONS} value={f.ladkiBahinReasons} onChange={(v) => set("ladkiBahinReasons", v)} />
          <TriSelect label="गंभीर आजार (Critical Illness)" value={f.criticalIllness} onChange={(v) => set("criticalIllness", v)} />
          <TriSelect label="वैद्यकीय मदत आवश्यक?" value={f.medicalAidNeeded} onChange={(v) => set("medicalAidNeeded", v)} />
          <TriSelect label="खेळाडू आहे का? (Sportsperson)" value={f.hasSportsperson} onChange={(v) => set("hasSportsperson", v)} />
          <MultiSelect label="स्तर (Level)" options={SPORT_LEVELS} value={f.sportLevels} onChange={(v) => set("sportLevels", v)} />
          <TextFilter label="खेळाचा प्रकार (Sport Type)" value={f.sportType} onChange={(v) => set("sportType", v)} placeholder="खेळ शोधा" />
        </Group>

        {/* 8 POSITION */}
        <Group id="pos" icon="🏛️" title="धारण केलेले पद (Position)"
          count={c("hasPosition", "positionTypes", "positionStatuses", "politicalLevels", "party", "representativeTypes", "representativeRoles", "organisation")}>
          <TriSelect label="पद आहे का? (Has Position)" value={f.hasPosition} onChange={(v) => set("hasPosition", v)} />
          <MultiSelect label="पदाचा प्रकार (Type)" options={POSITION_TYPES} value={f.positionTypes} onChange={(v) => set("positionTypes", v)} />
          <MultiSelect label="आजी / माजी (Status)" options={POSITION_STATUS} value={f.positionStatuses} onChange={(v) => set("positionStatuses", v)} />
          <MultiSelect label="राजकीय स्तर (Political Level)" options={POLITICAL_LEVELS} value={f.politicalLevels} onChange={(v) => set("politicalLevels", v)} />
          <TextFilter label="पक्ष (Party)" value={f.party} onChange={(v) => set("party", v)} placeholder="पक्ष शोधा" />
          <MultiSelect label="लोकप्रतिनिधी प्रकार" options={REPRESENTATIVES} value={f.representativeTypes}
            onChange={(v) => onChange({ ...f, representativeTypes: v, representativeRoles: [] })} />
          <MultiSelect label="भूमिका (Role)" options={repRoles} value={f.representativeRoles} onChange={(v) => set("representativeRoles", v)} />
          <TextFilter label="संस्था (Organisation)" value={f.organisation} onChange={(v) => set("organisation", v)} placeholder="संस्थेचे नाव" />
        </Group>

        {/* 9 BUSINESS */}
        <Group id="biz" icon="🏪" title="व्यवसाय / उद्योजक (Business)"
          count={c("entrepreneur", "bizTypes", "sideBusiness", "loanRequired", "loanMin", "loanMax", "loanPurposes")}>
          <TriSelect label="उद्योजक आहे का? (Entrepreneur)" value={f.entrepreneur} onChange={(v) => set("entrepreneur", v)} />
          <MultiSelect label="व्यवसाय प्रकार (Business Type)" options={BUSINESS_TYPES} value={f.bizTypes} onChange={(v) => set("bizTypes", v)} />
          <TriSelect label="जोड व्यवसाय (Side Business)" value={f.sideBusiness} onChange={(v) => set("sideBusiness", v)} />
          <TriSelect label="कर्जाची आवश्यकता (Loan)" value={f.loanRequired} onChange={(v) => set("loanRequired", v)} />
          <RangeInput label="कर्ज रक्कम (Loan Amount)" unit="₹ लाख" min={f.loanMin} max={f.loanMax} onMin={(v) => set("loanMin", v)} onMax={(v) => set("loanMax", v)} />
          <MultiSelect label="कर्जाचा उद्देश (Loan Purpose)" options={LOAN_PURPOSE_OPTIONS} value={f.loanPurposes} onChange={(v) => set("loanPurposes", v)} />
        </Group>
      </Accordion>
    </div>
  );
}

function uniq(arr: (string | undefined | null)[]): string[] {
  return Array.from(new Set(arr.filter((x): x is string => !!x && String(x).trim() !== ""))).sort((a, b) => a.localeCompare(b, "mr"));
}
