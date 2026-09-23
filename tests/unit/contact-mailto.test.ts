import { describe, it, expect } from "vitest";
import { buildContactMailto } from "@/lib/contact-mailto";

describe("buildContactMailto", () => {
  it("builds a mailto URL with encoded recipient, subject and body", () => {
    const url = buildContactMailto("ammikfarms@gmail.com", {
      name: "Aisha Nair",
      email: "aisha@example.com",
      phone: "",
      subject: "",
      message: "I would like to order a kilo of estate beans.",
    });

    expect(url.startsWith("mailto:ammikfarms%40gmail.com?")).toBe(true);
    expect(url).toContain("subject=Enquiry%20from%20Aisha%20Nair");
    expect(url).toContain("Name%3A%20Aisha%20Nair");
    expect(url).toContain("Email%3A%20aisha%40example.com");
    expect(url).toContain("I%20would%20like%20to%20order%20a%20kilo%20of%20estate%20beans.");
  });

  it("omits an empty phone from the body", () => {
    const url = buildContactMailto("ammikfarms@gmail.com", {
      name: "Aisha",
      email: "aisha@example.com",
      phone: "",
      subject: "",
      message: "Hello",
    });
    expect(url).not.toContain("Phone%3A");
  });

  it("includes a provided phone in the body", () => {
    const url = buildContactMailto("ammikfarms@gmail.com", {
      name: "Aisha",
      email: "aisha@example.com",
      phone: "+91 98765 43210",
      subject: "",
      message: "Hello",
    });
    expect(url).toContain("Phone%3A%20%2B91%2098765%2043210");
  });

  it("uses the provided subject when present, otherwise a default", () => {
    const withSubject = buildContactMailto("x@example.com", {
      name: "Aisha",
      email: "aisha@example.com",
      subject: "Trade enquiry",
      message: "Hi",
    });
    expect(withSubject).toContain("subject=Trade%20enquiry");

    const defaulted = buildContactMailto("x@example.com", {
      name: "Aisha",
      email: "aisha@example.com",
      subject: "",
      message: "Hi",
    });
    expect(defaulted).toContain("subject=Enquiry%20from%20Aisha");
  });

  it("URL-encodes all user-entered content (security-safe)", () => {
    const url = buildContactMailto("ammikfarms@gmail.com", {
      name: "A&B <b>",
      email: "a&b@example.com",
      subject: "a&b=? c",
      message: "Line 1\nLine 2 & more <html>",
    });

    // Raw special characters must never appear in the query string unencoded.
    expect(url).not.toContain("\n");
    expect(url).not.toContain("<b>");
    expect(url).not.toContain("&=");
    // Encoded equivalents are present.
    expect(url).toContain("A%26B");
    expect(url).toContain("a%26b%40example.com");
    expect(url).toContain("Line%201%0ALine%202%20%26%20more%20%3Chtml%3E");
  });

  it("encodes the recipient address", () => {
    const url = buildContactMailto("ammikfarms+tag@gmail.com", {
      name: "Aisha",
      email: "aisha@example.com",
      message: "Hi",
    });
    expect(url).toContain("mailto:ammikfarms%2Btag%40gmail.com?");
  });
});
