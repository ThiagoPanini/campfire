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
  status: SongStatus;
  note?: string;
};

type SongStatus = "quero aprender" | "aprendendo" | "pronta pra tocar";

type SongFormValues = {
  title: string;
  artist: string;
  instrument: string;
  status: SongStatus;
  note: string;
};

type SongFormErrors = Partial<Record<"title" | "artist" | "instrument", string>>;

type SongModalState =
  | { mode: "add" }
  | { mode: "edit"; song: Song };

const CONSOLE_VIDEO_SRC = `${import.meta.env.BASE_URL}lofi-office.mp4`;
const CONSOLE_REPERTOIRE_VIDEO_SRC = `${import.meta.env.BASE_URL}lofi-office-scene02.mp4`;

const SONG_STATUS_OPTIONS: SongStatus[] = [
  "quero aprender",
  "aprendendo",
  "pronta pra tocar",
];

const INSTRUMENT_OPTIONS = [
  "violão",
  "voz",
  "baixo",
  "cavaco",
  "guitarra",
  "teclado",
  "bateria",
  "outro",
];

const initialUiSongs: Song[] = [
  {
    id: "song-velha-infancia",
    title: "velha infância",
    artist: "tribalistas",
    instrument: "violão",
    status: "pronta pra tocar",
    note: "boa para abrir a roda sem pressa",
  },
  {
    id: "song-mutante",
    title: "mutante",
    artist: "rita lee",
    instrument: "voz",
    status: "aprendendo",
  },
  {
    id: "song-trem-das-onze",
    title: "trem das onze",
    artist: "ademiran barbosa",
    instrument: "cavaco",
    status: "quero aprender",
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

function formatTrackIndex(index: number) {
  return String(index + 1).padStart(2, "0");
}

function songValues(song?: Song): SongFormValues {
  return {
    title: song?.title ?? "",
    artist: song?.artist ?? "",
    instrument: song?.instrument ?? "",
    status: song?.status ?? "aprendendo",
    note: song?.note ?? "",
  };
}

function ConsoleBackground() {
  const baseVideoRef = useRef<HTMLVideoElement | null>(null);
  const repertoireVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");

    const syncVideoMotion = () => {
      const videos = [baseVideoRef.current, repertoireVideoRef.current].filter(
        (video): video is HTMLVideoElement => Boolean(video),
      );

      for (const video of videos) {
        if (motionPreference.matches) {
          video.pause();
        } else {
          void video.play().catch(() => {});
        }
      }
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
        ref={baseVideoRef}
        className="console__bg-video console__bg-video--base"
        autoPlay
        muted
        loop
        playsInline
      >
        <source src={CONSOLE_VIDEO_SRC} type="video/mp4" />
      </video>
      <video
        ref={repertoireVideoRef}
        className="console__bg-video console__bg-video--repertoire"
        autoPlay
        muted
        loop
        playsInline
      >
        <source src={CONSOLE_REPERTOIRE_VIDEO_SRC} type="video/mp4" />
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
  onRepertoireNavigate: () => void;
};

function Sidebar({
  initials,
  username,
  email,
  onLogout,
  onRepertoireNavigate,
}: SidebarProps) {
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
        índice da fita
      </p>

      <nav className="console-nav" aria-label="principal">
        <NavLink className={appNavLinkClassName} end to="/app">
          <span className="console-nav__track" aria-hidden="true">01</span>
          <span className="console-nav__icon" aria-hidden="true">
            <IconHome />
          </span>
          <span className="console-nav__label">início</span>
        </NavLink>

        <NavLink
          className={appNavLinkClassName}
          onClick={onRepertoireNavigate}
          to="/app/repertorio"
        >
          <span className="console-nav__track" aria-hidden="true">02</span>
          <span className="console-nav__icon" aria-hidden="true">
            <IconShelf />
          </span>
          <span className="console-nav__label">repertório</span>
        </NavLink>

        <span
          className="console-nav__link console-nav__link--disabled"
          aria-disabled="true"
        >
          <span className="console-nav__track" aria-hidden="true">03</span>
          <span className="console-nav__icon" aria-hidden="true">
            <IconJams />
          </span>
          <span className="console-nav__label">jams</span>
          <small className="console-nav__pill">em breve</small>
        </span>

        <NavLink className={appNavLinkClassName} to="/app/perfil">
          <span className="console-nav__track" aria-hidden="true">04</span>
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
  onRepertoireNavigate: () => void;
  username: string;
};

function ConsoleHome({ onRepertoireNavigate, username }: ConsoleHomeProps) {
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

        <NavLink
          to="/app/repertorio"
          className="console-home__cta"
          onClick={onRepertoireNavigate}
        >
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
  editedSongId?: string | null;
  highlightedSongId?: string | null;
  onAddSong: () => void;
  onCancelRemove: () => void;
  onConfirmRemove: (songId: string) => void;
  onEditSong: (song: Song) => void;
  onRequestRemove: (songId: string) => void;
  onToggleScene: () => void;
  pendingRemoveId?: string | null;
  sceneEnabled: boolean;
  songs: Song[];
  statusMessage: string;
};

function RepertoirePage({
  editedSongId,
  highlightedSongId,
  onAddSong,
  onCancelRemove,
  onConfirmRemove,
  onEditSong,
  onRequestRemove,
  onToggleScene,
  pendingRemoveId,
  sceneEnabled,
  songs,
  statusMessage,
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
        <div className="repertoire__header-actions">
          <button
            type="button"
            className="repertoire__scene-toggle"
            role="switch"
            aria-checked={sceneEnabled}
            onClick={onToggleScene}
          >
            <span aria-hidden="true" className="repertoire__scene-toggle-mark" />
            <span>cena {sceneEnabled ? "ligada" : "desligada"}</span>
          </button>
          <Button onClick={onAddSong} type="button">
            adicionar música
          </Button>
        </div>
      </header>

      {songs.length > 0 ? (
        <ul className="repertoire-list" aria-label="músicas do repertório">
          {songs.map((song, index) => (
            <RepertoireRow
              edited={editedSongId === song.id}
              highlighted={highlightedSongId === song.id}
              index={index}
              isConfirmingRemoval={pendingRemoveId === song.id}
              key={song.id}
              onCancelRemove={onCancelRemove}
              onConfirmRemove={() => onConfirmRemove(song.id)}
              onEditSong={() => onEditSong(song)}
              onRequestRemove={() => onRequestRemove(song.id)}
              song={song}
            />
          ))}
        </ul>
      ) : (
        <ShelfEmptyState onAddSong={onAddSong} />
      )}

      <p className="repertoire__status" aria-live="polite" role="status">
        {statusMessage}
      </p>
    </section>
  );
}

type RepertoireRowProps = {
  edited: boolean;
  highlighted: boolean;
  index: number;
  isConfirmingRemoval: boolean;
  onCancelRemove: () => void;
  onConfirmRemove: () => void;
  onEditSong: () => void;
  onRequestRemove: () => void;
  song: Song;
};

function RepertoireRow({
  edited,
  highlighted,
  index,
  isConfirmingRemoval,
  onCancelRemove,
  onConfirmRemove,
  onEditSong,
  onRequestRemove,
  song,
}: RepertoireRowProps) {
  const rowClassName = [
    "repertoire-row",
    highlighted ? "repertoire-row--new" : "",
    edited ? "repertoire-row--edited" : "",
    isConfirmingRemoval ? "repertoire-row--confirming" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <li className={rowClassName}>
      <div className="repertoire-row__index" aria-hidden="true">
        faixa {formatTrackIndex(index)}
      </div>

      <div className="repertoire-row__body">
        <h2 className="repertoire-row__title">{song.title}</h2>
        <div className="repertoire-row__meta" aria-label="detalhes da música">
          <span className="repertoire-row__stamp">
            <span>artista</span>
            {song.artist}
          </span>
          <span className="repertoire-row__stamp">
            <span>instrumento</span>
            {song.instrument}
          </span>
          <span className="repertoire-row__stamp">
            <span>status</span>
            {song.status}
          </span>
        </div>
        {song.note ? (
          <p className="repertoire-row__note">
            <span>anotação pessoal</span>
            {song.note}
          </p>
        ) : null}
      </div>

      <div className="repertoire-row__actions" aria-label={`ações de ${song.title}`}>
        {isConfirmingRemoval ? (
          <>
            <p className="repertoire-row__confirm" role="alert">
              remover da prateleira?
            </p>
            <Button
              className="repertoire-row__action"
              onClick={onCancelRemove}
              type="button"
              variant="ghost"
            >
              não
            </Button>
            <Button
              className="repertoire-row__action repertoire-row__action--danger"
              onClick={onConfirmRemove}
              type="button"
              variant="ghost"
            >
              remover
            </Button>
          </>
        ) : (
          <>
            <Button
              className="repertoire-row__action"
              onClick={onEditSong}
              type="button"
              variant="ghost"
            >
              editar
            </Button>
            <Button
              className="repertoire-row__action repertoire-row__action--danger"
              onClick={onRequestRemove}
              type="button"
              variant="ghost"
            >
              remover
            </Button>
          </>
        )}
      </div>
    </li>
  );
}

type ShelfEmptyStateProps = {
  onAddSong: () => void;
};

function ShelfEmptyState({ onAddSong }: ShelfEmptyStateProps) {
  return (
    <div className="shelf-empty">
      <div className="shelf-empty__slots" aria-hidden="true">
        {Array.from({ length: 4 }, (_, index) => (
          <span className="shelf-empty__slot" key={index}>
            <i>{formatTrackIndex(index)}</i>
          </span>
        ))}
      </div>
      <div className="shelf-empty__copy">
        <h2>sua prateleira ainda está quieta</h2>
        <p>guarde a primeira música quando ela pedir um lugar seu.</p>
        <Button onClick={onAddSong} type="button">
          guardar primeira música
        </Button>
      </div>
    </div>
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

  const updateValue = <FieldName extends keyof SongFormValues>(
    field: FieldName,
    value: SongFormValues[FieldName],
  ) => {
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
      closeOnBackdrop={false}
      onClose={onClose}
    >
      <section className="song-form" aria-labelledby="song-modal-title">
        <header className="song-form__header">
          <p className="song-form__eyebrow">ficha da prateleira</p>
          <h2 className="song-form__title" id="song-modal-title">
            {title}
          </h2>
          <p>salvo nesta sessão por enquanto.</p>
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
          <div className={`field${errors.instrument ? " field--error" : ""}`}>
            <span className="field__header">
              <label className="field__label" htmlFor="song-instrument-field">
                instrumento
              </label>
            </span>
            <select
              className="field__input song-form__select"
              id="song-instrument-field"
              aria-invalid={errors.instrument ? true : undefined}
              aria-describedby={errors.instrument ? "song-instrument-field-error" : undefined}
              onChange={(event) => updateValue("instrument", event.target.value)}
              value={values.instrument}
            >
              <option value="">escolha instrumento</option>
              {INSTRUMENT_OPTIONS.map((instrument) => (
                <option key={instrument} value={instrument}>
                  {instrument}
                </option>
              ))}
            </select>
            {errors.instrument ? (
              <span className="field__error" id="song-instrument-field-error">
                {errors.instrument}
              </span>
            ) : null}
          </div>
          <div className="field">
            <span className="field__header">
              <label className="field__label" htmlFor="song-status-field">
                status
              </label>
            </span>
            <select
              className="field__input song-form__select"
              id="song-status-field"
              onChange={(event) => updateValue("status", event.target.value as SongStatus)}
              value={values.status}
            >
              {SONG_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          <Field
            autoComplete="off"
            inputId="song-note-field"
            label="observação"
            multiline
            onChange={(event) => updateValue("note", event.target.value)}
            placeholder="tom, memória, cuidado"
            rows={3}
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
  const [highlightedSongId, setHighlightedSongId] = useState<string | null>(null);
  const [editedSongId, setEditedSongId] = useState<string | null>(null);
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [isTurningToRepertoire, setIsTurningToRepertoire] = useState(false);
  const [repertoireSceneEnabled, setRepertoireSceneEnabled] = useState(true);
  const repertoireTurnTimeoutRef = useRef<number | null>(null);

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

  useEffect(() => {
    return () => {
      if (repertoireTurnTimeoutRef.current) {
        window.clearTimeout(repertoireTurnTimeoutRef.current);
      }
    };
  }, []);

  const openAddSong = () => {
    setPendingRemoveId(null);
    setModal({ mode: "add" });
  };

  const closeModal = () => {
    setModal(null);
  };

  const handleLogout = () => {
    clearSession();
    navigate("/");
  };

  const startRepertoireTurn = () => {
    if (location.pathname !== "/app" || !repertoireSceneEnabled) {
      return;
    }

    setIsTurningToRepertoire(true);

    if (repertoireTurnTimeoutRef.current) {
      window.clearTimeout(repertoireTurnTimeoutRef.current);
    }

    repertoireTurnTimeoutRef.current = window.setTimeout(() => {
      setIsTurningToRepertoire(false);
      repertoireTurnTimeoutRef.current = null;
    }, 980);
  };

  const saveSong = (values: SongFormValues) => {
    const existingModal = modal;
    const nextSong = {
      title: values.title.trim(),
      artist: values.artist.trim(),
      instrument: values.instrument.trim(),
      status: values.status,
      note: values.note.trim() || undefined,
    };

    if (existingModal?.mode === "edit") {
      setSongs((current) => {
        return current.map((song) =>
          song.id === existingModal.song.id ? { ...nextSong, id: song.id } : song,
        );
      });
      setEditedSongId(existingModal.song.id);
      setStatusMessage("música atualizada.");
      window.setTimeout(() => setEditedSongId(null), 500);
    } else {
      const id = newSongId();
      setSongs((current) => [{ ...nextSong, id }, ...current]);
      setHighlightedSongId(id);
      setStatusMessage("música guardada.");
      window.setTimeout(() => setHighlightedSongId(null), 700);
    }

    setPendingRemoveId(null);
    setModal(null);

    if (location.pathname === "/app") {
      navigate("/app/repertorio");
    }
  };

  const requestRemoveSong = (songId: string) => {
    setPendingRemoveId(songId);
    setStatusMessage("confirme antes de remover.");
  };

  const cancelRemoveSong = () => {
    setPendingRemoveId(null);
    setStatusMessage("remoção cancelada.");
  };

  const confirmRemoveSong = (songId: string) => {
    setSongs((current) => current.filter((song) => song.id !== songId));
    setPendingRemoveId(null);
    setStatusMessage("música removida.");
  };

  const mainClassName = [
    "console__main",
    location.pathname === "/app" ? "console__main--home" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const consoleClassName = [
    "console",
    location.pathname === "/app" && !modal ? "" : "console--quiet",
    location.pathname === "/app/repertorio" && repertoireSceneEnabled
      ? "console--repertoire-scene"
      : "",
    isTurningToRepertoire ? "console--turning-to-repertoire" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={consoleClassName}>
      <ConsoleBackground />

      <Sidebar
        initials={initials}
        username={user.username}
        email={user.email}
        onLogout={handleLogout}
        onRepertoireNavigate={startRepertoireTurn}
      />

      <main className={mainClassName}>
        <div className="console__content">
          <Routes>
            <Route
              index
              element={
                <ConsoleHome
                  onRepertoireNavigate={startRepertoireTurn}
                  username={user.username}
                />
              }
            />
            <Route
              path="repertorio"
              element={
                <RepertoirePage
                  editedSongId={editedSongId}
                  highlightedSongId={highlightedSongId}
                  onAddSong={openAddSong}
                  onCancelRemove={cancelRemoveSong}
                  onConfirmRemove={confirmRemoveSong}
                  onEditSong={(song) => {
                    setPendingRemoveId(null);
                    setModal({ mode: "edit", song });
                  }}
                  onRequestRemove={requestRemoveSong}
                  onToggleScene={() =>
                    setRepertoireSceneEnabled((current) => !current)
                  }
                  pendingRemoveId={pendingRemoveId}
                  sceneEnabled={repertoireSceneEnabled}
                  songs={songs}
                  statusMessage={statusMessage}
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
