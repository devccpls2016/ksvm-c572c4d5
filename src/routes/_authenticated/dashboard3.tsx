import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { listAppUsers } from "@/lib/users.functions";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Kpi, KpiGrid, ChartCard, BarCh, PieCh, LineCh, StackedBar, DataTable,
  CompletionList, Empty,
} from "@/components/analytics/AnalyticsUI";
import * as A from "@/lib/analytics";
import { SurveyFilterPanel } from "@/components/SurveyFilterPanel";
import { countActive, emptyFilters, matchSurvey, type SurveyFilters } from "@/lib/survey-filters";
import {
  LayoutDashboard, MapPin, Users, GraduationCap, Briefcase, Sprout, Home,
  HeartPulse, Landmark, Database, Shuffle, RotateCcw, Filter, ChevronDown,
  CalendarRange, Info,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard3")({
  component: Dashboard3,
});

/* ------------------------------------------------------------------ setup */

type SectionId =
  | "overview" | "location" | "people" | "education" | "occupation"
  | "agri" | "housing" | "welfare" | "leadership" | "records" | "cross";

const SECTIONS: {
  id: SectionId; no: string; label: string; icon: any; groups: string[]; fields: string;
}[] = [
  { id: "overview", no: "01", label: "Overview", icon: LayoutDashboard, groups: ["loc", "fam"], fields: "surveys (all rows) · members[] · created_at" },
  { id: "location", no: "02", label: "Location Coverage", icon: MapPin, groups: ["loc"], fields: "district · taluka · village · pincode" },
  { id: "people", no: "03", label: "People & Family", icon: Users, groups: ["loc", "fam"], fields: "gender · age · marital_status · marriage_type · members[]" },
  { id: "education", no: "04", label: "Education", icon: GraduationCap, groups: ["loc", "edu", "fam"], fields: "education (head + members[])" },
  { id: "occupation", no: "05", label: "Occupation & Skills", icon: Briefcase, groups: ["loc", "occ", "edu"], fields: "occupation · job_type (head + members[])" },
  { id: "agri", no: "06", label: "Agriculture", icon: Sprout, groups: ["loc", "agri"], fields: "has_farmland · total_farmland · crops · irrigation_* · farming_tools_details" },
  { id: "housing", no: "07", label: "Housing, Assets & Solar", icon: Home, groups: ["loc", "house"], fields: "owns_house · house_type · household_items · solar_*" },
  { id: "welfare", no: "08", label: "Welfare & Health", icon: HeartPulse, groups: ["loc", "ben"], fields: "benefits_info (ladki_bahin · critical_illness · sport_*)" },
  { id: "leadership", no: "09", label: "Leadership, Business & Women", icon: Landmark, groups: ["loc", "pos", "biz", "fam"], fields: "position_data · employment_info · members[].mahila_bachat_gat" },
  { id: "records", no: "10", label: "Records, Quality & Users", icon: Database, groups: ["loc", "fam"], fields: "all fields · created_at · created_by" },
  { id: "cross", no: "11", label: "Cross Analytics", icon: Shuffle, groups: ["loc", "fam", "edu", "occ", "agri", "house", "ben", "pos", "biz"], fields: "any two dimensions" },
];

const GROUP_DIMS = [
  { id: "village", label: "गाव / Village", get: (r: A.Row) => A.txt(r.village) },
  { id: "taluka", label: "तालुका / Taluka", get: (r: A.Row) => A.txt(r.taluka) },
  { id: "district", label: "जिल्हा / District", get: (r: A.Row) => A.txt(r.district) },
  { id: "pincode", label: "पिनकोड / Pincode", get: (r: A.Row) => A.txt(r.pincode) },
  { id: "state", label: "राज्य / State", get: (r: A.Row) => A.stateOf(r) },
];

type Ctx = {
  rows: A.Row[]; people: A.Person[]; appUsers: any[]; isAdmin: boolean;
  dim: { id: string; label: string; get: (r: A.Row) => string };
};

const G = ({ children }: { children: React.ReactNode }) => (
  <div className="grid md:grid-cols-2 gap-3">{children}</div>
);

const groupsOf = (rows: A.Row[], ctx: Ctx) => A.uniq(rows, ctx.dim.get);

/* -------------------------------------------------------------- container */

