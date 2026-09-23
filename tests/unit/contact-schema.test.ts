import { describe, it, expect } from "vitest";
import { contactFormSchema } from "@/lib/contact-schema";

const valid = {
  name: "Jane Doe",
  email: "jane@example.com",
  phone: "+91 98765 43210",
  subject: "Trade enquiry",
  message: "Hello, we would like to buy a lot of your estate coffee.",
  website: "",
};

describe("contactFormSchema validation", () => {
  it("accepts a complete valid submission", () => {
    expect(contactFormSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts empty optional phone/subject", () => {
    const { success, data } = contactFormSchema.safeParse({ ...valid, phone: "", subject: "" });
    expect(success).toBe(true);
    // Empty optional strings are preserved as "" (handled as null at the API layer).
    expect(data.phone).toBe("");
  });

  it("rejects a missing name", () => {
    const result = contactFormSchema.safeParse({ ...valid, name: "  " });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === "name")).toBe(true);
    }
  });

  it("rejects an invalid email", () => {
    expect(contactFormSchema.safeParse({ ...valid, email: "not-an-email" }).success).toBe(false);
  });

  it("rejects a missing message", () => {
    expect(contactFormSchema.safeParse({ ...valid, message: "" }).success).toBe(false);
  });

  it("rejects messages longer than 4000 characters", () => {
    const result = contactFormSchema.safeParse({ ...valid, message: "x".repeat(4001) });
    expect(result.success).toBe(false);
  });

  it("rejects polished long name beyond 120 chars", () => {
    expect(contactFormSchema.safeParse({ ...valid, name: "x".repeat(121) }).success).toBe(false);
  });

  it("trims surrounding whitespace on required fields", () => {
    const { success, data } = contactFormSchema.safeParse({
      ...valid,
      name: "  Jane Doe  ",
      email: "  jane@example.com  ",
    });
    expect(success).toBe(true);
    expect(data.name).toBe("Jane Doe");
    expect(data.email).toBe("jane@example.com");
  });

  it("rejects phone strings longer than 30 characters", () => {
    expect(contactFormSchema.safeParse({ ...valid, phone: "1".repeat(31) }).success).toBe(false);
  });

  it("detects bots via the honeypot (non-empty website field)", () => {
    const result = contactFormSchema.safeParse({ ...valid, website: "http://spam.example" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message === "Bot detected")).toBe(true);
    }
  });

  it("does not allow excessive payload breadth", () => {
    // Unknown keys must be stripped, not carried through.
    const parsed = contactFormSchema.safeParse({ ...valid, evil: "x" });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).not.toHaveProperty("evil");
    }
  });
});
