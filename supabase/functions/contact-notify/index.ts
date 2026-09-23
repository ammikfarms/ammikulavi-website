// ──────────────────────────────────────────────────────────────
// Contact-form admin email notification — Supabase Edge Function
// ──────────────────────────────────────────────────────────────
// This function is triggered by the server function after a contact
// message is inserted.  It sends an admin notification email via
// a third-party provider (Resend, SendGrid, Mailgun, etc.).
//
// Required Supabase Edge Function secrets (set via `supabase secrets set`):
//   CONTACT_NOTIFY_WEBHOOK   — Webhook URL of your email provider
//                              (e.g. Resend's API endpoint or a Zapier/Make webhook)
//   CONTACT_NOTIFY_API_KEY   — API key for the email provider (optional if using webhook)
//   CONTACT_NOTIFY_TO        — Admin email address that receives notifications
//
// Deploy:
//   supabase functions deploy contact-notify
//
// Invoke from server function:
//   fetch(`${SUPABASE_URL}/functions/v1/contact-notify`, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
//     },
//     body: JSON.stringify({ from_name, from_email, subject, message }),
//   })
// ──────────────────────────────────────────────────────────────

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { from_name, from_email, subject, message, timestamp } = await req.json();

    const webhookUrl = Deno.env.get("CONTACT_NOTIFY_WEBHOOK");
    if (!webhookUrl) {
      console.warn("CONTACT_NOTIFY_WEBHOOK not configured — skipping notification");
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Forward to configured webhook (works with Resend, SendGrid, Mailgun,
    // Zapier, Make, n8n, or any HTTP-based email service)
    const providerResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: Deno.env.get("CONTACT_NOTIFY_TO") || "ammikfarms@gmail.com",
        from: from_email,
        from_name,
        subject: subject || "New contact form submission",
        text: `Name: ${from_name}\nEmail: ${from_email}\nSubject: ${subject || "(none)"}\n\n${message}`,
        html: `
          <h2>New contact form submission</h2>
          <p><strong>From:</strong> ${from_name} &lt;${from_email}&gt;</p>
          <p><strong>Subject:</strong> ${subject || "(none)"}</p>
          <hr/>
          <p>${message.replace(/\n/g, "<br/>")}</p>
          <hr/>
          <p style="color:#888;font-size:12px">Submitted at ${timestamp || new Date().toISOString()}</p>
        `,
        timestamp,
      }),
    });

    if (!providerResponse.ok) {
      const body = await providerResponse.text();
      console.error("Email provider error:", providerResponse.status, body);
      throw new Error(`Email provider returned ${providerResponse.status}`);
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("contact-notify error:", err);
    return new Response(JSON.stringify({ error: "Notification failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
