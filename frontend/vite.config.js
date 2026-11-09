import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Port dikunci ke 5173 karena CORS di backend (main.py) hanya mengizinkan port ini dan 3000.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, strictPort: true },
});
