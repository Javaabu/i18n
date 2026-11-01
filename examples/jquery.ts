import { configure, ready, subscribe, syncDocument } from "@javaabu/i18n"
import { installJQuery } from "@javaabu/i18n/jquery"
import $ from "jquery"
import { loader } from "./loader"

installJQuery($)
configure({ loader })

const render = () => {
  syncDocument()
  $("body").translate()
}

subscribe(render)
ready().then(render)

$("#switch").on("click", () => {
  $.i18n.setLocale($.i18n.getLocale() === "dv" ? "en" : "dv")
})

declare global {
  interface JQuery {
    translate(): this
  }

  interface JQueryStatic {
    i18n: typeof import("@javaabu/i18n").translator
  }
}
