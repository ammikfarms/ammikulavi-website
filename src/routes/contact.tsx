import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Phone, MapPin, Instagram, Send, CheckCircle } from "lucide-react";
import { PageHero, Section, SectionHeading } from "@/components/section";
import { Reveal } from "@/components/reveal";
import { usePageContent } from "@/lib/estate";
import { buildContactMailto } from "@/lib/contact-mailto";
import { contactFormSchema, type ContactFormValues } from "@/lib/contact-schema";
import heroImage from "@/assets/hero-estate.jpg";

import { SITE_NAME, DEFAULT_OG_IMAGE } from "@/lib/seo";

const SITE_URL = import.meta.env["VITE_SITE_URL"] || "https://ammikulaviestate.com";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: `Contact — ${SITE_NAME}` },
      {
        name: "description",
        content:
          "Get in touch with Ammikulavi Estate for orders, trade enquiries, or estate visits.",
      },
      { property: "og:title", content: `Contact — ${SITE_NAME}` },
      {
        property: "og:description",
        content: "Reach us for orders, trade enquiries or estate visits.",
      },
      { property: "og:url", content: `${SITE_URL}/contact` },
      { property: "og:image", content: `${SITE_URL}${DEFAULT_OG_IMAGE}` },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/contact` }],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { get } = usePageContent("contact");
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: { name: "", email: "", phone: "", subject: "", message: "", website: "" },
  });

  const onSubmit = (values: ContactFormValues) => {
    // Build and open a mailto: URL so the message goes straight to the site's
    // own inbox via the visitor's email client — no backend needed.
    const recipient = get("email", "ammikfarms@gmail.com");
    const mailtoUrl = buildContactMailto(recipient, values);
    window.location.assign(mailtoUrl);
    setSubmitted(true);
  };

  const inputClass =
    "w-full rounded-sm border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary";
  const errorClass = "mt-1 text-xs text-destructive";

  return (
    <>
      <PageHero
        eyebrow="Get in Touch"
        title="We would be glad to hear from you."
        intro="For orders, trade enquiries or estate visits."
        image={heroImage}
        alt="Shade-grown coffee plantation in morning mist"
      />

      <Section tone="cream">
        <div className="grid gap-16 lg:grid-cols-[1.2fr_1fr]">
          <Reveal>
            <SectionHeading eyebrow="Write to Us" title="Send a message" />
            <form onSubmit={handleSubmit(onSubmit)} className="mt-10 space-y-6" noValidate>
              {/* Honeypot — hidden from humans, visible to bots */}
              <div className="absolute -left-[9999px] opacity-0" aria-hidden="true">
                <label htmlFor="website">Leave this empty</label>
                <input
                  id="website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  {...register("website")}
                />
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <label className="block">
                  <span className="eyebrow mb-2 block text-foreground/80">Name *</span>
                  <input
                    {...register("name")}
                    maxLength={120}
                    className={inputClass}
                    aria-invalid={!!errors.name}
                  />
                  {errors.name && <p className={errorClass}>{errors.name.message}</p>}
                </label>
                <label className="block">
                  <span className="eyebrow mb-2 block text-foreground/80">Email *</span>
                  <input
                    {...register("email")}
                    type="email"
                    className={inputClass}
                    aria-invalid={!!errors.email}
                  />
                  {errors.email && <p className={errorClass}>{errors.email.message}</p>}
                </label>
                <label className="block">
                  <span className="eyebrow mb-2 block text-foreground/80">Phone</span>
                  <input
                    {...register("phone")}
                    type="tel"
                    className={inputClass}
                    aria-invalid={!!errors.phone}
                  />
                  {errors.phone && <p className={errorClass}>{errors.phone.message}</p>}
                </label>
                <label className="block">
                  <span className="eyebrow mb-2 block text-foreground/80">Subject</span>
                  <input
                    {...register("subject")}
                    className={inputClass}
                    aria-invalid={!!errors.subject}
                  />
                  {errors.subject && <p className={errorClass}>{errors.subject.message}</p>}
                </label>
              </div>
              <label className="block">
                <span className="eyebrow mb-2 block text-foreground/80">Message *</span>
                <textarea
                  {...register("message")}
                  rows={6}
                  maxLength={4000}
                  className={`${inputClass} resize-y`}
                  aria-invalid={!!errors.message}
                />
                {errors.message && <p className={errorClass}>{errors.message.message}</p>}
              </label>

              {submitted ? (
                <div className="flex items-center gap-3 rounded-sm border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary">
                  <CheckCircle className="size-5 shrink-0" />
                  Your email app has been opened with your message ready to send. Just press send
                  and we will get back to you shortly.
                </div>
              ) : (
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-sm bg-primary px-7 py-3.5 text-xs font-semibold tracking-[0.18em] uppercase text-primary-foreground transition-colors hover:bg-secondary"
                >
                  <Send className="size-4" />
                  Send message
                </button>
              )}
            </form>
          </Reveal>

          <Reveal delay={120}>
            <SectionHeading eyebrow="Estate Details" title="Visit or enquire" />
            <div className="mt-10 space-y-8">
              <div className="flex items-start gap-4">
                <Mail className="mt-1 size-5 text-accent" />
                <div>
                  <p className="eyebrow text-foreground/80">Email</p>
                  <a
                    href={`mailto:${get("email", "ammikfarms@gmail.com")}`}
                    className="mt-1 block text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {get("email", "ammikfarms@gmail.com")}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Phone className="mt-1 size-5 text-accent" />
                <div>
                  <p className="eyebrow text-foreground/80">Phone</p>
                  <a
                    href={`tel:${get("phone", "").replace(/\s/g, "")}`}
                    className="mt-1 block text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {get("phone", "")}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <MapPin className="mt-1 size-5 text-accent" />
                <div>
                  <p className="eyebrow text-foreground/80">Address</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {get("address", "Ammikulavi Estate, Coffee Country, India")}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Instagram className="mt-1 size-5 text-accent" />
                <div>
                  <p className="eyebrow text-foreground/80">Instagram</p>
                  <a
                    href={get("instagram", "https://instagram.com")}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 block text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    @ammikulaviestate
                  </a>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </Section>
    </>
  );
}
