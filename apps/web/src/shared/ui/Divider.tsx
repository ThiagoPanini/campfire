import type { PropsWithChildren } from "react";

export function Divider({ children }: PropsWithChildren) {
  return <div className="divider mono">{children}</div>;
}
