import { translate, type Language } from "@i18n";
import type { Toast } from "../store/repertoire.store";

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
      sub = `${toast.title} · ${toast.instrument} · ${t[`proficiency_${toast.proficiency}` as keyof typeof t]}`;
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
      <div className="rep-toast-icon" aria-hidden="true">✓</div>
      <div>
        <p className="mono rep-toast-heading">{heading}</p>
        <p className="rep-toast-sub">{sub}</p>
      </div>
      <button type="button" className="mono rep-toast-dismiss" onClick={onDismiss} aria-label="Dismiss">
        ✕
      </button>
    </div>
  );
}
