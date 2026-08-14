import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { T } from "@/lib/marathi";
import { initAdmin } from "@/lib/users.functions";
import { ShieldCheck, UserRound } from "lucide-react";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({ meta: [{ title: `${T.login} | ${T.appName}` }] }),
  component: AuthPage,
});

type Mode = "admin" | "surveyor";

function AuthPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("admin");
  const bootstrap = useServerFn(initAdmin);

  useEffect(() => {
    bootstrap({} as any).catch(() => {});
  }, [bootstrap]);

  useEffect(() => {
    if (session) navigate({ to: "/dashboard" });
  }, [session, navigate]);

  async function attemptLogin(email: string, password: string, expected: Mode) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      toast.error(error?.message || "लॉगिन अयशस्वी");
      return;
    }
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id)
      .eq("role", expected === "admin" ? "admin" : "surveyor")
      .maybeSingle();
    if (!roleRow) {
      await supabase.auth.signOut();
      toast.error(
        expected === "admin"
          ? "हे खाते Admin नाही. कृपया Survey User टॅब वापरा."
          : "हे खाते Survey User नाही. कृपया Admin टॅब वापरा.",
      );
      return;
    }
    toast.success("स्वागत आहे!");
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary via-background to-accent/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl mb-2">कु</div>
          <CardTitle className="text-2xl">{T.appName}</CardTitle>
          <CardDescription>{T.appTagline}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="admin" className="gap-2">
                <ShieldCheck className="h-4 w-4" /> Admin
              </TabsTrigger>
              <TabsTrigger value="surveyor" className="gap-2">
                <UserRound className="h-4 w-4" /> Survey User
              </TabsTrigger>
            </TabsList>

            <TabsContent value="admin" className="mt-4">
              <LoginForm
                key="admin"
                defaultEmail="admin@gmail.com"
                onSubmit={(e, p) => attemptLogin(e, p, "admin")}
              />
            </TabsContent>

            <TabsContent value="surveyor" className="mt-4">
              <LoginForm
                key="surveyor"
                defaultEmail=""
                onSubmit={(e, p) => attemptLogin(e, p, "surveyor")}
              />
              <HintBox>
                Survey User चे credentials Admin तयार करेल. Self-registration उपलब्ध नाही.
              </HintBox>
            </TabsContent>
          </Tabs>

          <p className="text-xs text-muted-foreground text-center mt-4">
            <Link to="/" className="underline">मुख्यपृष्ठावर परत</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function HintBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
      {children}
    </div>
  );
}

function LoginForm({
  defaultEmail,
  onSubmit,
}: {
  defaultEmail: string;
  onSubmit: (email: string, password: string) => Promise<void>;
}) {
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await onSubmit(email.trim(), password);
    } finally {
      setBusy(false);
    }
  }

  return (
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
  );
}
