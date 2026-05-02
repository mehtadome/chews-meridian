"use client";

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
          padding: "2rem clamp(1.5rem, 6vw, 6rem)",
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
            width: "700px",
            height: "700px",
            background: "radial-gradient(circle, rgba(34,197,94,0.13) 0%, transparent 65%)",
            pointerEvents: "none",
          }}
        />

        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          style={{ position: "relative", maxWidth: "52rem" }}
        >
          {/* Eyebrow */}
          <motion.div
            variants={fadeUp}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              marginBottom: "1.75rem",
            }}
          >
            <ChartCandlestick
              style={{ width: "1.125rem", height: "1.125rem", color: "#22c55e" }}
              strokeWidth={1.75}
              aria-hidden
            />
            <span
              style={{
                fontSize: "0.8125rem",
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#22c55e",
              }}
            >
              Chew's Meridian
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeUp}
            style={{
              fontSize: "clamp(2.75rem, 7vw, 5.5rem)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
              marginBottom: "1.5rem",
            }}
          >
            Market Analyzer
          </motion.h1>

          {/* Tagline */}
          <motion.p
            variants={fadeUp}
            style={{
              fontSize: "clamp(1rem, 2vw, 1.25rem)",
              color: "#888888",
              lineHeight: 1.6,
              maxWidth: "34rem",
              margin: "0 auto 2.5rem",
            }}
          >
            Reads your newsletters. Surfaces what moves markets.
          </motion.p>

          {/* CTA */}
          <motion.div variants={fadeUp}>
            <motion.div
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              style={{ display: "inline-block" }}
            >
              <Link
                href="/market-analyzer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.875rem 2rem",
                  borderRadius: "8px",
                  background: "#22c55e",
                  color: "#0a0a0a",
                  fontWeight: 700,
                  fontSize: "1rem",
                  textDecoration: "none",
                  letterSpacing: "-0.01em",
                }}
              >
                Enter App →
              </Link>
            </motion.div>
          </motion.div>
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
