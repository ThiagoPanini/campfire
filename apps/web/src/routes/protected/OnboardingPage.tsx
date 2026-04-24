import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import {
  AccentButton,
  DesignGlobalStyles,
  GhostButton,
  MonoLabel,
  Nav,
  pageBaseStyle,
} from "../../design/primitives";
import { ACCENT, FONT_DISPLAY } from "../../design/tokens";
import { getSession } from "../../features/auth/session";
import { deferOnboarding, getPreferences, savePreferences } from "../../features/preferences/api";

const INSTRUMENTS = [
  "Guitar", "Bass", "Drums", "Piano / Keys", "Vocals", "Violin",
  "Cavaquinho", "Ukulele", "Cajon", "Mandolin", "Flute", "Other",
];

const GENRES = [
  "Rock", "MPB", "Samba", "Jazz", "Forro", "Bossa Nova",
  "Pop", "Blues", "Country", "Metal", "Reggae", "Funk", "Other",
];

const CONTEXTS = [
  { id: "friends", label: "Roda de amigos", icon: "🫂" },
  { id: "amateur", label: "Banda amadora", icon: "🎸" },
  { id: "pro", label: "Banda profissional", icon: "🎤" },
  { id: "solo", label: "Prática solo", icon: "🎧" },
  { id: "church", label: "Grupo de louvor", icon: "🙏" },
  { id: "sessions", label: "Sessões / Jam sessions", icon: "🔥" },
] as const;

const GOALS = [
  "Learn new songs faster",
  "Track my full repertoire",
  "Share my set with the group",
  "Prepare for jam sessions",
  "Practice more consistently",
  "Know what I can already play",
];

const EXPERIENCE = [
  { id: "beginner", label: "Beginner", sub: "Less than 1 year" },
  { id: "learning", label: "Learning", sub: "1–3 years" },
  { id: "intermediate", label: "Intermediate", sub: "3–7 years" },
  { id: "advanced", label: "Advanced", sub: "7+ years" },
] as const;

