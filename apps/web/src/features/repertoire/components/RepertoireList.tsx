import { translate, type Language } from "@i18n";
import type { Entry, ProficiencyLevel } from "../types";
import { EntryRow } from "./EntryRow";
import { EmptyState } from "./EmptyState";

type Props = {
  entries: Entry[];
  language: Language;
  loading: boolean;
  onAddSong: () => void;
  onUpdateProficiency: (id: string, proficiency: ProficiencyLevel) => Promise<void>;
  onRemove: (id: string, title: string) => void;
};

export function RepertoireList({ entries, language, loading, onAddSong, onUpdateProficiency, onRemove }: Props) {
  const t = translate(language).repertoire;

  if (loading) {
    return (
      <div className="rep-loading">
        <span className="rep-spinner" aria-hidden="true" />
      </div>
    );
  }

  if (entries.length === 0) {
    return <EmptyState language={language} onAddSong={onAddSong} />;
  }

  return (
    <div className="rep-list cf-fade">
      <div className="rep-list-header">
        <div>
          <p className="mono rep-kicker">{t.kicker}</p>
          <h1 className="display rep-list-title">{t.yourRepertoire}</h1>
          <p className="mono rep-list-count">
            {entries.length} {entries.length === 1 ? t.songSingular : t.songPlural}
          </p>
        </div>
        <button type="button" className="accent-button" onClick={onAddSong}>
          + {t.addSong}
        </button>
      </div>

      <div className="rep-entry-list">
        {entries.map((entry) => (
          <EntryRow
            key={entry.id}
            entry={entry}
            language={language}
            onUpdateProficiency={onUpdateProficiency}
            onRemove={onRemove}
          />
        ))}
      </div>
    </div>
  );
}
