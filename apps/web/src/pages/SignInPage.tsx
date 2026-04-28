import { SignInForm } from "@features/auth";
import type { Language } from "@i18n";

type Props = {
  language: Language;
  onSubmit: (email: string, password: string) => Promise<boolean>;
  onGoogle: () => Promise<boolean>;
  onSwap: () => void;
};

export function SignInPage(props: Props) {
  return <SignInForm {...props} />;
}
