"use client";

import { Fragment } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChartCandlestick } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const STEPS = [
  {
    number: "01",
    title: "Connect Gmail",
    description: "OAuth-authenticated access to your newsletter inbox. No credentials stored.",
  },
  {
    number: "02",
    title: "AI reads and analyzes",
    description: "Claude scans your newsletters and extracts earnings, risks, and opportunities.",
  },
  {
    number: "03",
    title: "Daily briefing",
    description:
      "Structured market intelligence delivered as a scannable digest — tickers, sectors, and macro signals.",
  },
];

const TECH = ["Next.js 15", "Claude AI", "Gmail OAuth", "Redis", "Vercel", "TypeScript"];

const PRODUCTS = [
  {
    href: "/market-analyzer",
    label: "Market Analyzer",
    desc: "Reads your newsletters. Surfaces what moves markets.",
  },
  {
    href: "/pl-tracker",
    label: "PL Tracker",
    desc: "Log trades. Track P&L. Know where you stand.",
  },
] as const;

export default function LandingPage() {
  return (
    <main style={{ background: "#0a0a0a", minHeight: "100vh", color: "#ffffff", overflowX: "hidden" }}>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          minHeight: "100vh",
          padding: "2rem clamp(1.5rem, 6vw, 7.5rem)",
        }}
      >
        {/* Green radial glow */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: "35%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "min(920px, 90vw)",
            height: "min(920px, 90vw)",
            background: "radial-gradient(circle, rgba(34,197,94,0.13) 0%, transparent 65%)",
            pointerEvents: "none",
          }}
        />

        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="hero-stagger-root"
        >
          {/* Eyebrow */}
          <motion.div
            variants={fadeUp}
            className="hero-eyebrow"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.625rem",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.625rem",
              }}
            >
              <ChartCandlestick
                style={{
                  width: "clamp(1.375rem, 2.4vw, 1.625rem)",
                  height: "clamp(1.375rem, 2.4vw, 1.625rem)",
                  color: "#22c55e",
                }}
                strokeWidth={2}
                aria-hidden
              />
              <span
                style={{
                  fontSize: "clamp(0.9375rem, 1.5vw, 1.125rem)",
                  fontWeight: 600,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#22c55e",
                }}
              >
                {"Chew's Meridian"}
              </span>
            </div>
            <p
              style={{
                margin: 0,
                fontSize: "clamp(1.0625rem, 2.15vw, 1.3125rem)",
                color: "#888888",
                lineHeight: 1.62,
              }}
            >
              Built on Claude and Composer
            </p>
          </motion.div>

          {/* Products: two columns + vertical rule (horizontal rule when stacked) */}
          {PRODUCTS.map((product, i) => (
            <Fragment key={product.href}>
              <motion.div variants={fadeUp} className="hero-product-panel">
                <h1
                  style={{
                    fontSize: "clamp(2.35rem, 5.5vw, 4.25rem)",
                    fontWeight: 800,
                    letterSpacing: "-0.03em",
                    lineHeight: 1.05,
                    marginBottom: "1.625rem",
                  }}
                >
                  {product.label}
                </h1>
                <p
                  style={{
                    fontSize: "clamp(1.0625rem, 2.15vw, 1.3125rem)",
                    color: "#888888",
                    lineHeight: 1.62,
                    maxWidth: "100%",
                    width: "100%",
                    margin: "0 0 2.25rem",
                  }}
                >
                  {product.desc}
                </p>
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} style={{ display: "inline-block" }}>
                  <Link
                    href={product.href}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "1rem 2.5rem",
                      borderRadius: "10px",
                      background: "#22c55e",
                      color: "#0a0a0a",
                      fontWeight: 700,
                      fontSize: "1.0625rem",
                      textDecoration: "none",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    Enter App →
                  </Link>
                </motion.div>
              </motion.div>
              {i === 0 ? <div className="hero-product-divider" aria-hidden /> : null}
            </Fragment>
          ))}
        </motion.div>
      </section>

      {/* ── How it works ───────────────────────────────────────── */}
      <section
        style={{
          padding: "6rem clamp(1.5rem, 6vw, 6rem)",
          maxWidth: "72rem",
          margin: "0 auto",
        }}
      >
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{
            fontSize: "0.8125rem",
            fontWeight: 600,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#22c55e",
            marginBottom: "3rem",
            textAlign: "center",
          }}
        >
          How it works
        </motion.p>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(16rem, 1fr))",
            gap: "1.25rem",
          }}
        >
          {STEPS.map((step) => (
            <motion.div
              key={step.number}
              variants={fadeUp}
              style={{
                padding: "1.75rem",
                borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.03)",
              }}
            >
              <div
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  color: "#22c55e",
                  marginBottom: "0.875rem",
                }}
              >
                {step.number}
              </div>
              <div
                style={{
                  fontSize: "1.0625rem",
                  fontWeight: 700,
                  color: "#ffffff",
                  marginBottom: "0.5rem",
                  letterSpacing: "-0.01em",
                }}
              >
                {step.title}
              </div>
              <div style={{ fontSize: "0.9375rem", color: "#888888", lineHeight: 1.55 }}>
                {step.description}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── Tech stack ─────────────────────────────────────────── */}
      <section
        style={{
          padding: "0 clamp(1.5rem, 6vw, 6rem) 8rem",
          maxWidth: "72rem",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1.25rem",
        }}
      >
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{
            fontSize: "0.8125rem",
            color: "#444444",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          Built with
        </motion.p>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", justifyContent: "center" }}
        >
          {TECH.map((name) => (
            <motion.span
              key={name}
              variants={fadeUp}
              style={{
                padding: "0.375rem 0.875rem",
                borderRadius: "999px",
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.04)",
                fontSize: "0.875rem",
                fontWeight: 500,
                color: "#cccccc",
              }}
            >
              {name}
            </motion.span>
          ))}
        </motion.div>
      </section>

    </main>
  );
}