function toggle<T>(arr: T[], value: T): T[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

function Chip({
  label,
  selected,
  onToggle,
}: {
  label: string;
  selected: boolean;
  onToggle: () => void;
}): JSX.Element {
  return (
    <button
      type="button"
      onClick={onToggle}
      style={{
        padding: "8px 16px",
        borderRadius: 40,
        background: selected ? ACCENT : "#1e1e1e",
        color: selected ? "#000" : "#888",
        border: `1px solid ${selected ? ACCENT : "#2e2e2e"}`,
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: 13,
        fontWeight: selected ? 600 : 400,
        cursor: "pointer",
        transition: "all 0.15s ease",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }): JSX.Element {
  return (
    <div style={{ marginBottom: 36 }}>
      <MonoLabel size={10} color={ACCENT} style={{ display: "block", marginBottom: 16 }}>
        {title}
      </MonoLabel>
      {children}
    </div>
  );
}

export function OnboardingPage(): JSX.Element {
  const navigate = useNavigate();
  const [instruments, setInstruments] = useState<string[]>([]);
  const [genres, setGenres] = useState<string[]>([]);
  const [context, setContext] = useState<string>("");
  const [goals, setGoals] = useState<string[]>([]);
  const [xp, setXp] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const session = getSession();
    if (!session) return;
    void getPreferences(session.accessToken)
      .then((stored) => {
        setInstruments(stored.instruments);
        setGenres(stored.genres);
        setContext(stored.playContext ?? "");
        setGoals(stored.goals);
        setXp(stored.experienceLevel ?? "");
      })
      .catch(() => undefined);
  }, []);

  const submit = async (): Promise<void> => {
    const session = getSession();
    if (!session) {
      navigate("/signin", { replace: true });
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await savePreferences(session.accessToken, {
        instruments,
        genres,
        playContext: context || null,
        goals,
        experienceLevel: xp || null,
      });
      navigate("/app", { replace: true });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save preferences.");
    } finally {
      setSubmitting(false);
    }
  };

  const skip = async (): Promise<void> => {
    const session = getSession();
    if (!session) {
      navigate("/signin", { replace: true });
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await deferOnboarding(session.accessToken);
      navigate("/app", { replace: true });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not defer onboarding.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main style={pageBaseStyle}>
      <DesignGlobalStyles />
      <Nav />

      <div
        className="cf-fade-up"
        style={{
          maxWidth: 640,
          margin: "0 auto",
          width: "100%",
          padding:
            "clamp(80px, 14vw, 120px) clamp(24px, 5vw, 48px) clamp(60px, 8vw, 80px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <div style={{ width: 24, height: 1, background: ACCENT }} />
          <MonoLabel size={10} color={ACCENT}>
            STEP 2 OF 2
          </MonoLabel>
        </div>

        <h2
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: "clamp(36px, 7vw, 56px)",
            lineHeight: 0.93,
            letterSpacing: "0.03em",
            color: "#fff",
            marginBottom: 14,
            fontWeight: 400,
          }}
        >
          ONE LAST THING
        </h2>
        <p
          style={{
            fontSize: 15,
            fontWeight: 300,
            color: "#666",
            lineHeight: 1.6,
            marginBottom: 48,
          }}
        >
          Help Campfire understand how you play. You can always update this later.
        </p>

        <Section title="WHICH INSTRUMENTS DO YOU PLAY?">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {INSTRUMENTS.map((instrument) => (
              <Chip
                key={instrument}
                label={instrument}
                selected={instruments.includes(instrument)}
                onToggle={() => setInstruments(toggle(instruments, instrument))}
              />
            ))}
          </div>
        </Section>

        <Section title="YOUR FAVOURITE GENRES">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {GENRES.map((genre) => (
              <Chip
                key={genre}
                label={genre}
                selected={genres.includes(genre)}
                onToggle={() => setGenres(toggle(genres, genre))}
              />
            ))}
          </div>
        </Section>

        <Section title="WHERE DO YOU USUALLY PLAY?">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: 8,
            }}
          >
            {CONTEXTS.map((c) => {
              const selected = context === c.id;
              return (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setContext(c.id)}
                  style={{
                    padding: "14px 16px",
                    borderRadius: 10,
                    textAlign: "left",
                    background: selected ? `${ACCENT}22` : "#1a1a1a",
                    border: `1px solid ${selected ? ACCENT : "#2a2a2a"}`,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <span style={{ fontSize: 18 }}>{c.icon}</span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: selected ? "#fff" : "#777",
                    }}
                  >
                    {c.label}
                  </span>
                </button>
              );
            })}
          </div>
        </Section>

        <Section title="WHAT DO YOU WANT FROM CAMPFIRE?">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {GOALS.map((goal) => (
              <Chip
                key={goal}
                label={goal}
                selected={goals.includes(goal)}
                onToggle={() => setGoals(toggle(goals, goal))}
              />
            ))}
          </div>
        </Section>

        <Section title="HOW LONG HAVE YOU BEEN PLAYING?">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
              gap: 8,
            }}
          >
            {EXPERIENCE.map((option) => {
              const selected = xp === option.id;
              return (
                <button
                  type="button"
                  key={option.id}
                  onClick={() => setXp(option.id)}
                  style={{
                    padding: "12px 16px",
                    borderRadius: 10,
                    textAlign: "left",
                    background: selected ? `${ACCENT}22` : "#1a1a1a",
                    border: `1px solid ${selected ? ACCENT : "#2a2a2a"}`,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    display: "flex",
                    flexDirection: "column",
                    gap: 3,
                  }}
                >
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: selected ? "#fff" : "#888",
                    }}
                  >
                    {option.label}
                  </span>
                  <span style={{ fontSize: 11, color: "#555" }}>{option.sub}</span>
                </button>
              );
            })}
          </div>
        </Section>

        {error && (
          <p style={{ color: "#FF6B6B", fontSize: 13, marginBottom: 16 }}>{error}</p>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 14, paddingTop: 8, flexWrap: "wrap" }}>
          <AccentButton size="lg" onClick={() => void submit()} disabled={submitting}>
            {submitting ? "SAVING…" : "START TRACKING"}
          </AccentButton>
          <GhostButton onClick={() => void skip()}>SKIP FOR NOW</GhostButton>
        </div>
      </div>
    </main>
  );
}
