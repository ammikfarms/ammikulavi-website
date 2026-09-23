import { createFileRoute } from "@tanstack/react-router";
import sustainabilityImage from "@/assets/sustainability.jpg";
import { PageHero, Section, SectionHeading } from "@/components/section";
import { Reveal } from "@/components/reveal";
import { usePageContent } from "@/lib/estate";
import { SITE_NAME, DEFAULT_OG_IMAGE } from "@/lib/seo";

const SITE_URL = import.meta.env["VITE_SITE_URL"] || "https://ammikulaviestate.com";

export const Route = createFileRoute("/sustainability")({
  head: () => ({
    meta: [
      { title: `Sustainability — ${SITE_NAME}` },
      {
        name: "description",
        content:
          "Shade-grown cultivation, soil health, biodiversity and water conservation at Ammikulavi Estate.",
      },
      { property: "og:title", content: `Sustainability — ${SITE_NAME}` },
      {
        property: "og:description",
        content: "How we farm with the forest: soil, biodiversity, water and restraint.",
      },
      { property: "og:url", content: `${SITE_URL}/sustainability` },
      { property: "og:image", content: `${SITE_URL}${DEFAULT_OG_IMAGE}` },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/sustainability` }],
  }),
  component: SustainabilityPage,
});

const pillars = [
  { title: "Soil health", body: "Estate compost, mulch from prunings, and no bare ground." },
  {
    title: "Biodiversity",
    body: "Native canopy and wild corridors left intact for birds and pollinators.",
  },
  {
    title: "Water",
    body: "Processing water recycled; streams and springs buffered by vegetation.",
  },
  { title: "Respect for nature", body: "We take what the seasons offer and leave the rest alone." },
];

function SustainabilityPage() {
  const { get } = usePageContent("sustainability");

  return (
    <>
      <PageHero
        eyebrow="Sustainability"
        title={get("heading", "Growing With Nature, Not Against It.")}
        image={sustainabilityImage}
        alt="A clear stream running through dense rainforest on the estate"
      />

      <Section tone="cream">
        <div className="grid gap-14 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <SectionHeading eyebrow="Our Approach" title="The canopy keeps everything alive" />
            <Reveal className="mt-8 text-muted-foreground">
              <p>{get("body", "")}</p>
            </Reveal>
          </div>
          <Reveal delay={120} className="grid gap-8 sm:grid-cols-2">
            {pillars.map((p) => (
              <div key={p.title}>
                <span className="gold-rule" />
                <h3 className="mt-4 font-display text-2xl">{p.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{p.body}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </Section>
    </>
  );
}
