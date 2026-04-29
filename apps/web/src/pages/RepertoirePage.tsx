import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Cloud, Flame, Plus, Search, SlidersHorizontal } from "lucide-react";
import { translate, type Language } from "@i18n";
import {
  AddSongModal,
  EmptyState,
  EntryRow,
  RepertoireToast,
  RemoveEntryDialog,
  INSTRUMENTS,
  useRepertoireStore,
  type Entry,
  type SearchResult,
} from "@features/repertoire";
import type { Instrument, ProficiencyLevel } from "@features/repertoire";

type Props = {
  language: Language;
  onHome: () => void;
};

type PendingRemove = {
  id: string;
  title: string;
};

type SortMode = "recent" | "title" | "artist" | "status";
type StatusFilter = "all" | ProficiencyLevel;

const PAGE_SIZE = 10;
const RECENT_WINDOW_DAYS = 15;

export function RepertoirePage({ language, onHome }: Props) {
  const store = useRepertoireStore();
  const t = translate(language).repertoire;
  const [showAdd, setShowAdd] = useState(false);
  const [pendingRemove, setPendingRemove] = useState<PendingRemove | null>(null);
  const [query, setQuery] = useState("");
  const [instrument, setInstrument] = useState<"all" | Instrument>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortMode>("recent");
  const [page, setPage] = useState(1);

  const stats = useMemo(() => getRepertoireStats(store.entries), [store.entries]);

  const filteredEntries = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return sortEntries(
      store.entries.filter((entry) => {
        const matchesQuery = !normalizedQuery
          || entry.songTitle.toLowerCase().includes(normalizedQuery)
          || entry.songArtist.toLowerCase().includes(normalizedQuery);
        const matchesInstrument = instrument === "all" || entry.instrument === instrument;
        const matchesStatus = status === "all" || entry.proficiency === status;
        return matchesQuery && matchesInstrument && matchesStatus;
      }),
      sort,
    );
  }, [instrument, query, sort, status, store.entries]);

  const pageCount = Math.max(1, Math.ceil(filteredEntries.length / PAGE_SIZE));
  const pagedEntries = filteredEntries.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [query, instrument, status, sort]);

  useEffect(() => {
    setPage((current) => Math.min(current, pageCount));
  }, [pageCount]);

  async function handleSave(result: SearchResult, selectedInstrument: Instrument, proficiency: ProficiencyLevel) {
    await store.addOrUpdate({
      songExternalId: result.externalId,
      songTitle: result.title,
      songArtist: result.artist,
      songAlbumTitle: result.albumTitle,
      songReleaseYear: result.releaseYear,
      songCoverUrl: result.coverUrl,
      instrument: selectedInstrument,
      proficiency,
    });
  }

  async function handleConfirmRemove(id: string, title: string) {
    await store.removeEntry(id, title);
    setPendingRemove(null);
  }

  return (
    <main className="page">
      <section className="rep-page-lane">
        <div className="rep-list-header rep-page-head">
          <div>
            <p className="mono rep-kicker">{t.kicker}</p>
            <h1 className="display rep-list-title">{t.yourRepertoire}</h1>
            <p className="mono rep-list-count">
              {store.entries.length} {store.entries.length === 1 ? t.songSingular : t.songPlural}
            </p>
          </div>
          <div className="rep-page-actions">
            <button type="button" className="ghost-button" onClick={onHome}>
              {t.backToHome}
            </button>
            <button type="button" className="accent-button" onClick={() => setShowAdd(true)}>
              <Plus size={14} aria-hidden="true" /> {t.addSong}
            </button>
          </div>
        </div>

        {store.loading ? (
          <div className="rep-loading">
            <span className="rep-spinner" aria-hidden="true" />
          </div>
        ) : store.entries.length === 0 ? (
          <EmptyState language={language} onAddSong={() => setShowAdd(true)} />
        ) : (
          <>
            <RepertoireStats stats={stats} language={language} />
            <RepertoireFilters
              language={language}
              query={query}
              instrument={instrument}
              status={status}
              sort={sort}
              onQuery={setQuery}
              onInstrument={setInstrument}
              onStatus={setStatus}
              onSort={setSort}
            />
            <section className="rep-list cf-fade" aria-label={t.fullListing}>
              <div className="rep-results-head">
                <p className="mono">
                  {filteredEntries.length} {filteredEntries.length === 1 ? t.resultSingular : t.resultPlural}
                </p>
                {hasActiveFilters(query, instrument, status) && (
                  <button
                    className="link-button"
                    type="button"
                    onClick={() => {
                      setQuery("");
                      setInstrument("all");
                      setStatus("all");
                    }}
                  >
                    {t.clearFilters}
                  </button>
                )}
              </div>

              {filteredEntries.length === 0 ? (
                <div className="rep-filter-empty">
                  <p className="display">{t.noFilteredResults}</p>
                  <p className="muted">{t.noFilteredResultsHint}</p>
                </div>
              ) : (
                <>
                  <div className="rep-table-head" aria-hidden="true">
                    <span />
                    <span>{t.tableSong}</span>
                    <span>{t.tableInstrument}</span>
                    <span>{t.tableStatus}</span>
                    <span>{t.tableActions}</span>
                  </div>
                  <div className="rep-entry-list">
                    {pagedEntries.map((entry) => (
                      <EntryRow
                        key={entry.id}
                        entry={entry}
                        language={language}
                        onUpdateProficiency={store.updateProficiency}
                        onRemove={(id, title) => setPendingRemove({ id, title })}
                      />
                    ))}
                  </div>
                  <RepertoirePagination
                    language={language}
                    page={page}
                    pageCount={pageCount}
                    total={filteredEntries.length}
                    onPage={setPage}
                  />
                </>
              )}
            </section>
          </>
        )}
      </section>

      {showAdd && (
        <AddSongModal
          language={language}
          searchState={store.searchState}
          onSearch={store.search}
          onClearSearch={store.clearSearch}
          onSave={handleSave}
          onClose={() => { setShowAdd(false); store.clearSearch(); }}
        />
      )}

      {pendingRemove && (
        <RemoveEntryDialog
          entryId={pendingRemove.id}
          entryTitle={pendingRemove.title}
          language={language}
          onConfirm={handleConfirmRemove}
          onCancel={() => setPendingRemove(null)}
        />
      )}

      {store.toast && (
        <RepertoireToast
          toast={store.toast}
          language={language}
          onDismiss={store.dismissToast}
        />
      )}
    </main>
  );
}

