"use client";

import { useState } from "react";
import { useFetchOnMount } from "@/hooks/useFetchOnMount";

export function SessionBadge() {
  const [sessionRole, setSessionRole] = useState<"owner" | "guest" | null>(null);

  useFetchOnMount<{ session: string }>("/api/auth/session", (data) => {
    if (data?.session === "owner" || data?.session === "guest") setSessionRole(data.session);
  });

  if (!sessionRole) return null;

  return (
    <span
      className="ds-meta"
      style={{
        padding: "0.2rem 0.6rem",
        borderRadius: "999px",
        border: "1px solid var(--dc-border)",
        color: "var(--text-muted)",
        fontWeight: 600,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        fontSize: "0.6875rem",
      }}
    >
      {sessionRole === "owner" ? "Owner" : "Guest"}
    </span>
  );
}
