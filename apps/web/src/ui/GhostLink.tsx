import { Link, type LinkProps } from "react-router-dom";
import "./GhostLink.css";

type GhostLinkProps = LinkProps & {
  dimmed?: boolean;
};

export function GhostLink({
  children,
  className = "",
  dimmed = false,
  ...props
}: GhostLinkProps) {
  const linkClassName = ["ghost-link", dimmed ? "ghost-link--dimmed" : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <Link className={linkClassName} {...props}>
      {children}
    </Link>
  );
}
