import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import heroImage from "@/assets/hero-estate.jpg";
import coffeeImage from "@/assets/coffee-cherries.jpg";
import pepperImage from "@/assets/pepper-vines.jpg";
import sustainabilityImage from "@/assets/sustainability.jpg";
import { BrandLogo } from "@/components/brand-logo";
import { Reveal } from "@/components/reveal";
import { Section, SectionHeading } from "@/components/section";
import { MediaGrid } from "@/components/media-grid";
import { formatDate, useMedia, usePageContent, usePublishedPosts } from "@/lib/estate";
import { SITE_NAME, DEFAULT_OG_IMAGE } from "@/lib/seo";

const SITE_URL = import.meta.env["VITE_SITE_URL"] || "https://ammikulaviestate.com";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${SITE_NAME} — Specialty Coffee & Premium Pepper` },
      {
        name: "description",
        content:
          "From the estate to every cup. Shade-grown specialty coffee and hand-picked pepper from Ammikulavi Estate.",
      },
      { property: "og:title", content: `${SITE_NAME} — Specialty Coffee & Premium Pepper` },
      {
        property: "og:description",
        content:
          "Shade-grown specialty coffee and hand-picked premium pepper, cultivated amidst native rainforest.",
      },
      { property: "og:url", content: `${SITE_URL}/` },
      { property: "og:image", content: `${SITE_URL}${DEFAULT_OG_IMAGE}` },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: `${SITE_URL}${DEFAULT_OG_IMAGE}` },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/` }],
  }),
  component: Home,
});

