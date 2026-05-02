import { SignInForm } from "@features/auth";
import type { Language } from "@i18n";

type Props = {
  language: Language;
  onSubmit: (email: string, password: string) => Promise<false | "authenticated" | "confirmation_required">;
  onGoogle: () => Promise<"redirecting" | "failed">;
  onSwap: () => void;
  googleEnabled: boolean;
  authSubmitting: boolean;
};

export function SignInPage(props: Props) {
  return <SignInForm {...props} />;
}
