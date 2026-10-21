import { Switch } from "@/components/ui/switch"
import { cn } from "cn"

export type ToggleRowProps = {
  id: string
  label: string
  description: string
  checked: boolean
  disabled?: boolean
  onChange: (checked: boolean) => void
}

export function ToggleRow({ id, label, description, checked, disabled, onChange }: ToggleRowProps) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 rounded-lg border border-border/80 p-3.5 transition-colors",
        disabled ? "opacity-60 bg-muted/30" : "bg-card hover:border-ring/40"
      )}
    >
      <div className="space-y-1">
        <label
          htmlFor={id}
          className={cn(
            "text-xs/relaxed font-medium block",
            disabled ? "cursor-not-allowed text-muted-foreground" : "cursor-pointer text-foreground"
          )}
        >
          {label}
        </label>
        <p className="text-xs/relaxed text-muted-foreground">{description}</p>
      </div>
      <Switch id={id} checked={checked} disabled={disabled} onCheckedChange={onChange} />
    </div>
  )
}
