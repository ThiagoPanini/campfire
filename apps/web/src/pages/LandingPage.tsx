import { ListMusic, Music2, Share2, Target, UsersRound } from "lucide-react";
import { AccentButton } from "@shared/ui";
import { translate } from "@i18n";

type Props = {
  onEnter: () => void;
  onSignIn: () => void;
};

const icons = [ListMusic, Target, Share2];

export function LandingPage({ onEnter, onSignIn }: Props) {
  const t = translate();
  return (
    <main className="page landing-page">
      <section className="lane landing-stage fade-up">
        <div className="landing-copy">
          <div className="hero-kicker mono">{t.landing.kicker}</div>
          <h1 className="display hero-title">
            {t.landing.h1.map((line, index) => (
              <span key={line} className={index === 1 ? "accent-line" : ""}>{line}</span>
            ))}
          </h1>
          <p className="hero-copy">{t.landing.sub}</p>
          <div className="hero-actions">
            <AccentButton large onClick={onEnter}>{t.landing.cta}</AccentButton>
            <button className="ghost-button" type="button" onClick={onSignIn}>{t.landing.secondaryCta}</button>
          </div>
        </div>
        <CampfirePreview />
      </section>

      <section className="lane feature-grid" aria-label="Recursos do Campfire">
        {t.landing.features.map(([title, body], index) => {
          const Icon = icons[index];
          return (
            <article className="feature-card" key={title}>
              <Icon size={24} strokeWidth={1.8} />
              <h2 className="mono">{title}</h2>
              <p>{body}</p>
            </article>
          );
        })}
      </section>
      <footer className="landing-footer mono">{t.landing.footer}</footer>
    </main>
  );
}

function CampfirePreview() {
  const t = translate().landing;
  return (
    <aside className="campfire-preview" aria-label="Prévia do Campfire">
      <div className="preview-toolbar">
        <span className="preview-dot" />
        <span className="preview-dot" />
        <span className="preview-dot" />
        <span className="mono">{t.previewTitle}</span>
      </div>
      <div className="preview-hero">
        <div>
          <p className="mono">{t.previewSession}</p>
          <h2>{t.previewSubtitle}</h2>
        </div>
        <span className="preview-pill"><UsersRound size={14} aria-hidden="true" /> {t.previewParticipants}</span>
      </div>
      <div className="preview-grid">
        <PreviewMetric label={t.previewReady} value="12" />
        <PreviewMetric label={t.previewPractice} value="5" />
        <PreviewMetric label={t.previewLearning} value="3" />
      </div>
      <div className="preview-setlist">
        <div className="preview-setlist-head">
          <span className="mono">{t.previewSetlist}</span>
          <Music2 size={15} aria-hidden="true" />
        </div>
        {["Trem Bala", "Hey Jude", "Tempo Perdido"].map((song, index) => (
          <div className="preview-song-row" key={song}>
            <span className="mono">{String(index + 1).padStart(2, "0")}</span>
            <strong>{song}</strong>
            <i aria-hidden="true">
              <b style={{ width: `${82 - index * 16}%` }} />
            </i>
          </div>
        ))}
      </div>
    </aside>
  );
}

function PreviewMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="preview-metric">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}
