import { createFileRoute } from "@tanstack/react-router";
import { LoginPanel } from "@/components/LoginPanel";
import { T } from "@/lib/marathi";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: `${T.login} | ${T.appName}` },
      { name: "description", content: "कोहळी समाज विकास मंडळ — प्रशासक आणि सर्वेक्षण कर्मचारी लॉगिन." },
      { property: "og:title", content: `${T.login} | ${T.appName}` },
      { property: "og:description", content: "कोहळी समाज विकास मंडळ — प्रशासक आणि सर्वेक्षण कर्मचारी लॉगिन." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthChooser,
});

function AuthChooser() {
  return (
    <LoginPanel
      panel="admin"
      title="Admin Panel"
      subtitle="प्रशासक लॉगिन"
      defaultEmail="admin@gmail.com"
      otherLabel="Survey User लॉगिन"
      otherTo="/user-login"
    />
  );
}
