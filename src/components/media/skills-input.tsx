"use client"

import { Plus, X } from "lucide-react"
import { useState, type KeyboardEvent } from "react"

import { useLanguage } from "@/components/language-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const POPULAR_SUGGESTIONS = [
  "JavaScript",
  "TypeScript",
  "React",
  "Next.js",
  "Python",
  "Tailwind CSS",
  "Node.js",
  "Git & GitHub",
  "Competitive Programming",
  "C++",
  "UI/UX Design",
  "Cybersecurity",
  "Networking",
  "SQL",
  "Linux",
]

interface SkillsInputProps {
  id?: string
  skills?: string[]
  value?: string[]
  onChange: (nextSkills: string[]) => void
  disabled?: boolean
  placeholder?: string
}

export function SkillsInput({
  id = "skills-input",
  skills,
  value,
  onChange,
  disabled = false,
  placeholder,
}: SkillsInputProps) {
  const activeSkills = skills ?? value ?? []
  const { t } = useLanguage()
  const [inputValue, setInputValue] = useState("")

  function addSkill(raw: string) {
    const trimmed = raw.trim()
    if (!trimmed) return
    // Split by comma if pasted multiple
    const parts = trimmed
      .split(/[,，]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0)

    const next = [...activeSkills]
    for (const part of parts) {
      if (!next.some((existing) => existing.toLowerCase() === part.toLowerCase())) {
        next.push(part)
      }
    }
    onChange(next)
    setInputValue("")
  }

  function removeSkill(index: number) {
    onChange(activeSkills.filter((_, i) => i !== index))
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      addSkill(inputValue)
    } else if (e.key === "Backspace" && !inputValue && activeSkills.length > 0) {
      removeSkill(activeSkills.length - 1)
    }
  }

  // Filter suggestions to ones not already chosen
  const suggestions = POPULAR_SUGGESTIONS.filter(
    (s) => !activeSkills.some((existing) => existing.toLowerCase() === s.toLowerCase())
  ).slice(0, 8)

  return (
    <div className="space-y-2.5">
      {/* Current Skill Badges */}
      {activeSkills.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {activeSkills.map((skill, index) => (
            <Badge
              key={`${skill}-${index}`}
              variant="secondary"
              className="gap-1 pr-1 pl-2.5 py-1 text-xs font-medium"
            >
              <span>{skill}</span>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeSkill(index)}
                  className="rounded-full p-0.5 hover:bg-muted-foreground/20 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={t(`Remove ${skill}`, `${skill} মুছুন`)}
                >
                  <X className="size-3" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}

      {/* Input box */}
      <div className="flex gap-2">
        <Input
          id={id}
          value={inputValue}
          disabled={disabled}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            placeholder ||
            t("Type a skill and press Enter or comma...", "দক্ষতা লিখে এন্টার বা কমা চাপুন...")
          }
          className="text-xs h-9"
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled || !inputValue.trim()}
          onClick={() => addSkill(inputValue)}
          className="shrink-0 h-9 text-xs"
        >
          <Plus className="mr-1 size-3.5" />
          {t("Add", "যোগ")}
        </Button>
      </div>

      {/* Quick suggestions */}
      {!disabled && suggestions.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="text-[10px] uppercase tracking-wider font-semibold">
            {t("Suggestions:", "পরামর্শ:")}
          </span>
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => addSkill(s)}
              className="rounded-md border border-border/80 bg-background px-2 py-0.5 text-[11px] font-normal transition-colors hover:border-primary hover:text-primary"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
