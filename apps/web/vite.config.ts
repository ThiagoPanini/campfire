import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  root: r("."),
  plugins: [react()],
  resolve: {
    alias: {
      "@app": r("./src/app"),
      "@pages": r("./src/pages"),
      "@features": r("./src/features"),
      "@shared": r("./src/shared"),
      "@i18n": r("./src/i18n"),
      "@theme": r("./src/theme"),
      "@api": r("./src/api"),
      "@mocks": r("./src/mocks"),
      "@styles": r("./src/styles"),
      "@assets": r("./src/assets"),
    },
  },
});
