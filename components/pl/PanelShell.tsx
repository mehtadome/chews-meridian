"use client";

import { AnimatePresence, motion } from "framer-motion";

interface PanelShellProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export function PanelShell({ isOpen, title, onClose, children }: PanelShellProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="pl-panel-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            className="pl-panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
          >
            <div className="pl-panel__header">
              <span className="pl-title">{title}</span>
              <button className="pl-btn" onClick={onClose} style={{ padding: "0.3rem 0.6rem" }}>✕</button>
            </div>
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
