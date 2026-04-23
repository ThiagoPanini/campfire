import { Link } from "react-router-dom";

import { useMe } from "../../features/me/useMe";

export function MeBootstrapPage(): JSX.Element {
  const { data, error, isLoading } = useMe();

  if (isLoading) {
    return (
      <div className="shell-layout">
        <section className="shell-overview">
          <section className="bootstrap-card">
            <p className="eyebrow">Bootstrap / Loading</p>
            <h2>Preparing your room profile.</h2>
            <p className="lede">
              Campfire is resolving your trusted identity, checking for a local member record, and
              warming the authenticated shell.
            </p>
            <div className="pill-row">
              <span className="status-pill">Secure bootstrap in progress</span>
            </div>
          </section>
        </section>
        <aside className="shell-side">
          <section className="side-panel">
            <p className="eyebrow">What happens now</p>
            <div className="activity-list">
              <div className="activity-row">
                <span className="queue-row__index">01</span>
                <div>
                  <strong className="activity-row__title">Verify session token</strong>
                  <span className="activity-row__meta">Using the managed auth boundary.</span>
                </div>
                <span className="queue-row__length">Auth</span>
              </div>
              <div className="activity-row">
                <span className="queue-row__index">02</span>
                <div>
                  <strong className="activity-row__title">Fetch user context</strong>
                  <span className="activity-row__meta">Resolve or create the Campfire member record.</span>
                </div>
                <span className="queue-row__length">API</span>
              </div>
            </div>
          </section>
        </aside>
      </div>
    );
  }

  if (error) {
    return (
      <div className="shell-layout">
        <section className="shell-overview">
          <section className="bootstrap-card">
            <p className="eyebrow">Bootstrap / Action needed</p>
            <h2>We couldn&apos;t load your authenticated room context.</h2>
            <p className="lede">
              The session exists, but the `/me` bootstrap response did not complete. Retry after
              confirming the API and identity configuration are in sync.
            </p>
            <div className="hero-actions">
              <Link className="button button-secondary" to="/">
                Return to landing page
              </Link>
            </div>
          </section>
        </section>
        <aside className="shell-side">
          <section className="side-panel">
            <p className="eyebrow">Recovery tips</p>
            <div className="activity-list">
              <div className="activity-row">
                <span className="queue-row__index">01</span>
                <div>
                  <strong className="activity-row__title">Refresh the session</strong>
                  <span className="activity-row__meta">Sign out and back in if the token is stale.</span>
                </div>
                <span className="queue-row__length">Tip</span>
              </div>
              <div className="activity-row">
                <span className="queue-row__index">02</span>
                <div>
                  <strong className="activity-row__title">Check API wiring</strong>
                  <span className="activity-row__meta">Verify the `/me` route and local dev mock are reachable.</span>
                </div>
                <span className="queue-row__length">Fix</span>
              </div>
            </div>
          </section>
        </aside>
      </div>
    );
  }

  return (
    <div className="shell-layout">
      <section className="shell-overview">
        <section className="overview-hero">
          <p className="eyebrow">Campfire Foundation</p>
          <h2>{data?.bootstrap.firstLogin ? "Your Campfire profile is live." : "Welcome back to Campfire."}</h2>
          <p className="lede">
            Signed in as <strong>{data?.user.displayName ?? data?.user.email}</strong>. Your room
            context is ready, the shell is authenticated, and the next music-product slice can layer
            on top of this foundation without reworking the navigation language.
          </p>
          <div className="pill-row">
            <span className="status-pill">{data?.bootstrap.firstLogin ? "First login" : "Returning member"}</span>
            <span className="chip">Protected route active</span>
            <span className="chip">Bootstrap endpoint resolved</span>
          </div>

          <div className="overview-hero__stats">
            <article className="stat-card">
              <p className="metric-label">Status</p>
              <div className="metric-value">
                <strong>{data?.user.status ?? "active"}</strong>
                <span>member state</span>
              </div>
            </article>
            <article className="stat-card">
              <p className="metric-label">Login</p>
              <div className="metric-value">
                <strong>{data?.bootstrap.firstLogin ? "01" : "02+"}</strong>
                <span>{data?.bootstrap.firstLogin ? "first authenticated bootstrap" : "trusted return session"}</span>
              </div>
            </article>
            <article className="stat-card">
              <p className="metric-label">Route</p>
              <div className="metric-value">
                <strong>/me</strong>
                <span>user context rail</span>
              </div>
            </article>
          </div>
        </section>

        <section className="bootstrap-card">
          <p className="eyebrow">Member snapshot</p>
          <h2>Identity and bootstrap details</h2>
          <p className="lede">
            These values come directly from the authenticated bootstrap response and define the
            minimum member context for the current slice.
          </p>
          <dl className="bootstrap-grid">
            <div>
              <dt>Campfire user</dt>
              <dd>{data?.user.id}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{data?.user.email ?? "Not provided"}</dd>
            </div>
            <div>
              <dt>Display name</dt>
              <dd>{data?.user.displayName ?? "Campfire member"}</dd>
            </div>
            <div>
              <dt>Last login</dt>
              <dd>{data?.user.lastLoginAt ?? "First session"}</dd>
            </div>
          </dl>
        </section>

        <section className="landing-section">
          <div className="section-header">
            <div>
              <p className="eyebrow">Next surfaces</p>
              <h2>Ready for richer music workflows.</h2>
            </div>
          </div>
          <div className="rail-grid">
            <article className="rail-card">
              <div className="rail-card__art" aria-hidden="true" />
              <strong>Shared room briefs</strong>
              <p>Band-specific preparation notes can slot into this same rail structure cleanly.</p>
            </article>
            <article className="rail-card">
              <div className="rail-card__art rail-card__art--warm" aria-hidden="true" />
              <strong>Setlist sequencing</strong>
              <p>Track ordering, rehearsal priorities, and voting can inherit the shell tokens directly.</p>
            </article>
            <article className="rail-card">
              <div className="rail-card__art rail-card__art--violet" aria-hidden="true" />
              <strong>Presence and recaps</strong>
              <p>Identity-aware group memory features already have a consistent home in the UI.</p>
            </article>
          </div>
        </section>
      </section>

      <aside className="shell-side">
        <section className="side-panel">
          <p className="eyebrow">Session pulse</p>
          <h3>What the shell knows right now</h3>
          <div className="activity-list">
            <div className="activity-row">
              <span className="queue-row__index">ID</span>
              <div>
                <strong className="activity-row__title">Managed identity passed through</strong>
                <span className="activity-row__meta">No custom credential handling in app code.</span>
              </div>
              <span className="queue-row__length">Safe</span>
            </div>
            <div className="activity-row">
              <span className="queue-row__index">ME</span>
              <div>
                <strong className="activity-row__title">Bootstrap response returned</strong>
                <span className="activity-row__meta">The shell can now render session-aware surfaces.</span>
              </div>
              <span className="queue-row__length">Live</span>
            </div>
            <div className="activity-row">
              <span className="queue-row__index">NX</span>
              <div>
                <strong className="activity-row__title">Design system applied end to end</strong>
                <span className="activity-row__meta">Tokens, navigation, and cards now share one source of truth.</span>
              </div>
              <span className="queue-row__length">Ready</span>
            </div>
          </div>
        </section>

        <section className="side-panel">
          <p className="eyebrow">Surface cues</p>
          <div className="tag-row">
            <span className="tag">Aqua active state</span>
            <span className="tag">Dark rail hierarchy</span>
            <span className="tag">Sticky utility chrome</span>
            <span className="tag">Mobile bottom nav</span>
          </div>
        </section>
      </aside>
    </div>
  );
}
