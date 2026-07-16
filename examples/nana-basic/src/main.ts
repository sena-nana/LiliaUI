import { createApp } from "vue";
import "@lilia/nana-ui/styles.css";
import App from "./App.vue";
import { router } from "./router";
import "./styles.css";

createApp(App).use(router).mount("#app");
