import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { LoginPanel } from "@/components/LoginPanel";
import { initAdmin } from "@/lib/users.functions";
import { T } from "@/lib/marathi";

export const Route = createFileRoute("/admin-login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: `Admin Login | ${T.appName}` },
      { name: "description", content: "कोहळी समाज विकास मंडळ — प्रशासक लॉगिन पॅनेल." },
      { property: "og:title", content: `Admin Login | ${T.appName}` },
      { property: "og:description", content: "कोहळी समाज विकास मंडळ — प्रशासक लॉगिन पॅनेल." },
    ],
  }),
  component: AdminLogin,
});

function AdminLogin() {
  const bootstrap = useServerFn(initAdmin);
  useEffect(() => { bootstrap({} as any).catch(() => {}); }, [bootstrap]);

  return (
    <LoginPanel
      panel="admin"
      title="Admin Panel"
      subtitle="प्रशासक लॉगिन — संपूर्ण डॅशबोर्ड व व्यवस्थापन"
      defaultEmail="admin@gmail.com"
      otherLabel="Survey User लॉगिन →"
      otherTo="/user-login"
    />
  );
}
