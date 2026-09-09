import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: AuthLayout,
});

const SURVEYOR_ALLOWED = ["/new", "/surveys"];

function AuthLayout() {
  const { session, loading, role, roleLoading } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/auth" });
  }, [loading, session, navigate]);

  // survey users only get the survey part of the app
  useEffect(() => {
    if (loading || roleLoading || !session || role !== "surveyor") return;
    const allowed = SURVEYOR_ALLOWED.some((p) => pathname === p || pathname.startsWith(p + "/"));
    if (!allowed) navigate({ to: "/surveys", replace: true });
  }, [loading, roleLoading, session, role, pathname, navigate]);

  if (loading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        लोड होत आहे...
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-muted/30">
        <AppSidebar />
        <SidebarInset className="flex-1 min-w-0">
          <header className="h-14 flex items-center gap-2 border-b bg-background px-4 sticky top-0 z-10">
            <SidebarTrigger />
            <div className="flex-1" />
          </header>
          <main className="p-4 md:p-6 max-w-[1400px] mx-auto w-full">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
