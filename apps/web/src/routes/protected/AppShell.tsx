import { Link, Outlet } from "react-router-dom";

import { AuthActions } from "../../features/auth/AuthActions";
import { getSession } from "../../features/auth/session";

export function AppShell(): JSX.Element {
  const session = getSession();

  return (
    <div className="page page-shell">
      <div className="app-shell">
        <aside className="sidebar" aria-label="Primary navigation">
          <div className="brand-lockup brand-lockup--sidebar">
            <div className="brand-mark brand-mark--small">CF</div>
            <div>
              <p className="brand-name">Campfire</p>
              <p className="brand-copy">Protected session shell</p>
            </div>
          </div>

          <section className="sidebar__section">
            <p className="nav-label">Browse</p>
            <nav className="nav-stack">
              <Link className="nav-item nav-item--active" to="/app/me">
                <span className="nav-item__icon">HM</span>
                <span>Home</span>
              </Link>
              <Link className="nav-item" to="/app/me">
                <span className="nav-item__icon">RM</span>
                <span>Rooms</span>
              </Link>
              <Link className="nav-item" to="/app/me">
                <span className="nav-item__icon">QT</span>
                <span>Queue</span>
              </Link>
            </nav>
          </section>

          <section className="sidebar__section">
            <p className="nav-label">Your library</p>
            <nav className="nav-stack">
              <Link className="nav-item" to="/app/me">
                <span className="nav-item__icon">PR</span>
                <span>Profile bootstrap</span>
              </Link>
              <Link className="nav-item" to="/app/me">
                <span className="nav-item__icon">ST</span>
                <span>Setlist drafts</span>
              </Link>
              <Link className="nav-item" to="/app/me">
                <span className="nav-item__icon">NT</span>
                <span>Session notes</span>
              </Link>
            </nav>
          </section>

          <section className="sidebar__section">
            <div className="utility-card">
              <p className="eyebrow">Session state</p>
              <div className="utility-card__row">
                <span>Mode</span>
                <strong>Authenticated</strong>
              </div>
              <div className="utility-card__row">
                <span>Identity</span>
                <strong>Verified</strong>
              </div>
              <div className="utility-card__row">
                <span>Slice</span>
                <strong>Auth bootstrap</strong>
              </div>
            </div>
          </section>
        </aside>

        <div className="shell-content">
          <header className="shell-topbar">
            <label className="search-shell" aria-label="Search session surfaces">
              <span className="nav-item__icon">SR</span>
              <input placeholder="Search rooms, members, and session context" readOnly />
            </label>
            <div className="shell-header__actions">
              <div className="identity-pill">
                <span>{session?.displayName ?? "Signed in"}</span>
                <small>{session?.email ?? "Verified member"}</small>
              </div>
              <AuthActions authenticated />
            </div>
          </header>

          <main className="shell-main">
            <Outlet />
          </main>

          <nav className="mobile-nav" aria-label="Mobile navigation">
            <Link className="mobile-nav__item mobile-nav__item--active" to="/app/me">
              <span className="mobile-nav__icon">HM</span>
              <span className="mobile-nav__label">Home</span>
            </Link>
            <Link className="mobile-nav__item" to="/app/me">
              <span className="mobile-nav__icon">RM</span>
              <span className="mobile-nav__label">Rooms</span>
            </Link>
            <Link className="mobile-nav__item" to="/app/me">
              <span className="mobile-nav__icon">QT</span>
              <span className="mobile-nav__label">Queue</span>
            </Link>
            <Link className="mobile-nav__item" to="/app/me">
              <span className="mobile-nav__icon">ME</span>
              <span className="mobile-nav__label">Me</span>
            </Link>
          </nav>
        </div>
      </div>
    </div>
  );
}
