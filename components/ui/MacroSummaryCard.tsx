import { renderBold } from "@/components/ui/renderBold";

interface Indicator {
  label: string;
  value: string;
}

interface MacroSummaryCardProps {
  title: string;
  summary: string;
  indicators?: Indicator[];
}

export function MacroSummaryCard({ title, summary, indicators = [] }: MacroSummaryCardProps) {
  return (
    <div className="card">
      <div className="card__header">
        <div>
          <div className="ds-label">Macro</div>
          <div className="ds-title">{title}</div>
        </div>
      </div>
      <div className="card__body">
        <p className="ds-prose">{renderBold(summary)}</p>
        {indicators.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {indicators.map((ind) => (
              <span key={ind.label} className="ds-chip">
                {ind.label}: {ind.value}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
