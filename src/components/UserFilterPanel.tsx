import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Search, ChevronDown, RotateCcw, SlidersHorizontal, MapPin, ShieldCheck, CalendarRange } from "lucide-react";
import { ACCESS_SCOPES, ACCESS_SCOPE_LABELS, type AccessScope } from "@/lib/users.access";

export interface UserFilters {
  q: string;
  scope: AccessScope | "any";
  districts: string[];
  talukas: string[];
  villages: string[];
  status: "any" | "active" | "inactive";
  createdFrom: string;
  createdTo: string;
  loginFrom: string;
  loginTo: string;
}

export const emptyUserFilters: UserFilters = {
  q: "",
  scope: "any",
  districts: [],
  talukas: [],
  villages: [],
  status: "any",
  createdFrom: "",
  createdTo: "",
  loginFrom: "",
  loginTo: "",
};

function uniqSorted(v: string[]) {
  return Array.from(new Set(v.filter(Boolean))).sort((a, b) => a.localeCompare(b, "mr"));
}

export function countActiveUserFilters(f: UserFilters) {
  let n = 0;
  if (f.q.trim()) n++;
  if (f.scope !== "any") n++;
  if (f.districts.length) n++;
  if (f.talukas.length) n++;
  if (f.villages.length) n++;
  if (f.status !== "any") n++;
  if (f.createdFrom || f.createdTo) n++;
  if (f.loginFrom || f.loginTo) n++;
  return n;
}

function inRange(value: string | null | undefined, from: string, to: string) {
  if (!from && !to) return true;
  if (!value) return false;
  const d = new Date(value).getTime();
  if (from && d < new Date(`${from}T00:00:00`).getTime()) return false;
  if (to && d > new Date(`${to}T23:59:59`).getTime()) return false;
  return true;
}

