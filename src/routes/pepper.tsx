import { createFileRoute } from "@tanstack/react-router";
import pepperImage from "@/assets/pepper-vines.jpg";
import { PageHero, Section, SectionHeading } from "@/components/section";
import { Reveal } from "@/components/reveal";
import { MediaGrid } from "@/components/media-grid";
import { usePageContent, useMedia } from "@/lib/estate";
import { SITE_NAME, DEFAULT_OG_IMAGE } from "@/lib/seo";

const SITE_URL = import.meta.env["VITE_SITE_URL"] || "https://ammikulaviestate.com";

export const Route = createFileRoute("/pepper")({
  head: () => ({
    meta: [
      { title: `Estate-Grown Pepper — ${SITE_NAME}` },
      {
        name: "description",
        content:
          "Hand-harvested, sun-dried pepper grown on living shade trees between the coffee blocks of Ammikulavi Estate.",
      },
      { property: "og:title", content: `Estate-Grown Pepper — ${SITE_NAME}` },
      {
        property: "og:description",
        content: "Cultivation, harvest, processing and flavour of our estate pepper.",
      },
      { property: "og:url", content: `${SITE_URL}/pepper` },
      { property: "og:image", content: `${SITE_URL}${DEFAULT_OG_IMAGE}` },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/pepper` }],
  }),
  component: PepperPage,
});

function PepperPage() {
  const { get } = usePageContent("pepper");
  const { data: media } = useMedia("Pepper");

  return (
    <>
      <PageHero
        eyebrow="The Pepper"
        title={get("heading", "The Spice of the Estate.")}
        intro="Vines climbing the same shade trees that shelter our coffee."
        image={pepperImage}
        alt="Green peppercorn spikes hanging from vines on a shade tree"
      />

      <Section tone="cream">
        <div className="grid gap-14 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <SectionHeading eyebrow="Overview" title="Grown between the coffee" />
            <Reveal className="mt-8 text-muted-foreground">
              <p>{get("overview", "")}</p>
            </Reveal>
          </div>
          <Reveal delay={120}>
            <dl className="divide-y divide-border border-y border-border">
              {[
                ["Cultivation", get("cultivation", "")],
                ["Harvest", "Spikes picked by hand as berries turn from green to first blush."],
                ["Processing", "Blanched, sun-dried in small lots, then hand-graded."],
                ["Flavour", get("flavour", "")],
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

      <Section tone="offwhite">
        <SectionHeading eyebrow="Pepper Gallery" title="Vines, spikes and drying yards" />
        <MediaGrid items={media ?? []} />
      </Section>
    </>
  );
}
