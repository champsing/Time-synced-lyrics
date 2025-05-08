import { createApp } from "vue";
import { main } from "./player/main.js";

const app = createApp({
    setup() { return main() },
});

app.mount("#app");
