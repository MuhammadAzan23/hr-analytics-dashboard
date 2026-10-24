export function Loader({ label = "Loading…" }) {
  return (
    <div className="state" role="status">
      <span className="spinner" />
      <span>{label}</span>
    </div>
  );
}

export function EmptyState({ text = "No data for this selection." }) {
  return (
    <div className="state">
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M3 3v18h18" />
        <path d="M7 15h2M11 11h2M15 7h2" strokeLinecap="round" />
      </svg>
      <span>{text}</span>
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="card state error" role="alert">
      <strong>Something went wrong</strong>
      <span>{message}</span>
      {onRetry && <button className="btn" onClick={onRetry}>Try again</button>}
    </div>
  );
}
