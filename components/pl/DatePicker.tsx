"use client";

import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface DatePickerProps {
  value: string | undefined | null; // ISO "YYYY-MM-DD"
  onChange: (iso: string) => void;
  error?: boolean;
}

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];
const YEARS = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - 2 + i);
const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function parseIso(iso: string | undefined | null) {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return null;
  return { y, m, d };
}

function toIso(y: number, m: number, d: number) {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function formatDisplay(iso: string | undefined | null): string {
  const p = parseIso(iso);
  if (!p) return "Pick a date";
  return new Date(p.y, p.m - 1, p.d).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

export function DatePicker({ value, onChange, error }: DatePickerProps) {
  const today = new Date();
  const todayIso = toIso(today.getFullYear(), today.getMonth() + 1, today.getDate());

  const [isOpen, setIsOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => parseIso(value)?.y ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(() => parseIso(value)?.m ?? today.getMonth() + 1);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const p = parseIso(value);
    if (p) { setViewYear(p.y); setViewMonth(p.m); }
  }, [value]);

  useEffect(() => {
    if (!isOpen) return;
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [isOpen]);

  function prevMonth() {
    if (viewMonth === 1) { setViewMonth(12); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }

  function nextMonth() {
    if (viewMonth === 12) { setViewMonth(1); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  const firstDow = new Date(viewYear, viewMonth - 1, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div ref={ref} className="pl-datepicker">
      <button
        type="button"
        className="pl-datepicker__trigger"
        style={error ? { borderColor: "var(--pl-red)" } : undefined}
        onClick={() => setIsOpen(v => !v)}
      >
        {formatDisplay(value)}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="pl-calendar"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
          >
            <div className="pl-calendar__header">
              <button type="button" className="pl-calendar__nav" onClick={prevMonth}>‹</button>
              <div className="pl-calendar__header-selects">
                <select
                  className="pl-calendar__select"
                  value={viewMonth}
                  onChange={(e) => setViewMonth(Number(e.target.value))}
                >
                  {MONTH_NAMES.map((name, i) => (
                    <option key={name} value={i + 1}>{name}</option>
                  ))}
                </select>
                <select
                  className="pl-calendar__select"
                  value={viewYear}
                  onChange={(e) => setViewYear(Number(e.target.value))}
                >
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <button type="button" className="pl-calendar__nav" onClick={nextMonth}>›</button>
            </div>
            <div className="pl-calendar__grid">
              {DAY_LABELS.map(d => <div key={d} className="pl-calendar__dow">{d}</div>)}
              {cells.map((day, i) => {
                if (!day) return <div key={`e-${i}`} />;
                const iso = toIso(viewYear, viewMonth, day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => { onChange(iso); setIsOpen(false); }}
                    className={[
                      "pl-calendar__day",
                      iso === value ? "pl-calendar__day--selected" : "",
                      iso === todayIso && iso !== value ? "pl-calendar__day--today" : "",
                    ].filter(Boolean).join(" ")}
                  >
                    {day}
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
