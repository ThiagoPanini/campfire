import type { ReactNode } from "react";
import { AlphaBadge } from "@shared/ui";
import { FireIcon } from "@shared/icons/FireIcon";

type Props = {
  action?: ReactNode;
  links?: Array<{
    label: string;
    active?: boolean;
    onClick: () => void;
  }>;
  onHome?: () => void;
};

export function Nav({ action, links = [], onHome }: Props) {
  return (
    <header className="nav">
      <button className="brand brand-button" type="button" aria-label="Ir para o início" onClick={onHome}>
        <FireIcon />
        <span className="wordmark">CAMPFIRE</span>
        <AlphaBadge />
      </button>
      {links.length > 0 ? (
        <nav className="nav-links" aria-label="Navegação principal">
          {links.map((link) => (
            <button
              key={link.label}
              className="nav-link"
              type="button"
              data-active={link.active ? "true" : undefined}
              onClick={link.onClick}
            >
              {link.label}
            </button>
          ))}
        </nav>
      ) : null}
      <div className="nav-actions">{action}</div>
    </header>
  );
}
