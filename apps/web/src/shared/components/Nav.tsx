import type { ReactNode } from "react";
import { AlphaBadge } from "@shared/ui";
import { FireIcon } from "@shared/icons/FireIcon";

type Props = {
  action?: ReactNode;
  onHome?: () => void;
};

export function Nav({ action, onHome }: Props) {
  return (
    <header className="nav">
      <button className="brand brand-button" type="button" aria-label="Go to Home" onClick={onHome}>
        <FireIcon />
        <span className="wordmark">CAMPFIRE</span>
        <AlphaBadge />
      </button>
      <div className="nav-actions">{action}</div>
    </header>
  );
}
