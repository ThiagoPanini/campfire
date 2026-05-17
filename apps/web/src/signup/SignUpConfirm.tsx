import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { resendCode, verifyCode } from "../auth/client";
import { Button } from "../ui/Button";
import { CodeBoxes } from "../ui/CodeBoxes";
import { GhostLink } from "../ui/GhostLink";
import { Modal, ModalBadge } from "../ui/Modal";
import "./SignUpConfirm.css";

type SignUpConfirmProps = {
  email: string;
};

function codeErrorMessage(reason: "invalid" | "expired") {
  if (reason === "expired") {
    return "esse código já expirou. clica reenviar.";
  }

  return "código inválido. tenta de novo.";
}

const RESEND_COOLDOWN = 60;
const CODE_EXPIRY_TIME = 900; // 15 minutes in seconds

function formatTimeRemaining(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function SignUpConfirm({ email }: SignUpConfirmProps) {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | undefined>();
  const [cooldown, setCooldown] = useState(0);
  const [expiryTime, setExpiryTime] = useState(CODE_EXPIRY_TIME);
  const [isResending, setIsResending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (cooldown === 0) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setCooldown((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => window.clearTimeout(timeout);
  }, [cooldown]);

  useEffect(() => {
    if (expiryTime <= 0) {
      setCodeError("código expirou. clica reenviar.");
      return;
    }

    const timeout = window.setTimeout(() => {
      setExpiryTime((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => window.clearTimeout(timeout);
  }, [expiryTime]);

  const confirmCode = async (nextCode = code) => {
    if (isVerifying) {
      return;
    }

    if (nextCode.length !== 6) {
      setCodeError("código inválido. tenta de novo.");
      return;
    }

    setCodeError(undefined);
    setIsVerifying(true);

    try {
      const result = await verifyCode(email, nextCode);

      if (result.ok) {
        navigate("/app");
        return;
      }

      setCodeError(codeErrorMessage(result.reason));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void confirmCode();
  };

  const handleResend = async () => {
    if (cooldown > 0) {
      return;
    }

    setIsResending(true);
    setCodeError(undefined);

    try {
      await resendCode(email);
      setCooldown(RESEND_COOLDOWN);
      setExpiryTime(CODE_EXPIRY_TIME);
      setCode("");
    } finally {
      setIsResending(false);
    }
  };

  const handleClose = () => {
    navigate("/");
  };

  return (
    <Modal onClose={handleClose} className="confirm-modal">
      <section className="confirm" aria-labelledby="confirm-title">
        <ModalBadge label="quase lá" />
        <h1 className="confirm__title" id="confirm-title">
          um último passo.
        </h1>

        <p className="confirm__lede">
          mandamos um código de 6 dígitos para <strong>{email}</strong>. cole ou digite os 6 dígitos abaixo.
        </p>

        <form className="confirm__form" onSubmit={handleSubmit}>
          <CodeBoxes
            disabled={isVerifying}
            error={codeError}
            onChange={(nextCode) => {
              setCode(nextCode);
              setCodeError(undefined);
            }}
            onComplete={(nextCode) => {
              void confirmCode(nextCode);
            }}
            value={code}
          />

          <Button
            fullWidth
            isLoading={isVerifying}
            loadingLabel="confirmando..."
            type="submit"
          >
            verificar
          </Button>
        </form>

        <div className="confirm__actions">
          <Button
            className="confirm__resend"
            disabled={cooldown > 0}
            isLoading={isResending}
            loadingLabel="reenviando..."
            onClick={handleResend}
            type="button"
            variant="ghost"
          >
            {cooldown > 0 ? `reenviando em ${cooldown}s` : "não chegou? reenviar"}
          </Button>
          <span className="confirm__divider">·</span>
          <GhostLink to="/signup" className="confirm__change-email">
            trocar email
          </GhostLink>
        </div>

        <div className="confirm__meta">
          <div className="confirm__meta-row">
            <span className="confirm__meta-key">expira em</span>
            <span className="confirm__meta-val">{formatTimeRemaining(expiryTime)}</span>
          </div>
          <div className="confirm__meta-row">
            <span className="confirm__meta-key">via</span>
            <span className="confirm__meta-val">e-mail · postal · {expiryTime > 0 ? "aguardando" : "expirado"}</span>
          </div>
        </div>
      </section>
    </Modal>
  );
}
