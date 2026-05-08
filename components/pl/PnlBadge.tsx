interface PnlBadgeProps {
  value: number;
}

export function PnlBadge({ value }: PnlBadgeProps) {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    signDisplay: "always",
  }).format(value);

  const variant = value > 0 ? "profit" : value < 0 ? "loss" : "neutral";

  return <span className={`pl-badge pl-badge--${variant}`}>{formatted}</span>;
}
