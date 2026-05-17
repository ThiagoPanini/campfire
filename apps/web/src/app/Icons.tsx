type IconProps = {
  className?: string;
};

const baseProps = {
  stroke: "currentColor",
  strokeWidth: 1,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  fill: "none",
};

export function IconHome({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 14 14"
      aria-hidden="true"
      {...baseProps}
    >
      <path d="M2 7 L7 2 L12 7" />
      <path d="M3.2 7 V12 H10.8 V7" />
      <path d="M6 12 V9 H8 V12" />
    </svg>
  );
}

export function IconShelf({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="16"
      height="12"
      viewBox="0 0 16 12"
      aria-hidden="true"
      {...baseProps}
    >
      <rect x="1" y="2" width="14" height="8" />
      <circle cx="5" cy="6" r="1.5" />
      <circle cx="11" cy="6" r="1.5" />
      <path d="M3.5 9 H12.5" />
    </svg>
  );
}

export function IconJams({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 14 14"
      aria-hidden="true"
      {...baseProps}
    >
      <circle cx="7" cy="7" r="5" />
      <circle cx="7" cy="7" r="2.4" />
      <circle cx="7" cy="7" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconUser({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 14 14"
      aria-hidden="true"
      {...baseProps}
    >
      <circle cx="7" cy="4.5" r="2.2" />
      <path d="M2.5 12 C2.5 9.4 4.5 8 7 8 C9.5 8 11.5 9.4 11.5 12" />
    </svg>
  );
}

export function IconExit({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 14 14"
      aria-hidden="true"
      {...baseProps}
    >
      <path d="M7 2 H2 V12 H7" />
      <path d="M9 4.5 L12 7 L9 9.5" />
      <path d="M5 7 H12" />
    </svg>
  );
}

export function IconArrowOut({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 14 14"
      aria-hidden="true"
      {...baseProps}
    >
      <path d="M3 11 L11 3" />
      <path d="M5 3 H11 V9" />
    </svg>
  );
}

export function IconCassette({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="44"
      height="28"
      viewBox="0 0 44 28"
      aria-hidden="true"
      {...baseProps}
    >
      <rect x="1" y="3" width="42" height="22" rx="1" />
      <path d="M5 19 H39" />
      <circle cx="14" cy="13" r="4.2" />
      <circle cx="30" cy="13" r="4.2" />
      <circle cx="14" cy="13" r="1.4" />
      <circle cx="30" cy="13" r="1.4" />
      <path d="M14 22 L30 22" />
    </svg>
  );
}
