import type { ReactNode } from "react";
import "./PageColumn.css";

type PageColumnProps = {
  children: ReactNode;
  className?: string;
};

export function PageColumn({ children, className = "" }: PageColumnProps) {
  return (
    <main className={`page-column ${className}`.trim()}>
      <div className="page-column__inner">{children}</div>
    </main>
  );
}
