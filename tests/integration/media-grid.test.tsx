import { describe, it, expect, vi } from "vitest";
import { render, renderHook, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MediaGrid, useMediaUrls } from "@/components/media-grid";
import type { MediaItem } from "@/lib/estate";

vi.mock("@/integrations/supabase/client", async () => {
  const { createFakeSupabase } = await import("../mocks/supabase");
  return { supabase: createFakeSupabase() };
});

const PHOTO: MediaItem = {
  id: "m-1",
  title: "Morning mist",
  caption: "Plantation at sunrise",
  alt_text: "Coffee plantation in morning mist",
  file_url: "/media/estate.jpg",
  storage_path: null,
  file_type: "image",
  category: "coffee",
  sort_order: 1,
  created_at: "2026-01-01T00:00:00Z",
};

const VIDEO: MediaItem = {
  ...PHOTO,
  id: "m-2",
  title: "Harvest film",
  alt_text: "Harvest at the estate",
  file_url: "/media/harvest.mp4",
  file_type: "video",
};

function renderMedia(items: MediaItem[]) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MediaGrid items={items} />
    </QueryClientProvider>,
  );
}

describe("MediaGrid lightbox a11y", () => {
  it("shows an empty-state message when there is no media", () => {
    renderMedia([]);
    expect(screen.getByText(/photographs and films from the estate/i)).toBeInTheDocument();
  });

  it("renders thumbnails with descriptive alt text", () => {
    renderMedia([PHOTO]);
    expect(
      screen.getByRole("img", { name: "Coffee plantation in morning mist" }),
    ).toBeInTheDocument();
  });

  it("opens a labelled modal dialog on selection and closes with Escape", async () => {
    renderMedia([PHOTO]);

    const thumbnail = screen.getByRole("button", { name: /morning mist/i });
    await userEvent.click(thumbnail);

    const dialog = await screen.findByRole("dialog", { name: "Morning mist" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(within(dialog).getByRole("img")).toHaveAttribute("src", "/media/estate.jpg");

    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders videos with a video element instead of an image", () => {
    renderMedia([VIDEO]);
    // The thumbnail <button> wraps a <video> (no implicit accessible name),
    // so assert on the media element that is actually rendered.
    expect(document.querySelectorAll("video").length).toBe(1);
    expect(screen.queryByRole("img", { name: /harvest film/i })).not.toBeInTheDocument();
  });

  it("falls back to the generic dialog label for unlabelled media", async () => {
    renderMedia([{ ...PHOTO, title: "", caption: "" }]);
    const thumbnail = screen.getByRole("button", { name: /coffee plantation in morning mist/i });
    await userEvent.click(thumbnail);
    expect(await screen.findByRole("dialog", { name: "Estate media" })).toBeVisible();
  });
});

describe("useMediaUrls resolve", () => {
  it("falls back to the row's own file_url when no storage path is set", () => {
    const { result } = renderHookWithUrLs([PHOTO]);
    expect(result.current(PHOTO)).toBe("/media/estate.jpg");
  });
});

function renderHookWithUrLs(items: MediaItem[]) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return renderHook(() => useMediaUrls(items), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });
}
