import { describe, it, expect, vi } from "vitest";

vi.mock("@/integrations/supabase/client", async () => {
  const { createFakeSupabase } = await import("../mocks/supabase");
  const fake = createFakeSupabase();
  return { supabase: fake, __fake: fake };
});

import { slugify, formatDate, MEDIA_CATEGORIES, BLOG_CATEGORIES, MEDIA_BUCKET } from "@/lib/estate";

describe("slugify", () => {
  it("lowercases, trims and hyphenates", () => {
    expect(slugify("  Harvesting the 2026 Coffee  ")).toBe("harvesting-the-2026-coffee");
  });

  it("strips non-alphanumeric characters", () => {
    expect(slugify("Coffee & Pepper!")).toBe("coffee-pepper");
  });

  it("collapses multiple hyphens", () => {
    expect(slugify("a---b")).toBe("a-b");
  });

  it("caps length at 80 characters", () => {
    const out = slugify("x".repeat(200));
    expect(out.length).toBeLessThanOrEqual(80);
  });

  it("handles empty / whitespace-only input", () => {
    expect(slugify("")).toBe("");
    expect(slugify("   ")).toBe("");
  });
});

describe("formatDate", () => {
  it("formats an ISO date as en-GB long format", () => {
    expect(formatDate("2026-01-05T00:00:00Z")).toBe("5 January 2026");
  });

  it("returns empty string for null/undefined", () => {
    expect(formatDate(null)).toBe("");
  });
});

describe("estate constants", () => {
  it("exposes the media bucket and category lists", () => {
    expect(MEDIA_BUCKET).toBe("estate-media");
    expect(MEDIA_CATEGORIES).toContain("Videos");
    expect(BLOG_CATEGORIES).toContain("Sustainability");
  });
});
