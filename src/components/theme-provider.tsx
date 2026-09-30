"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ComponentProps } from "react"

// In React 19 / Next.js, next-themes injects an inline script to prevent theme flash (FOUC).
// React 19 logs a console error about script tags inside component trees.
// We suppress this specific false-positive warning in development so it doesn't trigger the Next.js dev error overlay.
if (process.env.NODE_ENV === "development" && typeof console !== "undefined") {
  const origError = console.error
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes("Encountered a script tag while rendering React component")
    ) {
      return
    }
    origError.apply(console, args)
  }
}

function ThemeProvider({
  children,
  ...props
}: ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}

export { ThemeProvider }

