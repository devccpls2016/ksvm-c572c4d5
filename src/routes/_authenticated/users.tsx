import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { listAppUsers, createSurveyUser, updateSurveyUser, deleteSurveyUser, getLocationTree } from "@/lib/users.functions";
import { ACCESS_SCOPES, ACCESS_SCOPE_LABELS, accessSummary, type AccessScope } from "@/lib/users.access";
import { UserFilterPanel, emptyUserFilters, filterUsers, type UserFilters } from "@/components/UserFilterPanel";

function uniqSorted(v: string[]) {
  return Array.from(new Set(v.filter(Boolean))).sort((a, b) => a.localeCompare(b, "mr"));
}

function CheckList({
  label, options, value, onChange, empty,
}: { label: string; options: string[]; value: string[]; onChange: (v: string[]) => void; empty: string }) {
  const [q, setQ] = useState("");
  const shown = options.filter((o) => o.toLowerCase().includes(q.toLowerCase()));
  function toggle(o: string) {
    onChange(value.includes(o) ? value.filter((x) => x !== o) : [...value, o]);
  }
  return (
    <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-sm font-semibold">{label}</Label>
        <span className="text-xs text-muted-foreground">{value.length} निवडले</span>
      </div>
      {options.length === 0 ? (
        <p className="text-xs text-muted-foreground">{empty}</p>
      ) : (
        <>
          <Input className="h-8" placeholder="शोधा..." value={q} onChange={(e) => setQ(e.target.value)} />
          <ScrollArea className="h-40 rounded border bg-background">
            <div className="p-2 space-y-1">
              {shown.map((o) => (
                <label key={o} className="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-muted cursor-pointer">
                  <Checkbox checked={value.includes(o)} onCheckedChange={() => toggle(o)} />
                  <span className="truncate">{o}</span>
                </label>
              ))}
              {shown.length === 0 && <p className="px-2 py-1 text-xs text-muted-foreground">काही सापडले नाही</p>}
            </div>
          </ScrollArea>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onChange(uniqSorted(options))}>सर्व निवडा</Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange([])}>रिकामे करा</Button>
          </div>
        </>
      )}
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/users")({
  component: UsersPage,
});

