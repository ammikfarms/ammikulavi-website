import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderMiniApp } from "../utils/render";
import { Route as AdminRoute } from "@/routes/admin";
import { Route as MediaRoute } from "@/routes/admin.media";
import { Route as DashboardRoute } from "@/routes/admin.dashboard";
import { Route as AuthRoute } from "@/routes/auth";
import { Route as LoginRoute } from "@/routes/auth.login";
import { buildStoragePath, sanitizeStorageBasename, type MediaItem } from "@/lib/estate";

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

const ITEM: MediaItem = {
  id: "m-1",
  title: "Morning at the estate",
  caption: null,
  alt_text: "Plantation at sunrise",
  file_url: "https://cdn.example/estate-media/uploads/abc",
  storage_path: "uploads/abc-sunrise.jpg",
  file_type: "image",
  category: "Estate Life",
  sort_order: 1,
  created_at: "2026-01-01T00:00:00Z",
};

async function renderMedia() {
  const fake = getFake();
  fake.auth.getUser.mockResolvedValue({
    data: { user: { id: "u-admin", email: "owner@ammikulaviestate.com" } },
    error: null,
  });
  fake.rpcResults["has_role"] = () => ({ data: true });
  fake.tableResults["media"] = () => ({ data: [ITEM], error: null });

  return renderMiniApp({
    routes: [
      { key: "auth", definition: AuthRoute, id: "/auth", path: "/auth" },
      { key: "login", definition: LoginRoute, id: "/auth/login", path: "/login", parent: "auth" },
      { key: "admin", definition: AdminRoute, id: "/admin", path: "/admin" },
      { key: "media", definition: MediaRoute, id: "/admin/media", path: "/media", parent: "admin" },
      {
        key: "dashboard",
        definition: DashboardRoute,
        id: "/admin/dashboard",
        path: "/dashboard",
        parent: "admin",
      },
    ],
    initialPath: "/admin/media",
  });
}

function makeFile(name: string, type: string): File {
  return new File(["fakepayload"], name, { type });
}

describe("media upload path safety (buildStoragePath)", () => {
  it("accepts a normal jpg image", () => {
    const path = buildStoragePath("sunrise.jpg", "image/jpeg", "tok");
    expect(path).toBe("uploads/tok-sunrise.jpg");
  });

  it("rejects html disguised as an image extension", () => {
    expect(buildStoragePath("page.html", "text/html", "tok")).toBeNull();
  });

  it("rejects traversal/path-escaping filenames", () => {
    const name = sanitizeStorageBasename("../../secret.png");
    expect(name.startsWith("../")).toBe(false);
    expect(name).not.toContain("/");
    expect(name).not.toContain("\\");
    // Sanitises to a safe stem but keeps the image extension.
    expect(name.endsWith(".png")).toBe(true);
  });

  it("rejects a mismatched extension/content-type combination", () => {
    expect(buildStoragePath("clip.mov", "image/png", "tok")).toBeNull();
    expect(buildStoragePath("image.jpg", "video/mp4", "tok")).toBeNull();
  });

  it("allows octet-stream stills but never executable content", () => {
    expect(buildStoragePath("scanned.jpg", "application/octet-stream", "tok")).toBe(
      "uploads/tok-scanned.jpg",
    );
    expect(buildStoragePath("script.js", "application/octet-stream", "tok")).toBeNull();
  });

  it("never lets a hostile filename escape the uploads prefix", () => {
    expect(buildStoragePath("../etc/passwd", "image/png", "tok")).toBeNull();
    // Traversal characters are stripped so the path stays safely inside uploads/.
    const hostile = buildStoragePath("..\\..\\shell.svg", "image/svg+xml", "tok");
    expect(hostile).toBe("uploads/tok-shell.svg");
    expect(hostile).not.toContain("..");
    expect(hostile).not.toContain("\\");
  });
});

describe("admin media manager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists existing media with a delete control", async () => {
    await renderMedia();
    const thumbnail = await screen.findByRole("img", { name: "Plantation at sunrise" });
    expect(thumbnail).toHaveAttribute("src", "https://cdn.example/estate-media/uploads/abc");
    expect(
      screen.getByRole("button", { name: /delete morning at the estate/i }),
    ).toBeInTheDocument();
  });

  it("rejects an unsupported file upload with an error toast and no storage call", async () => {
    const fake = getFake();
    const file = makeFile("evil.html", "text/html");
    await renderMedia();
    const input = document.querySelector("#media-upload") as HTMLInputElement;
    expect(input).not.toBeNull();
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() =>
      expect(toastMock.error).toHaveBeenCalledWith(
        "Unsupported file type. Please upload an image or video.",
      ),
    );
    const uploaded = fake.storage.from("estate-media").upload;
    expect(uploaded).not.toHaveBeenCalled();
  });

  it("uploads an allowed image to the estate-media bucket", async () => {
    const fake = getFake();
    const file = makeFile("sunrise.jpg", "image/jpeg");
    await renderMedia();
    const input = document.querySelector("#media-upload") as HTMLInputElement;
    expect(input).not.toBeNull();
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("File uploaded"));
    const uploaded = fake.storage.from("estate-media").upload;
    expect(uploaded).toHaveBeenCalledTimes(1);
    const [path, argFile, options] = uploaded.mock.calls[0] as [
      string,
      File,
      { contentType?: string; upsert?: boolean },
    ];
    expect(path).toMatch(/^uploads\/.+-sunrise\.jpg$/);
    expect(options).toMatchObject({ contentType: "image/jpeg", upsert: false });
    expect(argFile.name).toBe("sunrise.jpg");
  });

  it("deletes the storage object and the row when a media item is removed", async () => {
    await renderMedia();
    const fake = getFake();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

    await userEvent.click(
      await screen.findByRole("button", { name: /delete morning at the estate/i }),
    );

    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Media deleted"));
    const storage = fake.storage.from("estate-media");
    expect(storage.remove).toHaveBeenCalledWith(["uploads/abc-sunrise.jpg"]);
    const rowBuilders =
      // @ts-expect-error test hook
      (fake.from.__allBuilders?.["media"] ?? []).filter(
        (b: { delete: { mock: { calls: unknown[] } } }) => b.delete.mock.calls.length,
      );
    expect(rowBuilders).toHaveLength(1);
    confirmSpy.mockRestore();
  });
});
