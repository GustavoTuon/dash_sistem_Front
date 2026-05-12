import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  preview: {
    allowedHosts: [
      "n8n-evolution-dash-sistem-front.eupgpd.easypanel.host",
    ],
  },
});
