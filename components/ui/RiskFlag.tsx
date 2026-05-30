import { renderBold } from "@/components/ui/renderBold";

interface RiskFlagProps {
  headline: string;
  detail: string;
  severity: "low" | "medium" | "high";
}

const severityColor: Record<string, string> = {
  low:    "var(--dc-border-low)",
  medium: "var(--dc-border-med)",
  high:   "var(--dc-border-high)",
};

export function RiskFlag({ headline, detail, severity }: RiskFlagProps) {
  return (
    <div className={`card card--${severity}`}>
      <div className="card__header">
        <div className="ds-label" style={{ marginBottom: 0, color: severityColor[severity] }}>
          Risk flag · {severity}
        </div>
      </div>
      <div className="card__body">
        <div className="ds-title" style={{ marginBottom: "0.35rem" }}>{headline}</div>
        <p className="ds-prose">{renderBold(detail)}</p>
      </div>
    </div>
  );
}
