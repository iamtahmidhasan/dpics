"use client"

import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export const textareaClassName =
  "w-full resize-y rounded-md border border-input bg-input/20 px-2 py-1.5 text-xs/relaxed outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 dark:bg-input/30"

/** `2026-02-04T13:05` in the viewer's own timezone, which is what the input wants. */
export function toDateTimeLocal(value: string | null): string {
  if (!value) return ""

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return ""

  const pad = (part: number) => String(part).padStart(2, "0")

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`
}

/** The browser sends a local datetime; the API expects an ISO instant. */
export function fromDateTimeLocal(value: string): string | null {
  if (!value) return null

  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? value : date.toISOString()
}

type EnumSelectProps<T extends string> = {
  id: string
  label: string
  value: T
  options: readonly T[]
  onChange: (value: T) => void
  labelFor?: (value: T) => string
  error?: string
  disabled?: boolean
  hint?: string
  /** Renders an extra blank option for nullable enums. */
  allowEmpty?: boolean
  emptyLabel?: string
}

/**
 * Enum dropdown. `items` is passed to the root as well as rendering the list,
 * because the popup only mounts while it is open — without `items` the trigger
 * would have no label for the value it is holding.
 */
export function EnumSelect<T extends string>({
  id,
  label,
  value,
  options,
  onChange,
  labelFor,
  error,
  disabled,
  hint,
  allowEmpty,
  emptyLabel,
}: EnumSelectProps<T>) {
  const describe = (option: T) => (labelFor ? labelFor(option) : option)
  const selected = value === "" || value == null ? null : value

  const items = [
    ...(allowEmpty ? [{ value: null as T | null, label: emptyLabel ?? "" }] : []),
    ...options.map((option) => ({ value: option, label: describe(option) })),
  ]

  return (
    <Field data-invalid={!!error}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select
        items={items}
        value={selected}
        onValueChange={(next) => onChange((next ?? "") as T)}
        disabled={disabled}
      >
        <SelectTrigger id={id} className="w-full" aria-invalid={!!error}>
          <SelectValue placeholder={emptyLabel} />
        </SelectTrigger>
        <SelectContent align="start">
          {allowEmpty ? <SelectItem value={null}>{emptyLabel ?? ""}</SelectItem> : null}
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {describe(option)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hint && !error ? <FieldDescription>{hint}</FieldDescription> : null}
      {error ? <FieldError>{error}</FieldError> : null}
    </Field>
  )
}

type TextFieldProps = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  type?: "text" | "email" | "tel" | "url" | "datetime-local" | "date"
  placeholder?: string
  error?: string
  hint?: string
  disabled?: boolean
  required?: boolean
  autoComplete?: string
}

export function TextField({
  id,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  error,
  hint,
  disabled,
  required,
  autoComplete,
}: TextFieldProps) {
  return (
    <Field data-invalid={!!error}>
      <FieldLabel htmlFor={id}>
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </FieldLabel>
      <Input
        id={id}
        name={id}
        type={type}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        autoComplete={autoComplete}
        aria-invalid={!!error}
        onChange={(event) => onChange(event.target.value)}
      />
      {hint && !error ? <FieldDescription>{hint}</FieldDescription> : null}
      {error ? <FieldError>{error}</FieldError> : null}
    </Field>
  )
}

type TextAreaFieldProps = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  error?: string
  hint?: string
  rows?: number
}

export function TextAreaField({
  id,
  label,
  value,
  onChange,
  placeholder,
  error,
  hint,
  rows = 3,
}: TextAreaFieldProps) {
  return (
    <Field data-invalid={!!error}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <textarea
        id={id}
        name={id}
        rows={rows}
        value={value}
        placeholder={placeholder}
        aria-invalid={!!error}
        className={textareaClassName}
        onChange={(event) => onChange(event.target.value)}
      />
      {hint && !error ? <FieldDescription>{hint}</FieldDescription> : null}
      {error ? <FieldError>{error}</FieldError> : null}
    </Field>
  )
}

type CheckboxFieldProps = {
  id: string
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  hint?: string
  disabled?: boolean
}

export function CheckboxField({ id, label, checked, onChange, hint, disabled }: CheckboxFieldProps) {
  return (
    <Field>
      <label htmlFor={id} className="flex cursor-pointer items-start gap-2">
        <input
          id={id}
          name={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
          className="mt-0.5 size-3.5 shrink-0 rounded border-input accent-primary disabled:cursor-not-allowed disabled:opacity-60"
        />
        <span className="flex flex-col gap-0.5">
          <span className="text-xs/relaxed font-medium">{label}</span>
          {hint ? <FieldDescription>{hint}</FieldDescription> : null}
        </span>
      </label>
    </Field>
  )
}

/** Label / value pair for the read-only panels. */
export function DetailRow({
  label,
  value,
  mono,
}: {
  label: string
  value: React.ReactNode
  mono?: boolean
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-muted-foreground">{label}</span>
      <span className={mono ? "font-mono text-[0.6875rem] break-all" : "font-medium"}>
        {value ?? "—"}
      </span>
    </div>
  )
}