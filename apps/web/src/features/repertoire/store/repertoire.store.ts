import { useCallback, useEffect, useRef, useState } from "react";
import type { Entry, Instrument, ProficiencyLevel, SearchResult } from "../types";
import type { AddOrUpdateResult, SearchPage } from "../api/repertoire.api";

const IS_MOCK = import.meta.env.VITE_API_URL === "mock://repertoire";

async function resolveApi() {
  if (IS_MOCK) {
    const m = await import("../repertoire.mock");
    return {
      searchSongs: m.mockSearchSongs,
      listEntries: m.mockListEntries,
      addOrUpdateEntry: m.mockAddOrUpdateEntry,
      updateProficiency: m.mockUpdateProficiency,
      removeEntry: m.mockRemoveEntry,
    };
  }
  const a = await import("../api/repertoire.api");
  return {
    searchSongs: a.searchSongs,
    listEntries: a.listEntries,
    addOrUpdateEntry: a.addOrUpdateEntry,
    updateProficiency: a.updateProficiency,
    removeEntry: a.removeEntry,
  };
}

export type SearchState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "results"; results: SearchResult[]; hasMore: boolean }
  | { kind: "empty" }
  | { kind: "unavailable" }
  | { kind: "rate_limited" };

export type Toast =
  | { kind: "added"; title: string; instrument: Instrument; proficiency: ProficiencyLevel }
  | { kind: "updated"; title: string }
  | { kind: "removed"; title: string }
  | { kind: "error"; message: string };

export function useRepertoireStore() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchState, setSearchState] = useState<SearchState>({ kind: "idle" });
  const [toast, setToast] = useState<Toast | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(t: Toast) {
    setToast(t);
    if (toastRef.current) clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => setToast(null), 3500);
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    resolveApi().then((api) =>
      api.listEntries().then((list) => {
        if (!cancelled) {
          setEntries(list);
          setLoading(false);
        }
      }),
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const search = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim() || q.trim().length < 2) {
      setSearchState({ kind: "idle" });
      return;
    }
    setSearchState({ kind: "loading" });
    debounceRef.current = setTimeout(async () => {
      try {
        const api = await resolveApi();
        const page: SearchPage = await api.searchSongs(q.trim());
        if (page.results.length === 0) {
          setSearchState({ kind: "empty" });
        } else {
          setSearchState({ kind: "results", results: page.results, hasMore: page.hasMore });
        }
      } catch (err: unknown) {
        const status = (err as { status?: number })?.status;
        if (status === 429) {
          setSearchState({ kind: "rate_limited" });
        } else {
          setSearchState({ kind: "unavailable" });
        }
      }
    }, 300);
  }, []);

  const clearSearch = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSearchState({ kind: "idle" });
  }, []);

  const addOrUpdate = useCallback(
    async (payload: {
      songExternalId: string;
      songTitle: string;
      songArtist: string;
      songAlbumTitle: string | null;
      songReleaseYear: number | null;
      songCoverUrl: string | null;
      instrument: Instrument;
      proficiency: ProficiencyLevel;
    }): Promise<AddOrUpdateResult> => {
      const api = await resolveApi();
      const result = await api.addOrUpdateEntry(payload);
      if (result.action === "created") {
        setEntries((prev) => [result.entry, ...prev]);
        showToast({ kind: "added", title: result.entry.songTitle, instrument: result.entry.instrument, proficiency: result.entry.proficiency });
      } else {
        setEntries((prev) => prev.map((e) => (e.id === result.entry.id ? result.entry : e)));
        showToast({ kind: "updated", title: result.entry.songTitle });
      }
      return result;
    },
    [],
  );

  const updateProficiency = useCallback(async (id: string, proficiency: ProficiencyLevel) => {
    const api = await resolveApi();
    const updated = await api.updateProficiency(id, proficiency);
    setEntries((prev) => prev.map((e) => (e.id === id ? updated : e)));
    showToast({ kind: "updated", title: updated.songTitle });
  }, []);

  const removeEntry = useCallback(async (id: string, title: string) => {
    const api = await resolveApi();
    await api.removeEntry(id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
    showToast({ kind: "removed", title });
  }, []);

  const dismissToast = useCallback(() => {
    if (toastRef.current) clearTimeout(toastRef.current);
    setToast(null);
  }, []);

  return {
    entries,
    loading,
    searchState,
    toast,
    search,
    clearSearch,
    addOrUpdate,
    updateProficiency,
    removeEntry,
    dismissToast,
  };
}
