import type { PropsWithChildren } from "react";

export function AuthFrame({ children }: PropsWithChildren) {
  return <main className="page"><section className="auth-lane fade-up">{children}</section></main>;
}
