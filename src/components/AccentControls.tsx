import type { AccentPresetId } from "../data/catalogs";
import { accentPresets } from "../data/catalogs";
import type { Language } from "../data/copy";

type Props = {
  labels: { language: string; accent: string; en: string; pt: string };
  language: Language;
  accent: AccentPresetId;
  onLanguage: (language: Language) => void;
  onAccent: (accent: AccentPresetId) => void;
};

export function AccentControls({ labels, language, accent, onLanguage, onAccent }: Props) {
  return (
    <div className="controls" aria-label="Display preferences">
      <span className="mono muted">{labels.language}</span>
      <button className="link-button" data-active={language === "en"} onClick={() => onLanguage("en")}>{labels.en}</button>
      <button className="link-button" data-active={language === "pt"} onClick={() => onLanguage("pt")}>{labels.pt}</button>
      <span className="mono muted">{labels.accent}</span>
      {accentPresets.map((preset) => (
        <button
          key={preset.id}
          aria-label={preset.id}
          className="swatch"
          data-active={accent === preset.id}
          style={{ background: preset.hex }}
          onClick={() => onAccent(preset.id)}
        />
      ))}
    </div>
  );
}
