export type Lang = "en" | "bn"

export const DEFAULT_LANG: Lang = "en"

export const LANG_COOKIE = "lang"

export function isLang(value: unknown): value is Lang {
  return value === "en" || value === "bn"
}

export type LocalizedText = {
  en: string
  bn: string
}

export interface TFn {
  (en: string, bn: string): string
  (text: LocalizedText): string
}

export function makeT(lang: Lang): TFn {
  const resolve = (en: string, bn: string): string => (lang === "bn" ? bn : en)

  function t(text: LocalizedText): string
  function t(en: string, bn: string): string
  function t(first: string | LocalizedText, second?: string): string {
    if (typeof first === "string") {
      return second === undefined ? first : resolve(first, second)
    }
    return resolve(first.en, first.bn)
  }

  return t
}
