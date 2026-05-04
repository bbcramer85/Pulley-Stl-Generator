import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  plugins: [svelte()],
  server: {
    host: "0.0.0.0",
  },
  preview: {
    host: "0.0.0.0",
  },
});
