import { pt } from "./locales/pt";
import type { Language } from "./types";

export type { Language } from "./types";

export const copy = { pt };

export function translate(_language: Language = "pt"): typeof pt {
  return pt;
}
