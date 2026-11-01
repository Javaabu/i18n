import { configure, syncDocument, subscribe } from "@javaabu/i18n"
import { useTranslation } from "@javaabu/i18n/react"
import { createRoot } from "react-dom/client"
import { loader } from "./loader"

configure({ loader })
subscribe(syncDocument)

function Text({ name, label }: { name: string; label: string }) {
  return (
    <>
      <label htmlFor={name}>{label}</label>
      <input id={name} name={name} placeholder={label} />
    </>
  )
}

function App() {
  const { __, trans_choice, locale, setLocale } = useTranslation()

  return (
    <>
      <nav>
        <button id="switch" onClick={() => setLocale(locale === "dv" ? "en" : "dv")}>
          {__("Switch language")}
        </button>
      </nav>
      <h1>{__("Welcome, :name!", { name: "Ali" })}</h1>
      <p>{trans_choice("messages.unread", 3)}</p>
      <Text name="message" label={__("Message")} />
    </>
  )
}

createRoot(document.getElementById("app") as HTMLElement).render(<App />)
