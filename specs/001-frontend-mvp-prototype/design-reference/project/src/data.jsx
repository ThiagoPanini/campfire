// Mock data for the Campfire prototype

const FRIENDS = [
  { name: "Helena", instrument: "Violão", online: true, ready: true },
  { name: "Rafael", instrument: "Baixo", online: true, ready: true },
  { name: "Juno", instrument: "Cajón", online: true, ready: false },
  { name: "Marco", instrument: "Gaita", online: false, ready: false },
  { name: "Alex", instrument: "Voz", online: true, ready: true },
];

const SONGS_LIB = [
  { id: 1, title: "Redemption Song", artist: "Bob Marley", key: "G", bpm: 76, duration: "3:47", genre: "Reggae", capable: 4 },
  { id: 2, title: "Samba da Bênção", artist: "Baden Powell", key: "Am", bpm: 112, duration: "4:20", genre: "MPB", capable: 3 },
  { id: 3, title: "Wish You Were Here", artist: "Pink Floyd", key: "G", bpm: 60, duration: "5:34", genre: "Rock", capable: 5 },
  { id: 4, title: "Construção", artist: "Chico Buarque", key: "Dm", bpm: 72, duration: "6:23", genre: "MPB", capable: 2 },
  { id: 5, title: "Hallelujah", artist: "Leonard Cohen", key: "C", bpm: 60, duration: "4:36", genre: "Folk", capable: 5 },
  { id: 6, title: "Mas Que Nada", artist: "Jorge Ben", key: "Am", bpm: 124, duration: "2:35", genre: "Samba", capable: 3 },
  { id: 7, title: "Ain't No Sunshine", artist: "Bill Withers", key: "Am", bpm: 72, duration: "2:04", genre: "Soul", capable: 4 },
  { id: 8, title: "Garota de Ipanema", artist: "Tom Jobim", key: "F", bpm: 118, duration: "3:15", genre: "Bossa", capable: 5 },
  { id: 9, title: "Creep", artist: "Radiohead", key: "G", bpm: 92, duration: "3:58", genre: "Rock", capable: 4 },
  { id: 10, title: "Trem Bala", artist: "Ana Vilela", key: "G", bpm: 88, duration: "3:48", genre: "Pop", capable: 3 },
];

const SETLIST_TONIGHT = [
  { id: 8, title: "Garota de Ipanema", artist: "Tom Jobim", key: "F", duration: "3:15", status: "ready" },
  { id: 3, title: "Wish You Were Here", artist: "Pink Floyd", key: "G", duration: "5:34", status: "ready" },
  { id: 1, title: "Redemption Song", artist: "Bob Marley", key: "G", duration: "3:47", status: "learning" },
];

const JAM_HISTORY = [
  { date: "Last Friday", sessionLabel: "Friday session", attendees: 4, songs: 9, highlights: ["Garota de Ipanema", "Wish You Were Here", "Hallelujah"] },
  { date: "Two weeks ago", sessionLabel: "Backyard jam", attendees: 5, songs: 12, highlights: ["Samba da Bênção", "Mas Que Nada"] },
  { date: "April 3", sessionLabel: "Rainy afternoon", attendees: 3, songs: 6, highlights: ["Construção", "Hallelujah"] },
  { date: "March 21", sessionLabel: "Helena's birthday", attendees: 6, songs: 14, highlights: ["Trem Bala", "Redemption Song", "Ain't No Sunshine"] },
];

const USER_CAPABILITIES = [
  { song: "Wish You Were Here", artist: "Pink Floyd", instrument: "Acoustic guitar", proficiency: "lead" },
  { song: "Wish You Were Here", artist: "Pink Floyd", instrument: "Vocals", proficiency: "solid" },
  { song: "Garota de Ipanema", artist: "Tom Jobim", instrument: "Acoustic guitar", proficiency: "solid" },
  { song: "Hallelujah", artist: "Leonard Cohen", instrument: "Acoustic guitar", proficiency: "lead" },
  { song: "Hallelujah", artist: "Leonard Cohen", instrument: "Piano", proficiency: "learning" },
  { song: "Redemption Song", artist: "Bob Marley", instrument: "Acoustic guitar", proficiency: "solid" },
  { song: "Samba da Bênção", artist: "Baden Powell", instrument: "Acoustic guitar", proficiency: "learning" },
  { song: "Creep", artist: "Radiohead", instrument: "Acoustic guitar", proficiency: "lead" },
  { song: "Creep", artist: "Radiohead", instrument: "Vocals", proficiency: "solid" },
  { song: "Ain't No Sunshine", artist: "Bill Withers", instrument: "Vocals", proficiency: "solid" },
  { song: "Mas Que Nada", artist: "Jorge Ben", instrument: "Cajón", proficiency: "learning" },
  { song: "Trem Bala", artist: "Ana Vilela", instrument: "Acoustic guitar", proficiency: "solid" },
];

const INSTRUMENTS_CATALOG = [
  { id: "acoustic-guitar", label: { en: "Acoustic Guitar", pt: "Violão" }, icon: "guitar" },
  { id: "electric-guitar", label: { en: "Electric Guitar", pt: "Guitarra" }, icon: "guitar" },
  { id: "bass", label: { en: "Bass", pt: "Baixo" }, icon: "guitar" },
  { id: "vocals", label: { en: "Vocals", pt: "Voz" }, icon: "mic" },
  { id: "piano", label: { en: "Piano / Keys", pt: "Teclado" }, icon: "piano" },
  { id: "cajon", label: { en: "Cajón", pt: "Cajón" }, icon: "drum" },
  { id: "drums", label: { en: "Drums", pt: "Bateria" }, icon: "drum" },
  { id: "harmonica", label: { en: "Harmonica", pt: "Gaita" }, icon: "mic" },
  { id: "ukulele", label: { en: "Ukulele", pt: "Ukulele" }, icon: "guitar" },
  { id: "violin", label: { en: "Violin", pt: "Violino" }, icon: "guitar" },
];

const GENRES_CATALOG = [
  { id: "mpb", label: { en: "MPB", pt: "MPB" } },
  { id: "bossa", label: { en: "Bossa Nova", pt: "Bossa Nova" } },
  { id: "samba", label: { en: "Samba", pt: "Samba" } },
  { id: "rock", label: { en: "Rock", pt: "Rock" } },
  { id: "folk", label: { en: "Folk", pt: "Folk" } },
  { id: "indie", label: { en: "Indie", pt: "Indie" } },
  { id: "reggae", label: { en: "Reggae", pt: "Reggae" } },
  { id: "soul", label: { en: "Soul", pt: "Soul" } },
  { id: "jazz", label: { en: "Jazz", pt: "Jazz" } },
  { id: "blues", label: { en: "Blues", pt: "Blues" } },
  { id: "pop", label: { en: "Pop", pt: "Pop" } },
  { id: "hiphop", label: { en: "Hip-hop", pt: "Hip-hop" } },
];

Object.assign(window, {
  FRIENDS, SONGS_LIB, SETLIST_TONIGHT, JAM_HISTORY,
  USER_CAPABILITIES, INSTRUMENTS_CATALOG, GENRES_CATALOG,
});
