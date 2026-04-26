import type { ContextId, ExperienceId, GenreId, GoalId, InstrumentId } from "./catalogs";

export type Preferences = {
  instruments: InstrumentId[];
  genres: GenreId[];
  context: ContextId | null;
  goals: GoalId[];
  experience: ExperienceId | null;
};

export const emptyPreferences: Preferences = {
  instruments: [],
  genres: [],
  context: null,
  goals: [],
  experience: null,
};

export function clonePreferences(preferences: Preferences): Preferences {
  return {
    instruments: [...preferences.instruments],
    genres: [...preferences.genres],
    context: preferences.context,
    goals: [...preferences.goals],
    experience: preferences.experience,
  };
}
