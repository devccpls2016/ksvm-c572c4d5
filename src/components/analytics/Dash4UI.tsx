import { createContext, useContext, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { FileSpreadsheet, FileText, Printer, ChevronRight } from "lucide-react";
import * as A from "@/lib/analytics";
import { CHART_COLORS, Empty } from "@/components/analytics/AnalyticsUI";

/* =============================================================== drill-down */

export type DrillPayload = {
  title: string;
  persons?: A.Person[];
  families?: A.Row[];
  breadcrumb?: string[];
};

type DrillCtx = { open: (p: DrillPayload) => void };
const DrillContext = createContext<DrillCtx>({ open: () => {} });
export const useDrill = () => useContext(DrillContext);

export function DrillProvider({ children }: { children: React.ReactNode }) {
  const [stack, setStack] = useState<DrillPayload[]>([]);
  const current = stack[stack.length - 1];

  const open = (p: DrillPayload) => setStack((s) => [...s, p]);
  const close = () => setStack([]);

  return (
    <DrillContext.Provider value={{ open }}>
      {children}
      <Dialog open={!!current} onOpenChange={(o) => !o && close()}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">{current?.title}</DialogTitle>
          </DialogHeader>
          {stack.length > 1 && (
            <div className="flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground">
              {stack.map((s, i) => (
                <span key={i} className="flex items-center gap-1">
                  {i > 0 && <ChevronRight className="h-3 w-3" />}
                  <button
                    className={i === stack.length - 1 ? "font-semibold text-foreground" : "hover:underline"}
                    onClick={() => setStack((st) => st.slice(0, i + 1))}
                  >
                    {s.title}
                  </button>
                </span>
              ))}
            </div>
          )}
          {current && <DrillBody payload={current} onDrill={open} />}
        </DialogContent>
      </Dialog>
    </DrillContext.Provider>
  );
}

function DrillBody({ payload, onDrill }: { payload: DrillPayload; onDrill: (p: DrillPayload) => void }) {
  const persons = payload.persons;
  if (persons) {
    return (
      <MiniTable
        title={`${persons.length} सदस्य / members`}
        columns={[
          { key: "name", label: "Name / नाव" },
          { key: "rel", label: "Relation" },
          { key: "gender", label: "Gender" },
          { key: "age", label: "Age" },
          { key: "edu", label: "Education" },
          { key: "occ", label: "Occupation" },
          { key: "village", label: "Village" },
          { key: "taluka", label: "Taluka" },
          { key: "district", label: "District" },
        ]}
        rows={persons.map((p) => ({
          name: p.name || "—",
          rel: p.relationship || "—",
          gender: p.gender || "—",
          age: p.age ?? "—",
          edu: p.education || "—",
          occ: p.occupation || "—",
          village: A.txt(p.row.village),
          taluka: A.txt(p.row.taluka),
          district: A.txt(p.row.district),
          _row: p.row,
        }))}
        onRowClick={(r) =>
          onDrill({ title: `कुटुंब / Family — ${A.txt(r._row.head_name)}`, families: [r._row] })
        }
      />
    );
  }
  const families = payload.families ?? [];
  if (families.length === 1) return <FamilyProfile row={families[0]} onDrill={onDrill} />;
  return (
    <MiniTable
      title={`${families.length} कुटुंबे / families`}
      columns={[
        { key: "head", label: "Family Head / कुटुंब प्रमुख" },
        { key: "mobile", label: "Mobile" },
        { key: "members", label: "Members" },
        { key: "village", label: "Village" },
        { key: "taluka", label: "Taluka" },
        { key: "district", label: "District" },
        { key: "land", label: "Land (acre)" },
      ]}
      rows={families.map((r) => ({
        head: A.txt(r.head_name), mobile: A.txt(r.mobile), members: A.familySize(r),
        village: A.txt(r.village), taluka: A.txt(r.taluka), district: A.txt(r.district),
        land: A.num(r.total_farmland), _row: r,
      }))}
      onRowClick={(r) => onDrill({ title: `कुटुंब / Family — ${A.txt(r._row.head_name)}`, families: [r._row] })}
    />
  );
}

function FamilyProfile({ row, onDrill }: { row: A.Row; onDrill: (p: DrillPayload) => void }) {
  const b = (row.benefits_info || {}) as any;
  const e = (row.employment_info || {}) as any;
  const members = A.personsOf(row);
  const facts: [string, any][] = [
    ["कुटुंब प्रमुख / Head", row.head_name],
    ["मोबाईल / Mobile", row.mobile],
    ["गाव / Village", row.village],
    ["तालुका / Taluka", row.taluka],
    ["जिल्हा / District", row.district],
    ["पिनकोड / Pincode", row.pincode],
    ["सदस्य / Members", A.familySize(row)],
    ["शिक्षण / Education", row.education],
    ["व्यवसाय / Occupation", row.occupation],
    ["घर / House", `${row.owns_house ? "स्वतःचे" : "नाही"} · ${A.txt(row.house_type) || "—"}`],
    ["घरकुल / Gharkul", row.gharkul_received ? "मिळाले" : row.gharkul_wanted ? "आवश्यक" : "—"],
    ["शेती / Farmland", row.has_farmland ? `${A.num(row.total_farmland)} एकर` : "नाही"],
    ["सिंचित / Irrigated", row.irrigated_area],
    ["कोरडवाहू / Dryland", row.dryland_area],
    ["सोलर / Solar", row.solar_panel_installed ? "बसवले" : row.solar_panel_wanted ? "आवश्यक" : "—"],
    ["लाडकी बहीण / Ladki Bahin", b.ladki_bahin ? (b.ladki_bahin_regular ? "नियमित लाभ" : "अनियमित") : "—"],
    ["गंभीर आजार / Critical Illness", b.critical_illness ? A.txt(b.illness_type) || "होय" : "—"],
    ["खेळाडू / Sportsperson", b.has_sportsperson ? `${A.txt(b.sport_type)} (${A.txt(b.sport_level)})` : "—"],
    ["उद्योजक / Entrepreneur", e.has_entrepreneur ? A.txt(e.entrepreneur_details) || "होय" : "—"],
    ["सर्वेक्षण दिनांक / Date", new Date(row.created_at).toLocaleDateString("en-GB")],
  ];
  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {facts.map(([k, v]) => (
          <div key={k} className="rounded-lg border bg-muted/30 px-3 py-2">
            <div className="text-[10px] text-muted-foreground">{k}</div>
            <div className="text-xs font-medium break-words">{v === null || v === undefined || v === "" ? "—" : String(v)}</div>
          </div>
        ))}
      </div>
      <MiniTable
        title="कुटुंबातील सदस्य / Family Members"
        columns={[
          { key: "name", label: "Name" }, { key: "rel", label: "Relation" }, { key: "gender", label: "Gender" },
          { key: "age", label: "Age" }, { key: "marital", label: "Marital" }, { key: "edu", label: "Education" }, { key: "occ", label: "Occupation" },
        ]}
        rows={members.map((m) => ({
          name: m.name, rel: m.relationship, gender: m.gender, age: m.age ?? "—",
          marital: m.marital_status, edu: m.education, occ: m.occupation,
        }))}
      />
      {A.positionEntries(row).length > 0 && (
        <MiniTable
          title="धारण केलेले पद / Positions Held"
          columns={[
            { key: "type", label: "Type" }, { key: "status", label: "Status" }, { key: "level", label: "Level" },
            { key: "rep", label: "Representative" }, { key: "party", label: "Party" }, { key: "term", label: "Term" },
          ]}
          rows={A.positionEntries(row).map((p: any) => ({
            type: A.txt(p.type), status: A.txt(p.status), level: A.txt(p.political_level),
            rep: A.txt(p.representative_type), party: A.txt(p.party_name_other) || A.txt(p.party_name),
            term: [p.term_from, p.term_to].filter(Boolean).join(" – "),
          }))}
        />
      )}
      <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => onDrill({ title: "सर्व सदस्य / Members", persons: members })}>
        सदस्य यादी उघडा / Open member list
      </Button>
    </div>
  );
}

