/** Bundles every lang/*.json and fetches them on demand. */
const files = import.meta.glob("./lang/*.json")

export const loader = (locale: string) => files[`./lang/${locale}.json`]?.()
