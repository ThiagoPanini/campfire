import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const roots = [
  "apps/web/src/features/auth",
  "apps/web/src/pages/ConfirmEmailPage.tsx",
];
const locales = {
  en: readFileSync("apps/web/src/i18n/locales/en.ts", "utf8"),
  pt: readFileSync("apps/web/src/i18n/locales/pt.ts", "utf8"),
};

function files(path) {
  if (statSync(path).isFile()) return [path];
  return readdirSync(path).flatMap((entry) => files(join(path, entry)));
}

function localeHas(source, keyPath) {
  return keyPath.split(".").every((part) => new RegExp(`${part}\\s*:`).test(source));
}

const keys = new Set();
for (const file of roots.flatMap(files).filter((file) => /\.(tsx?|jsx?)$/.test(file))) {
  const source = readFileSync(file, "utf8");
  for (const match of source.matchAll(/\bt\.((?:auth|validation)\.[A-Za-z0-9_]+)/g)) {
    keys.add(match[1]);
  }
}

const missing = [];
for (const key of [...keys].sort()) {
  for (const [locale, source] of Object.entries(locales)) {
    if (!localeHas(source, key)) missing.push(`${locale}: ${key}`);
  }
}

if (missing.length) {
  console.error(`Missing i18n keys:\n${missing.join("\n")}`);
  process.exit(1);
}

console.log(`i18n ok (${keys.size} keys)`);
