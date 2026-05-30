import { renderBold } from "@/components/ui/renderBold";

interface NewsletterSummaryProps {
  title: string;
  summary: string;
}

export function NewsletterSummary({ title, summary }: NewsletterSummaryProps) {
  return (
    <div className="card">
      <div className="card__header">
        <div>
          <div className="ds-label">Summary</div>
          <div className="ds-title">{title}</div>
        </div>
      </div>
      <div className="card__body">
        <p className="ds-prose">{renderBold(summary)}</p>
      </div>
    </div>
  );
}
