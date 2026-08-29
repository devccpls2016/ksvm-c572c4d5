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
  Kpi, KpiGrid, ChartCard, BarCh, PieCh, LineCh, StackedBar, DataTable, GroupedBar,
  SectionHeader, CompletionList, Empty,
} from "@/components/analytics/AnalyticsUI";
import * as A from "@/lib/analytics";
import { SurveyFilterPanel } from "@/components/SurveyFilterPanel";
import { countActive, emptyFilters, matchSurvey, type SurveyFilters } from "@/lib/survey-filters";
import {
  LayoutDashboard, MapPin, Users, GraduationCap, Briefcase, Sprout, Droplets,
  Tractor, Home, Package, Sun, Target, HeartPulse, Trophy, Landmark, Store,
  UserRound, BriefcaseBusiness, HandHeart, UserCog, TrendingUp, CheckCircle2,
  Shuffle, Table2, RotateCcw, Filter, ChevronDown, CalendarRange, Gauge,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard5")({
  component: Dashboard5,
  head: () => ({
    meta: [
      { title: "कोहळी समाज माहिती व विश्लेषण — Kohali Samaj Information & Analytics" },
      { name: "description", content: "कोहळी समाज विकास मंडळ, नागपूर — कुटुंब सर्वेक्षण माहिती व विश्लेषण डॅशबोर्ड." },
      { property: "og:title", content: "कोहळी समाज माहिती व विश्लेषण — Kohali Samaj Information & Analytics" },
      { property: "og:description", content: "Community family survey information and analytics dashboard for Kohali Samaj." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const SECTIONS = [
  { id: "overview", no: "01", label: "Overview", icon: LayoutDashboard },
  { id: "geo", no: "02", label: "Geographic Analytics", icon: MapPin },
  { id: "family", no: "03", label: "Family & Demographics", icon: Users },
  { id: "education", no: "04", label: "Education Analytics", icon: GraduationCap },
  { id: "occupation", no: "05", label: "Occupation & Employment", icon: Briefcase },
  { id: "agri", no: "06", label: "Agriculture Analytics", icon: Sprout },
  { id: "crop", no: "07", label: "Crop & Irrigation", icon: Droplets },
  { id: "equipment", no: "08", label: "Farming Equipment", icon: Tractor },
  { id: "housing", no: "09", label: "Housing Analytics", icon: Home },
  { id: "assets", no: "10", label: "Household Assets & Solar", icon: Package },
  { id: "benefits", no: "11", label: "Benefits & Assistance", icon: Target },
  { id: "medical", no: "12", label: "Medical & Health", icon: HeartPulse },
  { id: "sports", no: "13", label: "Sports Analytics", icon: Trophy },
  { id: "leadership", no: "14", label: "Political & Social Leadership", icon: Landmark },
  { id: "business", no: "15", label: "Business & Entrepreneurship", icon: Store },
  { id: "women", no: "16", label: "Women & Family", icon: UserRound },
  { id: "hr", no: "17", label: "Community Human Resources", icon: BriefcaseBusiness },
  { id: "needs", no: "18", label: "Community Needs", icon: HandHeart },
  { id: "users", no: "19", label: "Survey User Performance", icon: UserCog },
  { id: "progress", no: "20", label: "Survey Progress", icon: TrendingUp },
  { id: "quality", no: "21", label: "Data Quality", icon: CheckCircle2 },
  { id: "cross", no: "22", label: "Cross Analytics", icon: Shuffle },
  { id: "reports", no: "23", label: "Detailed Reports", icon: Table2 },
];

/** which filter groups are relevant to each analytics section */
const SECTION_FILTERS: Record<string, string[]> = {
  overview: ["loc", "fam"],
  geo: ["loc", "fam"],
  family: ["loc", "fam"],
  education: ["loc", "edu", "fam"],
  occupation: ["loc", "occ", "fam"],
  agri: ["loc", "agri"],
  crop: ["loc", "agri"],
  equipment: ["loc", "agri"],
  housing: ["loc", "house"],
  assets: ["loc", "house"],
  benefits: ["loc", "ben", "fam"],
  medical: ["loc", "ben"],
  sports: ["loc", "ben"],
  leadership: ["loc", "pos"],
  business: ["loc", "biz", "occ"],
  women: ["loc", "fam", "ben"],
  hr: ["loc", "occ", "edu"],
  needs: ["loc", "biz", "house", "agri"],
  users: ["loc"],
  progress: ["loc"],
  quality: ["loc", "fam"],
  cross: ["loc", "fam", "edu", "occ", "agri", "house", "ben", "pos", "biz"],
  reports: ["loc", "fam", "edu", "occ", "agri", "house", "ben", "pos", "biz"],
};

function Dashboard5() {
  const { role, user } = useAuth();
  const isAdmin = role === "admin";
  const [all, setAll] = useState<A.Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [appUsers, setAppUsers] = useState<any[]>([]);
  const fetchUsers = useServerFn(listAppUsers);

  const [section, setSection] = useState("overview");
  const [filters, setFilters] = useState<SurveyFilters>({ ...emptyFilters });

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

  const rows = useMemo(() => scoped.filter((r) => matchSurvey(r, filters)), [scoped, filters]);

  const people = useMemo(() => A.allPersons(rows), [rows]);

  const head = useMemo(() => {
    const families = rows.length;
    const members = people.length;
    const gender = (g: string) => people.filter((p) => (p.gender || "").includes(g)).length;
    const marital = (m: string) => people.filter((p) => (p.marital_status || "").includes(m)).length;
    const marriage = (m: string) => people.filter((p) => (p.marriage_type || "").includes(m)).length;
    const uniqCount = (get: (r: A.Row) => string) =>
      new Set(rows.map(get).map((v) => A.txt(v)).filter(Boolean)).size;
    const userScope = (s: string) => appUsers.filter((u) => u.access_scope === s).length;
    return {
      families,
      members,
      avgSize: families ? (members / families).toFixed(1) : "0",
      states: new Set(rows.map((r) => A.stateOf(r)).filter(Boolean)).size,
      districts: uniqCount((r) => r.district),
      talukas: uniqCount((r) => r.taluka),
      villages: uniqCount((r) => r.village),
      users: appUsers.length,
      uDistrict: userScope("district"),
      uTaluka: userScope("taluka"),
      uVillage: userScope("village"),
      male: gender("पुरुष"),
      female: gender("स्त्री"),
      other: people.filter((p) => p.gender && !p.gender.includes("पुरुष") && !p.gender.includes("स्त्री")).length,
      married: marital("विवाहित") - marital("अविवाहित"),
      unmarried: marital("अविवाहित"),
      widow: marital("विधवा") + marital("विधुर"),
      divorced: marital("घटस्फोट"),
      sameCaste: marriage("जातीय") - marriage("आंतरजातीय"),
      interCaste: marriage("आंतरजातीय"),
    };
  }, [rows, people, appUsers]);

  if (loading) return <div className="text-muted-foreground">लोड होत आहे...</div>;

  const sectionGroups = SECTION_FILTERS[section] ?? ["loc"];
  const sectionMeta = SECTIONS.find((s) => s.id === section)!;

  const ctx: Ctx = { rows, people, appUsers, isAdmin };

  return (
    <div className="space-y-4">
      <Card className="border-primary/40 bg-gradient-to-r from-primary/10 via-background to-primary/5">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shrink-0 shadow-sm">
              <Gauge className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                कोहळी समाज माहिती व विश्लेषण
              </h1>
              <p className="text-sm text-muted-foreground">
                Kohali Samaj Information & Analytics — कोहळी समाज विकास मंडळ, नागपूर
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <KpiGrid>
        <Kpi icon={Table2} label="Total Survey Submitted" value={head.families} />
        <Kpi icon={Home} tone="green" label="Total Families" value={head.families} />
        <Kpi icon={Users} tone="violet" label="Total Family Members" value={head.members} />
        <Kpi icon={Users} tone="amber" label="Average Family Size" value={head.avgSize} />

        <Kpi icon={MapPin} label="States Covered" value={head.states} />
        <Kpi icon={MapPin} tone="green" label="Districts Covered" value={head.districts} />
        <Kpi icon={MapPin} tone="violet" label="Talukas Covered" value={head.talukas} />
        <Kpi icon={MapPin} tone="amber" label="Villages Covered" value={head.villages} />

        <Kpi icon={UserCog} label="Total Survey Users" value={head.users} />
        <Kpi icon={UserCog} tone="green" label="Districts Survey Users" value={head.uDistrict} />
        <Kpi icon={UserCog} tone="violet" label="Talukas Survey Users" value={head.uTaluka} />
        <Kpi icon={UserCog} tone="amber" label="Villages Survey Users" value={head.uVillage} />

        <Kpi icon={UserRound} label="Total Male" value={head.male} />
        <Kpi icon={UserRound} tone="pink" label="Total Female" value={head.female} />
        <Kpi icon={UserRound} tone="cyan" label="Other Gender" value={head.other} />
        <Kpi icon={HandHeart} tone="green" label="Married Members" value={head.married} />
        <Kpi icon={HandHeart} tone="amber" label="Unmarried Members" value={head.unmarried} />
        <Kpi icon={HandHeart} tone="violet" label="Widow Members" value={head.widow} />
        <Kpi icon={HandHeart} tone="red" label="Divorced Members" value={head.divorced} />

        <Kpi icon={Shuffle} tone="lime" label="Same-caste Marriage" value={head.sameCaste} />
        <Kpi icon={Shuffle} tone="cyan" label="Inter-caste Marriage" value={head.interCaste} />
      </KpiGrid>

      <div className="grid lg:grid-cols-[240px_1fr] gap-4">
        {/* Section nav */}
        <Card className="lg:sticky lg:top-16 h-max print:hidden">
          <CardContent className="p-2">
            <div className="lg:hidden">
              <Select value={section} onValueChange={setSection}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SECTIONS.map((s) => <SelectItem key={s.id} value={s.id} className="text-xs">{s.no} · {s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <nav className="hidden lg:flex flex-col gap-0.5 max-h-[70vh] overflow-y-auto">
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
          {section !== "overview" && (
            <Card className="print:hidden border-primary/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <sectionMeta.icon className="h-4 w-4 text-primary" />
                  {section === "assets" ? "" : `${sectionMeta.no}. `}{sectionMeta.label} — विभागनिहाय फिल्टर / Section filters
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <SurveyFilterPanel
                  rows={scoped}
                  filters={filters}
                  onChange={setFilters}
                  only={sectionGroups}
                  title="या विभागाचे फिल्टर"
                />
              </CardContent>
            </Card>
          )}
          <Section id={section} ctx={ctx} />
        </div>
      </div>
    </div>
  );
}

type Ctx = { rows: A.Row[]; people: A.Person[]; appUsers: any[]; isAdmin: boolean };

const G = ({ children }: { children: React.ReactNode }) => (
  <div className="grid md:grid-cols-2 gap-3">{children}</div>
);

function Section({ id, ctx }: { id: string; ctx: Ctx }) {
  const meta = SECTIONS.find((s) => s.id === id)!;
  const body = (() => {
    switch (id) {
      case "overview": return <Overview {...ctx} />;
      case "geo": return <Geographic {...ctx} />;
      case "family": return <Family {...ctx} />;
      case "education": return <Education {...ctx} />;
      case "occupation": return <Occupation {...ctx} />;
      case "agri": return <Agriculture {...ctx} />;
      case "crop": return <CropIrrigation {...ctx} />;
      case "equipment": return <Equipment {...ctx} />;
      case "housing": return <Housing {...ctx} />;
      case "assets": return <Assets {...ctx} />;
      case "benefits": return <Benefits {...ctx} />;
      case "medical": return <Medical {...ctx} />;
      case "sports": return <Sports {...ctx} />;
      case "leadership": return <Leadership {...ctx} />;
      case "business": return <BusinessSec {...ctx} />;
      case "women": return <Women {...ctx} />;
      case "hr": return <HumanResources {...ctx} />;
      case "needs": return <Needs {...ctx} />;
      case "users": return <SurveyUsers {...ctx} />;
      case "progress": return <ProgressSec {...ctx} />;
      case "quality": return <Quality {...ctx} />;
      case "cross": return <CrossAnalytics {...ctx} />;
      default: return <Reports {...ctx} />;
    }
  })();
  return (
    <div className="space-y-4">
      <SectionHeader title={`${meta.no}. ${meta.label}`} icon={meta.icon} subtitle="Filters above apply to every chart and report in this section." />
      {body}
    </div>
  );
}

/* ============================================================ 01 Overview */

function Overview({ rows, people }: Ctx) {
  const male = people.filter((p) => p.gender === "पुरुष").length;
  const female = people.filter((p) => p.gender === "स्त्री").length;
  const other = people.filter((p) => p.gender && p.gender !== "पुरुष" && p.gender !== "स्त्री").length;
  const ages = people.map((p) => p.age).filter((a): a is number => typeof a === "number");

  return (
    <div className="space-y-4">
      <G>
        <ChartCard title="लिंग वितरण / Gender Distribution">
          <PieCh donut data={[{ name: "पुरुष", value: male }, { name: "स्त्री", value: female }, { name: "इतर", value: other }]} />
        </ChartCard>
        <ChartCard title="वयोगट वितरण / Age Group Distribution">
          <BarCh data={A.AGE_BANDS.map((b) => ({ name: b.name, value: ages.filter(b.test).length }))} />
        </ChartCard>
        <ChartCard title="जिल्हानिहाय कुटुंबे / Families by District">
          <BarCh data={A.groupCount(rows, (r) => A.txt(r.district))} color="#10b981" />
        </ChartCard>
        <ChartCard title="गावनिहाय कुटुंबे / Families by Village">
          <BarCh horizontal data={A.groupCount(rows, (r) => A.txt(r.village))} color="#f59e0b" />
        </ChartCard>
      </G>
    </div>
  );
}

/* ========================================================== 02 Geographic */

function Geographic({ rows }: Ctx) {
  const states = A.locationRollup(rows, (r) => A.stateOf(r));
  const districts = A.locationRollup(rows, (r) => A.txt(r.district));
  const talukas = A.locationRollup(rows, (r) => A.txt(r.taluka));
  const villages = A.locationRollup(rows, (r) => A.txt(r.village));
  const villagesDrill = A.locationRollup(rows, (r) => `${A.txt(r.district)} › ${A.txt(r.taluka)} › ${A.txt(r.village)}`);
  const pincodes = A.groupCount(rows, (r) => A.txt(r.pincode));

  const cols = [
    { key: "name", label: "Name" }, { key: "families", label: "Families" },
    { key: "members", label: "Members" }, { key: "male", label: "Male" },
    { key: "female", label: "Female" }, { key: "pctOfTotal", label: "Survey %" },
  ];
  const stateRows = states.map((s) => {
    const sub = rows.filter((r) => A.stateOf(r) === s.name);
    return {
      ...s,
      villages: A.uniq(sub, (r) => A.txt(r.village)).length,
      talukas: A.uniq(sub, (r) => A.txt(r.taluka)).length,
      districts: A.uniq(sub, (r) => A.txt(r.district)).length,
    };
  });

  const genderSeries = [
    { key: "पुरुष", label: "पुरुष / Male", color: "#2563eb" },
    { key: "स्त्री", label: "स्त्री / Female", color: "#ec4899" },
  ];
  const gender = (list: A.LocRow[], limit = 12) =>
    list.slice(0, limit).map((d) => ({ name: d.name, "पुरुष": d.male, "स्त्री": d.female }));

  const famVsMem = (list: A.LocRow[], limit = 12) =>
    list.slice(0, limit).map((d) => ({ name: d.name, "कुटुंबे": d.families, "सदस्य": d.members }));
  const famMemSeries = [
    { key: "कुटुंबे", label: "कुटुंबे / Families", color: "#10b981" },
    { key: "सदस्य", label: "सदस्य / Members", color: "#f59e0b" },
  ];

  const avgSize = (list: A.LocRow[], limit = 12) =>
    list.slice(0, limit).map((d) => ({ name: d.name, value: d.families ? Math.round((d.members / d.families) * 10) / 10 : 0 }));

  return (
    <div className="space-y-4">
      <KpiGrid>
        <Kpi icon={MapPin} label="States Covered" value={states.length} />
        <Kpi icon={MapPin} tone="green" label="Districts Covered" value={A.uniq(rows, (r) => A.txt(r.district)).length} />
        <Kpi icon={MapPin} tone="amber" label="Talukas Covered" value={A.uniq(rows, (r) => A.txt(r.taluka)).length} />
        <Kpi icon={MapPin} tone="violet" label="Villages Covered" value={A.uniq(rows, (r) => A.txt(r.village)).length} />
      </KpiGrid>

      <G>
        <ChartCard
          title="राज्यनिहाय कुटुंबे / State-wise Families"
          subtitle="फील्ड: राज्य (State) · मूल्य: कुटुंब संख्या व टक्केवारी"
          expand={<PieCh donut unit="कुटुंबे / families" data={states.map((s) => ({ name: s.name, value: s.families }))} />}
        >
          <PieCh donut unit="कुटुंबे / families" data={states.map((s) => ({ name: s.name, value: s.families }))} />
        </ChartCard>
        <ChartCard
          title="राज्यनिहाय सदस्य / State-wise Members"
          subtitle="फील्ड: राज्य (State) · मूल्य: एकूण कुटुंब सदस्य"
          expand={<PieCh unit="सदस्य / members" data={states.map((s) => ({ name: s.name, value: s.members }))} />}
        >
          <PieCh unit="सदस्य / members" data={states.map((s) => ({ name: s.name, value: s.members }))} />
        </ChartCard>

        <ChartCard
          title="जिल्हानिहाय कुटुंबे / District-wise Families"
          subtitle="फील्ड: जिल्हा (District) · मूल्य: कुटुंब संख्या (उतरत्या क्रमाने, टॉप १२)"
          h={340}
          expand={<BarCh horizontal multi limit={999} unit="कुटुंबे / families" data={districts.map((d) => ({ name: d.name, value: d.families }))} />}
        >
          <BarCh horizontal multi limit={12} unit="कुटुंबे / families" data={districts.map((d) => ({ name: d.name, value: d.families }))} />
        </ChartCard>
        <ChartCard
          title="जिल्हानिहाय पुरुष व स्त्री / District-wise Male vs Female"
          subtitle="फील्ड: जिल्हा (District) · मालिका: पुरुष सदस्य, स्त्री सदस्य"
          h={340}
          expand={<GroupedBar data={gender(districts, 999)} series={genderSeries} />}
        >
          <GroupedBar data={gender(districts)} series={genderSeries} />
        </ChartCard>

        <ChartCard
          title="जिल्हानिहाय कुटुंबे व सदस्य / District: Families vs Members"
          subtitle="फील्ड: जिल्हा (District) · मालिका: कुटुंब संख्या, सदस्य संख्या"
          h={340}
          expand={<GroupedBar data={famVsMem(districts, 999)} series={famMemSeries} />}
        >
          <GroupedBar data={famVsMem(districts)} series={famMemSeries} />
        </ChartCard>
        <ChartCard
          title="जिल्हानिहाय सरासरी कुटुंब आकार / Avg Family Size by District"
          subtitle="फील्ड: जिल्हा (District) · मूल्य: सदस्य ÷ कुटुंबे"
          h={340}
          expand={<BarCh multi limit={999} unit="सरासरी सदस्य / avg members" data={avgSize(districts, 999)} />}
        >
          <BarCh multi limit={12} unit="सरासरी सदस्य / avg members" data={avgSize(districts)} />
        </ChartCard>

        <ChartCard
          title="तालुकानिहाय कुटुंबे / Taluka-wise Families"
          subtitle="फील्ड: तालुका (Taluka) · मूल्य: कुटुंब संख्या (टॉप १२)"
          h={360}
          expand={<BarCh horizontal multi limit={999} unit="कुटुंबे / families" data={talukas.map((d) => ({ name: d.name, value: d.families }))} />}
        >
          <BarCh horizontal multi limit={12} unit="कुटुंबे / families" data={talukas.map((d) => ({ name: d.name, value: d.families }))} />
        </ChartCard>
        <ChartCard
          title="तालुकानिहाय पुरुष व स्त्री / Taluka-wise Male vs Female"
          subtitle="फील्ड: तालुका (Taluka) · मालिका: पुरुष, स्त्री सदस्य (स्टॅक्ड)"
          h={360}
          expand={<GroupedBar stacked horizontal data={gender(talukas, 999)} series={genderSeries} />}
        >
          <GroupedBar stacked horizontal data={gender(talukas, 10)} series={genderSeries} />
        </ChartCard>

        <ChartCard
          title="गावनिहाय कुटुंबे / Village-wise Families"
          subtitle="फील्ड: गाव (Village) · मूल्य: कुटुंब संख्या (टॉप १२)"
          h={360}
          expand={<BarCh horizontal multi limit={999} unit="कुटुंबे / families" data={villages.map((d) => ({ name: d.name, value: d.families }))} />}
        >
          <BarCh horizontal multi limit={12} unit="कुटुंबे / families" data={villages.map((d) => ({ name: d.name, value: d.families }))} />
        </ChartCard>
        <ChartCard
          title="गावनिहाय सदस्य (जिल्हा › तालुका › गाव) / Village Members Drill-down"
          subtitle="फील्ड: जिल्हा › तालुका › गाव · मूल्य: सदस्य संख्या (टॉप १०)"
          h={360}
          expand={<BarCh horizontal multi limit={999} unit="सदस्य / members" data={villagesDrill.map((d) => ({ name: d.name, value: d.members }))} />}
        >
          <BarCh horizontal multi limit={10} unit="सदस्य / members" data={villagesDrill.map((d) => ({ name: d.name, value: d.members }))} />
        </ChartCard>

        <ChartCard
          title="पिनकोडनिहाय कुटुंबे / Pincode-wise Families"
          subtitle="फील्ड: पिनकोड (Pincode) · मूल्य: कुटुंब संख्या"
          h={320}
          expand={<BarCh multi limit={999} unit="कुटुंबे / families" data={pincodes} />}
        >
          <BarCh multi limit={15} unit="कुटुंबे / families" data={pincodes} />
        </ChartCard>
        <ChartCard
          title="सर्वेक्षण वाटा / Survey Share by District (%)"
          subtitle="फील्ड: जिल्हा (District) · मूल्य: एकूण सर्वेक्षणातील टक्केवारी"
          h={320}
          expand={<BarCh multi limit={999} unit="% सर्वेक्षण" data={districts.map((d) => ({ name: d.name, value: d.pctOfTotal }))} />}
        >
          <BarCh multi limit={12} unit="% सर्वेक्षण" data={districts.map((d) => ({ name: d.name, value: d.pctOfTotal }))} />
        </ChartCard>
      </G>

      <DataTable exports={false} title="State-wise Survey Summary" rows={stateRows} columns={[...cols, { key: "villages", label: "Villages" }, { key: "talukas", label: "Talukas" }, { key: "districts", label: "Districts" }]} />
      <DataTable exports={false} title="District-wise Survey Count" rows={districts} columns={cols} />
      <DataTable exports={false} title="Taluka-wise Survey Count" rows={talukas} columns={cols} />
      <DataTable exports={false} title="Village-wise Survey Count (Drill-down)" rows={villagesDrill} columns={cols} />
    </div>
  );
}

/* ============================================== 03 Family & Demographics */

function Family({ rows, people }: Ctx) {
  const male = people.filter((p) => p.gender === "पुरुष").length;
  const female = people.filter((p) => p.gender === "स्त्री").length;
  const sizes = rows.map((r) => A.familySize(r));
  const sizeData = A.FAMILY_SIZE_BANDS.map((b) => ({ name: b, value: sizes.filter((s) => A.familySizeBand(s) === b).length }));
  const genderByAge = A.AGE_BANDS.map((b) => ({
    name: b.name,
    पुरुष: people.filter((p) => p.gender === "पुरुष" && typeof p.age === "number" && b.test(p.age)).length,
    स्त्री: people.filter((p) => p.gender === "स्त्री" && typeof p.age === "number" && b.test(p.age)).length,
  }));
  const married = people.filter((p) => p.marital_status.includes("विवाहित") && !p.marital_status.includes("अविवाहित"));
  const genderRollup = (loc: (r: A.Row) => string) =>
    A.locationRollup(rows, loc).map((d) => ({ name: d.name, पुरुष: d.male, स्त्री: d.female }));

  return (
    <div className="space-y-4">
      <KpiGrid>
        <Kpi icon={Home} label="Total Families" value={rows.length} />
        <Kpi icon={Users} tone="violet" label="Total Family Members" value={people.length} />
        <Kpi icon={UserRound} tone="cyan" label="Male" value={male} />
        <Kpi icon={UserRound} tone="pink" label="Female" value={female} />
        <Kpi icon={UserRound} tone="amber" label="Other" value={people.filter((p) => p.gender && p.gender !== "पुरुष" && p.gender !== "स्त्री").length} />
        <Kpi icon={Users} tone="green" label="Average Family Size" value={rows.length ? (people.length / rows.length).toFixed(1) : 0} />
        <Kpi icon={HandHeart} tone="red" label="Married" value={people.filter((p) => p.marital_status.includes("विवाहित") && !p.marital_status.includes("अविवाहित")).length} />
        <Kpi icon={HandHeart} tone="amber" label="Unmarried" value={people.filter((p) => p.marital_status.includes("अविवाहित")).length} />
        <Kpi icon={Shuffle} tone="lime" label="Same-caste Marriage" value={people.filter((p) => p.marriage_type.includes("जातीय") && !p.marriage_type.includes("आंतरजातीय")).length} />
        <Kpi icon={Shuffle} tone="cyan" label="Inter-caste Marriage" value={people.filter((p) => p.marriage_type.includes("आंतरजातीय")).length} />
      </KpiGrid>
      <G>
        <ChartCard
          title="लिंग वितरण / Gender Distribution"
          expand={<PieCh donut unit="सदस्य / members" data={[{ name: "पुरुष", value: male }, { name: "स्त्री", value: female }]} />}
        >
          <PieCh donut data={[{ name: "पुरुष", value: male }, { name: "स्त्री", value: female }]} />
        </ChartCard>
        <ChartCard
          title="वैवाहिक स्थिती / Marital Status"
          expand={<PieCh unit="सदस्य / members" data={A.groupCount(people as any, (p: any) => p.marital_status || "—")} />}
        >
          <PieCh data={A.groupCount(people as any, (p: any) => p.marital_status || "—")} />
        </ChartCard>
        <ChartCard
          title="विवाहाचा प्रकार / Marriage Type"
          expand={<PieCh unit="विवाह / marriages" data={A.groupCount(married as any, (p: any) => p.marriage_type || "नमूद नाही")} />}
        >
          <PieCh data={A.groupCount(married as any, (p: any) => p.marriage_type || "नमूद नाही")} />
        </ChartCard>
        <ChartCard
          title="वयोगट / Age Group"
          expand={<BarCh multi limit={999} unit="सदस्य / members" data={A.AGE_BANDS.map((b) => ({ name: b.name, value: people.filter((p) => typeof p.age === "number" && b.test(p.age)).length }))} />}
        >
          <BarCh data={A.AGE_BANDS.map((b) => ({ name: b.name, value: people.filter((p) => typeof p.age === "number" && b.test(p.age)).length }))} />
        </ChartCard>
        <ChartCard
          title="लिंग × वयोगट / Gender × Age Group"
          expand={<GroupedBar stacked limit={999} data={genderByAge} series={[{ key: "पुरुष" }, { key: "स्त्री" }]} />}
        >
          <StackedBar data={genderByAge} columns={["पुरुष", "स्त्री"]} />
        </ChartCard>
        <ChartCard
          title="कुटुंब आकार / Family Size Distribution"
          expand={<BarCh limit={999} unit="कुटुंबे / families" data={sizeData} color="#8b5cf6" />}
        >
          <BarCh data={sizeData} color="#8b5cf6" />
        </ChartCard>
        <ChartCard
          title="गावनिहाय सदस्य / Members by Village"
          expand={<BarCh horizontal limit={999} unit="सदस्य / members" data={A.locationRollup(rows, (r) => A.txt(r.village)).map((v) => ({ name: v.name, value: v.members }))} color="#06b6d4" />}
        >
          <BarCh horizontal data={A.locationRollup(rows, (r) => A.txt(r.village)).map((v) => ({ name: v.name, value: v.members }))} color="#06b6d4" />
        </ChartCard>
        <ChartCard
          title="गावनिहाय लिंग / Gender by Village"
          expand={<GroupedBar stacked horizontal limit={999} data={genderRollup((r) => A.txt(r.village))} series={[{ key: "पुरुष" }, { key: "स्त्री" }]} />}
        >
          <StackedBar columns={["पुरुष", "स्त्री"]} data={genderRollup((r) => A.txt(r.village))} />
        </ChartCard>
        <ChartCard
          title="तालुकानिहाय लिंग / Gender by Taluka"
          expand={<GroupedBar stacked horizontal limit={999} data={genderRollup((r) => A.txt(r.taluka))} series={[{ key: "पुरुष" }, { key: "स्त्री" }]} />}
        >
          <StackedBar columns={["पुरुष", "स्त्री"]} data={genderRollup((r) => A.txt(r.taluka))} />
        </ChartCard>
        <ChartCard
          title="जिल्हानिहाय लिंग / Gender by District"
          expand={<GroupedBar stacked horizontal limit={999} data={genderRollup((r) => A.txt(r.district))} series={[{ key: "पुरुष" }, { key: "स्त्री" }]} />}
        >
          <StackedBar columns={["पुरुष", "स्त्री"]} data={genderRollup((r) => A.txt(r.district))} />
        </ChartCard>
        <ChartCard
          title="राज्यनिहाय लिंग / Gender by State"
          expand={<GroupedBar stacked horizontal limit={999} data={genderRollup((r) => A.stateOf(r))} series={[{ key: "पुरुष" }, { key: "स्त्री" }]} />}
        >
          <StackedBar columns={["पुरुष", "स्त्री"]} data={genderRollup((r) => A.stateOf(r))} />
        </ChartCard>
      </G>
      <DataTable
        title="Family Size by Village"
        exports={false}
        columns={[
          { key: "name", label: "गाव / Village" },
          { key: "families", label: "कुटुंबे / Families" },
          { key: "members", label: "सदस्य / Members" },
          { key: "avgSize", label: "सरासरी आकार / Avg Size" },
        ]}
        rows={A.locationRollup(rows, (r) => A.txt(r.village)).map((v) => ({
          name: v.name,
          families: v.families,
          members: v.members,
          avgSize: v.families ? Number((v.members / v.families).toFixed(1)) : 0,
        }))}
      />
    </div>
  );
}

/* =========================================================== 04 Education */

function Education({ rows, people }: Ctx) {
  const withEdu = people.filter((p) => p.education);
  const level = (k: string) => withEdu.filter((p) => A.eduLevel(p.education) === k).length;
  const levelData = A.EDU_LEVELS.map((l) => ({ name: l.name, value: level(l.name) }))
    .concat([{ name: "इतर / Other", value: withEdu.filter((p) => A.eduLevel(p.education) === "इतर / Other").length }])
    .filter((d) => d.value > 0);

  const eduByGender = A.EDU_LEVELS.map((l) => ({
    name: l.name.split(" / ")[0]!,
    पुरुष: withEdu.filter((p) => A.eduLevel(p.education) === l.name && p.gender === "पुरुष").length,
    स्त्री: withEdu.filter((p) => A.eduLevel(p.education) === l.name && p.gender === "स्त्री").length,
  }));

  const instTypeData = A.groupCount(withEdu as any, (p: any) => A.eduInstitution(p.education)).filter((d) => d.name !== "—");

  const eduByInst = A.EDU_LEVELS.map((l) => {
    const sub = withEdu.filter((p) => A.eduLevel(p.education) === l.name);
    const o: any = { name: l.name.split(" / ")[0]! };
    sub.forEach((p) => {
      const k = A.eduInstitution(p.education);
      if (k !== "—") o[k] = (o[k] || 0) + 1;
    });
    A.INSTITUTION_TYPES.forEach((t) => { o[t] = o[t] || 0; });
    return o;
  });

  const eduKpis = [
    { label: "निरक्षर – Illiterate", key: "निरक्षर / Illiterate", tone: "red" },
    { label: "पूर्व-प्राथमिक – Pre-Primary", key: "पूर्व-प्राथमिक", tone: "amber" },
    { label: "प्राथमिक – Primary", key: "प्राथमिक", tone: "green" },
    { label: "माध्यमिक – Secondary", key: "माध्यमिक", tone: "cyan" },
    { label: "उच्च माध्यमिक – Higher Secondary", key: "उच्च माध्यमिक", tone: "violet" },
    { label: "पदविका / डिप्लोमा – Diploma", key: "पदविका / Diploma", tone: "pink" },
    { label: "पदवी – Graduate", key: "पदवी / Graduate", tone: "primary" },
    { label: "पदव्युत्तर – Postgraduate", key: "पदव्युत्तर / Postgraduate", tone: "lime" },
    { label: "डॉक्टरेट / पीएच.डी. – Doctorate", key: "डॉक्टरेट / Ph.D.", tone: "amber" },
    { label: "इतर – Other", key: "इतर / Other", tone: "red" },
  ];

  return (
    <div className="space-y-4">
      <KpiGrid>
        {eduKpis.map((k) => (
          <Kpi key={k.label} icon={GraduationCap} tone={k.tone as any} label={k.label} value={level(k.key)} />
        ))}
      </KpiGrid>
      <G>
        <ChartCard
          title="शिक्षण स्तर / Education Level"
          expand={
            <div className="h-full">
              <div className="h-full"><BarCh horizontal limit={999} color="#2563eb" data={levelData} /></div>
              
            </div>
          }
        >
          <BarCh horizontal data={levelData} color="#2563eb" />
        </ChartCard>
        <ChartCard
          title="शिक्षण शाखा / Education Stream"
          expand={
            <div className="h-full">
              <div className="h-full"><PieCh data={A.groupCount(withEdu as any, (p: any) => A.eduStream(p.education)).filter((d) => d.name !== "—")} /></div>
              
            </div>
          }
        >
          <PieCh data={A.groupCount(withEdu as any, (p: any) => A.eduStream(p.education)).filter((d) => d.name !== "—")} />
        </ChartCard>
        <ChartCard
          title="अभ्यासक्रम / Course"
          expand={
            <div className="h-full">
              <div className="h-full"><BarCh horizontal limit={999} color="#8b5cf6" data={A.groupCount(withEdu as any, (p: any) => A.eduCourse(p.education)).filter((d) => d.name !== "—")} /></div>
              
            </div>
          }
        >
          <BarCh horizontal color="#8b5cf6" data={A.groupCount(withEdu as any, (p: any) => A.eduCourse(p.education)).filter((d) => d.name !== "—")} />
        </ChartCard>
        <ChartCard
          title="शिक्षण × लिंग / Education × Gender"
          expand={
            <div className="h-full">
              <div className="h-full"><StackedBar data={eduByGender} columns={["पुरुष", "स्त्री"]} /></div>
              
            </div>
          }
        >
          <StackedBar data={eduByGender} columns={["पुरुष", "स्त्री"]} />
        </ChartCard>
        <ChartCard
          title="संस्था प्रकार / Institution Type"
          expand={
            <div className="h-full">
              <div className="h-full"><PieCh data={instTypeData} /></div>
              
            </div>
          }
        >
          <PieCh data={instTypeData} />
        </ChartCard>
        <ChartCard
          title="शिक्षण × संस्था प्रकार / Education × Institution Analysis"
          expand={
            <div className="h-full">
              <div className="h-full"><StackedBar data={eduByInst} columns={A.INSTITUTION_TYPES} /></div>
              
            </div>
          }
        >
          <StackedBar data={eduByInst} columns={A.INSTITUTION_TYPES} />
        </ChartCard>
        <ChartCard
          title="शिक्षण × व्यवसाय / Education × Occupation"
          expand={
            <div className="h-full">
              <div className="h-full">
                <StackedBar
                  columns={[...new Set(withEdu.map((p) => A.occGroup(p.occupation)))].slice(0, 8)}
                  data={A.EDU_LEVELS.map((l) => {
                    const sub = withEdu.filter((p) => A.eduLevel(p.education) === l.name);
                    const o: any = { name: l.name.split(" / ")[0]! };
                    sub.forEach((p) => { const k = A.occGroup(p.occupation); o[k] = (o[k] || 0) + 1; });
                    return o;
                  })}
                />
              </div>
              
            </div>
          }
        >
          <StackedBar
            columns={[...new Set(withEdu.map((p) => A.occGroup(p.occupation)))].slice(0, 8)}
            data={A.EDU_LEVELS.map((l) => {
              const sub = withEdu.filter((p) => A.eduLevel(p.education) === l.name);
              const o: any = { name: l.name.split(" / ")[0]! };
              sub.forEach((p) => { const k = A.occGroup(p.occupation); o[k] = (o[k] || 0) + 1; });
              return o;
            })}
          />
        </ChartCard>
      </G>

      <DataTable
        title="Education Detail Report"
        exports={false}
        columns={[{ key: "name", label: "Education Level" }, { key: "value", label: "Members" }, { key: "male", label: "Male" }, { key: "female", label: "Female" }, { key: "share", label: "Share %" }]}
        rows={levelData.map((d) => ({
          ...d,
          male: withEdu.filter((p) => A.eduLevel(p.education) === d.name && p.gender === "पुरुष").length,
          female: withEdu.filter((p) => A.eduLevel(p.education) === d.name && p.gender === "स्त्री").length,
          share: A.pct(d.value, withEdu.length),
        }))}
      />
      <div className="text-xs text-muted-foreground">
        संस्था प्रकार / Institution Type breakdown is captured inside each occupation record and is reported in section 05.
      </div>
    </div>
  );
}

/* ========================================================== 05 Occupation */

function Occupation({ rows, people }: Ctx) {
  const withOcc = people.filter((p) => p.occupation);
  const g = (k: string) => withOcc.filter((p) => A.occGroup(p.occupation) === k).length;
  const data = A.groupCount(withOcc as any, (p: any) => A.occGroup(p.occupation));
  const villageOcc = useMemo(() => {
    const topVillages = A.groupCount(withOcc as any, (p: any) => A.txt(p.row.village)).slice(0, 60).map((v) => v.name);
    const cats = data.map((d) => d.name);
    const rows = topVillages.map((v) => {
      const r: Record<string, any> = { name: v };
      for (const c of cats) {
        r[c.split(" / ")[0]!] = withOcc.filter((p) => A.txt(p.row.village) === v && A.occGroup(p.occupation) === c).length;
      }
      return r;
    });
    return { rows, series: cats.map((c) => ({ key: c.split(" / ")[0]!, label: c })) };
  }, [withOcc, data]);
  const jobHolders = withOcc.filter((p) => !["बेरोजगार / Unemployed", "निवृत्त / Pensioner", "—"].includes(A.occGroup(p.occupation))).length;
  const seekingJobs = g("बेरोजगार / Unemployed");
  const skillTraining = withOcc.filter((p) => A.occGroup(p.occupation) === "बेरोजगार / Unemployed" && p.age != null && p.age >= 15 && p.age <= 44).length;
  const businessOpp = rows.filter((r) => (r.employment_info || {}).has_entrepreneur === true || (r.employment_info || {}).has_side_business === true).length;
  const loanRequired = rows.filter((r) => Object.values(r.farming_tools_details || {}).some((t: any) => t && t.needs_loan === true)).length;

  return (
    <div className="space-y-4">
      <KpiGrid>
        <Kpi icon={Briefcase} label="Total Job Holders" value={jobHolders} />
        <Kpi tone="lime" label="शेतकरी (Farmer)" value={g("शेतकरी / Farmer")} />
        <Kpi tone="lime" label="शेती + व्यवसाय (Agriculture + Business)" value={g("शेती + व्यवसाय")} />
        <Kpi tone="lime" label="कृषी मजूर / शेतमजूर (Farm Labour)" value={g("शेतमजूर / Farm Labour")} />
        <Kpi tone="amber" label="स्वरोजगार (Self Employed)" value={g("स्वरोजगार / Self Employed")} />
        <Kpi tone="violet" label="व्यवसाय (Business Owner)" value={g("व्यवसाय / Business Owner")} />
        <Kpi tone="amber" label="मानधनधारक पदाधिकारी (Honorarium Based Position)" value={withOcc.filter((p) => A.txt(p.occupation).includes("मानधन")).length} />
        <Kpi tone="green" label="सरकारी कर्मचारी (Government Employee)" value={g("सरकारी कर्मचारी")} />
        <Kpi tone="cyan" label="खाजगी कर्मचारी (Private Employee)" value={g("खाजगी कर्मचारी")} />
        <Kpi tone="cyan" label="शिक्षण क्षेत्र (Education Sector)" value={g("शिक्षण क्षेत्र")} />
        <Kpi tone="pink" label="वैद्यकीय क्षेत्र (Medical Sector)" value={g("वैद्यकीय क्षेत्र")} />
        <Kpi tone="pink" label="महिला व बाल विकास (Women & Child Development)" value={g("महिला व बालविकास")} />
        <Kpi tone="primary" label="अभियंता (Engineering Sector)" value={g("अभियंता / Engineering")} />
        <Kpi tone="green" label="बँकिंग व वित्तीय क्षेत्र (Banking & Finance)" value={g("बँकिंग व वित्तीय")} />
        <Kpi tone="violet" label="न्यायव्यवस्था (Judiciary)" value={g("न्यायालयीन / Judiciary")} />
        <Kpi tone="red" label="संरक्षण व सुरक्षा सेवा (Defence & Security)" value={g("संरक्षण व सुरक्षा")} />
        <Kpi tone="pink" label="निवृत्त / पेन्शनधारक (Retired / Pensioner)" value={g("निवृत्त / Pensioner")} />
        <Kpi tone="red" label="बेरोजगार (Unemployed)" value={g("बेरोजगार / Unemployed")} />
        <Kpi tone="primary" label="परदेशस्थ (NRI)" value={g("परदेशस्थ / NRI")} />
        <Kpi tone="amber" label="इतर (Other)" value={g("इतर / Other")} />
        <Kpi tone="red" label="Members Seeking Jobs" value={seekingJobs} />
        <Kpi tone="cyan" label="Skill Training Required" value={skillTraining} />
        <Kpi tone="green" label="Business Opportunity" value={businessOpp} />
        <Kpi tone="violet" label="Loan Required" value={loanRequired} />
      </KpiGrid>
      <G>
        <ChartCard
          wide
          title="सर्व व्यवसाय श्रेणी — संपूर्ण वितरण / All Occupation Categories — Complete Distribution"
          subtitle="प्रत्येक व्यवसाय श्रेणीतील सदस्य संख्या / Member count in each occupation category"
          expand={
            <div style={{ height: Math.max(420, data.length * 34) }}>
              <BarCh horizontal multi data={data} limit={50} unit="सदस्य / Members" />
            </div>
          }
        >
          <BarCh horizontal multi data={data} limit={19} unit="सदस्य / Members" />
        </ChartCard>
        <ChartCard
          title="व्यवसाय × लिंग / Occupation × Gender"
          expand={
            <div style={{ height: Math.max(420, data.length * 34) }}>
              <StackedBar
                columns={["पुरुष", "स्त्री"]}
                data={data.map((d) => ({
                  name: d.name.split(" / ")[0]!,
                  पुरुष: withOcc.filter((p) => A.occGroup(p.occupation) === d.name && p.gender === "पुरुष").length,
                  स्त्री: withOcc.filter((p) => A.occGroup(p.occupation) === d.name && p.gender === "स्त्री").length,
                }))}
              />
            </div>
          }
        >
          <StackedBar columns={["पुरुष", "स्त्री"]} data={data.slice(0, 12).map((d) => ({
            name: d.name.split(" / ")[0]!,
            पुरुष: withOcc.filter((p) => A.occGroup(p.occupation) === d.name && p.gender === "पुरुष").length,
            स्त्री: withOcc.filter((p) => A.occGroup(p.occupation) === d.name && p.gender === "स्त्री").length,
          }))} />
        </ChartCard>
        <ChartCard
          wide
          title="गावनिहाय व्यवसाय वितरण / Village-wise Occupation Distribution"
          subtitle="प्रत्येक गावातील व्यवसाय श्रेणीनुसार सदस्य / Members per village by occupation category"
          expand={
            <div style={{ height: Math.max(420, villageOcc.rows.length * 30) }}>
              <GroupedBar horizontal stacked limit={60} data={villageOcc.rows} series={villageOcc.series} />
            </div>
          }
        >
          {villageOcc.rows.length ? (
            <GroupedBar horizontal stacked limit={10} data={villageOcc.rows} series={villageOcc.series} />
          ) : (
            <Empty />
          )}
        </ChartCard>
      </G>
      <DataTable
        title="Occupation Detail Report"
        exports={false}
        columns={[
          { key: "name", label: "Occupation" }, { key: "value", label: "Members" },
          { key: "male", label: "Male" }, { key: "female", label: "Female" },
          { key: "villages", label: "Villages" }, { key: "share", label: "Share %" },
        ]}
        rows={data.map((d) => {
          const sub = withOcc.filter((p) => A.occGroup(p.occupation) === d.name);
          return {
            ...d,
            male: sub.filter((p) => p.gender === "पुरुष").length,
            female: sub.filter((p) => p.gender === "स्त्री").length,
            villages: new Set(sub.map((p) => A.txt(p.row.village))).size,
            share: A.pct(d.value, withOcc.length),
          };
        })}
      />
      <DataTable
        title="Employment Report by Village"
        exports={false}
        columns={[
          { key: "name", label: "Village" }, { key: "govt", label: "Govt" }, { key: "priv", label: "Private" },
          { key: "self", label: "Self-employed" }, { key: "biz", label: "Business" },
          { key: "farmer", label: "Farmer" }, { key: "unemp", label: "Unemployed" },
        ]}
        rows={A.uniq(rows, (r) => A.txt(r.village)).map((v) => {
          const sub = withOcc.filter((p) => A.txt(p.row.village) === v);
          const c = (k: string) => sub.filter((p) => A.occGroup(p.occupation) === k).length;
          return {
            name: v, govt: c("सरकारी कर्मचारी"), priv: c("खाजगी कर्मचारी"),
            self: c("स्वरोजगार / Self Employed"), biz: c("व्यवसाय / Business Owner"),
            farmer: c("शेतकरी / Farmer"), unemp: c("बेरोजगार / Unemployed"),
          };
        })}
      />
    </div>
  );
}

/* ========================================================= 06 Agriculture */

function Agriculture({ rows }: Ctx) {
  const farm = rows.filter((r) => r.has_farmland);
  const sum = (k: string) => Math.round(rows.reduce((a, r) => a + A.num(r[k]), 0) * 10) / 10;
  const totalLand = sum("total_farmland");
  const landData = A.LAND_BANDS.map((b) => ({ name: b, value: farm.filter((r) => A.landBand(A.num(r.total_farmland)) === b).length }));

  return (
    <div className="space-y-4">
      <KpiGrid>
        <Kpi icon={Sprout} tone="green" label="Agriculture Families" value={farm.length} hint={`${A.pct(farm.length, rows.length)}%`} />
        <Kpi icon={Sprout} tone="red" label="Non-Agriculture Families" value={rows.filter((r) => r.has_farmland === false).length} />
        <Kpi tone="amber" label="Total Reported Farmland (एकर)" value={totalLand} />
        <Kpi tone="violet" label="Average Landholding (एकर)" value={farm.length ? (totalLand / farm.length).toFixed(2) : 0} />
        <Kpi tone="cyan" label="Irrigated Area" value={sum("irrigated_area")} />
        <Kpi tone="lime" label="Dryland Area" value={sum("dryland_area")} />
        <Kpi tone="primary" label="Kharif Area" value={sum("kharif_area")} />
        <Kpi tone="pink" label="Rabi Area (धान सोडून)" value={sum("rabi_area")} />
        <Kpi tone="amber" label="Summer Area (धानासह)" value={sum("summer_area")} />
        <Kpi tone="green" label="Contract / Share Cropping" value={rows.filter((r) => (r.farm_management || {}).has_contract_or_share).length} />
        <Kpi icon={Sprout} tone="lime" label="घेतलेली पिके (Crops grown)" value={rows.filter((r) => Array.isArray(r.crops) && (r.crops as any[]).some((c) => A.txt(c?.season))).length} />
      </KpiGrid>
      <G>
        <ChartCard title="शेतजमीन / Farmland"><PieCh donut data={[{ name: "शेती आहे", value: farm.length }, { name: "शेती नाही", value: rows.filter((r) => r.has_farmland === false).length }]} /></ChartCard>
        <ChartCard title="जमीन आकार वितरण / Landholding Distribution"><BarCh horizontal multi data={landData} color="#10b981" /></ChartCard>
        <ChartCard title="हंगामनिहाय क्षेत्र / Seasonal Area"><BarCh multi data={[{ name: "खरीप क्षेत्र (एकर)", value: sum("kharif_area") }, { name: "रब्बी क्षेत्र (एकर)", value: sum("rabi_area") }, { name: "उन्हाळी क्षेत्र (एकर)", value: sum("summer_area") }, { name: "घेतलेली पिके (कुटुंबे)", value: rows.filter((r) => Array.isArray(r.crops) && (r.crops as any[]).some((c) => A.txt(c?.season))).length }]} color="#f59e0b" /></ChartCard>
        <ChartCard title="सिंचित vs कोरडवाहू / Irrigated vs Dryland"><PieCh data={[{ name: "सिंचित", value: sum("irrigated_area") }, { name: "कोरडवाहू", value: sum("dryland_area") }]} /></ChartCard>
      </G>
      <DataTable
        title="Agriculture Report by Village"
        exports={false}
        columns={[
          { key: "name", label: "Village" }, { key: "farmers", label: "Farmers" }, { key: "land", label: "Land (Acre)" },
          { key: "irrigated", label: "Irrigated" }, { key: "dry", label: "Dryland" },
          { key: "kharif", label: "Kharif" }, { key: "rabi", label: "Rabi" }, { key: "summer", label: "Summer" },
        ]}
        rows={A.uniq(farm, (r) => A.txt(r.village)).map((v) => {
          const sub = farm.filter((r) => A.txt(r.village) === v);
          const s = (k: string) => Math.round(sub.reduce((a, r) => a + A.num(r[k]), 0) * 10) / 10;
          return { name: v, farmers: sub.length, land: s("total_farmland"), irrigated: s("irrigated_area"), dry: s("dryland_area"), kharif: s("kharif_area"), rabi: s("rabi_area"), summer: s("summer_area") };
        })}
      />
    </div>
  );
}

/* ==================================================== 07 Crop & Irrigation */

function CropIrrigation({ rows }: Ctx) {
  const farm = rows.filter((r) => r.has_farmland);
  const cropTypes = A.countMulti(rows, (r) => (Array.isArray(r.major_crop_types) ? r.major_crop_types : []));
  const seasons = A.countMulti(rows, (r) => (Array.isArray(r.crops) ? r.crops.map((c: any) => A.txt(c?.season)) : []));
  const irrSources = A.countMulti(rows, (r) => (Array.isArray(r.irrigation_sources) ? r.irrigation_sources : []));
  const irrEn: Record<string, string> = { tubewell: "Tubewell / Borewell", well: "Well", farm_pond: "Farm Pond", pond: "Lake / Pond", river: "River", canal: "Canal" };
  // Single source of truth: a family has a source when its detail count > 0 OR
  // the source appears in irrigation_sources (legacy). Quantity sums detail counts.
  const irrStats = (key: string, marathiLabel: string) => {
    let families = 0;
    let count = 0;
    for (const r of rows) {
      const c = A.num(((r.irrigation_details || {}) as any)[key]?.count);
      const hasSource = c > 0 || (r.irrigation_sources || []).some((s: string) => s.includes(marathiLabel));
      if (hasSource) families += 1;
      count += c;
    }
    return { families, count };
  };
  const irrData = A.IRRIGATION_KEYS.map((k) => ({
    name: `${k.label} / ${irrEn[k.key]}`,
    ...irrStats(k.key, k.label.split(" / ")[0]!),
  })).filter((d) => d.families > 0 || d.count > 0);
  const det = (key: string, f: (d: any) => boolean) => rows.filter((r) => f(((r.irrigation_details || {}) as any)[key] || {})).length;
  const electric = A.IRRIGATION_KEYS.reduce((a, k) => a + det(k.key, (d) => !!d.electric), 0);
  const solar = A.IRRIGATION_KEYS.reduce((a, k) => a + det(k.key, (d) => !!d.solar), 0);
  const malguzari = det("pond", (d) => !!d.is_kohli_malguzari);
  const freeWater = A.IRRIGATION_KEYS.reduce((a, k) => a + det(k.key, (d) => !!d.water_free_for_irrigation), 0);

  return (
    <div className="space-y-4">
      <KpiGrid>
        <Kpi icon={Droplets} label="Families with Irrigation" value={rows.filter((r) => (r.irrigation_sources || []).length).length} />
        <Kpi tone="amber" label="Electric Pumps" value={electric} />
        <Kpi tone="green" label="Solar Pumps" value={solar} />
        <Kpi tone="cyan" label="Malguzari Ponds (कोहळी)" value={malguzari} />
        <Kpi tone="violet" label="Free Irrigation Water" value={freeWater} />
        <Kpi tone="lime" label="Crop Types Recorded" value={cropTypes.length} />
        <Kpi tone="blue" label="Tubewell / Borewell" value={irrStats("tubewell", "ट्युबवेल").count} />
        <Kpi tone="sky" label="Wells" value={irrStats("well", "विहीर").count} />
        <Kpi tone="teal" label="Farm Ponds" value={irrStats("farm_pond", "शेततळे").count} />
        <Kpi tone="indigo" label="Lakes" value={irrStats("pond", "तलाव").count} />
        <Kpi tone="orange" label="Canal / River Sources" value={irrStats("canal", "नहर").count + irrStats("river", "नदी").count} />
      </KpiGrid>
      <G>
        <ChartCard
          title="मुख्य पीक प्रकार / Major Crop Types"
          expand={cropTypes.length ? <div className="h-[60vh]"><BarCh horizontal data={cropTypes} color="#84cc16" /></div> : <Empty />}
        >
          {cropTypes.length ? <BarCh horizontal data={cropTypes} color="#84cc16" /> : <Empty />}
        </ChartCard>
        <ChartCard
          title="हंगाम वितरण / Crop Season"
          expand={seasons.length ? <div className="h-[60vh]"><PieCh data={seasons} /></div> : <Empty />}
        >
          {seasons.length ? <PieCh data={seasons} /> : <Empty />}
        </ChartCard>
        <ChartCard
          title="सिंचन साधन / Irrigation Sources"
          expand={<div className="h-[60vh]"><GroupedBar horizontal data={irrData} series={[{ key: "families", label: "कुटुंबे / Families", color: "#0ea5e9" }, { key: "count", label: "एकूण संख्या / Total Quantity", color: "#06b6d4" }]} /></div>}
        >
          {irrData.some((d) => d.families || d.count) ? (
            <GroupedBar horizontal data={irrData} series={[{ key: "families", label: "कुटुंबे / Families", color: "#0ea5e9" }, { key: "count", label: "एकूण संख्या / Total Quantity", color: "#06b6d4" }]} />
          ) : (
            <Empty />
          )}
        </ChartCard>
        <ChartCard
          title="पंप प्रकार / Pump Type"
          expand={<div className="h-[60vh]"><PieCh data={[{ name: "विद्युत पंप", value: electric }, { name: "सोलर पंप", value: solar }]} /></div>}
        >
          <PieCh data={[{ name: "विद्युत पंप", value: electric }, { name: "सोलर पंप", value: solar }]} />
        </ChartCard>
        <ChartCard
          title="पीक × गाव / Crop × Village"
          expand={<div className="h-[60vh]"><StackedBar columns={cropTypes.slice(0, 6).map((c) => c.name)} data={A.uniq(farm, (r) => A.txt(r.village)).slice(0, 15).map((v) => {
            const sub = farm.filter((r) => A.txt(r.village) === v);
            const o: any = { name: v };
            cropTypes.slice(0, 6).forEach((c) => { o[c.name] = sub.filter((r) => (r.major_crop_types || []).includes(c.name)).length; });
            return o;
          })} /></div>}
        >
          <StackedBar
            columns={cropTypes.slice(0, 6).map((c) => c.name)}
            data={A.uniq(farm, (r) => A.txt(r.village)).slice(0, 15).map((v) => {
              const sub = farm.filter((r) => A.txt(r.village) === v);
              const o: any = { name: v };
              cropTypes.slice(0, 6).forEach((c) => { o[c.name] = sub.filter((r) => (r.major_crop_types || []).includes(c.name)).length; });
              return o;
            })}
          />
        </ChartCard>
        <ChartCard
          title="सिंचन × जमीन आकार / Irrigation × Land Size"
          expand={<div className="h-[60vh]"><StackedBar columns={irrSources.slice(0, 6).map((c) => c.name)} data={A.LAND_BANDS.map((b) => {
            const sub = farm.filter((r) => A.landBand(A.num(r.total_farmland)) === b);
            const o: any = { name: b };
            irrSources.slice(0, 6).forEach((c) => { o[c.name] = sub.filter((r) => (r.irrigation_sources || []).includes(c.name)).length; });
            return o;
          })} /></div>}
        >
          <StackedBar
            columns={irrSources.slice(0, 6).map((c) => c.name)}
            data={A.LAND_BANDS.map((b) => {
              const sub = farm.filter((r) => A.landBand(A.num(r.total_farmland)) === b);
              const o: any = { name: b };
              irrSources.slice(0, 6).forEach((c) => { o[c.name] = sub.filter((r) => (r.irrigation_sources || []).includes(c.name)).length; });
              return o;
            })}
          />
        </ChartCard>
      </G>
      <DataTable
        title="Irrigation Detail Report"
        exports={false}
        columns={[{ key: "name", label: "Source" }, { key: "families", label: "Families" }, { key: "count", label: "Total Units" }, { key: "electric", label: "Electric" }, { key: "solar", label: "Solar" }]}
        rows={A.IRRIGATION_KEYS.map((k) => ({
          name: k.label,
          ...irrStats(k.key, k.label.split(" / ")[0]!),
          electric: det(k.key, (d) => !!d.electric),
          solar: det(k.key, (d) => !!d.solar),
        }))}
      />
    </div>
  );
}

/* ========================================================== 08 Equipment */

function Equipment({ rows }: Ctx) {
  const d = (r: A.Row, key: string) => ((r.farming_tools_details || {}) as any)[key] || {};
  const stats = A.TOOL_KEYS.map((k) => ({
    name: k.label,
    owners: rows.filter((r) => d(r, k.key).has).length,
    qty: rows.reduce((a, r) => a + A.num(d(r, k.key).count), 0),
    wants: rows.filter((r) => d(r, k.key).has === false && d(r, k.key).want_to_buy).length,
    loan: rows.filter((r) => d(r, k.key).needs_loan).length,
  }));
  const totalOwners = stats.reduce((a, s) => a + s.owners, 0);

  return (
    <div className="space-y-4">
      <KpiGrid>
        <Kpi icon={Tractor} label="Families Owning Equipment" value={rows.filter((r) => A.TOOL_KEYS.some((k) => d(r, k.key).has)).length} />
        <Kpi tone="green" label="Total Equipment Units" value={stats.reduce((a, s) => a + s.qty, 0)} />
        <Kpi tone="amber" label="Purchase Demand" value={stats.reduce((a, s) => a + s.wants, 0)} />
        <Kpi tone="red" label="Loan Required" value={stats.reduce((a, s) => a + s.loan, 0)} />
        <Kpi tone="violet" label="Other Modern Equipment" value={rows.filter((r) => (r.farming_tools_details || {}).other_uses).length} />
        <Kpi tone="cyan" label="Equipment Ownership Records" value={totalOwners} />
      </KpiGrid>
      <G>
        <ChartCard title="साधन मालकी / Equipment Ownership" expand={<BarCh data={stats.map((s) => ({ name: s.name, value: s.owners }))} color="#10b981" />}>
          <BarCh data={stats.map((s) => ({ name: s.name, value: s.owners }))} color="#10b981" />
        </ChartCard>
        <ChartCard title="खरेदीची इच्छा / Purchase Demand" expand={<BarCh data={stats.map((s) => ({ name: s.name, value: s.wants }))} color="#f59e0b" />}>
          <BarCh data={stats.map((s) => ({ name: s.name, value: s.wants }))} color="#f59e0b" />
        </ChartCard>
        <ChartCard title="कर्जाची आवश्यकता / Loan Required" expand={<BarCh data={stats.map((s) => ({ name: s.name, value: s.loan }))} color="#ef4444" />}>
          <BarCh data={stats.map((s) => ({ name: s.name, value: s.loan }))} color="#ef4444" />
        </ChartCard>
        <ChartCard title="एकूण संख्या / Total Quantity" expand={<PieCh data={stats.map((s) => ({ name: s.name, value: s.qty }))} />}>
          <PieCh data={stats.map((s) => ({ name: s.name, value: s.qty }))} />
        </ChartCard>
      </G>
      <DataTable
        title="Farming Equipment Report"
        columns={[{ key: "name", label: "Equipment" }, { key: "owners", label: "Owner Families" }, { key: "qty", label: "Quantity" }, { key: "wants", label: "Required / Wants to Buy" }, { key: "loan", label: "Loan Required" }]}
        rows={stats}
        exports={false}
      />
    </div>
  );
}

/* ============================================================ 09 Housing */

function Housing({ rows }: Ctx) {
  const c = (f: (r: A.Row) => boolean) => rows.filter(f).length;
  const kachcha = rows.filter((r) => A.txt(r.house_type).includes("माती") || A.txt(r.house_type).toLowerCase().includes("kach")).length;
  const pakka = rows.filter((r) => A.txt(r.house_type).includes("पक्क")).length;
  return (
    <div className="space-y-4">
      <KpiGrid>
        <Kpi icon={Home} label="Own House Families" value={c((r) => !!r.owns_house)} />
        <Kpi tone="amber" label="Rented Families" value={c((r) => A.txt(r.living_status).includes("भाड"))} />
        <Kpi tone="violet" label="Dependent Families" value={c((r) => A.txt(r.living_status).includes("आश्रित") || A.txt(r.living_status).includes("अवलंब"))} />
        <Kpi tone="red" label="No House" value={c((r) => r.owns_house === false)} />
        <Kpi tone="lime" label="Kachcha Houses" value={kachcha} />
        <Kpi tone="green" label="Pakka Houses" value={pakka} />
        <Kpi tone="cyan" label="Gharkul Beneficiaries" value={c((r) => !!r.gharkul_received)} />
        <Kpi tone="pink" label="Families Requiring Gharkul" value={c((r) => !!r.gharkul_wanted)} />
      </KpiGrid>
      <G>
        <ChartCard title="घर मालकी / House Ownership" expand={<PieCh donut unit="कुटुंबे / families" data={[{ name: "स्वतःचे घर", value: c((r) => !!r.owns_house) }, { name: "घर नाही", value: c((r) => r.owns_house === false) }]} />}><PieCh donut data={[{ name: "स्वतःचे घर", value: c((r) => !!r.owns_house) }, { name: "घर नाही", value: c((r) => r.owns_house === false) }]} /></ChartCard>
        <ChartCard title="घर प्रकार / House Type" expand={<PieCh unit="कुटुंबे / families" data={A.groupCount(rows.filter((r) => r.house_type), (r) => A.txt(r.house_type)).filter((d) => !d.name.includes("माती") && !d.name.toLowerCase().includes("kach"))} />}><PieCh data={A.groupCount(rows.filter((r) => r.house_type), (r) => A.txt(r.house_type)).filter((d) => !d.name.includes("माती") && !d.name.toLowerCase().includes("kach"))} /></ChartCard>
        <ChartCard title="राहण्याची स्थिती / Living Status" expand={<BarCh multi limit={999} unit="कुटुंबे / families" data={A.groupCount(rows.filter((r) => r.living_status), (r) => A.txt(r.living_status))} color="#8b5cf6" />}><BarCh data={A.groupCount(rows.filter((r) => r.living_status), (r) => A.txt(r.living_status))} color="#8b5cf6" /></ChartCard>
        <ChartCard title="घरकुल / Gharkul" expand={<PieCh unit="कुटुंबे / families" data={[{ name: "मिळाले", value: c((r) => !!r.gharkul_received) }, { name: "आवश्यक", value: c((r) => !!r.gharkul_wanted) }, { name: "मिळाले नाही", value: c((r) => r.gharkul_received === false) }]} />}><PieCh data={[{ name: "मिळाले", value: c((r) => !!r.gharkul_received) }, { name: "आवश्यक", value: c((r) => !!r.gharkul_wanted) }, { name: "मिळाले नाही", value: c((r) => r.gharkul_received === false) }]} /></ChartCard>
      </G>
      <DataTable
        title="Housing Report by Village"
        columns={[{ key: "name", label: "Village" }, { key: "families", label: "Families" }, { key: "own", label: "Own House" }, { key: "kachcha", label: "Kachcha" }, { key: "pakka", label: "Pakka" }, { key: "gharkul", label: "Gharkul Received" }, { key: "need", label: "Gharkul Need" }]}
        rows={A.uniq(rows, (r) => A.txt(r.village)).map((v) => {
          const sub = rows.filter((r) => A.txt(r.village) === v);
          return {
            name: v, families: sub.length,
            own: sub.filter((r) => r.owns_house).length,
            kachcha: sub.filter((r) => A.txt(r.house_type).includes("माती")).length,
            pakka: sub.filter((r) => A.txt(r.house_type).includes("पक्क")).length,
            gharkul: sub.filter((r) => r.gharkul_received).length,
            need: sub.filter((r) => r.gharkul_wanted).length,
          };
        })}
        exports={false}
      />
    </div>
  );
}

/* ============================== 10 Household Assets & Solar (merged) */

function Assets({ rows }: Ctx) {
  const owned = A.countMulti(rows, (r) => (Array.isArray(r.household_items) ? r.household_items : []));
  const qty = (name: string) => rows.reduce((a, r) => a + A.num((r.household_item_counts || {})[name]), 0);
  const table = owned.map((o) => ({ name: o.name, families: o.value, pct: A.pct(o.value, rows.length), qty: qty(o.name) || o.value }));

  const VEHICLE_OPTS = ["दोन चाकी वाहन", "चार चाकी वाहन", "सायकल", "ऑटो"];
  const [vehicle, setVehicle] = useState("दोन चाकी वाहन");
  const vehicleByVillage = A.uniq(rows, (r) => A.txt(r.village))
    .map((v) => {
      const sub = rows.filter((r) => A.txt(r.village) === v && (r.household_items || []).includes(vehicle));
      return { name: v, value: sub.length, qty: sub.reduce((a, r) => a + (A.num((r.household_item_counts || {})[vehicle]) || 1), 0) };
    })
    .filter((d) => d.value > 0)
    .map((d) => ({ name: d.name, "कुटुंबे": d.value, "एकूण संख्या": d.qty }));
  const twoWheelerByVillage = A.uniq(rows, (r) => A.txt(r.village))
    .map((v) => {
      const item = "दोन चाकी वाहन";
      const sub = rows.filter((r) => A.txt(r.village) === v && (r.household_items || []).includes(item));
      return { name: v, value: sub.length, qty: sub.reduce((a, r) => a + (A.num((r.household_item_counts || {})[item]) || 1), 0) };
    })
    .filter((d) => d.value > 0)
    .map((d) => ({ name: d.name, "कुटुंबे": d.value, "एकूण संख्या": d.qty }));
  const vehicleSeries = [
    { key: "कुटुंबे", label: "कुटुंबे / Families", color: "#06b6d4" },
    { key: "एकूण संख्या", label: "एकूण संख्या / Total quantity", color: "#8b5cf6" },
  ];

  const installed = rows.filter((r) => r.solar_panel_installed).length;
  const wanted = rows.filter((r) => r.solar_panel_wanted).length;
  const notInstalled = rows.filter((r) => r.solar_panel_installed === false).length;
  const solarPumps = rows.filter((r) => A.IRRIGATION_KEYS.some((k) => ((r.irrigation_details || {}) as any)[k.key]?.solar)).length;
  const farmSolar = rows.filter((r) => r.has_farmland && r.solar_panel_installed).length;
  const villages = A.uniq(rows, (r) => A.txt(r.village));

  const assetsByVillage = villages.slice(0, 15).map((v) => {
    const sub = rows.filter((r) => A.txt(r.village) === v);
    const o: any = { name: v };
    owned.slice(0, 6).forEach((it) => { o[it.name] = sub.filter((r) => (r.household_items || []).includes(it.name)).length; });
    return o;
  });
  const solarByVillage = villages
    .map((v) => ({ name: v, value: rows.filter((r) => A.txt(r.village) === v && r.solar_panel_wanted).length }))
    .filter((d) => d.value > 0);
  const solarStatus = [
    { name: "बसवले / Installed", value: installed },
    { name: "बसवले नाही / Not installed", value: notInstalled },
    { name: "आवश्यक / Required", value: wanted },
  ];
  const solarVsPump = [
    { name: "सोलर पंप / Solar pump", value: solarPumps },
    { name: "घरगुती पॅनेल / Home panel", value: installed },
  ];
  const solarAgri = [
    { name: "शेतकरी - बसवले", value: farmSolar },
    { name: "शेतकरी - आवश्यक", value: rows.filter((r) => r.has_farmland && r.solar_panel_wanted).length },
    { name: "बिगर शेतकरी", value: rows.filter((r) => !r.has_farmland && r.solar_panel_installed).length },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={Package}
        title="घरगुती वस्तू व सोलर / Household Assets & Solar"
      />
      {/* ---------------- all KPIs in one place ---------------- */}
      <KpiGrid>
        {table.slice(0, 8).map((t) => <Kpi key={t.name} label={t.name} value={t.families} tone="cyan" />)}
        <Kpi icon={Sun} tone="amber" label="Solar Installed" value={installed} />
        <Kpi tone="red" label="Not Installed" value={notInstalled} />
        <Kpi tone="green" label="Solar Required" value={wanted} />
        <Kpi tone="violet" label="Solar Adoption %" value={`${A.pct(installed, rows.length)}%`} />
      </KpiGrid>
      {/* ---------------------- graphical cards ---------------------- */}
      <G>
        <ChartCard title="वस्तूनिहाय कुटुंबे / Asset-wise Families" expand={<div className="h-[70vh]"><BarCh horizontal multi limit={60} data={owned} /></div>}>
          {owned.length ? <BarCh horizontal data={owned} color="#06b6d4" /> : <Empty />}
        </ChartCard>
        <ChartCard title="वस्तू संख्या / Asset Quantity" expand={<div className="h-[70vh]"><BarCh horizontal multi limit={60} data={table.map((t) => ({ name: t.name, value: t.qty }))} /></div>}>
          {table.length ? <BarCh horizontal data={table.map((t) => ({ name: t.name, value: t.qty }))} color="#8b5cf6" /> : <Empty />}
        </ChartCard>
        <ChartCard title="मालकी टक्केवारी / Asset Ownership %" expand={<div className="h-[70vh]"><BarCh horizontal multi limit={60} unit="%" data={table.map((t) => ({ name: t.name, value: t.pct }))} /></div>}>
          {table.length ? <BarCh data={table.map((t) => ({ name: t.name, value: t.pct }))} color="#10b981" /> : <Empty />}
        </ChartCard>
        <ChartCard title="गावनिहाय वस्तू / Assets by Village" expand={<div className="h-[70vh]"><StackedBar columns={owned.slice(0, 6).map((o) => o.name)} data={assetsByVillage} /></div>}>
          <StackedBar columns={owned.slice(0, 6).map((o) => o.name)} data={assetsByVillage} />
        </ChartCard>
        <ChartCard title="वाहने / Vehicles" expand={<div className="h-[70vh]"><GroupedBar data={vehicleByVillage} series={vehicleSeries} /></div>}>
          <div className="space-y-3">
            <Select value={vehicle} onValueChange={setVehicle}>
              <SelectTrigger className="h-9"><SelectValue placeholder="वाहन निवडा" /></SelectTrigger>
              <SelectContent>
                {VEHICLE_OPTS.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
            {vehicleByVillage.length ? <GroupedBar data={vehicleByVillage} series={vehicleSeries} /> : <Empty />}
          </div>
        </ChartCard>
        <ChartCard title="दोन चाकी वाहन / Two-wheelers by Village" expand={<div className="h-[70vh]"><GroupedBar data={twoWheelerByVillage} series={vehicleSeries} /></div>}>
          {twoWheelerByVillage.length ? <GroupedBar data={twoWheelerByVillage} series={vehicleSeries} /> : <Empty />}
        </ChartCard>
        <ChartCard title="सोलर स्थिती / Solar Status" expand={<div className="h-[70vh]"><PieCh donut data={solarStatus} /></div>}>
          <PieCh donut data={solarStatus} />
        </ChartCard>
        <ChartCard title="गावनिहाय सोलर आवश्यकता / Solar Requirement by Village" expand={<div className="h-[70vh]"><BarCh horizontal multi limit={60} data={solarByVillage} /></div>}>
          <BarCh horizontal color="#f59e0b" data={solarByVillage} />
        </ChartCard>
        <ChartCard title="सोलर पंप vs घरगुती पॅनेल / Solar Pump vs Home Panel" expand={<div className="h-[70vh]"><PieCh data={solarVsPump} /></div>}>
          <PieCh data={solarVsPump} />
        </ChartCard>
        <ChartCard title="शेतकरी सोलर / Solar × Agriculture" expand={<div className="h-[70vh]"><BarCh multi data={solarAgri} /></div>}>
          <BarCh data={solarAgri} color="#84cc16" />
        </ChartCard>
      </G>
      {/* ----------------------------- tables ----------------------------- */}
      <div className="space-y-4">
        <DataTable
          title="Household Assets Report"
          columns={[{ key: "name", label: "Asset" }, { key: "families", label: "Families" }, { key: "pct", label: "Ownership %" }, { key: "qty", label: "Total Quantity" }]}
          rows={table}
          exports={false}
        />
        <DataTable
          title="Solar Report by Village"
          columns={[{ key: "name", label: "Village" }, { key: "families", label: "Families" }, { key: "installed", label: "Installed" }, { key: "required", label: "Required" }, { key: "pct", label: "Adoption %" }]}
          rows={villages.map((v) => {
            const sub = rows.filter((r) => A.txt(r.village) === v);
            const inst = sub.filter((r) => r.solar_panel_installed).length;
            return { name: v, families: sub.length, installed: inst, required: sub.filter((r) => r.solar_panel_wanted).length, pct: A.pct(inst, sub.length) };
          })}
          exports={false}
        />
      </div>
    </div>
  );
}

/* =========================================================== 12 Benefits */

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

/* ============================================================ 13 Medical */

function Medical({ rows, people }: Ctx) {
  const b = (r: A.Row) => (r.benefits_info || {}) as any;
  const ill = rows.filter((r) => b(r).critical_illness);
  const aid = rows.filter((r) => b(r).medical_aid_needed);
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
        <ChartCard title="वैद्यकीय मदतीची आवश्यकता / Medical Assistance"><PieCh data={[{ name: "आवश्यक", value: aid.length }, { name: "आवश्यक नाही", value: rows.length - aid.length }]} /></ChartCard>
        <ChartCard title="गावनिहाय गरज / Assistance by Village" wide>
          <BarCh horizontal color="#ef4444" data={A.uniq(rows, (r) => A.txt(r.village)).map((v) => ({ name: v, value: aid.filter((r) => A.txt(r.village) === v).length })).filter((d) => d.value > 0)} />
        </ChartCard>
      </G>
      <DataTable
        title="Medical Assistance Detail"
        columns={[{ key: "head", label: "Family Head" }, { key: "village", label: "Village" }, { key: "taluka", label: "Taluka" }, { key: "mobile", label: "Mobile" }, { key: "members", label: "Members" }]}
        rows={[...ill, ...aid.filter((r) => !ill.includes(r))].map((r) => ({
          head: r.head_name, village: r.village, taluka: r.taluka, mobile: r.mobile,
          members: A.personsOf(r).length,
        }))}
      />
      <div className="text-xs text-muted-foreground">Illness-type breakdown (cancer / heart / kidney) appears here once recorded in the survey record.</div>
      <div className="hidden">{people.length}</div>
    </div>
  );
}

/* ============================================================= 14 Sports */

function Sports({ rows }: Ctx) {
  const b = (r: A.Row) => (r.benefits_info || {}) as any;
  const sp = rows.filter((r) => b(r).has_sportsperson);
  const lvl = (k: string) => sp.filter((r) => A.txt(b(r).sport_level).includes(k)).length;
  return (
    <div className="space-y-4">
      <KpiGrid>
        <Kpi icon={Trophy} tone="amber" label="Total Sportspersons" value={sp.length} />
        <Kpi tone="green" label="State Level" value={lvl("राज्य")} />
        <Kpi tone="violet" label="National Level" value={lvl("राष्ट्रीय")} />
        <Kpi tone="cyan" label="International Level" value={lvl("आंतरराष्ट्रीय")} />
      </KpiGrid>
      <G>
        <ChartCard title="खेळ प्रकार / Sport Type">{sp.length ? <BarCh horizontal data={A.groupCount(sp, (r) => A.txt(b(r).sport_type) || "—")} color="#f59e0b" /> : <Empty />}</ChartCard>
        <ChartCard title="स्तरानुसार / By Level">{sp.length ? <PieCh data={A.groupCount(sp, (r) => A.txt(b(r).sport_level) || "—")} /> : <Empty />}</ChartCard>
        <ChartCard title="गावनिहाय खेळाडू / Sportspersons by Village" wide>{sp.length ? <BarCh horizontal data={A.groupCount(sp, (r) => A.txt(r.village))} color="#10b981" /> : <Empty />}</ChartCard>
      </G>
      <DataTable
        title="Sports Detail Report"
        columns={[{ key: "head", label: "Family Head" }, { key: "sport", label: "Sport" }, { key: "level", label: "Level" }, { key: "village", label: "Village" }, { key: "district", label: "District" }]}
        rows={sp.map((r) => ({ head: r.head_name, sport: b(r).sport_type, level: b(r).sport_level, village: r.village, district: r.district }))}
      />
    </div>
  );
}

/* ========================================================= 15 Leadership */

function Leadership({ rows }: Ctx) {
  const pos = A.allPositions(rows);
  const t = (k: string) => pos.filter((p) => A.txt(p.type).includes(k)).length;
  const st = (k: string) => pos.filter((p) => A.txt(p.status).includes(k)).length;
  const lvl = (k: string) => pos.filter((p) => A.txt(p.political_level).includes(k)).length;
  return (
    <div className="space-y-4">
      <KpiGrid>
        <Kpi icon={Landmark} label="Total Positions" value={pos.length} />
        <Kpi tone="green" label="Current (आजी)" value={st("आजी")} />
        <Kpi tone="amber" label="Former (माजी)" value={st("माजी")} />
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
        <ChartCard title="आजी / माजी"><PieCh data={A.groupCount(pos, (p) => A.txt(p.status) || "—")} /></ChartCard>
        <ChartCard title="राजकीय स्तर / Political Level"><BarCh data={A.groupCount(pos.filter((p) => p.political_level), (p) => A.txt(p.political_level))} color="#8b5cf6" /></ChartCard>
        <ChartCard title="पक्षनिहाय / Party-wise"><BarCh horizontal data={A.groupCount(pos.filter((p) => p.party_name), (p) => A.txt(p.party_name_other) || A.txt(p.party_name))} color="#2563eb" /></ChartCard>
        <ChartCard title="लोकप्रतिनिधी प्रकार / Representative Type"><BarCh horizontal data={A.groupCount(pos.filter((p) => p.representative_type), (p) => A.txt(p.representative_type))} color="#10b981" /></ChartCard>
        <ChartCard title="संस्था / Organisation"><BarCh horizontal data={A.groupCount(pos.filter((p) => p.coop_org_name || p.social_org), (p) => A.txt(p.coop_org_name) || A.txt(p.social_org))} color="#f59e0b" /></ChartCard>
      </G>
      <DataTable
        title="Leadership Detail Report"
        columns={[
          { key: "person", label: "Person" }, { key: "type", label: "Type" }, { key: "status", label: "Status" },
          { key: "level", label: "Level" }, { key: "rep", label: "Representative / Role" }, { key: "party", label: "Party" },
          { key: "term", label: "Term" }, { key: "village", label: "Village" },
        ]}
        rows={pos.map((p) => ({
          person: p.person_name || p.row.head_name,
          type: p.type, status: p.status, level: p.political_level,
          rep: p.representative_type || p.coop_role || p.social_role,
          party: p.party_name_other || p.party_name,
          term: [p.term_from, p.term_to].filter(Boolean).join(" – "),
          village: p.row.village,
        }))}
      />
    </div>
  );
}

/* =========================================================== 16 Business */

function BusinessSec({ rows, people }: Ctx) {
  const e = (r: A.Row) => (r.employment_info || {}) as any;
  const entrepreneurs = rows.filter((r) => e(r).has_entrepreneur);
  const side = rows.filter((r) => e(r).has_side_business);
  const selfEmp = people.filter((p) => A.occGroup(p.occupation) === "स्वरोजगार / Self Employed").length;
  const owners = people.filter((p) => A.occGroup(p.occupation) === "व्यवसाय / Business Owner").length;
  return (
    <div className="space-y-4">
      <KpiGrid>
        <Kpi icon={Store} label="Entrepreneur Families" value={entrepreneurs.length} />
        <Kpi tone="green" label="Self-employed Members" value={selfEmp} />
        <Kpi tone="violet" label="Business Owners" value={owners} />
        <Kpi tone="amber" label="Side Businesses" value={side.length} />
        <Kpi tone="cyan" label="Business + Agriculture" value={people.filter((p) => A.occGroup(p.occupation) === "शेती + व्यवसाय").length} />
        <Kpi tone="pink" label="Entrepreneur Share" value={`${A.pct(entrepreneurs.length, rows.length)}%`} />
      </KpiGrid>
      <G>
        <ChartCard title="उद्योजकता / Entrepreneurship"><PieCh donut data={[{ name: "उद्योजक कुटुंबे", value: entrepreneurs.length }, { name: "इतर", value: rows.length - entrepreneurs.length }]} /></ChartCard>
        <ChartCard title="व्यवसाय प्रकार / Business Types">{entrepreneurs.length ? <BarCh horizontal data={A.groupCount(entrepreneurs, (r) => A.txt(e(r).entrepreneur_details) || "—")} color="#8b5cf6" /> : <Empty />}</ChartCard>
        <ChartCard title="जोड व्यवसाय / Side Business">{side.length ? <BarCh horizontal data={A.groupCount(side, (r) => A.txt(e(r).side_business_details) || "—")} color="#f59e0b" /> : <Empty />}</ChartCard>
        <ChartCard title="गावनिहाय उद्योजक / Entrepreneurs by Village">{entrepreneurs.length ? <BarCh horizontal data={A.groupCount(entrepreneurs, (r) => A.txt(r.village))} color="#10b981" /> : <Empty />}</ChartCard>
      </G>
      <DataTable
        title="Business & Entrepreneurship Report"
        columns={[{ key: "head", label: "Family Head" }, { key: "business", label: "Business" }, { key: "address", label: "Business Location" }, { key: "side", label: "Side Business" }, { key: "village", label: "Village" }]}
        rows={[...entrepreneurs, ...side.filter((r) => !entrepreneurs.includes(r))].map((r) => ({
          head: r.head_name, business: e(r).entrepreneur_details, address: e(r).entrepreneur_address,
          side: e(r).side_business_details, village: r.village,
        }))}
      />
    </div>
  );
}

/* ============================================================== 17 Women */

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
        <Kpi tone="violet" label="Bachat Gat Members" value={shg((g) => g.is_member)} />
        <Kpi tone="cyan" label="Interested in Bachat Gat" value={shg((g) => g.wants_to_join)} />
        <Kpi tone="lime" label="Running Home Business" value={shg((g) => g.has_rural_home_business)} />
        <Kpi tone="primary" label="Interested in Business" value={shg((g) => g.wants_to_start_business)} />
        <Kpi tone="red" label="Ladki Bahin Beneficiary Families" value={rows.filter((r) => b(r).ladki_bahin).length} />
      </KpiGrid>
      <G>
        <ChartCard title="महिला बचत गट / Self Help Group"><PieCh donut data={[{ name: "सदस्य", value: shg((g) => g.is_member) }, { name: "सहभागी होऊ इच्छिते", value: shg((g) => g.wants_to_join) }, { name: "इतर", value: Math.max(0, women.length - shg((g) => g.is_member) - shg((g) => g.wants_to_join)) }]} /></ChartCard>
        <ChartCard title="महिला वयोगट / Women by Age Group"><BarCh data={A.AGE_BANDS.map((band) => ({ name: band.name, value: women.filter((w) => typeof w.age === "number" && band.test(w.age)).length }))} color="#ec4899" /></ChartCard>
        <ChartCard title="महिला शिक्षण / Women by Education"><BarCh horizontal data={A.groupCount(women.filter((w) => w.education) as any, (w: any) => A.eduLevel(w.education))} color="#8b5cf6" /></ChartCard>
        <ChartCard title="महिला व्यवसाय / Women by Occupation"><BarCh horizontal data={A.groupCount(women.filter((w) => w.occupation) as any, (w: any) => A.occGroup(w.occupation))} color="#10b981" /></ChartCard>
      </G>
      <DataTable
        title="Women Business & Bachat Gat Detail"
        columns={[{ key: "name", label: "Name" }, { key: "village", label: "Village" }, { key: "member", label: "Bachat Gat" }, { key: "interest", label: "Interested" }, { key: "business", label: "Home Business" }, { key: "want", label: "Wants Business" }]}
        rows={women.filter((w) => w.bachat_gat).map((w) => ({
          name: w.name, village: A.txt(w.row.village),
          member: w.bachat_gat.is_member ? "होय" : "नाही",
          interest: w.bachat_gat.wants_to_join ? "होय" : "—",
          business: w.bachat_gat.business_name || (w.bachat_gat.has_rural_home_business ? "होय" : "नाही"),
          want: w.bachat_gat.desired_business || (w.bachat_gat.wants_to_start_business ? "होय" : "—"),
        }))}
      />
    </div>
  );
}

/* ================================================= 18 Human Resources */

function HumanResources({ people }: Ctx) {
  const list = A.PROFESSIONS.map((p) => ({ name: p.name, value: people.filter((x) => A.professionOf(x.occupation) === p.name).length }));
  const professionals = people.filter((p) => A.professionOf(p.occupation));
  return (
    <div className="space-y-4">
      <KpiGrid>
        {list.map((l) => <Kpi key={l.name} label={l.name} value={l.value} tone="primary" />)}
      </KpiGrid>
      <G>
        <ChartCard title="व्यावसायिक मनुष्यबळ / Professional Categories"><BarCh horizontal data={list.filter((l) => l.value > 0)} color="#2563eb" /></ChartCard>
        <ChartCard title="व्यवसाय × जिल्हा / Profession × District">
          <StackedBar
            columns={list.filter((l) => l.value > 0).slice(0, 6).map((l) => l.name)}
            data={[...new Set(professionals.map((p) => A.txt(p.row.district)))].map((d) => {
              const sub = professionals.filter((p) => A.txt(p.row.district) === d);
              const o: any = { name: d || "—" };
              sub.forEach((p) => { const k = A.professionOf(p.occupation)!; o[k] = (o[k] || 0) + 1; });
              return o;
            })}
          />
        </ChartCard>
        <ChartCard title="व्यवसाय × शिक्षण / Profession × Education">
          <StackedBar
            columns={[...new Set(professionals.map((p) => A.eduLevel(p.education)))].slice(0, 8)}
            data={list.filter((l) => l.value > 0).map((l) => {
              const sub = professionals.filter((p) => A.professionOf(p.occupation) === l.name);
              const o: any = { name: l.name.split(" / ")[0]! };
              sub.forEach((p) => { const k = A.eduLevel(p.education); o[k] = (o[k] || 0) + 1; });
              return o;
            })}
          />
        </ChartCard>
        <ChartCard title="व्यवसाय × वयोगट / Profession × Age">
          <StackedBar
            columns={A.AGE_BANDS.map((b) => b.name)}
            data={list.filter((l) => l.value > 0).map((l) => {
              const sub = professionals.filter((p) => A.professionOf(p.occupation) === l.name);
              const o: any = { name: l.name.split(" / ")[0]! };
              A.AGE_BANDS.forEach((b) => { o[b.name] = sub.filter((p) => typeof p.age === "number" && b.test(p.age)).length; });
              return o;
            })}
          />
        </ChartCard>
      </G>
      <DataTable
        title="Community Human Resource Directory"
        columns={[{ key: "name", label: "Name" }, { key: "profession", label: "Profession" }, { key: "education", label: "Education" }, { key: "village", label: "Village" }, { key: "taluka", label: "Taluka" }, { key: "district", label: "District" }]}
        rows={professionals.map((p) => ({
          name: p.name, profession: A.professionOf(p.occupation), education: p.education,
          village: A.txt(p.row.village), taluka: A.txt(p.row.taluka), district: A.txt(p.row.district),
        }))}
      />
    </div>
  );
}

/* =============================================================== 19 Needs */

function Needs({ rows, people }: Ctx) {
  const d = (r: A.Row, key: string) => ((r.farming_tools_details || {}) as any)[key] || {};
  const equipNeed = rows.filter((r) => A.TOOL_KEYS.some((k) => d(r, k.key).want_to_buy)).length;
  const equipLoan = rows.filter((r) => A.TOOL_KEYS.some((k) => d(r, k.key).needs_loan)).length;
  const women = people.filter((p) => p.gender === "स्त्री" && p.bachat_gat);
  const items = [
    { name: "घरकुल आवश्यक / Gharkul Required", value: rows.filter((r) => r.gharkul_wanted).length },
    { name: "सोलर आवश्यक / Solar Required", value: rows.filter((r) => r.solar_panel_wanted).length },
    { name: "वैद्यकीय मदत / Medical Assistance", value: rows.filter((r) => (r.benefits_info || {}).medical_aid_needed).length },
    { name: "शेती साधने / Equipment Required", value: equipNeed },
    { name: "शेती कर्ज / Agricultural Loan", value: equipLoan },
    { name: "बेरोजगार सदस्य / Unemployed", value: people.filter((p) => A.occGroup(p.occupation) === "बेरोजगार / Unemployed").length },
    { name: "व्यवसाय सुरू करण्याची इच्छा / Startup Interest", value: women.filter((w) => w.bachat_gat.wants_to_start_business).length },
    { name: "बचत गट सहभाग इच्छुक / Bachat Gat Interest", value: women.filter((w) => w.bachat_gat.wants_to_join).length },
  ];
  return (
    <div className="space-y-4">
      <KpiGrid>
        {items.map((i) => <Kpi key={i.name} label={i.name} value={i.value} tone="amber" icon={HandHeart} />)}
      </KpiGrid>
      <G>
        <ChartCard title="समाजाच्या गरजा / Community Needs" wide><BarCh horizontal data={items} color="#f59e0b" /></ChartCard>
      </G>
      <DataTable
        title="Village-wise Needs Report"
        columns={[{ key: "name", label: "Village" }, { key: "gharkul", label: "Gharkul" }, { key: "solar", label: "Solar" }, { key: "medical", label: "Medical" }, { key: "equipment", label: "Equipment" }, { key: "loan", label: "Loan" }]}
        rows={A.uniq(rows, (r) => A.txt(r.village)).map((v) => {
          const sub = rows.filter((r) => A.txt(r.village) === v);
          return {
            name: v,
            gharkul: sub.filter((r) => r.gharkul_wanted).length,
            solar: sub.filter((r) => r.solar_panel_wanted).length,
            medical: sub.filter((r) => (r.benefits_info || {}).medical_aid_needed).length,
            equipment: sub.filter((r) => A.TOOL_KEYS.some((k) => d(r, k.key).want_to_buy)).length,
            loan: sub.filter((r) => A.TOOL_KEYS.some((k) => d(r, k.key).needs_loan)).length,
          };
        })}
      />
    </div>
  );
}

/* ======================================================== 20 Survey Users */

function SurveyUsers({ rows, appUsers, isAdmin }: Ctx) {
  if (!isAdmin) return <Card><CardContent className="p-6 text-sm text-muted-foreground">ही माहिती फक्त प्रशासकांसाठी उपलब्ध आहे.</CardContent></Card>;
  const byUser = appUsers.map((u) => {
    const sub = rows.filter((r) => r.created_by === u.id);
    return {
      name: u.full_name || u.email,
      surveys: sub.length,
      families: sub.length,
      members: A.allPersons(sub).length,
      villages: A.uniq(sub, (r) => A.txt(r.village)).length,
      last: sub[0] ? new Date(sub[0].created_at).toLocaleDateString("en-GB") : "—",
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
      </G>
      <DataTable
        title="Survey User Performance"
        columns={[{ key: "name", label: "Survey User" }, { key: "surveys", label: "Surveys" }, { key: "families", label: "Families" }, { key: "members", label: "Members" }, { key: "villages", label: "Villages" }, { key: "last", label: "Last Submission" }]}
        rows={byUser}
      />
    </div>
  );
}

/* ============================================================ 21 Progress */

function ProgressSec({ rows }: Ctx) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const weekStart = new Date(today); weekStart.setDate(today.getDate() - 6);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const since = (d: Date) => rows.filter((r) => new Date(r.created_at) >= d).length;
  return (
    <div className="space-y-4">
      <KpiGrid>
        <Kpi icon={TrendingUp} label="Submitted Today" value={since(today)} />
        <Kpi tone="green" label="This Week" value={since(weekStart)} />
        <Kpi tone="amber" label="This Month" value={since(monthStart)} />
        <Kpi tone="violet" label="Total Submitted" value={rows.length} />
      </KpiGrid>
      <G>
        <ChartCard title="दैनिक प्रगती / Daily Submission (30 days)" wide><LineCh data={A.trend(rows, 30)} /></ChartCard>
        <ChartCard title="जिल्हानिहाय प्रगती / District Progress"><BarCh data={A.groupCount(rows, (r) => A.txt(r.district))} color="#10b981" /></ChartCard>
        <ChartCard title="गावनिहाय प्रगती / Village Progress"><BarCh horizontal data={A.groupCount(rows, (r) => A.txt(r.village))} color="#f59e0b" /></ChartCard>
      </G>
      <DataTable
        title="Daily Submission Report"
        columns={[{ key: "name", label: "Date" }, { key: "value", label: "Surveys" }]}
        rows={A.trend(rows, 30).slice().reverse()}
      />
    </div>
  );
}

/* ============================================================= 22 Quality */

function Quality({ rows }: Ctx) {
  const comp = A.completeness(rows);
  const missing = (f: (r: A.Row) => boolean) => rows.filter(f).length;
  const complete = rows.filter((r) => r.head_name && r.village && r.mobile && r.education && r.occupation && (r.members || []).length > 0).length;
  return (
    <div className="space-y-4">
      <KpiGrid>
        <Kpi icon={CheckCircle2} label="Total Records" value={rows.length} />
        <Kpi tone="green" label="Complete Records" value={complete} />
        <Kpi tone="red" label="Incomplete Records" value={rows.length - complete} />
        <Kpi tone="amber" label="Duplicate Records" value={A.duplicates(rows)} />
        <Kpi tone="violet" label="Missing Mobile" value={missing((r) => !A.txt(r.mobile))} />
        <Kpi tone="violet" label="Missing Pincode" value={missing((r) => !A.txt(r.pincode))} />
        <Kpi tone="cyan" label="Missing Education" value={missing((r) => !A.txt(r.education))} />
        <Kpi tone="cyan" label="Missing Occupation" value={missing((r) => !A.txt(r.occupation))} />
        <Kpi tone="lime" label="Missing Agriculture Data" value={missing((r) => r.has_farmland == null)} />
        <Kpi tone="pink" label="Missing Family Members" value={missing((r) => !(r.members || []).length)} />
        <Kpi tone="green" label="Overall Data Completion" value={`${comp.overall}%`} />
      </KpiGrid>
      <G>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">विभागनिहाय पूर्णता / Section-wise Completion</CardTitle></CardHeader>
          <CardContent><CompletionList items={comp.per} /></CardContent>
        </Card>
        <ChartCard title="त्रुटी / Missing Data"><BarCh horizontal color="#ef4444" data={[
          { name: "Mobile", value: missing((r) => !A.txt(r.mobile)) },
          { name: "Pincode", value: missing((r) => !A.txt(r.pincode)) },
          { name: "Education", value: missing((r) => !A.txt(r.education)) },
          { name: "Occupation", value: missing((r) => !A.txt(r.occupation)) },
          { name: "Agriculture", value: missing((r) => r.has_farmland == null) },
          { name: "Members", value: missing((r) => !(r.members || []).length) },
        ]} /></ChartCard>
      </G>
      <DataTable
        title="Incomplete Records"
        columns={[{ key: "head", label: "Family Head" }, { key: "village", label: "Village" }, { key: "missing", label: "Missing Fields" }, { key: "date", label: "Created" }]}
        rows={rows.filter((r) => !(r.head_name && r.village && r.mobile && r.education && r.occupation && (r.members || []).length)).map((r) => ({
          head: r.head_name, village: r.village,
          missing: [!A.txt(r.mobile) && "Mobile", !A.txt(r.pincode) && "Pincode", !A.txt(r.education) && "Education", !A.txt(r.occupation) && "Occupation", !(r.members || []).length && "Members"].filter(Boolean).join(", "),
          date: new Date(r.created_at).toLocaleDateString("en-GB"),
        }))}
      />
    </div>
  );
}

/* ======================================================= 23 Cross Analytics */

function CrossAnalytics({ rows }: Ctx) {
  const [d1, setD1] = useState("district");
  const [d2, setD2] = useState("occupation");
  const { columns, data, unit } = useMemo(() => A.crossTab(rows, d1, d2), [rows, d1, d2]);
  const tableCols = [{ key: "name", label: A.DIMENSIONS.find((d) => d.id === d1)!.label }, ...columns.map((c) => ({ key: c, label: c })), { key: "total", label: "Total" }];
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-3 flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <div className="text-[10px] text-muted-foreground">Dimension 1</div>
            <Select value={d1} onValueChange={setD1}>
              <SelectTrigger className="h-8 w-52 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{A.DIMENSIONS.map((d) => <SelectItem key={d.id} value={d.id} className="text-xs">{d.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <div className="text-[10px] text-muted-foreground">Dimension 2</div>
            <Select value={d2} onValueChange={setD2}>
              <SelectTrigger className="h-8 w-52 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{A.DIMENSIONS.map((d) => <SelectItem key={d.id} value={d.id} className="text-xs">{d.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Badge variant="secondary" className="text-xs">Metric: {unit}</Badge>
        </CardContent>
      </Card>
      <ChartCard title={`${A.DIMENSIONS.find((d) => d.id === d1)!.label} × ${A.DIMENSIONS.find((d) => d.id === d2)!.label}`} wide>
        <StackedBar data={data} columns={columns} />
      </ChartCard>
      <DataTable title="Cross Analytics Table" columns={tableCols} rows={data} />
    </div>
  );
}

/* =========================================================== 24 Reports */

function Reports({ rows }: Ctx) {
  const villages = A.uniq(rows, (r) => A.txt(r.village));
  const people = (v: string) => A.allPersons(rows.filter((r) => A.txt(r.village) === v));
  return (
    <div className="space-y-4">
      <DataTable
        title="Village Master Report"
        columns={[
          { key: "name", label: "Village" }, { key: "families", label: "Families" }, { key: "members", label: "Members" },
          { key: "male", label: "Male" }, { key: "female", label: "Female" }, { key: "farmers", label: "Farmers" },
          { key: "graduates", label: "Graduates" }, { key: "govt", label: "Govt Jobs" }, { key: "houses", label: "Own Houses" },
          { key: "gharkul", label: "Gharkul Need" },
        ]}
        rows={villages.map((v) => {
          const sub = rows.filter((r) => A.txt(r.village) === v);
          const ppl = people(v);
          return {
            name: v, families: sub.length, members: ppl.length,
            male: ppl.filter((p) => p.gender === "पुरुष").length,
            female: ppl.filter((p) => p.gender === "स्त्री").length,
            farmers: sub.filter((r) => r.has_farmland).length,
            graduates: ppl.filter((p) => ["पदवी / Graduate", "पदव्युत्तर / Postgraduate", "डॉक्टरेट / Ph.D."].includes(A.eduLevel(p.education))).length,
            govt: ppl.filter((p) => A.occGroup(p.occupation) === "सरकारी कर्मचारी").length,
            houses: sub.filter((r) => r.owns_house).length,
            gharkul: sub.filter((r) => r.gharkul_wanted).length,
          };
        })}
      />
      <DataTable
        title="Family Master Report"
        columns={[
          { key: "head", label: "Family Head" }, { key: "mobile", label: "Mobile" }, { key: "village", label: "Village" },
          { key: "taluka", label: "Taluka" }, { key: "district", label: "District" }, { key: "members", label: "Members" },
          { key: "occupation", label: "Occupation" }, { key: "education", label: "Education" },
          { key: "land", label: "Land (Acre)" }, { key: "house", label: "House" }, { key: "date", label: "Created" },
        ]}
        rows={rows.map((r) => ({
          head: r.head_name, mobile: r.mobile, village: r.village, taluka: r.taluka, district: r.district,
          members: A.personsOf(r).length, occupation: r.occupation, education: r.education,
          land: r.has_farmland ? A.num(r.total_farmland) : 0,
          house: r.house_type || (r.owns_house ? "स्वतःचे" : "—"),
          date: new Date(r.created_at).toLocaleDateString("en-GB"),
        }))}
        pageSize={15}
      />
    </div>
  );
}
