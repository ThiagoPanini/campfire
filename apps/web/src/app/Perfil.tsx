import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { clearSession, deriveInitials, type SessionUser } from "../auth/session";
import { Button } from "../ui/Button";
import { IconCassette } from "./Icons";
import "./Perfil.css";

type PerfilProps = {
  user: SessionUser;
  songCount: number;
  instruments: string[];
};

function tapeIdFor(email: string): string {
  let hash = 0;
  for (let i = 0; i < email.length; i += 1) {
    hash = (hash * 31 + email.charCodeAt(i)) & 0xffff;
  }
  const code = (hash % 9000) + 1000;
  return `cmp-a${code}`;
}

function joinedLabel(joinedAt: string): string {
  try {
    const date = new Date(joinedAt);
    const month = date.toLocaleDateString("pt-BR", { month: "long" });
    return `${date.getFullYear()} · ${month}`;
  } catch {
    return "data desconhecida";
  }
}

export function Perfil({ user, songCount, instruments }: PerfilProps) {
  const navigate = useNavigate();
  const initials = useMemo(
    () => deriveInitials(user.username, user.email),
    [user.username, user.email],
  );
  const tapeId = useMemo(() => tapeIdFor(user.email), [user.email]);
  const since = useMemo(() => joinedLabel(user.joinedAt), [user.joinedAt]);

  const instrumentsLine = instruments.length
    ? instruments.slice(0, 3).join(" · ")
    : "ainda não declarado";

  const handleLogout = () => {
    clearSession();
    navigate("/");
  };

  return (
    <section className="perfil" aria-labelledby="perfil-title">
      <header className="perfil__head">
        <p className="perfil__kicker">cartão de membro</p>
        <h1 className="perfil__title" id="perfil-title">
          perfil
        </h1>
      </header>

      <article className="jcard" aria-label="cartão de identificação">
        <div className="jcard__strip" aria-hidden="true">
          <span>campfire · cartão de membro</span>
          <span>{tapeId}</span>
        </div>

        <div className="jcard__identity">
          <div className="jcard__avatar" aria-hidden="true">
            <span className="jcard__avatar-glyph">{initials}</span>
          </div>
          <div className="jcard__who">
            <p className="jcard__name">{user.username}</p>
            <p className="jcard__handle">@{user.username.replace(/\s+/g, "").toLowerCase()}</p>
            <p className="jcard__email">{user.email}</p>
          </div>
        </div>

        <div className="jcard__rule" aria-hidden="true" />

        <div className="jcard__sides">
          <div className="jcard__side">
            <p className="jcard__side-label">lado a · repertório</p>
            <p className="jcard__side-number" aria-label={`${songCount} músicas guardadas`}>
              {String(songCount).padStart(2, "0")}
            </p>
            <p className="jcard__side-foot">
              {songCount === 1 ? "música guardada" : "músicas guardadas"}
            </p>
          </div>
          <div className="jcard__side-divider" aria-hidden="true" />
          <div className="jcard__side">
            <p className="jcard__side-label">lado b · jams</p>
            <p className="jcard__side-number">00</p>
            <p className="jcard__side-foot">rodas até hoje</p>
          </div>
        </div>

        <div className="jcard__rule" aria-hidden="true" />

        <dl className="jcard__meta">
          <div className="jcard__meta-row">
            <dt>instrumentos</dt>
            <dd>{instrumentsLine}</dd>
          </div>
          <div className="jcard__meta-row">
            <dt>membro desde</dt>
            <dd>{since}</dd>
          </div>
          <div className="jcard__meta-row">
            <dt>fita</dt>
            <dd>{tapeId}</dd>
          </div>
          <div className="jcard__meta-row">
            <dt>voz</dt>
            <dd>amador, sem pressa</dd>
          </div>
        </dl>

        <div className="jcard__tape" aria-hidden="true">
          <IconCassette className="jcard__tape-glyph" />
          <span className="jcard__tape-bar" />
        </div>
      </article>

      <footer className="perfil__actions">
        <Button type="button" variant="outline">
          editar perfil
        </Button>
        <Button type="button" variant="ghost" onClick={handleLogout}>
          sair desta fita
        </Button>
      </footer>

      <p className="perfil__note">
        este cartão fica entre você e seus amigos. nenhuma página pública.
      </p>
    </section>
  );
}
