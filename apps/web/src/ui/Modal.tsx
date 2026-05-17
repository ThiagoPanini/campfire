import { ReactNode, useEffect, useRef } from "react";
import "./Modal.css";

type ModalProps = {
  children: ReactNode;
  onClose?: () => void;
  className?: string;
  ariaLabelledBy?: string;
  closeLabel?: string;
  closeOnBackdrop?: boolean;
};

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export function Modal({
  ariaLabelledBy,
  children,
  closeLabel = "fechar",
  closeOnBackdrop = true,
  onClose,
  className = "",
}: ModalProps) {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previouslyFocusedRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const getFocusable = () => {
      const content = contentRef.current;
      if (!content) return [];

      return Array.from(content.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (element) => element.offsetParent !== null,
      );
    };

    const focusTimer = window.setTimeout(() => {
      const content = contentRef.current;
      if (!content) return;

      if (document.activeElement instanceof HTMLElement && content.contains(document.activeElement)) {
        return;
      }

      getFocusable()[0]?.focus();
    }, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && onClose) {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const content = contentRef.current;
      const focusable = getFocusable();

      if (!content || focusable.length === 0) {
        event.preventDefault();
        content?.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocusedRef.current?.focus();
    };
  }, [onClose]);

  const handleOverlayClick = () => {
    if (closeOnBackdrop) {
      onClose?.();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-backdrop" aria-hidden="true" />
      <div
        className={`modal-content ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabelledBy}
        ref={contentRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        {onClose ? (
          <button
            type="button"
            className="modal-close"
            aria-label={closeLabel}
            onClick={onClose}
          >
            <span aria-hidden="true">fechar</span>
          </button>
        ) : null}
        {children}
      </div>
    </div>
  );
}

type ModalBadgeProps = {
  label: string;
};

export function ModalBadge({ label }: ModalBadgeProps) {
  return (
    <div className="modal-badge" aria-hidden="true">
      {label}
    </div>
  );
}
