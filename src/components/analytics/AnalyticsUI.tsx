import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, LabelList,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { FileSpreadsheet, FileText, Printer, ChevronsUpDown, Search, Maximize2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import type { Datum } from "@/lib/analytics";

export const CHART_COLORS = [
  "#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
  "#06b6d4", "#ec4899", "#84cc16", "#f97316", "#14b8a6",
  "#6366f1", "#d946ef",
];

/* ------------------------------------------------------------------- cards */

export function Kpi({
  label, value, hint, icon: Icon, tone = "primary",
}: {
  label: string; value: string | number; hint?: string; icon?: any; tone?: string;
}) {
  return (
    <Card className="overflow-hidden border-l-4" style={{ borderLeftColor: toneColor(tone) }}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {Icon && (
            <div
              className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: `${toneColor(tone)}1a`, color: toneColor(tone) }}
            >
              <Icon className="h-4.5 w-4.5" />
            </div>
          )}
          <div className="min-w-0">
            <div className="text-xl font-bold leading-tight">{value}</div>
            <div className="text-[11px] leading-snug text-muted-foreground break-words">{label}</div>
            {hint && <div className="text-[10px] text-muted-foreground/80 mt-0.5">{hint}</div>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function toneColor(tone: string) {
  const map: Record<string, string> = {
    primary: "#2563eb", green: "#10b981", amber: "#f59e0b", red: "#ef4444",
    violet: "#8b5cf6", cyan: "#06b6d4", pink: "#ec4899", lime: "#84cc16",
  };
  return map[tone] ?? map["primary"]!;
}

export function KpiGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-4 gap-3">{children}</div>;
}

export function SectionHeader({ title, subtitle, icon: Icon }: { title: string; subtitle?: string; icon?: any }) {
  return (
    <div className="flex items-start gap-3 border-b pb-3">
      {Icon && (
        <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Icon className="h-5 w-5" />
        </div>
      )}
      <div className="min-w-0">
        <h2 className="text-lg md:text-xl font-bold leading-tight">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ charts */

export function ChartCard({
  title, subtitle, children, wide, actions, h = 300, expand,
}: { title: string; subtitle?: string; children: React.ReactNode; wide?: boolean; actions?: React.ReactNode; h?: number; expand?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <Card className={wide ? "md:col-span-2" : ""}>
      <CardHeader className="pb-2 flex-row items-start justify-between gap-2 space-y-0">
        <div className="min-w-0">
          <CardTitle className="text-sm font-semibold leading-tight">{title}</CardTitle>
          {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {actions}
          {expand && (
            <Button size="sm" variant="outline" className="h-7 text-[11px] px-2" onClick={() => setOpen(true)}>
              <Maximize2 className="h-3 w-3 mr-1" />सर्व पहा / View more
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-2" style={{ height: h }}>{children}</CardContent>
      {expand && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-6xl">
            <DialogHeader>
              <DialogTitle className="text-base">{title}</DialogTitle>
              {subtitle && <DialogDescription className="text-xs">{subtitle} — संपूर्ण माहिती / complete data</DialogDescription>}
            </DialogHeader>
            <div className="h-[72vh] overflow-y-auto pr-1">{expand}</div>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}

export function Empty({ label = "निवडलेल्या फिल्टरसाठी माहिती उपलब्ध नाही / No data available for the selected filters." }) {
  return (
    <div className="h-full flex items-center justify-center text-center text-xs text-muted-foreground px-4">
      {label}
    </div>
  );
}

const tipStyle = {
  contentStyle: { fontSize: 11, borderRadius: 8, border: "1px solid hsl(var(--border))" },
  labelStyle: { fontWeight: 600 },
} as const;

/** Bar / column chart with value labels on every bar so each record is identifiable. */
export function BarCh({
  data, color = CHART_COLORS[0], horizontal, multi, unit = "संख्या / Count", limit = 15, labels = true,
}: {
  data: Datum[]; color?: string; horizontal?: boolean; multi?: boolean;
  unit?: string; limit?: number; labels?: boolean;
}) {
  if (!data.length) return <Empty />;
  const top = data.slice(0, limit);
  const longest = Math.max(...top.map((d) => d.name.length));
  const yWidth = horizontal ? Math.min(180, Math.max(90, (Number.isFinite(longest) ? longest : 10) * 7)) : undefined;
  return (
    <ResponsiveContainer>
      <BarChart
        data={top}
        layout={horizontal ? "vertical" : "horizontal"}
        margin={{ left: 0, right: horizontal ? 30 : 8, top: 14, bottom: 4 }}
        barCategoryGap="20%"
      >
        <CartesianGrid strokeDasharray="3 3" opacity={0.35} />
        <XAxis
          {...(horizontal
            ? { type: "number" as const, allowDecimals: false }
            : { dataKey: "name", interval: 0 as const, angle: -25, textAnchor: "end", height: Math.min(110, 40 + longest * 4) })}
          fontSize={10}
        />
        <YAxis
          {...(horizontal
            ? { type: "category" as const, dataKey: "name", width: yWidth, interval: 0 as const, tickLine: false }
            : { allowDecimals: false })}
          fontSize={10}
        />

        <Tooltip {...tipStyle} formatter={(v: any) => [v, unit]} />
        <Bar dataKey="value" name={unit} fill={color} radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]} maxBarSize={horizontal ? 22 : 44}>
          {multi && top.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
          {labels && (
            <LabelList dataKey="value" position={horizontal ? "right" : "top"} fontSize={10} className="fill-foreground" />
          )}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Grouped (clustered) bars — e.g. Male vs Female per district. */
export function GroupedBar({
  data, series, horizontal, limit = 12, stacked,
}: {
  data: any[]; series: { key: string; label?: string; color?: string }[];
  horizontal?: boolean; limit?: number; stacked?: boolean;
}) {
  if (!data.length) return <Empty />;
  const top = data.slice(0, limit);
  const longest = Math.max(...top.map((d) => String(d.name ?? "").length));
  return (
    <ResponsiveContainer>
      <BarChart data={top} layout={horizontal ? "vertical" : "horizontal"} margin={{ left: 4, right: 20, top: 14, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.35} />
        <XAxis
          {...(horizontal
            ? { type: "number" as const, allowDecimals: false }
            : { dataKey: "name", interval: 0 as const, angle: -25, textAnchor: "end", height: Math.min(110, 40 + longest * 4) })}
          fontSize={10}
        />
        <YAxis
          {...(horizontal
            ? { type: "category" as const, dataKey: "name", width: Math.min(180, Math.max(90, longest * 7)), interval: 0 as const, tickLine: false }
            : { allowDecimals: false })}
          fontSize={10}
        />

        <Tooltip {...tipStyle} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        {series.map((s, i) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.label ?? s.key}
            stackId={stacked ? "a" : undefined}
            fill={s.color ?? CHART_COLORS[i % CHART_COLORS.length]}
            radius={stacked ? undefined : horizontal ? [0, 3, 3, 0] : [3, 3, 0, 0]}
            maxBarSize={26}
          >
            <LabelList dataKey={s.key} position={stacked ? "inside" : horizontal ? "right" : "top"} fontSize={9} className="fill-foreground" formatter={(v: any) => (v ? v : "")} />
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function PieCh({ data, donut, unit = "संख्या / Count" }: { data: Datum[]; donut?: boolean; unit?: string }) {
  const clean = data.filter((d) => d.value > 0);
  if (!clean.length) return <Empty />;
  const total = clean.reduce((a, b) => a + b.value, 0);
  const single = clean.length === 1;
  const label = (e: any) => {
    const share = Math.round((e.value / total) * 1000) / 10;
    if (share < 4) return "";
    const rIn = e.innerRadius || 0;
    const r = rIn + (e.outerRadius - rIn) * (donut ? 0.5 : 0.62);
    const rad = -(e.midAngle * Math.PI) / 180;
    const x = e.cx + r * Math.cos(rad);
    const y = e.cy + r * Math.sin(rad);
    return (
      <text x={single && donut ? e.cx : x} y={single && donut ? e.cy : y} textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600} fill={single && donut ? "currentColor" : "#fff"} className={single && donut ? "fill-foreground" : ""}>
        {`${e.value} (${share}%)`}
      </text>
    );
  };
  return (
    <ResponsiveContainer>
      <PieChart margin={{ top: 6, bottom: 6, left: 6, right: 6 }}>
        <Pie
          data={clean}
          dataKey="value"
          nameKey="name"
          outerRadius="74%"
          innerRadius={donut ? "46%" : 0}
          paddingAngle={single ? 0 : 1.5}
          labelLine={false}
          label={label as any}
        >
          {clean.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="hsl(var(--background))" strokeWidth={1} />)}
        </Pie>
        <Tooltip {...tipStyle} formatter={(v: any, n: any) => [`${v} ${unit} · ${Math.round((Number(v) / total) * 1000) / 10}%`, n]} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}


export function LineCh({ data }: { data: Datum[] }) {
  if (!data.length) return <Empty />;
  return (
    <ResponsiveContainer>
      <LineChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.4} />
        <XAxis dataKey="name" fontSize={10} interval={Math.max(0, Math.floor(data.length / 10))} />
        <YAxis fontSize={10} allowDecimals={false} />
        <Tooltip {...tipStyle} />
        <Line type="monotone" dataKey="value" stroke={CHART_COLORS[0]} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function StackedBar({ data, columns }: { data: any[]; columns: string[] }) {
  if (!data.length) return <Empty />;
  return (
    <ResponsiveContainer>
      <BarChart data={data.slice(0, 15)} margin={{ left: 0, right: 8, top: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.35} />
        <XAxis dataKey="name" fontSize={10} interval={0} angle={-25} textAnchor="end" height={64} />
        <YAxis fontSize={10} allowDecimals={false} />
        <Tooltip {...tipStyle} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        {columns.slice(0, 10).map((c, i) => (
          <Bar key={c} dataKey={c} stackId="a" fill={CHART_COLORS[i % CHART_COLORS.length]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}


/* ------------------------------------------------------------------ tables */

export type Col = { key: string; label: string };

export function DataTable({
  title, columns, rows, pageSize = 10, exports = true,
}: { title: string; columns: Col[]; rows: any[]; pageSize?: number; exports?: boolean }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null);
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState(false);


  const filtered = useMemo(() => {
    let out = rows;
    if (q.trim()) {
      const s = q.toLowerCase();
      out = out.filter((r) => columns.some((c) => String(r[c.key] ?? "").toLowerCase().includes(s)));
    }
    if (sort) {
      out = [...out].sort((a, b) => {
        const x = a[sort.key], y = b[sort.key];
        if (typeof x === "number" && typeof y === "number") return (x - y) * sort.dir;
        return String(x ?? "").localeCompare(String(y ?? "")) * sort.dir;
      });
    }
    return out;
  }, [rows, q, sort, columns]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pages - 1);
  const view = filtered.slice(current * pageSize, current * pageSize + pageSize);

  const doExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      filtered.map((r) => columns.reduce<Record<string, any>>((a, c) => ((a[c.label] = r[c.key]), a), {})),
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, `${title.replace(/[^\w-]+/g, "_")}.xlsx`);
  };
  const doPdf = () => {
    const doc = new jsPDF({ orientation: columns.length > 6 ? "landscape" : "portrait" });
    doc.setFontSize(13);
    doc.text(title, 14, 14);
    autoTable(doc, {
      startY: 20,
      head: [columns.map((c) => c.label)],
      body: filtered.map((r) => columns.map((c) => String(r[c.key] ?? ""))),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [37, 99, 235] },
    });
    doc.save(`${title.replace(/[^\w-]+/g, "_")}.pdf`);
  };

  const head = (
    <TableHeader>
      <TableRow>
        {columns.map((c) => (
          <TableHead
            key={c.key}
            className="whitespace-nowrap text-xs cursor-pointer select-none"
            onClick={() => setSort((s) => (s?.key === c.key ? { key: c.key, dir: s.dir === 1 ? -1 : 1 } : { key: c.key, dir: -1 }))}
          >
            <span className="inline-flex items-center gap-1">{c.label}<ChevronsUpDown className="h-3 w-3 opacity-40" /></span>
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  );

  const body = (data: any[]) => (
    <TableBody>
      {data.length === 0 && (
        <TableRow><TableCell colSpan={columns.length} className="text-center text-xs text-muted-foreground py-6">माहिती उपलब्ध नाही / No data</TableCell></TableRow>
      )}
      {data.map((r, i) => (
        <TableRow key={i}>
          {columns.map((c) => <TableCell key={c.key} className="text-xs whitespace-nowrap">{String(r[c.key] ?? "—")}</TableCell>)}
        </TableRow>
      ))}
    </TableBody>
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-sm font-semibold">{title}</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} placeholder="शोधा / Search" className="h-8 w-40 pl-7 text-xs" />
            </div>
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setOpen(true)}>
              <Maximize2 className="h-3.5 w-3.5 mr-1" />सर्व पहा / View all
            </Button>
            {exports && (
              <>
                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={doExcel}><FileSpreadsheet className="h-3.5 w-3.5 mr-1" />Excel</Button>
                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={doPdf}><FileText className="h-3.5 w-3.5 mr-1" />PDF</Button>
                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => window.print()}><Printer className="h-3.5 w-3.5 mr-1" />Print</Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-md border">
          <Table>
            {head}
            {body(view)}
          </Table>
        </div>
        {pages > 1 && (
          <div className="flex items-center justify-between mt-3 text-xs">
            <span className="text-muted-foreground">{filtered.length} नोंदी / records</span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="h-7 text-xs" disabled={current === 0} onClick={() => setPage(current - 1)}>मागे</Button>
              <span>{current + 1} / {pages}</span>
              <Button size="sm" variant="outline" className="h-7 text-xs" disabled={current >= pages - 1} onClick={() => setPage(current + 1)}>पुढे</Button>
            </div>
          </div>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle className="text-base">{title}</DialogTitle>
            <DialogDescription className="text-xs">
              {filtered.length} नोंदी / records — संपूर्ण माहिती / complete data
            </DialogDescription>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="शोधा / Search" className="h-8 w-56 pl-7 text-xs" />
          </div>
          <div className="max-h-[65vh] overflow-auto rounded-md border">
            <Table>
              {head}
              {body(filtered)}
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}


export function CompletionList({ items }: { items: Datum[] }) {
  return (
    <div className="space-y-3">
      {items.map((i) => (
        <div key={i.name}>
          <div className="flex justify-between text-xs mb-1">
            <span>{i.name}</span>
            <Badge variant="secondary" className="text-[10px]">{i.value}%</Badge>
          </div>
          <Progress value={i.value} className="h-2" />
        </div>
      ))}
    </div>
  );
}
