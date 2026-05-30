import React from "react";

/**
 * Converts **bold** markdown in a string to <strong> elements.
 * Everything outside ** pairs renders as plain text.
 */
export function renderBold(text: string): React.ReactNode {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  if (parts.length === 1) return text;
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : part
  );
}
