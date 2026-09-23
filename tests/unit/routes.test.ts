import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import {
  PUBLIC_PATHS,
  ADMIN_PATHS,
  AUTH_PATHS,
  HEADER_LINKS,
  FOOTER_LINKS,
} from "../lib/route-map";

const ROUTE_TREE = resolve(process.cwd(), "src/routeTree.gen.ts");

const GENERATED = readFileSync(ROUTE_TREE, "utf8");

/** Every static path must have a corresponding generated file route id. */
function assertPathRegistered(path: string) {
  // TanStack encodes the id with the path; dynamic `$slug` also appears literally.
  expect(GENERATED, `route should be registered in routeTree.gen.ts: ${path}`).toContain(
    `id: '/${path.slice(1)}'`,
  );
}

describe("route & link mapping", () => {
  it.each(PUBLIC_PATHS)("public path is a generated route: %s", (path) => {
    assertPathRegistered(path);
  });

  it.each(ADMIN_PATHS)("admin path is a generated route: %s", (path) => {
    assertPathRegistered(path);
  });

  it.each(AUTH_PATHS)("auth path is a generated route: %s", (path) => {
    assertPathRegistered(path);
  });

  it("dynamic journal slug route is registered", () => {
    assertPathRegistered("/journal/$slug");
  });

  it("sitemap.xml route is registered", () => {
    assertPathRegistered("/sitemap.xml");
  });

  it.each(HEADER_LINKS)("header link target is a real public route: %s", ({ to }) => {
    assertPathRegistered(to);
  });

  it.each(FOOTER_LINKS)("footer link target is a real public route: %s", ({ to }) => {
    assertPathRegistered(to);
  });

  it("every header link is part of the canonical public path set", () => {
    for (const link of HEADER_LINKS) {
      expect((PUBLIC_PATHS as readonly string[]).includes(link.to)).toBe(true);
    }
  });

  it("every footer link is part of the canonical public path set", () => {
    for (const link of FOOTER_LINKS) {
      expect((PUBLIC_PATHS as readonly string[]).includes(link.to)).toBe(true);
    }
  });

  it("estate login link resolves to the auth login route", () => {
    assertPathRegistered("/auth/login");
  });
});

// Route file translates to path (aka file convention checks).
const ROUTES_DIR = resolve(process.cwd(), "src/routes");

const ROUTE_FILES = readdirSync(ROUTES_DIR);

describe("route file naming / path conventions", () => {
  it("has a file for every public path (file-based routing)", () => {
    const expectedFiles: Record<string, string> = {
      "/": "index.tsx",
      "/about": "about.tsx",
      "/coffee": "coffee.tsx",
      "/pepper": "pepper.tsx",
      "/gallery": "gallery.tsx",
      "/journal": "journal.tsx",
      "/stories": "stories.tsx",
      "/sustainability": "sustainability.tsx",
      "/contact": "contact.tsx",
      "/auth/login": "auth.login.tsx",
      "/admin/dashboard": "admin.dashboard.tsx",
      "/admin/blog": "admin.blog.tsx",
      "/admin/media": "admin.media.tsx",
      "/admin/content": "admin.content.tsx",
      "/journal/$slug": "journal.$slug.tsx",
      "/sitemap.xml": "sitemap[.]xml.tsx",
      "/api/submit-contact": "api.submit-contact.tsx",
    };
    for (const [path, file] of Object.entries(expectedFiles)) {
      expect(ROUTE_FILES, `missing route file for ${path}`).toContain(file);
    }
  });
});
