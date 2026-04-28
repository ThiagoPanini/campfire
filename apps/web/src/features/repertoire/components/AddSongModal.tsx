import { useEffect, useRef, useState } from "react";
import { translate, type Language } from "@i18n";
import type { Instrument, ProficiencyLevel, SearchResult } from "../types";
import type { SearchState } from "../store/repertoire.store";
import { SearchResultRow } from "./SearchResultRow";
import { EntryConfigureForm } from "./EntryConfigureForm";

type Props = {
  language: Language;
  searchState: SearchState;
  onSearch: (q: string) => void;
  onClearSearch: () => void;
  onSave: (result: SearchResult, instrument: Instrument, proficiency: ProficiencyLevel) => Promise<void>;
  onClose: () => void;
};

type ModalMode = "search" | "configure";

export function AddSongModal({ language, searchState, onSearch, onClearSearch, onSave, onClose }: Props) {
  const [mode, setMode] = useState<ModalMode>("search");
  const [query, setQuery] = useState("");
  const [selected, setSelectedResult] = useState<SearchResult | null>(null);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const t = translate(language).repertoire;

  useEffect(() => {
    if (mode === "search") {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [mode]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  function handleQueryChange(q: string) {
    setQuery(q);
    onSearch(q);
  }

  function handleSelect(result: SearchResult) {
    setSelectedResult(result);
    setMode("configure");
  }

  async function handleSave(instrument: Instrument, proficiency: ProficiencyLevel) {
    if (!selected) return;
    setSaving(true);
    try {
      await onSave(selected, instrument, proficiency);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  function handleBack() {
    setMode("search");
  }

  const results = searchState.kind === "results" ? searchState.results : [];

  return (
    <div className="rep-modal-overlay" role="dialog" aria-modal="true" aria-label={t.addSongTitle}>
      <div className="rep-modal-card">
        <div className="rep-modal-head">
          <div>
            <p className="mono rep-modal-kicker">
              {mode === "configure" && selected ? t.configureSong : t.addSongTitle}
            </p>
            {mode === "configure" && selected && (
              <p className="rep-modal-sub">{selected.title} — {selected.artist}</p>
            )}
            {mode === "search" && (
              <p className="rep-modal-sub">{t.searchSub}</p>
            )}
          </div>
          <button
            type="button"
            className="rep-close-btn"
            aria-label={t.close}
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="rep-modal-body">
          {mode === "search" ? (
            <>
              <div className="rep-search-wrap">
                <span className="rep-search-icon" aria-hidden="true">⌕</span>
                <input
                  ref={inputRef}
                  type="search"
                  className="rep-search-input"
                  placeholder={t.searchPlaceholder}
                  value={query}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  autoComplete="off"
                />
                {query && (
                  <button
                    type="button"
                    className="rep-clear-btn"
                    onClick={() => { setQuery(""); onClearSearch(); }}
                    aria-label={t.clearSearch}
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="rep-search-results">
                {searchState.kind === "idle" && (
                  <div className="rep-search-empty">
                    <p className="mono rep-search-empty-label">{t.searchNothing}</p>
                    <p className="rep-search-empty-hint">{t.searchHint}</p>
                  </div>
                )}
                {searchState.kind === "loading" && (
                  <div className="rep-search-empty">
                    <span className="rep-spinner" aria-hidden="true" />
                  </div>
                )}
                {searchState.kind === "empty" && (
                  <div className="rep-search-empty">
                    <p className="mono rep-search-empty-label">{t.searchNoResults}</p>
                  </div>
                )}
                {searchState.kind === "unavailable" && (
                  <div className="rep-search-empty rep-search-empty--warn">
                    <p className="mono rep-search-empty-label">{t.searchUnavailable}</p>
                  </div>
                )}
                {searchState.kind === "rate_limited" && (
                  <div className="rep-search-empty rep-search-empty--warn">
                    <p className="mono rep-search-empty-label">{t.searchRateLimited}</p>
                  </div>
                )}
                {searchState.kind === "results" &&
                  results.map((r, i) => (
                    <SearchResultRow
                      key={r.externalId}
                      result={r}
                      selected={i === 0}
                      onClick={() => handleSelect(r)}
                    />
                  ))}
              </div>
            </>
          ) : (
            selected && (
              <EntryConfigureForm
                result={selected}
                language={language}
                saving={saving}
                onSave={handleSave}
                onBack={handleBack}
              />
            )
          )}
        </div>
      </div>
    </div>
  );
}
