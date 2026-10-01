"use client"

import { X } from "lucide-react"
import { useRef, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { MAX_POST_TAGS, MAX_POST_TAG_LENGTH } from "@/lib/post-constants"

export type TagInputProps = {
  value: string[]
  onChange: (value: string[]) => void
  disabled?: boolean
  maxTags?: number
  maxLength?: number
  id?: string
}

/**
 * Free-form tag entry. Commits on Enter or comma, and normalises to
 * lower-case slugs so `/api/posts?tag=` lookups stay predictable.
 */
export function TagInput({
  value,
  onChange,
  disabled,
  maxTags = MAX_POST_TAGS,
  maxLength = MAX_POST_TAG_LENGTH,
  id,
}: TagInputProps) {
  const [draft, setDraft] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const full = value.length >= maxTags

  const commit = (raw: string) => {
    const tag = raw.trim().toLowerCase().replace(/\s+/g, "-").replace(/^#/, "")

    if (!tag) return
    if (tag.length > maxLength) return
    if (value.includes(tag) || full) return

    onChange([...value, tag])
    setDraft("")
  }

  const remove = (tag: string) => {
    onChange(value.filter((item) => item !== tag))
  }

  return (
    <div className="space-y-1.5">
      <div
        className="focus-within:border-ring focus-within:ring-ring/30 flex min-h-7 flex-wrap items-center gap-1 rounded-md border px-1.5 py-1 transition-shadow focus-within:ring-2"
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-0.5 text-[0.6875rem]">
            {tag}
            <button
              type="button"
              disabled={disabled}
              onClick={(event) => {
                event.stopPropagation()
                remove(tag)
              }}
              className="hover:text-destructive -mr-0.5 rounded-sm p-0.5"
              aria-label={`Remove tag ${tag}`}
            >
              <X className="size-2.5" />
            </button>
          </Badge>
        ))}

        {!full ? (
          <input
            ref={inputRef}
            id={id}
            value={draft}
            disabled={disabled}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={() => commit(draft)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === ",") {
                event.preventDefault()
                commit(draft)
                return
              }

              // Backspace on an empty field removes the last tag.
              if (event.key === "Backspace" && !draft && value.length > 0) {
                remove(value[value.length - 1])
              }
            }}
            placeholder={
              value.length === 0
                ? "typescript, workshop, nextjs"
                : `${value.length}/${maxTags}`
            }
            className="placeholder:text-muted-foreground/60 h-5 min-w-32 flex-1 bg-transparent px-0.5 text-xs outline-none"
          />
        ) : null}
      </div>

      <p className="text-muted-foreground text-[0.625rem]">
        {`${value.length}/${maxTags} · ${maxLength} chars max · press Enter to add`}
      </p>
    </div>
  )
}
