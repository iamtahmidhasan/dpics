"use client"

import { Check } from "lucide-react"
import Image from "next/image"

import { useLanguage } from "@/components/language-provider"
import { COVER_IMAGES, resolveCoverImage } from "@/lib/cover-images"
import { cn } from "cn"

interface CoverImagePickerProps {
  value: string | number | null | undefined
  onChange: (nextId: string) => void
  disabled?: boolean
  showPreview?: boolean
}

export function CoverImagePicker({
  value,
  onChange,
  disabled = false,
  showPreview = true,
}: CoverImagePickerProps) {
  const { lang, t } = useLanguage()
  const isBn = lang === "bn"
  const currentId = String(value || "1").trim()
  const currentCoverPath = resolveCoverImage(currentId)

  return (
    <div className="space-y-3">
      {/* Active Preview Banner */}
      {showPreview && (
        <div className="relative h-28 sm:h-36 w-full overflow-hidden rounded-xl border border-border/80 bg-muted shadow-xs">
          <Image
            src={currentCoverPath}
            alt="Selected cover preview"
            fill
            unoptimized
            className="object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-xs text-white">
            <span className="font-medium tracking-wide drop-shadow-xs">
              {t("Cover Banner Preview", "কভার ব্যানার প্রিভিউ")}
            </span>
            <span className="text-[11px] text-white/80">
              {COVER_IMAGES.find((c) => c.id === currentId)?.name[isBn ? "bn" : "en"] || "Cover"}
            </span>
          </div>
        </div>
      )}

      {/* Grid of 10 Cover Thumbnails */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {COVER_IMAGES.map((cover) => {
          const isSelected = cover.id === currentId

          return (
            <button
              key={cover.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(cover.id)}
              className={cn(
                "group relative aspect-16/9 overflow-hidden rounded-lg border-2 text-left transition-all hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                isSelected
                  ? "border-primary ring-2 ring-primary/40 shadow-xs"
                  : "border-border hover:border-primary/50"
              )}
            >
              <Image
                src={cover.path}
                alt={cover.name[isBn ? "bn" : "en"]}
                fill
                unoptimized
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />

              {/* Title & selection check */}
              <div className="absolute inset-0 p-1.5 flex flex-col justify-between">
                <div className="flex justify-end">
                  {isSelected && (
                    <span className="flex size-4.5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xs">
                      <Check className="size-3" />
                    </span>
                  )}
                </div>
                <span className="truncate text-[10px] font-semibold text-white drop-shadow-md">
                  {cover.name[isBn ? "bn" : "en"]}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
