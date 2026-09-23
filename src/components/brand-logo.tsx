import { useState } from "react";
import logo from "@/assets/ammikulavi-logo.png.asset.json";
import { cn } from "@/lib/utils";

/**
 * Ammikulavi brand mark with a resilient source chain:
 *
 *   1. /ammikulavi-logo.png  — static file served from `public/`
 *      (place a replacement logo at public/ammikulavi-logo.png to override it)
 *   2. logo.url — the Lovable-hosted asset referenced in
 *      src/assets/ammikulavi-logo.png.asset.json
 *   3. A styled text wordmark, so the brand never disappears
 */
const LOCAL_LOGO_SRC = "/ammikulavi-logo.png";

type BrandLogoProps = {
  className?: string;
  width?: number;
  height?: number;
  alt?: string;
  /** eager = loading="eager", otherwise lazy */
  eager?: boolean;
  fallbackClassName?: string;
};

export function BrandLogo({
  className,
  width,
  height,
  alt = "Ammikulavi Estate",
  eager = true,
  fallbackClassName,
}: BrandLogoProps) {
  const [stage, setStage] = useState<0 | 1>(0);
  const sources = [LOCAL_LOGO_SRC, logo.url];

  if (stage >= sources.length) {
    return (
      <span
        className={cn("inline-block font-display uppercase tracking-[0.18em]", fallbackClassName)}
      >
        Ammikulavi
      </span>
    );
  }

  return (
    <img
      src={sources[stage]}
      alt={alt}
      width={width}
      height={height}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      className={className}
      onError={() => setStage((s) => (s + 1) as 0 | 1)}
    />
  );
}
