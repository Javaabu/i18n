import { subscribe, syncDocument } from "@javaabu/i18n"
import { i18n } from "@javaabu/i18n/vue"
import { createApp } from "vue"
import App from "./App.vue"
import { loader } from "./loader"

subscribe(syncDocument)

createApp(App).use(i18n, { loader }).mount("#app")
