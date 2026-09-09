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

type Panel = "admin" | "surveyor";

export function LoginPanel({
  panel,
  title,
  subtitle,
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary via-background to-accent/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl mb-2">कु</div>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription>{subtitle}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-3">
            <div>
              <Label>{T.email}</Label>
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label>{T.password}</Label>
              <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "..." : T.login}
            </Button>
          </form>

          {hint && (
            <div className="mt-4 rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">{hint}</div>
          )}

          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
            <Link to={otherTo} className="underline">{otherLabel}</Link>
            <Link to="/" className="underline">मुख्यपृष्ठ</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
