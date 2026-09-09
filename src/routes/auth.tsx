import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { T } from "@/lib/marathi";
import { ShieldCheck, UserRound } from "lucide-react";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({ meta: [{ title: `${T.login} | ${T.appName}` }] }),
  component: AuthChooser,
});

function AuthChooser() {
  const { session, role, roleLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (session && !roleLoading && role) {
      navigate({ to: role === "admin" ? "/dashboard" : "/surveys" });
    }
  }, [session, role, roleLoading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary via-background to-accent/10 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl mb-2">कु</div>
          <CardTitle className="text-2xl">{T.appName}</CardTitle>
          <CardDescription>आपला पॅनेल निवडा / Choose your panel</CardDescription>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-4">
          <Link to="/admin-login" className="rounded-xl border p-5 text-center hover:shadow-md transition-shadow">
            <ShieldCheck className="h-8 w-8 mx-auto text-primary mb-3" />
            <div className="font-semibold">Admin Panel</div>
            <p className="text-xs text-muted-foreground mt-1 mb-3">डॅशबोर्ड, अहवाल व वापरकर्ता व्यवस्थापन</p>
            <Button size="sm" className="w-full">Admin लॉगिन</Button>
          </Link>
          <Link to="/user-login" className="rounded-xl border p-5 text-center hover:shadow-md transition-shadow">
            <UserRound className="h-8 w-8 mx-auto text-primary mb-3" />
            <div className="font-semibold">Survey User Panel</div>
            <p className="text-xs text-muted-foreground mt-1 mb-3">नवीन सर्वेक्षण व स्वतःच्या नोंदी</p>
            <Button size="sm" variant="secondary" className="w-full">Survey User लॉगिन</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
