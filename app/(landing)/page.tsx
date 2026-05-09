"use client";

import { Fragment, useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { ChartCandlestick } from "lucide-react";
import { StepPopover } from "@/components/landing/StepPopover";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const TECH = ["Next.js 15", "Claude", "Composer", "Gmail OAuth", "Redis", "Vercel", "TypeScript"];

const PRODUCTS = [
  {
    href: "/market-analyzer",
    label: "Market Analyzer",
    desc: "Reads your newsletters. Surfaces what moves markets.",
    steps: [
      { number: "01", title: "Connect Gmail", description: "OAuth-authenticated access to your newsletter inbox.", detail: "Uses Google OAuth2 with a read-only Gmail scope. No credentials are stored — only a refresh token you generate yourself via a one-time consent flow." },
      { number: "02", title: "AI reads and analyzes", description: "Claude scans your newsletters and identifies risks and opportunities.", detail: "Claude Haiku scans the last 30 days of emails from your configured senders, extracting ticker mentions, sector signals, earnings dates, and macro risks into a structured JSON response." },
      { number: "03", title: "Daily briefing", description: "Structured market intelligence delivered as a scannable digest — tickers, sectors, and macro signals.", detail: "Briefings are cached in Redis and refreshed within configurable windows throughout the day. You can trigger a manual refresh at any time, and the digest persists until the next calendar day." },
    ],
  },
  {
    href: "/pl-tracker",
    label: "PL Tracker",
    howItWorksTitle: "Profit & Loss Tracker",
    techStack: ["Next.js 15", "Claude", "Composer", "Redis", "Vercel", "TypeScript"],
    desc: "Log trades. Track P&L. Know where you stand.",
    steps: [
      { number: "01", title: "Log a trade", description: "Enter symbol, asset type, direction, entry price, and quantity.", detail: "Supports stocks, options, and futures. Options include a configurable multiplier (default 100). Trades are permanent — no deletes, only closes." },
      { number: "02", title: "Live prices fetched", description: "Pulls current market prices for every open position.", detail: "Prices are pulled from Yahoo Finance's v7 batch endpoint and cached for 5 minutes. Open P&L updates automatically each time you load the tracker." },
      { number: "03", title: "AI performance summary", description: "Synthesizes your monthly realized gains and open P&L into a concise briefing every time you open the tracker.", detail: "Dynamic charting powered by the Vercel AI SDK is planned — on-demand charts for cumulative P&L, win rate by asset type, and monthly gains." },
    ],
  },
] as const;

function StepCards({ steps }: { steps: readonly { number: string; title: string; description: string; detail: string }[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.1 });
  return (
    <div ref={ref} className="landing-how-steps" style={{ marginBottom: "3.5rem" }}>
      {steps.map((step, i) => (
        <motion.div
          key={step.number}
          className="landing-how-step-card"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.55, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
        >
          <div style={{ marginBottom: "0.875rem" }}>
            <StepPopover number={step.number} detail={step.detail} />
          </div>
          <div style={{ fontSize: "1.0625rem", fontWeight: 700, color: "#ffffff", marginBottom: "0.5rem", letterSpacing: "-0.01em" }}>
            {step.title}
          </div>
          <div style={{ fontSize: "0.9375rem", color: "#888888", lineHeight: 1.55 }}>{step.description}</div>
        </motion.div>
      ))}
    </div>
  );
}

function BuiltWithChips({ names, idPrefix }: { names: readonly string[]; idPrefix: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.12 });

  return (
    <div ref={ref} className="landing-tech-chips">
      {names.map((name, i) => (
        <motion.span
          key={`${idPrefix}-${name}`}
          className="landing-tech-chip"
          initial={{ opacity: 0, x: -14 }}
          animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -14 }}
          transition={{
            duration: 0.4,
            delay: i * 0.09,
            ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
          }}
        >
          {name}
        </motion.span>
      ))}
    </div>
  );
}

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

          {/* Products: two columns + rule (aligned with landing-dual-products below); extra info stays undivided */}
          {PRODUCTS.map((product, i) => (
            <Fragment key={product.href}>
              <motion.div variants={fadeUp} className="hero-product-panel">
                <h1
                  style={{
                    fontSize: "clamp(2.35rem, 5.5vw, 3.5rem)",
                    fontWeight: 800,
                    letterSpacing: "-0.03em",
                    lineHeight: 1.05,
                    marginBottom: "1.625rem",
                    color: "#ffffff",
                    minHeight: "2lh",
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
                    flex: 1,
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

      {/* Product extra information: two columns aligned with hero; no divider */}
      <section className="landing-dual-products" aria-label="Products detail">
        <div className="landing-dual-products__grid">
          {PRODUCTS.map((product) => (
            <div key={product.href} className="landing-dual-products__column">
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
                  marginBottom: "0.5rem",
                }}
              >
                {"howItWorksTitle" in product ? product.howItWorksTitle : product.label}
              </motion.p>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.05 }}
                style={{
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#444",
                  marginBottom: "3rem",
                }}
              >
                How it works
              </motion.p>
              <StepCards steps={product.steps} />

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
                  marginBottom: "1.25rem",
                }}
              >
                Built with
              </motion.p>
              <BuiltWithChips
                idPrefix={product.href}
                names={"techStack" in product ? product.techStack : TECH}
              />
            </div>
          ))}
        </div>
      </section>

    </main>
  );
}
