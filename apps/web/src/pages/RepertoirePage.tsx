import { useState } from "react";
import type { Language } from "@i18n";
import {
  useRepertoireStore,
  AddSongModal,
  RepertoireList,
  RemoveEntryDialog,
  RepertoireToast,
  type SearchResult,
} from "@features/repertoire";
import type { Instrument, ProficiencyLevel } from "@features/repertoire";

type Props = {
  language: Language;
};

type PendingRemove = {
  id: string;
  title: string;
};

export function RepertoirePage({ language }: Props) {
  const store = useRepertoireStore();
  const [showAdd, setShowAdd] = useState(false);
  const [pendingRemove, setPendingRemove] = useState<PendingRemove | null>(null);

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

  async function handleConfirmRemove(id: string, title: string) {
    await store.removeEntry(id, title);
    setPendingRemove(null);
  }

  return (
    <main className="page">
      <section className="rep-lane">
        <RepertoireList
          entries={store.entries}
          language={language}
          loading={store.loading}
          onAddSong={() => setShowAdd(true)}
          onUpdateProficiency={store.updateProficiency}
          onRemove={(id, title) => setPendingRemove({ id, title })}
        />
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
