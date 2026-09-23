import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MEDIA_BUCKET, type MediaItem } from "@/lib/estate";
import { Reveal } from "@/components/reveal";
import { useQuery } from "@tanstack/react-query";

/** Resolves display URLs for media rows (private bucket -> signed URLs). */
export function useMediaUrls(items: MediaItem[] | undefined) {
  const paths = useMemo(
    () => (items ?? []).map((i) => i.storage_path).filter((p): p is string => !!p),
    [items],
  );

  const { data } = useQuery({
    queryKey: ["media-urls", paths],
    enabled: paths.length > 0,
    staleTime: 1000 * 60 * 30,
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from(MEDIA_BUCKET)
        .createSignedUrls(paths, 60 * 60 * 24 * 7);
      if (error) throw error;
      const map: Record<string, string> = {};
      for (const row of data ?? []) {
        if (row.path && row.signedUrl) map[row.path] = row.signedUrl;
      }
      return map;
    },
  });

  return (item: MediaItem) => {
    if (item.storage_path && data?.[item.storage_path]) return data[item.storage_path];
    return item.file_url;
  };
}

export function MediaGrid({ items }: { items: MediaItem[] }) {
  const resolve = useMediaUrls(items);
  const [active, setActive] = useState<MediaItem | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (items.length === 0) {
    return (
      <p className="mt-10 max-w-lg text-sm text-muted-foreground">
        Photographs and films from the estate will appear here as they are added.
      </p>
    );
  }

  return (
    <>
      <div className="mt-12 columns-1 gap-5 sm:columns-2 lg:columns-3 [&>*]:mb-5">
        {items.map((item, index) => {
          const url = resolve(item);
          const isVideo = item.file_type === "video";
          return (
            <Reveal
              key={item.id}
              as="figure"
              delay={(index % 6) * 60}
              className="break-inside-avoid"
            >
              <button
                type="button"
                onClick={() => setActive(item)}
                className="group block w-full overflow-hidden rounded-sm bg-muted text-left"
              >
                {isVideo ? (
                  <video src={url} muted playsInline preload="metadata" className="h-auto w-full" />
                ) : (
                  <img
                    src={url}
                    alt={item.alt_text ?? item.title ?? "Ammikulavi Estate"}
                    loading="lazy"
                    className="h-auto w-full transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                )}
              </button>
              {(item.title || item.caption) && (
                <figcaption className="mt-2 text-xs text-muted-foreground">
                  {item.title}
                  {item.title && item.caption ? " — " : ""}
                  {item.caption}
                </figcaption>
              )}
            </Reveal>
          );
        })}
      </div>

      {active && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={active.title?.trim() ? active.title : "Estate media"}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-secondary/95 p-4"
          onClick={() => setActive(null)}
        >
          <button
            type="button"
            aria-label="Close"
            className="absolute top-5 right-5 text-primary-foreground"
            onClick={() => setActive(null)}
          >
            <X className="size-6" />
          </button>
          <div className="max-h-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            {active.file_type === "video" ? (
              <video src={resolve(active)} controls autoPlay className="max-h-[80vh] w-full" />
            ) : (
              <img
                src={resolve(active)}
                alt={active.alt_text ?? active.title ?? "Ammikulavi Estate"}
                className="max-h-[80vh] w-auto"
              />
            )}
            {(active.title || active.caption) && (
              <p className="mt-4 text-sm text-primary-foreground/80">
                <span className="font-display text-lg">{active.title}</span>
                {active.caption ? ` — ${active.caption}` : ""}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
