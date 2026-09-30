"use client"

import { Check, X } from "lucide-react"
import Image from "next/image"

import { useLanguage } from "@/components/language-provider"

export const MAX_IMAGES = 5

/** Root-relative paths and http(s) urls only, matching `toUrl` on the server. */
export function isImageSource(value: string): boolean {
  return value.startsWith("/") || /^https?:\/\//.test(value)
}

/**
 * Picks which of the saved pictures is used as the avatar. Adding and removing
 * links is the caller's job, because only the caller owns the picture list.
 */
export function PicturePicker({
  images,
  selectedIndex,
  onSelect,
  onRemove,
}: {
  images: string[]
  selectedIndex: number
  onSelect: (index: number) => void
  onRemove: (index: number) => void
}) {
  const { t } = useLanguage()

  if (images.length === 0) {
    return (
      <p className="text-xs/relaxed text-muted-foreground">
        {t("No picture yet.", "এখনো কোনো ছবি নেই।")}
      </p>
    )
  }

  return (
    <ul className="flex flex-wrap gap-2">
      {images.map((image, index) => {
        const isSelected = index === selectedIndex

        return (
          <li key={image} className="relative">
            <button
              type="button"
              onClick={() => onSelect(index)}
              aria-pressed={isSelected}
              aria-label={t("Use this picture", "এই ছবিটি ব্যবহার করুন")}
              className={`size-14 overflow-hidden rounded-md border-2 transition-colors ${
                isSelected ? "border-primary" : "border-border hover:border-ring"
              }`}
            >
              <Image
                src={image}
                alt=""
                width={56}
                height={56}
                unoptimized
                className="size-full object-cover"
              />
              {isSelected && (
                <span className="absolute right-0.5 bottom-0.5 rounded-full bg-primary p-0.5 text-primary-foreground">
                  <Check className="size-2.5" />
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => onRemove(index)}
              aria-label={t("Remove this picture", "এই ছবিটি সরান")}
              className="absolute -top-1.5 -right-1.5 rounded-full border border-border bg-background p-0.5 text-muted-foreground transition-colors hover:text-destructive"
            >
              <X className="size-2.5" />
            </button>
          </li>
        )
      })}
    </ul>
  )
}