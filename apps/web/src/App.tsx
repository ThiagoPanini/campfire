import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";

type Account = {
  id: string;
  email: string;
  password: string;
  createdAt: number;
};

type Session = {
  userId: string;
  signedInAt: number;
};

type RepertoireEntry = {
  id: string;
  title: string;
  artist: string;
  instrument: string;
  addedAt: number;
};

type AuthMode = "signup" | "signin";
type FieldErrors = Partial<Record<"email" | "password" | "title" | "artist" | "instrument", string>>;

const ACCOUNTS_KEY = "campfire:web:accounts";
const SESSION_KEY = "campfire:web:session";

const INSTRUMENTS = [
  "Acoustic guitar",
  "Electric guitar",
  "Bass guitar",
  "Classical guitar",
  "Piano",
  "Keyboard",
  "Synthesizer",
  "Drums",
  "Cajon",
  "Ukulele",
  "Mandolin",
  "Banjo",
  "Violin",
  "Viola",
  "Cello",
  "Double bass",
  "Vocals",
  "Saxophone",
  "Trumpet",
  "Trombone",
  "Flute",
  "Clarinet",
  "Harmonica",
  "DJ controller",
];

function repertoireKey(userId: string) {
  return `campfire:web:repertoire:${userId}`;
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

function uid() {
  return `${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

function validateAuth(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {};
  if (!email || !email.includes("@")) errors.email = "Enter a valid email.";
  if (!password || password.length < 6) errors.password = "Use at least 6 characters.";
  return errors;
}

function validateEntry(entry: Pick<RepertoireEntry, "title" | "artist" | "instrument">): FieldErrors {
  const errors: FieldErrors = {};
  if (!entry.title.trim()) errors.title = "Title is required.";
  if (!entry.artist.trim()) errors.artist = "Artist is required.";
  if (!entry.instrument.trim()) errors.instrument = "Pick an instrument.";
  return errors;
}

function relativeTime(timestamp: number) {
  const diff = Date.now() - timestamp;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return "just now";
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  if (diff < 30 * day) return `${Math.floor(diff / day)}d ago`;
  return `${Math.floor(diff / (30 * day))}mo ago`;
}

function useClickOutside<T extends HTMLElement>(onClickOutside: () => void) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClickOutside();
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [onClickOutside]);

  return ref;
}

function useCampfire() {
  const [accounts, setAccounts] = useState<Record<string, Account>>(() => readJson(ACCOUNTS_KEY, {}));
  const [session, setSession] = useState<Session | null>(() => readJson(SESSION_KEY, null));
  const account = session ? Object.values(accounts).find((item) => item.id === session.userId) ?? null : null;
  const [entries, setEntries] = useState<RepertoireEntry[]>(() =>
    account ? readJson(repertoireKey(account.id), []) : [],
  );
  const [status, setStatus] = useState<"idle" | "loading">("idle");

  useEffect(() => {
    writeJson(ACCOUNTS_KEY, accounts);
  }, [accounts]);

  useEffect(() => {
    if (session) writeJson(SESSION_KEY, session);
    else localStorage.removeItem(SESSION_KEY);
  }, [session]);

  useEffect(() => {
    if (!account) {
      setEntries([]);
      return;
    }
    setEntries(readJson(repertoireKey(account.id), []));
  }, [account?.id]);

  useEffect(() => {
    if (account) writeJson(repertoireKey(account.id), entries);
  }, [account, entries]);

  async function signUp(email: string, password: string) {
    setStatus("loading");
    await new Promise((resolve) => setTimeout(resolve, 320));
    const normalized = email.trim().toLowerCase();
    if (accounts[normalized]) {
      setStatus("idle");
      return "That email is already in use.";
    }
    const nextAccount = { id: uid(), email: email.trim(), password, createdAt: Date.now() };
    setAccounts((current) => ({ ...current, [normalized]: nextAccount }));
    setSession({ userId: nextAccount.id, signedInAt: Date.now() });
    setEntries([]);
    setStatus("idle");
    return null;
  }

  async function signIn(email: string, password: string) {
    setStatus("loading");
    await new Promise((resolve) => setTimeout(resolve, 280));
    const nextAccount = accounts[email.trim().toLowerCase()];
    if (!nextAccount || nextAccount.password !== password) {
      setStatus("idle");
      return "Wrong email or password.";
    }
    setSession({ userId: nextAccount.id, signedInAt: Date.now() });
    setStatus("idle");
    return null;
  }

  function signOut() {
    setSession(null);
  }

  function addEntry(draft: Pick<RepertoireEntry, "title" | "artist" | "instrument">) {
    setEntries((current) => [{ id: uid(), addedAt: Date.now(), ...draft }, ...current]);
  }

  function updateEntry(id: string, draft: Pick<RepertoireEntry, "title" | "artist" | "instrument">) {
    setEntries((current) => current.map((entry) => (entry.id === id ? { ...entry, ...draft } : entry)));
  }

  function removeEntry(id: string) {
    setEntries((current) => current.filter((entry) => entry.id !== id));
  }

  return {
    account,
    signedIn: Boolean(account && session),
    entries,
    status,
    signUp,
    signIn,
    signOut,
    addEntry,
    updateEntry,
    removeEntry,
  };
}

export function App() {
  const campfire = useCampfire();
  const [authMode, setAuthMode] = useState<AuthMode>("signup");

  if (!campfire.signedIn || !campfire.account) {
    return (
      <AuthScreen
        mode={authMode}
        status={campfire.status}
        onModeChange={setAuthMode}
        onSubmit={(email, password) =>
          authMode === "signup" ? campfire.signUp(email, password) : campfire.signIn(email, password)
        }
      />
    );
  }

  return (
    <RepertoireScreen
      account={campfire.account}
      entries={campfire.entries}
      onSignOut={campfire.signOut}
      onAddEntry={campfire.addEntry}
      onUpdateEntry={campfire.updateEntry}
      onRemoveEntry={campfire.removeEntry}
    />
  );
}

function Wordmark() {
  return (
    <div className="wordmark" aria-label="campfire">
      <span className="wordmark-mark" aria-hidden="true" />
      <span>campfire</span>
    </div>
  );
}

function AuthScreen({
  mode,
  status,
  onModeChange,
  onSubmit,
}: {
  mode: AuthMode;
  status: "idle" | "loading";
  onModeChange: (mode: AuthMode) => void;
  onSubmit: (email: string, password: string) => Promise<string | null>;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    const nextErrors = validateAuth(email, password);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    const error = await onSubmit(email, password);
    setFormError(error);
  }

  function switchMode(nextMode: AuthMode) {
    onModeChange(nextMode);
    setErrors({});
    setFormError(null);
  }

  return (
    <main className="auth-shell">
      <div className="auth-logo">
        <Wordmark />
      </div>
      <section className="auth-card" aria-labelledby="auth-title">
        <p className="eyebrow">{mode === "signup" ? "/account/new" : "/account/session"}</p>
        <h1 id="auth-title">{mode === "signup" ? "Create your account" : "Sign back in"}</h1>

        <div className="auth-tabs" role="tablist" aria-label="Authentication mode">
          <button
            type="button"
            className={mode === "signin" ? "active" : ""}
            onClick={() => switchMode("signin")}
          >
            sign_in
          </button>
          <button
            type="button"
            className={mode === "signup" ? "active" : ""}
            onClick={() => switchMode("signup")}
          >
            sign_up
          </button>
        </div>

        <form onSubmit={submit} noValidate>
          <Field label="email" error={errors.email}>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@yourplace.com"
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
            />
          </Field>

          <Field label="password" error={errors.password}>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder=">= 6 characters"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              aria-invalid={Boolean(errors.password)}
            />
          </Field>

          {formError ? (
            <p className="form-error" role="alert">
              <span aria-hidden="true">! </span>
              {formError}
            </p>
          ) : null}

          <button className="primary-action" type="submit" disabled={status === "loading"}>
            {status === "loading" ? "..." : mode === "signup" ? "create_account()" : "sign_in()"}
          </button>
        </form>
      </section>
      <p className="auth-note">v0.1 · mvp · no password reset · no oauth</p>
    </main>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="field">
      <span>{label}</span>
      {children}
      {error ? <small>{error}</small> : null}
    </div>
  );
}

function RepertoireScreen({
  account,
  entries,
  onSignOut,
  onAddEntry,
  onUpdateEntry,
  onRemoveEntry,
}: {
  account: Account;
  entries: RepertoireEntry[];
  onSignOut: () => void;
  onAddEntry: (entry: Pick<RepertoireEntry, "title" | "artist" | "instrument">) => void;
  onUpdateEntry: (id: string, entry: Pick<RepertoireEntry, "title" | "artist" | "instrument">) => void;
  onRemoveEntry: (id: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<RepertoireEntry | null>(null);

  return (
    <main className="app-shell">
      <TopBar email={account.email} menuOpen={menuOpen} onToggleMenu={setMenuOpen} onSignOut={onSignOut} />

      <section className="repertoire-view" aria-labelledby="repertoire-title">
        <header className="repertoire-header">
          <div>
            <p className="eyebrow">/repertoire</p>
            <h1 id="repertoire-title">repertoire</h1>
          </div>
          <p className="count">
            {String(entries.length).padStart(2, "0")} {entries.length === 1 ? "entry" : "entries"}
          </p>
        </header>

        <p className="lede">What you play, on whatever you play it on. One list. Yours only.</p>

        <div className="add-region">
          {adding ? (
            <EntryForm
              title="+ new_entry"
              submitLabel="commit_entry()"
              onSubmit={(entry) => {
                onAddEntry(entry);
                setAdding(false);
              }}
              onCancel={() => setAdding(false)}
            />
          ) : (
            <button className="add-trigger" type="button" onClick={() => setAdding(true)}>
              + add_song
            </button>
          )}
        </div>

        {entries.length === 0 && !adding ? (
          <EmptyState onAdd={() => setAdding(true)} />
        ) : (
          <RepertoireList
            entries={entries}
            editingId={editingId}
            onEdit={setEditingId}
            onCancelEdit={() => setEditingId(null)}
            onSaveEdit={(id, entry) => {
              onUpdateEntry(id, entry);
              setEditingId(null);
            }}
            onAskDelete={setPendingDelete}
          />
        )}
      </section>

      <ConfirmDialog
        entry={pendingDelete}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (!pendingDelete) return;
          onRemoveEntry(pendingDelete.id);
          setPendingDelete(null);
        }}
      />
    </main>
  );
}

function TopBar({
  email,
  menuOpen,
  onToggleMenu,
  onSignOut,
}: {
  email: string;
  menuOpen: boolean;
  onToggleMenu: (open: boolean) => void;
  onSignOut: () => void;
}) {
  const menuRef = useClickOutside<HTMLDivElement>(() => onToggleMenu(false));

  return (
    <header className="top-bar">
      <Wordmark />
      <div className="account-area" ref={menuRef}>
        <span className="signed-email">{email}</span>
        <button
          className="account-trigger"
          type="button"
          aria-label="Open account menu"
          aria-expanded={menuOpen}
          onClick={() => onToggleMenu(!menuOpen)}
        >
          .....
        </button>
        {menuOpen ? (
          <div className="account-menu">
            <div className="account-menu-head">
              <span>signed in as</span>
              <strong>{email}</strong>
            </div>
            <button type="button" onClick={onSignOut}>
              sign_out()
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}

function EntryForm({
  title,
  initialEntry,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  title: string;
  initialEntry?: Pick<RepertoireEntry, "title" | "artist" | "instrument">;
  submitLabel: string;
  onSubmit: (entry: Pick<RepertoireEntry, "title" | "artist" | "instrument">) => void;
  onCancel: () => void;
}) {
  const [songTitle, setSongTitle] = useState(initialEntry?.title ?? "");
  const [artist, setArtist] = useState(initialEntry?.artist ?? "");
  const [instrument, setInstrument] = useState(initialEntry?.instrument ?? "");
  const [errors, setErrors] = useState<FieldErrors>({});
  const titleInput = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    titleInput.current?.focus();
  }, []);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const draft = {
      title: songTitle.trim(),
      artist: artist.trim(),
      instrument: instrument.trim(),
    };
    const nextErrors = validateEntry(draft);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSubmit(draft);
  }

  return (
    <form className="entry-form" onSubmit={submit} noValidate>
      <p className="entry-form-title">{title}</p>
      <div className="entry-fields">
        <Field label="title" error={errors.title}>
          <input
            ref={titleInput}
            value={songTitle}
            onChange={(event) => setSongTitle(event.target.value)}
            placeholder="Song title"
            aria-invalid={Boolean(errors.title)}
          />
        </Field>
        <Field label="artist" error={errors.artist}>
          <input
            value={artist}
            onChange={(event) => setArtist(event.target.value)}
            placeholder="Artist"
            aria-invalid={Boolean(errors.artist)}
          />
        </Field>
        <Field label="instrument" error={errors.instrument}>
          <InstrumentCombobox value={instrument} onChange={setInstrument} />
        </Field>
      </div>
      <div className="form-actions">
        <button className="secondary-action" type="button" onClick={onCancel}>
          cancel
        </button>
        <button className="primary-action compact" type="submit">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

function InstrumentCombobox({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const wrapperRef = useClickOutside<HTMLDivElement>(() => {
    setOpen(false);
    setQuery("");
  });

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return INSTRUMENTS;
    return INSTRUMENTS.filter((instrument) => instrument.toLowerCase().includes(needle));
  }, [query]);

  function choose(nextValue: string) {
    onChange(nextValue);
    setQuery("");
    setActiveIndex(0);
    setOpen(false);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) => Math.min(current + 1, Math.max(filtered.length - 1, 0)));
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));
    }
    if (event.key === "Enter" && open && filtered[activeIndex]) {
      event.preventDefault();
      choose(filtered[activeIndex]);
    }
    if (event.key === "Escape") {
      setOpen(false);
      setQuery("");
    }
  }

  return (
    <div className="combo" ref={wrapperRef}>
      <input
        value={open ? query : value}
        onFocus={() => {
          setOpen(true);
          setQuery("");
        }}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
          setActiveIndex(0);
        }}
        onKeyDown={onKeyDown}
        placeholder="-"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
      />
      {open ? (
        <div className="combo-list" role="listbox">
          {filtered.length > 0 ? (
            filtered.map((instrument, index) => (
              <button
                type="button"
                role="option"
                aria-selected={instrument === value}
                className={index === activeIndex ? "active" : ""}
                key={instrument}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => choose(instrument)}
              >
                {instrument}
              </button>
            ))
          ) : (
            <p>No instrument found.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="empty-state">
      <span className="empty-mark" aria-hidden="true" />
      <h2>Your repertoire is empty.</h2>
      <p>Add the first song you play.</p>
      <button className="primary-action compact" type="button" onClick={onAdd}>
        add_song()
      </button>
    </div>
  );
}

function RepertoireList({
  entries,
  editingId,
  onEdit,
  onCancelEdit,
  onSaveEdit,
  onAskDelete,
}: {
  entries: RepertoireEntry[];
  editingId: string | null;
  onEdit: (id: string) => void;
  onCancelEdit: () => void;
  onSaveEdit: (id: string, entry: Pick<RepertoireEntry, "title" | "artist" | "instrument">) => void;
  onAskDelete: (entry: RepertoireEntry) => void;
}) {
  return (
    <div className="repertoire-list">
      <div className="list-head">
        <span>#</span>
        <span>title</span>
        <span>artist</span>
        <span>instrument</span>
        <span>added</span>
        <span />
      </div>
      {entries.map((entry, index) => (
        <EntryRow
          entry={entry}
          index={index}
          isEditing={editingId === entry.id}
          key={entry.id}
          onEdit={() => onEdit(entry.id)}
          onCancelEdit={onCancelEdit}
          onSaveEdit={(draft) => onSaveEdit(entry.id, draft)}
          onAskDelete={() => onAskDelete(entry)}
        />
      ))}
    </div>
  );
}

function EntryRow({
  entry,
  index,
  isEditing,
  onEdit,
  onCancelEdit,
  onSaveEdit,
  onAskDelete,
}: {
  entry: RepertoireEntry;
  index: number;
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: (entry: Pick<RepertoireEntry, "title" | "artist" | "instrument">) => void;
  onAskDelete: () => void;
}) {
  if (isEditing) {
    return (
      <div className="editing-row">
        <span className="row-index">{String(index + 1).padStart(2, "0")}</span>
        <EntryForm
          title="edit_entry"
          initialEntry={entry}
          submitLabel="save"
          onSubmit={onSaveEdit}
          onCancel={onCancelEdit}
        />
      </div>
    );
  }

  return (
    <article className="entry-row">
      <span className="row-index">{String(index + 1).padStart(2, "0")}</span>
      <strong>{entry.title}</strong>
      <span>{entry.artist}</span>
      <span className="mono-data">{entry.instrument}</span>
      <span className="mono-data">{relativeTime(entry.addedAt)}</span>
      <div className="entry-actions">
        <button type="button" onClick={onEdit}>
          edit
        </button>
        <button type="button" className="destructive" onClick={onAskDelete}>
          remove
        </button>
      </div>
    </article>
  );
}

function ConfirmDialog({
  entry,
  onCancel,
  onConfirm,
}: {
  entry: RepertoireEntry | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!entry) return null;

  return (
    <div className="dialog-backdrop" role="presentation">
      <section className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
        <p className="eyebrow">confirm_delete</p>
        <h2 id="confirm-title">Remove this song?</h2>
        <div className="delete-preview">
          <strong>{entry.title}</strong>
          <span>{entry.artist}</span>
          <span>{entry.instrument}</span>
        </div>
        <div className="form-actions">
          <button className="secondary-action" type="button" onClick={onCancel}>
            keep
          </button>
          <button className="primary-action compact" type="button" onClick={onConfirm}>
            remove()
          </button>
        </div>
      </section>
    </div>
  );
}
