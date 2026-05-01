"use client";

import Link from "next/link";
import { ArrowLeft, Info } from "lucide-react";

function SectionHeading({ id, label }: { id: string; label: string }) {
  return (
    <h2 id={id} className="ds-label" style={{ marginBottom: "1rem" }}>
      {label}
    </h2>
  );
}

export default function AboutPage() {
  return (
    <div className="shell" style={{ background: "var(--background)" }}>
      <header
        className="shell__header"
        style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}
      >
        <Link
          href="/"
          className="btn"
          style={{ padding: "0.35rem 0.45rem", display: "flex", alignItems: "center" }}
          aria-label="Back to home"
        >
          <ArrowLeft style={{ width: "1rem", height: "1rem" }} />
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Info
            style={{ width: "1.25rem", height: "1.25rem", flexShrink: 0 }}
            strokeWidth={1.75}
            aria-hidden
          />
          <h1
            style={{
              fontSize: "1.125rem",
              fontWeight: 700,
              color: "var(--text-heading)",
              letterSpacing: "-0.02em",
            }}
          >
            About
          </h1>
        </div>
      </header>

      <main
        className="shell__main"
        style={{
          maxWidth: "36rem",
          marginLeft: "auto",
          marginRight: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "2.5rem",
        }}
      >
        <section aria-labelledby="project-heading">
          <SectionHeading id="project-heading" label="The Project" />
          <p className="ds-prose" style={{ color: "var(--text)" }}>
            Project description placeholder.
          </p>
        </section>

        <section aria-labelledby="me-heading">
          <SectionHeading id="me-heading" label="About Me" />
          <p className="ds-prose" style={{ color: "var(--text)" }}>
            Bio placeholder.
          </p>
        </section>
      </main>
    </div>
  );
}
