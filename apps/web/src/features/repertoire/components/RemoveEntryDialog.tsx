import { useState } from "react";
import { translate, type Language } from "@i18n";

type Props = {
  entryId: string;
  entryTitle: string;
  language: Language;
  onConfirm: (id: string, title: string) => Promise<void>;
  onCancel: () => void;
};

export function RemoveEntryDialog({ entryId, entryTitle, language, onConfirm, onCancel }: Props) {
  const [removing, setRemoving] = useState(false);
  const t = translate(language).repertoire;

  async function handleConfirm() {
    setRemoving(true);
    try {
      await onConfirm(entryId, entryTitle);
    } finally {
      setRemoving(false);
    }
  }

  return (
    <div className="rep-dialog-overlay" role="dialog" aria-modal="true">
      <div className="rep-dialog-card">
        <div className="rep-dialog-head">
          <p className="mono rep-dialog-kicker rep-dialog-kicker--danger">{t.removeSong}</p>
        </div>
        <h2 className="display rep-dialog-title">
          {t.removeConfirmTitle.replace("{title}", entryTitle.toUpperCase())}
        </h2>
        <p className="rep-dialog-copy">{t.removeConfirmBody}</p>
        <div className="rep-dialog-actions">
          <button type="button" className="ghost-button" onClick={onCancel} disabled={removing}>
            {t.cancel}
          </button>
          <button
            type="button"
            className="rep-btn-danger"
            onClick={handleConfirm}
            disabled={removing}
          >
            {removing ? t.removing : t.removeSong}
          </button>
        </div>
      </div>
    </div>
  );
}
