import { Check, X } from "lucide-react";
import { translate, type Language } from "@i18n";
import type { Toast } from "../store/repertoire.store";
import { instrumentLabel } from "../catalogs";

type Props = {
  toast: Toast;
  language: Language;
  onDismiss: () => void;
};

export function RepertoireToast({ toast, language, onDismiss }: Props) {
  const t = translate(language).repertoire;

  let heading = "";
  let sub = "";

  switch (toast.kind) {
    case "added":
      heading = t.toastAdded;
      sub = `${toast.title} · ${instrumentLabel(toast.instrument)} · ${t[`proficiency_${toast.proficiency}` as keyof typeof t]}`;
      break;
    case "updated":
      heading = t.toastUpdated;
      sub = toast.title;
      break;
    case "removed":
      heading = t.toastRemoved;
      sub = toast.title;
      break;
    case "error":
      heading = t.toastError;
      sub = toast.message;
      break;
  }

  return (
    <div className="rep-toast cf-fade" role="status" aria-live="polite">
      <Check className="rep-toast-icon" size={16} aria-hidden="true" />
      <div>
        <p className="mono rep-toast-heading">{heading}</p>
        <p className="rep-toast-sub">{sub}</p>
      </div>
      <button type="button" className="mono rep-toast-dismiss" onClick={onDismiss} aria-label="Fechar aviso">
        <X size={14} aria-hidden="true" />
      </button>
    </div>
  );
}
