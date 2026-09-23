import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/reveal";

export function PageHero({
  eyebrow,
  title,
  intro,
  image,
  alt,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  image: string;
  alt: string;
}) {
  return (
    <section className="relative flex min-h-[62vh] items-end overflow-hidden">
      <img
        src={image}
        alt={alt}
        className="absolute inset-0 size-full object-cover"
        width={1400}
        height={1008}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-secondary/85 via-secondary/40 to-secondary/20" />
      <div className="relative mx-auto w-full max-w-[1400px] px-5 pt-32 pb-14 md:px-10">
        <p className="eyebrow text-accent">{eyebrow}</p>
        <h1 className="mt-3 max-w-3xl font-display text-4xl text-primary-foreground sm:text-6xl">
          {title}
        </h1>
        {intro && <p className="mt-5 max-w-2xl text-primary-foreground/85">{intro}</p>}
      </div>
    </section>
  );
}

export function Section({
  children,
  className,
  tone = "cream",
}: {
  children: ReactNode;
  className?: string;
  tone?: "cream" | "offwhite" | "forest";
}) {
  return (
    <section
      className={cn(
        "px-5 py-20 md:px-10 md:py-28",
        tone === "offwhite" && "bg-card",
        tone === "forest" && "bg-primary text-primary-foreground",
        className,
      )}
    >
      <div className="mx-auto max-w-[1400px]">{children}</div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  className,
}: {
  eyebrow?: string;
  title: string;
  className?: string;
}) {
  return (
    <Reveal {...(className ? { className } : {})}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2 className="mt-3 max-w-3xl font-display text-3xl sm:text-5xl">{title}</h2>
      <span className="gold-rule mt-6" />
    </Reveal>
  );
}
