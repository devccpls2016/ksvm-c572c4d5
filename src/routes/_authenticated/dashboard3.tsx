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
  SectionHeader, CompletionList, Empty,
} from "@/components/analytics/AnalyticsUI";
import * as A from "@/lib/analytics";
import { SurveyFilterPanel } from "@/components/SurveyFilterPanel";
import { countActive, emptyFilters, matchSurvey, type SurveyFilters } from "@/lib/survey-filters";
import {
  LayoutDashboard, MapPin, Users, GraduationCap, Briefcase, Sprout, Droplets,
  Home, Target, HeartPulse, Landmark, Store, UserRound, BriefcaseBusiness,
  HandHeart, UserCog, TrendingUp, CheckCircle2, Shuffle, Table2, RotateCcw,
  Filter, ChevronDown, CalendarRange, ChevronRight, Tractor, Sun, Trophy,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard3")({
  component: Dashboard3,
  head: () => ({
    meta: [
      { title: "Analytics Dashboard 3 | कोहळी समाज विकास मंडळ" },
      { name: "description", content: "Executive KPIs, geographic drill-down and 20 category analytics for the community family survey." },
      { property: "og:title", content: "Community Survey Analytics Dashboard 3" },
      { property: "og:description", content: "Executive KPIs, geographic drill-down and category analytics for the community family survey." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

/* ------------------------------------------------------------------ menu */

const SECTIONS = [
  { id: "overview", no: "01", label: "Overview", icon: LayoutDashboard },
  { id: "geo", no: "02", label: "Geographic Analytics", icon: MapPin },
  { id: "family", no: "03", label: "Family & Demographics", icon: Users },
  { id: "education", no: "04", label: "Education Analytics", icon: GraduationCap },
  { id: "occupation", no: "05", label: "Occupation & Employment", icon: Briefcase },
  { id: "agri", no: "06", label: "Agriculture Analytics", icon: Sprout },
  { id: "crop", no: "07", label: "Crop & Irrigation", icon: Droplets },
  { id: "housing", no: "08", label: "Housing & Assets", icon: Home },
  { id: "benefits", no: "09", label: "Government Benefits", icon: Target },
  { id: "medical", no: "10", label: "Medical & Health", icon: HeartPulse },
  { id: "women", no: "11", label: "Women & Family", icon: UserRound },
  { id: "leadership", no: "12", label: "Political & Social Leadership", icon: Landmark },
  { id: "business", no: "13", label: "Business & Entrepreneurship", icon: Store },
  { id: "hr", no: "14", label: "Community Human Resources", icon: BriefcaseBusiness },
  { id: "needs", no: "15", label: "Community Needs", icon: HandHeart },
  { id: "users", no: "16", label: "Survey User Performance", icon: UserCog },
  { id: "progress", no: "17", label: "Survey Progress", icon: TrendingUp },
  { id: "quality", no: "18", label: "Data Quality", icon: CheckCircle2 },
  { id: "cross", no: "19", label: "Cross Analytics", icon: Shuffle },
  { id: "reports", no: "20", label: "Detailed Reports", icon: Table2 },
];

const SECTION_FILTERS: Record<string, string[]> = {
  overview: ["loc", "fam"],
  geo: ["loc", "fam"],
  family: ["loc", "fam"],
  education: ["loc", "edu", "fam"],
  occupation: ["loc", "occ", "fam"],
  agri: ["loc", "agri"],
  crop: ["loc", "agri"],
  housing: ["loc", "house"],
  benefits: ["loc", "ben", "fam"],
  medical: ["loc", "ben"],
  women: ["loc", "fam", "ben"],
  leadership: ["loc", "pos"],
  business: ["loc", "biz", "occ"],
  hr: ["loc", "occ", "edu"],
  needs: ["loc", "biz", "house", "agri"],
  users: ["loc"],
  progress: ["loc"],
  quality: ["loc", "fam"],
  cross: ["loc", "fam", "edu", "occ", "agri", "house", "ben", "pos", "biz"],
  reports: ["loc", "fam", "edu", "occ", "agri", "house", "ben", "pos", "biz"],
};

type Ctx = { rows: A.Row[]; people: A.Person[]; appUsers: any[]; isAdmin: boolean };

const G = ({ children }: { children: React.ReactNode }) => (
  <div className="grid gap-3 md:grid-cols-2">{children}</div>
);

const marital = (people: A.Person[], k: string, exclude?: string) =>
  people.filter((p) => p.marital_status.includes(k) && (!exclude || !p.marital_status.includes(exclude))).length;

/* ============================================================= container */

function Dashboard3() {
  const { role, user } = useAuth();
  const isAdmin = role === "admin";
  const [all, setAll] = useState<A.Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [appUsers, setAppUsers] = useState<any[]>([]);
  const fetchUsers = useServerFn(listAppUsers);

  const [section, setSection] = useState("overview");
  const [filters, setFilters] = useState<SurveyFilters>({ ...emptyFilters });
  const [showAll, setShowAll] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

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
    () =>
      scoped.filter((r) => {
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

  const reset = () => { setFilters({ ...emptyFilters }); setFrom(""); setTo(""); };
  const activeCount = countActive(filters) + (from ? 1 : 0) + (to ? 1 : 0);
  const meta = SECTIONS.find((s) => s.id === section)!;
  const ctx: Ctx = { rows, people, appUsers, isAdmin };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/60 text-primary-foreground p-5 md:p-6 shadow-sm">
        <h1 className="text-xl md:text-2xl font-bold">📊 Community Survey Analytics — Dashboard 3</h1>
        <p className="text-xs md:text-sm opacity-90 mt-1">
          कोहळी समाज विकास मंडळ, नागपूर — Layer 1 Executive KPIs · Layer 2 Category Analytics · Layer 3 Drill-down
        </p>
      </div>

      {/* Layer 1 — executive KPIs, always visible */}
      <ExecutiveKpis rows={rows} people={people} appUsers={appUsers} isAdmin={isAdmin} />

      {/* Filters */}
      <Card className="print:hidden">
        <CardContent className="p-3 space-y-3">
          <div className="flex flex-wrap items-end gap-2">
            <div className="space-y-1">
              <div className="text-[10px] text-muted-foreground flex items-center gap-1"><CalendarRange className="h-3 w-3" />From</div>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-8 w-[9.5rem] text-xs" />
            </div>
            <div className="space-y-1">
              <div className="text-[10px] text-muted-foreground">To</div>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-8 w-[9.5rem] text-xs" />
            </div>
            <Button variant={showAll ? "default" : "outline"} size="sm" className="h-8 text-xs" onClick={() => setShowAll((v) => !v)}>
              <Filter className="h-3.5 w-3.5 mr-1" />सर्व फिल्टर / All filters
              <ChevronDown className={`h-3.5 w-3.5 ml-1 transition-transform ${showAll ? "rotate-180" : ""}`} />
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={reset}>
              <RotateCcw className="h-3.5 w-3.5 mr-1" />Reset
            </Button>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              {activeCount > 0 && <Badge className="text-xs">{activeCount} फिल्टर सक्रिय</Badge>}
              <Badge variant="secondary" className="text-xs">{rows.length} कुटुंबे / families</Badge>
              <Badge variant="secondary" className="text-xs">{people.length} सदस्य / members</Badge>
            </div>
          </div>
          {showAll && (
            <div className="border-t pt-3">
              <SurveyFilterPanel rows={scoped} filters={filters} onChange={setFilters} title="सर्व फिल्टर (All fields)" />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[248px_1fr]">
        <Card className="h-max lg:sticky lg:top-16 print:hidden">
          <CardContent className="p-2">
            <div className="lg:hidden">
              <Select value={section} onValueChange={setSection}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SECTIONS.map((s) => <SelectItem key={s.id} value={s.id} className="text-xs">{s.no} · {s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <nav className="hidden lg:flex flex-col gap-0.5 max-h-[68vh] overflow-y-auto">
              {SECTIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSection(s.id)}
                  className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors ${
                    section === s.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  }`}
                >
                  <s.icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="tabular-nums opacity-70">{s.no}</span>
                  <span className="truncate">{s.label}</span>
                </button>
              ))}
            </nav>
          </CardContent>
        </Card>

        <div className="min-w-0 space-y-4">
          <Card className="print:hidden border-primary/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <meta.icon className="h-4 w-4 text-primary" />
                {meta.no}. {meta.label} — विभागनिहाय फिल्टर / Section filters
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <SurveyFilterPanel
                rows={scoped}
                filters={filters}
                onChange={setFilters}
                only={SECTION_FILTERS[section] ?? ["loc"]}
                title=""
                defaultOpen
              />
            </CardContent>
          </Card>

          <SectionHeader title={`${meta.no}. ${meta.label}`} subtitle={`${rows.length} कुटुंबे · ${people.length} सदस्य`} icon={meta.icon} />
          <SectionBody id={section} ctx={ctx} />
        </div>
      </div>
    </div>
  );
}

/* ================================================== Layer 1 executive KPI */

function ExecutiveKpis({ rows, people, appUsers }: Ctx) {
  const male = people.filter((p) => p.gender === "पुरुष").length;
  const female = people.filter((p) => p.gender === "स्त्री").length;
  const ages = people.map((p) => p.age).filter((a): a is number => typeof a === "number");
  const avg = rows.length ? (people.length / rows.length).toFixed(1) : "0";
  return (
    <div className="space-y-3">
      <KpiGrid>
        <Kpi icon={LayoutDashboard} label="Total Survey Submitted / एकूण सर्वेक्षण" value={rows.length} />
        <Kpi icon={Users} tone="green" label="Total Families / कुटुंबे" value={rows.length} />
        <Kpi icon={Users} tone="violet" label="Total Family Members / सदस्य" value={people.length} />
        <Kpi icon={UserCog} tone="amber" label="Total Survey Users" value={appUsers.length || new Set(rows.map((r) => r.created_by)).size} />
        <Kpi icon={MapPin} tone="cyan" label="Villages Covered / गावे" value={A.uniq(rows, (r) => A.txt(r.village)).length} />
        <Kpi icon={MapPin} tone="cyan" label="Talukas Covered / तालुके" value={A.uniq(rows, (r) => A.txt(r.taluka)).length} />
        <Kpi icon={MapPin} tone="cyan" label="Districts Covered / जिल्हे" value={A.uniq(rows, (r) => A.txt(r.district)).length} />
        <Kpi icon={Users} tone="pink" label="Average Family Size / सरासरी कुटुंब आकार" value={avg} />
      </KpiGrid>
      <KpiGrid>
        <Kpi tone="primary" label="Total Male / पुरुष" value={male} hint={`${A.pct(male, people.length)}%`} />
        <Kpi tone="pink" label="Total Female / स्त्री" value={female} hint={`${A.pct(female, people.length)}%`} />
        <Kpi tone="green" label="Married / विवाहित" value={marital(people, "विवाहित", "अविवाहित")} />
        <Kpi tone="amber" label="Unmarried / अविवाहित" value={marital(people, "अविवाहित")} />
        <Kpi tone="violet" label="Widow / विधवा" value={marital(people, "विध")} />
        <Kpi tone="red" label="Divorced / घटस्फोटित" value={marital(people, "घटस्फोट")} />
        <Kpi tone="lime" label="Children (0–14) / बालके" value={ages.filter((a) => a <= 14).length} />
        <Kpi tone="cyan" label="Senior Citizens (60+) / ज्येष्ठ" value={ages.filter((a) => a >= 60).length} />
      </KpiGrid>
    </div>
  );
}

/* --------------------------------------------------------------- router */

function SectionBody({ id, ctx }: { id: string; ctx: Ctx }) {
  switch (id) {
    case "overview": return <Overview {...ctx} />;
    case "geo": return <Geographic {...ctx} />;
    case "family": return <Demographics {...ctx} />;
    case "education": return <Education {...ctx} />;
    case "occupation": return <Occupation {...ctx} />;
    case "agri": return <Agriculture {...ctx} />;
    case "crop": return <CropIrrigation {...ctx} />;
    case "housing": return <HousingAssets {...ctx} />;
    case "benefits": return <Benefits {...ctx} />;
    case "medical": return <Medical {...ctx} />;
    case "women": return <Women {...ctx} />;
    case "leadership": return <Leadership {...ctx} />;
    case "business": return <BusinessSec {...ctx} />;
    case "hr": return <HumanResources {...ctx} />;
    case "needs": return <Needs {...ctx} />;
    case "users": return <SurveyUsers {...ctx} />;
    case "progress": return <Progress2 {...ctx} />;
    case "quality": return <Quality {...ctx} />;
    case "cross": return <Cross {...ctx} />;
    default: return <Reports {...ctx} />;
  }
}

/* ========================================================== 01 Overview */

function Overview({ rows, people }: Ctx) {
  const gender = [
    { name: "पुरुष / Male", value: people.filter((p) => p.gender === "पुरुष").length },
    { name: "स्त्री / Female", value: people.filter((p) => p.gender === "स्त्री").length },
    { name: "इतर / Other", value: people.filter((p) => p.gender && p.gender !== "पुरुष" && p.gender !== "स्त्री").length },
  ];
  return (
    <div className="space-y-4">
      <G>
        <ChartCard title="लिंग वितरण / Gender Distribution"><PieCh donut data={gender} /></ChartCard>
        <ChartCard title="वयोगट / Age Group">
          <BarCh data={A.AGE_BANDS.map((b) => ({ name: b.name, value: people.filter((p) => typeof p.age === "number" && b.test(p.age)).length }))} color="#2563eb" />
        </ChartCard>
        <ChartCard title="कुटुंब आकार / Family Size">
          <BarCh data={A.FAMILY_SIZE_BANDS.map((b) => ({ name: b, value: rows.filter((r) => A.familySizeBand(A.familySize(r)) === b).length }))} color="#10b981" />
        </ChartCard>
        <ChartCard title="जिल्हानिहाय कुटुंबे / Families by District"><BarCh horizontal data={A.groupCount(rows, (r) => A.txt(r.district))} color="#8b5cf6" /></ChartCard>
        <ChartCard title="शिक्षण स्तर / Education Level"><BarCh horizontal data={A.groupCount(people.filter((p) => p.education) as any, (p: any) => A.eduLevel(p.education))} color="#f59e0b" /></ChartCard>
        <ChartCard title="व्यवसाय गट / Occupation Group"><BarCh horizontal data={A.groupCount(people.filter((p) => p.occupation) as any, (p: any) => A.occGroup(p.occupation))} color="#06b6d4" /></ChartCard>
        <ChartCard title="सर्वेक्षण कल (30 दिवस) / Submission Trend" wide><LineCh data={A.trend(rows, 30)} /></ChartCard>
      </G>
    </div>
  );
}

/* ======================================================== 02 Geographic */

function Geographic({ rows }: Ctx) {
  const [state, setState] = useState<string | null>(null);
  const [district, setDistrict] = useState<string | null>(null);
  const [taluka, setTaluka] = useState<string | null>(null);
  const [village, setVillage] = useState<string | null>(null);

  let level: "state" | "district" | "taluka" | "village" | "family" = "state";
  let sub = rows;
  if (state) { sub = sub.filter((r) => A.stateOf(r) === state); level = "district"; }
  if (district) { sub = sub.filter((r) => A.txt(r.district) === district); level = "taluka"; }
  if (taluka) { sub = sub.filter((r) => A.txt(r.taluka) === taluka); level = "village"; }
  if (village) { sub = sub.filter((r) => A.txt(r.village) === village); level = "family"; }

  const stateRows = ["महाराष्ट्र", "मध्य प्रदेश"].map((s) => {
    const rs = rows.filter((r) => A.stateOf(r) === s);
    const ppl = A.allPersons(rs);
    return {
      name: s, families: rs.length, members: ppl.length,
      male: ppl.filter((p) => p.gender === "पुरुष").length,
      female: ppl.filter((p) => p.gender === "स्त्री").length,
      villages: A.uniq(rs, (r) => A.txt(r.village)).length,
      talukas: A.uniq(rs, (r) => A.txt(r.taluka)).length,
      districts: A.uniq(rs, (r) => A.txt(r.district)).length,
    };
  });

  const drillRows =
    level === "district" ? A.locationRollup(sub, (r) => A.txt(r.district))
    : level === "taluka" ? A.locationRollup(sub, (r) => A.txt(r.taluka))
    : level === "village" ? A.locationRollup(sub, (r) => A.txt(r.village))
    : [];

  const pick = (name: string) => {
    if (level === "district") setDistrict(name);
    else if (level === "taluka") setTaluka(name);
    else if (level === "village") setVillage(name);
  };

  const crumbs: { label: string; onClick: () => void }[] = [
    { label: "सर्व / All", onClick: () => { setState(null); setDistrict(null); setTaluka(null); setVillage(null); } },
    ...(state ? [{ label: state, onClick: () => { setDistrict(null); setTaluka(null); setVillage(null); } }] : []),
    ...(district ? [{ label: district, onClick: () => { setTaluka(null); setVillage(null); } }] : []),
    ...(taluka ? [{ label: taluka, onClick: () => setVillage(null) }] : []),
    ...(village ? [{ label: village, onClick: () => {} }] : []),
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Drill-down: राज्य → जिल्हा → तालुका → गाव → कुटुंब</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-1 text-xs">
            {crumbs.map((c, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                <button className="rounded px-2 py-1 hover:bg-muted font-medium" onClick={c.onClick}>{c.label}</button>
              </span>
            ))}
          </div>
          {!state && (
            <div className="grid gap-2 sm:grid-cols-2">
              {stateRows.map((s) => (
                <button key={s.name} onClick={() => setState(s.name)} className="rounded-lg border p-3 text-left hover:border-primary transition-colors">
                  <div className="text-sm font-semibold">{s.name}</div>
                  <div className="mt-1 grid grid-cols-3 gap-1 text-[11px] text-muted-foreground">
                    <span>कुटुंबे: <b className="text-foreground">{s.families}</b></span>
                    <span>सदस्य: <b className="text-foreground">{s.members}</b></span>
                    <span>पुरुष: <b className="text-foreground">{s.male}</b></span>
                    <span>स्त्री: <b className="text-foreground">{s.female}</b></span>
                    <span>गावे: <b className="text-foreground">{s.villages}</b></span>
                    <span>तालुके: <b className="text-foreground">{s.talukas}</b></span>
                  </div>
                </button>
              ))}
            </div>
          )}
          {level !== "family" && state && (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 max-h-[320px] overflow-y-auto">
              {drillRows.map((d) => (
                <button key={d.name} onClick={() => pick(d.name)} className="rounded-lg border p-2.5 text-left hover:border-primary transition-colors">
                  <div className="text-xs font-semibold truncate">{d.name}</div>
                  <div className="text-[11px] text-muted-foreground">{d.families} कुटुंबे · {d.members} सदस्य · {d.pctOfTotal}%</div>
                </button>
              ))}
              {!drillRows.length && <Empty />}
            </div>
          )}
          {level === "family" && (
            <DataTable
              title={`${village} — कुटुंब यादी / Family List`}
              columns={[
                { key: "head", label: "कुटुंब प्रमुख" }, { key: "mobile", label: "मोबाईल" },
                { key: "members", label: "सदस्य" }, { key: "land", label: "जमीन" }, { key: "house", label: "घर प्रकार" },
              ]}
              rows={sub.map((r) => ({
                head: r.head_name, mobile: r.mobile, members: A.personsOf(r).length,
                land: r.has_farmland ? r.total_farmland : "—", house: r.house_type,
              }))}
            />
          )}
        </CardContent>
      </Card>

      <G>
        <ChartCard title="राज्यनिहाय कुटुंबे / Families by State"><PieCh donut data={stateRows.map((s) => ({ name: s.name, value: s.families }))} /></ChartCard>
        <ChartCard title="जिल्हानिहाय / District-wise"><BarCh horizontal data={A.groupCount(rows, (r) => A.txt(r.district))} color="#2563eb" /></ChartCard>
        <ChartCard title="तालुकानिहाय / Taluka-wise"><BarCh horizontal data={A.groupCount(rows, (r) => A.txt(r.taluka))} color="#10b981" /></ChartCard>
        <ChartCard title="गावनिहाय / Village-wise"><BarCh horizontal data={A.groupCount(rows, (r) => A.txt(r.village))} color="#f59e0b" /></ChartCard>
      </G>

      <DataTable title="State-wise Summary" columns={[
        { key: "name", label: "State" }, { key: "families", label: "Families" }, { key: "members", label: "Members" },
        { key: "male", label: "Male" }, { key: "female", label: "Female" }, { key: "villages", label: "Villages" },
        { key: "talukas", label: "Talukas" }, { key: "districts", label: "Districts" },
      ]} rows={stateRows} />

      {(["district", "taluka", "village"] as const).map((k) => (
        <DataTable
          key={k}
          title={`${k[0]!.toUpperCase()}${k.slice(1)}-wise Survey Count`}
          columns={[
            { key: "name", label: k }, { key: "families", label: "Families" }, { key: "members", label: "Members" },
            { key: "male", label: "Male" }, { key: "female", label: "Female" }, { key: "pctOfTotal", label: "Survey %" },
          ]}
          rows={A.locationRollup(rows, (r) => A.txt(r[k]))}
        />
      ))}
    </div>
  );
}

/* ====================================================== 03 Demographics */

function Demographics({ rows, people }: Ctx) {
  const byDim = (dim: (r: A.Row) => string) => {
    const names = A.uniq(rows, dim);
    return names.map((n) => {
      const ppl = A.allPersons(rows.filter((r) => dim(r) === n));
      return { name: n, "पुरुष": ppl.filter((p) => p.gender === "पुरुष").length, "स्त्री": ppl.filter((p) => p.gender === "स्त्री").length };
    });
  };
  const ageXgender = A.AGE_BANDS.map((b) => {
    const inBand = people.filter((p) => typeof p.age === "number" && b.test(p.age));
    return { name: b.name, "पुरुष": inBand.filter((p) => p.gender === "पुरुष").length, "स्त्री": inBand.filter((p) => p.gender === "स्त्री").length };
  });
  const married = people.filter((p) => p.marital_status.includes("विवाहित") && !p.marital_status.includes("अविवाहित"));

  return (
    <div className="space-y-4">
      <KpiGrid>
        <Kpi icon={Users} label="Total Members" value={people.length} />
        <Kpi tone="primary" label="Male" value={people.filter((p) => p.gender === "पुरुष").length} />
        <Kpi tone="pink" label="Female" value={people.filter((p) => p.gender === "स्त्री").length} />
        <Kpi tone="violet" label="Other" value={people.filter((p) => p.gender && p.gender !== "पुरुष" && p.gender !== "स्त्री").length} />
        <Kpi tone="green" label="Average Family Size" value={rows.length ? (people.length / rows.length).toFixed(1) : 0} />
        <Kpi tone="amber" label="Married" value={married.length} />
        <Kpi tone="cyan" label="Same-caste Marriage" value={married.filter((p) => p.marriage_type.includes("जातीय") && !p.marriage_type.includes("आंतर")).length} />
        <Kpi tone="red" label="Inter-caste Marriage" value={married.filter((p) => p.marriage_type.includes("आंतर")).length} />
      </KpiGrid>
      <G>
        <ChartCard title="लिंग वितरण / Gender"><PieCh donut data={A.groupCount(people.filter((p) => p.gender) as any, (p: any) => p.gender)} /></ChartCard>
        <ChartCard title="वैवाहिक स्थिती / Marital Status"><PieCh data={A.groupCount(people.filter((p) => p.marital_status) as any, (p: any) => p.marital_status)} /></ChartCard>
        <ChartCard title="वयोगट × लिंग / Age × Gender" wide><StackedBar data={ageXgender} columns={["पुरुष", "स्त्री"]} /></ChartCard>
        <ChartCard title="जिल्हा × लिंग / Gender by District"><StackedBar data={byDim((r) => A.txt(r.district))} columns={["पुरुष", "स्त्री"]} /></ChartCard>
        <ChartCard title="तालुका × लिंग / Gender by Taluka"><StackedBar data={byDim((r) => A.txt(r.taluka))} columns={["पुरुष", "स्त्री"]} /></ChartCard>
        <ChartCard title="गाव × लिंग / Gender by Village"><StackedBar data={byDim((r) => A.txt(r.village))} columns={["पुरुष", "स्त्री"]} /></ChartCard>
        <ChartCard title="कुटुंब आकार वितरण / Family Size">
          <BarCh data={A.FAMILY_SIZE_BANDS.map((b) => ({ name: b, value: rows.filter((r) => A.familySizeBand(A.familySize(r)) === b).length }))} color="#10b981" />
        </ChartCard>
        <ChartCard title="वयोगट × शिक्षण / Age × Education" wide>
          <StackedBar {...A.crossTab(rows, "age_group", "education")} data={A.crossTab(rows, "age_group", "education").data} columns={A.crossTab(rows, "age_group", "education").columns} />
        </ChartCard>
      </G>
      <DataTable
        title="Family Size by Location"
        columns={[
          { key: "name", label: "Village" }, { key: "families", label: "Families" }, { key: "members", label: "Members" },
          { key: "avg", label: "Avg Family Size" }, { key: "male", label: "Male" }, { key: "female", label: "Female" },
        ]}
        rows={A.locationRollup(rows, (r) => A.txt(r.village)).map((l) => ({ ...l, avg: l.families ? (l.members / l.families).toFixed(1) : 0 }))}
      />
    </div>
  );
}

/* ========================================================= 04 Education */

function Education({ rows, people }: Ctx) {
  const withEdu = people.filter((p) => p.education);
  const cnt = (k: string) => withEdu.filter((p) => A.eduLevel(p.education).includes(k)).length;
  return (
    <div className="space-y-4">
      <KpiGrid>
        <Kpi icon={GraduationCap} label="Members with Education Data" value={withEdu.length} />
        <Kpi tone="green" label="Graduates" value={cnt("पदवी")} />
        <Kpi tone="violet" label="Postgraduates" value={cnt("पदव्युत्तर")} />
        <Kpi tone="cyan" label="Diploma Holders" value={cnt("पदविका")} />
        <Kpi tone="amber" label="Ph.D. / Doctorate" value={cnt("डॉक्टरेट")} />
        <Kpi tone="red" label="Illiterate" value={cnt("निरक्षर")} />
      </KpiGrid>
      <G>
        <ChartCard title="शिक्षण स्तर / Education Level" wide><BarCh horizontal data={A.groupCount(withEdu as any, (p: any) => A.eduLevel(p.education))} color="#8b5cf6" /></ChartCard>
        <ChartCard title="शिक्षण शाखा / Education Stream"><BarCh horizontal data={A.groupCount(withEdu as any, (p: any) => A.eduStream(p.education)).filter((d) => d.name !== "—")} color="#2563eb" /></ChartCard>
        <ChartCard title="शिक्षण × लिंग / Education × Gender"><StackedBar {...A.crossTab(rows, "education", "gender")} /></ChartCard>
        <ChartCard title="शिक्षण × वयोगट / Education × Age"><StackedBar {...A.crossTab(rows, "education", "age_group")} /></ChartCard>
        <ChartCard title="शिक्षण × व्यवसाय / Education × Occupation"><StackedBar {...A.crossTab(rows, "education", "occupation")} /></ChartCard>
        <ChartCard title="गावनिहाय पदवीधर / Graduates by Village" wide>
          <BarCh horizontal color="#10b981" data={A.uniq(rows, (r) => A.txt(r.village)).map((v) => ({
            name: v,
            value: A.allPersons(rows.filter((r) => A.txt(r.village) === v)).filter((p) => A.eduLevel(p.education).includes("पदवी")).length,
          })).filter((d) => d.value > 0)} />
        </ChartCard>
      </G>
      <DataTable
        title="Education Report by Village"
        columns={[
          { key: "name", label: "Village" }, { key: "members", label: "Members" }, { key: "grad", label: "Graduates" },
          { key: "pg", label: "Postgraduates" }, { key: "dip", label: "Diploma" }, { key: "phd", label: "Ph.D." }, { key: "illit", label: "Illiterate" },
        ]}
        rows={A.uniq(rows, (r) => A.txt(r.village)).map((v) => {
          const ppl = A.allPersons(rows.filter((r) => A.txt(r.village) === v));
          const c = (k: string) => ppl.filter((p) => A.eduLevel(p.education).includes(k)).length;
          return { name: v, members: ppl.length, grad: c("पदवी") - c("पदव्युत्तर"), pg: c("पदव्युत्तर"), dip: c("पदविका"), phd: c("डॉक्टरेट"), illit: c("निरक्षर") };
        })}
      />
    </div>
  );
}

/* ======================================================== 05 Occupation */

function Occupation({ rows, people }: Ctx) {
  const withOcc = people.filter((p) => p.occupation);
  const g = (name: string) => withOcc.filter((p) => A.occGroup(p.occupation) === name).length;
  return (
    <div className="space-y-4">
      <KpiGrid>
        <Kpi icon={Briefcase} label="Total Job / Occupation Records" value={withOcc.length} />
        <Kpi tone="green" label="Farmers" value={g("शेतकरी / Farmer")} />
        <Kpi tone="lime" label="Farm Labour" value={g("शेतमजूर / Farm Labour")} />
        <Kpi tone="primary" label="Government Employees" value={g("सरकारी कर्मचारी")} />
        <Kpi tone="cyan" label="Private Employees" value={g("खाजगी कर्मचारी")} />
        <Kpi tone="violet" label="Self Employed" value={g("स्वरोजगार / Self Employed")} />
        <Kpi tone="amber" label="Business Owners" value={g("व्यवसाय / Business Owner")} />
        <Kpi tone="red" label="Unemployed" value={g("बेरोजगार / Unemployed")} />
        <Kpi tone="pink" label="Retired / Pensioner" value={g("निवृत्त / Pensioner")} />
        <Kpi tone="cyan" label="NRI" value={g("परदेशस्थ / NRI")} />
        <Kpi tone="green" label="Agriculture + Business" value={g("शेती + व्यवसाय")} />
        <Kpi tone="violet" label="Education Sector" value={g("शिक्षण क्षेत्र")} />
      </KpiGrid>
      <G>
        <ChartCard title="व्यवसाय गट / Occupation Categories" wide><BarCh horizontal data={A.groupCount(withOcc as any, (p: any) => A.occGroup(p.occupation))} color="#2563eb" /></ChartCard>
        <ChartCard title="व्यवसाय × लिंग / Occupation × Gender"><StackedBar {...A.crossTab(rows, "occupation", "gender")} /></ChartCard>
        <ChartCard title="व्यवसाय × वयोगट / Occupation × Age"><StackedBar {...A.crossTab(rows, "occupation", "age_group")} /></ChartCard>
        <ChartCard title="सरकारी नोकरी — पदनाम / Govt Designations">
          <BarCh horizontal color="#10b981" data={A.groupCount(withOcc.filter((p) => A.occGroup(p.occupation) === "सरकारी कर्मचारी") as any, (p: any) => A.txt(p.occupation))} />
        </ChartCard>
        <ChartCard title="खाजगी नोकरी — तपशील / Private Job Details">
          <BarCh horizontal color="#f59e0b" data={A.groupCount(withOcc.filter((p) => A.occGroup(p.occupation) === "खाजगी कर्मचारी") as any, (p: any) => A.txt(p.occupation))} />
        </ChartCard>
      </G>
      <DataTable
        title="Employment Report by Village"
        columns={[
          { key: "name", label: "Village" }, { key: "govt", label: "Govt" }, { key: "pvt", label: "Private" },
          { key: "self", label: "Self Employed" }, { key: "biz", label: "Business" }, { key: "farmer", label: "Farmer" },
          { key: "labour", label: "Farm Labour" }, { key: "unemp", label: "Unemployed" },
        ]}
        rows={A.uniq(rows, (r) => A.txt(r.village)).map((v) => {
          const ppl = A.allPersons(rows.filter((r) => A.txt(r.village) === v));
          const c = (n: string) => ppl.filter((p) => A.occGroup(p.occupation) === n).length;
          return {
            name: v, govt: c("सरकारी कर्मचारी"), pvt: c("खाजगी कर्मचारी"), self: c("स्वरोजगार / Self Employed"),
            biz: c("व्यवसाय / Business Owner"), farmer: c("शेतकरी / Farmer"), labour: c("शेतमजूर / Farm Labour"), unemp: c("बेरोजगार / Unemployed"),
          };
        })}
      />
    </div>
  );
}

/* ======================================================= 06 Agriculture */

function Agriculture({ rows }: Ctx) {
  const farm = rows.filter((r) => r.has_farmland);
  const sum = (f: (r: A.Row) => any) => Math.round(rows.reduce((a, r) => a + A.num(f(r)), 0) * 10) / 10;
  const totalLand = sum((r) => r.total_farmland);
  const tool = (r: A.Row, key: string) => ((r.farming_tools_details || {}) as any)[key] || {};
  const equip = A.TOOL_KEYS.map((k) => ({
    name: k.label,
    owners: farm.filter((r) => tool(r, k.key).has).length,
    qty: farm.reduce((a, r) => a + A.num(tool(r, k.key).count), 0),
    wants: farm.filter((r) => tool(r, k.key).has === false && tool(r, k.key).want_to_buy).length,
    loan: farm.filter((r) => tool(r, k.key).needs_loan).length,
  }));

  return (
    <div className="space-y-4">
      <KpiGrid>
        <Kpi icon={Sprout} tone="green" label="Agriculture Families" value={farm.length} hint={`${A.pct(farm.length, rows.length)}%`} />
        <Kpi tone="amber" label="Non-Agriculture Families" value={rows.length - farm.length} />
        <Kpi tone="primary" label="Total Reported Farmland (acre)" value={totalLand} />
        <Kpi tone="violet" label="Average Landholding (acre)" value={farm.length ? (totalLand / farm.length).toFixed(2) : 0} />
        <Kpi tone="cyan" label="Irrigated Area" value={sum((r) => r.irrigated_area)} />
        <Kpi tone="red" label="Dryland Area" value={sum((r) => r.dryland_area)} />
        <Kpi tone="lime" label="Kharif Area" value={sum((r) => r.kharif_area)} />
        <Kpi tone="green" label="Rabi Area (धान सोडून)" value={sum((r) => r.rabi_area)} />
        <Kpi tone="pink" label="Summer Area (धानासह)" value={sum((r) => r.summer_area)} />
        <Kpi icon={Tractor} tone="primary" label="Families Owning Equipment" value={farm.filter((r) => A.TOOL_KEYS.some((k) => tool(r, k.key).has)).length} />
        <Kpi tone="amber" label="Equipment Purchase Demand" value={equip.reduce((a, e) => a + e.wants, 0)} />
        <Kpi tone="red" label="Equipment Loan Required" value={equip.reduce((a, e) => a + e.loan, 0)} />
      </KpiGrid>
      <G>
        <ChartCard title="शेतजमीन / Farmland Ownership"><PieCh donut data={[{ name: "शेती आहे", value: farm.length }, { name: "शेती नाही", value: rows.length - farm.length }]} /></ChartCard>
        <ChartCard title="जमीन आकार / Landholding">
          <BarCh data={A.LAND_BANDS.map((b) => ({ name: b, value: farm.filter((r) => A.landBand(A.num(r.total_farmland)) === b).length }))} color="#10b981" />
        </ChartCard>
        <ChartCard title="गावनिहाय जमीन / Land by Village">
          <BarCh horizontal color="#f59e0b" data={A.uniq(farm, (r) => A.txt(r.village)).map((v) => ({ name: v, value: Math.round(farm.filter((r) => A.txt(r.village) === v).reduce((a, r) => a + A.num(r.total_farmland), 0)) }))} />
        </ChartCard>
        <ChartCard title="तालुकानिहाय जमीन / Land by Taluka">
          <BarCh horizontal color="#8b5cf6" data={A.uniq(farm, (r) => A.txt(r.taluka)).map((t) => ({ name: t, value: Math.round(farm.filter((r) => A.txt(r.taluka) === t).reduce((a, r) => a + A.num(r.total_farmland), 0)) }))} />
        </ChartCard>
        <ChartCard title="साधन मालकी / Equipment Ownership"><BarCh data={equip.map((e) => ({ name: e.name, value: e.owners }))} color="#2563eb" /></ChartCard>
        <ChartCard title="साधन मागणी व कर्ज / Demand & Loan"><StackedBar data={equip.map((e) => ({ name: e.name, "मागणी": e.wants, "कर्ज": e.loan }))} columns={["मागणी", "कर्ज"]} /></ChartCard>
      </G>
      <DataTable
        title="Farming Equipment Report"
        columns={[{ key: "name", label: "Equipment" }, { key: "owners", label: "Owner Families" }, { key: "qty", label: "Quantity" }, { key: "wants", label: "Purchase Demand" }, { key: "loan", label: "Loan Required" }]}
        rows={equip}
      />
      <DataTable
        title="Agriculture Report by Village"
        columns={[
          { key: "name", label: "Village" }, { key: "farmers", label: "Farmers" }, { key: "land", label: "Land (acre)" },
          { key: "irr", label: "Irrigated" }, { key: "dry", label: "Dryland" }, { key: "kharif", label: "Kharif" },
          { key: "rabi", label: "Rabi" }, { key: "summer", label: "Summer" },
        ]}
        rows={A.uniq(farm, (r) => A.txt(r.village)).map((v) => {
          const sub = farm.filter((r) => A.txt(r.village) === v);
          const s = (f: (r: A.Row) => any) => Math.round(sub.reduce((a, r) => a + A.num(f(r)), 0) * 10) / 10;
          return {
            name: v, farmers: sub.length, land: s((r) => r.total_farmland), irr: s((r) => r.irrigated_area),
            dry: s((r) => r.dryland_area), kharif: s((r) => r.kharif_area), rabi: s((r) => r.rabi_area), summer: s((r) => r.summer_area),
          };
        })}
      />
    </div>
  );
}

/* =================================================== 07 Crop & Irrigation */

function CropIrrigation({ rows }: Ctx) {
  const farm = rows.filter((r) => r.has_farmland);
  const cropTypes = A.countMulti(farm, (r) => (Array.isArray(r.major_crop_types) ? r.major_crop_types : []));
  const crops = A.countMulti(farm, (r) => (Array.isArray(r.crops) ? r.crops.map((c: any) => A.txt(c?.name || c?.crop || c)) : []));
  const season = [
    { name: "खरीप / Kharif", value: farm.filter((r) => A.num(r.kharif_area) > 0).length },
    { name: "रब्बी / Rabi", value: farm.filter((r) => A.num(r.rabi_area) > 0).length },
    { name: "उन्हाळी / Summer", value: farm.filter((r) => A.num(r.summer_area) > 0).length },
  ];
  const det = (r: A.Row, key: string) => ((r.irrigation_details || {}) as any)[key] || {};
  const irr = A.IRRIGATION_KEYS.map((k) => ({
    name: k.label,
    families: farm.filter((r) => A.num(det(r, k.key).count) > 0 || (r.irrigation_sources || []).some((s: string) => s.includes(k.label.split(" / ")[0]!))).length,
    count: farm.reduce((a, r) => a + A.num(det(r, k.key).count), 0),
    electric: farm.filter((r) => det(r, k.key).electric).length,
    solar: farm.filter((r) => det(r, k.key).solar).length,
  }));
  const malguzari = farm.filter((r) => A.IRRIGATION_KEYS.some((k) => det(r, k.key).is_kohli_malguzari === true)).length;
  const freeWater = farm.filter((r) => A.IRRIGATION_KEYS.some((k) => det(r, k.key).is_free === true || det(r, k.key).water_free === true)).length;

  return (
    <div className="space-y-4">
      <KpiGrid>
        <Kpi icon={Droplets} label="Irrigating Families" value={farm.filter((r) => A.IRRIGATION_KEYS.some((k) => A.num(det(r, k.key).count) > 0)).length} />
        <Kpi tone="green" label="Electric Pumps" value={irr.reduce((a, i) => a + i.electric, 0)} />
        <Kpi tone="amber" label="Solar Pumps" value={irr.reduce((a, i) => a + i.solar, 0)} />
        <Kpi tone="cyan" label="Malguzari Ponds" value={malguzari} />
        <Kpi tone="violet" label="Free Irrigation Water" value={freeWater} />
        <Kpi tone="lime" label="Crop Records" value={crops.reduce((a, c) => a + c.value, 0)} />
      </KpiGrid>
      <G>
        <ChartCard title="मुख्य पीक प्रकार / Major Crop Types">{cropTypes.length ? <BarCh horizontal data={cropTypes} color="#10b981" /> : <Empty label="निवडलेल्या फिल्टरसाठी पीक माहिती उपलब्ध नाही / No crop data available for the selected filters." />}</ChartCard>
        <ChartCard title="पीकनिहाय कुटुंबे / Crop-wise Families">{crops.length ? <BarCh horizontal data={crops} color="#2563eb" /> : <Empty label="No crop data available for the selected filters." />}</ChartCard>
        <ChartCard title="हंगाम वितरण / Crop Season"><PieCh data={season} /></ChartCard>
        <ChartCard title="हंगामनिहाय क्षेत्र / Season-wise Area">
          <BarCh color="#f59e0b" data={[
            { name: "खरीप", value: Math.round(farm.reduce((a, r) => a + A.num(r.kharif_area), 0)) },
            { name: "रब्बी", value: Math.round(farm.reduce((a, r) => a + A.num(r.rabi_area), 0)) },
            { name: "उन्हाळी", value: Math.round(farm.reduce((a, r) => a + A.num(r.summer_area), 0)) },
          ]} />
        </ChartCard>
        <ChartCard title="सिंचन साधन / Irrigation Sources"><BarCh horizontal data={irr.map((i) => ({ name: i.name, value: i.families }))} color="#06b6d4" /></ChartCard>
        <ChartCard title="सिंचन × जमीन आकार / Irrigation × Land Size"><StackedBar {...A.crossTab(farm, "irrigation", "land_band")} /></ChartCard>
        <ChartCard title="सिंचन × पीक प्रकार / Irrigation × Crop"><StackedBar {...A.crossTab(farm, "irrigation", "crop_type")} /></ChartCard>
        <ChartCard title="गावनिहाय सिंचन / Irrigation by Village"><StackedBar {...A.crossTab(farm, "village", "irrigation")} /></ChartCard>
      </G>
      <DataTable
        title="Irrigation Source Report"
        columns={[{ key: "name", label: "Source" }, { key: "families", label: "Families" }, { key: "count", label: "Total Units" }, { key: "electric", label: "Electric Pump" }, { key: "solar", label: "Solar Pump" }]}
        rows={irr}
      />
    </div>
  );
}

/* =================================================== 08 Housing & Assets */

function HousingAssets({ rows }: Ctx) {
  const own = rows.filter((r) => r.owns_house).length;
  const living = (k: string) => rows.filter((r) => A.txt(r.living_status).includes(k)).length;
  const house = (k: string) => rows.filter((r) => A.txt(r.house_type).includes(k)).length;
  const gharkulGot = rows.filter((r) => r.gharkul_received).length;
  const gharkulWant = rows.filter((r) => r.gharkul_wanted).length;
  const assets = A.ASSET_LIST.map((a) => ({
    name: a,
    families: rows.filter((r) => (r.household_items || []).includes(a)).length,
    qty: rows.reduce((s, r) => s + A.num((r.household_item_counts || {})[a]), 0),
  }));
  const solarOn = rows.filter((r) => r.solar_panel_installed).length;
  const solarWant = rows.filter((r) => r.solar_panel_wanted).length;
  const solarPump = rows.filter((r) => A.IRRIGATION_KEYS.some((k) => ((r.irrigation_details || {}) as any)[k.key]?.solar)).length;

  return (
    <div className="space-y-4">
      <KpiGrid>
        <Kpi icon={Home} label="Own House Families" value={own} hint={`${A.pct(own, rows.length)}%`} />
        <Kpi tone="red" label="No House" value={rows.length - own} />
        <Kpi tone="amber" label="Rented" value={living("भाड")} />
        <Kpi tone="violet" label="Dependent" value={living("आश्रित")} />
        <Kpi tone="cyan" label="Kachcha Houses" value={house("कच्च") + house("माती")} />
        <Kpi tone="green" label="Pakka Houses" value={house("पक्क")} />
        <Kpi tone="lime" label="Gharkul Beneficiaries" value={gharkulGot} />
        <Kpi tone="pink" label="Gharkul Required" value={gharkulWant} />
        <Kpi icon={Sun} tone="amber" label="Solar Installed" value={solarOn} hint={`${A.pct(solarOn, rows.length)}%`} />
        <Kpi tone="cyan" label="Solar Required" value={solarWant} />
        <Kpi tone="green" label="Solar Pumps (farm)" value={solarPump} />
        <Kpi tone="primary" label="Total Assets Recorded" value={assets.reduce((a, x) => a + x.qty, 0)} />
      </KpiGrid>
      <G>
        <ChartCard title="घर मालकी / House Ownership"><PieCh donut data={[{ name: "स्वतःचे घर", value: own }, { name: "घर नाही", value: rows.length - own }]} /></ChartCard>
        <ChartCard title="घर प्रकार / House Type"><PieCh data={A.groupCount(rows.filter((r) => r.house_type), (r) => A.txt(r.house_type))} /></ChartCard>
        <ChartCard title="राहण्याची स्थिती / Living Status"><BarCh data={A.groupCount(rows.filter((r) => r.living_status), (r) => A.txt(r.living_status))} color="#8b5cf6" /></ChartCard>
        <ChartCard title="घरकुल / Gharkul"><PieCh data={[{ name: "मिळाले", value: gharkulGot }, { name: "आवश्यक", value: gharkulWant }, { name: "लागू नाही", value: Math.max(0, rows.length - gharkulGot - gharkulWant) }]} /></ChartCard>
        <ChartCard title="घरातील वस्तू — कुटुंबे / Asset Ownership" wide><BarCh horizontal data={assets.map((a) => ({ name: a.name, value: a.families }))} color="#2563eb" /></ChartCard>
        <ChartCard title="वस्तू संख्या / Asset Quantity"><BarCh horizontal data={assets.map((a) => ({ name: a.name, value: a.qty }))} color="#f59e0b" /></ChartCard>
        <ChartCard title="सोलर / Solar Adoption"><PieCh donut data={[{ name: "बसवले", value: solarOn }, { name: "आवश्यक", value: solarWant }, { name: "नाही", value: Math.max(0, rows.length - solarOn - solarWant) }]} /></ChartCard>
        <ChartCard title="गावनिहाय सोलर मागणी / Solar Need by Village" wide>
          <BarCh horizontal color="#f59e0b" data={A.uniq(rows, (r) => A.txt(r.village)).map((v) => ({ name: v, value: rows.filter((r) => A.txt(r.village) === v && r.solar_panel_wanted).length })).filter((d) => d.value > 0)} />
        </ChartCard>
      </G>
      <DataTable
        title="Asset Ownership Report"
        columns={[{ key: "name", label: "Asset" }, { key: "families", label: "Families" }, { key: "qty", label: "Quantity" }, { key: "pct", label: "Ownership %" }]}
        rows={assets.map((a) => ({ ...a, pct: A.pct(a.families, rows.length) }))}
      />
      <DataTable
        title="Housing Report by Village"
        columns={[
          { key: "name", label: "Village" }, { key: "families", label: "Families" }, { key: "own", label: "Own House" },
          { key: "kachcha", label: "Kachcha" }, { key: "pakka", label: "Pakka" }, { key: "got", label: "Gharkul Received" }, { key: "need", label: "Gharkul Needed" },
        ]}
        rows={A.uniq(rows, (r) => A.txt(r.village)).map((v) => {
          const sub = rows.filter((r) => A.txt(r.village) === v);
          return {
            name: v, families: sub.length, own: sub.filter((r) => r.owns_house).length,
            kachcha: sub.filter((r) => A.txt(r.house_type).includes("कच्च") || A.txt(r.house_type).includes("माती")).length,
            pakka: sub.filter((r) => A.txt(r.house_type).includes("पक्क")).length,
            got: sub.filter((r) => r.gharkul_received).length, need: sub.filter((r) => r.gharkul_wanted).length,
          };
        })}
      />
    </div>
  );
}

/* ========================================================== 09 Benefits */

function Benefits({ rows }: Ctx) {
  const b = (r: A.Row) => (r.benefits_info || {}) as any;
  const benef = rows.filter((r) => b(r).ladki_bahin);
  const members = benef.reduce((a, r) => a + (b(r).ladki_bahin_beneficiaries?.length || A.num(b(r).ladki_bahin_count)), 0);
  const regular = benef.filter((r) => b(r).ladki_bahin_regular).length;
  const reasons = A.countMulti(rows, (r) => [
    ...(b(r).ladki_bahin_beneficiaries || []).map((x: any) => A.txt(x?.reason)),
    ...(b(r).ladki_bahin_non_beneficiaries || []).map((x: any) => A.txt(x?.reason)),
  ].filter(Boolean));

  return (
    <div className="space-y-4">
      <KpiGrid>
        <Kpi icon={Target} label="Beneficiary Families" value={benef.length} hint={`${A.pct(benef.length, rows.length)}%`} />
        <Kpi tone="green" label="Beneficiary Members" value={members} />
        <Kpi tone="cyan" label="Regularly Receiving" value={regular} />
        <Kpi tone="red" label="Not Regularly Receiving" value={benef.length - regular} />
        <Kpi tone="amber" label="Non-Beneficiary Families" value={rows.filter((r) => b(r).ladki_bahin === false).length} />
        <Kpi tone="violet" label="Recorded Issue Reasons" value={reasons.reduce((a, r) => a + r.value, 0)} />
      </KpiGrid>
      <G>
        <ChartCard title="लाडकी बहीण लाभार्थी / Ladki Bahin"><PieCh donut data={[{ name: "लाभार्थी", value: benef.length }, { name: "लाभार्थी नाही", value: rows.filter((r) => b(r).ladki_bahin === false).length }]} /></ChartCard>
        <ChartCard title="नियमित लाभ / Benefit Regularity"><PieCh data={[{ name: "नियमित", value: regular }, { name: "अनियमित", value: benef.length - regular }]} /></ChartCard>
        <ChartCard title="कारणे / Reasons (KYC, Aadhaar, DBT…)" wide>{reasons.length ? <BarCh horizontal data={reasons} color="#ef4444" /> : <Empty />}</ChartCard>
      </G>
      <DataTable
        title="Ladki Bahin Report by Village"
        columns={[{ key: "name", label: "Village" }, { key: "families", label: "Families" }, { key: "benef", label: "Beneficiary" }, { key: "regular", label: "Regular" }, { key: "pct", label: "Coverage %" }]}
        rows={A.uniq(rows, (r) => A.txt(r.village)).map((v) => {
          const sub = rows.filter((r) => A.txt(r.village) === v);
          const bf = sub.filter((r) => b(r).ladki_bahin).length;
          return { name: v, families: sub.length, benef: bf, regular: sub.filter((r) => b(r).ladki_bahin_regular).length, pct: A.pct(bf, sub.length) };
        })}
      />
    </div>
  );
}

/* =========================================================== 10 Medical */

function Medical({ rows }: Ctx) {
  const b = (r: A.Row) => (r.benefits_info || {}) as any;
  const ill = rows.filter((r) => b(r).critical_illness);
  const aid = rows.filter((r) => b(r).medical_aid_needed);
  const types = A.groupCount(ill.filter((r) => b(r).illness_type), (r) => A.txt(b(r).illness_type));
  return (
    <div className="space-y-4">
      <KpiGrid>
        <Kpi icon={HeartPulse} tone="red" label="Families with Critical Illness" value={ill.length} />
        <Kpi tone="amber" label="Members in Affected Families" value={A.allPersons(ill).length} />
        <Kpi tone="violet" label="Medical Assistance Required" value={aid.length} />
        <Kpi tone="cyan" label="Share of Surveyed Families" value={`${A.pct(ill.length, rows.length)}%`} />
      </KpiGrid>
      <G>
        <ChartCard title="गंभीर आजार / Critical Illness"><PieCh donut data={[{ name: "आजार आहे", value: ill.length }, { name: "आजार नाही", value: rows.length - ill.length }]} /></ChartCard>
        <ChartCard title="आजाराचा प्रकार / Illness Type">{types.length ? <BarCh horizontal data={types} color="#ef4444" /> : <Empty label="आजाराचा प्रकार नोंदवलेला नाही / No illness-type data for the selected filters." />}</ChartCard>
        <ChartCard title="गावनिहाय गरज / Assistance by Village" wide>
          <BarCh horizontal color="#8b5cf6" data={A.uniq(rows, (r) => A.txt(r.village)).map((v) => ({ name: v, value: aid.filter((r) => A.txt(r.village) === v).length })).filter((d) => d.value > 0)} />
        </ChartCard>
      </G>
      <DataTable
        title="Medical Assistance Detail"
        columns={[{ key: "head", label: "Family Head" }, { key: "village", label: "Village" }, { key: "taluka", label: "Taluka" }, { key: "mobile", label: "Mobile" }, { key: "members", label: "Members" }]}
        rows={[...ill, ...aid.filter((r) => !ill.includes(r))].map((r) => ({
          head: r.head_name, village: r.village, taluka: r.taluka, mobile: r.mobile, members: A.personsOf(r).length,
        }))}
      />
    </div>
  );
}

/* ============================================================= 11 Women */

function Women({ rows, people }: Ctx) {
  const women = people.filter((p) => p.gender === "स्त्री");
  const shg = (f: (g: any) => boolean) => women.filter((w) => w.bachat_gat && f(w.bachat_gat)).length;
  const b = (r: A.Row) => (r.benefits_info || {}) as any;
  return (
    <div className="space-y-4">
      <KpiGrid>
        <Kpi icon={UserRound} tone="pink" label="Total Female Members" value={women.length} />
        <Kpi tone="green" label="Married Women" value={women.filter((w) => w.marital_status.includes("विवाहित") && !w.marital_status.includes("अविवाहित")).length} />
        <Kpi tone="amber" label="Unmarried Women" value={women.filter((w) => w.marital_status.includes("अविवाहित")).length} />
        <Kpi tone="violet" label="Women in Bachat Gat" value={shg((g) => g.is_member)} />
        <Kpi tone="cyan" label="Interested in Bachat Gat" value={shg((g) => g.wants_to_join)} />
        <Kpi tone="lime" label="Running Home Business" value={shg((g) => g.has_rural_home_business)} />
        <Kpi tone="primary" label="Interested in Starting Business" value={shg((g) => g.wants_to_start_business)} />
        <Kpi tone="red" label="Ladki Bahin Beneficiary Families" value={rows.filter((r) => b(r).ladki_bahin).length} />
      </KpiGrid>
      <G>
        <ChartCard title="महिला बचत गट / Self Help Group">
          <PieCh donut data={[
            { name: "सदस्य", value: shg((g) => g.is_member) },
            { name: "सहभागी होऊ इच्छिते", value: shg((g) => g.wants_to_join) },
            { name: "इतर", value: Math.max(0, women.length - shg((g) => g.is_member) - shg((g) => g.wants_to_join)) },
          ]} />
        </ChartCard>
        <ChartCard title="महिला वयोगट / Women by Age"><BarCh data={A.AGE_BANDS.map((band) => ({ name: band.name, value: women.filter((w) => typeof w.age === "number" && band.test(w.age)).length }))} color="#ec4899" /></ChartCard>
        <ChartCard title="महिला शिक्षण / Women by Education"><BarCh horizontal data={A.groupCount(women.filter((w) => w.education) as any, (w: any) => A.eduLevel(w.education))} color="#8b5cf6" /></ChartCard>
        <ChartCard title="महिला व्यवसाय / Women by Occupation"><BarCh horizontal data={A.groupCount(women.filter((w) => w.occupation) as any, (w: any) => A.occGroup(w.occupation))} color="#10b981" /></ChartCard>
      </G>
      <DataTable
        title="Women & Bachat Gat Detail"
        columns={[{ key: "name", label: "Name" }, { key: "village", label: "Village" }, { key: "member", label: "Bachat Gat" }, { key: "interest", label: "Wants to Join" }, { key: "business", label: "Home Business" }, { key: "want", label: "Business Interest" }]}
        rows={women.filter((w) => w.bachat_gat).map((w) => ({
          name: w.name, village: w.row.village,
          member: w.bachat_gat.is_member ? "होय" : "नाही",
          interest: w.bachat_gat.wants_to_join ? "होय" : "—",
          business: w.bachat_gat.business_name || (w.bachat_gat.has_rural_home_business ? "होय" : "नाही"),
          want: w.bachat_gat.desired_business || (w.bachat_gat.wants_to_start_business ? "होय" : "—"),
        }))}
      />
    </div>
  );
}

/* ======================================================== 12 Leadership */

function Leadership({ rows }: Ctx) {
  const pos = A.allPositions(rows);
  const t = (k: string) => pos.filter((p) => A.txt(p.type).includes(k)).length;
  const st = (k: string) => pos.filter((p) => A.txt(p.status).includes(k)).length;
  const lvl = (k: string) => pos.filter((p) => A.txt(p.political_level).includes(k)).length;
  return (
    <div className="space-y-4">
      <KpiGrid>
        <Kpi icon={Landmark} label="Total Positions" value={pos.length} />
        <Kpi tone="green" label="Current Leaders (आजी)" value={st("आजी")} />
        <Kpi tone="amber" label="Former Leaders (माजी)" value={st("माजी")} />
        <Kpi tone="violet" label="Political Leaders" value={t("राजकीय")} />
        <Kpi tone="cyan" label="Social Leaders" value={t("सामाजिक")} />
        <Kpi tone="pink" label="Representatives" value={t("लोकप्रतिनिधी")} />
        <Kpi tone="lime" label="Village Level" value={lvl("गाव")} />
        <Kpi tone="primary" label="Taluka Level" value={lvl("तालुका")} />
        <Kpi tone="red" label="District Level" value={lvl("जिल्हा")} />
        <Kpi tone="green" label="State Level" value={lvl("राज्य")} />
      </KpiGrid>
      <G>
        <ChartCard title="पद प्रकार / Position Type"><PieCh donut data={A.groupCount(pos, (p) => A.txt(p.type) || "—")} /></ChartCard>
        <ChartCard title="आजी / माजी — Current vs Former"><PieCh data={A.groupCount(pos, (p) => A.txt(p.status) || "—")} /></ChartCard>
        <ChartCard title="राजकीय स्तर / Political Level"><BarCh data={A.groupCount(pos.filter((p) => p.political_level), (p) => A.txt(p.political_level))} color="#8b5cf6" /></ChartCard>
        <ChartCard title="पक्षनिहाय / Party-wise"><BarCh horizontal data={A.groupCount(pos.filter((p) => p.party_name), (p) => A.txt(p.party_name_other) || A.txt(p.party_name))} color="#2563eb" /></ChartCard>
        <ChartCard title="लोकप्रतिनिधी प्रकार / Representative Type" wide><BarCh horizontal data={A.groupCount(pos.filter((p) => p.representative_type), (p) => A.txt(p.representative_type))} color="#10b981" /></ChartCard>
      </G>
      <DataTable
        title="Leadership Detail Report"
        columns={[
          { key: "person", label: "Person" }, { key: "type", label: "Type" }, { key: "status", label: "Status" },
          { key: "level", label: "Level" }, { key: "rep", label: "Role" }, { key: "party", label: "Party" },
          { key: "term", label: "Term" }, { key: "village", label: "Village" },
        ]}
        rows={pos.map((p) => ({
          person: p.person_name || p.row.head_name, type: p.type, status: p.status, level: p.political_level,
          rep: p.representative_type || p.coop_role || p.social_role,
          party: p.party_name_other || p.party_name,
          term: [p.term_from, p.term_to].filter(Boolean).join(" – "), village: p.row.village,
        }))}
      />
    </div>
  );
}

/* ========================================================== 13 Business */

function BusinessSec({ rows, people }: Ctx) {
  const e = (r: A.Row) => (r.employment_info || {}) as any;
  const entrepreneurs = rows.filter((r) => e(r).has_entrepreneur);
  const side = rows.filter((r) => e(r).has_side_business);
  const loan = rows.filter((r) => e(r).needs_business_loan || e(r).loan_required);
  const selfEmp = people.filter((p) => A.occGroup(p.occupation) === "स्वरोजगार / Self Employed").length;
  const owners = people.filter((p) => A.occGroup(p.occupation) === "व्यवसाय / Business Owner").length;
  return (
    <div className="space-y-4">
      <KpiGrid>
        <Kpi icon={Store} label="Entrepreneur Families" value={entrepreneurs.length} />
        <Kpi tone="green" label="Self-employed Members" value={selfEmp} />
        <Kpi tone="violet" label="Business Owners" value={owners} />
        <Kpi tone="amber" label="Side Businesses" value={side.length} />
        <Kpi tone="cyan" label="Agriculture + Business" value={people.filter((p) => A.occGroup(p.occupation) === "शेती + व्यवसाय").length} />
        <Kpi tone="red" label="Businesses Requiring Loan" value={loan.length} />
      </KpiGrid>
      <G>
        <ChartCard title="उद्योजकता / Entrepreneurship"><PieCh donut data={[{ name: "उद्योजक कुटुंबे", value: entrepreneurs.length }, { name: "इतर", value: rows.length - entrepreneurs.length }]} /></ChartCard>
        <ChartCard title="व्यवसाय प्रकार / Business Types">{entrepreneurs.length ? <BarCh horizontal data={A.groupCount(entrepreneurs, (r) => A.txt(e(r).entrepreneur_details) || "—")} color="#8b5cf6" /> : <Empty />}</ChartCard>
        <ChartCard title="जोड व्यवसाय / Side Business">{side.length ? <BarCh horizontal data={A.groupCount(side, (r) => A.txt(e(r).side_business_details) || "—")} color="#f59e0b" /> : <Empty />}</ChartCard>
        <ChartCard title="गावनिहाय उद्योजक / Entrepreneurs by Village">{entrepreneurs.length ? <BarCh horizontal data={A.groupCount(entrepreneurs, (r) => A.txt(r.village))} color="#10b981" /> : <Empty />}</ChartCard>
      </G>
      <DataTable
        title="Business & Entrepreneurship Report"
        columns={[{ key: "head", label: "Family Head" }, { key: "business", label: "Business" }, { key: "address", label: "Location" }, { key: "side", label: "Side Business" }, { key: "village", label: "Village" }]}
        rows={[...entrepreneurs, ...side.filter((r) => !entrepreneurs.includes(r))].map((r) => ({
          head: r.head_name, business: e(r).entrepreneur_details, address: e(r).entrepreneur_address,
          side: e(r).side_business_details, village: r.village,
        }))}
      />
    </div>
  );
}

/* ================================================ 14 Human Resources */

function HumanResources({ rows, people }: Ctx) {
  const prof = A.PROFESSIONS.map((p) => ({ name: p.name, value: people.filter((x) => p.match(x.occupation)).length }))
    .filter((d) => d.value > 0);
  const directory = people
    .map((p) => ({ p, prof: A.professionOf(p.occupation) }))
    .filter((x) => x.prof);
  return (
    <div className="space-y-4">
      <KpiGrid>
        <Kpi icon={BriefcaseBusiness} label="Total Professionals" value={directory.length} />
        {prof.slice(0, 11).map((d) => (
          <Kpi key={d.name} tone={["green", "violet", "amber", "cyan", "pink", "lime", "red", "primary"][d.name.length % 8]} label={d.name} value={d.value} />
        ))}
      </KpiGrid>
      <G>
        <ChartCard title="व्यावसायिक गट / Professional Categories" wide><BarCh horizontal data={prof} color="#2563eb" /></ChartCard>
        <ChartCard title="व्यवसाय × जिल्हा / Profession × District"><StackedBar {...A.crossTab(rows, "district", "occupation")} /></ChartCard>
        <ChartCard title="व्यवसाय × शिक्षण / Profession × Education"><StackedBar {...A.crossTab(rows, "occupation", "education")} /></ChartCard>
        <ChartCard title="व्यवसाय × वयोगट / Profession × Age"><StackedBar {...A.crossTab(rows, "occupation", "age_group")} /></ChartCard>
        <ChartCard title="व्यवसाय × गाव / Profession × Village"><StackedBar {...A.crossTab(rows, "village", "occupation")} /></ChartCard>
      </G>
      <DataTable
        title="Community Human Resource Directory"
        columns={[
          { key: "name", label: "Name" }, { key: "prof", label: "Profession" }, { key: "edu", label: "Education" },
          { key: "age", label: "Age" }, { key: "village", label: "Village" }, { key: "district", label: "District" }, { key: "mobile", label: "Mobile" },
        ]}
        rows={directory.map(({ p, prof: pr }) => ({
          name: p.name, prof: pr, edu: p.education, age: p.age ?? "—",
          village: p.row.village, district: p.row.district, mobile: p.isHead ? p.row.mobile : "—",
        }))}
      />
    </div>
  );
}

/* ============================================================= 15 Needs */

function Needs({ rows, people }: Ctx) {
  const tool = (r: A.Row, key: string) => ((r.farming_tools_details || {}) as any)[key] || {};
  const e = (r: A.Row) => (r.employment_info || {}) as any;
  const b = (r: A.Row) => (r.benefits_info || {}) as any;
  const women = people.filter((p) => p.gender === "स्त्री" && p.bachat_gat);
  const needs = [
    { name: "घरकुल आवश्यक / Gharkul Required", value: rows.filter((r) => r.gharkul_wanted).length },
    { name: "शेती साधन आवश्यक / Equipment Required", value: rows.filter((r) => A.TOOL_KEYS.some((k) => tool(r, k.key).want_to_buy)).length },
    { name: "शेती कर्ज आवश्यक / Agri Loan Required", value: rows.filter((r) => A.TOOL_KEYS.some((k) => tool(r, k.key).needs_loan)).length },
    { name: "सोलर आवश्यक / Solar Required", value: rows.filter((r) => r.solar_panel_wanted).length },
    { name: "वैद्यकीय मदत / Medical Assistance", value: rows.filter((r) => b(r).medical_aid_needed).length },
    { name: "बेरोजगार सदस्य / Unemployed Members", value: people.filter((p) => A.occGroup(p.occupation) === "बेरोजगार / Unemployed").length },
    { name: "व्यवसाय कर्ज / Business Loan Required", value: rows.filter((r) => e(r).needs_business_loan || e(r).loan_required).length },
    { name: "व्यवसाय सुरू करण्याची इच्छा / Startup Interest", value: women.filter((w) => w.bachat_gat.wants_to_start_business).length },
    { name: "बचत गट सहभाग इच्छुक / Bachat Gat Interest", value: women.filter((w) => w.bachat_gat.wants_to_join).length },
  ];
  return (
    <div className="space-y-4">
      <KpiGrid>
        {needs.map((n, i) => (
          <Kpi key={n.name} tone={["primary", "green", "amber", "violet", "red", "cyan", "pink", "lime", "primary"][i]!} label={n.name} value={n.value} />
        ))}
      </KpiGrid>
      <G>
        <ChartCard title="समाज गरजा / Community Needs" wide><BarCh horizontal data={needs.filter((n) => n.value > 0)} color="#ef4444" /></ChartCard>
        <ChartCard title="गावनिहाय घरकुल गरज / Gharkul Need by Village">
          <BarCh horizontal color="#f59e0b" data={A.uniq(rows, (r) => A.txt(r.village)).map((v) => ({ name: v, value: rows.filter((r) => A.txt(r.village) === v && r.gharkul_wanted).length })).filter((d) => d.value > 0)} />
        </ChartCard>
        <ChartCard title="गावनिहाय सोलर गरज / Solar Need by Village">
          <BarCh horizontal color="#10b981" data={A.uniq(rows, (r) => A.txt(r.village)).map((v) => ({ name: v, value: rows.filter((r) => A.txt(r.village) === v && r.solar_panel_wanted).length })).filter((d) => d.value > 0)} />
        </ChartCard>
      </G>
      <DataTable
        title="Community Needs by Village"
        columns={[
          { key: "name", label: "Village" }, { key: "families", label: "Families" }, { key: "gharkul", label: "Gharkul" },
          { key: "solar", label: "Solar" }, { key: "equip", label: "Equipment" }, { key: "medical", label: "Medical" }, { key: "unemp", label: "Unemployed" },
        ]}
        rows={A.uniq(rows, (r) => A.txt(r.village)).map((v) => {
          const sub = rows.filter((r) => A.txt(r.village) === v);
          return {
            name: v, families: sub.length,
            gharkul: sub.filter((r) => r.gharkul_wanted).length,
            solar: sub.filter((r) => r.solar_panel_wanted).length,
            equip: sub.filter((r) => A.TOOL_KEYS.some((k) => tool(r, k.key).want_to_buy)).length,
            medical: sub.filter((r) => b(r).medical_aid_needed).length,
            unemp: A.allPersons(sub).filter((p) => A.occGroup(p.occupation) === "बेरोजगार / Unemployed").length,
          };
        })}
      />
    </div>
  );
}

/* ====================================================== 16 Survey Users */

function SurveyUsers({ rows, appUsers, isAdmin }: Ctx) {
  if (!isAdmin) return <Card><CardContent className="p-6 text-sm text-muted-foreground">ही माहिती फक्त प्रशासकांसाठी उपलब्ध आहे.</CardContent></Card>;
  const byUser = appUsers.map((u) => {
    const sub = rows.filter((r) => r.created_by === u.id);
    const last = sub[0]?.created_at ? new Date(sub[0].created_at).toLocaleDateString("en-GB") : "—";
    return {
      name: u.full_name || u.email, surveys: sub.length, families: sub.length,
      members: A.allPersons(sub).length, villages: A.uniq(sub, (r) => A.txt(r.village)).length, last,
    };
  }).sort((a, b) => b.surveys - a.surveys);
  const active = byUser.filter((u) => u.surveys > 0);
  return (
    <div className="space-y-4">
      <KpiGrid>
        <Kpi icon={UserCog} label="Total Survey Users" value={appUsers.length} />
        <Kpi tone="green" label="Active Survey Users" value={active.length} />
        <Kpi tone="amber" label="Top Survey User" value={byUser[0]?.name ?? "—"} hint={`${byUser[0]?.surveys ?? 0} surveys`} />
        <Kpi tone="violet" label="Average Surveys / User" value={active.length ? (rows.length / active.length).toFixed(1) : 0} />
      </KpiGrid>
      <G>
        <ChartCard title="Survey User-wise Submission Count" wide><BarCh horizontal data={active.map((u) => ({ name: u.name, value: u.surveys }))} color="#2563eb" /></ChartCard>
        <ChartCard title="User-wise Members Covered" wide><BarCh horizontal data={active.map((u) => ({ name: u.name, value: u.members }))} color="#10b981" /></ChartCard>
      </G>
      <DataTable
        title="Survey User Performance"
        columns={[
          { key: "name", label: "Survey User" }, { key: "surveys", label: "Surveys" }, { key: "families", label: "Families" },
          { key: "members", label: "Members" }, { key: "villages", label: "Villages" }, { key: "last", label: "Last Submission" },
        ]}
        rows={byUser}
      />
    </div>
  );
}

/* ========================================================== 17 Progress */

function Progress2({ rows }: Ctx) {
  const now = new Date();
  const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0);
  const week = new Date(startOfDay); week.setDate(week.getDate() - 6);
  const month = new Date(startOfDay); month.setDate(month.getDate() - 29);
  const since = (d: Date) => rows.filter((r) => new Date(r.created_at) >= d).length;
  return (
    <div className="space-y-4">
      <KpiGrid>
        <Kpi icon={TrendingUp} label="Submitted Today" value={since(startOfDay)} />
        <Kpi tone="green" label="This Week (7d)" value={since(week)} />
        <Kpi tone="violet" label="This Month (30d)" value={since(month)} />
        <Kpi tone="amber" label="Total Submitted" value={rows.length} />
      </KpiGrid>
      <G>
        <ChartCard title="दैनिक सर्वेक्षण (30 दिवस) / Daily Trend" wide><LineCh data={A.trend(rows, 30)} /></ChartCard>
        <ChartCard title="साप्ताहिक कल / Last 7 Days"><BarCh data={A.trend(rows, 7)} color="#10b981" /></ChartCard>
        <ChartCard title="गावनिहाय प्रगती / Progress by Village"><BarCh horizontal data={A.groupCount(rows, (r) => A.txt(r.village))} color="#8b5cf6" /></ChartCard>
      </G>
      <DataTable
        title="Daily Submission Report"
        columns={[{ key: "name", label: "Date" }, { key: "value", label: "Surveys" }]}
        rows={A.trend(rows, 30).slice().reverse()}
      />
    </div>
  );
}

/* =========================================================== 18 Quality */

function Quality({ rows }: Ctx) {
  const c = A.completeness(rows);
  const missing = (f: (r: A.Row) => any) => rows.filter((r) => { const v = f(r); return v === null || v === undefined || v === "" || (Array.isArray(v) && !v.length); }).length;
  const complete = rows.filter((r) => r.head_name && r.village && r.mobile && r.district && r.taluka).length;
  return (
    <div className="space-y-4">
      <KpiGrid>
        <Kpi icon={CheckCircle2} label="Total Records" value={rows.length} />
        <Kpi tone="green" label="Complete Records" value={complete} />
        <Kpi tone="amber" label="Incomplete Records" value={rows.length - complete} />
        <Kpi tone="red" label="Duplicate Records" value={A.duplicates(rows)} />
        <Kpi tone="violet" label="Missing Mobile" value={missing((r) => r.mobile)} />
        <Kpi tone="cyan" label="Missing Pincode" value={missing((r) => r.pincode)} />
        <Kpi tone="pink" label="Missing Education" value={missing((r) => r.education)} />
        <Kpi tone="lime" label="Missing Occupation" value={missing((r) => r.occupation)} />
        <Kpi tone="amber" label="Missing Agriculture Data" value={missing((r) => r.has_farmland)} />
        <Kpi tone="red" label="Missing Family Members" value={rows.filter((r) => !Array.isArray(r.members) || !r.members.length).length} />
        <Kpi tone="primary" label="Overall Data Completion" value={`${c.overall}%`} />
      </KpiGrid>
      <div className="grid gap-3 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">विभागनिहाय पूर्णता / Section-wise Completion</CardTitle></CardHeader>
          <CardContent><CompletionList items={c.per} /></CardContent>
        </Card>
        <ChartCard title="पूर्णता तुलना / Completion Comparison"><BarCh horizontal data={c.per} color="#10b981" /></ChartCard>
      </div>
      <DataTable
        title="Data Completeness by Section"
        columns={[{ key: "name", label: "Section" }, { key: "value", label: "Completion %" }]}
        rows={c.per}
      />
    </div>
  );
}

/* ============================================================= 19 Cross */

function Cross({ rows }: Ctx) {
  const [d1, setD1] = useState("district");
  const [d2, setD2] = useState("occupation");
  const res = useMemo(() => A.crossTab(rows, d1, d2), [rows, d1, d2]);
  const label = (id: string) => A.DIMENSIONS.find((d) => d.id === id)?.label ?? id;
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-3 flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <div className="text-[10px] text-muted-foreground">Dimension 1</div>
            <Select value={d1} onValueChange={setD1}>
              <SelectTrigger className="h-8 w-56 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{A.DIMENSIONS.map((d) => <SelectItem key={d.id} value={d.id} className="text-xs">{d.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <div className="text-[10px] text-muted-foreground">Dimension 2</div>
            <Select value={d2} onValueChange={setD2}>
              <SelectTrigger className="h-8 w-56 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{A.DIMENSIONS.map((d) => <SelectItem key={d.id} value={d.id} className="text-xs">{d.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Badge variant="secondary" className="text-xs">Metric: {res.unit}</Badge>
        </CardContent>
      </Card>
      <ChartCard title={`${label(d1)} × ${label(d2)}`} wide><StackedBar data={res.data} columns={res.columns} /></ChartCard>
      <DataTable
        title={`Cross Analytics — ${label(d1)} × ${label(d2)}`}
        columns={[{ key: "name", label: label(d1) }, { key: "total", label: "Total" }, ...res.columns.map((c) => ({ key: c, label: c }))]}
        rows={res.data}
      />
    </div>
  );
}

/* =========================================================== 20 Reports */

function Reports({ rows }: Ctx) {
  const tool = (r: A.Row, key: string) => ((r.farming_tools_details || {}) as any)[key] || {};
  const villageReport = A.uniq(rows, (r) => A.txt(r.village)).map((v) => {
    const sub = rows.filter((r) => A.txt(r.village) === v);
    const ppl = A.allPersons(sub);
    return {
      name: v, families: sub.length, members: ppl.length,
      male: ppl.filter((p) => p.gender === "पुरुष").length,
      female: ppl.filter((p) => p.gender === "स्त्री").length,
      farmers: sub.filter((r) => r.has_farmland).length,
      graduates: ppl.filter((p) => A.eduLevel(p.education).includes("पदवी")).length,
      govt: ppl.filter((p) => A.occGroup(p.occupation) === "सरकारी कर्मचारी").length,
      houses: sub.filter((r) => r.owns_house).length,
      gharkul: sub.filter((r) => r.gharkul_wanted).length,
    };
  });
  return (
    <div className="space-y-4">
      <DataTable
        title="Village Master Report"
        columns={[
          { key: "name", label: "Village" }, { key: "families", label: "Families" }, { key: "members", label: "Members" },
          { key: "male", label: "Male" }, { key: "female", label: "Female" }, { key: "farmers", label: "Farmers" },
          { key: "graduates", label: "Graduates" }, { key: "govt", label: "Govt Jobs" }, { key: "houses", label: "Own Houses" }, { key: "gharkul", label: "Gharkul Need" },
        ]}
        rows={villageReport}
      />
      <DataTable
        title="Family Master Report"
        columns={[
          { key: "head", label: "Family Head" }, { key: "mobile", label: "Mobile" }, { key: "members", label: "Members" },
          { key: "village", label: "Village" }, { key: "taluka", label: "Taluka" }, { key: "district", label: "District" },
          { key: "land", label: "Land (acre)" }, { key: "house", label: "House Type" }, { key: "equip", label: "Equipment" }, { key: "date", label: "Survey Date" },
        ]}
        pageSize={15}
        rows={rows.map((r) => ({
          head: r.head_name, mobile: r.mobile, members: A.personsOf(r).length,
          village: r.village, taluka: r.taluka, district: r.district,
          land: r.has_farmland ? r.total_farmland : "—", house: r.house_type,
          equip: A.TOOL_KEYS.filter((k) => tool(r, k.key).has).map((k) => k.label).join(", ") || "—",
          date: new Date(r.created_at).toLocaleDateString("en-GB"),
        }))}
      />
      <DataTable
        title="Member Master Report"
        columns={[
          { key: "name", label: "Name" }, { key: "rel", label: "Relation" }, { key: "gender", label: "Gender" },
          { key: "age", label: "Age" }, { key: "marital", label: "Marital" }, { key: "edu", label: "Education" },
          { key: "occ", label: "Occupation" }, { key: "village", label: "Village" }, { key: "district", label: "District" },
        ]}
        pageSize={15}
        rows={A.allPersons(rows).map((p) => ({
          name: p.name, rel: p.relationship, gender: p.gender, age: p.age ?? "—",
          marital: p.marital_status, edu: A.eduLevel(p.education), occ: A.occGroup(p.occupation),
          village: p.row.village, district: p.row.district,
        }))}
      />
      <div className="flex flex-wrap gap-2 print:hidden">
        <Button variant="outline" size="sm" className="text-xs" onClick={() => window.print()}>
          <Trophy className="h-3.5 w-3.5 mr-1" />संपूर्ण अहवाल प्रिंट / Print full report
        </Button>
      </div>
    </div>
  );
}
