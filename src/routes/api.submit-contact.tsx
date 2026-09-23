import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { contactFormSchema } from "@/lib/contact-schema";

const MIN_FORM_SECONDS = 3;

const serverSchema = contactFormSchema.extend({
  loadTimestamp: z.number().int().positive(),
});

// eslint-disable-next-line react-refresh/only-export-components
export const submitContact = createServerFn({ method: "POST" })
  .validator((data: unknown) => serverSchema.parse(data))
  .handler(async ({ data }) => {
    // ── Timing check ────────────────────────────────────────────────────
    const elapsed = (Date.now() - data.loadTimestamp) / 1000;
    if (elapsed < MIN_FORM_SECONDS) {
      throw new Response(JSON.stringify({ error: "Please wait a moment before submitting." }), {
        status: 429,
        headers: { "Content-Type": "application/json" },
      });
    }

    // ── Honeypot ────────────────────────────────────────────────────────
    if (data.website && data.website.length > 0) {
      // Silently pretend success to bots
      return { ok: true as const };
    }

    // ── Rate limit via admin client ─────────────────────────────────────
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Count recent submissions from this email (last 5 minutes)
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { count: recentMessages } = await supabaseAdmin
      .from("contact_messages")
      .select("id", { count: "exact", head: true })
      .eq("email", data.email)
      .gte("created_at", fiveMinAgo);

    if ((recentMessages ?? 0) >= 3) {
      throw new Response(
        JSON.stringify({
          error: "Too many submissions. Please try again later.",
        }),
        { status: 429, headers: { "Content-Type": "application/json" } },
      );
    }

    // ── Insert message ──────────────────────────────────────────────────
    const { error: insertError } = await supabaseAdmin.from("contact_messages").insert({
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      subject: data.subject || null,
      message: data.message,
    });

    if (insertError) {
      console.error("[contact] insert error:", insertError);
      throw new Response(JSON.stringify({ error: "Could not send message. Please try again." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // ── Record rate-limit entry ─────────────────────────────────────────
    const emailHash = await hashString(data.email);
    await supabaseAdmin.from("contact_rate_limits" as never).insert({
      ip_hash: emailHash,
    } as never);

    // ── Admin notification (fire-and-forget) ────────────────────────────
    notifyAdmin(data.name, data.email, data.subject ?? null, data.message).catch((err) =>
      console.error("[contact] admin notification failed:", err),
    );

    return { ok: true as const };
  });

// ── Helpers ───────────────────────────────────────────────────────────────

async function hashString(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Admin notification — dispatches to an external email provider via a
 * configurable webhook URL. The SUPABASE_CONTACT_NOTIFY_WEBHOOK secret must
 * be set in the Supabase project's Edge Function secrets or environment.
 *
 * If the webhook is not configured the notification is silently skipped so
 * the form still succeeds.
 */
async function notifyAdmin(
  name: string,
  email: string,
  subject: string | null,
  message: string,
): Promise<void> {
  const webhookUrl = process.env["SUPABASE_CONTACT_NOTIFY_WEBHOOK"];
  if (!webhookUrl) return; // Not configured — skip

  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      from_name: name,
      from_email: email,
      subject: subject || "New contact form submission",
      message,
      timestamp: new Date().toISOString(),
    }),
  });
}

export const Route = createFileRoute("/api/submit-contact")({
  // This route only accepts POST via the server function.
  // The file exists solely to host the createServerFn definition.
  component: () => null,
});
