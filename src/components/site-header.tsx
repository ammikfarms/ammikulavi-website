import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { to: "/coffee", label: "Coffee" },
  { to: "/pepper", label: "Pepper" },
  { to: "/about", label: "The Estate" },
  { to: "/gallery", label: "Gallery" },
  { to: "/journal", label: "Journal" },
  { to: "/sustainability", label: "Sustainability" },
  { to: "/contact", label: "Contact" },
] as const;

/**
 * Static logo served from public/ — place a replacement at
 * public/ammikulavi-logo.png to override.
 */
const LOCAL_LOGO_SRC = "/ammikulavi-logo.png";

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const solid = scrolled || open;

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        solid
          ? "border-b border-border/60 bg-background/92 backdrop-blur-md"
          : "bg-gradient-to-b from-black/40 to-transparent",
      )}
    >
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-6 px-5 py-3 md:px-10">
        <Link to="/" className="flex shrink-0 items-center gap-3">
          {!logoFailed && (
            <img
              src={LOCAL_LOGO_SRC}
              alt="Ammikulavi Estate"
              width={56}
              height={48}
              className={cn(
                "h-11 w-auto transition-all duration-500",
                solid
                  ? "mix-blend-multiply"
                  : "brightness-0 invert drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]",
              )}
              onError={() => setLogoFailed(true)}
            />
          )}
          <span
            className={cn(
              "hidden font-display text-lg tracking-[0.18em] uppercase sm:block",
              solid
                ? "text-foreground"
                : "text-primary-foreground drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]",
            )}
          >
            Ammikulavi
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-7 lg:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={cn(
                "text-[0.78rem] font-medium tracking-[0.14em] uppercase transition-colors",
                solid
                  ? "text-foreground/75 hover:text-primary"
                  : "text-primary-foreground/90 hover:text-accent",
              )}
              activeProps={{ className: solid ? "text-primary" : "text-accent" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "inline-flex items-center justify-center rounded-sm p-2 transition-colors lg:hidden",
            solid ? "text-foreground" : "text-primary-foreground",
          )}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <nav
          aria-label="Mobile"
          className="border-t border-border/60 bg-background px-5 pb-6 lg:hidden"
        >
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="block border-b border-border/50 py-3 font-display text-xl"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
