import { fileURLToPath, URL } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import fs from "fs"; // 引入 Node.js 的 fs 模組
import path from "path";
import { defineConfig } from "vite";

// 讀取 package.json 的版本號
const packageJson = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "package.json"), "utf-8"),
);

// https://vite.dev/config/
export default defineConfig({
    plugins: [vue(), tailwindcss()],
    resolve: {
        alias: {
            "@": fileURLToPath(new URL("./web", import.meta.url)),
            "@components": fileURLToPath(
                new URL("./web/components", import.meta.url),
            ),
            "@composables": fileURLToPath(
                new URL("./web/composables", import.meta.url),
            ),
        },
    },
    define: {
        "import.meta.env.VITE_APP_VERSION":
            JSON.stringify(packageJson.version) || "1.0.0",
    },
});
