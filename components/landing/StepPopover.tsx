"use client";

import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface StepPopoverProps {
  number: string;
  detail: string;
}

export function StepPopover({ number, detail }: StepPopoverProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          fontSize: "0.75rem",
          fontWeight: 700,
          letterSpacing: "0.1em",
          color: open ? "#4ade80" : "#22c55e",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          fontFamily: "inherit",
          textDecoration: open ? "underline" : "none",
          textUnderlineOffset: "3px",
        }}
        aria-expanded={open}
      >
        {number}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            style={{
              position: "absolute",
              top: "calc(100% + 0.5rem)",
              left: "50%",
              transform: "translateX(-50%)",
              width: "15rem",
              background: "#141414",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              padding: "0.75rem 0.875rem",
              fontSize: "0.8125rem",
              color: "#aaaaaa",
              lineHeight: 1.6,
              zIndex: 20,
              boxShadow: "0 8px 28px rgba(0,0,0,0.5)",
              textAlign: "left",
            }}
          >
            {detail}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
