import { useMemo, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { signInWithGoogle, signUpWithEmail } from "../auth/client";
import { Button } from "../ui/Button";
import { Field } from "../ui/Field";
import { GhostLink } from "../ui/GhostLink";
import { Modal, ModalBadge } from "../ui/Modal";
import { StrengthMeter } from "../ui/StrengthMeter";
import "./SignUp.css";

type SignUpLocationState = {
  email?: string;
  username?: string;
};

type FieldErrors = {
  username?: string;
  email?: string;
  password?: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_PATTERN = /^[a-zA-Z0-9_.\s-]{2,32}$/;

function locationField(state: unknown, key: keyof SignUpLocationState) {
  const candidate = state as SignUpLocationState | null;
  return typeof candidate?.[key] === "string" ? (candidate[key] as string) : "";
}

function validateUsername(username: string) {
  const trimmed = username.trim();
  if (trimmed.length < 2) {
    return "como você quer ser chamado?";
  }
  if (!USERNAME_PATTERN.test(trimmed)) {
    return "use letras, números, ponto, traço ou _";
  }
  return undefined;
}

function validateEmail(email: string) {
  return EMAIL_PATTERN.test(email.trim()) ? undefined : "esse email parece incompleto";
}

function validatePassword(password: string) {
  return password.length >= 8 ? undefined : "precisa de pelo menos 8 caracteres";
}

export function SignUp() {
  const location = useLocation();
  const navigate = useNavigate();
  const [username, setUsername] = useState(() => locationField(location.state, "username"));
  const [email, setEmail] = useState(() => locationField(location.state, "email"));
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<"duplicate" | "network" | "generic" | null>(
    null,
  );
  const [oauthError, setOauthError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpeningGoogle, setIsOpeningGoogle] = useState(false);

  const submitErrorMessage = useMemo(() => {
    if (submitError === "duplicate") {
      return (
        <>
          esse email já tem conta. tenta{" "}
          <Link className="signup__inline-link" to="/signin">
            entrar
          </Link>
          ?
        </>
      );
    }

    if (submitError === "network") {
      return "sem conexão. checa sua internet e tenta de novo.";
    }

    if (submitError === "generic") {
      return "algo travou aqui. tenta de novo num instante.";
    }

    return null;
  }, [submitError]);

  const validateForm = () => {
    const nextErrors = {
      username: validateUsername(username),
      email: validateEmail(email),
      password: validatePassword(password),
    };

    setErrors(nextErrors);
    return !nextErrors.username && !nextErrors.email && !nextErrors.password;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);
    setOauthError(false);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await signUpWithEmail(email.trim(), password, username.trim());

      if (result.ok) {
        navigate("/signup/confirm", {
          state: { email: email.trim(), username: username.trim() },
        });
        return;
      }

      setSubmitError(result.reason);
    } catch {
      setSubmitError("network");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setOauthError(false);
    setSubmitError(null);
    setIsOpeningGoogle(true);

    try {
      const result = await signInWithGoogle();

      if (result.ok) {
        window.location.assign(result.redirectUrl);
      }
    } catch {
      setOauthError(true);
    } finally {
      setIsOpeningGoogle(false);
    }
  };

  const handleClose = () => {
    navigate("/");
  };

  return (
    <Modal
      ariaLabelledBy="signup-title"
      className="signup-modal"
      closeOnBackdrop={false}
      onClose={handleClose}
    >
      <section className="signup" aria-labelledby="signup-title">
        <ModalBadge label="criar conta" />
        <h1 className="signup__title" id="signup-title">
          registre sua jornada musical.
        </h1>

        <form className="signup__form" onSubmit={handleSubmit} noValidate>
          <Field
            autoComplete="nickname"
            error={errors.username}
            helper="como aparece no seu perfil"
            label="nome"
            onBlur={() => {
              setErrors((current) => ({
                ...current,
                username: validateUsername(username),
              }));
            }}
            onChange={(event) => {
              setUsername(event.target.value);
              setSubmitError(null);
            }}
            placeholder="ex: ana, tião do cavaco"
            type="text"
            value={username}
          />

          <Field
            autoComplete="email"
            error={errors.email}
            inputMode="email"
            label="email"
            onBlur={() => {
              setErrors((current) => ({ ...current, email: validateEmail(email) }));
            }}
            onChange={(event) => {
              setEmail(event.target.value);
              setSubmitError(null);
            }}
            type="email"
            value={email}
          />

          <div className="signup__password-stack">
            <Field
              action={
                <Button
                  className="signup__password-toggle"
                  onClick={() => setShowPassword((current) => !current)}
                  type="button"
                  variant="ghost"
                >
                  {showPassword ? "esconder" : "mostrar"}
                </Button>
              }
              autoComplete="new-password"
              error={errors.password}
              helper="mín. 8 caracteres"
              label="senha"
              onBlur={() => {
                setErrors((current) => ({
                  ...current,
                  password: validatePassword(password),
                }));
              }}
              onChange={(event) => {
                setPassword(event.target.value);
                setSubmitError(null);
              }}
              type={showPassword ? "text" : "password"}
              value={password}
            />
            <StrengthMeter password={password} />
          </div>

          {submitErrorMessage ? (
            <p className="signup__error" role="alert">
              {submitErrorMessage}
            </p>
          ) : null}

          <Button
            fullWidth
            isLoading={isSubmitting}
            loadingLabel="criando..."
            type="submit"
          >
            criar conta
          </Button>
        </form>

        <div className="signup__divider" aria-hidden="true">
          <span />
          <strong>ou</strong>
          <span />
        </div>

        <Button
          fullWidth
          isLoading={isOpeningGoogle}
          loadingLabel="abrindo google..."
          onClick={handleGoogle}
          type="button"
          variant="outline"
        >
          <svg
            className="google-icon"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          continuar com google
        </Button>

        {oauthError ? (
          <p className="signup__error" role="alert">
            google recusou. tenta de novo ou usa email.
          </p>
        ) : null}

        <p className="signup__pivot">
          já tem conta? <GhostLink to="/signin">entrar</GhostLink>
        </p>
      </section>
    </Modal>
  );
}
