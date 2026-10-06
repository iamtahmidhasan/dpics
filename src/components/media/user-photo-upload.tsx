"use client"

import {
  AlertCircle,
  Check,
  Loader2,
  Plus,
  Upload,
  X,
} from "lucide-react"
import Image from "next/image"
import { useRef, useState } from "react"

import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { compressImage } from "@/lib/client-image-compression"
import { cn } from "cn"

export const MAX_USER_IMAGES = 5
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

interface UserPhotoUploadProps {
  images: string[]
  selectedIndex: number
  onChange: (next: { images: string[]; selectedIndex: number }) => void
  disabled?: boolean
  allowManualUrl?: boolean
}

export function UserPhotoUpload({
  images,
  selectedIndex,
  onChange,
  disabled = false,
  allowManualUrl = true,
}: UserPhotoUploadProps) {
  const { t } = useLanguage()

  const [isUploading, setIsUploading] = useState(false)
  const [isCompressing, setIsCompressing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [manualUrl, setManualUrl] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileSelected(file: File) {
    if (!file.type.startsWith("image/")) {
      setError(t("Please select an image file", "একটি ইমেজ ফাইল নির্বাচন করুন"))
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      setError(t("Image must be under 5 MB", "ছবির সাইজ সর্বোচ্চ ৫ মেগাবাইট"))
      return
    }

    if (images.length >= MAX_USER_IMAGES) {
      setError(
        t(
          `You can keep at most ${MAX_USER_IMAGES} pictures`,
          `সর্বোচ্চ ${MAX_USER_IMAGES}টি ছবি রাখা যাবে`
        )
      )
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      setIsCompressing(true)
      const compressedFile = await compressImage(file, {
        maxWidthOrHeight: 1024,
        convertToWebp: true,
      })
      setIsCompressing(false)

      const formData = new FormData()
      formData.append("file", compressedFile)
      formData.append("folder", "avatars")

      const res = await fetch("/api/upload/image", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to upload photo")

      const nextImages = [...images, data.url]
      // Automatically select the newly uploaded image as the active avatar
      onChange({
        images: nextImages,
        selectedIndex: nextImages.length - 1,
      })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsCompressing(false)
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  function handleManualAdd() {
    const val = manualUrl.trim()
    if (!val) return

    if (!val.startsWith("/") && !/^https?:\/\//.test(val)) {
      setError(t("Enter a valid URL", "একটি সঠিক লিংক দিন"))
      return
    }

    if (images.includes(val)) {
      setError(t("That picture is already added", "ছবিটি ইতিমধ্যে যোগ করা আছে"))
      return
    }

    if (images.length >= MAX_USER_IMAGES) {
      setError(
        t(
          `You can keep at most ${MAX_USER_IMAGES} pictures`,
          `সর্বোচ্চ ${MAX_USER_IMAGES}টি ছবি রাখা যাবে`
        )
      )
      return
    }

    const next = [...images, val]
    onChange({
      images: next,
      selectedIndex: next.length - 1,
    })
    setManualUrl("")
    setError(null)
  }

  function handleRemove(index: number) {
    const next = images.filter((_, idx) => idx !== index)
    const nextSelected = next.length === 0 ? 0 : Math.min(selectedIndex, next.length - 1)
    onChange({
      images: next,
      selectedIndex: nextSelected,
    })
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="flex items-center gap-1.5 rounded-md border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive">
          <AlertCircle className="size-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        disabled={disabled || isUploading || images.length >= MAX_USER_IMAGES}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFileSelected(file)
        }}
      />

      {/* Photos Grid & Upload Action */}
      <div className="flex flex-wrap items-center gap-2.5">
        {images.map((img, index) => {
          const isSelected = index === selectedIndex
          return (
            <div key={`${img}-${index}`} className="relative">
              <button
                type="button"
                onClick={() => onChange({ images, selectedIndex: index })}
                aria-label={t("Set as avatar", "অ্যাভাটার হিসেবে নির্বাচন করুন")}
                disabled={disabled}
                className={cn(
                  "relative size-16 overflow-hidden rounded-xl border-2 transition-all hover:opacity-90",
                  isSelected
                    ? "border-primary ring-2 ring-primary/30"
                    : "border-border hover:border-primary/50"
                )}
              >
                <Image
                  src={img}
                  alt="User photo"
                  fill
                  sizes="64px"
                  unoptimized
                  className="object-cover"
                />
                {isSelected && (
                  <span className="absolute right-1 bottom-1 rounded-full bg-primary p-0.5 text-primary-foreground shadow-xs">
                    <Check className="size-3" />
                  </span>
                )}
              </button>

              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  aria-label={t("Remove photo", "ছবি মুছুন")}
                  className="absolute -top-1.5 -right-1.5 rounded-full border border-border bg-background p-0.5 text-muted-foreground transition-colors hover:bg-destructive hover:text-white"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
          )
        })}

        {/* Upload Button Tile */}
        {images.length < MAX_USER_IMAGES && !disabled && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className={cn(
              "flex size-16 flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/80 bg-muted/20 text-muted-foreground transition-all hover:border-primary/60 hover:bg-muted/40 hover:text-foreground",
              isUploading && "pointer-events-none opacity-60"
            )}
          >
            {isUploading ? (
              <div className="flex flex-col items-center">
                <Loader2 className="size-4 animate-spin text-primary" />
                <span className="mt-1 text-[9px] font-medium leading-none text-primary">
                  {isCompressing ? t("Optimizing", "অপ্টিমাইজ") : t("Uploading", "আপলোড")}
                </span>
              </div>
            ) : (
              <>
                <Upload className="size-4 text-primary" />
                <span className="mt-1 text-[10px] font-medium leading-none">
                  {t("Upload", "আপলোড")}
                </span>
              </>
            )}
          </button>
        )}
      </div>

      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>
          {images.length === 0
            ? t("Upload a photo to use as your profile avatar", "অ্যাভাটার হিসেবে একটি ছবি আপলোড করুন")
            : t("Click a photo to set it as your active avatar", "ছবিতে ক্লিক করে সক্রিয় অ্যাভাটার বেছে নিন")}
        </span>

        {allowManualUrl && !disabled && images.length < MAX_USER_IMAGES && (
          <button
            type="button"
            className="text-primary hover:underline"
            onClick={() => setShowUrlInput(!showUrlInput)}
          >
            {showUrlInput ? t("Cancel URL", "বাতিল") : t("Or paste URL", "বা লিংক দিন")}
          </button>
        )}
      </div>

      {showUrlInput && (
        <div className="flex gap-2 pt-1">
          <Input
            value={manualUrl}
            onChange={(e) => {
              setManualUrl(e.target.value)
              setError(null)
            }}
            placeholder="https://example.com/photo.jpg"
            className="h-8 text-xs font-mono"
            disabled={disabled || images.length >= MAX_USER_IMAGES}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 text-xs shrink-0"
            onClick={handleManualAdd}
            disabled={disabled || !manualUrl.trim() || images.length >= MAX_USER_IMAGES}
          >
            <Plus className="mr-1 size-3.5" />
            {t("Add", "যোগ")}
          </Button>
        </div>
      )}
    </div>
  )
}
