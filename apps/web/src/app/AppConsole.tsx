import { useEffect, useMemo, useState, useRef, type FormEvent } from "react";
import {
  Navigate,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { clearSession, deriveInitials, useSession } from "../auth/session";
import { Brand } from "../ui/Brand";
import { Button } from "../ui/Button";
import { Field } from "../ui/Field";
import { Modal } from "../ui/Modal";
import {
  IconCassette,
  IconExit,
  IconHome,
  IconJams,
  IconShelf,
  IconUser,
} from "./Icons";
import { Perfil } from "./Perfil";
import "./AppConsole.css";

type Song = {
  id: string;
  title: string;
  artist: string;
  instrument: string;
  note?: string;
};

type SongFormValues = {
  title: string;
  artist: string;
  instrument: string;
  note: string;
};

type SongFormErrors = Partial<Record<"title" | "artist" | "instrument", string>>;

type SongModalState =
  | { mode: "add" }
  | { mode: "edit"; song: Song };

const CONSOLE_VIDEO_SRC = `${import.meta.env.BASE_URL}lofi-office.mp4`;

const initialUiSongs: Song[] = [
  {
    id: "song-velha-infancia",
    title: "velha infância",
    artist: "tribalistas",
    instrument: "violão",
    note: "boa para abrir a roda sem pressa",
  },
  {
    id: "song-mutante",
    title: "mutante",
    artist: "rita lee",
    instrument: "voz",
  },
  {
    id: "song-trem-das-onze",
    title: "trem das onze",
    artist: "ademiran barbosa",
    instrument: "cavaco",
    note: "lembrar o tom antes da próxima jam",
  },
];

function appNavLinkClassName({ isActive }: { isActive: boolean }) {
  return [
    "console-nav__link",
    isActive ? "console-nav__link--active" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function newSongId() {
  return `song-${Date.now().toString(36)}`;
}

function validateSong(values: SongFormValues): SongFormErrors {
  return {
    title: values.title.trim() ? undefined : "informe a música",
    artist: values.artist.trim() ? undefined : "informe o artista",
    instrument: values.instrument.trim() ? undefined : "informe o instrumento",
  };
}

function hasErrors(errors: SongFormErrors) {
  return Boolean(errors.title || errors.artist || errors.instrument);
}

function songValues(song?: Song): SongFormValues {
  return {
    title: song?.title ?? "",
    artist: song?.artist ?? "",
    instrument: song?.instrument ?? "",
    note: song?.note ?? "",
  };
}

function ConsoleBackground() {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");

    const syncVideoMotion = () => {
      const video = videoRef.current;
      if (!video) return;
      if (motionPreference.matches) {
        video.pause();
        return;
      }
      void video.play().catch(() => {});
    };

    syncVideoMotion();
    motionPreference.addEventListener("change", syncVideoMotion);

    return () => {
      motionPreference.removeEventListener("change", syncVideoMotion);
    };
  }, []);

  return (
    <div className="console__bg" aria-hidden="true">
      <video
        ref={videoRef}
        className="console__bg-video"
        autoPlay
        muted
        loop
        playsInline
      >
        <source src={CONSOLE_VIDEO_SRC} type="video/mp4" />
      </video>
      <div className="console__bg-scrim" />
      <div className="console__bg-vignette" />
    </div>
  );
}

type SidebarProps = {
  initials: string;
  username: string;
  email: string;
  onLogout: () => void;
};

function Sidebar({ initials, username, email, onLogout }: SidebarProps) {
  return (
    <aside className="console__sidebar" aria-label="navegação do app">
      <div className="console__brandline">
        <Brand to="/app" />
        <span className="console__alpha" aria-label="versão alpha">
          alpha
        </span>
      </div>
      <hr className="console__brandrule" aria-hidden="true" />

      <NavLink
        to="/app/perfil"
        className="console__profile"
        aria-label={`perfil de ${username}`}
      >
        <span className="console__profile-avatar" aria-hidden="true">
          <span className="console__profile-glyph">{initials}</span>
        </span>
        <span className="console__profile-text">
          <span className="console__profile-name">{username || "convidado"}</span>
          <span className="console__profile-email">{email}</span>
        </span>
      </NavLink>

      <p className="console-nav__eyebrow" aria-hidden="true">
        navegação
      </p>

      <nav className="console-nav" aria-label="principal">
        <NavLink className={appNavLinkClassName} end to="/app">
          <span className="console-nav__icon" aria-hidden="true">
            <IconHome />
          </span>
          <span className="console-nav__label">início</span>
        </NavLink>

        <NavLink className={appNavLinkClassName} to="/app/repertorio">
          <span className="console-nav__icon" aria-hidden="true">
            <IconShelf />
          </span>
          <span className="console-nav__label">repertório</span>
        </NavLink>

        <span
          className="console-nav__link console-nav__link--disabled"
          aria-disabled="true"
        >
          <span className="console-nav__icon" aria-hidden="true">
            <IconJams />
          </span>
          <span className="console-nav__label">jams</span>
          <small className="console-nav__pill">em breve</small>
        </span>

        <NavLink className={appNavLinkClassName} to="/app/perfil">
          <span className="console-nav__icon" aria-hidden="true">
            <IconUser />
          </span>
          <span className="console-nav__label">perfil</span>
        </NavLink>
      </nav>

      <div className="console__sidebar-spacer" aria-hidden="true" />

      <div className="console__sidebar-foot">
        <button
          type="button"
          className="console__signout"
          onClick={onLogout}
        >
          <span className="console__signout-icon" aria-hidden="true">
            <IconExit />
          </span>
          <span>sair</span>
        </button>
      </div>
    </aside>
  );
}

type ConsoleHomeProps = {
  username: string;
};

function ConsoleHome({ username }: ConsoleHomeProps) {
  const greeting = username ? `bem-vindo, ${username}.` : "bem-vindo de volta.";

  return (
    <section className="console-home" aria-labelledby="console-home-title">
      <div className="console-home__stage">
        <p className="console-home__kicker">
          <span>lado a</span>
          <span className="console-home__kicker-dot" aria-hidden="true">·</span>
          <span>faixa 01</span>
        </p>

        <h1 className="console-home__title" id="console-home-title">
          {greeting}
        </h1>

        <p className="console-home__sub">
          o que você toca quando ninguém pede — é isso que mora aqui.
        </p>

        <div className="console-home__tape" aria-hidden="true">
          <IconCassette className="console-home__tape-glyph" />
          <span className="console-home__tape-line" />
        </div>

        <NavLink to="/app/repertorio" className="console-home__cta">
          <span className="console-home__cta-label">abrir o repertório</span>
          <span className="console-home__cta-arrow" aria-hidden="true">
            <svg
              width="32"
              height="10"
              viewBox="0 0 32 10"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M0 5 H30" />
              <path d="M24 1 L30 5 L24 9" />
            </svg>
          </span>
        </NavLink>

        <p className="console-home__counter" aria-hidden="true">
          {nowCounter()}
        </p>
      </div>
    </section>
  );
}

function nowCounter() {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `tk · ${pad(now.getHours())} ${pad(now.getMinutes())} ${pad(now.getSeconds())}`;
}

type RepertoirePageProps = {
  onAddSong: () => void;
  onEditSong: (song: Song) => void;
  onRemoveSong: (songId: string) => void;
  songs: Song[];
};

function RepertoirePage({
  onAddSong,
  onEditSong,
  onRemoveSong,
  songs,
}: RepertoirePageProps) {
  return (
    <section className="repertoire" aria-labelledby="repertoire-title">
      <header className="repertoire__header">
        <div>
          <p className="repertoire__kicker">coleção pessoal</p>
          <h1 className="repertoire__title" id="repertoire-title">
            repertório
          </h1>
        </div>
        <Button onClick={onAddSong} type="button">
          adicionar música
        </Button>
      </header>

      {songs.length > 0 ? (
        <ul className="repertoire-list" aria-label="músicas do repertório">
          {songs.map((song) => (
            <li className="repertoire-song" key={song.id}>
              <div className="repertoire-song__content">
                <h2 className="repertoire-song__title">{song.title}</h2>
                <div className="repertoire-song__meta" aria-label="detalhes da música">
                  <span>
                    <b>artista</b>
                    {song.artist}
                  </span>
                  <span>
                    <b>instrumento</b>
                    {song.instrument}
                  </span>
                </div>
                {song.note ? (
                  <p className="repertoire-song__note">nota: {song.note}</p>
                ) : null}
              </div>
              <div className="repertoire-song__actions" aria-label={`ações de ${song.title}`}>
                <Button
                  className="repertoire-song__action"
                  onClick={() => onEditSong(song)}
                  type="button"
                  variant="ghost"
                >
                  editar
                </Button>
                <Button
                  className="repertoire-song__action repertoire-song__action--danger"
                  onClick={() => onRemoveSong(song.id)}
                  type="button"
                  variant="ghost"
                >
                  remover
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="repertoire-empty">
          <h2>seu repertório ainda está quieto</h2>
          <p>adicione a primeira música para começar a montar essa prateleira.</p>
          <Button onClick={onAddSong} type="button">
            adicionar primeira música
          </Button>
        </div>
      )}
    </section>
  );
}

type SongModalProps = {
  modal: SongModalState;
  onClose: () => void;
  onSave: (values: SongFormValues) => void;
};

function SongModal({ modal, onClose, onSave }: SongModalProps) {
  const [values, setValues] = useState(() =>
    songValues(modal.mode === "edit" ? modal.song : undefined),
  );
  const [errors, setErrors] = useState<SongFormErrors>({});
  const title = modal.mode === "edit" ? "editar música" : "adicionar música";

  const updateValue = (field: keyof SongFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    if (field !== "note") {
      setErrors((current) => ({ ...current, [field]: undefined }));
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateSong(values);
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) return;
    onSave(values);
  };

  return (
    <Modal
      ariaLabelledBy="song-modal-title"
      className="song-modal"
      onClose={onClose}
    >
      <section className="song-form" aria-labelledby="song-modal-title">
        <header className="song-form__header">
          <h2 className="song-form__title" id="song-modal-title">
            {title}
          </h2>
          <p>salvo só nesta tela por enquanto.</p>
        </header>

        <form className="song-form__fields" onSubmit={handleSubmit} noValidate>
          <Field
            autoComplete="off"
            autoFocus
            error={errors.title}
            inputId="song-title-field"
            label="música"
            onChange={(event) => updateValue("title", event.target.value)}
            placeholder="nome da música"
            value={values.title}
          />
          <Field
            autoComplete="off"
            error={errors.artist}
            inputId="song-artist-field"
            label="artista"
            onChange={(event) => updateValue("artist", event.target.value)}
            placeholder="quem toca ou compôs"
            value={values.artist}
          />
          <Field
            autoComplete="off"
            error={errors.instrument}
            inputId="song-instrument-field"
            label="instrumento"
            onChange={(event) => updateValue("instrument", event.target.value)}
            placeholder="violão, voz, baixo..."
            value={values.instrument}
          />
          <Field
            autoComplete="off"
            inputId="song-note-field"
            label="observação"
            onChange={(event) => updateValue("note", event.target.value)}
            placeholder="tom, memória, cuidado"
            value={values.note}
          />

          <div className="song-form__actions">
            <Button onClick={onClose} type="button" variant="ghost">
              cancelar
            </Button>
            <Button type="submit">salvar</Button>
          </div>
        </form>
      </section>
    </Modal>
  );
}

export function AppConsole() {
  const location = useLocation();
  const navigate = useNavigate();
  const session = useSession();
  const [songs, setSongs] = useState(initialUiSongs);
  const [modal, setModal] = useState<SongModalState | null>(null);

  const user = useMemo(
    () =>
      session ?? {
        username: "convidado",
        email: "amigo@campfire.local",
        joinedAt: new Date().toISOString(),
      },
    [session],
  );

  const initials = useMemo(
    () => deriveInitials(user.username, user.email),
    [user.username, user.email],
  );

  const instruments = useMemo(() => {
    const seen = new Set<string>();
    for (const song of songs) {
      const trimmed = song.instrument.trim().toLowerCase();
      if (trimmed) seen.add(trimmed);
    }
    return Array.from(seen);
  }, [songs]);

  const openAddSong = () => {
    setModal({ mode: "add" });
  };

  const closeModal = () => {
    setModal(null);
  };

  const handleLogout = () => {
    clearSession();
    navigate("/");
  };

  const saveSong = (values: SongFormValues) => {
    const nextSong = {
      title: values.title.trim(),
      artist: values.artist.trim(),
      instrument: values.instrument.trim(),
      note: values.note.trim() || undefined,
    };

    setSongs((current) => {
      if (modal?.mode === "edit") {
        return current.map((song) =>
          song.id === modal.song.id ? { ...nextSong, id: song.id } : song,
        );
      }
      return [{ ...nextSong, id: newSongId() }, ...current];
    });

    setModal(null);

    if (location.pathname === "/app") {
      navigate("/app/repertorio");
    }
  };

  const mainClassName = [
    "console__main",
    location.pathname === "/app" ? "console__main--home" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="console">
      <ConsoleBackground />

      <Sidebar
        initials={initials}
        username={user.username}
        email={user.email}
        onLogout={handleLogout}
      />

      <main className={mainClassName}>
        <div className="console__content">
          <Routes>
            <Route index element={<ConsoleHome username={user.username} />} />
            <Route
              path="repertorio"
              element={
                <RepertoirePage
                  onAddSong={openAddSong}
                  onEditSong={(song) => setModal({ mode: "edit", song })}
                  onRemoveSong={(songId) =>
                    setSongs((current) => current.filter((song) => song.id !== songId))
                  }
                  songs={songs}
                />
              }
            />
            <Route
              path="perfil"
              element={
                <Perfil
                  user={user}
                  songCount={songs.length}
                  instruments={instruments}
                />
              }
            />
            <Route path="*" element={<Navigate replace to="/app" />} />
          </Routes>
        </div>
      </main>

      {modal ? (
        <SongModal modal={modal} onClose={closeModal} onSave={saveSong} />
      ) : null}
    </div>
  );
}
