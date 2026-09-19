import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Explicitly disable Vite's upward search for a postcss.config.js —
  // without this, a stray config file in a parent folder (e.g. from
  // an unrelated project) can get picked up and break the build if
  // it references plugins (like tailwindcss) that aren't installed
  // here.
  css: {
    postcss: {
      plugins: [],
    },
  },
});
