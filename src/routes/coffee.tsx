import { createFileRoute } from "@tanstack/react-router";
import { Sprout, Trees, Hand, Droplets, Flame, Coffee } from "lucide-react";
import coffeeImage from "@/assets/coffee-cherries.jpg";
import { PageHero, Section, SectionHeading } from "@/components/section";
import { Reveal } from "@/components/reveal";
import { MediaGrid } from "@/components/media-grid";
import { usePageContent, useMedia } from "@/lib/estate";
import { SITE_NAME, DEFAULT_OG_IMAGE } from "@/lib/seo";

const SITE_URL = import.meta.env["VITE_SITE_URL"] || "https://ammikulaviestate.com";

export const Route = createFileRoute("/coffee")({
  head: () => ({
    meta: [
      { title: `Estate-Grown Specialty Coffee — ${SITE_NAME}` },
      {
        name: "description",
        content:
          "Varieties, altitude, processing and flavour profiles of Ammikulavi Estate's shade-grown specialty coffee, from seed to cup.",
      },
      { property: "og:title", content: `Estate-Grown Specialty Coffee — ${SITE_NAME}` },
      {
        property: "og:description",
        content: "Varieties, altitude, processing and flavour of our shade-grown specialty coffee.",
      },
      { property: "og:url", content: `${SITE_URL}/coffee` },
      { property: "og:image", content: `${SITE_URL}${DEFAULT_OG_IMAGE}` },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/coffee` }],
  }),
  component: CoffeePage,
});

const journey = [
  { icon: Sprout, title: "Seed", body: "Nursery-raised seedlings from selected mother plants." },
  { icon: Trees, title: "Plantation", body: "Planted beneath native shade at estate elevation." },
  { icon: Hand, title: "Harvest", body: "Selective hand-picking across several ripening passes." },
  {
    icon: Droplets,
    title: "Processing",
    body: "Washed, natural and honey lots, sun-dried slowly.",
  },
  { icon: Flame, title: "Roasting", body: "Small-batch roasting tuned to each lot's character." },
  { icon: Coffee, title: "Cup", body: "Cocoa, orange blossom and a rounded, syrupy finish." },
];

function CoffeePage() {
  const { get } = usePageContent("coffee");
  const { data: media } = useMedia("Coffee");

  return (
    <>
      <PageHero
        eyebrow="The Coffee"
        title={get("heading", "Specialty Coffee, Grown in Shade.")}
        intro="Slow ripening, selective picking, and patient drying."
        image={coffeeImage}
        alt="Ripe red coffee cherries on the branch"
      />

      <Section tone="cream">
        <div className="grid gap-14 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <SectionHeading eyebrow="Overview" title="Estate-grown, single origin" />
            <Reveal className="mt-8 text-muted-foreground">
              <p>{get("overview", "")}</p>
            </Reveal>
          </div>
          <Reveal delay={120}>
            <dl className="divide-y divide-border border-y border-border">
              {[
                ["Varieties", get("varieties", "")],
                ["Altitude", get("altitude", "")],
                ["Processing", get("processing", "")],
                ["Flavour profile", get("flavour", "")],
              ].map(([label, value]) => (
                <div key={label} className="grid gap-1 py-5 sm:grid-cols-[10rem_1fr]">
                  <dt className="eyebrow pt-1">{label}</dt>
                  <dd className="text-sm text-muted-foreground">{value}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </Section>

      <Section tone="forest">
        <SectionHeading
          eyebrow="The Coffee Journey"
          title="Seed to cup"
          className="text-primary-foreground"
        />
        <ol className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {journey.map((step, i) => (
            <Reveal key={step.title} delay={i * 80} as="li">
              <step.icon className="size-6 text-accent" strokeWidth={1.4} />
              <p className="eyebrow mt-4 text-primary-foreground/60">
                {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-1 font-display text-2xl">{step.title}</h3>
              <p className="mt-2 text-sm text-primary-foreground/75">{step.body}</p>
            </Reveal>
          ))}
        </ol>
      </Section>

      <Section tone="offwhite">
        <SectionHeading eyebrow="Coffee Gallery" title="From the plantation" />
        <MediaGrid items={media ?? []} />
      </Section>
    </>
  );
}
