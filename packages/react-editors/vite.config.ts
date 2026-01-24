import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: "src/index.ts",
      name: "ReactEditors",
      formats: ["es"],
      fileName: "index",
    },
    rollupOptions: {
      external: [
        "@codesandbox/sandpack-react",
        "@monaco-editor/react",
        "react",
        "react-dom",
      ],
    },
  },
});