function RepertoireStats({ stats, language }: { stats: ReturnType<typeof getRepertoireStats>; language: Language }) {
  const t = translate(language).repertoire;

  return (
    <section className="rep-stats-grid" aria-label={t.statsLabel}>
      <article className="rep-stat-card rep-stat-total">
        <div className="rep-total-main">
          <p className="mono">{t.totalSongs}</p>
          <p className="rep-stat-number">{String(stats.total).padStart(2, "0")}</p>
          <p className="muted">{stats.total === 1 ? t.songSingular : t.songPlural}</p>
        </div>
        <div className={`rep-streak ${stats.recent15 > 0 ? "rep-streak--lit" : "rep-streak--quiet"}`}>
          <span className="rep-streak-icon" aria-hidden="true">
            {stats.recent15 > 0 ? <Flame size={22} /> : <Cloud size={22} />}
          </span>
          <span>
            <strong>{stats.recent15}</strong>
            <small>{t.addedLast15}</small>
            <em>{stats.recent15 > 0 ? t.keepRocking : t.letsRock}</em>
          </span>
        </div>
      </article>

      <article className="rep-stat-card rep-stat-instruments">
        <div className="rep-card-title-row">
          <p className="mono">{t.instruments}</p>
          <SlidersHorizontal size={15} aria-hidden="true" />
        </div>
        <div className="rep-bars">
          {stats.topInstruments.map((item) => (
            <div className="rep-bar-row" key={item.instrument}>
              <span>{item.instrument}</span>
              <div className="rep-bar-track" aria-hidden="true">
                <span style={{ width: `${item.percent}%` }} />
              </div>
              <strong>{item.count}</strong>
            </div>
          ))}
        </div>
      </article>

      <article className="rep-stat-card">
        <p className="mono">{t.statusDistribution}</p>
        <div className="rep-status-bars">
          {stats.statusSegments.map((segment) => (
            <span className="rep-status-bar-item" key={segment.status}>
              <strong>{segment.count}</strong>
              <i className="rep-status-bar-track" aria-hidden="true">
                <b
                  className={`rep-status-${segment.status}`}
                  style={{ height: `${stats.total > 0 ? Math.max(8, (segment.count / stats.total) * 100) : 0}%` }}
                />
              </i>
              <small>{shortStatusLabel(segment.status, language)}</small>
            </span>
          ))}
        </div>
      </article>
    </section>
  );
}

