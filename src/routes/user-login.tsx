import { createFileRoute } from "@tanstack/react-router";
import { LoginPanel } from "@/components/LoginPanel";
import { T } from "@/lib/marathi";

export const Route = createFileRoute("/user-login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: `Survey User Login | ${T.appName}` },
      { name: "description", content: "कोहळी समाज विकास मंडळ — सर्वेक्षण कर्मचारी लॉगिन पॅनेल." },
      { property: "og:title", content: `Survey User Login | ${T.appName}` },
      { property: "og:description", content: "कोहळी समाज विकास मंडळ — सर्वेक्षण कर्मचारी लॉगिन पॅनेल." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: UserLogin,
});

function UserLogin() {
  return (
    <LoginPanel
      key="surveyor-login"
      panel="surveyor"
      title="Survey User Panel"
      subtitle="सर्वेक्षण कर्मचारी लॉगिन — सर्वेक्षण नोंदणी"
      hint="Survey User चे credentials Admin तयार करेल. Self-registration उपलब्ध नाही."
      otherLabel="Admin लॉगिन →"
      otherTo="/admin-login"
    />
  );
}
