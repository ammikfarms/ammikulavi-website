/**
 * Canonical URL helper for SEO meta tags.
 *
 * Derives the canonical URL from the current location so that every route
 * automatically gets a correct <link rel="canonical"> without hard-coding
 * the origin in each file.
 */
import { useLocation } from "@tanstack/react-router";

const SITE_URL = import.meta.env["VITE_SITE_URL"] || "https://ammikulaviestate.com";

export function useCanonicalUrl(path?: string): string {
  const location = useLocation();
  const pathname = path ?? location.pathname;
  // Strip trailing slash except for root
  const cleaned = pathname === "/" ? "/" : pathname.replace(/\/+$/, "");
  return `${SITE_URL}${cleaned}`;
}

export function getAbsoluteUrl(path: string): string {
  const base = import.meta.env["VITE_SITE_URL"] || "https://ammikulaviestate.com";
  return `${base}${path}`;
}

export const SITE_NAME = "Ammikulavi Estate";
export const DEFAULT_OG_IMAGE = "/og-default.jpg"; // Place a 1200×630 image in public/