function UsersPage() {
  const { role, loading } = useAuth();
  const navigate = useNavigate();
  const list = useServerFn(listAppUsers);
  const create = useServerFn(createSurveyUser);
  const update = useServerFn(updateSurveyUser);
  const del = useServerFn(deleteSurveyUser);
  const locations = useServerFn(getLocationTree);
  const [locs, setLocs] = useState<{ district: string; taluka: string; village: string }[]>([]);

  const [rows, setRows] = useState<any[]>([]);
  const [filters, setFilters] = useState<UserFilters>(emptyUserFilters);
  const visibleRows = filterUsers(rows, filters);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [editRow, setEditRow] = useState<any | null>(null);

  const [form, setForm] = useState({
    full_name: "", email: "", mobile: "", password: "", confirm: "", is_active: true,
    access_scope: "all" as AccessScope,
    access_districts: [] as string[],
    access_talukas: [] as string[],
    access_villages: [] as string[],
  });

  const districtOptions = uniqSorted(locs.map((l) => l.district));
  const talukaOptions = uniqSorted(
    locs.filter((l) => form.access_districts.includes(l.district)).map((l) => l.taluka),
  );
  const villageOptions = uniqSorted(
    locs
      .filter((l) => form.access_districts.includes(l.district) && form.access_talukas.includes(l.taluka))
      .map((l) => l.village),
  );

  useEffect(() => {
    if (!loading && role && role !== "admin") navigate({ to: "/dashboard" });
  }, [loading, role, navigate]);

  async function load() {
    try {
      const r = await list({} as any);
      setRows(r);
    } catch (e: any) { toast.error(e.message); }
  }
  useEffect(() => {
    if (role !== "admin") return;
    load();
    locations({} as any).then((r: any) => setLocs(r)).catch(() => {});
  }, [role]);

  function resetForm() {
    setForm({
      full_name: "", email: "", mobile: "", password: "", confirm: "", is_active: true,
      access_scope: "all", access_districts: [], access_talukas: [], access_villages: [],
    });
    setEditRow(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password && form.password !== form.confirm) return toast.error("Password जुळत नाही");
    if (form.access_scope !== "all" && form.access_districts.length === 0)
      return toast.error("कृपया कमीत कमी एक जिल्हा निवडा");
    if ((form.access_scope === "taluka" || form.access_scope === "village") && form.access_talukas.length === 0)
      return toast.error("कृपया कमीत कमी एक तालुका निवडा");
    if (form.access_scope === "village" && form.access_villages.length === 0)
      return toast.error("कृपया कमीत कमी एक गाव निवडा");
    setBusy(true);
    try {
      if (editRow) {
        await update({ data: {
          id: editRow.id,
          full_name: form.full_name,
          mobile: form.mobile,
          is_active: form.is_active,
          email: form.email,
          access_scope: form.access_scope,
          access_districts: form.access_districts,
          access_talukas: form.access_talukas,
          access_villages: form.access_villages,
          ...(form.password ? { password: form.password } : {}),
        }} as any);
        toast.success("अपडेट झाले");
      } else {
        if (!form.password) return toast.error("Password आवश्यक");
        await create({ data: {
          full_name: form.full_name, email: form.email, mobile: form.mobile,
          password: form.password, is_active: form.is_active,
          access_scope: form.access_scope,
          access_districts: form.access_districts,
          access_talukas: form.access_talukas,
          access_villages: form.access_villages,
        }} as any);
        toast.success("Survey User तयार झाला");
      }
      setOpen(false); resetForm(); load();
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(false); }
  }

  function startEdit(r: any) {
    setEditRow(r);
    setForm({
      full_name: r.full_name || "", email: r.email || "", mobile: r.mobile || "", password: "", confirm: "",
      is_active: r.is_active,
      access_scope: (r.access_scope || "all") as AccessScope,
      access_districts: r.access_districts || [],
      access_talukas: r.access_talukas || [],
      access_villages: r.access_villages || [],
    });
    setOpen(true);
  }

  async function remove(id: string) {
    try { await del({ data: { id } } as any); toast.success("हटवले"); load(); }
    catch (e: any) { toast.error(e.message); }
  }

  if (role && role !== "admin") return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">Create Survey User</h1>
          <p className="text-sm text-muted-foreground">{rows.length} वापरकर्ते</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1"/>नवीन Survey User</Button></DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editRow ? "Edit User" : "Create Survey User"}</DialogTitle></DialogHeader>
            <form onSubmit={submit} className="space-y-3">
              <div><Label>Survey User Name</Label><Input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
              <div><Label>Mobile Number</Label><Input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} /></div>
              <div><Label>Email / Username</Label><Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>{editRow ? "New Password (वैकल्पिक)" : "Password"}</Label><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
                <div><Label>Confirm Password</Label><Input type="password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} /></div>
              </div>
              <div className="space-y-3 rounded-lg border bg-gradient-to-br from-primary/5 to-transparent p-3">
                <div>
                  <Label className="font-semibold">Access Scope (सर्वेक्षण प्रवेश स्तर)</Label>
                  <p className="text-xs text-muted-foreground">हा वापरकर्ता कोणत्या भागातील सर्वेक्षण / व्यक्ती तपशील पाहू शकतो</p>
                </div>
                <Select
                  value={form.access_scope}
                  onValueChange={(v) => setForm({ ...form, access_scope: v as AccessScope, access_districts: [], access_talukas: [], access_villages: [] })}
                >
                  <SelectTrigger><SelectValue placeholder="Choose Option" /></SelectTrigger>
                  <SelectContent>
                    {ACCESS_SCOPES.map((sc) => (
                      <SelectItem key={sc} value={sc}>{ACCESS_SCOPE_LABELS[sc]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {form.access_scope === "all" && (
                  <p className="text-xs text-muted-foreground">पोर्टलमधील सर्व सर्वेक्षण तपशील उपलब्ध राहतील — स्थान निवडण्याची आवश्यकता नाही.</p>
                )}

                {form.access_scope !== "all" && (
                  <CheckList
                    label="Select Districts (जिल्हे)"
                    options={districtOptions}
                    value={form.access_districts}
                    onChange={(v) => setForm({ ...form, access_districts: v, access_talukas: [], access_villages: [] })}
                    empty="अद्याप कोणतेही जिल्हे उपलब्ध नाहीत (सर्वेक्षण नोंदीवर आधारित)."
                  />
                )}

                {(form.access_scope === "taluka" || form.access_scope === "village") && (
                  <CheckList
                    label="Select Talukas (तालुके)"
                    options={talukaOptions}
                    value={form.access_talukas}
                    onChange={(v) => setForm({ ...form, access_talukas: v, access_villages: [] })}
                    empty="प्रथम जिल्हा निवडा."
                  />
                )}

                {form.access_scope === "village" && (
                  <CheckList
                    label="Select Villages (गावे)"
                    options={villageOptions}
                    value={form.access_villages}
                    onChange={(v) => setForm({ ...form, access_villages: v })}
                    empty="प्रथम तालुका निवडा."
                  />
                )}
              </div>

              <div className="flex items-center justify-between rounded border p-2">
                <Label>Status: {form.is_active ? "Active" : "Inactive"}</Label>
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={busy}>{busy ? "..." : (editRow ? "Update" : "Create")}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">All Users</CardTitle></CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>नाव</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Access Scope</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">क्रिया</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-6">रेकॉर्ड नाही</TableCell></TableRow>}
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.full_name}</TableCell>
                  <TableCell>{r.email}</TableCell>
                  <TableCell>{r.mobile || "-"}</TableCell>
                  <TableCell><Badge variant={r.role === "admin" ? "default" : "secondary"}>{r.role}</Badge></TableCell>
                  <TableCell className="text-xs">{r.role === "admin" ? "All" : accessSummary(r)}</TableCell>
                  <TableCell>{r.is_active ? <Badge>Active</Badge> : <Badge variant="outline">Inactive</Badge>}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => startEdit(r)}><Pencil className="h-4 w-4"/></Button>
                    {r.role !== "admin" && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm"><Trash2 className="h-4 w-4 text-destructive"/></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>हटवायचे का?</AlertDialogTitle>
                            <AlertDialogDescription>{r.email} हे खाते कायमचे हटवले जाईल.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>रद्द</AlertDialogCancel>
                            <AlertDialogAction onClick={() => remove(r.id)}>हटवा</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
