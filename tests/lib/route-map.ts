/**
 * Canonical public route map used by the test suite to verify that every
 * navigation link, footer link, and sitemap entry resolves to a real,
 * generated TanStack route path.
 *
 * Mirrors the links in `src/components/site-header.tsx`,
 * `src/components/site-footer.tsx` and `src/routes/sitemap[.]xml.tsx`.
 */

export const PUBLIC_PATHS = [
  "/",
  "/about",
  "/coffee",
  "/pepper",
  "/gallery",
  "/journal",
  "/stories",
  "/sustainability",
  "/contact",
] as const;

export const ADMIN_PATHS = [
  "/admin/dashboard",
  "/admin/blog",
  "/admin/media",
  "/admin/content",
] as const;

export const AUTH_PATHS = ["/auth/login"] as const;

export const SPECIAL_PATHS = ["/sitemap.xml", "/api/submit-contact", "/journal/$slug"] as const;

/** Header navigation links (site-header.tsx). */
export const HEADER_LINKS = [
  { to: "/coffee", label: "Coffee" },
  { to: "/pepper", label: "Pepper" },
  { to: "/about", label: "The Estate" },
  { to: "/gallery", label: "Gallery" },
  { to: "/journal", label: "Journal" },
  { to: "/sustainability", label: "Sustainability" },
  { to: "/contact", label: "Contact" },
] as const;

/** Footer navigation links (site-footer.tsx). */
export const FOOTER_LINKS = [
  { to: "/coffee", label: "Coffee" },
  { to: "/pepper", label: "Pepper" },
  { to: "/journal", label: "The Estate Journal" },
  { to: "/gallery", label: "Gallery" },
  { to: "/stories", label: "Films & Stories" },
  { to: "/sustainability", label: "Sustainability" },
  { to: "/contact", label: "Contact" },
] as const;
