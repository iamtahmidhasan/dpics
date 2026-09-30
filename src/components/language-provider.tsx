"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"

import {
  DEFAULT_LANG,
  LANG_COOKIE,
  makeT,
  type Lang,
  type TFn,
} from "@/lib/i18n"

type LanguageContextValue = {
  lang: Lang
  t: TFn
  setLang: (lang: Lang) => void
}

const fallbackT = makeT(DEFAULT_LANG)

const LanguageContext = createContext<LanguageContextValue>({
  lang: DEFAULT_LANG,
  t: fallbackT,
  setLang: () => {},
})

export function useLanguage(): LanguageContextValue {
  return useContext(LanguageContext)
}

export function LanguageProvider({
  lang: initialLang,
  children,
}: {
  lang: Lang
  children: React.ReactNode
}) {
  const [lang, setCurrentLang] = useState<Lang>(initialLang)

  useEffect(() => {
    const root = document.documentElement
    root.lang = lang
    root.dataset.lang = lang
  }, [lang])

  const value = useMemo<LanguageContextValue>(
    () => ({
      lang,
      t: makeT(lang),
      setLang: (next: Lang) => {
        document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`
        setCurrentLang(next)
      },
    }),
    [lang]
  )

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}
