import { OnboardingFlow, type Preferences } from "@features/onboarding";
import type { Language } from "@i18n";

type Props = {
  language: Language;
  preferences: Preferences;
  onSave: (preferences: Preferences) => void;
  onSkip: () => void;
};

export function OnboardingPage(props: Props) {
  return <OnboardingFlow {...props} />;
}
