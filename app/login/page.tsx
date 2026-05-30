"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChartCandlestick } from "lucide-react";

function LoginForm() {
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const params = useSearchParams();
  const raw = params.get("from") ?? "";
  const from = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/market-analyzer";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(false);
    setLoading(true);

    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential: value.trim() }),
    });

    setLoading(false);

    if (res.ok) {
      router.push(from);
    } else {
      setError(true);
    }
  }

  return (
    <main
      style={{
        background: "#0a0a0a",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
      }}
    >
      <div style={{ width: "100%", maxWidth: "22rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "2rem" }}>
          <ChartCandlestick
            style={{ width: "1.25rem", height: "1.25rem", color: "#22c55e", flexShrink: 0 }}
            strokeWidth={1.75}
            aria-hidden
          />
          <span style={{ fontWeight: 700, fontSize: "1rem", color: "#ffffff", letterSpacing: "-0.01em" }}>
            Chew&apos;s Meridian
          </span>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <input
            type="password"
            value={value}
            onChange={(e) => { setValue(e.target.value); setError(false); }}
            placeholder="Enter access code"
            autoFocus
            required
            style={{
              width: "100%",
              padding: "0.75rem 1rem",
              borderRadius: "8px",
              border: `1px solid ${error ? "#ef4444" : "rgba(255,255,255,0.12)"}`,
              background: "rgba(255,255,255,0.05)",
              color: "#ffffff",
              fontSize: "0.9375rem",
              outline: "none",
              boxSizing: "border-box",
              transition: "border-color 0.15s",
            }}
          />

          {error && (
            <p style={{ fontSize: "0.8125rem", color: "#ef4444", margin: 0 }}>
              Invalid or expired access code.
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !value.trim()}
            style={{
              padding: "0.75rem",
              borderRadius: "8px",
              border: "none",
              background: "#22c55e",
              color: "#0a0a0a",
              fontWeight: 700,
              fontSize: "0.9375rem",
              cursor: loading || !value.trim() ? "not-allowed" : "pointer",
              opacity: loading || !value.trim() ? 0.6 : 1,
              transition: "opacity 0.15s",
            }}
          >
            {loading ? "Verifying…" : "Access"}
          </button>

          {loading && (
            <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.4)", margin: 0, textAlign: "center" }}>
              Checking credentials…
            </p>
          )}
        </form>

        <Link
          href="/"
          style={{
            display: "block",
            marginTop: "1.25rem",
            textAlign: "center",
            fontSize: "0.8125rem",
            color: "rgba(255,255,255,0.35)",
            textDecoration: "none",
          }}
        >
          ← Home
        </Link>
      </div>
    </main>
  );
}

export default function LoginPage() {

  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
