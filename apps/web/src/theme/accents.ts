export const accentPresets = [
  { id: "EMBER", hex: "#FF6B2B", dark: "#7C1E00" },
  { id: "FLAME", hex: "#FFAA00", dark: "#7A4800" },
  { id: "GOLD", hex: "#FFD166", dark: "#6B4900" },
  { id: "COPPER", hex: "#E8813A", dark: "#6B2E00" },
  { id: "BRASS", hex: "#D4A84B", dark: "#5C3A00" },
] as const;

export type AccentPresetId = (typeof accentPresets)[number]["id"];

export const defaultAccent: AccentPresetId = "COPPER";

export function getAccent(id: AccentPresetId) {
  return accentPresets.find((preset) => preset.id === id) ?? accentPresets[3];
}
