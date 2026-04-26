import { SignUpForm } from "@features/auth";
import type { Language } from "@i18n";

type Props = {
  language: Language;
  onSubmit: (email: string, password: string) => void;
  onGoogle: () => void;
  onSwap: () => void;
};

export function SignUpPage(props: Props) {
  return <SignUpForm {...props} />;
}
