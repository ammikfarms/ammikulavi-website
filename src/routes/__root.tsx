import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { Analytics } from "@/components/analytics";
import { SITE_NAME, DEFAULT_OG_IMAGE } from "@/lib/seo";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <p className="eyebrow">Ammikulavi Estate</p>
        <h1 className="mt-4 font-display text-6xl">Page not found</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          This path has grown over. Let us walk you back to the estate.
        </p>
        <div className="mt-8">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-sm bg-primary px-6 py-3 text-xs font-semibold tracking-[0.18em] uppercase text-primary-foreground transition-colors hover:bg-secondary"
          >
            Return home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-4xl">This page didn't load</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Something went wrong on our end. Try again, or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="rounded-sm bg-primary px-5 py-3 text-xs font-semibold tracking-[0.18em] uppercase text-primary-foreground"
          >
            Try again
          </button>
          <a
            href="/"
            className="rounded-sm border border-input bg-background px-5 py-3 text-xs font-semibold tracking-[0.18em] uppercase"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => {
    const siteUrl = import.meta.env["VITE_SITE_URL"] || "https://ammikulaviestate.com";
    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { title: `${SITE_NAME} — Specialty Coffee & Pepper` },
        {
          name: "description",
          content:
            "Ammikulavi Estate grows shade-grown specialty coffee and premium pepper under native rainforest canopy.",
        },
        { property: "og:site_name", content: SITE_NAME },
        { property: "og:type", content: "website" },
        { property: "og:url", content: siteUrl },
        {
          property: "og:image",
          content: `${siteUrl}${DEFAULT_OG_IMAGE}`,
        },
        { name: "twitter:card", content: "summary_large_image" },
        {
          name: "twitter:image",
          content: `${siteUrl}${DEFAULT_OG_IMAGE}`,
        },
        { name: "robots", content: "index, follow" },
      ],
      links: [
        { rel: "canonical", href: siteUrl },
        { rel: "stylesheet", href: appCss },
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Karla:wght@300;400;500;600;700&display=swap",
        },
        { rel: "icon", type: "image/png", href: "/favicon.png" },
      ],
    };
  },
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAdminArea = pathname.startsWith("/admin") || pathname.startsWith("/auth");

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => data.subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <Analytics />
      {!isAdminArea && <SiteHeader />}
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <main>
        <Outlet />
      </main>
      {!isAdminArea && <SiteFooter />}
      <Toaster />
    </QueryClientProvider>
  );
}