function Home() {
  const { get } = usePageContent("home");
  const { data: posts } = usePublishedPosts(3);
  const { data: media } = useMedia();
  const galleryPreview = (media ?? []).slice(0, 6);

  return (
    <>
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
        <img
          src={heroImage}
          alt="Mist over the shade-grown coffee plantation at Ammikulavi Estate"
          width={1920}
          height={1088}
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/60 via-secondary/45 to-secondary/85" />
        <div className="relative mx-auto max-w-3xl px-5 py-32 text-center">
          <BrandLogo
            width={220}
            height={190}
            className="mx-auto h-32 w-auto sm:h-40"
            fallbackClassName="block text-4xl text-primary-foreground sm:text-5xl"
          />
          <h1 className="mt-8 font-display text-4xl leading-[1.05] text-primary-foreground sm:text-6xl md:text-7xl">
            {get("hero_headline", "From the Estate to Every Cup.")}
          </h1>
          <span className="gold-rule mx-auto mt-7" />
          <p className="mx-auto mt-7 max-w-xl text-primary-foreground/85">
            {get(
              "hero_subline",
              "Cultivating exceptional coffee and pepper amidst the richness of nature.",
            )}
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/coffee"
              className="inline-flex items-center gap-2 rounded-sm bg-accent px-7 py-3.5 text-xs font-semibold tracking-[0.18em] uppercase text-accent-foreground transition-colors hover:bg-accent/85"
            >
              Explore our coffee <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/about"
              className="inline-flex items-center gap-2 rounded-sm border border-primary-foreground/50 px-7 py-3.5 text-xs font-semibold tracking-[0.18em] uppercase text-primary-foreground transition-colors hover:bg-primary-foreground/10"
            >
              Discover the estate
            </Link>
          </div>
        </div>
      </section>

      <Section tone="cream">
        <div className="grid gap-14 lg:grid-cols-[1fr_1.05fr] lg:items-center">
          <Reveal>
            <p className="eyebrow">Ammikulavi Estate</p>
            <h2 className="mt-3 font-display text-3xl sm:text-5xl">
              {get("intro_heading", "Rooted in Nature. Crafted with Care.")}
            </h2>
            <span className="gold-rule mt-6" />
            <p className="mt-7 text-muted-foreground">
              {get(
                "intro_body",
                "Ammikulavi Estate rests in the shade of old rainforest canopy, where mist settles into the valleys each morning and the soil carries generations of care.",
              )}
            </p>
            <Link
              to="/about"
              className="mt-8 inline-flex items-center gap-2 text-xs font-semibold tracking-[0.18em] uppercase text-primary"
            >
              Our story <ArrowRight className="size-4" />
            </Link>
          </Reveal>
          <Reveal delay={120}>
            <img
              src={sustainabilityImage}
              alt="Rainforest stream running through the estate"
              width={1408}
              height={1008}
              loading="lazy"
              className="h-[28rem] w-full rounded-sm object-cover"
            />
          </Reveal>
        </div>
      </Section>

      <Section tone="offwhite">
        <div className="grid gap-6 md:grid-cols-2">
          {[
            {
              to: "/coffee" as const,
              image: coffeeImage,
              eyebrow: "The Coffee",
              title: "Slow-ripened under native shade",
              body: "Selected Arabica and heritage Robusta, picked across several passes and finished on raised beds.",
              alt: "Ripe red coffee cherries on the branch",
            },
            {
              to: "/pepper" as const,
              image: pepperImage,
              eyebrow: "The Pepper",
              title: "The spice of the estate",
              body: "Vines trained on living shade trees, hand-harvested and sun-dried in small lots.",
              alt: "Black pepper vines climbing a shade tree",
            },
          ].map((card, i) => (
            <Reveal key={card.to} delay={i * 120} as="article">
              <Link to={card.to} className="group block">
                <div className="overflow-hidden rounded-sm">
                  <img
                    src={card.image}
                    alt={card.alt}
                    width={1408}
                    height={1008}
                    loading="lazy"
                    className="h-80 w-full object-cover transition-transform duration-[1200ms] group-hover:scale-105"
                  />
                </div>
                <p className="eyebrow mt-6">{card.eyebrow}</p>
                <h3 className="mt-2 font-display text-3xl">{card.title}</h3>
                <p className="mt-3 max-w-md text-sm text-muted-foreground">{card.body}</p>
              </Link>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section tone="forest">
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="eyebrow text-accent">Estate Philosophy</p>
          <blockquote className="mt-6 font-display text-3xl leading-tight sm:text-4xl">
            “Flavour is a record of place. Our work is mostly restraint — protect the forest,
            harvest at the right moment, and let the estate speak.”
          </blockquote>
        </Reveal>
      </Section>

      <Section tone="cream">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading eyebrow="Estate Gallery" title="Glimpses of the land" />
          <Link
            to="/gallery"
            className="text-xs font-semibold tracking-[0.18em] uppercase text-primary"
          >
            View gallery
          </Link>
        </div>
        <MediaGrid items={galleryPreview} />
      </Section>

      <Section tone="offwhite">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading eyebrow="The Estate Journal" title="Notes from the plantation" />
          <Link
            to="/journal"
            className="text-xs font-semibold tracking-[0.18em] uppercase text-primary"
          >
            All entries
          </Link>
        </div>

        {posts && posts.length > 0 ? (
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {posts.map((post, i) => (
              <Reveal key={post.id} delay={i * 100} as="article">
                <Link to="/journal/$slug" params={{ slug: post.slug }} className="group block">
                  {post.featured_image && (
                    <img
                      src={post.featured_image}
                      alt={post.title}
                      loading="lazy"
                      className="mb-5 h-56 w-full rounded-sm object-cover"
                    />
                  )}
                  <p className="eyebrow">
                    {post.category} · {formatDate(post.published_at ?? post.created_at)}
                  </p>
                  <h3 className="mt-2 font-display text-2xl group-hover:text-primary">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="mt-2 text-sm text-muted-foreground">{post.excerpt}</p>
                  )}
                </Link>
              </Reveal>
            ))}
          </div>
        ) : (
          <p className="mt-10 max-w-lg text-sm text-muted-foreground">
            The first journal entries are being written. Please look in again soon.
          </p>
        )}
      </Section>

      <Section tone="cream">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">Visit the Estate</p>
          <h2 className="mt-3 font-display text-3xl sm:text-5xl">
            Come and walk the plantation with us.
          </h2>
          <span className="gold-rule mx-auto mt-6" />
          <p className="mt-6 text-muted-foreground">
            For orders, trade enquiries or estate visits, we would be glad to hear from you.
          </p>
          <Link
            to="/contact"
            className="mt-8 inline-flex items-center gap-2 rounded-sm bg-primary px-7 py-3.5 text-xs font-semibold tracking-[0.18em] uppercase text-primary-foreground transition-colors hover:bg-secondary"
          >
            Get in touch <ArrowRight className="size-4" />
          </Link>
        </Reveal>
      </Section>
    </>
  );
}
