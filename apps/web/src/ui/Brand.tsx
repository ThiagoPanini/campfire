import { Link } from "react-router-dom";
import "./Brand.css";

type BrandProps = {
  to?: string;
};

export function Brand({ to = "/" }: BrandProps) {
  return (
    <Link className="brand" to={to} aria-label="campfire">
      campfire
    </Link>
  );
}
