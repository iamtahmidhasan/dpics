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

/**
 * Formats an ISO date string or Date into localized date representation.
 */
export function formatDate(
  value: string | Date | null | undefined,
  locale: string = "en-US",
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium" }
): string {
  if (!value) return "—"
  const date = typeof value === "string" ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return "—"
  return new Intl.DateTimeFormat(locale, options).format(date)
}
