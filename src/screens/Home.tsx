import type { AuthMode, MockUser, Preferences } from "../app/session-store";
import { AccentButton } from "../components/buttons";
import { contexts, experiences } from "../data/catalogs";
import type { Language } from "../data/copy";
import { copy } from "../data/copy";

type Props = {
  language: Language;
  user: MockUser;
  preferences: Preferences;
  authMode: AuthMode;
  onUpdatePreferences: () => void;
};

export function Home({ language, user, preferences, authMode, onUpdatePreferences }: Props) {
  const t = copy[language].home;
  const title = (authMode === "returning" ? t.returningTitle : t.firstTitle).replace("{name}", user.displayName);
  const panel = authMode === "returning" ? t.returningPanel : t.firstPanel;

  return (
    <main className="page">
      <section className="home-lane fade-up">
        <p className="mono home-kicker">{t.kicker}</p>
        <h1 className="display home-title">{title}</h1>
        <p className="home-copy">{t.sub}</p>

        <article className="member-panel">
          <p>{panel}</p>
          <dl>
            <div><dt className="mono">{t.email}</dt><dd>{user.email}</dd></div>
            <div><dt className="mono">{t.preferences}</dt><dd>{preferenceSummary(preferences)}</dd></div>
          </dl>
          <AccentButton onClick={onUpdatePreferences}>{t.update}</AccentButton>
        </article>
      </section>
    </main>
  );
}

function preferenceSummary(preferences: Preferences) {
  const context = contexts.find((item) => item.id === preferences.context)?.label;
  const experience = experiences.find((item) => item.id === preferences.experience)?.label;
  const parts = [
    ...preferences.instruments.slice(0, 3),
    ...preferences.genres.slice(0, 2),
    context,
    experience,
  ].filter(Boolean);
  return parts.length ? parts.join(" / ") : "No selections yet";
}
