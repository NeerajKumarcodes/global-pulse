import { ArrowDownRight, ArrowUpRight } from "lucide-react";

export function MetricCard({ label, value, unit, icon: Icon, tone = "blue", detail, status = "CURRENT" }) {
  const tones = {
    blue: "metric-icon-blue",
    orange: "metric-icon-orange",
    green: "metric-icon-green",
    violet: "metric-icon-violet",
  };

  return (
    <article className="metric-card">
      <div className="flex items-center justify-between">
        <div className={`metric-icon ${tones[tone]}`}><Icon size={19} strokeWidth={2} /></div>
        <span className={`metric-live ${status === "REFERENCE" ? "metric-reference" : ""}`}>{status !== "REFERENCE" && <span className="live-dot" />}{status}</span>
      </div>
      <p className="metric-label">{label}</p>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className="metric-value">{value}</span>
        {unit && <span className="metric-unit">{unit}</span>}
      </div>
      <div className="metric-detail">{detail || <><ArrowUpRight size={14} /> Updated from source</>}</div>
    </article>
  );
}

export function DataState({ loading, error, onRetry, children, compact = false }) {
  if (loading) {
    return (
      <div className={`data-state ${compact ? "min-h-32" : "min-h-64"}`} role="status">
        <span className="spinner" />
        <span>Fetching the latest data…</span>
      </div>
    );
  }
  if (error) {
    return (
      <div className={`data-state data-error ${compact ? "min-h-32" : "min-h-64"}`} role="alert">
        <p>{error}</p>
        <button className="text-button" onClick={onRetry}>Try again</button>
      </div>
    );
  }
  return <>{children}</>;
}

export function TrendNote({ children, direction = "up" }) {
  const TrendIcon = direction === "down" ? ArrowDownRight : ArrowUpRight;
  return <span className="inline-flex items-center gap-1"><TrendIcon size={14} />{children}</span>;
}
