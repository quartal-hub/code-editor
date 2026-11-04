import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import vue from "@astrojs/vue";
import path from "path";

export default defineConfig({
  // Production is served from the domain root. The GitHub Pages workflow sets PAGES_BASE_PATH (e.g. "/code-editor").
  base: process.env.PAGES_BASE_PATH || "/",
  integrations: [
    react(),
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.startsWith("qrtl-"),
        },
      },
    }),
  ],
  vite: {
    resolve: {
      alias: {
        "@": path.resolve("./src"),
      },
    },
  },
});
