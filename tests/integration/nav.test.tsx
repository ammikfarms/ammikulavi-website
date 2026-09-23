import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderMiniApp } from "../utils/render";
import { Outlet } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Route as IndexRoute } from "@/routes/index";
import { Route as CoffeeRoute } from "@/routes/coffee";
import { Route as PepperRoute } from "@/routes/pepper";
import { Route as AboutRoute } from "@/routes/about";
import { Route as GalleryRoute } from "@/routes/gallery";
import { Route as JournalRoute } from "@/routes/journal";
import { Route as StoriesRoute } from "@/routes/stories";
import { Route as SustainabilityRoute } from "@/routes/sustainability";
import { Route as ContactRoute } from "@/routes/contact";
import { Route as AuthRoute } from "@/routes/auth";
import { Route as LoginRoute } from "@/routes/auth.login";

vi.mock("@/integrations/supabase/client", async () => {
  const { createFakeSupabase } = await import("../mocks/supabase");
  return { supabase: createFakeSupabase() };
});

function RootShell() {
  return (
    <>
      <SiteHeader />
      <main>
        <Outlet />
      </main>
      <SiteFooter />
    </>
  );
}

async function renderSite(rootPath = "/") {
  return renderMiniApp({
    rootComponent: RootShell,
    routes: [
      { key: "index", definition: IndexRoute, id: "/", path: "/" },
      { key: "coffee", definition: CoffeeRoute, id: "/coffee", path: "/coffee" },
      { key: "pepper", definition: PepperRoute, id: "/pepper", path: "/pepper" },
      { key: "about", definition: AboutRoute, id: "/about", path: "/about" },
      { key: "gallery", definition: GalleryRoute, id: "/gallery", path: "/gallery" },
      { key: "journal", definition: JournalRoute, id: "/journal", path: "/journal" },
      { key: "stories", definition: StoriesRoute, id: "/stories", path: "/stories" },
      {
        key: "sustainability",
        definition: SustainabilityRoute,
        id: "/sustainability",
        path: "/sustainability",
      },
      { key: "contact", definition: ContactRoute, id: "/contact", path: "/contact" },
      { key: "auth", definition: AuthRoute, id: "/auth", path: "/auth" },
      {
        key: "login",
        definition: LoginRoute,
        id: "/auth/login",
        path: "/login",
        parent: "auth",
      },
    ],
    initialPath: rootPath,
  });
}

describe("site header navigation", () => {
  it("exposes every primary destination as a navigable link", async () => {
    await renderSite();

    const primaryNav = await screen.findByRole("navigation", { name: "Primary" });
    const expected = [
      ["/coffee", "Coffee"],
      ["/pepper", "Pepper"],
      ["/about", "The Estate"],
      ["/gallery", "Gallery"],
      ["/journal", "Journal"],
      ["/sustainability", "Sustainability"],
      ["/contact", "Contact"],
    ];
    for (const [href, label] of expected) {
      const link = within(primaryNav).getByRole("link", { name: label });
      expect(link).toHaveAttribute("href", href);
    }
  });

  it("brand link returns to the root", async () => {
    await renderSite();
    const banner = await screen.findByRole("banner");
    const brand = within(banner).getByRole("link", { name: /ammikulavi/i });
    expect(brand).toHaveAttribute("href", "/");
  });

  it("toggles the mobile menu and closes it when a link is chosen", async () => {
    await renderSite();

    const toggle = screen.getByRole("button", { name: "Open menu" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("navigation", { name: "Mobile" })).not.toBeInTheDocument();

    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-label", "Close menu");
    expect(toggle).toHaveAttribute("aria-expanded", "true");

    const mobileNav = await screen.findByRole("navigation", { name: "Mobile" });
    expect(within(mobileNav).getAllByRole("link").length).toBeGreaterThanOrEqual(7);

    await userEvent.click(within(mobileNav).getByRole("link", { name: "Coffee" }));
    await screen.findByRole("button", { name: "Open menu" });
    expect(screen.queryByRole("navigation", { name: "Mobile" })).not.toBeInTheDocument();
  });

  it("marks the active section link with aria-current", async () => {
    await renderSite("/coffee");
    const primaryNav = await screen.findByRole("navigation", { name: "Primary" });
    await screen.findByRole("heading", { name: /coffee/i });
    expect(within(primaryNav).getByRole("link", { name: "Coffee" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(within(primaryNav).getByRole("link", { name: "Pepper" })).not.toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});

describe("site footer", () => {
  it("links every explore section and the estate login", async () => {
    await renderSite();

    const footerNav = await screen.findByRole("navigation", { name: "Footer" });
    const expected = [
      ["/coffee", "Coffee"],
      ["/pepper", "Pepper"],
      ["/journal", "The Estate Journal"],
      ["/gallery", "Gallery"],
      ["/stories", "Films & Stories"],
      ["/sustainability", "Sustainability"],
      ["/contact", "Contact"],
    ];
    for (const [href, label] of expected) {
      const link = within(footerNav).getByRole("link", { name: label });
      expect(link).toHaveAttribute("href", href);
    }
  });

  it("keeps the estate login link pointing at /auth/login", async () => {
    await renderSite();
    const loginLink = screen.getByRole("link", { name: /estate login/i });
    expect(loginLink).toHaveAttribute("href", "/auth/login");
  });

  it("renders contact details as mailto/tel links with safe fallbacks", async () => {
    await renderSite();
    const footer = await screen.findByRole("contentinfo");
    expect(
      within(footer).getByRole("link", { name: "ammikfarms@gmail.com" }),
    ).toHaveAttribute("href", "mailto:ammikfarms@gmail.com");
    const instagram = within(footer).getByRole("link", { name: "Instagram" });
    expect(instagram).toHaveAttribute("href", "https://instagram.com");
    expect(instagram).toHaveAttribute("target", "_blank");
    expect(instagram).toHaveAttribute("rel", "noreferrer");
  });
});
