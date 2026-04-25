import { ListMusic, Share2, Target } from "lucide-react";
import { AccentButton } from "../components/buttons";
import { AccentControls } from "../components/AccentControls";
import type { AccentPresetId } from "../data/catalogs";
import type { Language } from "../data/copy";
import { copy } from "../data/copy";

type Props = {
  language: Language;
  accent: AccentPresetId;
  onLanguage: (language: Language) => void;
  onAccent: (accent: AccentPresetId) => void;
  onEnter: () => void;
};

const icons = [ListMusic, Target, Share2];

export function Landing({ language, accent, onLanguage, onAccent, onEnter }: Props) {
  const t = copy[language];
  return (
    <main className="page landing-page">
      <section className="lane landing-hero fade-up">
        <div className="hero-kicker mono">{t.landing.kicker}</div>
        <h1 className="display hero-title">
          {t.landing.h1.map((line, index) => <span key={line} className={index === 3 ? "accent-line" : ""}>{line}</span>)}
        </h1>
        <p className="hero-copy">{t.landing.sub}</p>
        <AccentButton large onClick={onEnter}>{t.landing.cta}</AccentButton>
        <AccentControls labels={t.controls} language={language} accent={accent} onLanguage={onLanguage} onAccent={onAccent} />
      </section>

      <section className="lane feature-grid" aria-label="Campfire features">
        {t.landing.features.map(([title, body], index) => {
          const Icon = icons[index];
          return (
            <article className={`feature-card feature-${index + 1}`} key={title}>
              <Icon size={26} strokeWidth={1.8} />
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
