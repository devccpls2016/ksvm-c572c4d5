import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/$")({
  head: () => ({
    meta: [
      { title: "पृष्ठ सापडले नाही / Page not found" },
      { name: "description", content: "हे पृष्ठ उपलब्ध नाही. मुख्यपृष्ठावर परत जा." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "पृष्ठ सापडले नाही / Page not found" },
      { property: "og:description", content: "हे पृष्ठ उपलब्ध नाही." },
    ],
  }),
  component: NotFoundPage,
});

function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">पृष्ठ सापडले नाही</h1>
      <p className="text-muted-foreground">हे पृष्ठ आता उपलब्ध नाही.</p>
      <Link to="/dashboard5" className="text-primary underline">
        Final Dashboard वर जा
      </Link>
    </div>
  );
}
