import { ReactNode, useEffect } from "react";
import "./Modal.css";

type ModalProps = {
  children: ReactNode;
  onClose?: () => void;
  className?: string;
};

export function Modal({ children, onClose, className = "" }: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && onClose) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-backdrop" aria-hidden="true" />
      <div className={`modal-content ${className}`} onClick={(e) => e.stopPropagation()}>
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
