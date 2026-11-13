import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const apiPort = loadEnv(mode, ".", "").API_PORT || "4100";

  return {
    plugins: [react(), tailwindcss()],
    server: {
      // Send every /api call to the Express server
      proxy: { "/api": `http://localhost:${apiPort}` },
    },
  };
});
