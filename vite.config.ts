import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import fs from "fs";

function copyIfcWasmPlugin() {
  return {
    name: 'copy-ifc-wasm',
    buildStart() {
      const srcDir = path.resolve(__dirname, 'node_modules/web-ifc');
      const destDir = path.resolve(__dirname, 'public');
      if (!fs.existsSync(destDir)) fs.mkdirSync(destDir);
      ['web-ifc.wasm', 'web-ifc-mt.wasm'].forEach(file => {
        const src = path.join(srcDir, file);
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, path.join(destDir, file));
        }
      });
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), copyIfcWasmPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "web-ifc$": path.resolve(__dirname, "node_modules/web-ifc/web-ifc-api.js"),
    },
  },
  optimizeDeps: {
    exclude: ['web-ifc', 'web-ifc-babylon']
  }
});
