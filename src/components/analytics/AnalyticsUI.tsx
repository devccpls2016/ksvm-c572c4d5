import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { FileSpreadsheet, FileText, Printer, ChevronsUpDown, Search } from "lucide-react";
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
  title, children, wide, actions, note,
}: { title: string; children: React.ReactNode; wide?: boolean; actions?: React.ReactNode; note?: string }) {
  return (
    <Card className={wide ? "md:col-span-2" : ""}>
      <CardHeader className="pb-2 flex-row items-start justify-between gap-2 space-y-0">
        <div className="min-w-0">
          <CardTitle className="text-sm font-semibold">{title}</CardTitle>
          {note && <p className="text-[10px] leading-snug text-muted-foreground mt-1">{note}</p>}
        </div>
        {actions}
      </CardHeader>
      <CardContent className="h-[280px] pt-2">{children}</CardContent>
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

export function BarCh({ data, color = CHART_COLORS[0], horizontal }: { data: Datum[]; color?: string; horizontal?: boolean }) {
  if (!data.length) return <Empty />;
  const top = data.slice(0, 15);
  return (
    <ResponsiveContainer>
      <BarChart data={top} layout={horizontal ? "vertical" : "horizontal"} margin={{ left: horizontal ? 60 : 0, right: 8, top: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.4} />
        {horizontal ? (
          <>
            <XAxis type="number" fontSize={10} allowDecimals={false} />
            <YAxis type="category" dataKey="name" fontSize={10} width={110} />
          </>
        ) : (
          <>
            <XAxis dataKey="name" fontSize={10} interval={0} angle={-20} textAnchor="end" height={54} />
            <YAxis fontSize={10} allowDecimals={false} />
          </>
        )}
        <Tooltip />
        <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function PieCh({ data, donut }: { data: Datum[]; donut?: boolean }) {
  const clean = data.filter((d) => d.value > 0);
  if (!clean.length) return <Empty />;
  return (
    <ResponsiveContainer>
      <PieChart>
        <Pie data={clean} dataKey="value" nameKey="name" outerRadius={90} innerRadius={donut ? 52 : 0} label={(e: any) => e.value}>
          {clean.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
        </Pie>
        <Tooltip />
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
        <Tooltip />
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
        <CartesianGrid strokeDasharray="3 3" opacity={0.4} />
        <XAxis dataKey="name" fontSize={10} interval={0} angle={-20} textAnchor="end" height={54} />
        <YAxis fontSize={10} allowDecimals={false} />
        <Tooltip />
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
  title, columns, rows, pageSize = 10,
}: { title: string; columns: Col[]; rows: any[]; pageSize?: number }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null);
  const [page, setPage] = useState(0);

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
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={doExcel}><FileSpreadsheet className="h-3.5 w-3.5 mr-1" />Excel</Button>
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={doPdf}><FileText className="h-3.5 w-3.5 mr-1" />PDF</Button>
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => window.print()}><Printer className="h-3.5 w-3.5 mr-1" />Print</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-md border">
          <Table>
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
            <TableBody>
              {view.length === 0 && (
                <TableRow><TableCell colSpan={columns.length} className="text-center text-xs text-muted-foreground py-6">माहिती उपलब्ध नाही / No data</TableCell></TableRow>
              )}
              {view.map((r, i) => (
                <TableRow key={i}>
                  {columns.map((c) => <TableCell key={c.key} className="text-xs whitespace-nowrap">{String(r[c.key] ?? "—")}</TableCell>)}
                </TableRow>
              ))}
            </TableBody>
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
