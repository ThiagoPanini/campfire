type Props = {
  size?: number;
};

export function FireIcon({ size = 28 }: Props) {
  return (
    <svg aria-hidden="true" width={size} height={size * 1.15} viewBox="0 0 28 32" fill="none" className="fire-icon">
      <g className="cf-flame-outer">
        <path d="M14 30C7.5 30 3 25 3 19C3 12 9 7 11 2C11 7 13.5 9 14 10C14.5 9 16 6 15 1C19 5 25 12 25 19C25 25 20.5 30 14 30Z" fill="var(--cf-accent)" />
      </g>
      <g className="cf-flame-inner">
        <path d="M14 26C10 26 8 23 8 20C8 16.5 10.5 14 12 12C12 15 13.5 16 14 17C14.5 16 15.5 14.5 15 12C17.5 14 20 17 20 20.5C20 23.5 17.5 26 14 26Z" fill="#FFD166" />
      </g>
      <ellipse cx="14" cy="26" rx="3" ry="2" fill="#FFF5B0" opacity="0.7" />
    </svg>
  );
}
