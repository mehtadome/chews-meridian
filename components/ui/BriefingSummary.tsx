import { renderBold } from "@/components/ui/renderBold";

interface BriefingSummaryProps {
  headline: string;
  body: string;
}

export function BriefingSummary({ headline, body }: BriefingSummaryProps) {
  return (
    <div className="card">
      <div className="card__header">
        <div className="ds-label">Today&apos;s Briefing</div>
      </div>
      <div className="card__body">
        <p className="ds-title" style={{ marginBottom: "0.6rem" }}>{renderBold(headline)}</p>
        <p className="ds-prose">{renderBold(body)}</p>
      </div>
    </div>
  );
}
