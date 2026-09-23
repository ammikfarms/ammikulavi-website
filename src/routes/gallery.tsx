import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import estateLife from "@/assets/estate-life.jpg";
import { PageHero, Section } from "@/components/section";
import { MediaGrid } from "@/components/media-grid";
import { MEDIA_CATEGORIES, useMedia } from "@/lib/estate";
import { cn } from "@/lib/utils";
import { SITE_NAME, DEFAULT_OG_IMAGE } from "@/lib/seo";

const SITE_URL = import.meta.env["VITE_SITE_URL"] || "https://ammikulaviestate.com";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: `Estate Gallery — ${SITE_NAME}` },
      {
        name: "description",
        content:
          "Photographs and films of coffee, pepper, harvest, nature and estate life at Ammikulavi Estate.",
      },
      { property: "og:title", content: `Estate Gallery — ${SITE_NAME}` },
      {
        property: "og:description",
        content: "Coffee, pepper, harvest, nature and estate life in pictures.",
      },
      { property: "og:url", content: `${SITE_URL}/gallery` },
      { property: "og:image", content: `${SITE_URL}${DEFAULT_OG_IMAGE}` },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/gallery` }],
  }),
  component: GalleryPage,
});

function GalleryPage() {
  const [category, setCategory] = useState<string | null>(null);
  const { data: media, isLoading } = useMedia(category ?? undefined);

  return (
    <>
      <PageHero
        eyebrow="Estate Gallery"
        title="The land, in pictures."
        intro="Coffee, pepper, harvest, nature and the people who tend it."
        image={estateLife}
        alt="Hands spreading coffee beans across a drying bed"
      />

      <Section tone="cream">
        <div className="flex flex-wrap gap-2">
          {[null, ...MEDIA_CATEGORIES].map((c) => (
            <button
              key={c ?? "all"}
              type="button"
              onClick={() => setCategory(c)}
              aria-pressed={category === c}
              className={cn(
                "rounded-sm border px-4 py-2 text-[0.7rem] font-semibold tracking-[0.16em] uppercase transition-colors",
                category === c
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:border-primary hover:text-primary",
              )}
            >
              {c ?? "All"}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="mt-12 columns-1 gap-5 sm:columns-2 lg:columns-3 [&>*]:mb-5">
            {[240, 320, 280, 300, 220, 340].map((h, i) => (
              <div
                key={i}
                style={{ height: h }}
                className="animate-pulse break-inside-avoid rounded-sm bg-muted"
              />
            ))}
          </div>
        ) : (
          <MediaGrid items={media ?? []} />
        )}
      </Section>
    </>
  );
}
