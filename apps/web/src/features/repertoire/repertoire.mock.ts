import type { Entry, Instrument, ProficiencyLevel, SearchResult } from "./types";
import type { AddOrUpdateResult, SearchPage } from "./api/repertoire.api";

const MOCK_SEARCH_RESULTS: SearchResult[] = [
  {
    externalId: "mock-1",
    title: "Wonderwall",
    artist: "Oasis",
    albumTitle: "(What's the Story) Morning Glory?",
    releaseYear: 1995,
    coverUrl: null,
  },
  {
    externalId: "mock-2",
    title: "Hey Jude",
    artist: "The Beatles",
    albumTitle: "Hey Jude",
    releaseYear: 1968,
    coverUrl: null,
  },
  {
    externalId: "mock-3",
    title: "Trem Bala",
    artist: "Ana Vilela",
    albumTitle: "Trem Bala",
    releaseYear: 2017,
    coverUrl: null,
  },
];

let mockEntries: Entry[] = [];
let nextId = 1;

function makeId() {
  return `mock-entry-${nextId++}`;
}

export async function mockSearchSongs(q: string, _page = 1): Promise<SearchPage> {
  const lower = q.toLowerCase();
  const results = MOCK_SEARCH_RESULTS.filter(
    (r) =>
      r.title.toLowerCase().includes(lower) ||
      r.artist.toLowerCase().includes(lower),
  );
  return { results, page: 1, hasMore: false };
}

export async function mockListEntries(): Promise<Entry[]> {
  return [...mockEntries];
}

export async function mockAddOrUpdateEntry(payload: {
  songExternalId: string;
  songTitle: string;
  songArtist: string;
  songAlbumTitle: string | null;
  songReleaseYear: number | null;
  songCoverUrl: string | null;
  instrument: Instrument;
  proficiency: ProficiencyLevel;
}): Promise<AddOrUpdateResult> {
  const existing = mockEntries.find(
    (e) =>
      e.songExternalId === payload.songExternalId &&
      e.instrument === payload.instrument,
  );
  if (existing) {
    existing.proficiency = payload.proficiency;
    existing.updatedAt = new Date().toISOString();
    return { entry: { ...existing }, action: "updated" };
  }
  const now = new Date().toISOString();
  const entry: Entry = {
    id: makeId(),
    songExternalId: payload.songExternalId,
    songTitle: payload.songTitle,
    songArtist: payload.songArtist,
    songAlbumTitle: payload.songAlbumTitle,
    songReleaseYear: payload.songReleaseYear,
    songCoverUrl: payload.songCoverUrl,
    instrument: payload.instrument,
    proficiency: payload.proficiency,
    createdAt: now,
    updatedAt: now,
  };
  mockEntries.push(entry);
  return { entry, action: "created" };
}

export async function mockUpdateProficiency(id: string, proficiency: ProficiencyLevel): Promise<Entry> {
  const entry = mockEntries.find((e) => e.id === id);
  if (!entry) throw new Error("Entry not found");
  entry.proficiency = proficiency;
  entry.updatedAt = new Date().toISOString();
  return { ...entry };
}

export async function mockRemoveEntry(id: string): Promise<void> {
  mockEntries = mockEntries.filter((e) => e.id !== id);
}
