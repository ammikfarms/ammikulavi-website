import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderMiniApp } from "../utils/render";
import { Route as AuthRoute } from "@/routes/auth";
import { Route as LoginRoute } from "@/routes/auth.login";
import { Route as AdminRoute } from "@/routes/admin";
import { Route as DashboardRoute } from "@/routes/admin.dashboard";
import type { FakeSupabase } from "../mocks/supabase";

vi.mock("@/integrations/supabase/client", async () => {
  const { createFakeSupabase } = await import("../mocks/supabase");
  const fake = createFakeSupabase();
  // @ts-expect-error test hook on global
  globalThis.__fakeSupabase = fake;
  return { supabase: fake };
});

function getFake(): FakeSupabase {
  // @ts-expect-error test hook on global
  return globalThis.__fakeSupabase as FakeSupabase;
}

function renderLogin(initialPath = "/auth/login") {
  return renderMiniApp({
    routes: [
      { key: "auth", definition: AuthRoute, id: "/auth", path: "/auth" },
      {
        key: "login",
        definition: LoginRoute,
        id: "/auth/login",
        path: "/login",
        parent: "auth",
      },
      { key: "admin", definition: AdminRoute, id: "/admin", path: "/admin" },
      {
        key: "dashboard",
        definition: DashboardRoute,
        id: "/admin/dashboard",
        path: "/dashboard",
        parent: "admin",
      },
    ],
    initialPath,
  });
}

describe("estate login (/auth/login)", () => {
  beforeEach(() => {
    const fake = getFake();
    fake.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
    fake.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    fake.rpcResults["has_role"] = () => ({ data: false });
  });

  it("renders the login form with email and password fields", async () => {
    await renderLogin();
    expect(await screen.findByRole("heading", { name: "Estate Login" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /email/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("shows an error message when credentials are invalid", async () => {
    const fake = getFake();
    fake.auth.signInWithPassword.mockResolvedValueOnce({
      data: {},
      error: { message: "Invalid login credentials" },
    });
    await renderLogin();

    const email = (await screen.findByRole("textbox", { name: /email/i })) as HTMLInputElement;
    await userEvent.type(email, "nobody@example.com");
    await userEvent.type(screen.getByLabelText<HTMLInputElement>(/password/i), "not-the-password");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText(/invalid email or password/i)).toBeInTheDocument();
    expect(fake.auth.signInWithPassword).toHaveBeenCalledWith({
      email: "nobody@example.com",
      password: "not-the-password",
    });
  });

  it("navigates to the admin dashboard after a successful sign-in (role-gated)", async () => {
    const fake = getFake();
    fake.auth.signInWithPassword.mockResolvedValueOnce({ data: {}, error: null });
    // After redirect to /admin/dashboard the admin session resolves as an admin.
    fake.auth.getUser.mockResolvedValue({
      data: { user: { id: "u-1", email: "owner@ammikulaviestate.com" } },
      error: null,
    });
    fake.rpcResults["has_role"] = () => ({ data: true });

    await renderLogin();

    const email = (await screen.findByRole("textbox", { name: /email/i })) as HTMLInputElement;
    await userEvent.type(email, "owner@ammikulaviestate.com");
    await userEvent.type(screen.getByLabelText<HTMLInputElement>(/password/i), "correct-horse");
    await userEvent.click(await screen.findByRole("button", { name: /sign in/i }));

    expect(await screen.findByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Overview of your estate website.")).toBeInTheDocument();
  });

  it("does not call the auth API when required fields are empty", async () => {
    await renderLogin();
    await userEvent.click(await screen.findByRole("button", { name: /sign in/i }));
    expect(getFake().auth.signInWithPassword).not.toHaveBeenCalled();
  });
});

describe("admin authorization", () => {
  it("redirects unauthenticated visitors away from /admin/dashboard", async () => {
    const fake = getFake();
    fake.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
    await renderLogin("/admin/dashboard");
    expect(await screen.findByRole("heading", { name: "Estate Login" })).toBeInTheDocument();
  });

  it("redirects a signed-in non-admin away from /admin/dashboard", async () => {
    const fake = getFake();
    fake.auth.getUser.mockResolvedValue({
      data: { user: { id: "u-2", email: "editor@example.com" } },
      error: null,
    });
    fake.rpcResults["has_role"] = () => ({ data: false });
    await renderLogin("/admin/dashboard");
    expect(await screen.findByRole("heading", { name: "Estate Login" })).toBeInTheDocument();
  });
});

describe("auth link round-trip (footer -> login)", () => {
  it("keeps the estate login link pointing at /auth/login", async () => {
    const { router } = await renderLogin();
    const href = router.buildLocation({ to: "/auth/login" }).href;
    expect(href).toBe("/auth/login");
  });
});
