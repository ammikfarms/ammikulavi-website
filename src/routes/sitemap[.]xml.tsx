/**
 * Sitemap server function — generates /sitemap.xml at request time.
 * Uses Supabase to pull published blog post slugs for dynamic URLs.
 */
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

const SITE_URL = process.env["VITE_SITE_URL"] || "https://ammikulaviestate.com";

const STATIC_ROUTES = [
  { path: "/", priority: "1.0", changefreq: "weekly" },
  { path: "/about", priority: "0.8", changefreq: "monthly" },
  { path: "/coffee", priority: "0.8", changefreq: "monthly" },
  { path: "/pepper", priority: "0.8", changefreq: "monthly" },
  { path: "/gallery", priority: "0.7", changefreq: "weekly" },
  { path: "/journal", priority: "0.9", changefreq: "weekly" },
  { path: "/stories", priority: "0.6", changefreq: "monthly" },
  { path: "/sustainability", priority: "0.6", changefreq: "monthly" },
  { path: "/contact", priority: "0.7", changefreq: "monthly" },
];

const fetchSitemap = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: posts } = await supabaseAdmin
    .from("blog_posts")
    .select("slug, updated_at, published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  const now = new Date().toISOString();

  const urls = [
    ...STATIC_ROUTES.map(
      (r) => `
  <url>
    <loc>${SITE_URL}${r.path}</loc>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`,
    ),
    ...(posts ?? []).map(
      (p) => `
  <url>
    <loc>${SITE_URL}/journal/${p.slug}</loc>
    <lastmod>${(p.updated_at || p.published_at || now).slice(0, 10)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`,
    ),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
});

export const Route = createFileRoute("/sitemap.xml")({
  component: () => null,
  loader: async () => {
    const response = await fetchSitemap({ data: undefined });
    // The server function returns the Response directly
    throw response;
  },
});

// Note: TanStack Start's loader throws the Response to short-circuit rendering.
// This is the idiomatic way to serve non-HTML responses from route loaders.
