import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
    plugins: [vue(), tailwindcss()],
    resolve: {
        alias: {
            "@": fileURLToPath(new URL("./web", import.meta.url)),
            "@components/": fileURLToPath(new URL("./web/components", import.meta.url)),
            "@composables/": fileURLToPath(new URL("./web/composables", import.meta.url)),
        },
    },
});
