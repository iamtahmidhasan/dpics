import type { Lang } from "@/lib/i18n"

/**
 * Formats a whole Taka amount into localized currency representation (e.g. ৳500 or ৳৫০০).
 */
export function formatTaka(amount: number, lang: Lang | string = "en"): string {
  const locale = lang === "bn" ? "bn-BD" : "en-US"
  const formatted = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
  }).format(amount)

  return `৳${formatted}`
}
