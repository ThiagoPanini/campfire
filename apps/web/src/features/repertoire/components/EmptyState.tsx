import { translate, type Language } from "@i18n";

type Props = {
  language: Language;
  onAddSong: () => void;
};

export function EmptyState({ language, onAddSong }: Props) {
  const t = translate(language).repertoire;

  return (
    <div className="rep-empty cf-fade">
      <p className="mono rep-kicker">{t.kicker}</p>
      <h1 className="display rep-empty-title">{t.emptyTitle}</h1>
      <p className="rep-empty-copy">{t.emptyCopy}</p>
      <button type="button" className="accent-button large" onClick={onAddSong}>
        + {t.addFirstSong}
      </button>
      <div className="rep-empty-illus">
        <p className="mono rep-empty-illus-label">{t.starterIdeas}</p>
        <p className="rep-empty-illus-hint">{t.starterIdeasHint}</p>
      </div>
    </div>
  );
}
