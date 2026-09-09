import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchUserRole, useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { T } from "@/lib/marathi";
import { ShieldCheck, UserRound } from "lucide-react";

type Panel = "admin" | "surveyor";

export function LoginPanel({
  panel,
  title: _title,
  subtitle: _subtitle,
  defaultEmail = "",
  hint,
  otherLabel,
  otherTo,
}: {
  panel: Panel;
  title: string;
  subtitle: string;
  defaultEmail?: string;
  hint?: string;
  otherLabel: string;
  otherTo: string;
}) {
  const { session, role, roleLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  // already signed in → send to the right panel home
  useEffect(() => {
    if (session && !roleLoading && role) {
      navigate({ to: role === "admin" ? "/dashboard" : "/surveys" });
    }
  }, [session, role, roleLoading, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error || !data.user) {
        toast.error(error?.message || "लॉगिन अयशस्वी / Login failed");
        return;
      }
      const actual = await fetchUserRole(data.user.id);
      if (actual !== panel) {
        await supabase.auth.signOut();
        toast.error(
          panel === "admin"
            ? "हे खाते Admin नाही. कृपया Survey User लॉगिन वापरा."
            : "हे खाते Survey User नाही. कृपया Admin लॉगिन वापरा.",
        );
        return;
      }
      toast.success("स्वागत आहे! / Welcome");
      navigate({ to: panel === "admin" ? "/dashboard" : "/surveys" });
    } catch (err: any) {
      toast.error(err?.message || "लॉगिन अयशस्वी / Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-secondary/45 px-4 py-8">
      <Card className="w-full max-w-[448px] rounded-[14px] border-border bg-card shadow-[0_2px_5px_oklch(0_0_0_/_0.16)]">
        <CardHeader className="px-6 pb-4 pt-6 text-center sm:px-7">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-[14px] bg-primary text-xl font-bold text-primary-foreground">कु</div>
          <CardTitle className="text-[25px] font-bold leading-tight text-foreground">
            कोहळी समाज विकास मंडळ, नागपूर
          </CardTitle>
          <CardDescription className="mt-1 text-sm text-muted-foreground">
            ग्राम / तालुका / जिल्हा स्तरीय कुटुंब सर्वेक्षण व्यवस्थापन
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6 sm:px-7">
          <nav aria-label="लॉगिन प्रकार" className="mb-5 grid h-36px grid-cols-2 rounded-[10px] bg-secondary p-1">
            <Link
              to={panel === "admin" ? "/admin-login" : "/admin-login"}
              className={`flex h-8 items-center justify-center gap-2 rounded-[8px] text-sm transition-colors ${panel === "admin" ? "bg-card font-medium text-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              <ShieldCheck className="h-4 w-4" /> Admin
            </Link>
            <Link
              to={panel === "surveyor" ? "/user-login" : "/user-login"}
              className={`flex h-8 items-center justify-center gap-2 rounded-[8px] text-sm transition-colors ${panel === "surveyor" ? "bg-card font-medium text-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              <UserRound className="h-4 w-4" /> Survey User
            </Link>
          </nav>

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor={`${panel}-email`} className="text-sm font-semibold">{T.email}</Label>
              <Input id={`${panel}-email`} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-9 rounded-[7px] bg-card px-3 text-base shadow-sm" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`${panel}-password`} className="text-sm font-semibold">{T.password}</Label>
              <Input id={`${panel}-password`} type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="h-9 rounded-[7px] bg-card px-3 text-base shadow-sm" />
            </div>
            <Button type="submit" className="h-9 w-full rounded-[7px] text-base font-semibold" disabled={busy}>
              {busy ? "..." : T.login}
            </Button>
          </form>

          {hint && (
            <div className="mt-4 rounded-[7px] border bg-background/70 px-3 py-3 text-xs leading-relaxed text-muted-foreground">{hint}</div>
          )}

          <div className="mt-5 text-center text-xs text-muted-foreground">
            <Link to="/" className="underline underline-offset-2">मुख्यपृष्ठावर परत</Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
