type Props = {
  size?: number;
};

/**
 * Campfire mark.
 * A pared-back flame silhouette wrapped by a thin sound-wave arc.
 * Single-colour (currentColor) so the brand mark inherits the surface accent.
 */
export function FireIcon({ size = 24 }: Props) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className="fire-icon"
    >
      <path
        className="cf-flame-outer"
        d="M12 21.5c-3.6 0-6.5-2.7-6.5-6.2 0-3.7 3-6.1 4-9 .4 2.7 2 3.7 2.5 4.5.5-.7 1.4-2.3 1-4.6 2 2 4 5.6 4 8.9 0 3.6-1.4 6.4-5 6.4Z"
        fill="currentColor"
      />
      <path
        d="M3.6 18.2c2-.4 3.4-1 4.4-1.6"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.45"
      />
      <path
        d="M20.4 18.2c-2-.4-3.4-1-4.4-1.6"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.45"
      />
    </svg>
  );
}
