import { useEffect } from "react";
import {
  Outlet,
  Link,
  createFileRoute,
  redirect,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { LayoutDashboard, FileText, Image, Settings, LogOut } from "lucide-react";
import { useAdmin } from "@/lib/admin";
import { supabase } from "@/integrations/supabase/client";
import { BrandLogo } from "@/components/brand-logo";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "Admin — Ammikulavi Estate" }],
  }),
  beforeLoad: ({ location }) => {
    if (location.pathname === "/admin") {
      throw redirect({ to: "/admin/dashboard" });
    }
  },
  component: AdminLayout,
});

const nav = [
  { to: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/admin/blog", label: "Blog Manager", icon: FileText },
  { to: "/admin/media", label: "Media Manager", icon: Image },
  { to: "/admin/content", label: "Site Content", icon: Settings },
] as const;

function AdminLayout() {
  const { data: admin, isLoading } = useAdmin();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!isLoading && !admin) navigate({ to: "/auth/login" });
  }, [admin, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!admin) return null;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="hidden w-64 shrink-0 border-r border-border bg-card p-6 lg:block">
        <Link to="/" className="inline-block">
          <BrandLogo width={80} height={69} className="h-10 w-auto mix-blend-multiply" />
        </Link>
        <p className="mt-4 text-xs text-muted-foreground">Admin Dashboard</p>

        <nav className="mt-8 space-y-1">
          {nav.map((item) => {
            const active = pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-border pt-6">
          <p className="text-xs text-muted-foreground truncate">{admin.email}</p>
          <span className="mt-1 inline-block rounded-sm bg-accent/20 px-2 py-0.5 text-[0.65rem] font-semibold tracking-wider uppercase text-accent">
            Admin
          </span>
          <button
            type="button"
            onClick={handleSignOut}
            className="mt-4 flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut className="size-4" />
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto p-6 lg:p-10">
        <Outlet />
      </main>
    </div>
  );
}
