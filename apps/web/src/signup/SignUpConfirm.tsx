import { useEffect, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { resendCode, verifyCode } from "../auth/client";
import { Button } from "../ui/Button";
import { CodeBoxes } from "../ui/CodeBoxes";
import { FooterHairline } from "../ui/FooterHairline";
import { GhostLink } from "../ui/GhostLink";
import { Nav } from "../ui/Nav";
import { PageColumn } from "../ui/PageColumn";
import "./SignUpConfirm.css";

type ConfirmLocationState = {
  email?: string;
};

function locationEmail(state: unknown) {
  const candidate = state as ConfirmLocationState | null;
  return typeof candidate?.email === "string" ? candidate.email : "";
}

function codeErrorMessage(reason: "invalid" | "expired") {
  if (reason === "expired") {
    return "esse código já expirou. clica reenviar.";
  }

  return "código inválido. tenta de novo.";
}

export function SignUpConfirm() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = locationEmail(location.state);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | undefined>();
  const [cooldown, setCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (!email) {
      navigate("/signup", { replace: true });
    }
  }, [email, navigate]);

  useEffect(() => {
    if (cooldown === 0) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setCooldown((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => window.clearTimeout(timeout);
  }, [cooldown]);

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
      setCodeError("reenviado demais. espera um instante.");
      return;
    }

    setIsResending(true);
    setCodeError(undefined);

    try {
      await resendCode(email);
      setCooldown(30);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="confirm-page">
      <Nav
        action={
          <GhostLink to="/signup" state={{ email }}>
            trocar email
          </GhostLink>
        }
      />

      <PageColumn className="confirm-page__main">
        <section className="confirm" aria-labelledby="confirm-title">
          <h1 className="confirm__title" id="confirm-title">
            checa seu email
          </h1>

          <p className="confirm__caption">
            enviamos um código pra <span>{email}</span>
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
              confirmar
            </Button>
          </form>

          <Button
            className="confirm__resend"
            disabled={cooldown > 0}
            isLoading={isResending}
            loadingLabel="reenviando..."
            onClick={handleResend}
            type="button"
            variant="ghost"
          >
            {cooldown > 0 ? `reenviado. tenta de novo em ${cooldown}s` : "não chegou? reenviar"}
          </Button>
        </section>
      </PageColumn>

      <FooterHairline />
    </div>
  );
}
