import type { PropsWithChildren } from "react";

type Props = PropsWithChildren<{
  title: string;
  sub?: string;
  selected: boolean;
  onClick: () => void;
}>;

export function OptionCard({ title, sub, selected, onClick }: Props) {
  return (
    <button type="button" className="option-card" data-selected={selected} onClick={onClick}>
      <strong>{title}</strong>
      {sub ? <span>{sub}</span> : null}
    </button>
  );
}
