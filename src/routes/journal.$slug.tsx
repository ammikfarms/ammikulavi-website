import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { Section } from "@/components/section";
import { formatDate, usePost } from "@/lib/estate";
import { SITE_NAME } from "@/lib/seo";
import { useDynamicMeta } from "@/lib/use-dynamic-meta";

const SITE_URL = import.meta.env["VITE_SITE_URL"] || "https://ammikulaviestate.com";

export const Route = createFileRoute("/journal/$slug")({
  head: ({ params }) => {
    const slug = params.slug;
    const title = slug.replace(/-/g, " ");
    return {
      meta: [
        { title: `${title} — ${SITE_NAME}` },
        {
          name: "description",
          content: `Read about ${title} on the Ammikulavi Estate journal.`,
        },
        { property: "og:title", content: `${title} — ${SITE_NAME}` },
        {
          property: "og:description",
          content: `Read about ${title} on the Ammikulavi Estate journal.`,
        },
        { property: "og:type", content: "article" },
        { property: "og:url", content: `${SITE_URL}/journal/${slug}` },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: `${SITE_URL}/journal/${slug}` }],
    };
  },
  component: JournalPost,
});

function JournalPost() {
  const { slug } = Route.useParams();
  const { data: post, isLoading } = usePost(slug);

  // Dynamically update OG tags when post data loads (especially og:image)
  useDynamicMeta({
    "og:image": post?.featured_image || "",
    "og:description":
      post?.excerpt || `Read about ${slug.replace(/-/g, " ")} on the Ammikulavi Estate journal.`,
    "twitter:image": post?.featured_image || "",
  });

  if (isLoading) {
    return (
      <Section tone="cream" className="pt-36">
        <div className="mx-auto max-w-3xl space-y-4">
          <div className="h-5 w-40 animate-pulse rounded bg-muted" />
          <div className="h-10 w-3/4 animate-pulse rounded bg-muted" />
          <div className="mt-8 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-4 animate-pulse rounded bg-muted" />
            ))}
          </div>
        </div>
      </Section>
    );
  }

  if (!post) {
    return (
      <Section tone="cream" className="pt-36">
        <div className="mx-auto max-w-3xl text-center">
          <p className="eyebrow">Not Found</p>
          <h1 className="mt-4 font-display text-4xl">This entry has been removed</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            The journal post you are looking for does not exist or has been unpublished.
          </p>
          <Link
            to="/journal"
            className="mt-8 inline-flex items-center gap-2 rounded-sm bg-primary px-6 py-3 text-xs font-semibold tracking-[0.18em] uppercase text-primary-foreground transition-colors hover:bg-secondary"
          >
            <ArrowLeft className="size-4" />
            Back to the Journal
          </Link>
        </div>
      </Section>
    );
  }

  return (
    <>
      {post.featured_image && (
        <section className="relative h-[46vh] min-h-[320px] overflow-hidden">
          <img
            src={post.featured_image}
            alt={post.title}
            className="absolute inset-0 size-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-secondary/80 to-secondary/20" />
        </section>
      )}

      <Section tone="cream" className={post.featured_image ? "-mt-16 relative" : "pt-32"}>
        <article className="mx-auto max-w-3xl">
          <Reveal>
            <Link
              to="/journal"
              className="mb-8 inline-flex items-center gap-2 text-xs font-semibold tracking-[0.14em] uppercase text-primary transition-colors hover:text-secondary"
            >
              <ArrowLeft className="size-4" />
              The Estate Journal
            </Link>

            <p className="eyebrow">
              {post.category}
              {post.published_at
                ? ` · ${formatDate(post.published_at)}`
                : post.created_at
                  ? ` · ${formatDate(post.created_at)}`
                  : ""}
            </p>

            <h1 className="mt-4 font-display text-3xl sm:text-5xl">{post.title}</h1>

            {post.author && <p className="mt-4 text-sm text-muted-foreground">By {post.author}</p>}

            <span className="gold-rule mt-6" />
          </Reveal>

          {post.excerpt && (
            <Reveal>
              <p className="mt-8 font-display text-xl leading-relaxed text-muted-foreground">
                {post.excerpt}
              </p>
            </Reveal>
          )}

          <Reveal>
            <div className="prose-estate mt-10 text-foreground/85">
              {post.content.split("\n").map((paragraph, i) => {
                const trimmed = paragraph.trim();
                if (!trimmed) return <br key={i} />;
                return (
                  <p key={i} className="max-w-[68ch]">
                    {trimmed}
                  </p>
                );
              })}
            </div>
          </Reveal>

          {post.tags.length > 0 && (
            <Reveal>
              <div className="mt-12 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-sm border border-border px-3 py-1 text-xs text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </Reveal>
          )}

          <Reveal>
            <div className="mt-14 border-t border-border pt-8">
              <Link
                to="/journal"
                className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.14em] uppercase text-primary transition-colors hover:text-secondary"
              >
                <ArrowLeft className="size-4" />
                Back to the Journal
              </Link>
            </div>
          </Reveal>
        </article>
      </Section>
    </>
  );
}
