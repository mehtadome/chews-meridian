"use client";

import type { Trade } from "@/lib/pl/trade-types";
import type { PositionGroup } from "@/lib/pl/position-utils";
import { PanelShell } from "./PanelShell";
import { AddEditForm } from "./AddEditForm";
import { ClosePositionForm } from "./ClosePositionForm";

export type PanelMode =
  | { kind: "closed" }
  | { kind: "add" }
  | { kind: "edit"; trade: Trade }
  | { kind: "close"; group: PositionGroup };

const TITLES: Record<Exclude<PanelMode["kind"], "closed">, string> = {
  add: "Add Trade",
  edit: "Edit Trade",
  close: "Close Position",
};

interface AddTradePanelProps {
  mode: PanelMode;
  onClose: () => void;
  onSaved: () => void;
}

export function AddTradePanel({ mode, onClose, onSaved }: AddTradePanelProps) {
  const title = mode.kind !== "closed" ? TITLES[mode.kind] : "";

  return (
    <PanelShell isOpen={mode.kind !== "closed"} title={title} onClose={onClose}>
      {mode.kind === "close" && (
        <ClosePositionForm group={mode.group} onClose={onClose} onSaved={onSaved} />
      )}
      {(mode.kind === "add" || mode.kind === "edit") && (
        <AddEditForm mode={mode} onClose={onClose} onSaved={onSaved} />
      )}
    </PanelShell>
  );
}
