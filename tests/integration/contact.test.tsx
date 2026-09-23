import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderMiniApp } from "../utils/render";
import { Route as ContactRoute } from "@/routes/contact";
import { buildContactMailto } from "@/lib/contact-mailto";

vi.mock("@/integrations/supabase/client", async () => {
  const { createFakeSupabase } = await import("../mocks/supabase");
  return { supabase: createFakeSupabase() };
});

async function renderContact() {
  await renderMiniApp({
    routes: [{ key: "contact", definition: ContactRoute, id: "/contact", path: "/contact" }],
    initialPath: "/contact",
  });
}

async function fillValidForm() {
  await userEvent.type(await screen.findByLabelText("Name *"), "Aisha Nair");
  await userEvent.type(screen.getByLabelText("Email *"), "aisha@example.com");
  await userEvent.type(
    screen.getByLabelText("Message *"),
    "I would like to order a kilo of estate beans.",
  );
}

describe("contact page (/contact)", () => {
  const assignSpy = vi.fn();

  beforeEach(() => {
    assignSpy.mockReset();
    // Stub the browser navigation so opening a mailto: URL is deterministic in jsdom.
    vi.stubGlobal("location", { ...window.location, assign: assignSpy });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the contact form with labelled fields and a hidden honeypot", async () => {
    await renderContact();

    expect(await screen.findByRole("heading", { name: "Send a message" })).toBeInTheDocument();
    expect(screen.getByLabelText("Name *")).toBeInTheDocument();
    expect(screen.getByLabelText("Email *")).toBeInTheDocument();
    expect(screen.getByLabelText("Phone")).toBeInTheDocument();
    expect(screen.getByLabelText("Message *")).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: /send message/i })).toBeInTheDocument();

    // Honeypot field is hidden from assistive tech and unfit for human focus.
    const honeypot = screen.getByLabelText("Leave this empty");
    expect(honeypot).toHaveAttribute("autocomplete", "off");
    expect(honeypot).toHaveAttribute("tabindex", "-1");
    const honeypotContainer = honeypot.closest("div[aria-hidden='true']");
    expect(honeypotContainer).not.toBeNull();
  });

  it("shows validation errors and never opens the mail app for an empty form", async () => {
    await renderContact();
    await userEvent.click(await screen.findByRole("button", { name: /send message/i }));

    expect(await screen.findByText("Name is required")).toBeInTheDocument();
    expect(screen.getByText("Email is required")).toBeInTheDocument();
    expect(screen.getByText("Message is required")).toBeInTheDocument();
    expect(assignSpy).not.toHaveBeenCalled();
  });

  it("rejects a malformed email client-side without opening the mail app", async () => {
    await renderContact();
    await userEvent.type(await screen.findByLabelText("Name *"), "Aisha Nair");
    await userEvent.type(screen.getByLabelText("Email *"), "not-an-email");
    await userEvent.type(screen.getByLabelText("Message *"), "Hello");
    await userEvent.click(await screen.findByRole("button", { name: /send message/i }));

    expect(await screen.findByText("Please enter a valid email address")).toBeInTheDocument();
    expect(assignSpy).not.toHaveBeenCalled();
  });

  it("marks invalid fields with aria-invalid", async () => {
    await renderContact();
    await userEvent.click(await screen.findByRole("button", { name: /send message/i }));

    await screen.findByText("Name is required");
    expect(screen.getByLabelText(/name/i)).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText(/email \*/i)).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText(/message \*/i)).toHaveAttribute("aria-invalid", "true");
  });

  it("opens a mailto: URL to the site inbox and shows a success instruction on valid data", async () => {
    await renderContact();
    await fillValidForm();
    await userEvent.click(await screen.findByRole("button", { name: /send message/i }));

    await screen.findByText(/your email app has been opened/i);
    expect(assignSpy).toHaveBeenCalledTimes(1);

    const mailtoUrl = assignSpy.mock.calls[0]?.[0] as string;
    const expected = buildContactMailto("ammikfarms@gmail.com", {
      name: "Aisha Nair",
      email: "aisha@example.com",
      phone: "",
      subject: "",
      message: "I would like to order a kilo of estate beans.",
    });
    expect(mailtoUrl).toBe(expected);
    expect(mailtoUrl.startsWith("mailto:ammikfarms%40gmail.com?")).toBe(true);
  });

  it("includes the entered phone and subject in the constructed mailto URL", async () => {
    await renderContact();
    await userEvent.type(await screen.findByLabelText("Name *"), "Aisha Nair");
    await userEvent.type(screen.getByLabelText("Email *"), "aisha@example.com");
    await userEvent.type(screen.getByLabelText("Phone"), "+91 98765 43210");
    await userEvent.type(screen.getByLabelText("Subject"), "Trade enquiry");
    await userEvent.type(screen.getByLabelText("Message *"), "Hello, we are interested.");
    await userEvent.click(await screen.findByRole("button", { name: /send message/i }));

    const mailtoUrl = await waitFor(() => {
      expect(assignSpy).toHaveBeenCalled();
      return assignSpy.mock.calls[0]?.[0] as string;
    });

    expect(mailtoUrl).toContain("mailto:ammikfarms%40gmail.com?");
    expect(mailtoUrl).toContain("Phone%3A%20%2B91%2098765%2043210");
    expect(mailtoUrl).toContain("Trade%20enquiry");
  });

  it("does not open the mail app when the honeypot is filled (bot)", async () => {
    await renderContact();
    await fillValidForm();
    await userEvent.type(screen.getByLabelText("Leave this empty"), "http://spam.example");
    await userEvent.click(await screen.findByRole("button", { name: /send message/i }));

    // Honeypot stays silent: the message is dropped without any feedback.
    expect(assignSpy).not.toHaveBeenCalled();
    expect(screen.queryByText(/your email app has been opened/i)).not.toBeInTheDocument();
  });
});
