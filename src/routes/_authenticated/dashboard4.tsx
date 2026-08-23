import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { listAppUsers } from "@/lib/users.functions";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Kpi, KpiGrid } from "@/components/analytics/AnalyticsUI";
import {
  DrillProvider, useDrill, SectionShell, Panel, ChartBox, DBar, DPie, DLine, DStack,
  MiniTable, StatBars, NeedCard, type TableSpec,
} from "@/components/analytics/Dash4UI";
import * as A from "@/lib/analytics";
import { SurveyFilterPanel } from "@/components/SurveyFilterPanel";
import { countActive, emptyFilters, matchSurvey, type SurveyFilters } from "@/lib/survey-filters";
import {
  MapPin, Users, GraduationCap, Briefcase, Sprout, Droplets, Wheat, Tractor,
  Home, Boxes, Sun, Target, HeartPulse, Trophy, Landmark, Store, UserRound,
  BriefcaseBusiness, HandHeart, UserCog, TrendingUp, CheckCircle2, Shuffle,
  Filter, RotateCcw, ChevronDown, Search, LayoutDashboard,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard4")({
  component: Dashboard4Page,
  head: () => ({
    meta: [
      { title: "Community Survey Analytics — Dashboard 4" },
      { name: "description", content: "Professional single-screen community survey analytics: KPIs, geography, education, occupation, agriculture, benefits, leadership, needs and cross analytics." },
      { property: "og:title", content: "Community Survey Analytics — Dashboard 4" },
      { property: "og:description", content: "Comprehensive socio-economic analytics dashboard for the community family survey." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

/* ----------------------------------------------------------------- types */

type Ctx = { rows: A.Row[]; people: A.Person[]; appUsers: any[]; allRows: A.Row[] };

type GlobalF = {
  state: string; district: string; taluka: string; village: string; pincode: string;
  from: string; to: string; user: string; gender: string; ageGroup: string;
  occupation: string; education: string;
};

const emptyG: GlobalF = {
  state: "", district: "", taluka: "", village: "", pincode: "",
  from: "", to: "", user: "", gender: "", ageGroup: "", occupation: "", education: "",
};

const NAV = [
  { id: "kpi", label: "Executive KPIs" },
  { id: "geo", label: "Geographic" },
  { id: "demo", label: "Demographics" },
  { id: "edu", label: "Education" },
  { id: "occ", label: "Occupation" },
  { id: "agri", label: "Agriculture" },
  { id: "crop", label: "Crops" },
  { id: "irrigation", label: "Irrigation" },
  { id: "equipment", label: "Equipment" },
  { id: "housing", label: "Housing" },
  { id: "assets", label: "Assets" },
  { id: "solar", label: "Solar" },
  { id: "benefits", label: "Benefits" },
  { id: "medical", label: "Medical" },
  { id: "sports", label: "Sports" },
  { id: "leadership", label: "Leadership" },
  { id: "business", label: "Business" },
  { id: "women", label: "Women" },
  { id: "hr", label: "Human Resources" },
  { id: "needs", label: "Community Needs" },
  { id: "users", label: "User Performance" },
  { id: "progress", label: "Survey Progress" },
  { id: "quality", label: "Data Quality" },
  { id: "cross", label: "Cross Analytics" },
];

/** Section pairing at the page level (two columns on wide screens). */
const Pair = ({ children }: { children: React.ReactNode }) => (
  <div className="grid gap-4 xl:grid-cols-2 items-start">{children}</div>
);
/** Charts inside a section stack vertically so axes never get cramped. */
const G2 = ({ children }: { children: React.ReactNode }) => (
  <div className="grid gap-3">{children}</div>
);
const G3 = ({ children }: { children: React.ReactNode }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">{children}</div>
);

const ALL = "__all__";
const marital = (people: A.Person[], k: string, exclude?: string) =>
  people.filter((p) => p.marital_status.includes(k) && (!exclude || !p.marital_status.includes(exclude))).length;

/* ============================================================== container */

function Dashboard4Page() {
  return (
    <DrillProvider>
      <Dashboard4 />
    </DrillProvider>
  );
}

function Dashboard4() {
  const { role, user } = useAuth();
  const isAdmin = role === "admin";
  const [all, setAll] = useState<A.Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [appUsers, setAppUsers] = useState<any[]>([]);
  const fetchUsers = useServerFn(listAppUsers);

  const [draft, setDraft] = useState<GlobalF>({ ...emptyG });
  const [g, setG] = useState<GlobalF>({ ...emptyG });
  const [filters, setFilters] = useState<SurveyFilters>({ ...emptyFilters });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [q, setQ] = useState("");

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

  const personActive = !!(g.gender || g.ageGroup || g.occupation || g.education);
  const personOk = useMemo(() => (p: A.Person) => {
    if (g.gender && p.gender !== g.gender) return false;
    if (g.ageGroup && A.ageBand(p.age) !== g.ageGroup) return false;
    if (g.occupation && A.occGroup(p.occupation) !== g.occupation) return false;
    if (g.education && A.eduLevel(p.education) !== g.education) return false;
    return true;
  }, [g.gender, g.ageGroup, g.occupation, g.education]);

  const rows = useMemo(
    () =>
      scoped.filter((r) => {
        if (g.state && A.stateOf(r) !== g.state) return false;
        if (g.district && A.txt(r.district) !== g.district) return false;
        if (g.taluka && A.txt(r.taluka) !== g.taluka) return false;
        if (g.village && A.txt(r.village) !== g.village) return false;
        if (g.pincode && A.txt(r.pincode) !== g.pincode) return false;
        if (g.user && r.created_by !== g.user) return false;
        if (g.from && new Date(r.created_at) < new Date(g.from)) return false;
        if (g.to) {
          const end = new Date(g.to); end.setHours(23, 59, 59, 999);
          if (new Date(r.created_at) > end) return false;
        }
        if (q.trim()) {
          const s = q.trim().toLowerCase();
          const hay = `${r.head_name} ${r.mobile} ${r.village} ${r.taluka} ${r.district} ${r.pincode}`.toLowerCase();
          if (!hay.includes(s)) return false;
        }
        if (personActive && !A.personsOf(r).some(personOk)) return false;
        return matchSurvey(r, filters);
      }),
    [scoped, g, q, filters, personActive, personOk],
  );

  const people = useMemo(() => {
    const p = A.allPersons(rows);
    return personActive ? p.filter(personOk) : p;
  }, [rows, personActive, personOk]);

  const opts = useMemo(() => ({
    states: A.uniq(scoped, (r) => A.stateOf(r)),
    districts: A.uniq(scoped.filter((r) => !draft.state || A.stateOf(r) === draft.state), (r) => A.txt(r.district)),
    talukas: A.uniq(scoped.filter((r) => !draft.district || A.txt(r.district) === draft.district), (r) => A.txt(r.taluka)),
    villages: A.uniq(scoped.filter((r) => !draft.taluka || A.txt(r.taluka) === draft.taluka), (r) => A.txt(r.village)),
    pincodes: A.uniq(scoped, (r) => A.txt(r.pincode)),
    occupations: A.uniq(A.allPersons(scoped) as any, (p: any) => A.occGroup(p.occupation)).filter((x) => x !== "—"),
    educations: A.uniq(A.allPersons(scoped) as any, (p: any) => A.eduLevel(p.education)).filter((x) => x !== "—"),
  }), [scoped, draft.state, draft.district, draft.taluka]);

  if (loading) return <div className="text-muted-foreground">लोड होत आहे... / Loading dashboard…</div>;

  const set = (k: keyof GlobalF, v: string) => setDraft((d) => ({ ...d, [k]: v === ALL ? "" : v }));
  const apply = () => setG({ ...draft });
  const reset = () => { setDraft({ ...emptyG }); setG({ ...emptyG }); setFilters({ ...emptyFilters }); setQ(""); };
  const activeCount =
    Object.values(g).filter(Boolean).length + countActive(filters) + (q.trim() ? 1 : 0);
  const lastUpdated = all[0] ? new Date(all[0].created_at).toLocaleDateString("en-GB") : "—";
  const ctx: Ctx = { rows, people, appUsers, allRows: scoped };

  const Sel = ({ k, label, options }: { k: keyof GlobalF; label: string; options: string[] }) => (
    <div className="space-y-1">
      <div className="text-[10px] uppercase tracking-wide opacity-80">{label}</div>
      <Select value={draft[k] || ALL} onValueChange={(v) => set(k, v)}>
        <SelectTrigger className="h-8 w-[9.5rem] text-xs bg-background text-foreground"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL} className="text-xs">सर्व / All</SelectItem>
          {options.filter(Boolean).map((o) => <SelectItem key={o} value={o} className="text-xs">{o}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="space-y-4 pb-10">
      {/* ---------------------------------------------------------- header */}
      <div className="rounded-2xl overflow-hidden shadow-sm">
        <div className="bg-gradient-to-br from-primary via-primary/90 to-primary/60 text-primary-foreground p-5 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-xl md:text-3xl font-extrabold tracking-tight">COMMUNITY SURVEY ANALYTICS</h1>
              <p className="text-xs md:text-sm opacity-90 mt-1">
                Comprehensive Community Socio-Economic Survey Dashboard — कोहळी समाज विकास मंडळ, नागपूर
              </p>
            </div>
            <div className="text-right text-[11px] opacity-90">
              <div className="flex items-center gap-1 justify-end"><UserCog className="h-3.5 w-3.5" />{isAdmin ? "Admin" : "Survey User"}</div>
              <div>Last Updated: {lastUpdated}</div>
            </div>
          </div>

          {/* global filters */}
          <div className="mt-4 flex flex-wrap items-end gap-2">
            <Sel k="state" label="State" options={opts.states} />
            <Sel k="district" label="District" options={opts.districts} />
            <Sel k="taluka" label="Taluka" options={opts.talukas} />
            <Sel k="village" label="Village" options={opts.villages} />
            <Sel k="pincode" label="Pincode" options={opts.pincodes} />
            <div className="space-y-1">
              <div className="text-[10px] uppercase tracking-wide opacity-80">Survey Date From</div>
              <Input type="date" value={draft.from} onChange={(e) => set("from", e.target.value)} className="h-8 w-[9.5rem] text-xs bg-background text-foreground" />
            </div>
            <div className="space-y-1">
              <div className="text-[10px] uppercase tracking-wide opacity-80">To</div>
              <Input type="date" value={draft.to} onChange={(e) => set("to", e.target.value)} className="h-8 w-[9.5rem] text-xs bg-background text-foreground" />
            </div>
            {isAdmin && (
              <div className="space-y-1">
                <div className="text-[10px] uppercase tracking-wide opacity-80">Survey User</div>
                <Select value={draft.user || ALL} onValueChange={(v) => set("user", v)}>
                  <SelectTrigger className="h-8 w-[11rem] text-xs bg-background text-foreground"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL} className="text-xs">सर्व / All</SelectItem>
                    {appUsers.map((u) => (
                      <SelectItem key={u.id} value={u.id} className="text-xs">{u.full_name || u.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Sel k="gender" label="Gender" options={["पुरुष", "स्त्री", "इतर"]} />
            <Sel k="ageGroup" label="Age Group" options={A.AGE_BANDS.map((b) => b.name)} />
            <Sel k="occupation" label="Occupation" options={opts.occupations} />
            <Sel k="education" label="Education" options={opts.educations} />
            <div className="space-y-1">
              <div className="text-[10px] uppercase tracking-wide opacity-80">Quick Search</div>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="नाव / गाव / मोबाईल"
                  className="h-8 w-44 pl-7 text-xs bg-background text-foreground" />
              </div>
            </div>
            <Button size="sm" variant="secondary" className="h-8 text-xs" onClick={apply}>
              <Filter className="h-3.5 w-3.5 mr-1" />Apply Filter
            </Button>
            <Button size="sm" variant="outline" className="h-8 text-xs bg-background text-foreground" onClick={reset}>
              <RotateCcw className="h-3.5 w-3.5 mr-1" />Reset
            </Button>
            <Button size="sm" variant="outline" className="h-8 text-xs bg-background text-foreground" onClick={() => setShowAdvanced((v) => !v)}>
              Advanced Filters
              <ChevronDown className={`h-3.5 w-3.5 ml-1 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
            </Button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
            {activeCount > 0 && <Badge variant="secondary" className="text-[10px]">{activeCount} filters active</Badge>}
            <Badge variant="secondary" className="text-[10px]">{rows.length} families</Badge>
            <Badge variant="secondary" className="text-[10px]">{people.length} members</Badge>
          </div>
        </div>
        {showAdvanced && (
          <Card className="rounded-none border-t-0 print:hidden">
            <CardContent className="p-3">
              <SurveyFilterPanel rows={scoped} filters={filters} onChange={setFilters}
                title="Advanced Filters — Agriculture, Housing, Benefits, Business, Position" />
            </CardContent>
          </Card>
        )}
      </div>

      {/* quick nav */}
      <div className="flex flex-wrap gap-1.5 print:hidden">
        {NAV.map((n) => (
          <a key={n.id} href={`#${n.id}`}
            className="rounded-full border px-2.5 py-1 text-[11px] hover:bg-primary hover:text-primary-foreground transition-colors">
            {n.label}
          </a>
        ))}
      </div>

      <ExecutiveKpis {...ctx} />
      <Pair>
        <Geographic {...ctx} />
        <Demographics {...ctx} />
      </Pair>
      <Pair>
        <Education {...ctx} />
        <Occupation {...ctx} />
      </Pair>
      <Pair>
        <Agriculture {...ctx} />
        <Crops {...ctx} />
      </Pair>
      <Pair>
        <Irrigation {...ctx} />
        <Equipment {...ctx} />
      </Pair>
      <Pair>
        <Housing {...ctx} />
        <Assets {...ctx} />
      </Pair>
      <Pair>
        <Solar {...ctx} />
        <Benefits {...ctx} />
      </Pair>
      <Pair>
        <Medical {...ctx} />
        <Sports {...ctx} />
      </Pair>
      <Pair>
        <Leadership {...ctx} />
        <BusinessSec {...ctx} />
      </Pair>
      <Pair>
        <Women {...ctx} />
        <HumanResources {...ctx} />
      </Pair>
      <Pair>
        <Needs {...ctx} />
        <UserPerformance {...ctx} />
      </Pair>
      <Pair>
        <ProgressSec {...ctx} />
        <Quality {...ctx} />
      </Pair>
      <CrossAnalytics {...ctx} />
    </div>
  );
}

/* ======================================================= executive KPIs */

function ExecutiveKpis({ rows, people, appUsers }: Ctx) {
  const { open } = useDrill();
  const male = people.filter((p) => p.gender === "पुरुष");
  const female = people.filter((p) => p.gender === "स्त्री");
  const farm = rows.filter((r) => r.has_farmland);
  const own = rows.filter((r) => r.owns_house);
  const govt = people.filter((p) => A.occGroup(p.occupation) === "सरकारी कर्मचारी");
  const pvt = people.filter((p) => A.occGroup(p.occupation) === "खाजगी कर्मचारी");
  const benefits = rows.filter((r) => (r.benefits_info || {}).ladki_bahin);
  const needs = rows.filter((r) =>
    r.gharkul_wanted || r.solar_panel_wanted ||
    (r.benefits_info || {}).medical_aid_needed ||
    A.TOOL_KEYS.some((k) => ((r.farming_tools_details || {}) as any)[k.key]?.needs_loan));

  return (
    <section id="kpi" className="scroll-mt-20 space-y-3">
      <KpiGrid>
        <Kpi icon={LayoutDashboard} label="Total Surveys / एकूण सर्वेक्षण" value={rows.length} />
        <Kpi icon={Users} tone="green" label="Total Families / कुटुंबे" value={rows.length} />
        <Kpi icon={Users} tone="violet" label="Total Members / सदस्य" value={people.length} />
        <Kpi tone="primary" label="Total Male / पुरुष" value={male.length} hint={`${A.pct(male.length, people.length)}%`} />
        <Kpi tone="pink" label="Total Female / स्त्री" value={female.length} hint={`${A.pct(female.length, people.length)}%`} />
        <Kpi icon={UserCog} tone="amber" label="Survey Users" value={appUsers.length || new Set(rows.map((r) => r.created_by)).size} />
        <Kpi tone="cyan" label="Average Family Size" value={rows.length ? (people.length / rows.length).toFixed(2) : "0"} />
        <Kpi icon={MapPin} tone="lime" label="Districts Covered" value={A.uniq(rows, (r) => A.txt(r.district)).length} />
      </KpiGrid>
      <KpiGrid>
        <Kpi icon={MapPin} tone="cyan" label="Talukas Covered" value={A.uniq(rows, (r) => A.txt(r.taluka)).length} />
        <Kpi icon={MapPin} tone="cyan" label="Villages Covered" value={A.uniq(rows, (r) => A.txt(r.village)).length} />
        <Kpi icon={Sprout} tone="green" label="Agriculture Families" value={farm.length} hint={`${A.pct(farm.length, rows.length)}%`} />
        <Kpi tone="amber" label="Non-Agriculture" value={rows.length - farm.length} />
        <Kpi icon={Home} tone="violet" label="Own House" value={own.length} hint={`${A.pct(own.length, rows.length)}%`} />
        <Kpi tone="red" label="Rented / Dependent" value={rows.length - own.length} />
        <Kpi icon={Briefcase} tone="primary" label="Government Job" value={govt.length} />
        <Kpi tone="cyan" label="Private Job" value={pvt.length} />
      </KpiGrid>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <NeedCard dot="#10b981" label="Total Job Holders" value={govt.length + pvt.length}
          onClick={() => open({ title: "Job Holders", persons: [...govt, ...pvt] })} />
        <NeedCard dot="#8b5cf6" label="Benefit Families (Ladki Bahin)" value={benefits.length}
          onClick={() => open({ title: "Ladki Bahin Beneficiary Families", families: benefits })} />
        <NeedCard dot="#ef4444" label="Families with Pending Needs" value={needs.length}
          onClick={() => open({ title: "Families Requiring Support", families: needs })} />
        <NeedCard dot="#f59e0b" label="Married Members" value={marital(people, "विवाहित", "अविवाहित")}
          onClick={() => open({ title: "Married Members", persons: people.filter((p) => p.marital_status.includes("विवाहित") && !p.marital_status.includes("अविवाहित")) })} />
      </div>
    </section>
  );
}

/* ========================================================== 03 geography */

function Geographic({ rows }: Ctx) {
  const { open } = useDrill();
  const [level, setLevel] = useState<"district" | "taluka" | "village">("district");
  const [parent, setParent] = useState<{ district?: string; taluka?: string }>({});

  const subset = rows.filter((r) =>
    (!parent.district || A.txt(r.district) === parent.district) &&
    (!parent.taluka || A.txt(r.taluka) === parent.taluka));

  const key = (r: A.Row) =>
    level === "district" ? A.txt(r.district) : level === "taluka" ? A.txt(r.taluka) : A.txt(r.village);
  const roll = A.locationRollup(subset, key);
  const states = A.locationRollup(rows, (r) => A.stateOf(r));

  const drillTo = (name: string) => {
    if (level === "district") { setParent({ district: name }); setLevel("taluka"); }
    else if (level === "taluka") { setParent((p) => ({ ...p, taluka: name })); setLevel("village"); }
    else open({ title: `गाव / Village — ${name}`, families: subset.filter((r) => A.txt(r.village) === name) });
  };

  const table: TableSpec = {
    title: `${level} ranking`,
    columns: [
      { key: "name", label: level === "district" ? "District" : level === "taluka" ? "Taluka" : "Village" },
      { key: "families", label: "Families" }, { key: "members", label: "Members" },
      { key: "male", label: "Male" }, { key: "female", label: "Female" }, { key: "pctOfTotal", label: "Survey %" },
    ],
    rows: roll,
  };

  return (
    <SectionShell id="geo" no="03" title="📍 Geographic Coverage" icon={MapPin} accent="blue"
      subtitle="State → District → Taluka → Village drill-down with survey, family and member counts"
      tables={[table]}>
      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
        <Button size="sm" variant={level === "district" ? "default" : "outline"} className="h-7 text-[11px]"
          onClick={() => { setLevel("district"); setParent({}); }}>All Districts</Button>
        {parent.district && (
          <Button size="sm" variant={level === "taluka" ? "default" : "outline"} className="h-7 text-[11px]"
            onClick={() => { setLevel("taluka"); setParent({ district: parent.district }); }}>{parent.district}</Button>
        )}
        {parent.taluka && (
          <Button size="sm" variant="default" className="h-7 text-[11px]">{parent.taluka}</Button>
        )}
        <Badge variant="secondary" className="text-[10px] ml-auto">{subset.length} families in view</Badge>
      </div>
      <G2>
        <Panel title="राज्य / State Coverage">
          <StatBars total={rows.length} items={states.map((s) => ({ name: s.name, value: s.families }))} />
        </Panel>
        <Panel title={`${level === "district" ? "जिल्हा" : level === "taluka" ? "तालुका" : "गाव"} — Families (click to drill)`}>
          <StatBars total={subset.length} onSelect={drillTo}
            items={roll.slice(0, 12).map((r) => ({ name: r.name, value: r.families }))} />
        </Panel>
      </G2>
      <MiniTable
        title="Geographic Ranking"
        columns={table.columns}
        rows={roll.map((r) => ({ ...r, pctOfTotal: `${r.pctOfTotal}%` }))}
        onRowClick={(r) => drillTo(r.name)}
      />
    </SectionShell>
  );
}

/* ======================================================= 04 demographics */

function Demographics({ rows, people }: Ctx) {
  const { open } = useDrill();
  const gender = [
    { name: "पुरुष / Male", value: people.filter((p) => p.gender === "पुरुष").length },
    { name: "स्त्री / Female", value: people.filter((p) => p.gender === "स्त्री").length },
    { name: "इतर / Other", value: people.filter((p) => p.gender && p.gender !== "पुरुष" && p.gender !== "स्त्री").length },
  ];
  const ages = A.AGE_BANDS.map((b) => ({ name: b.name, value: people.filter((p) => typeof p.age === "number" && b.test(p.age)).length }));
  const maritalData = [
    { name: "विवाहित / Married", value: marital(people, "विवाहित", "अविवाहित") },
    { name: "अविवाहित / Unmarried", value: marital(people, "अविवाहित") },
    { name: "विधवा / Widow", value: marital(people, "विध") },
    { name: "घटस्फोटित / Divorced", value: marital(people, "घटस्फोट") },
  ];
  const sizes = A.FAMILY_SIZE_BANDS.map((b) => ({ name: b, value: rows.filter((r) => A.familySizeBand(A.familySize(r)) === b).length }));

  return (
    <SectionShell id="demo" no="04" title="👨‍👩‍👧 Demographic Analytics" icon={Users} accent="violet"
      subtitle="Gender, age, marital status and family size — click any chart segment for member details"
      tables={[
        { title: "Gender", columns: [{ key: "name", label: "Gender" }, { key: "value", label: "Members" }], rows: gender },
        { title: "Age Group", columns: [{ key: "name", label: "Age Group" }, { key: "value", label: "Members" }], rows: ages },
        { title: "Marital Status", columns: [{ key: "name", label: "Marital Status" }, { key: "value", label: "Members" }], rows: maritalData },
        { title: "Family Size", columns: [{ key: "name", label: "Family Size" }, { key: "value", label: "Families" }], rows: sizes },
      ]}>
      <G2>
        <Panel title="लिंग वितरण / Gender Distribution">
          <ChartBox h={230}>
            <DPie donut data={gender} onSelect={(n) => open({
              title: `Members — ${n}`,
              persons: people.filter((p) => n.startsWith(p.gender) || (n.includes("Other") && p.gender && p.gender !== "पुरुष" && p.gender !== "स्त्री")),
            })} />
          </ChartBox>
        </Panel>
        <Panel title="वयोगट / Age Distribution">
          <ChartBox h={230}>
            <DBar data={ages} color="#2563eb" onSelect={(n) => open({ title: `Members — Age ${n}`, persons: people.filter((p) => A.ageBand(p.age) === n) })} />
          </ChartBox>
        </Panel>
        <Panel title="वैवाहिक स्थिती / Marital Status">
          <ChartBox h={230}><DPie data={maritalData} /></ChartBox>
        </Panel>
        <Panel title="कुटुंब आकार / Family Size">
          <ChartBox h={230}>
            <DBar data={sizes} color="#10b981" onSelect={(n) => open({ title: `Families — size ${n}`, families: rows.filter((r) => A.familySizeBand(A.familySize(r)) === n) })} />
          </ChartBox>
        </Panel>
      </G2>
    </SectionShell>
  );
}

/* ========================================================== 05 education */

function Education({ rows, people }: Ctx) {
  const { open } = useDrill();
  const withEdu = people.filter((p) => p.education);
  const levels = A.groupCount(withEdu as any, (p: any) => A.eduLevel(p.education));
  const streams = A.groupCount(withEdu as any, (p: any) => A.eduStream(p.education)).filter((d) => d.name !== "—");
  const cnt = (k: string) => withEdu.filter((p) => A.eduLevel(p.education).includes(k)).length;

  const byVillage = A.uniq(rows, (r) => A.txt(r.village)).map((v) => {
    const ppl = A.allPersons(rows.filter((r) => A.txt(r.village) === v));
    const c = (k: string) => ppl.filter((p) => A.eduLevel(p.education).includes(k)).length;
    return { name: v, members: ppl.length, grad: c("पदवी") - c("पदव्युत्तर"), pg: c("पदव्युत्तर"), dip: c("पदविका"), phd: c("डॉक्टरेट"), illit: c("निरक्षर") };
  });

  return (
    <SectionShell id="edu" no="05" title="🎓 Education Analytics" icon={GraduationCap} accent="cyan"
      subtitle="Level → Stream → Course → Member drill-down"
      tables={[
        { title: "Education Level", columns: [{ key: "name", label: "Level" }, { key: "value", label: "Members" }], rows: levels },
        { title: "Education Stream", columns: [{ key: "name", label: "Stream" }, { key: "value", label: "Members" }], rows: streams },
        {
          title: "Village Education", rows: byVillage, columns: [
            { key: "name", label: "Village" }, { key: "members", label: "Members" }, { key: "grad", label: "Graduates" },
            { key: "pg", label: "Postgraduates" }, { key: "dip", label: "Diploma" }, { key: "phd", label: "Ph.D." }, { key: "illit", label: "Illiterate" },
          ],
        },
      ]}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <NeedCard dot="#10b981" label="Graduates" value={cnt("पदवी")} onClick={() => open({ title: "Graduates", persons: withEdu.filter((p) => A.eduLevel(p.education).includes("पदवी")) })} />
        <NeedCard dot="#8b5cf6" label="Postgraduates" value={cnt("पदव्युत्तर")} onClick={() => open({ title: "Postgraduates", persons: withEdu.filter((p) => A.eduLevel(p.education).includes("पदव्युत्तर")) })} />
        <NeedCard dot="#06b6d4" label="Diploma Holders" value={cnt("पदविका")} onClick={() => open({ title: "Diploma Holders", persons: withEdu.filter((p) => A.eduLevel(p.education).includes("पदविका")) })} />
        <NeedCard dot="#f59e0b" label="Ph.D. Holders" value={cnt("डॉक्टरेट")} onClick={() => open({ title: "Ph.D. Holders", persons: withEdu.filter((p) => A.eduLevel(p.education).includes("डॉक्टरेट")) })} />
      </div>
      <G2>
        <Panel title="शिक्षण स्तर / Education Level">
          <ChartBox h={250}>
            <DBar horizontal color="#8b5cf6" data={levels}
              onSelect={(n) => open({ title: `Education — ${n}`, persons: withEdu.filter((p) => A.eduLevel(p.education) === n) })} />
          </ChartBox>
        </Panel>
        <Panel title="शिक्षण शाखा / Education Stream">
          <ChartBox h={250}>
            <DBar horizontal color="#06b6d4" data={streams}
              onSelect={(n) => open({ title: `Stream — ${n}`, persons: withEdu.filter((p) => A.eduStream(p.education) === n) })} />
          </ChartBox>
        </Panel>
      </G2>
      <Panel title="शिक्षण × लिंग / Education × Gender">
        <ChartBox h={250}><DStack {...A.crossTab(rows, "education", "gender")} /></ChartBox>
      </Panel>
      <MiniTable title="Education Report by Village" columns={[
        { key: "name", label: "Village" }, { key: "members", label: "Members" }, { key: "grad", label: "Graduates" },
        { key: "pg", label: "PG" }, { key: "dip", label: "Diploma" }, { key: "phd", label: "Ph.D." }, { key: "illit", label: "Illiterate" },
      ]} rows={byVillage} />
    </SectionShell>
  );
}

/* ========================================================= 06 occupation */

function Occupation({ rows, people }: Ctx) {
  const { open } = useDrill();
  const withOcc = people.filter((p) => p.occupation);
  const groups = A.groupCount(withOcc as any, (p: any) => A.occGroup(p.occupation));
  const g = (name: string) => withOcc.filter((p) => A.occGroup(p.occupation) === name);
  const govt = g("सरकारी कर्मचारी");
  const govtDetail = A.groupCount(govt as any, (p: any) => A.txt(p.occupation));

  return (
    <SectionShell id="occ" no="06" title="💼 Occupation & Employment" icon={Briefcase} accent="green"
      subtitle="All occupation categories with Government → Department → Designation drill-down"
      tables={[
        { title: "Occupation", columns: [{ key: "name", label: "Occupation" }, { key: "value", label: "Members" }], rows: groups },
        { title: "Govt Designations", columns: [{ key: "name", label: "Designation" }, { key: "value", label: "Members" }], rows: govtDetail },
      ]}>
      <div className="grid grid-cols-3 gap-2">
        {[
          ["Government", "सरकारी कर्मचारी", "#2563eb"], ["Private", "खाजगी कर्मचारी", "#06b6d4"],
          ["Self Employed", "स्वरोजगार / Self Employed", "#8b5cf6"], ["Farmers", "शेतकरी / Farmer", "#10b981"],
          ["Business", "व्यवसाय / Business Owner", "#f59e0b"], ["Unemployed", "बेरोजगार / Unemployed", "#ef4444"],
        ].map(([label, key, color]) => (
          <NeedCard key={key} dot={color!} label={label!} value={g(key!).length}
            onClick={() => open({ title: `${label} members`, persons: g(key!) })} />
        ))}
      </div>
      <Panel title="व्यवसाय वितरण / Occupation Distribution (click to drill)">
        <ChartBox h={280}>
          <DBar horizontal color="#10b981" data={groups}
            onSelect={(n) => open({ title: `Occupation — ${n}`, persons: g(n) })} />
        </ChartBox>
      </Panel>
      <G2>
        <Panel title="सरकारी पदनाम / Government Designations">
          <ChartBox h={230}>
            <DBar horizontal color="#2563eb" data={govtDetail}
              onSelect={(n) => open({ title: `Government — ${n}`, persons: govt.filter((p) => A.txt(p.occupation) === n) })} />
          </ChartBox>
        </Panel>
        <Panel title="व्यवसाय × वयोगट / Occupation × Age">
          <ChartBox h={230}><DStack {...A.crossTab(rows, "occupation", "age_group")} /></ChartBox>
        </Panel>
      </G2>
    </SectionShell>
  );
}

/* ======================================================== 07 agriculture */

function Agriculture({ rows }: Ctx) {
  const { open } = useDrill();
  const farm = rows.filter((r) => r.has_farmland);
  const sum = (f: (r: A.Row) => any) => Math.round(rows.reduce((a, r) => a + A.num(f(r)), 0) * 10) / 10;
  const totalLand = sum((r) => r.total_farmland);
  const bands = A.LAND_BANDS.map((b) => ({ name: b, value: farm.filter((r) => A.landBand(A.num(r.total_farmland)) === b).length }));
  const farmingTypes = A.countMulti(farm, (r) => {
    const fm = (r.farm_management || {}) as any;
    const t = fm.farming_types || fm.types;
    return Array.isArray(t) ? t : t ? [String(t)] : [];
  });

  return (
    <SectionShell id="agri" no="07" title="🌾 Agriculture Dashboard" icon={Sprout} accent="green"
      subtitle="Landholding, irrigated vs dryland and farming type distribution"
      tables={[
        { title: "Landholding", columns: [{ key: "name", label: "Land Size" }, { key: "value", label: "Families" }], rows: bands },
        { title: "Farming Type", columns: [{ key: "name", label: "Farming Type" }, { key: "value", label: "Families" }], rows: farmingTypes },
      ]}>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        <NeedCard dot="#10b981" label="Agriculture Families" value={farm.length} hint={`${A.pct(farm.length, rows.length)}%`}
          onClick={() => open({ title: "Agriculture Families", families: farm })} />
        <NeedCard dot="#f59e0b" label="Non-Agriculture" value={rows.length - farm.length}
          onClick={() => open({ title: "Non-Agriculture Families", families: rows.filter((r) => !r.has_farmland) })} />
        <NeedCard dot="#2563eb" label="Total Land (acre)" value={totalLand} />
        <NeedCard dot="#8b5cf6" label="Average Landholding" value={farm.length ? (totalLand / farm.length).toFixed(2) : 0} />
        <NeedCard dot="#06b6d4" label="Irrigated Land" value={sum((r) => r.irrigated_area)} />
        <NeedCard dot="#ef4444" label="Dryland" value={sum((r) => r.dryland_area)} />
      </div>
      <G2>
        <Panel title="जमीन आकार / Landholding Distribution">
          <ChartBox h={230}>
            <DBar data={bands} color="#10b981"
              onSelect={(n) => open({ title: `Landholding — ${n}`, families: farm.filter((r) => A.landBand(A.num(r.total_farmland)) === n) })} />
          </ChartBox>
        </Panel>
        <Panel title="शेती प्रकार / Farming Type">
          <ChartBox h={230}><DBar horizontal color="#84cc16" data={farmingTypes} /></ChartBox>
        </Panel>
      </G2>
      <MiniTable title="Agriculture Report by Village" columns={[
        { key: "name", label: "Village" }, { key: "families", label: "Farm Families" }, { key: "land", label: "Land (acre)" },
        { key: "irr", label: "Irrigated" }, { key: "dry", label: "Dryland" },
      ]} rows={A.uniq(rows, (r) => A.txt(r.village)).map((v) => {
        const sub = farm.filter((r) => A.txt(r.village) === v);
        return {
          name: v, families: sub.length,
          land: Math.round(sub.reduce((a, r) => a + A.num(r.total_farmland), 0) * 10) / 10,
          irr: Math.round(sub.reduce((a, r) => a + A.num(r.irrigated_area), 0) * 10) / 10,
          dry: Math.round(sub.reduce((a, r) => a + A.num(r.dryland_area), 0) * 10) / 10,
        };
      })} />
    </SectionShell>
  );
}

/* ============================================================== 08 crops */

function Crops({ rows }: Ctx) {
  const { open } = useDrill();
  const farm = rows.filter((r) => r.has_farmland);
  const cropTypes = A.countMulti(farm, (r) => (Array.isArray(r.major_crop_types) ? r.major_crop_types : []));
  const cropNames = A.countMulti(farm, (r) => (Array.isArray(r.crops) ? r.crops.map((c: any) => A.txt(c?.name || c?.crop || c)) : []));
  const seasons = [
    { name: "खरीप / Kharif", key: "kharif_area" },
    { name: "रब्बी / Rabi", key: "rabi_area" },
    { name: "उन्हाळी / Summer", key: "summer_area" },
  ].map((s) => ({
    name: s.name,
    families: farm.filter((r) => A.num(r[s.key]) > 0).length,
    area: Math.round(farm.reduce((a, r) => a + A.num(r[s.key]), 0) * 10) / 10,
    key: s.key,
  }));

  const cropTable = cropNames.map((c) => {
    const fams = farm.filter((r) => (Array.isArray(r.crops) ? r.crops : []).some((x: any) => A.txt(x?.name || x?.crop || x) === c.name));
    return {
      name: c.name, families: fams.length,
      area: Math.round(fams.reduce((a, r) => a + A.num((r.crops || []).find((x: any) => A.txt(x?.name || x?.crop || x) === c.name)?.area), 0) * 10) / 10,
      villages: A.uniq(fams, (r) => A.txt(r.village)).length,
      irrigation: `${A.pct(fams.filter((r) => A.IRRIGATION_KEYS.some((k) => A.num(((r.irrigation_details || {}) as any)[k.key]?.count) > 0)).length, fams.length)}%`,
    };
  });

  return (
    <SectionShell id="crop" no="08" title="🌱 Crop Analytics" icon={Wheat} accent="lime"
      subtitle="Season-wise coverage, crop types and crop-level area / village analysis"
      tables={[
        { title: "Crop Season", columns: [{ key: "name", label: "Season" }, { key: "families", label: "Families" }, { key: "area", label: "Area" }], rows: seasons },
        { title: "Crop Type", columns: [{ key: "name", label: "Crop Type" }, { key: "value", label: "Families" }], rows: cropTypes },
        {
          title: "Crop Analysis", rows: cropTable, columns: [
            { key: "name", label: "Crop" }, { key: "families", label: "Families" }, { key: "area", label: "Area" },
            { key: "villages", label: "Villages" }, { key: "irrigation", label: "Irrigation" },
          ],
        },
      ]}>
      <G3>
        {seasons.map((s) => (
          <NeedCard key={s.key} dot="#84cc16" label={s.name} value={s.families} hint={`${s.area} एकर / acre`}
            onClick={() => open({ title: `${s.name} — Families`, families: farm.filter((r) => A.num(r[s.key]) > 0) })} />
        ))}
      </G3>
      <G2>
        <Panel title="मुख्य पीक प्रकार / Crop Types">
          <ChartBox h={230}><DBar horizontal color="#10b981" data={cropTypes} /></ChartBox>
        </Panel>
        <Panel title="हंगामनिहाय क्षेत्र / Season-wise Area">
          <ChartBox h={230}><DBar color="#f59e0b" data={seasons.map((s) => ({ name: s.name, value: s.area }))} /></ChartBox>
        </Panel>
      </G2>
      <MiniTable title="Crop Analysis Table" columns={[
        { key: "name", label: "Crop" }, { key: "families", label: "Families" }, { key: "area", label: "Area (acre)" },
        { key: "villages", label: "Villages" }, { key: "irrigation", label: "Irrigation %" },
      ]} rows={cropTable} />
    </SectionShell>
  );
}

/* ========================================================= 09 irrigation */

function Irrigation({ rows }: Ctx) {
  const { open } = useDrill();
  const farm = rows.filter((r) => r.has_farmland);
  const det = (r: A.Row, key: string) => ((r.irrigation_details || {}) as any)[key] || {};
  const irr = A.IRRIGATION_KEYS.map((k) => ({
    name: k.label,
    key: k.key,
    families: farm.filter((r) => A.num(det(r, k.key).count) > 0).length,
    count: farm.reduce((a, r) => a + A.num(det(r, k.key).count), 0),
    electric: farm.filter((r) => det(r, k.key).electric).length,
    solar: farm.filter((r) => det(r, k.key).solar).length,
  }));
  const cross = A.crossTab(farm, "irrigation", "crop_type");

  return (
    <SectionShell id="irrigation" no="09" title="💧 Irrigation Analytics" icon={Droplets} accent="cyan"
      subtitle="Sources, pump types and crop × irrigation matrix"
      tables={[{
        title: "Irrigation", rows: irr, columns: [
          { key: "name", label: "Source" }, { key: "families", label: "Families" }, { key: "count", label: "Units" },
          { key: "electric", label: "Electric" }, { key: "solar", label: "Solar" },
        ],
      }]}>
      <G2>
        <Panel title="सिंचन साधन / Irrigation Sources">
          <ChartBox h={240}>
            <DPie donut data={irr.map((i) => ({ name: i.name, value: i.families }))}
              onSelect={(n) => {
                const k = A.IRRIGATION_KEYS.find((x) => x.label === n);
                if (k) open({ title: `Irrigation — ${n}`, families: farm.filter((r) => A.num(det(r, k.key).count) > 0) });
              }} />
          </ChartBox>
        </Panel>
        <Panel title="पंप प्रकार / Pump Type">
          <ChartBox h={240}>
            <DBar color="#06b6d4" data={[
              { name: "इलेक्ट्रिक / Electric", value: irr.reduce((a, i) => a + i.electric, 0) },
              { name: "सोलर / Solar", value: irr.reduce((a, i) => a + i.solar, 0) },
            ]} />
          </ChartBox>
        </Panel>
      </G2>
      <Panel title="पीक × सिंचन / Crop × Irrigation Matrix">
        <ChartBox h={250}><DStack {...cross} /></ChartBox>
      </Panel>
      <MiniTable title="Irrigation Source Report" columns={[
        { key: "name", label: "Source" }, { key: "families", label: "Families" }, { key: "count", label: "Units" },
        { key: "electric", label: "Electric Pump" }, { key: "solar", label: "Solar Pump" },
      ]} rows={irr} />
    </SectionShell>
  );
}

/* ========================================================== 10 equipment */

function Equipment({ rows }: Ctx) {
  const { open } = useDrill();
  const tool = (r: A.Row, key: string) => ((r.farming_tools_details || {}) as any)[key] || {};
  const equip = A.TOOL_KEYS.map((k) => ({
    name: k.label, key: k.key,
    owned: rows.filter((r) => tool(r, k.key).has).length,
    qty: rows.reduce((a, r) => a + A.num(tool(r, k.key).count), 0),
    required: rows.filter((r) => tool(r, k.key).want_to_buy).length,
    loan: rows.filter((r) => tool(r, k.key).needs_loan).length,
  }));
  const needFamilies = rows.filter((r) => A.TOOL_KEYS.some((k) => tool(r, k.key).want_to_buy));

  return (
    <SectionShell id="equipment" no="10" title="🚜 Farming Equipment" icon={Tractor} accent="amber"
      subtitle="Owned vs required equipment with quantity and loan demand"
      tables={[{
        title: "Equipment", rows: equip, columns: [
          { key: "name", label: "Equipment" }, { key: "owned", label: "Owned" }, { key: "qty", label: "Quantity" },
          { key: "required", label: "Required" }, { key: "loan", label: "Loan Required" },
        ],
      }]}>
      <div className="grid grid-cols-2 gap-2">
        <NeedCard dot="#f59e0b" label="Total Farmers Requiring Equipment" value={needFamilies.length}
          onClick={() => open({ title: "Equipment Requirement", families: needFamilies })} />
        <NeedCard dot="#ef4444" label="Equipment Loan Required" value={equip.reduce((a, e) => a + e.loan, 0)}
          onClick={() => open({ title: "Equipment Loan Required", families: rows.filter((r) => A.TOOL_KEYS.some((k) => tool(r, k.key).needs_loan)) })} />
      </div>
      <Panel title="साधने — मालकी विरुद्ध मागणी / Owned vs Required">
        <ChartBox h={260}>
          <DStack columns={["Owned", "Required", "Loan"]}
            data={equip.map((e) => ({ name: e.name, Owned: e.owned, Required: e.required, Loan: e.loan }))}
            onSelect={(n) => {
              const k = A.TOOL_KEYS.find((x) => x.label === n);
              if (k) open({ title: `Equipment — ${n}`, families: rows.filter((r) => tool(r, k.key).has || tool(r, k.key).want_to_buy) });
            }} />
        </ChartBox>
      </Panel>
      <MiniTable title="Equipment Detail" columns={[
        { key: "name", label: "Equipment" }, { key: "owned", label: "Owned" }, { key: "qty", label: "Quantity" },
        { key: "required", label: "Required" }, { key: "loan", label: "Loan" },
      ]} rows={equip} />
    </SectionShell>
  );
}

/* ============================================================ 11 housing */

function Housing({ rows }: Ctx) {
  const { open } = useDrill();
  const own = rows.filter((r) => r.owns_house);
  const living = (k: string) => rows.filter((r) => A.txt(r.living_status).includes(k));
  const house = (k: string) => rows.filter((r) => A.txt(r.house_type).includes(k));
  const got = rows.filter((r) => r.gharkul_received);
  const want = rows.filter((r) => r.gharkul_wanted);
  const houseTypes = A.groupCount(rows.filter((r) => r.house_type), (r) => A.txt(r.house_type));

  return (
    <SectionShell id="housing" no="11" title="🏠 Housing Analytics" icon={Home} accent="violet"
      subtitle="Ownership, house type and Gharkul scheme status"
      tables={[
        { title: "House Type", columns: [{ key: "name", label: "House Type" }, { key: "value", label: "Families" }], rows: houseTypes },
        {
          title: "Housing by Village", columns: [
            { key: "name", label: "Village" }, { key: "own", label: "Own" }, { key: "kachcha", label: "Kachcha" },
            { key: "pakka", label: "Pakka" }, { key: "got", label: "Gharkul Received" }, { key: "need", label: "Gharkul Needed" },
          ],
          rows: A.uniq(rows, (r) => A.txt(r.village)).map((v) => {
            const sub = rows.filter((r) => A.txt(r.village) === v);
            return {
              name: v, own: sub.filter((r) => r.owns_house).length,
              kachcha: sub.filter((r) => A.txt(r.house_type).includes("कच्च") || A.txt(r.house_type).includes("माती")).length,
              pakka: sub.filter((r) => A.txt(r.house_type).includes("पक्क")).length,
              got: sub.filter((r) => r.gharkul_received).length, need: sub.filter((r) => r.gharkul_wanted).length,
            };
          }),
        },
      ]}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <NeedCard dot="#10b981" label="Own House" value={own.length} hint={`${A.pct(own.length, rows.length)}%`}
          onClick={() => open({ title: "Own House Families", families: own })} />
        <NeedCard dot="#f59e0b" label="Rented" value={living("भाड").length}
          onClick={() => open({ title: "Rented Families", families: living("भाड") })} />
        <NeedCard dot="#8b5cf6" label="Dependent" value={living("आश्रित").length}
          onClick={() => open({ title: "Dependent Families", families: living("आश्रित") })} />
        <NeedCard dot="#ef4444" label="Families Requiring Housing Assistance" value={want.length}
          onClick={() => open({ title: "Gharkul Required", families: want })} />
      </div>
      <G2>
        <Panel title="घर प्रकार / House Type">
          <ChartBox h={230}>
            <DPie data={[
              { name: "पक्के / Pakka", value: house("पक्क").length },
              { name: "कच्चे / Kachcha", value: house("कच्च").length + house("माती").length },
            ]} />
          </ChartBox>
        </Panel>
        <Panel title="घरकुल / Gharkul">
          <ChartBox h={230}>
            <DPie donut data={[
              { name: "मिळाले / Received", value: got.length },
              { name: "आवश्यक / Required", value: want.length },
              { name: "लागू नाही / N.A.", value: Math.max(0, rows.length - got.length - want.length) },
            ]} />
          </ChartBox>
        </Panel>
      </G2>
    </SectionShell>
  );
}

/* ============================================================= 12 assets */

function Assets({ rows }: Ctx) {
  const { open } = useDrill();
  const dynamicAssets = Array.from(new Set([
    ...A.ASSET_LIST,
    ...rows.flatMap((r) => (Array.isArray(r.household_items) ? r.household_items.map(A.txt) : [])),
  ])).filter(Boolean);
  const assets = dynamicAssets.map((a) => {
    const fams = rows.filter((r) => (r.household_items || []).includes(a));
    return {
      name: a, families: fams.length,
      qty: rows.reduce((s, r) => s + A.num((r.household_item_counts || {})[a]), 0),
      pct: `${A.pct(fams.length, rows.length)}%`,
    };
  }).sort((a, b) => b.families - a.families);

  return (
    <SectionShell id="assets" no="12" title="🏠 Household Assets" icon={Boxes} accent="blue"
      subtitle="Asset ownership matrix built dynamically from survey data"
      tables={[{
        title: "Assets", rows: assets, columns: [
          { key: "name", label: "Asset" }, { key: "families", label: "Families" },
          { key: "qty", label: "Quantity" }, { key: "pct", label: "Ownership %" },
        ],
      }]}>
      <Panel title="वस्तू मालकी / Asset Ownership">
        <ChartBox h={260}>
          <DBar horizontal color="#2563eb" data={assets.map((a) => ({ name: a.name, value: a.families }))}
            onSelect={(n) => open({ title: `Asset — ${n}`, families: rows.filter((r) => (r.household_items || []).includes(n)) })} />
        </ChartBox>
      </Panel>
      <MiniTable title="Asset Ownership Matrix" columns={[
        { key: "name", label: "Asset" }, { key: "families", label: "Families" },
        { key: "qty", label: "Quantity" }, { key: "pct", label: "Ownership %" },
      ]} rows={assets} />
    </SectionShell>
  );
}

/* ============================================================== 13 solar */

function Solar({ rows }: Ctx) {
  const { open } = useDrill();
  const installed = rows.filter((r) => r.solar_panel_installed);
  const want = rows.filter((r) => r.solar_panel_wanted);
  const pump = rows.filter((r) => A.IRRIGATION_KEYS.some((k) => ((r.irrigation_details || {}) as any)[k.key]?.solar));
  const byVillage = A.uniq(rows, (r) => A.txt(r.village)).map((v) => ({
    name: v,
    value: rows.filter((r) => A.txt(r.village) === v && r.solar_panel_wanted).length,
  })).filter((d) => d.value > 0);

  return (
    <SectionShell id="solar" no="13" title="☀️ Solar Analytics" icon={Sun} accent="amber"
      subtitle="Solar panel adoption, solar pumps and village-wise requirement"
      tables={[
        {
          title: "Solar Status", columns: [{ key: "name", label: "Status" }, { key: "value", label: "Families" }],
          rows: [
            { name: "Installed", value: installed.length },
            { name: "Not Installed", value: rows.length - installed.length - want.length },
            { name: "Required", value: want.length },
          ],
        },
        { title: "Village Requirement", columns: [{ key: "name", label: "Village" }, { key: "value", label: "Families" }], rows: byVillage },
      ]}>
      <G3>
        <NeedCard dot="#f59e0b" label="Solar Installed" value={`${installed.length} · ${A.pct(installed.length, rows.length)}%`}
          onClick={() => open({ title: "Solar Installed", families: installed })} />
        <NeedCard dot="#94a3b8" label="Not Installed" value={rows.length - installed.length} />
        <NeedCard dot="#10b981" label="Solar Required" value={want.length}
          onClick={() => open({ title: "Solar Required", families: want })} />
      </G3>
      <G2>
        <Panel title="सोलर स्थिती / Solar Status">
          <ChartBox h={230}>
            <DPie donut data={[
              { name: "बसवले / Installed", value: installed.length },
              { name: "नाही / Not Installed", value: Math.max(0, rows.length - installed.length - want.length) },
              { name: "आवश्यक / Required", value: want.length },
            ]} />
          </ChartBox>
        </Panel>
        <Panel title="गावनिहाय सोलर मागणी / Village-wise Requirement" hint={`${pump.length} solar pumps`}>
          <ChartBox h={230}>
            <DBar horizontal color="#f59e0b" data={byVillage}
              onSelect={(n) => open({ title: `Solar Requirement — ${n}`, families: want.filter((r) => A.txt(r.village) === n) })} />
          </ChartBox>
        </Panel>
      </G2>
    </SectionShell>
  );
}

/* =========================================================== 14 benefits */

function Benefits({ rows }: Ctx) {
  const { open } = useDrill();
  const b = (r: A.Row) => (r.benefits_info || {}) as any;
  const benef = rows.filter((r) => b(r).ladki_bahin);
  const regular = benef.filter((r) => b(r).ladki_bahin_regular);
  const reasons = A.countMulti(rows, (r) => {
    const x = b(r).ladki_bahin_reasons;
    return Array.isArray(x) ? x : x ? [String(x)] : [];
  });

  return (
    <SectionShell id="benefits" no="14" title="🎯 Government Benefits" icon={Target} accent="pink"
      subtitle="Ladki Bahin coverage, regularity and issue analysis"
      tables={[
        { title: "Issue Analysis", columns: [{ key: "name", label: "Issue" }, { key: "value", label: "Cases" }], rows: reasons },
        {
          title: "Ladki Bahin by Village",
          columns: [{ key: "name", label: "Village" }, { key: "families", label: "Families" }, { key: "benef", label: "Beneficiary" }, { key: "regular", label: "Regular" }, { key: "pct", label: "Coverage %" }],
          rows: A.uniq(rows, (r) => A.txt(r.village)).map((v) => {
            const sub = rows.filter((r) => A.txt(r.village) === v);
            const bf = sub.filter((r) => b(r).ladki_bahin).length;
            return { name: v, families: sub.length, benef: bf, regular: sub.filter((r) => b(r).ladki_bahin_regular).length, pct: A.pct(bf, sub.length) };
          }),
        },
      ]}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <NeedCard dot="#ec4899" label="Beneficiary Families" value={benef.length}
          onClick={() => open({ title: "Ladki Bahin Beneficiaries", families: benef })} />
        <NeedCard dot="#10b981" label="Regularly Receiving" value={regular.length}
          onClick={() => open({ title: "Regularly Receiving", families: regular })} />
        <NeedCard dot="#ef4444" label="Not Receiving Regularly" value={benef.length - regular.length}
          onClick={() => open({ title: "Irregular Benefit", families: benef.filter((r) => !b(r).ladki_bahin_regular) })} />
        <NeedCard dot="#f59e0b" label="Issue Cases" value={reasons.reduce((a, r) => a + r.value, 0)} />
      </div>
      <G2>
        <Panel title="लाभार्थी / Beneficiary Split">
          <ChartBox h={230}>
            <DPie donut data={[
              { name: "लाभार्थी / Beneficiary", value: benef.length },
              { name: "लाभार्थी नाही / Non-beneficiary", value: rows.filter((r) => b(r).ladki_bahin === false).length },
            ]} />
          </ChartBox>
        </Panel>
        <Panel title="अडचणी / Issue Analysis (KYC, Aadhaar, DBT…)">
          <ChartBox h={230}><DBar horizontal color="#ef4444" data={reasons} /></ChartBox>
        </Panel>
      </G2>
    </SectionShell>
  );
}

/* ============================================================ 15 medical */

function Medical({ rows }: Ctx) {
  const { open } = useDrill();
  const b = (r: A.Row) => (r.benefits_info || {}) as any;
  const ill = rows.filter((r) => b(r).critical_illness);
  const aid = rows.filter((r) => b(r).medical_aid_needed);
  const types = A.groupCount(ill.filter((r) => b(r).illness_type), (r) => A.txt(b(r).illness_type));
  const priority = [...ill, ...aid.filter((r) => !ill.includes(r))].map((r) => ({
    head: A.txt(r.head_name), village: A.txt(r.village), illness: A.txt(b(r).illness_type) || "—",
    aid: b(r).medical_aid_needed ? "आवश्यक / Required" : "—", mobile: A.txt(r.mobile), _row: r,
  }));

  return (
    <SectionShell id="medical" no="15" title="🏥 Medical Assistance" icon={HeartPulse} accent="red"
      subtitle="Critical illness families, illness distribution and priority assistance list"
      tables={[
        { title: "Illness Distribution", columns: [{ key: "name", label: "Illness" }, { key: "value", label: "Families" }], rows: types },
        {
          title: "Priority List", rows: priority, columns: [
            { key: "head", label: "Family" }, { key: "village", label: "Village" }, { key: "illness", label: "Illness" },
            { key: "aid", label: "Assistance" }, { key: "mobile", label: "Mobile" },
          ],
        },
      ]}>
      <G3>
        <NeedCard dot="#ef4444" label="Critical Illness Families" value={ill.length}
          onClick={() => open({ title: "Critical Illness Families", families: ill })} />
        <NeedCard dot="#f59e0b" label="Affected Members" value={A.allPersons(ill).length}
          onClick={() => open({ title: "Members in Affected Families", persons: A.allPersons(ill) })} />
        <NeedCard dot="#8b5cf6" label="Medical Assistance Required" value={aid.length}
          onClick={() => open({ title: "Medical Assistance Required", families: aid })} />
      </G3>
      <Panel title="आजाराचे वितरण / Illness Distribution">
        <ChartBox h={230}><DBar horizontal color="#ef4444" data={types} /></ChartBox>
      </Panel>
      <MiniTable title="Priority Assistance List" columns={[
        { key: "head", label: "Family" }, { key: "village", label: "Village" }, { key: "illness", label: "Illness" },
        { key: "aid", label: "Assistance" }, { key: "mobile", label: "Mobile" },
      ]} rows={priority} onRowClick={(r) => open({ title: `कुटुंब — ${r.head}`, families: [r._row] })} />
    </SectionShell>
  );
}

/* ============================================================= 16 sports */

function Sports({ rows }: Ctx) {
  const { open } = useDrill();
  const b = (r: A.Row) => (r.benefits_info || {}) as any;
  const sports = rows.filter((r) => b(r).has_sportsperson);
  const byType = A.groupCount(sports.filter((r) => b(r).sport_type), (r) => A.txt(b(r).sport_type));
  const byLevel = A.groupCount(sports.filter((r) => b(r).sport_level), (r) => A.txt(b(r).sport_level));
  const lvl = (k: string) => sports.filter((r) => A.txt(b(r).sport_level).includes(k)).length;

  return (
    <SectionShell id="sports" no="16" title="🏅 Sports Analytics" icon={Trophy} accent="lime"
      subtitle="Sportspersons by sport, level, gender and village"
      tables={[
        { title: "Sport Type", columns: [{ key: "name", label: "Sport" }, { key: "value", label: "Families" }], rows: byType },
        { title: "Sport Level", columns: [{ key: "name", label: "Level" }, { key: "value", label: "Families" }], rows: byLevel },
      ]}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <NeedCard dot="#84cc16" label="Total Sportspersons" value={sports.length}
          onClick={() => open({ title: "Sportsperson Families", families: sports })} />
        <NeedCard dot="#2563eb" label="State Level" value={lvl("राज्य")} />
        <NeedCard dot="#8b5cf6" label="National Level" value={lvl("राष्ट्रीय")} />
        <NeedCard dot="#f59e0b" label="International Level" value={lvl("आंतरराष्ट्रीय")} />
      </div>
      <G2>
        <Panel title="खेळ प्रकार / Sport Distribution">
          <ChartBox h={230}>
            <DBar horizontal color="#84cc16" data={byType}
              onSelect={(n) => open({ title: `Sport — ${n}`, families: sports.filter((r) => A.txt(b(r).sport_type) === n) })} />
          </ChartBox>
        </Panel>
        <Panel title="स्तर / Level">
          <ChartBox h={230}><DPie data={byLevel} /></ChartBox>
        </Panel>
      </G2>
      <MiniTable title="Sportsperson Detail" columns={[
        { key: "head", label: "Family" }, { key: "sport", label: "Sport" }, { key: "level", label: "Level" },
        { key: "village", label: "Village" }, { key: "district", label: "District" },
      ]} rows={sports.map((r) => ({
        head: A.txt(r.head_name), sport: A.txt(b(r).sport_type), level: A.txt(b(r).sport_level),
        village: A.txt(r.village), district: A.txt(r.district), _row: r,
      }))} onRowClick={(r) => open({ title: `कुटुंब — ${r.head}`, families: [r._row] })} />
    </SectionShell>
  );
}

/* ========================================================= 17 leadership */

function Leadership({ rows }: Ctx) {
  const { open } = useDrill();
  const pos = A.allPositions(rows);
  const t = (k: string) => pos.filter((p) => A.txt(p.type).includes(k)).length;
  const st = (k: string) => pos.filter((p) => A.txt(p.status).includes(k)).length;
  const levels = A.groupCount(pos.filter((p) => p.political_level), (p) => A.txt(p.political_level));
  const reps = A.groupCount(pos.filter((p) => p.representative_type), (p) => A.txt(p.representative_type));
  const detail = pos.map((p: any) => ({
    head: A.txt(p.row.head_name), type: A.txt(p.type), status: A.txt(p.status),
    level: A.txt(p.political_level), rep: A.txt(p.representative_type),
    party: A.txt(p.party_name_other) || A.txt(p.party_name),
    term: [p.term_from, p.term_to].filter(Boolean).join(" – "), village: A.txt(p.row.village), _row: p.row,
  }));

  return (
    <SectionShell id="leadership" no="17" title="🏛️ Political & Social Leadership" icon={Landmark} accent="violet"
      subtitle="Position type, current/former status, level and representative type"
      tables={[
        { title: "Levels", columns: [{ key: "name", label: "Level" }, { key: "value", label: "Positions" }], rows: levels },
        { title: "Representatives", columns: [{ key: "name", label: "Representative" }, { key: "value", label: "Positions" }], rows: reps },
        {
          title: "Leadership Detail", rows: detail, columns: [
            { key: "head", label: "Member Family" }, { key: "type", label: "Type" }, { key: "status", label: "Status" },
            { key: "level", label: "Level" }, { key: "rep", label: "Representative" }, { key: "party", label: "Party" },
            { key: "term", label: "Term" }, { key: "village", label: "Village" },
          ],
        },
      ]}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <NeedCard dot="#8b5cf6" label="Political" value={t("राजकीय")} />
        <NeedCard dot="#06b6d4" label="Social" value={t("सामाजिक")} />
        <NeedCard dot="#ec4899" label="Representative" value={t("लोकप्रतिनिधी")} />
        <NeedCard dot="#10b981" label="Current / Former" value={`${st("आजी")} / ${st("माजी")}`} />
      </div>
      <G2>
        <Panel title="स्तर / Level">
          <ChartBox h={230}><DBar color="#8b5cf6" data={levels} /></ChartBox>
        </Panel>
        <Panel title="लोकप्रतिनिधी प्रकार / Representative Type">
          <ChartBox h={230}><DBar horizontal color="#2563eb" data={reps} /></ChartBox>
        </Panel>
      </G2>
      <MiniTable title="Leadership Detail" columns={[
        { key: "head", label: "Family" }, { key: "type", label: "Type" }, { key: "status", label: "Status" },
        { key: "level", label: "Level" }, { key: "rep", label: "Representative" }, { key: "party", label: "Party" }, { key: "term", label: "Term" },
      ]} rows={detail} onRowClick={(r) => open({ title: `कुटुंब — ${r.head}`, families: [r._row] })} />
    </SectionShell>
  );
}

/* =========================================================== 18 business */

function BusinessSec({ rows, people }: Ctx) {
  const { open } = useDrill();
  const e = (r: A.Row) => (r.employment_info || {}) as any;
  const entrepreneurs = rows.filter((r) => e(r).has_entrepreneur);
  const side = rows.filter((r) => e(r).has_side_business);
  const loan = rows.filter((r) => e(r).needs_business_loan || e(r).loan_required);
  const selfEmp = people.filter((p) => A.occGroup(p.occupation) === "स्वरोजगार / Self Employed");
  const owners = people.filter((p) => A.occGroup(p.occupation) === "व्यवसाय / Business Owner");
  const types = A.groupCount(entrepreneurs, (r) => A.txt(e(r).entrepreneur_details) || "—");
  const loanTable = loan.map((r) => ({
    head: A.txt(r.head_name), business: A.txt(e(r).entrepreneur_details) || A.txt(e(r).side_business_details) || "—",
    amount: A.txt(e(r).loan_amount) || "—", purpose: A.txt(e(r).loan_purpose) || "—", village: A.txt(r.village), _row: r,
  }));

  return (
    <SectionShell id="business" no="18" title="🏪 Business & Entrepreneurship" icon={Store} accent="amber"
      subtitle="Entrepreneurs, business types and loan requirement analysis"
      tables={[
        { title: "Business Types", columns: [{ key: "name", label: "Business" }, { key: "value", label: "Families" }], rows: types },
        {
          title: "Loan Analysis", rows: loanTable, columns: [
            { key: "head", label: "Family" }, { key: "business", label: "Business Type" },
            { key: "amount", label: "Loan Amount" }, { key: "purpose", label: "Loan Purpose" }, { key: "village", label: "Village" },
          ],
        },
      ]}>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        <NeedCard dot="#f59e0b" label="Entrepreneurs" value={entrepreneurs.length}
          onClick={() => open({ title: "Entrepreneur Families", families: entrepreneurs })} />
        <NeedCard dot="#8b5cf6" label="Business Owners" value={owners.length}
          onClick={() => open({ title: "Business Owners", persons: owners })} />
        <NeedCard dot="#10b981" label="Self-employed" value={selfEmp.length}
          onClick={() => open({ title: "Self-employed Members", persons: selfEmp })} />
        <NeedCard dot="#06b6d4" label="Side Businesses" value={side.length}
          onClick={() => open({ title: "Side Business Families", families: side })} />
        <NeedCard dot="#ef4444" label="Loan Required" value={loan.length}
          onClick={() => open({ title: "Business Loan Required", families: loan })} />
      </div>
      <Panel title="व्यवसाय प्रकार / Business Distribution">
        <ChartBox h={240}><DBar horizontal color="#f59e0b" data={types} /></ChartBox>
      </Panel>
      <MiniTable title="Loan Analysis" columns={[
        { key: "head", label: "Family" }, { key: "business", label: "Business" }, { key: "amount", label: "Loan Amount" },
        { key: "purpose", label: "Purpose" }, { key: "village", label: "Village" },
      ]} rows={loanTable} onRowClick={(r) => open({ title: `कुटुंब — ${r.head}`, families: [r._row] })} />
    </SectionShell>
  );
}

/* ============================================================== 19 women */

function Women({ rows, people }: Ctx) {
  const { open } = useDrill();
  const women = people.filter((p) => p.gender === "स्त्री");
  const shg = (f: (g: any) => boolean) => women.filter((w) => w.bachat_gat && f(w.bachat_gat));
  const b = (r: A.Row) => (r.benefits_info || {}) as any;
  const items = [
    { name: "Total Female Members", value: women.length },
    { name: "Married Women", value: women.filter((w) => w.marital_status.includes("विवाहित") && !w.marital_status.includes("अविवाहित")).length },
    { name: "Unmarried Women", value: women.filter((w) => w.marital_status.includes("अविवाहित")).length },
    { name: "Bachat Gat Members", value: shg((g) => g.is_member).length },
    { name: "Interested in Bachat Gat", value: shg((g) => g.wants_to_join).length },
    { name: "Home / Rural Business", value: shg((g) => g.has_rural_home_business).length },
    { name: "Interested in Business", value: shg((g) => g.wants_to_start_business).length },
    { name: "Ladki Bahin Beneficiaries", value: rows.filter((r) => b(r).ladki_bahin).length },
  ];

  return (
    <SectionShell id="women" no="19" title="👩 Women Analytics" icon={UserRound} accent="pink"
      subtitle="Women overview, self-help group participation and entrepreneurship interest"
      tables={[{ title: "Women Overview", columns: [{ key: "name", label: "Metric" }, { key: "value", label: "Count" }], rows: items }]}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {items.map((i) => (
          <NeedCard key={i.name} dot="#ec4899" label={i.name} value={i.value}
            onClick={i.name === "Total Female Members" ? () => open({ title: "Female Members", persons: women }) : undefined} />
        ))}
      </div>
      <G2>
        <Panel title="महिला बचत गट / Self Help Group">
          <ChartBox h={230}>
            <DPie donut data={[
              { name: "सदस्य / Member", value: shg((g) => g.is_member).length },
              { name: "सहभागी होऊ इच्छिते / Interested", value: shg((g) => g.wants_to_join).length },
              { name: "इतर / Other", value: Math.max(0, women.length - shg((g) => g.is_member).length - shg((g) => g.wants_to_join).length) },
            ]} />
          </ChartBox>
        </Panel>
        <Panel title="महिला शिक्षण / Women by Education">
          <ChartBox h={230}>
            <DBar horizontal color="#ec4899" data={A.groupCount(women.filter((w) => w.education) as any, (w: any) => A.eduLevel(w.education))}
              onSelect={(n) => open({ title: `Women — ${n}`, persons: women.filter((w) => A.eduLevel(w.education) === n) })} />
          </ChartBox>
        </Panel>
      </G2>
    </SectionShell>
  );
}

/* ==================================================== 20 human resources */

function HumanResources({ rows, people }: Ctx) {
  const { open } = useDrill();
  const prof = A.PROFESSIONS.map((p) => ({ name: p.name, value: people.filter((x) => p.match(x.occupation)).length })).filter((d) => d.value > 0);
  const directory = people.map((p) => ({ p, prof: A.professionOf(p.occupation) })).filter((x) => x.prof);

  return (
    <SectionShell id="hr" no="20" title="👨‍💼 Community Human Resources" icon={BriefcaseBusiness} accent="blue"
      subtitle="Community talent strength — Profession → District → Taluka → Village → Member"
      tables={[
        { title: "Professionals", columns: [{ key: "name", label: "Profession" }, { key: "value", label: "Members" }], rows: prof },
        {
          title: "Directory", rows: directory.map(({ p, prof: pr }) => ({
            name: p.name, prof: pr, edu: p.education, age: p.age ?? "—", village: A.txt(p.row.village), district: A.txt(p.row.district),
          })), columns: [
            { key: "name", label: "Name" }, { key: "prof", label: "Profession" }, { key: "edu", label: "Education" },
            { key: "age", label: "Age" }, { key: "village", label: "Village" }, { key: "district", label: "District" },
          ],
        },
      ]}>
      <Panel title="व्यावसायिक शक्ती / Professional Strength">
        <StatBars items={prof} onSelect={(n) => {
          const def = A.PROFESSIONS.find((p) => p.name === n);
          if (def) open({ title: `Professionals — ${n}`, persons: people.filter((x) => def.match(x.occupation)) });
        }} />
      </Panel>
      <Panel title="व्यवसाय × जिल्हा / Profession × District">
        <ChartBox h={250}><DStack {...A.crossTab(rows, "district", "occupation")} /></ChartBox>
      </Panel>
    </SectionShell>
  );
}

/* ============================================================== 21 needs */

function Needs({ rows }: Ctx) {
  const { open } = useDrill();
  const b = (r: A.Row) => (r.benefits_info || {}) as any;
  const e = (r: A.Row) => (r.employment_info || {}) as any;
  const tool = (r: A.Row, key: string) => ((r.farming_tools_details || {}) as any)[key] || {};
  const cards = [
    { dot: "#ef4444", label: "🔴 Medical Assistance Required", set: rows.filter((r) => b(r).medical_aid_needed) },
    { dot: "#f97316", label: "🟠 Gharkul Required", set: rows.filter((r) => r.gharkul_wanted) },
    { dot: "#eab308", label: "🟡 Solar Required", set: rows.filter((r) => r.solar_panel_wanted) },
    { dot: "#22c55e", label: "🟢 Agricultural Equipment Required", set: rows.filter((r) => A.TOOL_KEYS.some((k) => tool(r, k.key).want_to_buy)) },
    { dot: "#3b82f6", label: "🔵 Agricultural Loan Required", set: rows.filter((r) => A.TOOL_KEYS.some((k) => tool(r, k.key).needs_loan)) },
    { dot: "#a855f7", label: "🟣 Business Loan Required", set: rows.filter((r) => e(r).needs_business_loan || e(r).loan_required) },
  ];

  return (
    <SectionShell id="needs" no="21" title="🤝 Community Needs Dashboard" icon={HandHeart} accent="red"
      subtitle="Action-oriented priority requirements — click any card for the family list"
      tables={[{
        title: "Needs", columns: [{ key: "name", label: "Requirement" }, { key: "value", label: "Families" }],
        rows: cards.map((c) => ({ name: c.label, value: c.set.length })),
      }]}>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {cards.map((c) => (
          <NeedCard key={c.label} dot={c.dot} label={c.label} value={c.set.length}
            hint={`${A.pct(c.set.length, rows.length)}% of families`}
            onClick={() => open({ title: c.label, families: c.set })} />
        ))}
      </div>
      <Panel title="गरजांचे वितरण / Need Distribution">
        <ChartBox h={240}>
          <DBar horizontal color="#ef4444" data={cards.map((c) => ({ name: c.label.replace(/^\W+\s/, ""), value: c.set.length }))} />
        </ChartBox>
      </Panel>
    </SectionShell>
  );
}

/* =================================================== 22 user performance */

function UserPerformance({ rows, appUsers }: Ctx) {
  const { open } = useDrill();
  const byUser = (appUsers.length ? appUsers : [...new Set(rows.map((r) => r.created_by))].map((id) => ({ id, full_name: "Survey User", email: String(id).slice(0, 8) }))).map((u: any) => {
    const sub = rows.filter((r) => r.created_by === u.id);
    return {
      name: u.full_name || u.email, surveys: sub.length, families: sub.length,
      members: A.allPersons(sub).length, villages: A.uniq(sub, (r) => A.txt(r.village)).length,
      last: sub[0] ? new Date(sub[0].created_at).toLocaleDateString("en-GB") : "—",
      completion: `${A.pct(sub.filter((r) => r.head_name && r.mobile && r.village && r.education).length, sub.length)}%`,
      _rows: sub,
    };
  }).sort((a, b) => b.surveys - a.surveys).map((u, i) => ({ rank: i + 1, ...u }));

  const now = new Date(); const day = new Date(now); day.setHours(0, 0, 0, 0);
  const week = new Date(day); week.setDate(week.getDate() - 6);
  const month = new Date(day); month.setDate(month.getDate() - 29);
  const since = (d: Date) => rows.filter((r) => new Date(r.created_at) >= d).length;

  return (
    <SectionShell id="users" no="22" title="👤 Survey User Performance" icon={UserCog} accent="cyan"
      subtitle="Leaderboard, coverage and daily / weekly / monthly submissions"
      tables={[{
        title: "Leaderboard", rows: byUser, columns: [
          { key: "rank", label: "Rank" }, { key: "name", label: "Survey User" }, { key: "surveys", label: "Surveys" },
          { key: "families", label: "Families" }, { key: "members", label: "Members" }, { key: "villages", label: "Villages" },
          { key: "completion", label: "Completion %" }, { key: "last", label: "Last Submission" },
        ],
      }]}>
      <G3>
        <NeedCard dot="#2563eb" label="Daily Submissions" value={since(day)} />
        <NeedCard dot="#10b981" label="Weekly Submissions" value={since(week)} />
        <NeedCard dot="#8b5cf6" label="Monthly Submissions" value={since(month)} />
      </G3>
      <Panel title="User-wise Survey Count">
        <ChartBox h={240}>
          <DBar horizontal color="#06b6d4" data={byUser.filter((u) => u.surveys > 0).map((u) => ({ name: u.name, value: u.surveys }))}
            onSelect={(n) => {
              const u = byUser.find((x) => x.name === n);
              if (u) open({ title: `Surveys by ${n}`, families: u._rows });
            }} />
        </ChartBox>
      </Panel>
      <MiniTable title="Survey User Leaderboard" columns={[
        { key: "rank", label: "#" }, { key: "name", label: "Survey User" }, { key: "surveys", label: "Surveys" },
        { key: "members", label: "Members" }, { key: "villages", label: "Villages" },
        { key: "completion", label: "Completion" }, { key: "last", label: "Last" },
      ]} rows={byUser} onRowClick={(u) => open({ title: `Surveys by ${u.name}`, families: u._rows })} />
    </SectionShell>
  );
}

/* =========================================================== 23 progress */

function ProgressSec({ rows, allRows }: Ctx) {
  const [range, setRange] = useState("30");
  const [target, setTarget] = useState("10000");
  const days = Number(range);
  const data = A.trend(rows, days);
  const t = Math.max(1, Number(target) || 0);
  const done = allRows.length;
  const remaining = Math.max(0, t - done);

  return (
    <SectionShell id="progress" no="23" title="📈 Survey Progress" icon={TrendingUp} accent="green"
      subtitle="Submission trend and target vs achievement"
      tables={[{ title: "Daily Submissions", columns: [{ key: "name", label: "Date" }, { key: "value", label: "Surveys" }], rows: [...data].reverse() }]}>
      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1">
          <div className="text-[10px] text-muted-foreground">Range</div>
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1" className="text-xs">Today</SelectItem>
              <SelectItem value="2" className="text-xs">Yesterday</SelectItem>
              <SelectItem value="7" className="text-xs">This Week</SelectItem>
              <SelectItem value="30" className="text-xs">This Month</SelectItem>
              <SelectItem value="90" className="text-xs">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <div className="text-[10px] text-muted-foreground">Target</div>
          <Input value={target} onChange={(e) => setTarget(e.target.value)} className="h-8 w-28 text-xs" />
        </div>
      </div>
      <Panel title="सर्वेक्षण कल / Submission Trend">
        <ChartBox h={240}><DLine data={data} /></ChartBox>
      </Panel>
      <Panel title="Target vs Achievement">
        <div className="space-y-3">
          {[
            { label: "Target", value: t, color: "#94a3b8" },
            { label: "Completed", value: done, color: "#10b981" },
            { label: "Remaining", value: remaining, color: "#f59e0b" },
          ].map((x) => (
            <div key={x.label}>
              <div className="flex justify-between text-[11px] mb-1"><span>{x.label}</span><span className="tabular-nums font-medium">{x.value}</span></div>
              <Progress value={(x.value / t) * 100} className="h-2.5" />
            </div>
          ))}
          <div className="text-[11px] text-muted-foreground">Achievement: {A.pct(done, t)}%</div>
        </div>
      </Panel>
    </SectionShell>
  );
}

/* ============================================================ 24 quality */

function Quality({ rows }: Ctx) {
  const { open } = useDrill();
  const c = A.completeness(rows);
  const missing = (f: (r: A.Row) => any) => rows.filter((r) => {
    const v = f(r);
    return v === null || v === undefined || v === "" || (Array.isArray(v) && !v.length);
  });
  const complete = rows.filter((r) => r.head_name && r.village && r.mobile && r.district && r.taluka);
  const cards = [
    { label: "Complete Records", set: complete, dot: "#10b981" },
    { label: "Incomplete Records", set: rows.filter((r) => !complete.includes(r)), dot: "#f59e0b" },
    { label: "Missing Mobile", set: missing((r) => r.mobile), dot: "#ef4444" },
    { label: "Missing Pincode", set: missing((r) => r.pincode), dot: "#06b6d4" },
    { label: "Missing Education", set: missing((r) => r.education), dot: "#8b5cf6" },
    { label: "Missing Occupation", set: missing((r) => r.occupation), dot: "#ec4899" },
    { label: "Missing Agriculture Data", set: missing((r) => r.has_farmland), dot: "#84cc16" },
    { label: "Missing Family Details", set: rows.filter((r) => !Array.isArray(r.members) || !r.members.length), dot: "#f97316" },
  ];

  return (
    <SectionShell id="quality" no="24" title="✅ Data Quality" icon={CheckCircle2} accent="green"
      subtitle={`Duplicate records: ${A.duplicates(rows)} · Overall data quality ${c.overall}%`}
      tables={[
        { title: "Quality Cards", columns: [{ key: "name", label: "Metric" }, { key: "value", label: "Records" }], rows: cards.map((x) => ({ name: x.label, value: x.set.length })) },
        { title: "Section Completion", columns: [{ key: "name", label: "Section" }, { key: "value", label: "Completion %" }], rows: c.per },
      ]}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {cards.map((x) => (
          <NeedCard key={x.label} dot={x.dot} label={x.label} value={x.set.length}
            onClick={() => open({ title: x.label, families: x.set })} />
        ))}
      </div>
      <Panel title="Overall Data Quality" hint={`${c.overall}%`}>
        <Progress value={c.overall} className="h-3" />
      </Panel>
      <Panel title="विभागनिहाय पूर्णता / Section-wise Completion">
        <StatBars items={c.per} total={100} />
      </Panel>
    </SectionShell>
  );
}

/* ====================================================== 25 cross analytics */

function CrossAnalytics({ rows }: Ctx) {
  const { open } = useDrill();
  const [d1, setD1] = useState("district");
  const [d2, setD2] = useState("occupation");
  const [metric, setMetric] = useState<"count" | "share">("count");
  const [applied, setApplied] = useState({ d1: "district", d2: "occupation" });

  const res = useMemo(() => A.crossTab(rows, applied.d1, applied.d2), [rows, applied]);
  const label = (id: string) => A.DIMENSIONS.find((d) => d.id === id)?.label ?? id;
  const grand = res.data.reduce((a, r) => a + r.total, 0);
  const chartData = metric === "count"
    ? res.data
    : res.data.map((row) => {
      const r = row as any;
      return { ...r, ...res.columns.reduce<Record<string, number>>((a, c) => ((a[c] = r.total ? Math.round((A.num(r[c]) / r.total) * 1000) / 10 : 0), a), {}) };
    });

  return (
    <SectionShell id="cross" no="25" title="🔄 Advanced Cross Analytics" icon={Shuffle} accent="violet"
      subtitle="Compare any two dimensions — chart, summary cards, data table, percentage and ranking"
      tables={[{
        title: `${label(applied.d1)} x ${label(applied.d2)}`,
        columns: [{ key: "name", label: label(applied.d1) }, { key: "total", label: "Total" }, ...res.columns.map((c) => ({ key: c, label: c }))],
        rows: res.data,
      }]}>
      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1">
          <div className="text-[10px] text-muted-foreground">SELECT DIMENSION 1</div>
          <Select value={d1} onValueChange={setD1}>
            <SelectTrigger className="h-8 w-52 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>{A.DIMENSIONS.map((d) => <SelectItem key={d.id} value={d.id} className="text-xs">{d.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <div className="text-[10px] text-muted-foreground">SELECT DIMENSION 2</div>
          <Select value={d2} onValueChange={setD2}>
            <SelectTrigger className="h-8 w-52 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>{A.DIMENSIONS.map((d) => <SelectItem key={d.id} value={d.id} className="text-xs">{d.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <div className="text-[10px] text-muted-foreground">SELECT METRIC</div>
          <Select value={metric} onValueChange={(v) => setMetric(v as any)}>
            <SelectTrigger className="h-8 w-44 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="count" className="text-xs">Count ({res.unit})</SelectItem>
              <SelectItem value="share" className="text-xs">Percentage share (%)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" className="h-8 text-xs" onClick={() => setApplied({ d1, d2 })}>GENERATE ANALYTICS</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <NeedCard dot="#8b5cf6" label={`${label(applied.d1)} values`} value={res.data.length} />
        <NeedCard dot="#2563eb" label={`${label(applied.d2)} values`} value={res.columns.length} />
        <NeedCard dot="#10b981" label={`Total ${res.unit}`} value={grand} />
        <NeedCard dot="#f59e0b" label="Top ranking" value={res.data[0]?.name ?? "—"} hint={`${res.data[0]?.total ?? 0}`} />
      </div>

      <Panel title={`${label(applied.d1)} × ${label(applied.d2)}`} hint={metric === "count" ? res.unit : "%"}>
        <ChartBox h={320}>
          <DStack data={chartData} columns={res.columns}
            onSelect={(n) => {
              const dim = A.DIMENSIONS.find((d) => d.id === applied.d1)!;
              if (dim.level === "family") open({ title: `${label(applied.d1)} — ${n}`, families: rows.filter((r) => dim.get(r) === n) });
              else open({ title: `${label(applied.d1)} — ${n}`, persons: A.allPersons(rows).filter((p) => dim.get(p) === n) });
            }} />
        </ChartBox>
      </Panel>

      <MiniTable title="Cross Analytics Table (with ranking & %)"
        columns={[
          { key: "rank", label: "#" }, { key: "name", label: label(applied.d1) }, { key: "total", label: "Total" },
          { key: "share", label: "Share %" }, ...res.columns.map((c) => ({ key: c, label: c })),
        ]}
        rows={res.data.map((r, i) => ({ rank: i + 1, ...r, share: `${A.pct(r.total, grand)}%` }))}
      />
    </SectionShell>
  );
}
