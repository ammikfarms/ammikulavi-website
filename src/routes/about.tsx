import { createFileRoute } from "@tanstack/react-router";
import heroImage from "@/assets/hero-estate.jpg";
import estateLife from "@/assets/estate-life.jpg";
import { PageHero, Section, SectionHeading } from "@/components/section";
import { Reveal } from "@/components/reveal";
import { usePageContent } from "@/lib/estate";
import { SITE_NAME, DEFAULT_OG_IMAGE } from "@/lib/seo";

const SITE_URL = import.meta.env["VITE_SITE_URL"] || "https://ammikulaviestate.com";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: `About ${SITE_NAME} — Rooted in Nature` },
      {
        name: "description",
        content:
          "The history, landscape and cultivation philosophy behind Ammikulavi Estate's shade-grown coffee and pepper.",
      },
      { property: "og:title", content: `About ${SITE_NAME} — Rooted in Nature` },
      {
        property: "og:description",
        content: "History, landscape and philosophy behind Ammikulavi Estate.",
      },
      { property: "og:url", content: `${SITE_URL}/about` },
      { property: "og:image", content: `${SITE_URL}${DEFAULT_OG_IMAGE}` },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/about` }],
  }),
  component: About,
});

function About() {
  const { get } = usePageContent("about");

  return (
    <>
      <PageHero
        eyebrow="The Estate"
        title={get("heading", "Rooted in Nature. Crafted with Care.")}
        intro="A family plantation shaped by mist, canopy and patience."
        image={heroImage}
        alt="Shade-grown coffee plantation in morning mist"
      />

      <Section tone="cream">
        <div className="grid gap-16 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <SectionHeading eyebrow="Our History" title="Grown outward, never upward" />
            <Reveal className="mt-8 space-y-6 text-muted-foreground">
              <p>{get("history", "")}</p>
            </Reveal>

            <SectionHeading
              eyebrow="Location & Environment"
              title="Elevation, mist and monsoon"
              className="mt-20"
            />
            <Reveal className="mt-8 space-y-6 text-muted-foreground">
              <p>{get("location", "")}</p>
            </Reveal>
          </div>

          <Reveal delay={120}>
            <img
              src={estateLife}
              alt="Coffee drying on raised beds at the estate"
              width={1408}
              height={1008}
              loading="lazy"
              className="sticky top-28 h-[34rem] w-full rounded-sm object-cover"
            />
          </Reveal>
        </div>
      </Section>

      <Section tone="offwhite">
        <SectionHeading eyebrow="Philosophy" title="Soil, climate and flavour" />
        <Reveal className="mt-8 max-w-3xl text-muted-foreground">
          <p>{get("philosophy", "")}</p>
        </Reveal>

        <div className="mt-16 grid gap-10 sm:grid-cols-3">
          {[
            { title: "Shade first", body: "Native canopy stays; the plantation grows beneath it." },
            { title: "Hand-picked", body: "Selective passes so only ripe cherries are harvested." },
            {
              title: "Slow finishing",
              body: "Sun-drying on raised beds, turned by hand, never rushed.",
            },
          ].map((item, i) => (
            <Reveal key={item.title} delay={i * 100}>
              <span className="gold-rule" />
              <h3 className="mt-5 font-display text-2xl">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
            </Reveal>
          ))}
        </div>
      </Section>
    </>
  );
}
