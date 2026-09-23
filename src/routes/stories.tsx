import { createFileRoute } from "@tanstack/react-router";
import heroImage from "@/assets/hero-estate.jpg";
import { PageHero, Section, SectionHeading } from "@/components/section";
import { MediaGrid } from "@/components/media-grid";
import { useMedia } from "@/lib/estate";
import { SITE_NAME, DEFAULT_OG_IMAGE } from "@/lib/seo";

const SITE_URL = import.meta.env["VITE_SITE_URL"] || "https://ammikulaviestate.com";

export const Route = createFileRoute("/stories")({
  head: () => ({
    meta: [
      { title: `Films & Stories — ${SITE_NAME}` },
      {
        name: "description",
        content:
          "Short estate films, harvest and processing videos, and behind-the-scenes stories from Ammikulavi Estate.",
      },
      { property: "og:title", content: `Films & Stories — ${SITE_NAME}` },
      {
        property: "og:description",
        content: "Short films, harvest footage and behind-the-scenes from the estate.",
      },
      { property: "og:url", content: `${SITE_URL}/stories` },
      { property: "og:image", content: `${SITE_URL}${DEFAULT_OG_IMAGE}` },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/stories` }],
  }),
  component: StoriesPage,
});

function StoriesPage() {
  const { data: videos } = useMedia("Videos");

  return (
    <>
      <PageHero
        eyebrow="Media & Stories"
        title="The estate, in motion."
        intro="Short films from the plantation: harvest, processing and the people behind it."
        image={heroImage}
        alt="Mist drifting through the plantation canopy"
      />

      <Section tone="cream">
        <SectionHeading eyebrow="Estate Films" title="Watch the season unfold" />
        <MediaGrid items={videos ?? []} />
      </Section>
    </>
  );
}
