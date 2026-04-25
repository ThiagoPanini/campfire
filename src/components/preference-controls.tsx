import type { PropsWithChildren } from "react";

type ChipProps = PropsWithChildren<{
  selected: boolean;
  onClick: () => void;
}>;

export function PreferenceChip({ children, selected, onClick }: ChipProps) {
  return <button type="button" className="chip" data-selected={selected} onClick={onClick}>{children}</button>;
}

type CardProps = PropsWithChildren<{
  title: string;
  sub?: string;
  selected: boolean;
  onClick: () => void;
}>;

export function OptionCard({ title, sub, selected, onClick }: CardProps) {
  return (
    <button type="button" className="option-card" data-selected={selected} onClick={onClick}>
      <strong>{title}</strong>
      {sub ? <span>{sub}</span> : null}
    </button>
  );
}
