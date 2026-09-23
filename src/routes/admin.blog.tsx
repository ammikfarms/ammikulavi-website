import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BLOG_CATEGORIES, formatDate, slugify, type BlogPost } from "@/lib/estate";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/blog")({
  component: BlogManager,
});

function BlogManager() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { data: posts, isLoading } = useQuery({
    queryKey: ["admin", "all-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as BlogPost[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blog_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "all-posts"] });
      toast.success("Post deleted");
    },
  });

  const toggleStatus = useMutation({
    mutationFn: async (post: BlogPost) => {
      const newStatus = post.status === "published" ? "draft" : "published";
      const { error } = await supabase
        .from("blog_posts")
        .update({
          status: newStatus,
          published_at: newStatus === "published" ? new Date().toISOString() : null,
        })
        .eq("id", post.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "all-posts"] });
      toast.success("Status updated");
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Blog Manager</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Create, edit and publish journal entries.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="inline-flex items-center gap-2 rounded-sm bg-primary px-5 py-2.5 text-xs font-semibold tracking-[0.16em] uppercase text-primary-foreground transition-colors hover:bg-secondary"
        >
          <Plus className="size-4" />
          New post
        </button>
      </div>

      {showForm && (
        <PostEditor
          post={editing}
          onSaved={() => {
            setShowForm(false);
            setEditing(null);
            queryClient.invalidateQueries({ queryKey: ["admin", "all-posts"] });
          }}
          onCancel={() => {
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}

      <div className="mt-8 space-y-3">
        {isLoading ? (
          [1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-sm bg-muted" />)
        ) : posts && posts.length > 0 ? (
          posts.map((post) => (
            <div
              key={post.id}
              className="flex items-center gap-4 rounded-sm border border-border bg-card px-5 py-4"
            >
              <div className="min-w-0 flex-1">
                <Link
                  to="/journal/$slug"
                  params={{ slug: post.slug }}
                  className="font-display text-lg hover:text-primary"
                  target="_blank"
                >
                  {post.title}
                </Link>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {post.category} · {formatDate(post.created_at)}
                  {post.status === "published" && (
                    <span className="ml-2 text-primary">Published</span>
                  )}
                  {post.status === "draft" && (
                    <span className="ml-2 text-muted-foreground">Draft</span>
                  )}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleStatus.mutate(post)}
                  className="rounded-sm border border-border p-2 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  aria-label={
                    post.status === "published"
                      ? `Unpublish ${post.title}`
                      : `Publish ${post.title}`
                  }
                  title={post.status === "published" ? "Unpublish" : "Publish"}
                >
                  {post.status === "published" ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(post);
                    setShowForm(true);
                  }}
                  className="rounded-sm border border-border p-2 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  aria-label={`Edit ${post.title}`}
                  title="Edit"
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Delete this post permanently?")) deleteMutation.mutate(post.id);
                  }}
                  className="rounded-sm border border-border p-2 text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
                  aria-label={`Delete ${post.title}`}
                  title="Delete"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="mt-6 text-sm text-muted-foreground">
            No posts yet. Create your first journal entry above.
          </p>
        )}
      </div>
    </div>
  );
}

function PostEditor({
  post,
  onSaved,
  onCancel,
}: {
  post: BlogPost | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [category, setCategory] = useState(post?.category ?? "Estate Life");
  const [tags, setTags] = useState((post?.tags ?? []).join(", "));
  const [featuredImage, setFeaturedImage] = useState(post?.featured_image ?? "");
  const [author, setAuthor] = useState(post?.author ?? "Ammikulavi Estate");
  const [status, setStatus] = useState(post?.status ?? "draft");
  const [saving, setSaving] = useState(false);
  const [slugEdited, setSlugEdited] = useState(!!post);

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!slugEdited) setSlug(slugify(value));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      title,
      slug,
      excerpt: excerpt || null,
      content,
      featured_image: featuredImage || null,
      author,
      category,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      status,
      published_at:
        status === "published" && !post?.published_at
          ? new Date().toISOString()
          : (post?.published_at ?? null),
    };

    if (post) {
      const { error } = await supabase.from("blog_posts").update(payload).eq("id", post.id);
      if (error) {
        toast.error(error.message);
        setSaving(false);
        return;
      }
    } else {
      const { error } = await supabase.from("blog_posts").insert(payload);
      if (error) {
        toast.error(error.message);
        setSaving(false);
        return;
      }
    }

    toast.success(post ? "Post updated" : "Post created");
    onSaved();
    setSaving(false);
  };

  return (
    <form
      onSubmit={handleSave}
      className="mt-8 space-y-6 rounded-sm border border-border bg-card p-6"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="eyebrow mb-2 block text-foreground/80">Title</span>
          <input
            required
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="w-full rounded-sm border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="eyebrow mb-2 block text-foreground/80">Slug</span>
          <input
            required
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugEdited(true);
            }}
            className="w-full rounded-sm border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </label>
        <label className="block">
          <span className="eyebrow mb-2 block text-foreground/80">Category</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-sm border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          >
            {BLOG_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="eyebrow mb-2 block text-foreground/80">Status</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-sm border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </label>
        <label className="block">
          <span className="eyebrow mb-2 block text-foreground/80">Author</span>
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="w-full rounded-sm border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </label>
        <label className="block">
          <span className="eyebrow mb-2 block text-foreground/80">Tags (comma-separated)</span>
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="e.g. coffee, harvest, sustainability"
            className="w-full rounded-sm border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="eyebrow mb-2 block text-foreground/80">Featured image URL</span>
          <input
            value={featuredImage}
            onChange={(e) => setFeaturedImage(e.target.value)}
            placeholder="https://..."
            className="w-full rounded-sm border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="eyebrow mb-2 block text-foreground/80">Excerpt</span>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={2}
            className="w-full resize-y rounded-sm border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="eyebrow mb-2 block text-foreground/80">Content</span>
          <textarea
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={14}
            className="w-full resize-y rounded-sm border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </label>
      </div>
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-sm bg-primary px-6 py-2.5 text-xs font-semibold tracking-[0.16em] uppercase text-primary-foreground transition-colors hover:bg-secondary disabled:opacity-50"
        >
          {saving ? "Saving…" : post ? "Update post" : "Create post"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-sm border border-border px-6 py-2.5 text-xs font-semibold tracking-[0.16em] uppercase text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
