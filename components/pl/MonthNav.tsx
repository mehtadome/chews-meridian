"use client";

import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";

const MONTH_ABBR = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

interface MonthNavProps {
  year: number;
  month: number;
  onPrev: () => void;
  onNext: () => void;
  onSelect: (year: number, month: number) => void;
  nextDisabled: boolean;
  maxYear: number;
  maxMonth: number;
}

export function MonthNav({ year, month, onPrev, onNext, onSelect, nextDisabled, maxYear, maxMonth }: MonthNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [popYear, setPopYear] = useState(year);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { if (isOpen) setPopYear(year); }, [isOpen, year]);

  useEffect(() => {
    if (!isOpen) return;
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [isOpen]);

  const label = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" })
    .format(new Date(year, month - 1, 1));

  function isFuture(m: number) {
    return popYear > maxYear || (popYear === maxYear && m > maxMonth);
  }

  return (
    <div ref={ref} className="pl-month-nav">
      <button className="pl-btn" onClick={onPrev} aria-label="Previous month">←</button>

      <button
        className="pl-btn pl-month-nav__label"
        onClick={() => setIsOpen(v => !v)}
        aria-label="Pick month"
      >
        {label}
      </button>

      <button className="pl-btn" onClick={onNext} disabled={nextDisabled} aria-label="Next month">→</button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="pl-calendar pl-month-nav__popup"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
          >
            <div className="pl-calendar__header">
              <button
                type="button"
                className="pl-calendar__nav"
                onClick={() => setPopYear(y => y - 1)}
                aria-label="Previous year"
              >‹</button>
              <span style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--pl-text)" }}>
                {popYear}
              </span>
              <button
                type="button"
                className="pl-calendar__nav"
                disabled={popYear >= maxYear}
                onClick={() => setPopYear(y => y + 1)}
                aria-label="Next year"
              >›</button>
            </div>

            <div className="pl-month-nav__month-grid">
              {MONTH_ABBR.map((name, i) => {
                const m = i + 1;
                const future = isFuture(m);
                const selected = popYear === year && m === month;
                return (
                  <button
                    key={name}
                    type="button"
                    disabled={future}
                    onClick={() => { onSelect(popYear, m); setIsOpen(false); }}
                    className={[
                      "pl-month-nav__month-btn",
                      selected ? "pl-calendar__day--selected" : "",
                    ].filter(Boolean).join(" ")}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
