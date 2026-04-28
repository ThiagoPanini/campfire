import { useMemo, useState } from "react";
import { ArrowRight, BarChart3, Clock3, ListMusic, Music2, Plus, Sparkles, Target } from "lucide-react";
import {
  AddSongModal,
  RepertoireToast,
  useRepertoireStore,
  type Entry,
  type Instrument,
  type ProficiencyLevel,
  type SearchResult,
} from "@features/repertoire";
import { translate, type Language } from "@i18n";
import { AccentButton } from "@shared/ui";
import { FireIcon } from "@shared/icons/FireIcon";

type Props = {
  language: Language;
  onRepertoire: () => void;
};

type RepertoirePreview = {
  latest: Entry | null;
  recent: Entry[];
};

export function HomePage({ language, onRepertoire }: Props) {
  const t = translate(language).home;
  const store = useRepertoireStore();
  const [showAdd, setShowAdd] = useState(false);

  const preview = useMemo<RepertoirePreview>(() => {
    const sorted = sortByNewest(store.entries);
    return {
      latest: sorted[0] ?? null,
      recent: sorted.slice(0, 5),
    };
  }, [store.entries]);

  async function handleSave(result: SearchResult, instrument: Instrument, proficiency: ProficiencyLevel) {
    await store.addOrUpdate({
      songExternalId: result.externalId,
      songTitle: result.title,
      songArtist: result.artist,
      songAlbumTitle: result.albumTitle,
      songReleaseYear: result.releaseYear,
      songCoverUrl: result.coverUrl,
      instrument,
      proficiency,
    });
  }

  return (
    <>
      <main className="page">
        <section className="home-control fade-up">
          <p className="mono home-kicker">{t.kicker}</p>
          <h1 className="display home-title">{t.controlTitle}</h1>
          <p className="home-copy">{t.sub}</p>
        </section>

        <section className="home-repertoire-block" aria-labelledby="home-repertoire-heading">
          {store.loading ? (
            <article className="home-preview-loading">
              <span className="rep-spinner" aria-hidden="true" />
              <p className="muted">{t.loadingRepertoire}</p>
            </article>
          ) : preview.latest ? (
            <>
              <div className="home-feature-head">
                <p className="mono home-feature-kicker" id="home-repertoire-heading">{t.statusKicker}</p>
                <button className="link-button home-feature-link" type="button" onClick={onRepertoire}>
                  {t.openRepertoire} <ArrowRight size={13} aria-hidden="true" />
                </button>
              </div>

              <div className="home-repertoire-grid">
                <RecentlyAddedSongsCard entries={preview.recent} language={language} onRepertoire={onRepertoire} />
                <LastAddedSongHighlightCard entry={preview.latest} language={language} onRepertoire={onRepertoire} />
              </div>
            </>
          ) : (
            <HomeEmptyRepertoire language={language} onAddSong={() => setShowAdd(true)} />
          )}
        </section>

        <HomeComingSoon language={language} />
      </main>

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

      {store.toast && (
        <RepertoireToast
          toast={store.toast}
          language={language}
          onDismiss={store.dismissToast}
        />
      )}
    </>
  );
}

function RecentlyAddedSongsCard({ entries, language, onRepertoire }: { entries: Entry[]; language: Language; onRepertoire: () => void }) {
  const t = translate(language).home;

  return (
    <article className="home-recent-card">
      <div className="home-card-head">
        <div>
          <p className="mono">{t.recentlyAdded}</p>
          <p className="home-card-sub">{t.recentlyAddedSub}</p>
        </div>
        <span className="home-count-pill">{entries.length}/5</span>
      </div>

      <div className="home-recent-list">
        {entries.map((entry, index) => (
          <button className="home-recent-row" type="button" key={entry.id} onClick={onRepertoire}>
            <span className="home-recent-rank mono">{String(index + 1).padStart(2, "0")}</span>
            <SongCover entry={entry} />
            <span className="home-recent-main">
              <span className="home-recent-title">{entry.songTitle}</span>
              <span className="home-recent-sub">{entry.songArtist} · {safeInstrument(entry.instrument)}</span>
            </span>
            <span className="home-recent-meta mono">{relativeAge(entry.createdAt, language)}</span>
          </button>
        ))}
      </div>
    </article>
  );
}

