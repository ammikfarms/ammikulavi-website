import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderMiniApp } from "../utils/render";
import { Route as AdminRoute } from "@/routes/admin";
import { Route as ContentRoute } from "@/routes/admin.content";
import { Route as DashboardRoute } from "@/routes/admin.dashboard";
import { Route as AuthRoute } from "@/routes/auth";
import { Route as LoginRoute } from "@/routes/auth.login";
import type { ContentRow } from "@/lib/estate";
import type { FakeBuilder } from "../mocks/supabase";

vi.mock("@/integrations/supabase/client", async () => {
  const { createFakeSupabase } = await import("../mocks/supabase");
  const fake = createFakeSupabase();
  // @ts-expect-error test hook on global
  globalThis.__fakeSupabase = fake;
  return { supabase: fake };
});

vi.mock("sonner", () => {
  return { toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } };
});

import { toast } from "sonner";
const toastMock = vi.mocked(toast);

// @ts-expect-error test hook on global
function getFake() {
  // @ts-expect-error test hook on global
  return globalThis.__fakeSupabase;
}

function contentBuilders(table: string): FakeBuilder[] {
  // @ts-expect-error test hook
  return getFake().from.__allBuilders?.[table] ?? [];
}

function mockBuildersFor(fake: ReturnType<typeof getFake>, table: string): FakeBuilder[] {
  // @ts-expect-error test hook
  return fake.from.__allBuilders?.[table] ?? [];
}

const ROWS: ContentRow[] = [
  { page: "home", key: "hero_headline", value: "Ammikulavi Estate" },
  { page: "home", key: "hero_subline", value: "Mountainside coffee" },
  { page: "coffee", key: "heading", value: "Our Coffee" },
];

async function renderContent() {
  const fake = getFake();
  fake.auth.getUser.mockResolvedValue({
    data: { user: { id: "u-admin", email: "owner@ammikulaviestate.com" } },
    error: null,
  });
  fake.rpcResults["has_role"] = () => ({ data: true });
  fake.tableResults["site_content"] = () => ({ data: ROWS, error: null });

  return renderMiniApp({
    routes: [
      { key: "auth", definition: AuthRoute, id: "/auth", path: "/auth" },
      { key: "login", definition: LoginRoute, id: "/auth/login", path: "/login", parent: "auth" },
      { key: "admin", definition: AdminRoute, id: "/admin", path: "/admin" },
      {
        key: "content",
        definition: ContentRoute,
        id: "/admin/content",
        path: "/content",
        parent: "admin",
      },
      {
        key: "dashboard",
        definition: DashboardRoute,
        id: "/admin/dashboard",
        path: "/dashboard",
        parent: "admin",
      },
    ],
    initialPath: "/admin/content",
  });
}

describe("admin site content manager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows all section tabs and the homepage editor by default", async () => {
    await renderContent();
    const heading = await screen.findByRole("heading", { name: "Site Content" });
    expect(heading).toBeInTheDocument();
    for (const name of ["Homepage", "About", "Coffee", "Pepper", "Sustainability", "Contact"]) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }
    expect(screen.getByText("Hero headline")).toBeInTheDocument();
    expect(screen.getByLabelText("Hero headline")).toHaveValue("Ammikulavi Estate");
  });

  it("prefills single and multiline fields from the stored rows", async () => {
    await renderContent();
    expect(await screen.findByLabelText("Hero subline")).toHaveValue("Mountainside coffee");
    expect(screen.getByLabelText("Introduction body")).toHaveValue("");
  });

  it("switches between sections when a tab is pressed", async () => {
    await renderContent();
    await userEvent.click(await screen.findByRole("button", { name: "Coffee" }));
    expect(screen.getByRole("button", { name: "Coffee" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Varieties")).toBeInTheDocument();
    expect(screen.queryByText("Hero headline")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Page heading")).toHaveValue("Our Coffee");
  });

  it("saves every field in the active section via upsert with onConflict", async () => {
    await renderContent();
    const fake = getFake();
    const before = contentBuilders("site_content").filter(
      (b) => b.select.mock.calls.length > 0,
    ).length;

    await userEvent.type(await screen.findByLabelText("Hero subline"), " — grown wild");

    await userEvent.click(screen.getByRole("button", { name: /save changes/i }));
    expect(await screen.findByRole("button", { name: "Save changes" })).toBeInTheDocument();
    expect(toastMock.success).toHaveBeenCalledWith("Homepage content updated");

    // A save triggers a refetch (invalidateQueries), so the mutation builders
    // are the new upsert builders appended for site_content since the render
    // (one new `from()` chain per field, then new select chains on refetch).
    const upsertBuilders = mockBuildersFor(fake, "site_content").filter(
      (b) => b.upsert.mock.calls.length > 0,
    );
    expect(upsertBuilders.length).toBe(4);
    const upsertCalls = upsertBuilders.flatMap((b) => b.upsert.mock.calls);
    const upsertRows = upsertCalls.map((c) => c[0]);
    expect(upsertCalls.length).toBe(4);
    expect(upsertRows).toEqual(
      expect.arrayContaining([
        { page: "home", key: "hero_headline", value: "Ammikulavi Estate" },
        { page: "home", key: "hero_subline", value: "Mountainside coffee — grown wild" },
        { page: "home", key: "intro_heading", value: "" },
        { page: "home", key: "intro_body", value: "" },
      ]),
    );
    expect(upsertCalls.every((c) => c[1]?.onConflict === "page,key")).toBe(true);

    // The success path refetched the content list.
    const refetchBuilders = contentBuilders("site_content").filter(
      (b) => b.select.mock.calls.length > 0,
    );
    expect(refetchBuilders.length).toBeGreaterThan(before);
  });

  it("surfaces an upsert failure and skips the success toast", async () => {
    await renderContent();
    const fake = getFake();
    fake.tableResults["site_content"] = () => ({ data: null, error: { message: "db exploded" } });

    await userEvent.click(await screen.findByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith("db exploded"));
    expect(toastMock.success).not.toHaveBeenCalled();
    const upsertBuilder = mockBuildersFor(fake, "site_content").find(
      (b) => b?.upsert.mock.calls.length,
    );
    expect(upsertBuilder?.upsert).toHaveBeenCalled();
    expect(upsertBuilder?.upsert).toHaveBeenCalledTimes(1); // aborts after the first failure
  });
});