/* ================================================================= shells */

export type TableSpec = { title: string; columns: { key: string; label: string }[]; rows: any[] };

const ACCENTS: Record<string, string> = {
  blue: "#2563eb", green: "#10b981", amber: "#f59e0b", red: "#ef4444",
  violet: "#8b5cf6", cyan: "#06b6d4", pink: "#ec4899", lime: "#84cc16",
};

export function SectionShell({
  id, no, title, subtitle, icon: Icon, accent = "blue", tables = [], children,
}: {
  id: string; no: string; title: string; subtitle?: string; icon?: any;
  accent?: keyof typeof ACCENTS | string; tables?: TableSpec[]; children: React.ReactNode;
}) {
  const color = ACCENTS[accent] ?? ACCENTS["blue"]!;

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    (tables.length ? tables : [{ title, columns: [{ key: "info", label: "Info" }], rows: [{ info: "No tabular data" }] }]).forEach((t, i) => {
      const ws = XLSX.utils.json_to_sheet(
        t.rows.map((r) => t.columns.reduce<Record<string, any>>((a, c) => ((a[c.label] = r[c.key]), a), {})),
      );
      XLSX.utils.book_append_sheet(wb, ws, (t.title || `Sheet${i + 1}`).replace(/[^\w ]+/g, "").slice(0, 28) || `Sheet${i + 1}`);
    });
    XLSX.writeFile(wb, `${no}-${title.replace(/[^\w-]+/g, "_")}.xlsx`);
  };

  const exportPdf = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14);
    doc.text(`${no}. ${title}`, 14, 14);
    let y = 22;
    tables.forEach((t) => {
      doc.setFontSize(10);
      doc.text(t.title, 14, y);
      autoTable(doc, {
        startY: y + 3,
        head: [t.columns.map((c) => c.label)],
        body: t.rows.map((r) => t.columns.map((c) => String(r[c.key] ?? ""))),
        styles: { fontSize: 7 },
        headStyles: { fillColor: [37, 99, 235] },
      });
      y = ((doc as any).lastAutoTable?.finalY ?? y) + 12;
      if (y > 180) { doc.addPage(); y = 20; }
    });
    doc.save(`${no}-${title.replace(/[^\w-]+/g, "_")}.pdf`);
  };

  return (
    <section id={id} className="scroll-mt-20">
      <Card className="overflow-hidden border-t-4" style={{ borderTopColor: color }}>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              {Icon && (
                <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${color}1a`, color }}>
                  <Icon className="h-5 w-5" />
                </div>
              )}
              <div className="min-w-0">
                <CardTitle className="text-base md:text-lg font-bold leading-tight">
                  <span className="tabular-nums opacity-50 mr-1">{no}.</span>{title}
                </CardTitle>
                {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 print:hidden">
              <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={exportExcel}>
                <FileSpreadsheet className="h-3.5 w-3.5 mr-1" />Excel
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={exportPdf} disabled={!tables.length}>
                <FileText className="h-3.5 w-3.5 mr-1" />PDF
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => window.print()}>
                <Printer className="h-3.5 w-3.5 mr-1" />Print
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">{children}</CardContent>
      </Card>
    </section>
  );
}

export function Panel({ title, hint, children, className = "" }: { title: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border bg-card p-3 ${className}`}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="text-xs font-semibold">{title}</div>
        {hint && <Badge variant="secondary" className="text-[10px]">{hint}</Badge>}
      </div>
      {children}
    </div>
  );
}

