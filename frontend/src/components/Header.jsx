export default function Header({ theme, onToggleTheme }) {
  return (
    <header className="header">
      <div className="container header-inner">
        <div className="brand">
          <svg className="logo" viewBox="0 0 32 32" aria-hidden="true">
            <rect width="32" height="32" rx="8" />
            <rect x="7" y="16" width="4" height="9" rx="1" fill="#fff" />
            <rect x="14" y="10" width="4" height="15" rx="1" fill="#fff" />
            <rect x="21" y="6" width="4" height="19" rx="1" fill="#fff" />
          </svg>
          <div>
            <h1>HR Analytics Dashboard</h1>
            <p className="muted">Workforce, pay, performance and attrition</p>
          </div>
        </div>
        <button
          className="icon-btn"
          onClick={onToggleTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          title={theme === "dark" ? "Light mode" : "Dark mode"}
        >
          {theme === "dark" ? (
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
            </svg>
          )}
        </button>
      </div>
    </header>
  );
}
