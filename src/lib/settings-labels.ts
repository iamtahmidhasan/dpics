import type { LocalizedText, TFn } from "@/lib/i18n"

export type PaymentNumberField =
  | "bkashPersonalNumber"
  | "bkashAgentNumber"
  | "nagadPersonalNumber"
  | "nagadAgentNumber"
  | "rocketPersonalNumber"
  | "rocketAgentNumber"

export type PaymentProvider = "bkash" | "nagad" | "rocket"

export const PAYMENT_PROVIDER_LABELS: Record<PaymentProvider, LocalizedText> = {
  bkash: { en: "bKash", bn: "বিকাশ" },
  nagad: { en: "Nagad", bn: "নগদ" },
  rocket: { en: "Rocket", bn: "রকেট" },
}

export const ACCOUNT_TYPE_LABELS = {
  personal: { en: "Personal", bn: "পার্সোনাল" },
  agent: { en: "Agent", bn: "এজেন্ট" },
} as const

export const PAYMENT_NUMBER_LABELS: Record<PaymentNumberField, LocalizedText> = {
  bkashPersonalNumber: { en: "bKash Personal", bn: "বিকাশ পার্সোনাল" },
  bkashAgentNumber: { en: "bKash Agent", bn: "বিকাশ এজেন্ট" },
  nagadPersonalNumber: { en: "Nagad Personal", bn: "নগদ পার্সোনাল" },
  nagadAgentNumber: { en: "Nagad Agent", bn: "নগদ এজেন্ট" },
  rocketPersonalNumber: { en: "Rocket Personal", bn: "রকেট পার্সোনাল" },
  rocketAgentNumber: { en: "Rocket Agent", bn: "রকেট এজেন্ট" },
}

export function paymentNumberLabel(t: TFn): (field: PaymentNumberField) => string {
  return (field) => (PAYMENT_NUMBER_LABELS[field] ? t(PAYMENT_NUMBER_LABELS[field]) : field)
}

export function paymentProviderLabel(t: TFn): (provider: PaymentProvider) => string {
  return (provider) =>
    PAYMENT_PROVIDER_LABELS[provider] ? t(PAYMENT_PROVIDER_LABELS[provider]) : provider
}
