import { useState } from "react";
import { translate, type Language } from "@i18n";
import type { Entry, ProficiencyLevel } from "../types";
import { PROFICIENCY_DOTS } from "../catalogs";

type Props = {
  entry: Entry;
  language: Language;
  onUpdateProficiency: (id: string, proficiency: ProficiencyLevel) => Promise<void>;
  onRemove: (id: string, title: string) => void;
};

export function EntryRow({ entry, language, onUpdateProficiency, onRemove }: Props) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const t = translate(language).repertoire;

  async function handleProficiencyChange(lvl: ProficiencyLevel) {
    setSaving(true);
    try {
      await onUpdateProficiency(entry.id, lvl);
      setEditing(false);
    } catch {
      // toast is shown by the store
    } finally {
      setSaving(false);
    }
  }

  const dots = PROFICIENCY_DOTS[entry.proficiency];

  return (
    <div className="rep-entry-row">
      <div className="rep-cover">
        {entry.songCoverUrl ? (
          <img
            src={entry.songCoverUrl}
            alt={entry.songTitle}
            className="rep-cover-img"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
              e.currentTarget.parentElement?.classList.add("rep-cover--fallback");
            }}
          />
        ) : (
          <span className="rep-cover--fallback" aria-hidden="true" />
        )}
      </div>

      <div className="rep-entry-info">
        <div className="rep-entry-title">{entry.songTitle}</div>
        <div className="rep-entry-sub">{entry.songArtist}</div>
      </div>

      <div className="rep-entry-instrument">{entry.instrument}</div>

      {editing ? (
        <div className="rep-inline-edit">
          {(["learning", "practicing", "ready"] as ProficiencyLevel[]).map((lvl) => (
            <button
              key={lvl}
              type="button"
              className={`rep-inline-lvl${entry.proficiency === lvl ? " rep-inline-lvl--active" : ""}`}
              onClick={() => handleProficiencyChange(lvl)}
              disabled={saving}
            >
              <ProfDots level={PROFICIENCY_DOTS[lvl]} />
              <span className="mono">{t[`proficiency_${lvl}` as keyof typeof t]}</span>
            </button>
          ))}
          <button
            type="button"
            className="rep-inline-cancel mono"
            onClick={() => setEditing(false)}
            disabled={saving}
          >
            {t.cancel}
          </button>
        </div>
      ) : (
        <div className="rep-entry-level">
          <ProfDots level={dots} />
          <span className="mono rep-entry-level-label">{t[`proficiency_${entry.proficiency}` as keyof typeof t]}</span>
        </div>
      )}

      <div className="rep-entry-actions">
        {!editing && (
          <button
            type="button"
            className="rep-icon-btn"
            aria-label={t.editProficiency}
            onClick={() => setEditing(true)}
          >
            ✎
          </button>
        )}
        <button
          type="button"
          className="rep-icon-btn rep-icon-btn--danger"
          aria-label={t.remove}
          onClick={() => onRemove(entry.id, entry.songTitle)}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

function ProfDots({ level }: { level: number }) {
  return (
    <span className="rep-prof-dots" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <span key={i} className={`rep-prof-dot${i < level ? " rep-prof-dot--filled" : ""}`} />
      ))}
    </span>
  );
}
