import type { ReactNode } from "react";
import { AlphaBadge } from "./buttons";
import { FireIcon } from "./FireIcon";

type Props = {
  action?: ReactNode;
};

export function Nav({ action }: Props) {
  return (
    <header className="nav">
      <div className="brand">
        <FireIcon />
        <span className="wordmark">CAMPFIRE</span>
        <AlphaBadge />
      </div>
      <div className="nav-actions">{action}</div>
    </header>
  );
}
