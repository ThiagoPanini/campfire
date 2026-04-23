import { Link } from "react-router-dom";

import { AuthActions } from "../../features/auth/AuthActions";

export function LandingPage(): JSX.Element {
  return (
    <main className="page page-landing">
      <div className="landing-wrap">
        <section className="landing-topbar" aria-label="Campfire product overview">
          <div className="brand-lockup">
            <div className="brand-mark">CF</div>
            <div>
              <p className="brand-name">Campfire</p>
              <p className="brand-copy">Private rehearsal coordination for serious friend bands.</p>
            </div>
          </div>
          <div className="topbar-meta">
            <span className="signal-dot" aria-hidden="true" />
            <span>Secure auth bootstrap</span>
            <span>Music-room layout</span>
            <span>Responsive shell</span>
          </div>
        </section>

        <section className="landing-showcase">
          <div className="hero-panel">
            <div className="hero-copy">
              <p className="eyebrow">Authenticated music workspace</p>
              <h1>The private rehearsal room your group can actually rally around.</h1>
              <p className="lede">
                Campfire borrows the confidence and density of modern streaming products, then
                refits it for jam sessions: trusted sign-in, a polished shell, and a shared sense
                of what happens next before anyone loads in an amp.
              </p>
              <div className="hero-actions">
                <AuthActions />
                <Link className="button button-ghost" to="/app">
                  Preview shell
                </Link>
              </div>
            </div>

            <div className="hero-spotlight" aria-label="Campfire session preview">
              <article className="cover-card">
                <div className="cover-art" aria-hidden="true" />
                <div className="cover-card__meta">
                  <p className="cover-card__title">Friday Loft Warm-Up</p>
                  <p className="cover-card__subtitle">4 players synced, setlist draft live, room brief ready.</p>
                </div>
              </article>
              <aside className="queue-card">
                <p className="eyebrow">Queue for the room</p>
                <div className="queue-row">
                  <span className="queue-row__index">01</span>
                  <div>
                    <strong className="queue-row__title">Secure sign-in via Hosted UI</strong>
                    <span className="queue-row__meta">Identity stays in managed auth infrastructure.</span>
                  </div>
                  <span className="queue-row__length">PKCE</span>
                </div>
                <div className="queue-row">
                  <span className="queue-row__index">02</span>
                  <div>
                    <strong className="queue-row__title">Protected shell with dense navigation</strong>
                    <span className="queue-row__meta">Sidebar, utility bar, and responsive rails.</span>
                  </div>
                  <span className="queue-row__length">UI</span>
                </div>
                <div className="queue-row">
                  <span className="queue-row__index">03</span>
                  <div>
                    <strong className="queue-row__title">Bootstrap the local Campfire member</strong>
                    <span className="queue-row__meta">First authenticated fetch creates the app profile.</span>
                  </div>
                  <span className="queue-row__length">/me</span>
                </div>
              </aside>
            </div>
          </div>

          <aside className="hero-sidebar" aria-label="Campfire highlights">
            <section className="panel-card">
              <p className="eyebrow">Moodboard</p>
              <h2>Streaming-product clarity, tuned for bands.</h2>
              <p className="body-copy">
                Dark immersive surfaces, pill controls, dense hierarchy, and careful accent usage
                keep the experience recognizable for music apps without borrowing Spotify assets.
              </p>
              <div className="tag-row">
                <span className="tag">Electric aqua accent</span>
                <span className="tag">Near-black surfaces</span>
                <span className="tag">Accessible contrast</span>
              </div>
            </section>

            <section className="snapshot-grid">
              <article className="snapshot-card">
                <p className="eyebrow">Front door</p>
                <strong>CloudFront-ready shell</strong>
                <span>Static app delivery with a premium first impression.</span>
              </article>
              <article className="snapshot-card">
                <p className="eyebrow">Identity</p>
                <strong>Cognito hosted handoff</strong>
                <span>Credentials stay outside Campfire application code.</span>
              </article>
              <article className="snapshot-card">
                <p className="eyebrow">Bootstrap</p>
                <strong>Local member record</strong>
                <span>Profile context appears the moment the room opens.</span>
              </article>
            </section>
          </aside>
        </section>

        <section className="landing-section">
          <div className="section-header">
            <div>
              <p className="eyebrow">Authenticated surfaces</p>
              <h2>Built like a real music product, not a placeholder dashboard.</h2>
            </div>
            <div className="pill-row">
              <span className="metric-pill metric-pill--accent">Sidebar navigation</span>
              <span className="metric-pill metric-pill--success">Responsive shell</span>
              <span className="metric-pill metric-pill--warning">Clear failure states</span>
            </div>
          </div>

          <div className="landing-grid">
            <article className="rail-card">
              <div className="rail-card__art" aria-hidden="true" />
              <strong>Utility-first top bar</strong>
              <p>Search, session identity, and account actions stay visible without crowding the main rail.</p>
            </article>
            <article className="rail-card">
              <div className="rail-card__art rail-card__art--warm" aria-hidden="true" />
              <strong>Dense room overview</strong>
              <p>Important rehearsal state is stacked into clear cards the way listeners expect from streaming UIs.</p>
            </article>
            <article className="rail-card">
              <div className="rail-card__art rail-card__art--violet" aria-hidden="true" />
              <strong>Bootstrap with confidence</strong>
              <p>Loading, success, and recovery states are part of the product language, not an afterthought.</p>
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}
