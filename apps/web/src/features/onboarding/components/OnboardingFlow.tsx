import { useEffect, useState, type PropsWithChildren } from "react";
import { AccentButton, GhostButton } from "@shared/ui";
import { translate, type Language } from "@i18n";
import { contexts, experiences, genres, goals, instruments } from "../catalogs";
import type { ContextId, ExperienceId, GenreId, GoalId, InstrumentId } from "../catalogs";
import { type Preferences } from "../types";
import { PreferenceChip } from "./PreferenceChip";
import { OptionCard } from "./OptionCard";

type Props = {
  language: Language;
  preferences: Preferences;
  onSave: (preferences: Preferences) => void;
  onSkip: () => void;
};

function toggle<T>(items: T[], item: T) {
  return items.includes(item) ? items.filter((candidate) => candidate !== item) : [...items, item];
}

function toggleInstrument(items: InstrumentId[], item: InstrumentId) {
  if (item === "I don't play") {
    return items.includes(item) ? [] : [item];
  }
  return toggle(items.filter((candidate) => candidate !== "I don't play"), item);
}

export function OnboardingFlow({ language, preferences, onSave, onSkip }: Props) {
  const t = translate(language).onboarding;
  const [draft, setDraft] = useState<Preferences>(preferences);
  const [saving, setSaving] = useState(false);

  useEffect(() => setDraft(preferences), [preferences]);

  async function save() {
    if (saving) return;
    setSaving(true);
    window.setTimeout(() => {
      Promise.resolve(onSave(draft)).finally(() => setSaving(false));
    }, 350);
  }

  return (
    <main className="page">
      <section className="flow-lane fade-up">
        <h1 className="display flow-title">{t.title}</h1>
        <p className="flow-copy">{t.sub}</p>

        <PreferenceGroup title={t.instruments}>
          <div className="chip-grid">{instruments.map((item) => <PreferenceChip key={item} selected={draft.instruments.includes(item)} onClick={() => setDraft({ ...draft, instruments: toggleInstrument(draft.instruments, item) })}>{item}</PreferenceChip>)}</div>
        </PreferenceGroup>
        <PreferenceGroup title={t.genres}>
          <div className="chip-grid">{genres.map((item) => <PreferenceChip key={item} selected={draft.genres.includes(item)} onClick={() => setDraft({ ...draft, genres: toggle<GenreId>(draft.genres, item) })}>{item}</PreferenceChip>)}</div>
        </PreferenceGroup>
        <PreferenceGroup title={t.context}>
          <div className="option-grid">{contexts.map((item) => <OptionCard key={item.id} title={item.label} selected={draft.context === item.id} onClick={() => setDraft({ ...draft, context: item.id as ContextId })} />)}</div>
        </PreferenceGroup>
        <PreferenceGroup title={t.goals}>
          <div className="chip-grid">{goals.map((item) => <PreferenceChip key={item} selected={draft.goals.includes(item)} onClick={() => setDraft({ ...draft, goals: toggle<GoalId>(draft.goals, item) })}>{item}</PreferenceChip>)}</div>
        </PreferenceGroup>
        <PreferenceGroup title={t.experience}>
          <div className="option-grid">{experiences.map((item) => <OptionCard key={item.id} title={item.label} sub={item.sub} selected={draft.experience === item.id} onClick={() => setDraft({ ...draft, experience: item.id as ExperienceId })} />)}</div>
        </PreferenceGroup>

        <div className="flow-actions">
          <AccentButton onClick={save} disabled={saving}>{saving ? t.saving : t.cta}</AccentButton>
          <GhostButton onClick={onSkip} disabled={saving}>{t.skip}</GhostButton>
        </div>
      </section>
    </main>
  );
}

function PreferenceGroup({ title, children }: PropsWithChildren<{ title: string }>) {
  return (
    <section className="preference-group">
      <h2 className="mono">{title}</h2>
      {children}
    </section>
  );
}