function LastAddedSongHighlightCard({ entry, language, onRepertoire }: { entry: Entry; language: Language; onRepertoire: () => void }) {
  const t = translate(language).home;

  return (
    <article className="home-latest-card">
      <div className="home-latest-glow" aria-hidden="true" />
      <div className="home-latest-top">
        <span className="home-latest-icon"><Music2 size={18} aria-hidden="true" /></span>
        <span className="mono">{t.latestSong}</span>
      </div>

      <div>
        <p className="display home-latest-title">{entry.songTitle}</p>
        <p className="home-latest-artist">{entry.songArtist}</p>
      </div>

      <div className="home-latest-details">
        <SongFact label={t.instrument} value={safeInstrument(entry.instrument)} />
        <SongFact label={t.status} value={statusLabel(entry.proficiency, language)} />
        <SongFact label={t.added} value={relativeAge(entry.createdAt, language)} />
      </div>

      <button className="home-latest-action" type="button" onClick={onRepertoire}>
        {t.openRepertoire} <ArrowRight size={13} aria-hidden="true" />
      </button>
    </article>
  );
}

function HomeEmptyRepertoire({
  language,
  onAddSong,
}: {
  language: Language;
  onAddSong: () => void;
}) {
  const t = translate(language).home;

  return (
    <article className="home-empty-repertoire">
      <p className="mono home-feature-kicker" id="home-repertoire-heading">{t.statusKicker}</p>
      <h2 className="display home-empty-title">{t.emptyTitle}</h2>
      <p className="home-empty-copy">{t.emptyCopy}</p>
      <div className="home-empty-actions">
        <AccentButton onClick={onAddSong}>
          <Plus size={14} aria-hidden="true" /> {t.addFirstSong}
        </AccentButton>
      </div>
      <div className="home-empty-illus">
        <div className="home-empty-fire"><FireIcon size={38} /></div>
        <p className="mono">{t.starterIdeas}</p>
        <p>{t.starterIdeasHint}</p>
      </div>
    </article>
  );
}

function HomeComingSoon({ language }: { language: Language }) {
  const t = translate(language).home;
  const items = [
    { icon: <Target size={16} aria-hidden="true" />, title: t.futurePracticeGoals, copy: t.futurePracticeGoalsCopy },
    { icon: <ListMusic size={16} aria-hidden="true" />, title: t.futureSetlistBuilder, copy: t.futureSetlistBuilderCopy },
    { icon: <BarChart3 size={16} aria-hidden="true" />, title: t.futureProgressInsights, copy: t.futureProgressInsightsCopy },
    { icon: <Sparkles size={16} aria-hidden="true" />, title: t.futureRecommendations, copy: t.futureRecommendationsCopy },
  ];

  return (
    <section className="home-coming" aria-labelledby="home-coming-heading">
      <p className="mono home-feature-kicker" id="home-coming-heading">{t.comingTitle}</p>
      <div className="home-coming-grid">
        {items.map((item) => (
          <article className="home-coming-card" key={item.title}>
            <span className="home-coming-icon">{item.icon}</span>
            <div>
              <h3>{item.title}</h3>
              <p>{item.copy}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function SongCover({ entry }: { entry: Entry }) {
  return (
    <span className="home-song-cover">
      {entry.songCoverUrl ? (
        <img src={entry.songCoverUrl} alt="" onError={(e) => { e.currentTarget.style.display = "none"; }} />
      ) : (
        <Clock3 size={16} aria-hidden="true" />
      )}
    </span>
  );
}

function SongFact({ label, value }: { label: string; value: string }) {
  return (
    <span className="home-song-fact">
      <span className="mono">{label}</span>
      <strong>{value}</strong>
    </span>
  );
}

function sortByNewest(entries: Entry[]) {
  return entries
    .map((entry, index) => ({ entry, index, time: Date.parse(entry.createdAt) }))
    .sort((a, b) => {
      const aTime = Number.isNaN(a.time) ? -Infinity : a.time;
      const bTime = Number.isNaN(b.time) ? -Infinity : b.time;
      if (aTime === bTime) return a.index - b.index;
      return bTime - aTime;
    })
    .map(({ entry }) => entry);
}

function safeInstrument(instrument: string | null | undefined) {
  return instrument?.trim() || "Unknown";
}

function statusLabel(status: ProficiencyLevel, language: Language) {
  const t = translate(language).home;
  if (status === "ready") return t.ready;
  if (status === "practicing") return t.practicing;
  return t.learning;
}

function relativeAge(isoDate: string, language: Language): string {
  const date = Date.parse(isoDate);
  if (Number.isNaN(date)) return language === "pt" ? "sem data" : "undated";
  const diffMs = Date.now() - date;
  const days = Math.max(0, Math.floor(diffMs / (24 * 60 * 60 * 1000)));
  if (days === 0) return language === "pt" ? "hoje" : "today";
  if (days === 1) return language === "pt" ? "1 dia" : "1 day";
  return language === "pt" ? `${days} dias` : `${days} days`;
}
