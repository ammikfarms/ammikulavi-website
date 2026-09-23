import { useCallback, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Upload, Trash2, Image, Film } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MEDIA_BUCKET, MEDIA_CATEGORIES, buildStoragePath, type MediaItem } from "@/lib/estate";
import { useMediaUrls } from "@/components/media-grid";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/media")({
  component: MediaManager,
});

function MediaManager() {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [category, setCategory] = useState("Estate Life");
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [altText, setAltText] = useState("");

  const { data: items, isLoading } = useQuery({
    queryKey: ["admin", "media"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("media")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as MediaItem[];
    },
  });

  const resolve = useMediaUrls(items);

  const deleteMutation = useMutation({
    mutationFn: async (item: MediaItem) => {
      if (item.storage_path) {
        await supabase.storage.from(MEDIA_BUCKET).remove([item.storage_path]);
      }
      const { error } = await supabase.from("media").delete().eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "media"] });
      toast.success("Media deleted");
    },
  });

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploading(true);

      const isVideo = file.type.startsWith("video/");
      const path = buildStoragePath(file.name, file.type);
      if (!path) {
        toast.error("Unsupported file type. Please upload an image or video.");
        setUploading(false);
        if (fileRef.current) fileRef.current.value = "";
        return;
      }

      const { error: uploadError } = await supabase.storage
        .from(MEDIA_BUCKET)
        .upload(path, file, { contentType: file.type, upsert: false });

      if (uploadError) {
        toast.error(uploadError.message);
        setUploading(false);
        return;
      }

      const { data: urlData } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);

      const { error: insertError } = await supabase.from("media").insert({
        file_url: urlData.publicUrl,
        storage_path: path,
        file_type: isVideo ? "video" : "image",
        title: title || null,
        caption: caption || null,
        alt_text: altText || null,
        category,
      });

      if (insertError) {
        toast.error(insertError.message);
      } else {
        toast.success("File uploaded");
        setTitle("");
        setCaption("");
        setAltText("");
        queryClient.invalidateQueries({ queryKey: ["admin", "media"] });
      }

      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    },
    [title, caption, altText, category, queryClient],
  );

  return (
    <div>
      <h1 className="font-display text-3xl">Media Manager</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Upload, organise and manage estate photographs and videos.
      </p>

      <div className="mt-8 rounded-sm border border-border bg-card p-6">
        <h2 className="font-display text-xl">Upload new media</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="eyebrow mb-2 block text-foreground/80">Title</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Optional"
              className="w-full rounded-sm border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </label>
          <label className="block">
            <span className="eyebrow mb-2 block text-foreground/80">Category</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-sm border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            >
              {MEDIA_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="eyebrow mb-2 block text-foreground/80">Caption</span>
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Optional"
              className="w-full rounded-sm border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </label>
          <label className="block">
            <span className="eyebrow mb-2 block text-foreground/80">Alt text</span>
            <input
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="Optional — for accessibility"
              className="w-full rounded-sm border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </label>
        </div>
        <div className="mt-5">
          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleUpload}
            className="hidden"
            id="media-upload"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className={`inline-flex cursor-pointer items-center gap-2 rounded-sm px-5 py-2.5 text-xs font-semibold tracking-[0.16em] uppercase transition-colors ${
              uploading
                ? "pointer-events-none bg-muted text-muted-foreground"
                : "bg-primary text-primary-foreground hover:bg-secondary"
            }`}
          >
            <Upload className="size-4" />
            {uploading ? "Uploading…" : "Choose file"}
          </button>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="font-display text-xl">Library</h2>
        {isLoading ? (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="aspect-square animate-pulse rounded-sm bg-muted" />
            ))}
          </div>
        ) : items && items.length > 0 ? (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((item) => {
              const url = resolve(item);
              return (
                <div
                  key={item.id}
                  className="group relative overflow-hidden rounded-sm border border-border bg-card"
                >
                  <div className="aspect-square overflow-hidden">
                    {item.file_type === "video" ? (
                      <div className="flex size-full items-center justify-center bg-muted">
                        <Film className="size-8 text-muted-foreground" />
                      </div>
                    ) : (
                      <img
                        src={url}
                        alt={item.alt_text ?? item.title ?? "Estate media"}
                        loading="lazy"
                        className="size-full object-cover"
                      />
                    )}
                  </div>
                  <div className="p-3">
                    <p className="truncate text-xs text-muted-foreground">
                      {item.title ?? item.category}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("Delete this media item?")) deleteMutation.mutate(item);
                    }}
                    aria-label={`Delete ${item.title ?? item.category}`}
                    className="absolute top-2 right-2 rounded-sm bg-secondary/90 p-1.5 text-primary-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100"
                    title="Delete"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="mt-6 text-sm text-muted-foreground">
            No media uploaded yet. Use the form above to add photographs and videos.
          </p>
        )}
      </div>
    </div>
  );
}
