import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// NestJS serves this app's build output at "/" and its own API under "/api";
// during `vite dev` we proxy /api to the local Nest server instead.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
  build: {
    outDir: "dist",
  },
});
