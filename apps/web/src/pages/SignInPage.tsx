import { SignInForm } from "@features/auth";
import type { Language } from "@i18n";

type Props = {
  language: Language;
  onSubmit: (email: string, password: string) => boolean;
  onGoogle: () => void;
  onSwap: () => void;
};

export function SignInPage(props: Props) {
  return <SignInForm {...props} />;
}
