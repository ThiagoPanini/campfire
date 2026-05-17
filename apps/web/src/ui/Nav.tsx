import type { ReactNode } from "react";
import { Brand } from "./Brand";
import "./Nav.css";

type NavProps = {
  action: ReactNode;
};

export function Nav({ action }: NavProps) {
  return (
    <header className="nav" role="banner">
      <Brand />
      <nav className="nav__action" aria-label="conta">
        {action}
      </nav>
    </header>
  );
}
