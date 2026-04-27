import type { SearchResult } from "../types";

type Props = {
  result: SearchResult;
  selected?: boolean;
  onClick: () => void;
};

export function SearchResultRow({ result, selected, onClick }: Props) {
  return (
    <div
      className={`rep-result-row${selected ? " rep-result-row--selected" : ""}`}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick()}
    >
      <div className="rep-cover">
        {result.coverUrl ? (
          <img
            src={result.coverUrl}
            alt={result.title}
            className="rep-cover-img"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
              e.currentTarget.parentElement?.classList.add("rep-cover--fallback");
            }}
          />
        ) : (
          <span className="rep-cover--fallback" aria-hidden="true" />
        )}
      </div>
      <div>
        <div className="rep-result-title">{result.title}</div>
        <div className="rep-result-sub">
          {result.artist}
          {result.releaseYear ? ` · ${result.releaseYear}` : ""}
        </div>
      </div>
      {selected && (
        <span className="mono rep-result-hint">↵ ENTER</span>
      )}
    </div>
  );
}
