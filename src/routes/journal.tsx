import { createFileRoute, Link } from "@tanstack/react-router";
import heroImage from "@/assets/hero-estate.jpg";
import { PageHero, Section, SectionHeading } from "@/components/section";
import { Reveal } from "@/components/reveal";
import { formatDate, usePublishedPosts } from "@/lib/estate";
import { SITE_NAME, DEFAULT_OG_IMAGE } from "@/lib/seo";

const SITE_URL = import.meta.env["VITE_SITE_URL"] || "https://ammikulaviestate.com";

export const Route = createFileRoute("/journal")({
  head: () => ({
    meta: [
      { title: `The Estate Journal — ${SITE_NAME}` },
      {
        name: "description",
        content:
          "Stories, notes and field observations from Ammikulavi Estate — coffee cultivation, harvest, sustainability and estate life.",
      },
      { property: "og:title", content: `The Estate Journal — ${SITE_NAME}` },
      {
        property: "og:description",
        content: "Stories and field notes from the plantation.",
      },
      { property: "og:url", content: `${SITE_URL}/journal` },
      { property: "og:image", content: `${SITE_URL}${DEFAULT_OG_IMAGE}` },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/journal` }],
  }),
  component: JournalPage,
});

function JournalPage() {
  const { data: posts, isLoading } = usePublishedPosts();

  return (
    <>
      <PageHero
        eyebrow="The Estate Journal"
        title="Notes from the plantation."
        intro="Stories of coffee, pepper, harvest and the people who tend them."
        image={heroImage}
        alt="Mist drifting through the plantation canopy"
      />

      <Section tone="cream">
        {isLoading ? (
          <div className="mt-6 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-4">
                <div className="h-56 animate-pulse rounded-sm bg-muted" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                <div className="h-6 w-4/5 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : posts && posts.length > 0 ? (
          <div className="mt-6 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, i) => (
              <Reveal key={post.id} delay={i * 80} as="article">
                <Link to="/journal/$slug" params={{ slug: post.slug }} className="group block">
                  {post.featured_image && (
                    <div className="overflow-hidden rounded-sm">
                      <img
                        src={post.featured_image}
                        alt={post.title}
                        loading="lazy"
                        className="h-56 w-full object-cover transition-transform duration-[1200ms] group-hover:scale-105"
                      />
                    </div>
                  )}
                  <p className="eyebrow mt-5">
                    {post.category} · {formatDate(post.published_at ?? post.created_at)}
                  </p>
                  <h2 className="mt-2 font-display text-2xl group-hover:text-primary">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                      {post.excerpt}
                    </p>
                  )}
                </Link>
              </Reveal>
            ))}
          </div>
        ) : (
          <Reveal className="mt-6">
            <SectionHeading eyebrow="Coming Soon" title="The first entries are being written." />
            <p className="mt-4 max-w-lg text-sm text-muted-foreground">
              Please look in again soon — stories from the plantation will appear here as they are
              published.
            </p>
          </Reveal>
        )}
      </Section>
    </>
  );
}
