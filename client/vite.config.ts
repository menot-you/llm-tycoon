import { defineConfig } from "vite";
import preact from "@preact/preset-vite";

// Client config — thin renderer para o server Rust.
// Dev server conecta no backend em localhost:4000 (configurável via VITE_WS_URL).
export default defineConfig({
  plugins: [preact()],
  server: {
    port: 5173,
    strictPort: false,
  },
  build: {
    target: "es2022",
    outDir: "dist",
    emptyOutDir: true,
  },
});
