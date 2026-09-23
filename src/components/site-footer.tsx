import { Link } from "@tanstack/react-router";
import { Instagram, Mail, Phone } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { usePageContent } from "@/lib/estate";

export function SiteFooter() {
  const { get } = usePageContent("contact");

  return (
    <footer className="mt-24 border-t border-border/70 bg-secondary text-secondary-foreground">
      <div className="mx-auto grid max-w-[1400px] gap-12 px-5 py-16 md:grid-cols-[1.2fr_1fr_1fr] md:px-10">
        <div>
          <BrandLogo
            width={150}
            height={130}
            eager={false}
            className="h-24 w-auto opacity-95"
            fallbackClassName="text-2xl text-secondary-foreground"
          />
          <p className="mt-5 max-w-sm text-sm text-secondary-foreground/75">
            Specialty coffee and premium pepper, grown under native shade and finished by hand.
          </p>
        </div>

        <nav aria-label="Footer">
          <h2 className="eyebrow text-secondary-foreground/60">Explore</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {[
              { to: "/coffee", label: "Coffee" },
              { to: "/pepper", label: "Pepper" },
              { to: "/journal", label: "The Estate Journal" },
              { to: "/gallery", label: "Gallery" },
              { to: "/stories", label: "Films & Stories" },
              { to: "/sustainability", label: "Sustainability" },
              { to: "/contact", label: "Contact" },
            ].map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="transition-colors hover:text-accent">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="eyebrow text-secondary-foreground/60">Visit &amp; Enquire</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex items-center gap-2">
              <Mail className="size-4 text-accent" />
              <a href={`mailto:${get("email", "ammikfarms@gmail.com")}`}>
                {get("email", "ammikfarms@gmail.com")}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="size-4 text-accent" />
              <a href={`tel:${get("phone", "").replace(/\s/g, "")}`}>{get("phone", "")}</a>
            </li>
            <li className="flex items-center gap-2">
              <Instagram className="size-4 text-accent" />
              <a href={get("instagram", "https://instagram.com")} target="_blank" rel="noreferrer">
                Instagram
              </a>
            </li>
          </ul>
          <p className="mt-4 text-sm text-secondary-foreground/70">
            {get("address", "Ammikulavi Estate, Coffee Country, India")}
          </p>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-2 px-5 py-6 text-xs text-secondary-foreground/60 sm:flex-row sm:items-center sm:justify-between md:px-10">
          <p>© {new Date().getFullYear()} Ammikulavi Estate. All rights reserved.</p>
          <Link to="/auth/login" className="transition-colors hover:text-accent">
            Estate login
          </Link>
        </div>
      </div>
    </footer>
  );
}