export function filterUsers<T extends Record<string, any>>(rows: T[], f: UserFilters): T[] {
  const q = f.q.trim().toLowerCase();
  return rows.filter((r) => {
    if (q) {
      const hay = [r.full_name, r.email, r.mobile].filter(Boolean).join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    const scope: AccessScope = r.role === "admin" ? "all" : (r.access_scope || "all");
    if (f.scope !== "any" && scope !== f.scope) return false;
    if (f.status === "active" && !r.is_active) return false;
    if (f.status === "inactive" && r.is_active) return false;

    const hasAny = (sel: string[], vals: string[] | null | undefined) =>
      !sel.length || (vals || []).some((v) => sel.includes(v));
    // admins / "all" scope users implicitly cover every location
    const coversAll = scope === "all";
    if (!coversAll) {
      if (!hasAny(f.districts, r.access_districts)) return false;
      if (!hasAny(f.talukas, r.access_talukas)) return false;
      if (!hasAny(f.villages, r.access_villages)) return false;
    } else if (f.districts.length || f.talukas.length || f.villages.length) {
      // keep them — they can see everything
    }

    if (!inRange(r.created_at, f.createdFrom, f.createdTo)) return false;
    if (!inRange(r.last_sign_in_at, f.loginFrom, f.loginTo)) return false;
    return true;
  });
}

function MultiCheck({
  label, options, value, onChange, empty,
}: { label: string; options: string[]; value: string[]; onChange: (v: string[]) => void; empty: string }) {
  const [q, setQ] = useState("");
  const shown = options.filter((o) => o.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-muted-foreground">{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-between font-normal">
            <span className="truncate">
              {value.length ? `${value.length} निवडले` : "सर्व"}
            </span>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2 max-h-[min(60vh,22rem)] overflow-hidden" align="start">
          {options.length === 0 ? (
            <p className="p-2 text-xs text-muted-foreground">{empty}</p>
          ) : (
            <div className="space-y-2">
              <Input className="h-8" placeholder="शोधा..." value={q} onChange={(e) => setQ(e.target.value)} />
              <div
                className="max-h-56 overflow-y-auto space-y-1 pr-1"
                onWheel={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
              >
                {shown.map((o) => (
                  <label key={o} className="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-muted cursor-pointer">
                    <Checkbox
                      checked={value.includes(o)}
                      onCheckedChange={() =>
                        onChange(value.includes(o) ? value.filter((x) => x !== o) : [...value, o])
                      }
                    />
                    <span className="truncate">{o}</span>
                  </label>
                ))}
                {shown.length === 0 && <p className="px-2 py-1 text-xs text-muted-foreground">काही सापडले नाही</p>}
              </div>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => onChange(uniqSorted(options))}>सर्व</Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => onChange([])}>रिकामे</Button>
              </div>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function UserFilterPanel({
  filters, onChange, locs, total, shown,
}: {
  filters: UserFilters;
  onChange: (f: UserFilters) => void;
  locs: { district: string; taluka: string; village: string }[];
  total: number;
  shown: number;
}) {
  const [advanced, setAdvanced] = useState(false);
  const set = (patch: Partial<UserFilters>) => onChange({ ...filters, ...patch });

  const districtOptions = useMemo(() => uniqSorted(locs.map((l) => l.district)), [locs]);
  const talukaOptions = useMemo(
    () =>
      uniqSorted(
        locs
          .filter((l) => !filters.districts.length || filters.districts.includes(l.district))
          .map((l) => l.taluka),
      ),
    [locs, filters.districts],
  );
  const villageOptions = useMemo(
    () =>
      uniqSorted(
        locs
          .filter((l) => !filters.districts.length || filters.districts.includes(l.district))
          .filter((l) => !filters.talukas.length || filters.talukas.includes(l.taluka))
          .map((l) => l.village),
      ),
    [locs, filters.districts, filters.talukas],
  );

  const active = countActiveUserFilters(filters);

  return (
    <Card className="border-primary/20">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">Filters</span>
            {active > 0 && <Badge variant="secondary">{active} सक्रिय</Badge>}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{shown} / {total} वापरकर्ते</span>
            <Button variant="ghost" size="sm" onClick={() => onChange(emptyUserFilters)}>
              <RotateCcw className="h-3.5 w-3.5 mr-1" />Reset
            </Button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5 lg:col-span-1">
            <Label className="text-xs font-semibold text-muted-foreground">Search User</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="नाव / Email / Mobile"
                value={filters.q}
                onChange={(e) => set({ q: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" />Access Scope
            </Label>
            <Select
              value={filters.scope}
              onValueChange={(v) =>
                set({ scope: v as UserFilters["scope"], districts: [], talukas: [], villages: [] })
              }
            >
              <SelectTrigger><SelectValue placeholder="Choose Access Scope" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="any">All Scopes</SelectItem>
                {ACCESS_SCOPES.map((s) => (
                  <SelectItem key={s} value={s}>{ACCESS_SCOPE_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">User Status</Label>
            <Select value={filters.status} onValueChange={(v) => set({ status: v as UserFilters["status"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="any">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3 rounded-lg border bg-muted/30 p-3">
          <div className="md:col-span-3 flex items-center gap-1 text-xs font-semibold text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />स्थान (District → Taluka → Village)
          </div>
          <MultiCheck
            label="District"
            options={districtOptions}
            value={filters.districts}
            onChange={(v) => set({ districts: v, talukas: [], villages: [] })}
            empty="जिल्हे उपलब्ध नाहीत"
          />
          <MultiCheck
            label="Taluka"
            options={talukaOptions}
            value={filters.talukas}
            onChange={(v) => set({ talukas: v, villages: [] })}
            empty="प्रथम जिल्हा निवडा"
          />
          <MultiCheck
            label="Village"
            options={villageOptions}
            value={filters.villages}
            onChange={(v) => set({ villages: v })}
            empty="प्रथम तालुका निवडा"
          />
        </div>

        <Collapsible open={advanced} onOpenChange={setAdvanced}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="w-full justify-between">
              <span className="flex items-center gap-1"><CalendarRange className="h-3.5 w-3.5" />Advanced Filters</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${advanced ? "rotate-180" : ""}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5 rounded-lg border p-3">
                <Label className="text-xs font-semibold text-muted-foreground">Created Date</Label>
                <div className="flex items-center gap-2">
                  <Input type="date" value={filters.createdFrom} onChange={(e) => set({ createdFrom: e.target.value })} />
                  <span className="text-muted-foreground">—</span>
                  <Input type="date" value={filters.createdTo} onChange={(e) => set({ createdTo: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5 rounded-lg border p-3">
                <Label className="text-xs font-semibold text-muted-foreground">Last Login</Label>
                <div className="flex items-center gap-2">
                  <Input type="date" value={filters.loginFrom} onChange={(e) => set({ loginFrom: e.target.value })} />
                  <span className="text-muted-foreground">—</span>
                  <Input type="date" value={filters.loginTo} onChange={(e) => set({ loginTo: e.target.value })} />
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
