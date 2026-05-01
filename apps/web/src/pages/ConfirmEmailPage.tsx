import { ConfirmEmailForm } from "@features/auth";
import type { Language } from "@i18n";

type Props = {
  language: Language;
  email: string;
  authSubmitting: boolean;
  expiresInSeconds: number | null;
  resendCooldownSeconds: number | null;
  issuedAt: number | null;
  onConfirm: (email: string, code: string) => Promise<boolean>;
  onResend: (email: string) => Promise<unknown>;
};

export function ConfirmEmailPage(props: Props) {
  return <ConfirmEmailForm {...props} />;
}
