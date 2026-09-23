import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@tanstack/react-router", () => ({
  useLocation: useLocationMock,
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const useLocationMock = vi.fn<any, any>();

describe("lib/utils cn", () => {
  it("merges tailwind classes with tailwind-merge", async () => {
    const { cn } = await import("@/lib/utils");
    // Conflicting padding classes should collapse to the last one.
    expect(cn("px-2", "px-4")).toBe("px-4");
    // Duplicate utility classes are removed; order follows the first occurrence.
    expect(cn("text-center", "mt-4", "text-center")).toBe("mt-4 text-center");
    expect(cn(false, null, undefined, "block")).toBe("block");
  });
});

describe("lib/seo", () => {
  let seo: typeof import("@/lib/seo");

  beforeEach(() => {
    useLocationMock.mockReset();
  });

  it("exposes the brand name and default OG image", async () => {
    seo = await import("@/lib/seo");
    expect(seo.SITE_NAME).toBe("Ammikulavi Estate");
    expect(seo.DEFAULT_OG_IMAGE).toBe("/og-default.jpg");
  });

  it("builds absolute URLs from the site base", async () => {
    seo = await import("@/lib/seo");
    expect(seo.getAbsoluteUrl("/coffee")).toMatch(/^https:\/\/ammikulaviestate\.com\/coffee$/);
    expect(seo.getAbsoluteUrl("/")).toMatch(/ammikulaviestate\.com\/$/);
  });

  it("canonical URL strips trailing slashes except root", async () => {
    seo = await import("@/lib/seo");
    useLocationMock.mockReturnValue({ pathname: "/coffee/" });
    expect(seo.useCanonicalUrl()).toBe("https://ammikulaviestate.com/coffee");
    useLocationMock.mockReturnValue({ pathname: "/" });
    expect(seo.useCanonicalUrl()).toBe("https://ammikulaviestate.com/");
  });

  it("allows an explicit path override", async () => {
    seo = await import("@/lib/seo");
    useLocationMock.mockReturnValue({ pathname: "/journal/a-post" });
    expect(seo.useCanonicalUrl("/coffee")).toBe("https://ammikulaviestate.com/coffee");
  });
});
