import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const MEDIA_BUCKET = "estate-media";

export const MEDIA_CATEGORIES = [
  "Coffee",
  "Pepper",
  "Estate Life",
  "Nature",
  "Harvest",
  "People",
  "Videos",
] as const;

export const BLOG_CATEGORIES = [
  "Coffee Cultivation",
  "Harvest Stories",
  "Pepper",
  "Sustainability",
  "Estate Life",
  "Coffee Education",
  "Behind the Scenes",
] as const;

export type MediaItem = {
  id: string;
  file_url: string;
  storage_path: string | null;
  file_type: string;
  title: string | null;
  caption: string | null;
  alt_text: string | null;
  category: string;
  featured: boolean;
  sort_order: number;
  created_at: string;
};

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featured_image: string | null;
  author: string;
  category: string;
  tags: string[];
  status: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ContentRow = { page: string; key: string; value: string };

/** Editable page copy, with baked-in fallbacks so pages are never empty. */
export function usePageContent(page: string) {
  const query = useQuery({
    queryKey: ["site_content", page],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_content")
        .select("page, key, value")
        .eq("page", page);
      if (error) throw error;
      return (data ?? []) as ContentRow[];
    },
    staleTime: 60_000,
  });

  const get = (key: string, fallback = "") => {
    const row = query.data?.find((r) => r.key === key);
    return row?.value && row.value.trim().length > 0 ? row.value : fallback;
  };

  return { get, isLoading: query.isLoading };
}

export function useMedia(category?: string) {
  return useQuery({
    queryKey: ["media", category ?? "all"],
    queryFn: async () => {
      let q = supabase
        .from("media")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (category) q = q.eq("category", category);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as MediaItem[];
    },
    staleTime: 30_000,
  });
}

export function usePublishedPosts(limit?: number) {
  return useQuery({
    queryKey: ["posts", "published", limit ?? "all"],
    queryFn: async () => {
      let q = supabase
        .from("blog_posts")
        .select("*")
        .eq("status", "published")
        .order("published_at", { ascending: false, nullsFirst: false });
      if (limit) q = q.limit(limit);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as BlogPost[];
    },
    staleTime: 30_000,
  });
}

export function usePost(slug: string) {
  return useQuery({
    queryKey: ["post", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as BlogPost | null;
    },
  });
}

export function formatDate(value: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

/** Extensions we are willing to serve from the public estate-media bucket. */
const SAFE_IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "gif", "webp", "avif", "svg"]);
const SAFE_VIDEO_EXTENSIONS = new Set(["mp4", "webm", "mov", "ogg"]);

/** Reduces an uploaded file name to URL-safe characters to stop path traversal. */
export function sanitizeStorageBasename(fileName: string): string {
  const parts = fileName.split(".");
  const rawExt = parts.length > 1 ? (parts.pop() as string) : "";
  const ext = rawExt.toLowerCase().replace(/[^a-z0-9]/g, "");
  const stem = parts.join(".");
  const cleaned = stem
    .replace(/[^a-z0-9._-]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(0, 60);
  const name = cleaned || "media";
  return ext ? `${name}.${ext}` : name;
}

/**
 * Builds the storage path for an uploaded media file.
 *
 * Only image/video extensions are allowed (returns `null` otherwise) and the
 * basename is sanitised so a malicious filename (e.g. `../evil.html`) can
 * never escape the `uploads/` prefix or be served as a script.
 *
 * `suffix` is injectable for deterministic tests; production passes nothing
 * and a random token is used so concurrent uploads never collide.
 */
export function buildStoragePath(
  fileName: string,
  contentType: string,
  suffix?: string,
): string | null {
  const rawExt = fileName.split(".").pop() ?? "";
  const ext = rawExt.toLowerCase();
  const isImage = SAFE_IMAGE_EXTENSIONS.has(ext);
  const isVideo = SAFE_VIDEO_EXTENSIONS.has(ext);
  if (!isImage && !isVideo) return null;
  // Cross-check the extension family against the browser-announced type so a
  // mismatched/misleading payload (e.g. .jpg claiming video/mp4) is rejected.
  const typeMatches =
    (isImage && contentType.startsWith("image/")) || (isVideo && contentType.startsWith("video/"));
  // Some cameras/devices report application/octet-stream for stills.
  const octetCompatible = isImage && contentType === "application/octet-stream";
  if (!typeMatches && !octetCompatible) return null;
  const token = suffix ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  return `uploads/${token}-${sanitizeStorageBasename(fileName)}`;
}
