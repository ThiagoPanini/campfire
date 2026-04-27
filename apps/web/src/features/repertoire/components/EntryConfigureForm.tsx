import { useState } from "react";
import { translate, type Language } from "@i18n";
import type { Instrument, ProficiencyLevel, SearchResult } from "../types";
import { INSTRUMENTS, PROFICIENCY_DOTS } from "../catalogs";

type Props = {
  result: SearchResult;
  language: Language;
  saving: boolean;
  onSave: (instrument: Instrument, proficiency: ProficiencyLevel) => void;
  onBack: () => void;
};

export function EntryConfigureForm({ result, language, saving, onSave, onBack }: Props) {
  const [instrument, setInstrument] = useState<Instrument | null>(null);
  const [proficiency, setProficiency] = useState<ProficiencyLevel | null>(null);
  const t = translate(language).repertoire;

  const canSave = instrument !== null && proficiency !== null && !saving;

  function handleSave() {
    if (instrument && proficiency) onSave(instrument, proficiency);
  }

  return (
    <>
      {/* Song preview */}
      <div className="rep-song-preview">
        <div className="rep-cover rep-cover--lg">
          {result.coverUrl ? (
            <img
              src={result.coverUrl}
              alt={result.title}
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
        <div>
          <div className="rep-song-title">{result.title}</div>
          <div className="rep-song-sub">
            {result.artist}
            {result.releaseYear ? ` · ${result.releaseYear}` : ""}
          </div>
        </div>
      </div>

      <div className="rep-configure-body">
        {/* Instrument selection */}
        <div className="rep-form-group">
          <p className="mono rep-form-label">{t.instrumentLabel}</p>
          <div className="rep-chip-grid">
            {INSTRUMENTS.map((ins) => (
              <button
                key={ins}
                type="button"
                className="chip"
                data-selected={instrument === ins ? "true" : undefined}
                onClick={() => setInstrument(ins)}
              >
                {ins}
              </button>
            ))}
          </div>
        </div>

        {/* Proficiency selection */}
        <div className="rep-form-group">
          <p className="mono rep-form-label">{t.proficiencyLabel}</p>
          <div className="rep-prof-grid">
            {(["learning", "practicing", "ready"] as ProficiencyLevel[]).map((lvl) => (
              <button
                key={lvl}
                type="button"
                className={`rep-prof-option${proficiency === lvl ? " rep-prof-option--selected" : ""}`}
                onClick={() => setProficiency(lvl)}
              >
                <div>
                  <div className="mono rep-prof-name">{t[`proficiency_${lvl}` as keyof typeof t]}</div>
                  <span className="rep-prof-hint">{t[`proficiency_${lvl}_hint` as keyof typeof t]}</span>
                </div>
                <ProfDots level={PROFICIENCY_DOTS[lvl]} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="rep-modal-foot">
        <button type="button" className="ghost-button" onClick={onBack} disabled={saving}>
          ← {t.back}
        </button>
        <button
          type="button"
          className="accent-button"
          onClick={handleSave}
          disabled={!canSave}
        >
          {saving ? t.saving : t.addToRepertoire}
        </button>
      </div>
    </>
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
