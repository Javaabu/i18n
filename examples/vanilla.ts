import { configure, getLocale, ready, setLocale, subscribe, syncDocument, translatePage } from "@javaabu/i18n"
import { loader } from "./loader"

configure({ loader })

const render = () => {
  syncDocument()
  translatePage()
}

subscribe(render)
ready().then(render)

document.getElementById("switch")?.addEventListener("click", () => {
  setLocale(getLocale() === "dv" ? "en" : "dv")
})
