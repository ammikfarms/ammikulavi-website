import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BrandLogo } from "@/components/brand-logo";

export const Route = createFileRoute("/auth/login")({
  head: () => ({
    meta: [{ title: "Estate Login — Ammikulavi Estate" }],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError("Invalid email or password. Please try again.");
      setLoading(false);
      return;
    }

    navigate({ to: "/admin/dashboard" });
  };

  return (
    <div className="text-center">
      <Link to="/" className="inline-block">
        <BrandLogo width={100} height={87} className="mx-auto h-16 w-auto mix-blend-multiply" />
      </Link>
      <h1 className="mt-8 font-display text-3xl">Estate Login</h1>
      <p className="mt-2 text-sm text-muted-foreground">Sign in to manage the estate website.</p>

      <form onSubmit={handleLogin} className="mt-10 space-y-5 text-left">
        <label className="block">
          <span className="eyebrow mb-2 block text-foreground/80">Email</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "login-error" : undefined}
            className="w-full rounded-sm border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </label>
        <label className="block">
          <span className="eyebrow mb-2 block text-foreground/80">Password</span>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "login-error" : undefined}
            className="w-full rounded-sm border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </label>

        {error && (
          <p id="login-error" role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-sm bg-primary px-6 py-3.5 text-xs font-semibold tracking-[0.18em] uppercase text-primary-foreground transition-colors hover:bg-secondary disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign in"}
          {!loading && <ArrowRight className="size-4" />}
        </button>
      </form>

      <Link
        to="/"
        className="mt-8 inline-block text-xs text-muted-foreground transition-colors hover:text-primary"
      >
        ← Back to the estate
      </Link>
    </div>
  );
}
