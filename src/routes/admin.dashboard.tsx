import { Link, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FileText, Image, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/dashboard")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { data: postCount } = useQuery({
    queryKey: ["admin", "published-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("blog_posts")
        .select("*", { count: "exact", head: true })
        .eq("status", "published");
      return count ?? 0;
    },
  });

  const { data: draftCount } = useQuery({
    queryKey: ["admin", "draft-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("blog_posts")
        .select("*", { count: "exact", head: true })
        .eq("status", "draft");
      return count ?? 0;
    },
  });

  const { data: mediaCount } = useQuery({
    queryKey: ["admin", "media-count"],
    queryFn: async () => {
      const { count } = await supabase.from("media").select("*", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const { data: messageCount } = useQuery({
    queryKey: ["admin", "message-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("contact_messages")
        .select("*", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const stats = [
    {
      label: "Published posts",
      value: postCount ?? "—",
      icon: FileText,
      to: "/admin/blog",
    },
    {
      label: "Drafts",
      value: draftCount ?? "—",
      icon: FileText,
      to: "/admin/blog",
    },
    {
      label: "Media items",
      value: mediaCount ?? "—",
      icon: Image,
      to: "/admin/media",
    },
    {
      label: "Messages",
      value: messageCount ?? "—",
      icon: MessageSquare,
      to: "/admin/content",
    },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl">Dashboard</h1>
      <p className="mt-2 text-sm text-muted-foreground">Overview of your estate website.</p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            to={s.to}
            className="group rounded-sm border border-border bg-card p-5 transition-colors hover:border-primary"
          >
            <s.icon className="size-5 text-muted-foreground transition-colors group-hover:text-primary" />
            <p className="mt-4 font-display text-3xl">{s.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
          </Link>
        ))}
      </div>

      <div className="mt-12">
        <h2 className="font-display text-xl">Quick actions</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            to="/admin/blog"
            className="rounded-sm bg-primary px-5 py-2.5 text-xs font-semibold tracking-[0.16em] uppercase text-primary-foreground transition-colors hover:bg-secondary"
          >
            Manage blog
          </Link>
          <Link
            to="/admin/media"
            className="rounded-sm border border-border px-5 py-2.5 text-xs font-semibold tracking-[0.16em] uppercase text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            Upload media
          </Link>
          <Link
            to="/admin/content"
            className="rounded-sm border border-border px-5 py-2.5 text-xs font-semibold tracking-[0.16em] uppercase text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            Edit content
          </Link>
        </div>
      </div>
    </div>
  );
}
