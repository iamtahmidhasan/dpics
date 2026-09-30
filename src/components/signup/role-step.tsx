"use client"

import { AnimatePresence, motion } from "framer-motion"
import { ArrowRight, Check } from "lucide-react"

import { useLanguage } from "@/components/language-provider"
import { ROLE_OPTIONS } from "@/components/signup/signup-steps"
import { Button } from "@/components/ui/button"
import type { SelfAssignableRole } from "@/lib/roles"
import { cn } from "cn"

const EASE = [0.25, 0.1, 0.25, 1] as const

export function RoleStep({
  role,
  availableRoles,
  onSelect,
  onContinue,
}: {
  role: SelfAssignableRole | null
  availableRoles?: readonly SelfAssignableRole[]
  onSelect: (role: SelfAssignableRole) => void
  onContinue: () => void
}) {
  const { t } = useLanguage()

  const options = availableRoles
    ? ROLE_OPTIONS.filter((option) => availableRoles.includes(option.role))
    : ROLE_OPTIONS

  const isRoleValid = role !== null && options.some((opt) => opt.role === role)

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">{t("How will you join?", "কীভাবে যোগ দিবেন?")}</h1>
        <p className="text-sm text-balance text-muted-foreground">
          {t(
            "Pick the role that fits you. An administrator verifies it afterwards.",
            "আপনার সাথে মানানসই ভূমিকা বেছে নিন। পরে একজন প্রশাসক যাচাই করবেন।"
          )}
        </p>
      </div>

      {options.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          {t(
            "No roles are currently open for registration.",
            "বর্তমানে নিবন্ধনের জন্য কোনো ভূমিকা উপলব্ধ নেই।"
          )}
        </div>
      ) : (
        <div role="radiogroup" className="grid gap-3 sm:grid-cols-2">
          {options.map((option, index) => {
          const Icon = option.icon
          const isSelected = option.role === role

          return (
            <motion.button
              key={option.role}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelect(option.role)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: index * 0.06, ease: EASE }}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "relative flex flex-col items-start gap-3 rounded-lg border p-4 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/40",
                isSelected
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "border-border bg-card hover:border-ring hover:bg-muted/40"
              )}
            >
              <span
                className={cn(
                  "flex size-9 items-center justify-center rounded-md transition-colors",
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                <Icon className="size-4.5" />
              </span>

              <span className="flex flex-col gap-1">
                <span className="text-sm font-medium">{t(option.title)}</span>
                <span className="text-xs/relaxed text-muted-foreground">
                  {t(option.description)}
                </span>
              </span>

              <ul className="flex flex-col gap-1">
                {option.highlights.map((highlight) => (
                  <li key={highlight.en} className="flex items-start gap-1.5 text-xs/relaxed text-muted-foreground">
                    <Check className="mt-0.5 size-3 shrink-0 text-primary" />
                    {t(highlight)}
                  </li>
                ))}
              </ul>

              <AnimatePresence>
                {isSelected ? (
                  <motion.span
                    key="selected"
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.4, opacity: 0 }}
                    transition={{ duration: 0.18, ease: EASE }}
                    className="absolute top-3 right-3 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground"
                  >
                    <Check className="size-3" />
                  </motion.span>
                ) : null}
              </AnimatePresence>
            </motion.button>
          )
        })}
      </div>
      )}

      <div className="flex justify-end">
        <Button type="button" size="lg" onClick={onContinue} disabled={!isRoleValid}>
          {t("Continue", "পরবর্তী")}
          <ArrowRight data-icon="inline-end" />
        </Button>
      </div>
    </div>
  )
}