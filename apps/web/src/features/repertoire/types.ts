export type ProficiencyLevel = "learning" | "practicing" | "ready";

export type Instrument =
  | "Acoustic Guitar"
  | "Electric Guitar"
  | "Bass"
  | "Drums"
  | "Piano / Keys"
  | "Vocals"
  | "Violin"
  | "Ukulele"
  | "Cajón"
  | "Flute"
  | "Other";

export type SearchResult = {
  externalId: string;
  title: string;
  artist: string;
  albumTitle: string | null;
  releaseYear: number | null;
  coverUrl: string | null;
};

export type Entry = {
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

export type RepertoireAction = "created" | "updated";
