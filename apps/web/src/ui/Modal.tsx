import { ReactNode, useEffect, useRef } from "react";
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

type TypingTitleProps = {
  text: string;
  duration?: number;
  className?: string;
};

export function TypingTitle({ text, duration = 2, className = "signup__title" }: TypingTitleProps) {
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const element = ref.current.querySelector(".typing-text");
    if (!element) return;

    const steps = text.length;
    element.style.setProperty("--typing-steps", steps.toString());
    element.style.setProperty("--typing-duration", `${duration}s`);

    element.classList.add("typing-text--animating");
  }, [text, duration]);

  return (
    <h1 className={className} ref={ref}>
      <span className="typing-text">{text}</span>
    </h1>
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
