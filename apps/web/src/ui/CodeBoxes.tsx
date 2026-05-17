import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";
import "./CodeBoxes.css";

type CodeBoxesProps = {
  disabled?: boolean;
  error?: string;
  onChange?: (code: string) => void;
  onComplete: (code: string) => void;
  value: string;
};

const CODE_LENGTH = 6;

function digitsOnly(value: string) {
  return value.replace(/\D/g, "").slice(0, CODE_LENGTH);
}

export function CodeBoxes({
  disabled = false,
  error,
  onChange,
  onComplete,
  value,
}: CodeBoxesProps) {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const [shakeKey, setShakeKey] = useState(0);
  const digits = Array.from({ length: CODE_LENGTH }, (_, index) => value[index] ?? "");

  useEffect(() => {
    if (error) {
      setShakeKey((current) => current + 1);
    }
  }, [error]);

  const updateCode = (nextDigits: string[], focusIndex?: number) => {
    const nextCode = nextDigits.join("");
    onChange?.(nextCode);

    if (typeof focusIndex === "number") {
      requestAnimationFrame(() => {
        inputsRef.current[focusIndex]?.focus();
      });
    }

    if (nextCode.length === CODE_LENGTH) {
      onComplete(nextCode);
    }
  };

  const handleChange = (index: number, event: ChangeEvent<HTMLInputElement>) => {
    const rawDigits = digitsOnly(event.target.value);

    if (rawDigits.length === CODE_LENGTH) {
      updateCode(rawDigits.split(""), CODE_LENGTH - 1);
      return;
    }

    const nextDigit = rawDigits.slice(-1);
    const nextDigits = [...digits];
    nextDigits[index] = nextDigit;

    const nextFocusIndex = nextDigit ? Math.min(index + 1, CODE_LENGTH - 1) : index;
    updateCode(nextDigits, nextFocusIndex);
  };

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Backspace" || digits[index]) {
      return;
    }

    const previousIndex = Math.max(index - 1, 0);
    const nextDigits = [...digits];
    nextDigits[previousIndex] = "";
    event.preventDefault();
    updateCode(nextDigits, previousIndex);
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const pastedCode = digitsOnly(event.clipboardData.getData("text"));

    if (pastedCode.length !== CODE_LENGTH) {
      return;
    }

    event.preventDefault();
    updateCode(pastedCode.split(""), CODE_LENGTH - 1);
  };

  return (
    <div className="code-boxes">
      <div
        className={`code-boxes__row${error ? " code-boxes__row--error" : ""}`}
        key={shakeKey}
        role="group"
        aria-label="código de confirmação"
        aria-describedby={error ? "code-boxes-error" : undefined}
      >
        {digits.map((digit, index) => (
          <input
            aria-label={`dígito ${index + 1} do código`}
            aria-invalid={error ? true : undefined}
            autoComplete={index === 0 ? "one-time-code" : "off"}
            className="code-boxes__input"
            disabled={disabled}
            inputMode="numeric"
            key={index}
            maxLength={1}
            onChange={(event) => handleChange(index, event)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onPaste={handlePaste}
            pattern="[0-9]*"
            ref={(element) => {
              inputsRef.current[index] = element;
            }}
            type="text"
            value={digit}
          />
        ))}
      </div>
      {error ? (
        <p className="code-boxes__error" id="code-boxes-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
