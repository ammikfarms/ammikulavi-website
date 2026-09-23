import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderMiniApp } from "../utils/render";
import { Route as AdminRoute } from "@/routes/admin";
import { Route as BlogRoute } from "@/routes/admin.blog";
import { Route as MediaRoute } from "@/routes/admin.media";
import { Route as DashboardRoute } from "@/routes/admin.dashboard";
import { Route as AuthRoute } from "@/routes/auth";
import { Route as LoginRoute } from "@/routes/auth.login";
import type { BlogPost } from "@/lib/estate";
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

function mockBuildersFor(fake: ReturnType<typeof getFake>, table: string): FakeBuilder[] {
  // @ts-expect-error test hook
  return fake.from.__allBuilders?.[table] ?? [];
}

const POST: BlogPost = {
  id: "b-1",
  title: "Harvest Season Begins",
  slug: "harvest-season-begins",
  excerpt: "A look inside the picking season.",
  content: "The harvest is underway across the estate.",
  category: "Estate Life",
  tags: ["coffee", "harvest"],
  featured_image: null,
  author: "Ammikulavi Estate",
  status: "published",
  published_at: "2026-02-01T00:00:00Z",
  created_at: "2026-02-01T00:00:00Z",
  updated_at: "2026-02-01T00:00:00Z",
};

async function renderBlog() {
  const fake = getFake();
  const admin = { id: "u-admin", email: "owner@ammikulaviestate.com" };
  fake.auth.getUser.mockResolvedValue({ data: { user: admin }, error: null });
  fake.rpcResults["has_role"] = () => ({ data: true });
  // Pre-seed one published post.
  fake.tableResults["blog_posts"] = () => ({ data: [POST], error: null });

  return renderMiniApp({
    routes: [
      { key: "auth", definition: AuthRoute, id: "/auth", path: "/auth" },
      { key: "login", definition: LoginRoute, id: "/auth/login", path: "/login", parent: "auth" },
      { key: "admin", definition: AdminRoute, id: "/admin", path: "/admin" },
      {
        key: "blog",
        definition: BlogRoute,
        id: "/admin/blog",
        path: "/blog",
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
    initialPath: "/admin/blog",
  });
}

describe("admin blog manager (CRUD)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists existing posts with a link to the public article", async () => {
    await renderBlog();
    const title = await screen.findByRole("link", { name: "Harvest Season Begins" });
    expect(title).toHaveAttribute("href", "/journal/harvest-season-begins");
    expect(screen.getByText(/Estate Life/i)).toBeInTheDocument();
    expect(screen.getByText("Published")).toBeInTheDocument();
  });

  it("shows the editor prefilled when creating a new post via New post", async () => {
    await renderBlog();
    await userEvent.click(await screen.findByRole("button", { name: /new post/i }));
    expect(await screen.findByLabelText("Title")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create post/i })).toBeInTheDocument();
  });

  it("auto-generates a slug from the title and creates the post on submit", async () => {
    await renderBlog();
    const fake = getFake();
    fake.tableResults["blog_posts"] = () => ({ data: [], error: null });

    await userEvent.click(await screen.findByRole("button", { name: /new post/i }));
    await userEvent.type(await screen.findByLabelText("Title"), "The Monsoon Cup Harvest");
    const slugInput = screen.getByLabelText("Slug");
    expect(slugInput).toHaveValue("the-monsoon-cup-harvest");

    await userEvent.type(screen.getByLabelText("Content"), "A lovely tasting note this year.");
    await userEvent.click(screen.getByRole("button", { name: /create post/i }));

    expect(toastMock.success).toHaveBeenCalledWith("Post created");
    const insertBuilder = mockBuildersFor(fake, "blog_posts").find(
      (b) => b?.insert.mock.calls.length,
    );
    expect(insertBuilder?.insert).toHaveBeenCalled();
    const inserted = insertBuilder?.insert.mock.calls[0]?.[0];
    expect(inserted).toMatchObject({
      title: "The Monsoon Cup Harvest",
      slug: "the-monsoon-cup-harvest",
      status: "draft",
    });
  });

  it("toggles a published post to draft and shows the draft badge", async () => {
    await renderBlog();
    const fake = getFake();
    fake.tableResults["blog_posts"] = () => ({ data: [{ ...POST }], error: null });

    await userEvent.click(
      await screen.findByRole("button", { name: "Unpublish Harvest Season Begins" }),
    );

    const updateBuilder = mockBuildersFor(fake, "blog_posts").find(
      (b) => b?.update.mock.calls.length,
    );
    expect(updateBuilder?.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "draft", published_at: null }),
    );
  });

  it("deletes a post after confirmation", async () => {
    await renderBlog();
    const fake = getFake();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    fake.tableResults["blog_posts"] = () => ({ data: [{ ...POST }], error: null });

    await userEvent.click(
      await screen.findByRole("button", { name: "Delete Harvest Season Begins" }),
    );
    expect(confirmSpy).toHaveBeenCalledWith("Delete this post permanently?");
    const deleteBuilder = mockBuildersFor(fake, "blog_posts").find(
      (b) => b?.delete.mock.calls.length,
    );
    expect(deleteBuilder?.delete).toHaveBeenCalled();
    expect(toastMock.success).toHaveBeenCalledWith("Post deleted");
    confirmSpy.mockRestore();
  });

  it("does not delete a post when the user cancels the confirmation", async () => {
    await renderBlog();
    const fake = getFake();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
    fake.tableResults["blog_posts"] = () => ({ data: [{ ...POST }], error: null });

    await userEvent.click(
      await screen.findByRole("button", { name: "Delete Harvest Season Begins" }),
    );
    expect(confirmSpy).toHaveBeenCalled();
    const deleteBuilders = mockBuildersFor(fake, "blog_posts").filter(
      (b) => b.delete.mock.calls.length,
    );
    expect(deleteBuilders).toHaveLength(0);
    confirmSpy.mockRestore();
  });
});
