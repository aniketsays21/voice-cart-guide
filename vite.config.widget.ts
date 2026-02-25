import { defineConfig } from "vite";
import { resolve } from "path";

// Separate Vite config to build the embeddable widget as a single IIFE bundle.
// Build command: npx vite build --config vite.config.widget.ts

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, "src/embed/index.ts"),
      name: "AIChatWidget",
      fileName: () => "ai-chat-widget.js",
      formats: ["iife"],
    },
    outDir: "dist-widget",
    emptyOutDir: true,
    minify: "terser",
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