export function ChartBox({ children, h = 260 }: { children: React.ReactNode; h?: number }) {
  return <div style={{ height: h }}>{children}</div>;
}

/* ================================================================ charts */

type Sel = (name: string) => void;

export function DBar({
  data, color = CHART_COLORS[0], horizontal, onSelect, limit = 18,
}: { data: A.Datum[]; color?: string; horizontal?: boolean; onSelect?: Sel; limit?: number }) {
  if (!data.length) return <Empty />;
  const top = data.slice(0, limit);
  const click = (e: any) => { if (onSelect && e?.activeLabel) onSelect(String(e.activeLabel)); };
  return (
    <ResponsiveContainer>
      <BarChart data={top} layout={horizontal ? "vertical" : "horizontal"} onClick={click}
        margin={{ left: horizontal ? 70 : 0, right: 10, top: 6, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.35} />
        {horizontal ? (
          <>
            <XAxis type="number" fontSize={10} allowDecimals={false} />
            <YAxis type="category" dataKey="name" fontSize={10} width={130} />
          </>
        ) : (
          <>
            <XAxis dataKey="name" fontSize={10} interval={0} angle={-20} textAnchor="end" height={58} />
            <YAxis fontSize={10} allowDecimals={false} />
          </>
        )}
        <Tooltip />
        <Bar dataKey="value" fill={color} radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]} cursor={onSelect ? "pointer" : undefined} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DPie({ data, donut, onSelect }: { data: A.Datum[]; donut?: boolean; onSelect?: Sel }) {
  const clean = data.filter((d) => d.value > 0);
  if (!clean.length) return <Empty />;
  return (
    <ResponsiveContainer>
      <PieChart>
        <Pie
          data={clean} dataKey="value" nameKey="name" outerRadius={88} innerRadius={donut ? 52 : 0}
          label={(e: any) => e.value}
          onClick={(e: any) => onSelect && e?.name && onSelect(String(e.name))}
          cursor={onSelect ? "pointer" : undefined}
        >
          {clean.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
        </Pie>
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function DLine({ data }: { data: A.Datum[] }) {
  if (!data.length) return <Empty />;
  return (
    <ResponsiveContainer>
      <LineChart data={data} margin={{ left: 0, right: 10, top: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.35} />
        <XAxis dataKey="name" fontSize={10} interval={Math.max(0, Math.floor(data.length / 10))} />
        <YAxis fontSize={10} allowDecimals={false} />
        <Tooltip />
        <Line type="monotone" dataKey="value" stroke={CHART_COLORS[0]} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function DStack({ data, columns, onSelect }: { data: any[]; columns: string[]; onSelect?: Sel }) {
  if (!data.length) return <Empty />;
  return (
    <ResponsiveContainer>
      <BarChart data={data.slice(0, 15)} margin={{ left: 0, right: 10, top: 6, bottom: 4 }}
        onClick={(e: any) => onSelect && e?.activeLabel && onSelect(String(e.activeLabel))}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.35} />
        <XAxis dataKey="name" fontSize={10} interval={0} angle={-20} textAnchor="end" height={58} />
        <YAxis fontSize={10} allowDecimals={false} />
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        {columns.slice(0, 10).map((c, i) => (
          <Bar key={c} dataKey={c} stackId="a" fill={CHART_COLORS[i % CHART_COLORS.length]} cursor={onSelect ? "pointer" : undefined} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ================================================================ tables */

export function MiniTable({
  title, columns, rows, onRowClick, max = 12,
}: {
  title?: string; columns: { key: string; label: string }[]; rows: any[];
  onRowClick?: (r: any) => void; max?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const view = expanded ? rows : rows.slice(0, max);
  return (
    <div className="space-y-2">
      {title && <div className="text-xs font-semibold">{title}</div>}
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((c) => <TableHead key={c.key} className="whitespace-nowrap text-[11px]">{c.label}</TableHead>)}
            </TableRow>
          </TableHeader>
          <TableBody>
            {view.length === 0 && (
              <TableRow><TableCell colSpan={columns.length} className="text-center text-[11px] text-muted-foreground py-5">माहिती उपलब्ध नाही / No data</TableCell></TableRow>
            )}
            {view.map((r, i) => (
              <TableRow key={i} className={onRowClick ? "cursor-pointer" : ""} onClick={() => onRowClick?.(r)}>
                {columns.map((c) => <TableCell key={c.key} className="text-[11px] whitespace-nowrap">{String(r[c.key] ?? "—")}</TableCell>)}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {rows.length > max && (
        <Button size="sm" variant="ghost" className="h-7 text-[11px]" onClick={() => setExpanded((v) => !v)}>
          {expanded ? "कमी दाखवा / Show less" : `सर्व ${rows.length} पहा / View all`}
        </Button>
      )}
    </div>
  );
}

export function StatBars({ items, total, onSelect }: { items: A.Datum[]; total?: number; onSelect?: Sel }) {
  const max = total ?? Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="space-y-2.5">
      {items.length === 0 && <div className="text-[11px] text-muted-foreground">माहिती उपलब्ध नाही / No data</div>}
      {items.map((i) => (
        <button key={i.name} className="w-full text-left" onClick={() => onSelect?.(i.name)} disabled={!onSelect}>
          <div className="flex justify-between text-[11px] mb-1">
            <span className="truncate pr-2">{i.name}</span>
            <span className="tabular-nums font-medium">{i.value}{total ? ` · ${A.pct(i.value, total)}%` : ""}</span>
          </div>
          <Progress value={max ? (i.value / max) * 100 : 0} className="h-2" />
        </button>
      ))}
    </div>
  );
}

export function NeedCard({ dot, label, value, hint, onClick }: { dot: string; label: string; value: number | string; hint?: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} disabled={!onClick}
      className="rounded-xl border p-3 text-left transition-colors hover:bg-muted/60 disabled:hover:bg-transparent">
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: dot }} />
        <span className="text-[11px] font-medium leading-tight">{label}</span>
      </div>
      <div className="text-2xl font-bold mt-1 tabular-nums">{value}</div>
      {hint && <div className="text-[10px] text-muted-foreground">{hint}</div>}
    </button>
  );
}

export function useMemoRows<T>(fn: () => T, deps: any[]): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(fn, deps);
}
