import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Pencil, Trash2, Download, FileDown, FileText, Eye } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { exportExcel, exportPDF } from "@/lib/export";
import { getSubmitterNames } from "@/lib/users.functions";
import { downloadSurveyPDF } from "@/lib/single-export";
import { SurveyFilterPanel } from "@/components/SurveyFilterPanel";
import { emptyFilters, matchSurvey, type SurveyFilters } from "@/lib/survey-filters";

export const Route = createFileRoute("/_authenticated/surveys/")({
  component: SurveysList,
});

function SurveysList() {
  const { role } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<SurveyFilters>({ ...emptyFilters });
  const [submitters, setSubmitters] = useState<Record<string, string>>({});
  const fetchSubmitters = useServerFn(getSubmitterNames);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from("surveys").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows(data || []);
    setLoading(false);
    if (role === "admin") {
      try {
        const list = await fetchSubmitters({} as any);
        const map: Record<string, string> = {};
        list.forEach((p: any) => { map[p.id] = p.full_name || p.email; });
        setSubmitters(map);
      } catch {}
    }
  }

  useEffect(() => { load(); }, [role]);

  const filtered = useMemo(() => {
    return rows.filter(r => {
      if (search) {
        const s = search.toLowerCase();
        if (!(r.head_name?.toLowerCase().includes(s) || r.mobile?.includes(s) || r.village?.toLowerCase().includes(s) || r.taluka?.toLowerCase().includes(s) || r.district?.toLowerCase().includes(s) || r.pincode?.includes(s))) return false;
      }
      return matchSurvey(r, filters);
    });
  }, [rows, search, filters]);


  async function del(id: string) {
    const { error } = await supabase.from("surveys").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("हटवले");
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">सर्व सर्वेक्षणे</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} पैकी {rows.length} रेकॉर्ड्स</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportExcel(filtered)}><Download className="h-4 w-4 mr-1"/>Excel</Button>
          <Button variant="outline" onClick={() => exportPDF(filtered)}><FileDown className="h-4 w-4 mr-1"/>PDF</Button>
          <Link to="/new"><Button>+ नवीन</Button></Link>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">शोध व फिल्टर</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="नाव / मोबाईल / गाव / तालुका / जिल्हा / पिनकोड शोधा..." value={search} onChange={e=>setSearch(e.target.value)} />
          <SurveyFilterPanel rows={rows} filters={filters} onChange={setFilters} />
        </CardContent>
      </Card>


      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>कुटुंब प्रमुख</TableHead>
                <TableHead>मोबाईल</TableHead>
                <TableHead>गाव</TableHead>
                <TableHead>तालुका</TableHead>
                <TableHead>जिल्हा</TableHead>
                {role === "admin" && <TableHead>Submitted By</TableHead>}
                <TableHead>Submitted</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">क्रिया</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && <TableRow><TableCell colSpan={11} className="text-center py-8">लोड होत आहे...</TableCell></TableRow>}
              {!loading && filtered.length === 0 && <TableRow><TableCell colSpan={11} className="text-center py-8 text-muted-foreground">कोणताही रेकॉर्ड नाही</TableCell></TableRow>}
              {filtered.map(r => (
                <TableRow key={r.id} className="cursor-pointer hover:bg-muted/50" onClick={(e) => {
                  if ((e.target as HTMLElement).closest('button,a,[role="menuitem"]')) return;
                  window.location.assign(`/surveys/view/${r.id}`);
                }}>
                  <TableCell className="text-xs text-muted-foreground">{r.id.slice(0, 8)}</TableCell>
                  <TableCell className="font-medium">{r.head_name}</TableCell>
                  <TableCell>{r.mobile || "-"}</TableCell>
                  <TableCell>{r.village}</TableCell>
                  <TableCell>{r.taluka || "-"}</TableCell>
                  <TableCell>{r.district || "-"}</TableCell>
                  {role === "admin" && <TableCell className="text-xs">{submitters[r.created_by] || "-"}</TableCell>}
                  <TableCell className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("mr-IN")}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(r.updated_at).toLocaleDateString("mr-IN")}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <Button variant="ghost" size="sm" title="संपूर्ण फॉर्म पहा (View)" asChild>
                      <Link to="/surveys/view/$id" params={{ id: r.id }}><Eye className="h-4 w-4"/></Link>
                    </Button>
                    <Button variant="ghost" size="sm" title="संपादन करा (Edit)" asChild>
                      <Link to="/surveys/$id" params={{ id: r.id }}><Pencil className="h-4 w-4"/></Link>
                    </Button>
                    <Button variant="ghost" size="sm" title="PDF डाउनलोड करा (Save as PDF)" onClick={() => toast.promise(downloadSurveyPDF(r), { loading: "PDF तयार होत आहे...", success: "PDF डाउनलोड झाले", error: "PDF अपयशी" })}><FileText className="h-4 w-4"/></Button>

                    {role === "admin" && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm"><Trash2 className="h-4 w-4 text-destructive"/></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>रेकॉर्ड हटवायचे का?</AlertDialogTitle>
                            <AlertDialogDescription>हे रेकॉर्ड कायमचे हटवले जाईल.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>रद्द</AlertDialogCancel>
                            <AlertDialogAction onClick={() => del(r.id)}>हटवा</AlertDialogAction>
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