function Dashboard3() {
  const { role, user } = useAuth();
  const isAdmin = role === "admin";
  const [all, setAll] = useState<A.Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [appUsers, setAppUsers] = useState<any[]>([]);
  const fetchUsers = useServerFn(listAppUsers);

  const [section, setSection] = useState<SectionId>("overview");
  const [filters, setFilters] = useState<SurveyFilters>({ ...emptyFilters });
  const [showAll, setShowAll] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [dimId, setDimId] = useState("village");

  useEffect(() => {
    supabase.from("surveys").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      setAll(data || []);
      setLoading(false);
    });
    if (isAdmin) fetchUsers({} as any).then((u: any) => setAppUsers(u || [])).catch(() => {});
  }, [isAdmin, fetchUsers]);

  const scoped = useMemo(
    () => (isAdmin ? all : all.filter((r) => r.created_by === user?.id)),
    [all, isAdmin, user?.id],
  );

  const rows = useMemo(
    () => scoped.filter((r) => {
      if (from && new Date(r.created_at) < new Date(from)) return false;
      if (to) {
        const end = new Date(to); end.setHours(23, 59, 59, 999);
        if (new Date(r.created_at) > end) return false;
      }
      return matchSurvey(r, filters);
    }),
    [scoped, filters, from, to],
  );

  const people = useMemo(() => A.allPersons(rows), [rows]);

  if (loading) return <div className="text-muted-foreground">लोड होत आहे...</div>;

  const meta = SECTIONS.find((s) => s.id === section)!;
  const dim = GROUP_DIMS.find((d) => d.id === dimId)!;
  const ctx: Ctx = { rows, people, appUsers, isAdmin, dim };
  const activeCount = countActive(filters) + (from ? 1 : 0) + (to ? 1 : 0);
  const reset = () => { setFilters({ ...emptyFilters }); setFrom(""); setTo(""); };

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-gradient-to-r from-primary via-primary/85 to-primary/60 text-primary-foreground p-5 shadow-sm">
        <h1 className="text-xl md:text-2xl font-bold">Dashboard 3 — Clean Analytics</h1>
        <p className="text-xs md:text-sm opacity-90 mt-1">
          कोहळी समाज विकास मंडळ, नागपूर — प्रत्येक कार्ड व चार्टवर तो कोणत्या फील्डमधून बनतो हे स्पष्ट लिहिलेले आहे.
        </p>
      </div>

      {/* control bar */}
      <Card className="print:hidden sticky top-14 z-20">
        <CardContent className="p-3 space-y-3">
          <div className="flex flex-wrap items-end gap-2">
            <div className="space-y-1">
              <div className="text-[10px] text-muted-foreground">विभाग / Section</div>
              <Select value={section} onValueChange={(v) => setSection(v as SectionId)}>
                <SelectTrigger className="h-8 w-60 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SECTIONS.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-xs">{s.no} · {s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <div className="text-[10px] text-muted-foreground">तुलना स्तर / Group by</div>
              <Select value={dimId} onValueChange={setDimId}>
                <SelectTrigger className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {GROUP_DIMS.map((d) => <SelectItem key={d.id} value={d.id} className="text-xs">{d.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <div className="text-[10px] text-muted-foreground flex items-center gap-1"><CalendarRange className="h-3 w-3" />From</div>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-8 w-36 text-xs" />
            </div>
            <div className="space-y-1">
              <div className="text-[10px] text-muted-foreground">To</div>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-8 w-36 text-xs" />
            </div>
            <Button variant={showAll ? "default" : "outline"} size="sm" className="h-8 text-xs" onClick={() => setShowAll((v) => !v)}>
              <Filter className="h-3.5 w-3.5 mr-1" />सर्व फिल्टर
              <ChevronDown className={`h-3.5 w-3.5 ml-1 transition-transform ${showAll ? "rotate-180" : ""}`} />
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={reset}>
              <RotateCcw className="h-3.5 w-3.5 mr-1" />Reset
            </Button>
            <div className="ml-auto flex items-center gap-2">
              {activeCount > 0 && <Badge className="text-xs">{activeCount} फिल्टर सक्रिय</Badge>}
              <Badge variant="secondary" className="text-xs">{rows.length} कुटुंबे</Badge>
              <Badge variant="secondary" className="text-xs">{people.length} सदस्य</Badge>
            </div>
          </div>

          <div className="border-t pt-3">
            <SurveyFilterPanel
              rows={scoped}
              filters={filters}
              onChange={setFilters}
              only={showAll ? undefined : meta.groups}
              title={showAll ? "सर्व फिल्टर (All fields)" : `${meta.label} — संबंधित फिल्टर`}
            />
          </div>
        </CardContent>
      </Card>

      {/* section header with data map */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader className="py-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <meta.icon className="h-4 w-4 text-primary" />
            {meta.no}. {meta.label}
          </CardTitle>
          <p className="text-[11px] text-muted-foreground flex items-start gap-1">
            <Info className="h-3 w-3 mt-0.5 shrink-0" />
            <span>
              डेटा स्रोत / Data source: <b>{meta.fields}</b> · तुलना स्तर: <b>{dim.label}</b> ·
              खालील सर्व आकडे सध्याच्या फिल्टरनुसार ({rows.length} कुटुंबे / {people.length} सदस्य).
            </span>
          </p>
        </CardHeader>
      </Card>

      <Body id={section} ctx={ctx} />
    </div>
  );
}

function Body({ id, ctx }: { id: SectionId; ctx: Ctx }) {
  switch (id) {
    case "overview": return <Overview ctx={ctx} />;
    case "location": return <Location ctx={ctx} />;
    case "people": return <People ctx={ctx} />;
    case "education": return <Education ctx={ctx} />;
    case "occupation": return <Occupation ctx={ctx} />;
    case "agri": return <Agriculture ctx={ctx} />;
    case "housing": return <Housing ctx={ctx} />;
    case "welfare": return <Welfare ctx={ctx} />;
    case "leadership": return <Leadership ctx={ctx} />;
    case "records": return <Records ctx={ctx} />;
    default: return <Cross ctx={ctx} />;
  }
}

/* ------------------------------------------------------------ 01 Overview */

function Overview({ ctx }: { ctx: Ctx }) {
  const { rows, people, dim } = ctx;
  const male = people.filter((p) => p.gender === "पुरुष").length;
  const female = people.filter((p) => p.gender === "स्त्री").length;
  const farm = rows.filter((r) => r.has_farmland).length;
  const avg = rows.length ? (people.length / rows.length).toFixed(1) : "0";

  return (
    <div className="space-y-4">
      <KpiGrid>
        <Kpi icon={Home} label="कुटुंबे / Families" value={rows.length} hint="surveys row count" />
        <Kpi icon={Users} tone="violet" label="सदस्य / Members" value={people.length} hint="head + members[]" />
        <Kpi tone="pink" label="सरासरी कुटुंब आकार" value={avg} hint="members ÷ families" />
        <Kpi tone="cyan" label={dim.label + " covered"} value={groupsOf(rows, ctx).length} hint={`unique ${dim.id}`} />
        <Kpi tone="primary" label="पुरुष / Male" value={male} hint="gender = पुरुष" />
        <Kpi tone="pink" label="स्त्री / Female" value={female} hint="gender = स्त्री" />
        <Kpi tone="green" label="शेतकरी कुटुंबे" value={farm} hint="has_farmland = true" />
        <Kpi tone="amber" label="नवीन (30 दिवस)" value={A.trend(rows, 30).reduce((a, d) => a + d.value, 0)} hint="created_at last 30 days" />
      </KpiGrid>
      <G>
        <ChartCard title="लिंग वितरण / Gender" note="Source: gender of every person (head + members[]). Unit: members.">
          <PieCh donut data={[{ name: "पुरुष", value: male }, { name: "स्त्री", value: female }, { name: "इतर", value: people.length - male - female }]} />
        </ChartCard>
        <ChartCard title="वयोगट / Age Groups" note="Source: age field. Unit: members with a recorded age.">
          <BarCh data={A.AGE_BANDS.map((b) => ({ name: b.name, value: people.filter((p) => typeof p.age === "number" && b.test(p.age)).length }))} />
        </ChartCard>
        <ChartCard title={`${dim.label} — कुटुंबे`} note={`Source: ${dim.id}. Unit: families. Top 15 shown.`}>
          <BarCh horizontal data={A.groupCount(rows, dim.get)} color="#10b981" />
        </ChartCard>
        <ChartCard title="दैनिक नोंदी / Daily Submissions" note="Source: created_at, last 30 days. Unit: surveys per day.">
          <LineCh data={A.trend(rows, 30)} />
        </ChartCard>
      </G>
    </div>
  );
}

/* ------------------------------------------------------------ 02 Location */

function Location({ ctx }: { ctx: Ctx }) {
  const { rows, dim } = ctx;
  const roll = A.locationRollup(rows, dim.get);
  return (
    <div className="space-y-4">
      <KpiGrid>
        <Kpi icon={MapPin} label="जिल्हे / Districts" value={A.uniq(rows, (r) => A.txt(r.district)).length} hint="unique district" />
        <Kpi icon={MapPin} tone="green" label="तालुके / Talukas" value={A.uniq(rows, (r) => A.txt(r.taluka)).length} hint="unique taluka" />
        <Kpi icon={MapPin} tone="amber" label="गावे / Villages" value={A.uniq(rows, (r) => A.txt(r.village)).length} hint="unique village" />
        <Kpi icon={MapPin} tone="violet" label="पिनकोड / Pincodes" value={A.uniq(rows, (r) => A.txt(r.pincode)).length} hint="unique pincode" />
      </KpiGrid>
      <G>
        <ChartCard title={`${dim.label} — कुटुंबे / Families`} note={`Source: ${dim.id}. Unit: families. Sorted high → low, top 15.`}>
          <BarCh horizontal data={A.groupCount(rows, dim.get)} color="#2563eb" />
        </ChartCard>
        <ChartCard title={`${dim.label} — सदस्य / Members`} note={`Source: ${dim.id} + members[]. Unit: persons.`}>
          <BarCh horizontal data={roll.map((r) => ({ name: r.name, value: r.members }))} color="#8b5cf6" />
        </ChartCard>
      </G>
      <DataTable
        title={`${dim.label} — Coverage Report`}
        note={`One row per ${dim.id}. Families = survey records; Members = head + members[]; Survey % = share of filtered families.`}
        columns={[
          { key: "name", label: dim.label }, { key: "families", label: "Families" },
          { key: "members", label: "Members" }, { key: "male", label: "Male" },
          { key: "female", label: "Female" }, { key: "pctOfTotal", label: "Survey %" },
        ]}
        rows={roll}
      />
      <DataTable
        title="Full Location Drill-down (District › Taluka › Village)"
        note="Source: district, taluka, village combined. Use this instead of separate district/taluka/village tables."
        columns={[
          { key: "name", label: "District › Taluka › Village" }, { key: "families", label: "Families" },
          { key: "members", label: "Members" }, { key: "pctOfTotal", label: "Survey %" },
        ]}
        rows={A.locationRollup(rows, (r) => `${A.txt(r.district) || "—"} › ${A.txt(r.taluka) || "—"} › ${A.txt(r.village) || "—"}`)}
      />
    </div>
  );
}

/* -------------------------------------------------------------- 03 People */

function People({ ctx }: { ctx: Ctx }) {
  const { rows, people, dim } = ctx;
  const male = people.filter((p) => p.gender === "पुरुष").length;
  const female = people.filter((p) => p.gender === "स्त्री").length;
  const married = people.filter((p) => p.marital_status.includes("विवाहित") && !p.marital_status.includes("अविवाहित"));
  const sizes = rows.map((r) => A.familySize(r));

  return (
    <div className="space-y-4">
      <KpiGrid>
        <Kpi icon={Users} label="एकूण सदस्य" value={people.length} hint="head + members[]" />
        <Kpi tone="primary" label="पुरुष" value={male} hint="gender = पुरुष" />
        <Kpi tone="pink" label="स्त्री" value={female} hint="gender = स्त्री" />
        <Kpi tone="green" label="विवाहित" value={married.length} hint="marital_status contains विवाहित" />
        <Kpi tone="amber" label="अविवाहित" value={people.filter((p) => p.marital_status.includes("अविवाहित")).length} hint="marital_status = अविवाहित" />
        <Kpi tone="red" label="विधवा / विधुर" value={people.filter((p) => p.marital_status.includes("विध")).length} hint="marital_status contains विध" />
        <Kpi tone="violet" label="आंतरजातीय विवाह" value={people.filter((p) => p.marriage_type.includes("आंतरजातीय")).length} hint="marriage_type" />
        <Kpi tone="cyan" label="ज्येष्ठ (60+)" value={people.filter((p) => typeof p.age === "number" && p.age >= 60).length} hint="age ≥ 60" />
      </KpiGrid>
      <G>
        <ChartCard title="कुटुंब आकार / Family Size" note="Source: 1 + members[].length per survey. Unit: families.">
          <BarCh data={A.FAMILY_SIZE_BANDS.map((b) => ({ name: b, value: sizes.filter((s) => A.familySizeBand(s) === b).length }))} color="#10b981" />
        </ChartCard>
        <ChartCard title="वैवाहिक स्थिती / Marital Status" note="Source: marital_status. Unit: members.">
          <PieCh data={A.groupCount(people.filter((p) => p.marital_status) as any, (p: any) => p.marital_status)} />
        </ChartCard>
        <ChartCard title="वयोगट × लिंग / Age × Gender" note="Source: age + gender. Unit: members. Stacked by gender.">
          <StackedBar
            columns={["पुरुष", "स्त्री"]}
            data={A.AGE_BANDS.map((b) => ({
              name: b.name,
              पुरुष: people.filter((p) => p.gender === "पुरुष" && typeof p.age === "number" && b.test(p.age)).length,
              स्त्री: people.filter((p) => p.gender === "स्त्री" && typeof p.age === "number" && b.test(p.age)).length,
            }))}
          />
        </ChartCard>
        <ChartCard title={`${dim.label} — सदस्य संख्या`} note={`Source: ${dim.id} of the family. Unit: members.`}>
          <BarCh horizontal color="#ec4899" data={groupsOf(rows, ctx).map((v) => ({ name: v, value: people.filter((p) => dim.get(p.row) === v).length }))} />
        </ChartCard>
      </G>
      <DataTable
        title="Member Register (filtered)"
        note="One row per person. Source: head fields + members[]. Export gives exactly the filtered list."
        columns={[
          { key: "name", label: "Name" }, { key: "rel", label: "Relation" }, { key: "gender", label: "Gender" },
          { key: "age", label: "Age" }, { key: "marital", label: "Marital" }, { key: "edu", label: "Education level" },
          { key: "occ", label: "Occupation group" }, { key: "village", label: "Village" }, { key: "taluka", label: "Taluka" },
        ]}
        rows={people.map((p) => ({
          name: p.name, rel: p.relationship, gender: p.gender, age: p.age ?? "",
          marital: p.marital_status, edu: A.eduLevel(p.education), occ: A.occGroup(p.occupation),
          village: A.txt(p.row.village), taluka: A.txt(p.row.taluka),
        }))}
      />
    </div>
  );
}

/* ----------------------------------------------------------- 04 Education */

function Education({ ctx }: { ctx: Ctx }) {
  const { people, dim, rows } = ctx;
  const withEdu = people.filter((p) => p.education);
  const level = (k: string) => withEdu.filter((p) => A.eduLevel(p.education) === k).length;
  const levelData = A.EDU_LEVELS.map((l) => ({ name: l.name, value: level(l.name) })).filter((d) => d.value > 0);
  const higher = ["पदवी / Graduate", "पदव्युत्तर / Postgraduate", "डॉक्टरेट / Ph.D."];

  return (
    <div className="space-y-4">
      <KpiGrid>
        <Kpi icon={GraduationCap} label="शिक्षण नोंद असलेले सदस्य" value={withEdu.length} hint={`${A.pct(withEdu.length, people.length)}% of members`} />
        <Kpi tone="green" label="पदवीधर" value={level("पदवी / Graduate")} hint="education → Graduate" />
        <Kpi tone="cyan" label="पदव्युत्तर" value={level("पदव्युत्तर / Postgraduate")} hint="education → Postgraduate" />
        <Kpi tone="violet" label="डॉक्टरेट / Ph.D." value={level("डॉक्टरेट / Ph.D.")} hint="education → Ph.D." />
        <Kpi tone="amber" label="पदविका / ITI" value={level("पदविका / Diploma")} hint="education → Diploma/ITI" />
        <Kpi tone="red" label="निरक्षर" value={level("निरक्षर / Illiterate")} hint="education → Illiterate" />
      </KpiGrid>
      <G>
        <ChartCard title="शिक्षण स्तर / Education Level" note="Source: education value mapped to a standard level. Unit: members.">
          <BarCh horizontal data={levelData} color="#2563eb" />
        </ChartCard>
        <ChartCard title="शिक्षण शाखा / Stream" note="Source: education text mapped to stream (Arts, Science, Engineering…). Unit: members.">
          <PieCh data={A.groupCount(withEdu as any, (p: any) => A.eduStream(p.education)).filter((d) => d.name !== "—")} />
        </ChartCard>
        <ChartCard title="शिक्षण × लिंग" note="Source: education level × gender. Unit: members.">
          <StackedBar
            columns={["पुरुष", "स्त्री"]}
            data={levelData.map((l) => ({
              name: l.name.split(" / ")[0]!,
              पुरुष: withEdu.filter((p) => A.eduLevel(p.education) === l.name && p.gender === "पुरुष").length,
              स्त्री: withEdu.filter((p) => A.eduLevel(p.education) === l.name && p.gender === "स्त्री").length,
            }))}
          />
        </ChartCard>
        <ChartCard title={`${dim.label} — उच्चशिक्षित`} note={`Graduates + Postgraduates + Ph.D. counted per ${dim.id}. Unit: members.`}>
          <BarCh horizontal color="#10b981" data={groupsOf(rows, ctx).map((v) => ({
            name: v,
            value: withEdu.filter((p) => dim.get(p.row) === v && higher.includes(A.eduLevel(p.education))).length,
          })).filter((d) => d.value > 0)} />
        </ChartCard>
      </G>
      <DataTable
        title="Education Summary"
        note="Members grouped by education level; share is out of members having education recorded."
        columns={[
          { key: "name", label: "Level" }, { key: "value", label: "Members" },
          { key: "male", label: "Male" }, { key: "female", label: "Female" }, { key: "share", label: "Share %" },
        ]}
        rows={levelData.map((d) => ({
          ...d,
          male: withEdu.filter((p) => A.eduLevel(p.education) === d.name && p.gender === "पुरुष").length,
          female: withEdu.filter((p) => A.eduLevel(p.education) === d.name && p.gender === "स्त्री").length,
          share: A.pct(d.value, withEdu.length),
        }))}
      />
      <DataTable
        title="Highly Educated Directory"
        note="Members whose education level is Graduate / Postgraduate / Ph.D. Source: education + location fields."
        columns={[
          { key: "name", label: "Name" }, { key: "edu", label: "Education (as recorded)" },
          { key: "occ", label: "Occupation group" }, { key: "village", label: "Village" }, { key: "district", label: "District" },
        ]}
        rows={withEdu.filter((p) => higher.includes(A.eduLevel(p.education))).map((p) => ({
          name: p.name, edu: p.education, occ: A.occGroup(p.occupation),
          village: A.txt(p.row.village), district: A.txt(p.row.district),
        }))}
      />
    </div>
  );
}

/* ---------------------------------------------------------- 05 Occupation */

function Occupation({ ctx }: { ctx: Ctx }) {
  const { people, rows, dim } = ctx;
  const withOcc = people.filter((p) => p.occupation);
  const g = (k: string) => withOcc.filter((p) => A.occGroup(p.occupation) === k).length;
  const data = A.groupCount(withOcc as any, (p: any) => A.occGroup(p.occupation));
  const professionals = people.filter((p) => A.professionOf(p.occupation));

  return (
    <div className="space-y-4">
      <KpiGrid>
        <Kpi icon={Briefcase} label="व्यवसाय नोंद असलेले सदस्य" value={withOcc.length} hint={`${A.pct(withOcc.length, people.length)}% of members`} />
        <Kpi tone="green" label="सरकारी कर्मचारी" value={g("सरकारी कर्मचारी")} hint="occupation → Government" />
        <Kpi tone="cyan" label="खाजगी कर्मचारी" value={g("खाजगी कर्मचारी")} hint="occupation → Private" />
        <Kpi tone="amber" label="स्वरोजगार" value={g("स्वरोजगार / Self Employed")} hint="occupation → Self employed" />
        <Kpi tone="violet" label="व्यवसाय मालक" value={g("व्यवसाय / Business Owner")} hint="occupation → Business owner" />
        <Kpi tone="lime" label="शेतकरी" value={g("शेतकरी / Farmer")} hint="occupation → Farmer" />
        <Kpi tone="red" label="बेरोजगार" value={g("बेरोजगार / Unemployed")} hint="occupation → Unemployed" />
        <Kpi tone="pink" label="व्यावसायिक मनुष्यबळ" value={professionals.length} hint="doctors, engineers, teachers…" />
      </KpiGrid>
      <G>
        <ChartCard title="व्यवसाय श्रेणी / Occupation Category" note="Source: occupation text mapped to a standard category. Unit: members.">
          <BarCh horizontal data={data} color="#2563eb" />
        </ChartCard>
        <ChartCard title="व्यावसायिक श्रेणी / Professional Skills Pool" note="Source: occupation matched to profession (Doctor, Engineer, Teacher…). Unit: members.">
          <BarCh horizontal color="#8b5cf6" data={A.PROFESSIONS.map((p) => ({ name: p.name, value: people.filter((x) => A.professionOf(x.occupation) === p.name).length })).filter((d) => d.value > 0)} />
        </ChartCard>
        <ChartCard title="व्यवसाय × लिंग" note="Source: occupation category × gender. Unit: members.">
          <StackedBar
            columns={["पुरुष", "स्त्री"]}
            data={data.slice(0, 10).map((d) => ({
              name: d.name.split(" / ")[0]!,
              पुरुष: withOcc.filter((p) => A.occGroup(p.occupation) === d.name && p.gender === "पुरुष").length,
              स्त्री: withOcc.filter((p) => A.occGroup(p.occupation) === d.name && p.gender === "स्त्री").length,
            }))}
          />
        </ChartCard>
        <ChartCard title={`${dim.label} — रोजगार रचना`} note={`Government / Private / Self-employed / Business / Unemployed per ${dim.id}. Unit: members.`}>
          <StackedBar
            columns={["सरकारी", "खाजगी", "स्वरोजगार", "व्यवसाय", "बेरोजगार"]}
            data={groupsOf(rows, ctx).map((v) => {
              const sub = withOcc.filter((p) => dim.get(p.row) === v);
              const c = (k: string) => sub.filter((p) => A.occGroup(p.occupation) === k).length;
              return {
                name: v, "सरकारी": c("सरकारी कर्मचारी"), "खाजगी": c("खाजगी कर्मचारी"),
                "स्वरोजगार": c("स्वरोजगार / Self Employed"), "व्यवसाय": c("व्यवसाय / Business Owner"),
                "बेरोजगार": c("बेरोजगार / Unemployed"),
              };
            })}
          />
        </ChartCard>
      </G>
      <DataTable
        title="Occupation Summary"
        note="Members grouped by occupation category with gender split and geographic spread."
        columns={[
          { key: "name", label: "Occupation" }, { key: "value", label: "Members" },
          { key: "male", label: "Male" }, { key: "female", label: "Female" },
          { key: "places", label: dim.label }, { key: "share", label: "Share %" },
        ]}
        rows={data.map((d) => {
          const sub = withOcc.filter((p) => A.occGroup(p.occupation) === d.name);
          return {
            ...d,
            male: sub.filter((p) => p.gender === "पुरुष").length,
            female: sub.filter((p) => p.gender === "स्त्री").length,
            places: new Set(sub.map((p) => dim.get(p.row))).size,
            share: A.pct(d.value, withOcc.length),
          };
        })}
      />
      <DataTable
        title="Professional Directory (Doctors, Engineers, Teachers, Officers…)"
        note="Source: occupation matched to a profession. Useful as a community skills register."
        columns={[
          { key: "name", label: "Name" }, { key: "profession", label: "Profession" },
          { key: "education", label: "Education" }, { key: "village", label: "Village" },
          { key: "taluka", label: "Taluka" }, { key: "district", label: "District" },
        ]}
        rows={professionals.map((p) => ({
          name: p.name, profession: A.professionOf(p.occupation), education: p.education,
          village: A.txt(p.row.village), taluka: A.txt(p.row.taluka), district: A.txt(p.row.district),
        }))}
      />
    </div>
  );
}

/* --------------------------------------------------------- 06 Agriculture */

function Agriculture({ ctx }: { ctx: Ctx }) {
  const { rows, dim } = ctx;
  const farm = rows.filter((r) => r.has_farmland);
  const sum = (arr: A.Row[], k: string) => Math.round(arr.reduce((a, r) => a + A.num(r[k]), 0) * 10) / 10;
  const cropTypes = A.countMulti(rows, (r) => (Array.isArray(r.major_crop_types) ? r.major_crop_types : []));
  const irr = A.countMulti(rows, (r) => (Array.isArray(r.irrigation_sources) ? r.irrigation_sources : []));
  const det = (key: string, f: (d: any) => boolean) => rows.filter((r) => f(((r.irrigation_details || {}) as any)[key] || {})).length;
  const tool = (r: A.Row, key: string) => ((r.farming_tools_details || {}) as any)[key] || {};
  const toolStats = A.TOOL_KEYS.map((k) => ({
    name: k.label,
    owners: rows.filter((r) => tool(r, k.key).has).length,
    qty: rows.reduce((a, r) => a + A.num(tool(r, k.key).count), 0),
    wants: rows.filter((r) => tool(r, k.key).has === false && tool(r, k.key).want_to_buy).length,
    loan: rows.filter((r) => tool(r, k.key).needs_loan).length,
  }));

  return (
    <div className="space-y-4">
      <KpiGrid>
        <Kpi icon={Sprout} tone="green" label="शेतकरी कुटुंबे" value={farm.length} hint={`has_farmland = true (${A.pct(farm.length, rows.length)}%)`} />
        <Kpi tone="lime" label="एकूण जमीन (एकर)" value={sum(farm, "total_farmland")} hint="Σ total_farmland" />
        <Kpi tone="cyan" label="सिंचित क्षेत्र (एकर)" value={sum(farm, "irrigated_area")} hint="Σ irrigated_area" />
        <Kpi tone="amber" label="कोरडवाहू क्षेत्र (एकर)" value={sum(farm, "dryland_area")} hint="Σ dryland_area" />
        <Kpi tone="violet" label="सोलर पंप" value={A.IRRIGATION_KEYS.reduce((a, k) => a + det(k.key, (d) => !!d.solar), 0)} hint="irrigation_details.*.solar" />
        <Kpi tone="primary" label="मालगुजारी तलाव" value={det("pond", (d) => !!d.is_kohli_malguzari)} hint="irrigation_details.pond.is_kohli_malguzari" />
        <Kpi tone="pink" label="साधन खरेदीची मागणी" value={toolStats.reduce((a, s) => a + s.wants, 0)} hint="farming_tools_details.*.want_to_buy" />
        <Kpi tone="red" label="कर्जाची आवश्यकता" value={toolStats.reduce((a, s) => a + s.loan, 0)} hint="farming_tools_details.*.needs_loan" />
      </KpiGrid>
      <G>
        <ChartCard title="जमीन आकार / Landholding" note="Source: total_farmland grouped into acre bands. Unit: farming families.">
          <BarCh data={A.LAND_BANDS.map((b) => ({ name: b, value: farm.filter((r) => A.landBand(A.num(r.total_farmland)) === b).length }))} color="#10b981" />
        </ChartCard>
        <ChartCard title="हंगामनिहाय क्षेत्र / Seasonal Area" note="Source: kharif_area, rabi_area, summer_area. Unit: total acres (sum).">
          <BarCh data={[
            { name: "खरीप", value: sum(farm, "kharif_area") },
            { name: "रब्बी (धान सोडून)", value: sum(farm, "rabi_area") },
            { name: "उन्हाळी (धानासह)", value: sum(farm, "summer_area") },
          ]} color="#f59e0b" />
        </ChartCard>
        <ChartCard title="मुख्य पीक प्रकार / Crop Types" note="Source: major_crop_types[] (multi-select). Unit: families selecting the crop.">
          {cropTypes.length ? <BarCh horizontal data={cropTypes} color="#84cc16" /> : <Empty />}
        </ChartCard>
        <ChartCard title="सिंचन साधन / Irrigation Sources" note="Source: irrigation_sources[] (multi-select). Unit: families.">
          {irr.length ? <BarCh horizontal data={irr} color="#06b6d4" /> : <Empty />}
        </ChartCard>
        <ChartCard title="शेती साधने — मालकी vs मागणी" note="Source: farming_tools_details. Green = owns, amber = wants to buy, red = needs loan. Unit: families.">
          <StackedBar
            columns={["मालकी", "खरेदीची इच्छा", "कर्ज आवश्यक"]}
            data={toolStats.map((s) => ({ name: s.name, "मालकी": s.owners, "खरेदीची इच्छा": s.wants, "कर्ज आवश्यक": s.loan }))}
          />
        </ChartCard>
        <ChartCard title={`${dim.label} — एकूण जमीन (एकर)`} note={`Σ total_farmland per ${dim.id}. Unit: acres.`}>
          <BarCh horizontal color="#8b5cf6" data={groupsOf(farm, ctx).map((v) => ({
            name: v, value: Math.round(farm.filter((r) => dim.get(r) === v).reduce((a, r) => a + A.num(r.total_farmland), 0)),
          }))} />
        </ChartCard>
      </G>
      <DataTable
        title={`Agriculture Report by ${dim.label}`}
        note="Farmers = families with has_farmland; areas are sums of the respective acre fields."
        columns={[
          { key: "name", label: dim.label }, { key: "farmers", label: "Farmer families" },
          { key: "land", label: "Land (acre)" }, { key: "irrigated", label: "Irrigated" },
          { key: "dry", label: "Dryland" }, { key: "kharif", label: "Kharif" },
          { key: "rabi", label: "Rabi" }, { key: "summer", label: "Summer" },
        ]}
        rows={groupsOf(farm, ctx).map((v) => {
          const sub = farm.filter((r) => dim.get(r) === v);
          return {
            name: v, farmers: sub.length, land: sum(sub, "total_farmland"),
            irrigated: sum(sub, "irrigated_area"), dry: sum(sub, "dryland_area"),
            kharif: sum(sub, "kharif_area"), rabi: sum(sub, "rabi_area"), summer: sum(sub, "summer_area"),
          };
        })}
      />
      <DataTable
        title="Irrigation & Equipment Detail"
        note="Irrigation rows: units and pump type from irrigation_details. Equipment rows: ownership / demand / loan from farming_tools_details."
        columns={[
          { key: "name", label: "Item" }, { key: "kind", label: "Type" },
          { key: "families", label: "Families" }, { key: "qty", label: "Units" },
          { key: "extra1", label: "Electric / Wants to buy" }, { key: "extra2", label: "Solar / Loan needed" },
        ]}
        rows={[
          ...A.IRRIGATION_KEYS.map((k) => ({
            name: k.label, kind: "सिंचन / Irrigation",
            families: rows.filter((r) => A.num(((r.irrigation_details || {}) as any)[k.key]?.count) > 0).length,
            qty: rows.reduce((a, r) => a + A.num(((r.irrigation_details || {}) as any)[k.key]?.count), 0),
            extra1: det(k.key, (d) => !!d.electric),
            extra2: det(k.key, (d) => !!d.solar),
          })),
          ...toolStats.map((s) => ({
            name: s.name, kind: "साधन / Equipment",
            families: s.owners, qty: s.qty, extra1: s.wants, extra2: s.loan,
          })),
        ]}
      />
    </div>
  );
}

/* ------------------------------------------------------------- 07 Housing */

function Housing({ ctx }: { ctx: Ctx }) {
  const { rows, dim } = ctx;
  const c = (f: (r: A.Row) => boolean) => rows.filter(f).length;
  const assets = A.countMulti(rows, (r) => (Array.isArray(r.household_items) ? r.household_items : []));
  const qty = (name: string) => rows.reduce((a, r) => a + A.num((r.household_item_counts || {})[name]), 0);

  return (
    <div className="space-y-4">
      <KpiGrid>
        <Kpi icon={Home} label="स्वतःचे घर" value={c((r) => !!r.owns_house)} hint="owns_house = true" />
        <Kpi tone="amber" label="भाड्याने / अवलंबून" value={c((r) => !r.owns_house)} hint="owns_house = false / living_status" />
        <Kpi tone="green" label="पक्के घर" value={c((r) => A.txt(r.house_type).includes("पक्क"))} hint="house_type contains पक्क" />
        <Kpi tone="red" label="कच्चे घर" value={c((r) => A.txt(r.house_type).includes("माती") || A.txt(r.house_type).includes("कच्च"))} hint="house_type contains माती/कच्च" />
        <Kpi tone="violet" label="घरकुल मिळाले" value={c((r) => !!r.gharkul_received)} hint="gharkul_received" />
        <Kpi tone="pink" label="घरकुल आवश्यक" value={c((r) => !!r.gharkul_wanted)} hint="gharkul_wanted" />
        <Kpi tone="amber" label="सोलर बसवले" value={c((r) => !!r.solar_panel_installed)} hint="solar_panel_installed" />
        <Kpi tone="cyan" label="सोलर आवश्यक" value={c((r) => !!r.solar_panel_wanted)} hint="solar_panel_wanted" />
      </KpiGrid>
      <G>
        <ChartCard title="घर प्रकार / House Type" note="Source: house_type. Unit: families.">
          <PieCh donut data={A.groupCount(rows.filter((r) => A.txt(r.house_type)), (r) => A.txt(r.house_type))} />
        </ChartCard>
        <ChartCard title="घरकुल व सोलर स्थिती" note="Source: gharkul_received / gharkul_wanted / solar_panel_installed / solar_panel_wanted. Unit: families.">
          <BarCh data={[
            { name: "घरकुल मिळाले", value: c((r) => !!r.gharkul_received) },
            { name: "घरकुल आवश्यक", value: c((r) => !!r.gharkul_wanted) },
            { name: "सोलर बसवले", value: c((r) => !!r.solar_panel_installed) },
            { name: "सोलर आवश्यक", value: c((r) => !!r.solar_panel_wanted) },
          ]} color="#f59e0b" />
        </ChartCard>
        <ChartCard title="घरगुती वस्तू / Household Assets" note="Source: household_items[] (multi-select). Unit: families owning the item.">
          {assets.length ? <BarCh horizontal data={assets} color="#06b6d4" /> : <Empty />}
        </ChartCard>
        <ChartCard title={`${dim.label} — घर व घरकुल`} note={`Own house vs Gharkul required per ${dim.id}. Unit: families.`}>
          <StackedBar
            columns={["स्वतःचे घर", "घरकुल आवश्यक"]}
            data={groupsOf(rows, ctx).map((v) => {
              const sub = rows.filter((r) => dim.get(r) === v);
              return { name: v, "स्वतःचे घर": sub.filter((r) => r.owns_house).length, "घरकुल आवश्यक": sub.filter((r) => r.gharkul_wanted).length };
            })}
          />
        </ChartCard>
      </G>
      <DataTable
        title="Household Assets Report"
        note="Families = count owning the item (household_items[]); Quantity = Σ household_item_counts for that item."
        columns={[
          { key: "name", label: "Asset" }, { key: "families", label: "Families" },
          { key: "pct", label: "Ownership %" }, { key: "qty", label: "Total quantity" },
        ]}
        rows={assets.map((o) => ({ name: o.name, families: o.value, pct: A.pct(o.value, rows.length), qty: qty(o.name) || o.value }))}
      />
      <DataTable
        title={`Housing & Solar Report by ${dim.label}`}
        note="All columns are family counts from the housing and solar fields of the survey."
        columns={[
          { key: "name", label: dim.label }, { key: "families", label: "Families" },
          { key: "own", label: "Own house" }, { key: "pakka", label: "Pucca" },
          { key: "gharkulR", label: "Gharkul received" }, { key: "gharkulN", label: "Gharkul needed" },
          { key: "solarI", label: "Solar installed" }, { key: "solarN", label: "Solar needed" },
        ]}
        rows={groupsOf(rows, ctx).map((v) => {
          const sub = rows.filter((r) => dim.get(r) === v);
          return {
            name: v, families: sub.length,
            own: sub.filter((r) => r.owns_house).length,
            pakka: sub.filter((r) => A.txt(r.house_type).includes("पक्क")).length,
            gharkulR: sub.filter((r) => r.gharkul_received).length,
            gharkulN: sub.filter((r) => r.gharkul_wanted).length,
            solarI: sub.filter((r) => r.solar_panel_installed).length,
            solarN: sub.filter((r) => r.solar_panel_wanted).length,
          };
        })}
      />
    </div>
  );
}

/* ------------------------------------------------------------- 08 Welfare */

function Welfare({ ctx }: { ctx: Ctx }) {
  const { rows, dim } = ctx;
  const b = (r: A.Row) => (r.benefits_info || {}) as any;
  const benef = rows.filter((r) => b(r).ladki_bahin);
  const regular = benef.filter((r) => b(r).ladki_bahin_regular).length;
  const ill = rows.filter((r) => b(r).critical_illness);
  const aid = rows.filter((r) => b(r).medical_aid_needed);
  const sp = rows.filter((r) => b(r).has_sportsperson);
  const reasons = A.countMulti(rows, (r) => [
    ...(b(r).ladki_bahin_beneficiaries || []).map((x: any) => A.txt(x?.reason)),
    ...(b(r).ladki_bahin_non_beneficiaries || []).map((x: any) => A.txt(x?.reason)),
  ].filter(Boolean));

  return (
    <div className="space-y-4">
      <KpiGrid>
        <Kpi label="लाडकी बहीण लाभार्थी कुटुंबे" value={benef.length} hint={`benefits_info.ladki_bahin (${A.pct(benef.length, rows.length)}%)`} />
        <Kpi tone="green" label="नियमित लाभ" value={regular} hint="ladki_bahin_regular = true" />
        <Kpi tone="red" label="अनियमित लाभ" value={benef.length - regular} hint="beneficiary but not regular" />
        <Kpi tone="amber" label="लाभ न मिळालेली कुटुंबे" value={rows.filter((r) => b(r).ladki_bahin === false).length} hint="ladki_bahin = false" />
        <Kpi icon={HeartPulse} tone="red" label="गंभीर आजार असलेली कुटुंबे" value={ill.length} hint="critical_illness = true" />
        <Kpi tone="violet" label="वैद्यकीय मदत आवश्यक" value={aid.length} hint="medical_aid_needed = true" />
        <Kpi tone="cyan" label="खेळाडू असलेली कुटुंबे" value={sp.length} hint="has_sportsperson = true" />
        <Kpi tone="lime" label="नोंदवलेली कारणे" value={reasons.reduce((a, r) => a + r.value, 0)} hint="KYC / Aadhaar / DBT reasons" />
      </KpiGrid>
      <G>
        <ChartCard title="लाडकी बहीण स्थिती" note="Source: benefits_info.ladki_bahin + ladki_bahin_regular. Unit: families.">
          <PieCh donut data={[
            { name: "नियमित लाभ", value: regular },
            { name: "लाभ पण अनियमित", value: benef.length - regular },
            { name: "लाभ नाही", value: rows.filter((r) => b(r).ladki_bahin === false).length },
          ]} />
        </ChartCard>
        <ChartCard title="लाभ न मिळण्याची कारणे" note="Source: reason fields inside ladki_bahin beneficiary / non-beneficiary lists. Unit: mentions.">
          {reasons.length ? <BarCh horizontal data={reasons} color="#ef4444" /> : <Empty />}
        </ChartCard>
        <ChartCard title="आरोग्य / Health" note="Source: critical_illness and medical_aid_needed. Unit: families.">
          <BarCh data={[
            { name: "गंभीर आजार", value: ill.length },
            { name: "मदत आवश्यक", value: aid.length },
            { name: "आजार नाही", value: rows.length - ill.length },
          ]} color="#ec4899" />
        </ChartCard>
        <ChartCard title="खेळाडू स्तर / Sports Level" note="Source: benefits_info.sport_level (families having a sportsperson). Unit: families.">
          {sp.length ? <PieCh data={A.groupCount(sp, (r) => A.txt(b(r).sport_level) || "—")} /> : <Empty />}
        </ChartCard>
      </G>
      <DataTable
        title={`Welfare Report by ${dim.label}`}
        note="Coverage % = Ladki Bahin beneficiary families ÷ families in that location."
        columns={[
          { key: "name", label: dim.label }, { key: "families", label: "Families" },
          { key: "lb", label: "Ladki Bahin" }, { key: "reg", label: "Regular" },
          { key: "ill", label: "Critical illness" }, { key: "aid", label: "Medical aid needed" },
          { key: "sport", label: "Sportspersons" }, { key: "pct", label: "Coverage %" },
        ]}
        rows={groupsOf(rows, ctx).map((v) => {
          const sub = rows.filter((r) => dim.get(r) === v);
          const lb = sub.filter((r) => b(r).ladki_bahin).length;
          return {
            name: v, families: sub.length, lb, reg: sub.filter((r) => b(r).ladki_bahin_regular).length,
            ill: sub.filter((r) => b(r).critical_illness).length,
            aid: sub.filter((r) => b(r).medical_aid_needed).length,
            sport: sub.filter((r) => b(r).has_sportsperson).length,
            pct: A.pct(lb, sub.length),
          };
        })}
      />
      <DataTable
        title="Medical Assistance & Sports Register"
        note="Families flagged for critical illness, medical assistance, or having a sportsperson."
        columns={[
          { key: "head", label: "Family head" }, { key: "illness", label: "Critical illness" },
          { key: "aid", label: "Aid needed" }, { key: "sport", label: "Sport" },
          { key: "level", label: "Level" }, { key: "village", label: "Village" }, { key: "mobile", label: "Mobile" },
        ]}
        rows={rows.filter((r) => b(r).critical_illness || b(r).medical_aid_needed || b(r).has_sportsperson).map((r) => ({
          head: r.head_name,
          illness: b(r).critical_illness ? "होय" : "—",
          aid: b(r).medical_aid_needed ? "होय" : "—",
          sport: A.txt(b(r).sport_type) || "—",
          level: A.txt(b(r).sport_level) || "—",
          village: A.txt(r.village), mobile: A.txt(r.mobile),
        }))}
      />
    </div>
  );
}

/* ---------------------------------------------------------- 09 Leadership */

function Leadership({ ctx }: { ctx: Ctx }) {
  const { rows, people, dim } = ctx;
  const pos = A.allPositions(rows);
  const t = (k: string) => pos.filter((p) => A.txt(p.type).includes(k)).length;
  const e = (r: A.Row) => (r.employment_info || {}) as any;
  const entrepreneurs = rows.filter((r) => e(r).has_entrepreneur);
  const side = rows.filter((r) => e(r).has_side_business);
  const women = people.filter((p) => p.gender === "स्त्री");
  const shg = (f: (g: any) => boolean) => women.filter((w) => w.bachat_gat && f(w.bachat_gat)).length;

  return (
    <div className="space-y-4">
      <KpiGrid>
        <Kpi icon={Landmark} label="एकूण पदे" value={pos.length} hint="position_data.positions[]" />
        <Kpi tone="green" label="आजी पदाधिकारी" value={pos.filter((p) => A.txt(p.status).includes("आजी")).length} hint="status = आजी" />
        <Kpi tone="amber" label="माजी पदाधिकारी" value={pos.filter((p) => A.txt(p.status).includes("माजी")).length} hint="status = माजी" />
        <Kpi tone="violet" label="लोकप्रतिनिधी" value={t("लोकप्रतिनिधी")} hint="type = लोकप्रतिनिधी" />
        <Kpi tone="cyan" label="उद्योजक कुटुंबे" value={entrepreneurs.length} hint="employment_info.has_entrepreneur" />
        <Kpi tone="lime" label="जोड व्यवसाय" value={side.length} hint="employment_info.has_side_business" />
        <Kpi tone="pink" label="बचत गट सदस्य महिला" value={shg((g) => g.is_member)} hint="members[].mahila_bachat_gat.is_member" />
        <Kpi tone="primary" label="बचत गटात सहभागी इच्छुक" value={shg((g) => g.wants_to_join)} hint="wants_to_join = true" />
      </KpiGrid>
      <G>
        <ChartCard title="पद प्रकार / Position Type" note="Source: position_data type (राजकीय / सामाजिक / लोकप्रतिनिधी). Unit: positions.">
          {pos.length ? <PieCh donut data={A.groupCount(pos, (p) => A.txt(p.type) || "—")} /> : <Empty />}
        </ChartCard>
        <ChartCard title="पक्षनिहाय / Party-wise" note="Source: party_name (or party_name_other). Unit: positions.">
          {pos.length ? <BarCh horizontal data={A.groupCount(pos.filter((p) => p.party_name), (p) => A.txt(p.party_name_other) || A.txt(p.party_name))} color="#2563eb" /> : <Empty />}
        </ChartCard>
        <ChartCard title="उद्योजकता / Entrepreneurship" note="Source: employment_info.has_entrepreneur & has_side_business. Unit: families.">
          <BarCh data={[
            { name: "उद्योजक", value: entrepreneurs.length },
            { name: "जोड व्यवसाय", value: side.length },
            { name: "नाही", value: rows.length - entrepreneurs.length },
          ]} color="#8b5cf6" />
        </ChartCard>
        <ChartCard title="महिला बचत गट / SHG" note="Source: members[].mahila_bachat_gat for female members. Unit: women.">
          <PieCh data={[
            { name: "सदस्य", value: shg((g) => g.is_member) },
            { name: "इच्छुक", value: shg((g) => g.wants_to_join) },
            { name: "घरगुती व्यवसाय", value: shg((g) => g.has_rural_home_business) },
            { name: "व्यवसाय सुरू करू इच्छिते", value: shg((g) => g.wants_to_start_business) },
          ]} />
        </ChartCard>
      </G>
      <DataTable
        title="Leadership Register"
        note="One row per position held. Source: position_data.positions[] with the linked person name."
        columns={[
          { key: "person", label: "Person" }, { key: "type", label: "Type" }, { key: "status", label: "आजी / माजी" },
          { key: "level", label: "Level" }, { key: "rep", label: "Role" }, { key: "party", label: "Party" },
          { key: "term", label: "Term" }, { key: "village", label: "Village" },
        ]}
        rows={pos.map((p) => ({
          person: p.person_name || p.row.head_name, type: p.type, status: p.status,
          level: p.political_level, rep: p.representative_type || p.coop_role || p.social_role,
          party: p.party_name_other || p.party_name,
          term: [p.term_from, p.term_to].filter(Boolean).join(" – "),
          village: A.txt(p.row.village),
        }))}
      />
      <DataTable
        title="Business & Women Enterprise Register"
        note="Families with a business/side business plus women running or planning a home enterprise."
        columns={[
          { key: "name", label: "Name" }, { key: "kind", label: "Record type" },
          { key: "detail", label: "Business" }, { key: "extra", label: "Interest / Location" },
          { key: "village", label: "Village" },
        ]}
        rows={[
          ...entrepreneurs.map((r) => ({ name: r.head_name, kind: "उद्योजक कुटुंब", detail: A.txt(e(r).entrepreneur_details), extra: A.txt(e(r).entrepreneur_address), village: A.txt(r.village) })),
          ...side.map((r) => ({ name: r.head_name, kind: "जोड व्यवसाय", detail: A.txt(e(r).side_business_details), extra: "—", village: A.txt(r.village) })),
          ...women.filter((w) => w.bachat_gat).map((w) => ({
            name: w.name, kind: "महिला बचत गट / व्यवसाय",
            detail: A.txt(w.bachat_gat.business_name) || (w.bachat_gat.is_member ? "बचत गट सदस्य" : "—"),
            extra: A.txt(w.bachat_gat.desired_business) || (w.bachat_gat.wants_to_join ? "सहभागी होऊ इच्छिते" : "—"),
            village: A.txt(w.row.village),
          })),
        ]}
      />
      <ChartCard title={`${dim.label} — नेतृत्व व उद्योजकता`} wide note={`Positions and entrepreneur families per ${dim.id}.`}>
        <StackedBar
          columns={["पदे", "उद्योजक कुटुंबे"]}
          data={groupsOf(rows, ctx).map((v) => ({
            name: v,
            "पदे": pos.filter((p) => dim.get(p.row) === v).length,
            "उद्योजक कुटुंबे": entrepreneurs.filter((r) => dim.get(r) === v).length,
          }))}
        />
      </ChartCard>
    </div>
  );
}

/* ------------------------------------------------------------- 10 Records */

function Records({ ctx }: { ctx: Ctx }) {
  const { rows, appUsers, isAdmin, dim } = ctx;
  const comp = A.completeness(rows);
  const missing = (f: (r: A.Row) => boolean) => rows.filter(f).length;
  const complete = rows.filter((r) => r.head_name && r.village && r.mobile && r.education && r.occupation && (r.members || []).length > 0).length;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const weekStart = new Date(today); weekStart.setDate(today.getDate() - 6);
  const since = (d: Date) => rows.filter((r) => new Date(r.created_at) >= d).length;

  const byUser = appUsers.map((u) => {
    const sub = rows.filter((r) => r.created_by === u.id);
    return {
      name: u.full_name || u.email, surveys: sub.length,
      members: A.allPersons(sub).length,
      places: A.uniq(sub, dim.get).length,
      last: sub[0] ? new Date(sub[0].created_at).toLocaleDateString("en-GB") : "—",
    };
  }).sort((a, b) => b.surveys - a.surveys);

  return (
    <div className="space-y-4">
      <KpiGrid>
        <Kpi label="एकूण नोंदी" value={rows.length} hint="filtered survey records" />
        <Kpi tone="green" label="पूर्ण नोंदी" value={complete} hint="head, village, mobile, education, occupation, members all present" />
        <Kpi tone="red" label="अपूर्ण नोंदी" value={rows.length - complete} hint="one or more key fields missing" />
        <Kpi tone="amber" label="संभाव्य डुप्लिकेट" value={A.duplicates(rows)} hint="same head_name + village + mobile" />
        <Kpi tone="violet" label="आज" value={since(today)} hint="created_at = today" />
        <Kpi tone="cyan" label="या आठवड्यात" value={since(weekStart)} hint="created_at last 7 days" />
        <Kpi tone="lime" label="एकूण पूर्णता" value={`${comp.overall}%`} hint="average of section completion" />
        <Kpi tone="pink" label="सक्रिय सर्वेक्षक" value={byUser.filter((u) => u.surveys > 0).length} hint="users with ≥1 record" />
      </KpiGrid>
      <G>
        <ChartCard title="दैनिक नोंदी / Daily Submissions" note="Source: created_at, last 30 days. Unit: surveys per day.">
          <LineCh data={A.trend(rows, 30)} />
        </ChartCard>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">विभागनिहाय पूर्णता / Section Completion</CardTitle>
            <p className="text-[10px] text-muted-foreground">% of required fields filled in each part of the form.</p>
          </CardHeader>
          <CardContent><CompletionList items={comp.per} /></CardContent>
        </Card>
        <ChartCard title="त्रुटी / Missing Data" note="Families where the given field is empty. Unit: families.">
          <BarCh horizontal color="#ef4444" data={[
            { name: "Mobile", value: missing((r) => !A.txt(r.mobile)) },
            { name: "Pincode", value: missing((r) => !A.txt(r.pincode)) },
            { name: "Education", value: missing((r) => !A.txt(r.education)) },
            { name: "Occupation", value: missing((r) => !A.txt(r.occupation)) },
            { name: "Agriculture", value: missing((r) => r.has_farmland == null) },
            { name: "Members", value: missing((r) => !(r.members || []).length) },
          ]} />
        </ChartCard>
        {isAdmin && (
          <ChartCard title="सर्वेक्षकनिहाय नोंदी / Surveys per User" note="Source: created_by matched to app users. Unit: surveys.">
            <BarCh horizontal color="#2563eb" data={byUser.filter((u) => u.surveys > 0).map((u) => ({ name: u.name, value: u.surveys }))} />
          </ChartCard>
        )}
      </G>
      {isAdmin && (
        <DataTable
          title="Survey User Performance"
          note="Counts are limited to the currently filtered records."
          columns={[
            { key: "name", label: "Survey user" }, { key: "surveys", label: "Surveys" },
            { key: "members", label: "Members" }, { key: "places", label: dim.label },
            { key: "last", label: "Last submission" },
          ]}
          rows={byUser}
        />
      )}
      <DataTable
        title="Survey Master Records"
        note="One row per family. This is the exportable master list of the filtered data."
        columns={[
          { key: "head", label: "Family head" }, { key: "mobile", label: "Mobile" },
          { key: "village", label: "Village" }, { key: "taluka", label: "Taluka" },
          { key: "district", label: "District" }, { key: "members", label: "Members" },
          { key: "farm", label: "Farmland" }, { key: "date", label: "Created" },
        ]}
        rows={rows.map((r) => ({
          head: A.txt(r.head_name), mobile: A.txt(r.mobile), village: A.txt(r.village),
          taluka: A.txt(r.taluka), district: A.txt(r.district), members: A.familySize(r),
          farm: r.has_farmland ? `${A.num(r.total_farmland)} एकर` : "नाही",
          date: new Date(r.created_at).toLocaleDateString("en-GB"),
        }))}
      />
      <DataTable
        title="Incomplete Records — Action List"
        note="Records missing at least one key field, with the exact missing field names."
        columns={[
          { key: "head", label: "Family head" }, { key: "village", label: "Village" },
          { key: "missing", label: "Missing fields" }, { key: "date", label: "Created" },
        ]}
        rows={rows.filter((r) => !(r.head_name && r.village && r.mobile && r.education && r.occupation && (r.members || []).length)).map((r) => ({
          head: A.txt(r.head_name), village: A.txt(r.village),
          missing: [
            !A.txt(r.mobile) && "Mobile", !A.txt(r.pincode) && "Pincode",
            !A.txt(r.education) && "Education", !A.txt(r.occupation) && "Occupation",
            !(r.members || []).length && "Members",
          ].filter(Boolean).join(", "),
          date: new Date(r.created_at).toLocaleDateString("en-GB"),
        }))}
      />
    </div>
  );
}

/* --------------------------------------------------------------- 11 Cross */

function Cross({ ctx }: { ctx: Ctx }) {
  const { rows } = ctx;
  const [d1, setD1] = useState("district");
  const [d2, setD2] = useState("occupation");
  const { columns, data, unit } = useMemo(() => A.crossTab(rows, d1, d2), [rows, d1, d2]);
  const l1 = A.DIMENSIONS.find((d) => d.id === d1)!.label;
  const l2 = A.DIMENSIONS.find((d) => d.id === d2)!.label;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-3 flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <div className="text-[10px] text-muted-foreground">Rows (Dimension 1)</div>
            <Select value={d1} onValueChange={setD1}>
              <SelectTrigger className="h-8 w-56 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{A.DIMENSIONS.map((d) => <SelectItem key={d.id} value={d.id} className="text-xs">{d.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <div className="text-[10px] text-muted-foreground">Columns (Dimension 2)</div>
            <Select value={d2} onValueChange={setD2}>
              <SelectTrigger className="h-8 w-56 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{A.DIMENSIONS.map((d) => <SelectItem key={d.id} value={d.id} className="text-xs">{d.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Badge variant="secondary" className="text-xs">Counted in: {unit}</Badge>
        </CardContent>
      </Card>
      <ChartCard title={`${l1} × ${l2}`} wide note={`Each bar is one ${l1} value, stacked by ${l2}. Unit: ${unit}.`}>
        <StackedBar data={data} columns={columns} />
      </ChartCard>
      <DataTable
        title="Cross Analytics Table"
        note={`Rows: ${l1} · Columns: ${l2} · Values: ${unit}. Export keeps the same layout.`}
        columns={[{ key: "name", label: l1 }, ...columns.map((c) => ({ key: c, label: c })), { key: "total", label: "Total" }]}
        rows={data}
      />
    </div>
  );
}
