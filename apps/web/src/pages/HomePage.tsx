import { useMemo, type ReactNode } from "react";
import { Link, Music2, Sparkles, Users } from "lucide-react";
import type { MockUser } from "@features/auth";
import { useRepertoireStore, type Entry } from "@features/repertoire";
import { translate, type Language } from "@i18n";
import { AccentButton, GhostButton } from "@shared/ui";

type Props = {
  language: Language;
  user: MockUser;
  onRepertoire: () => void;
  onAddSong: () => void;
};

type HomeStats = {
  total: number;
  recent7: number;
  ready: number;
  practicing: number;
  learning: number;
  latest: Entry | null;
};

export function HomePage({ language, user, onRepertoire, onAddSong }: Props) {
  const t = translate(language).home;
  const store = useRepertoireStore();

  const stats = useMemo(() => {
    const now = Date.now();
    const weekMs = 7 * 24 * 60 * 60 * 1000;

    const sorted = [...store.entries].sort((a, b) => {
      const aTime = Date.parse(a.createdAt);
      const bTime = Date.parse(b.createdAt);
      if (Number.isNaN(aTime) || Number.isNaN(bTime)) return 0;
      return bTime - aTime;
    });

    return sorted.reduce<HomeStats>(
      (acc, entry, idx) => {
        const createdAt = Date.parse(entry.createdAt);
        if (!Number.isNaN(createdAt) && now - createdAt <= weekMs) acc.recent7 += 1;
        if (entry.proficiency === "ready") acc.ready += 1;
        if (entry.proficiency === "practicing") acc.practicing += 1;
        if (entry.proficiency === "learning") acc.learning += 1;
        if (idx === 0) acc.latest = entry;
        return acc;
      },
      { total: sorted.length, recent7: 0, ready: 0, practicing: 0, learning: 0, latest: null },
    );
  }, [store.entries]);

  const totalForBar = Math.max(stats.total, 1);

  return (
    <main className="page">
      <section className="home-control fade-up">
        <p className="mono home-kicker">{t.kicker}</p>
        <h1 className="display home-title">{t.controlTitle}</h1>
        <p className="home-copy">{t.sub}</p>
        <div className="home-cta-row">
          <AccentButton onClick={onAddSong}>{t.addSongs}</AccentButton>
          <GhostButton onClick={onRepertoire}>{t.openRepertoire}</GhostButton>
          <button className="ghost-button home-soon" aria-disabled="true" type="button">{t.jamSoon}</button>
        </div>
      </section>

      <section className="home-status-card">
        <div className="home-status-head">
          <p className="mono">{t.statusKicker}</p>
          <button className="link-button" onClick={onRepertoire}>{t.openRepertoire}</button>
        </div>

        <div className="home-status-grid">
          <article className="home-tile">
            <p className="mono">{t.totalSongs}</p>
            <p className="home-tile-num">{String(stats.total).padStart(2, "0")}</p>
            <p className="muted">{stats.total === 1 ? t.songSingular : t.songPlural}</p>
          </article>

          <article className="home-tile">
            <p className="mono">{t.last7}</p>
            <p className="home-tile-num">{String(stats.recent7).padStart(2, "0")}</p>
          </article>

          <article className="home-tile home-status-by">
            <p className="mono">{t.byStatus}</p>
            <div className="home-status-split">
              <span>{t.ready}: {stats.ready}</span>
              <span>{t.practicing}: {stats.practicing}</span>
              <span>{t.learning}: {stats.learning}</span>
            </div>
            <div className="home-bar">
              <div style={{ width: `${(stats.ready / totalForBar) * 100}%` }} className="home-bar-ready" />
              <div style={{ width: `${(stats.practicing / totalForBar) * 100}%` }} className="home-bar-practicing" />
              <div style={{ width: `${(stats.learning / totalForBar) * 100}%` }} className="home-bar-learning" />
            </div>
          </article>
        </div>
      </section>

      <section className="home-last">
        <div className="home-last-head">
          <h2 className="display home-last-title">{t.youAddedLast}</h2>
        </div>

        {store.loading ? (
          <p className="muted">{t.loadingRepertoire}</p>
        ) : stats.latest ? (
          <article className="home-last-card">
            <div>
              <p className="home-song-title">{stats.latest.songTitle}</p>
              <p className="muted">{stats.latest.songArtist} · {stats.latest.instrument}</p>
              <p className="muted">{t.addedLabel} {relativeAge(stats.latest.createdAt, language)}</p>
            </div>
            <div className="home-last-actions">
              <GhostButton onClick={onRepertoire}>{t.openEntry}</GhostButton>
              <AccentButton onClick={onRepertoire}>{t.editEntry}</AccentButton>
            </div>
          </article>
        ) : (
          <article className="home-empty-card">
            <p className="display">{t.emptyTitle}</p>
            <p className="muted">{t.emptyCopy}</p>
            <AccentButton onClick={onAddSong}>{t.addFirstSong}</AccentButton>
          </article>
        )}
      </section>

      <section className="home-future">
        <p className="mono">{t.comingTitle}</p>
        <div className="home-future-grid">
          <FutureTile icon={<Music2 size={16} />} label={t.futureJam} />
          <FutureTile icon={<Users size={16} />} label={t.futureSetlists} />
          <FutureTile icon={<Sparkles size={16} />} label={t.futureQueue} />
          <FutureTile icon={<Link size={16} />} label={t.futureMembers} />
        </div>
      </section>

      <footer className="home-account muted">
        <span>{user.email}</span>
      </footer>
    </main>
  );
}

function FutureTile({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="home-future-tile" aria-disabled="true">
      <div className="home-future-icon">{icon}</div>
      <span>{label}</span>
      <span className="mono">SOON</span>
    </div>
  );
}

function relativeAge(isoDate: string, language: Language): string {
  const date = Date.parse(isoDate);
  if (Number.isNaN(date)) return "-";
  const diffMs = Date.now() - date;
  const days = Math.max(0, Math.floor(diffMs / (24 * 60 * 60 * 1000)));
  if (days === 0) return language === "pt" ? "hoje" : "today";
  if (days === 1) return language === "pt" ? "1 dia" : "1 day";
  return language === "pt" ? `${days} dias` : `${days} days`;
}