function RepertoireFilters({
  language,
  query,
  instrument,
  status,
  sort,
  onQuery,
  onInstrument,
  onStatus,
  onSort,
}: {
  language: Language;
  query: string;
  instrument: "all" | Instrument;
  status: StatusFilter;
  sort: SortMode;
  onQuery: (value: string) => void;
  onInstrument: (value: "all" | Instrument) => void;
  onStatus: (value: StatusFilter) => void;
  onSort: (value: SortMode) => void;
}) {
  const t = translate(language).repertoire;

  return (
    <section className="rep-filters" aria-label={t.filtersLabel}>
      <label className="rep-filter-search">
        <Search size={16} aria-hidden="true" />
        <span className="sr-only">{t.searchFilterLabel}</span>
        <input
          value={query}
          placeholder={t.searchFilterPlaceholder}
          onChange={(event) => onQuery(event.target.value)}
        />
      </label>

      <label className="rep-filter-field">
        <span className="mono">{t.instrumentFilter}</span>
        <select value={instrument} onChange={(event) => onInstrument(event.target.value as "all" | Instrument)}>
          <option value="all">{t.allInstruments}</option>
          {INSTRUMENTS.map((item) => <option value={item} key={item}>{item}</option>)}
        </select>
      </label>

      <label className="rep-filter-field">
        <span className="mono">{t.statusFilter}</span>
        <select value={status} onChange={(event) => onStatus(event.target.value as StatusFilter)}>
          <option value="all">{t.allStatuses}</option>
          <option value="learning">{t.proficiency_learning}</option>
          <option value="practicing">{t.proficiency_practicing}</option>
          <option value="ready">{t.proficiency_ready}</option>
        </select>
      </label>

      <label className="rep-filter-field">
        <span className="mono">{t.sortLabel}</span>
        <select value={sort} onChange={(event) => onSort(event.target.value as SortMode)}>
          <option value="recent">{t.sortRecent}</option>
          <option value="title">{t.sortTitle}</option>
          <option value="artist">{t.sortArtist}</option>
          <option value="status">{t.sortStatus}</option>
        </select>
      </label>
    </section>
  );
}

function RepertoirePagination({
  language,
  page,
  pageCount,
  total,
  onPage,
}: {
  language: Language;
  page: number;
  pageCount: number;
  total: number;
  onPage: (page: number) => void;
}) {
  const t = translate(language).repertoire;
  if (total <= PAGE_SIZE) return null;

  return (
    <nav className="rep-pagination" aria-label={t.paginationLabel}>
      <button type="button" className="ghost-button" disabled={page === 1} onClick={() => onPage(page - 1)}>
        <ChevronLeft size={14} aria-hidden="true" /> {t.previous}
      </button>
      <span className="mono">{t.pageLabel.replace("{page}", String(page)).replace("{pages}", String(pageCount))}</span>
      <button type="button" className="ghost-button" disabled={page === pageCount} onClick={() => onPage(page + 1)}>
        {t.next} <ChevronRight size={14} aria-hidden="true" />
      </button>
    </nav>
  );
}

function getRepertoireStats(entries: Entry[]) {
  const now = Date.now();
  const recentWindowMs = RECENT_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const instrumentCounts = new Map<string, number>();
  const statusCounts: Record<ProficiencyLevel, number> = { learning: 0, practicing: 0, ready: 0 };
  let recent15 = 0;

  for (const entry of entries) {
    const createdAt = Date.parse(entry.createdAt);
    if (!Number.isNaN(createdAt) && now - createdAt <= recentWindowMs) recent15 += 1;
    statusCounts[entry.proficiency] += 1;
    const instrument = safeInstrument(entry.instrument);
    instrumentCounts.set(instrument, (instrumentCounts.get(instrument) ?? 0) + 1);
  }

  const topCount = Math.max(...instrumentCounts.values(), 1);
  const topInstruments = [...instrumentCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 3)
    .map(([instrument, count]) => ({ instrument, count, percent: (count / topCount) * 100 }));

  return {
    total: entries.length,
    recent15,
    topInstruments,
    statusSegments: [
      { status: "learning" as const, count: statusCounts.learning },
      { status: "practicing" as const, count: statusCounts.practicing },
      { status: "ready" as const, count: statusCounts.ready },
    ],
  };
}

function sortEntries(entries: Entry[], sort: SortMode) {
  const sorted = [...entries];
  if (sort === "title") return sorted.sort((a, b) => a.songTitle.localeCompare(b.songTitle));
  if (sort === "artist") return sorted.sort((a, b) => a.songArtist.localeCompare(b.songArtist));
  if (sort === "status") return sorted.sort((a, b) => statusRank(a.proficiency) - statusRank(b.proficiency) || a.songTitle.localeCompare(b.songTitle));
  return sorted
    .map((entry, index) => ({ entry, index, time: Date.parse(entry.createdAt) }))
    .sort((a, b) => {
      const aTime = Number.isNaN(a.time) ? -Infinity : a.time;
      const bTime = Number.isNaN(b.time) ? -Infinity : b.time;
      if (aTime === bTime) return a.index - b.index;
      return bTime - aTime;
    })
    .map(({ entry }) => entry);
}

function statusRank(status: ProficiencyLevel) {
  if (status === "learning") return 0;
  if (status === "practicing") return 1;
  return 2;
}

function shortStatusLabel(status: ProficiencyLevel, language: Language) {
  const t = translate(language).home;
  if (status === "learning") return t.learning;
  if (status === "practicing") return t.practicing;
  return t.ready;
}

function safeInstrument(instrument: string | null | undefined) {
  return instrument?.trim() || "Unknown";
}

function hasActiveFilters(query: string, instrument: "all" | Instrument, status: StatusFilter) {
  return Boolean(query.trim()) || instrument !== "all" || status !== "all";
}
