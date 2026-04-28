import { request } from "@api/client";
import type { Entry, Instrument, ProficiencyLevel, RepertoireAction, SearchResult } from "../types";

type SearchResultRaw = {
  externalId: string;
  title: string;
  artist: string;
  albumTitle: string | null;
  releaseYear: number | null;
  coverUrl: string | null;
};

type SearchResponseRaw = {
  results: SearchResultRaw[];
  page: number;
  hasMore: boolean;
};

type EntryRaw = {
  id: string;
  songExternalId: string;
  songTitle: string;
  songArtist: string;
  songAlbumTitle: string | null;
  songReleaseYear: number | null;
  songCoverUrl: string | null;
  instrument: Instrument;
  proficiency: ProficiencyLevel;
  createdAt: string;
  updatedAt: string;
};

type EntryListResponseRaw = {
  entries: EntryRaw[];
};

export type SearchPage = {
  results: SearchResult[];
  page: number;
  hasMore: boolean;
};

export type AddOrUpdateResult = {
  entry: Entry;
  action: RepertoireAction;
};

export async function searchSongs(q: string, page = 1): Promise<SearchPage> {
  const params = new URLSearchParams({ q, page: String(page) });
  return request<SearchResponseRaw>(`/repertoire/songs/search?${params}`);
}

export async function listEntries(): Promise<Entry[]> {
  const res = await request<EntryListResponseRaw>("/repertoire/entries");
  return res.entries;
}

export async function addOrUpdateEntry(payload: {
  songExternalId: string;
  songTitle: string;
  songArtist: string;
  songAlbumTitle: string | null;
  songReleaseYear: number | null;
  songCoverUrl: string | null;
  instrument: Instrument;
  proficiency: ProficiencyLevel;
}): Promise<AddOrUpdateResult> {
  const response = await fetch(
    `${import.meta.env.VITE_API_URL ?? "http://localhost:8000"}/repertoire/entries`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${(await import("@api/client")).getAccessToken() ?? ""}`,
      },
      body: JSON.stringify(payload),
    },
  );

  const body = await response.json();
  if (!response.ok) {
    const { ApiError } = await import("@api/client");
    throw new ApiError(response.status, body?.detail?.message ?? body?.message ?? "Request failed");
  }

  const actionHeader = response.headers.get("X-Repertoire-Action");
  const action: RepertoireAction = actionHeader === "updated" ? "updated" : "created";
  return { entry: body as Entry, action };
}

export async function updateProficiency(id: string, proficiency: ProficiencyLevel): Promise<Entry> {
  return request<Entry>(`/repertoire/entries/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ proficiency }),
  });
}

export async function removeEntry(id: string): Promise<void> {
  await request<void>(`/repertoire/entries/${id}`, { method: "DELETE" });
}
