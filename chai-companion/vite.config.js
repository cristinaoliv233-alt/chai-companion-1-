import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Em desenvolvimento, o Vite encaminha /api para o servidor da Chai (porta 3001).
export default defineConfig({
  plugins: [react()],
  server: { proxy: { "/api": "http://localhost:3001" } },
});
