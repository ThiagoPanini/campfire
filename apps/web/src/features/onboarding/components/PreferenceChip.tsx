import type { PropsWithChildren } from "react";

type Props = PropsWithChildren<{
  selected: boolean;
  onClick: () => void;
}>;

export function PreferenceChip({ children, selected, onClick }: Props) {
  return <button type="button" className="chip" data-selected={selected} onClick={onClick}>{children}</button>;
}
