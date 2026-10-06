"use client"

import { useLanguage } from "@/components/language-provider"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { BLOOD_GROUPS } from "@/lib/blood-groups"

interface BloodGroupSelectProps {
  id?: string
  value: string | null | undefined
  onChange: (val: string) => void
  disabled?: boolean
  error?: string
  hint?: string
}

export function BloodGroupSelect({
  id = "blood-group",
  value = "",
  onChange,
  disabled = false,
  error,
  hint,
}: BloodGroupSelectProps) {
  const { t } = useLanguage()
  const placeholder = t("Select blood group...", "রক্তের গ্রুপ নির্বাচন করুন...")
  const selected = value === "" || value == null ? null : value

  const items = [
    { value: null as string | null, label: placeholder },
    ...BLOOD_GROUPS.map((bg) => ({ value: bg, label: bg })),
  ]

  return (
    <Field data-invalid={!!error}>
      <FieldLabel htmlFor={id}>{t("Blood group", "রক্তের গ্রুপ")}</FieldLabel>
      <Select
        items={items}
        value={selected}
        onValueChange={(next) => onChange(next ?? "")}
        disabled={disabled}
      >
        <SelectTrigger id={id} className="w-full" aria-invalid={!!error}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent align="start">
          <SelectItem value={null}>{placeholder}</SelectItem>
          {BLOOD_GROUPS.map((bg) => (
            <SelectItem key={bg} value={bg}>
              {bg}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error ? (
        <FieldError>{error}</FieldError>
      ) : hint ? (
        <FieldDescription>{hint}</FieldDescription>
      ) : null}
    </Field>
  )
}
