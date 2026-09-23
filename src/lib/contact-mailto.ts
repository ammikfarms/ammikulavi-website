import type { ContactFormValues } from "@/lib/contact-schema";

/**
 * Builds a `mailto:` URL that hands the contact message off to the visitor's
 * own email client. All user-entered content is percent-encoded per RFC 3986
 * (spaces become %20, which every mail client understands) so it is safe to
 * embed in the query string and never runs as markup or header injection.
 */
export function buildContactMailto(
  recipient: string,
  data: Pick<ContactFormValues, "name" | "email" | "phone" | "subject" | "message">,
): string {
  const subject =
    data.subject && data.subject.trim().length > 0
      ? data.subject.trim()
      : `Enquiry from ${data.name}`;
  const bodyParts = [`Name: ${data.name}`, `Email: ${data.email}`];
  if (data.phone && data.phone.trim().length > 0) {
    bodyParts.push(`Phone: ${data.phone}`);
  }
  bodyParts.push("", data.message);
  const body = bodyParts.join("\n");

  const query = [`subject=${encodeURIComponent(subject)}`, `body=${encodeURIComponent(body)}`].join(
    "&",
  );

  return `mailto:${encodeURIComponent(recipient)}?${query}`;
}
