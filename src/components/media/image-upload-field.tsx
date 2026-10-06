"use client"

import {
  AlertCircle,
  FolderOpen,
  Image as ImageIcon,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react"
import Image from "next/image"
import { useRef, useState } from "react"

import { useLanguage } from "@/components/language-provider"
import { MediaPickerModal } from "@/components/media/media-picker-modal"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  MAX_MEDIA_FILE_SIZE,
  type MediaFolderId,
} from "@/lib/media-constants"
import { compressImage } from "@/lib/client-image-compression"
import { cn } from "cn"

interface ImageUploadFieldProps {
  id?: string
  label: string
  value: string
  onChange: (url: string) => void
  disabled?: boolean
  aspectRatio?: "video" | "square" | "wide"
  placeholder?: string
  helpText?: string
  allowLibrary?: boolean
  defaultFolder?: MediaFolderId
  className?: string
}

export function ImageUploadField({
  id,
  label,
  value,
  onChange,
  disabled = false,
  aspectRatio = "video",
  placeholder,
  helpText,
  allowLibrary = true,
  defaultFolder,
  className,
}: ImageUploadFieldProps) {
  const { t } = useLanguage()

  const [isUploading, setIsUploading] = useState(false)
  const [isCompressing, setIsCompressing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [showUrlInput, setShowUrlInput] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const aspectClass =
    aspectRatio === "video"
      ? "aspect-video"
      : aspectRatio === "wide"
        ? "aspect-[2/1]"
        : "aspect-square"

  async function handleFileSelected(file: File) {
    if (!file.type.startsWith("image/")) {
      setError(t("Please select an image file", "একটি ইমেজ ফাইল নির্বাচন করুন"))
      return
    }

    if (file.size > MAX_MEDIA_FILE_SIZE) {
      setError(t("Image exceeds 10 MB limit", "ছবির সাইজ ১০ এমবির বেশি"))
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      setIsCompressing(true)
      const compressedFile = await compressImage(file)
      setIsCompressing(false)

      const formData = new FormData()
      formData.append("file", compressedFile)

      const targetFolder = defaultFolder || (allowLibrary ? "general" : "posts")
      formData.append("folder", targetFolder)

      const endpoint = allowLibrary ? "/api/admin/media" : "/api/upload/image"
      const res = await fetch(endpoint, {
        method: "POST",
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to upload image")

      onChange(data.url)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsCompressing(false)
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-xs font-semibold">
          {label}
        </Label>
        {value && !disabled ? (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-[11px] text-destructive hover:underline"
          >
            {t("Remove", "মুছুন")}
          </button>
        ) : null}
      </div>

      {error ? (
        <div className="flex items-center gap-1.5 rounded-md border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive">
          <AlertCircle className="size-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        disabled={disabled || isUploading}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFileSelected(file)
        }}
      />

      {value ? (
        /* Preview Card */
        <div className="relative overflow-hidden rounded-xl border border-border bg-card">
          <div className={cn("relative w-full overflow-hidden bg-muted/40", aspectClass)}>
            <Image
              src={value}
              alt={label}
              fill
              sizes="(max-width: 768px) 100vw, 500px"
              className="object-cover"
            />
            {/* Top right badges / actions */}
            <div className="absolute top-2 right-2 flex items-center gap-1.5 rounded-md bg-black/60 p-1 backdrop-blur-xs">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-[10px] text-white hover:bg-white/20 hover:text-white"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || isUploading}
              >
                <Upload className="mr-1 size-3" />
                {t("Replace", "পরিবর্তন")}
              </Button>
              {allowLibrary && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-[10px] text-white hover:bg-white/20 hover:text-white"
                  onClick={() => setPickerOpen(true)}
                  disabled={disabled}
                >
                  <FolderOpen className="mr-1 size-3" />
                  {t("Library", "লাইব্রেরি")}
                </Button>
              )}
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="size-6 text-red-400 hover:bg-red-500/20 hover:text-red-300"
                onClick={() => onChange("")}
                disabled={disabled}
              >
                <Trash2 className="size-3" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-border/80 px-3 py-1.5 text-[11px] text-muted-foreground">
            <span className="truncate max-w-[280px] font-mono">{value}</span>
            <button
              type="button"
              className="text-primary hover:underline"
              onClick={() => setShowUrlInput(!showUrlInput)}
            >
              {showUrlInput ? t("Hide URL", "ইউআরএল লুকান") : t("Edit URL", "ইউআরএল এডিট")}
            </button>
          </div>
        </div>
      ) : (
        /* Empty Upload & Pick Zone */
        <div className="space-y-2">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              const file = e.dataTransfer.files?.[0]
              if (file) handleFileSelected(file)
            }}
            className={cn(
              "flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/80 bg-muted/20 p-5 text-center transition-all",
              disabled && "opacity-60 cursor-not-allowed"
            )}
          >
            {isUploading ? (
              <div className="flex flex-col items-center gap-2 py-4">
                <Loader2 className="size-7 animate-spin text-primary" />
                <p className="text-xs font-semibold">
                  {isCompressing
                    ? t("Optimizing (WebP)...", "ওয়েবপিতে অপ্টিমাইজ হচ্ছে...")
                    : t("Uploading to ImageKit...", "ইমেজকিটে আপলোড হচ্ছে...")}
                </p>
              </div>
            ) : (
              <>
                <div className="mb-2 rounded-full border border-border bg-background p-2 text-primary shadow-xs">
                  <ImageIcon className="size-4" />
                </div>
                <p className="text-xs font-semibold">
                  {placeholder || t("Drag & drop an image, or choose an option", "ছবি টেনে আনুন অথবা নিচে থেকে বাছাই করুন")}
                </p>
                <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="default"
                    className="h-7 text-xs font-medium"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled}
                  >
                    <Upload className="mr-1.5 size-3" />
                    {t("Upload Image", "ছবি আপলোড")}
                  </Button>
                  {allowLibrary && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs font-medium"
                      onClick={() => setPickerOpen(true)}
                      disabled={disabled}
                    >
                      <FolderOpen className="mr-1.5 size-3" />
                      {t("Media Library", "লাইব্রেরি")}
                    </Button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="text-[11px] text-muted-foreground hover:text-foreground hover:underline"
                  >
                    {t("Enter URL manually", "ম্যানুয়াল লিংক")}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Manual URL Input dropdown / toggle */}
      {showUrlInput && (
        <div className="space-y-1 pt-1">
          <input
            type="url"
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://ik.imagekit.io/... or https://images.unsplash.com/..."
            className="border-input placeholder:text-muted-foreground/60 focus-visible:ring-ring flex h-8 w-full rounded-md border bg-background px-2.5 text-xs font-mono shadow-xs transition-colors focus-visible:ring-1 focus-visible:outline-hidden"
          />
        </div>
      )}

      {helpText ? (
        <p className="text-[11px] text-muted-foreground">{helpText}</p>
      ) : null}

      {/* Media Picker Modal */}
      {allowLibrary && (
        <MediaPickerModal
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          onSelect={(url) => onChange(url)}
          title={`${t("Select", "নির্বাচন করুন")} ${label}`}
          defaultFolder={defaultFolder}
        />
      )}
    </div>
  )
}
