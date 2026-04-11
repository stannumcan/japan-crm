"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push("/en/workorders");
    router.refresh();
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "var(--background)" }}
    >
      <div
        className="w-full max-w-sm rounded-xl border p-8"
        style={{
          background: "var(--card)",
          borderColor: "var(--border)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8">
          <div
            className="w-6 h-6 rounded-sm flex items-center justify-center shrink-0"
            style={{ background: "var(--primary)" }}
          >
            <span
              className="text-white leading-none select-none"
              style={{ fontSize: "11px", fontWeight: 700 }}
            >
              W
            </span>
          </div>
          <span
            className="text-sm font-semibold tracking-widest"
            style={{ color: "var(--foreground)", letterSpacing: "0.1em" }}
          >
            WINHOOP
          </span>
        </div>

        <h1
          className="text-xl font-semibold mb-1"
          style={{ color: "var(--foreground)" }}
        >
          Sign in
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          Enter your credentials to access the CRM
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label
              className="text-sm font-medium"
              style={{ color: "var(--foreground)" }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
              className="w-full rounded-md border px-3 py-2 text-sm outline-none transition-colors"
              style={{
                background: "var(--background)",
                borderColor: "var(--border)",
                color: "var(--foreground)",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            />
          </div>

          <div className="space-y-1.5">
            <label
              className="text-sm font-medium"
              style={{ color: "var(--foreground)" }}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              className="w-full rounded-md border px-3 py-2 text-sm outline-none transition-colors"
              style={{
                background: "var(--background)",
                borderColor: "var(--border)",
                color: "var(--foreground)",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            />
          </div>

          {error && (
            <div
              className="rounded-md px-3 py-2 text-sm"
              style={{
                background: "oklch(0.97 0.01 20)",
                border: "1px solid oklch(0.85 0.06 20)",
                color: "oklch(0.45 0.15 20)",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md py-2 text-sm font-medium text-white transition-opacity"
            style={{
              background: "var(--primary)",
              opacity: loading ? 0.6 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="text-xs text-muted-foreground mt-6 text-center">
          Access is by invitation only. Contact your administrator.
        </p>
      </div>
    </div>
  );
}
