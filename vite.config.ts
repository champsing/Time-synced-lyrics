import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
    plugins: [vue(), tailwindcss()],
    resolve: {
        alias: {
            "@": fileURLToPath(new URL("./web2", import.meta.url)),
            "@components/": fileURLToPath(new URL("./web2/components", import.meta.url)),
            "@composables/": fileURLToPath(new URL("./web2/composables", import.meta.url)),
        },
    },
});
