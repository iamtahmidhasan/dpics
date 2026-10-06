"use client"

import {
  AlertCircle,
  ExternalLink,
  FileText,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react"
import Image from "next/image"
import { useRef, useState } from "react"

import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { MAX_MEDIA_FILE_SIZE } from "@/lib/media-constants"
import { compressImage } from "@/lib/client-image-compression"
import { cn } from "cn"

interface DocumentUploadFieldProps {
  id?: string
  label: string
  value: string
  onChange: (url: string) => void
  disabled?: boolean
  helpText?: string
  placeholder?: string
  className?: string
}

export function DocumentUploadField({
  id,
  label,
  value,
  onChange,
  disabled = false,
  helpText,
  placeholder,
  className,
}: DocumentUploadFieldProps) {
  const { t } = useLanguage()

  const [isUploading, setIsUploading] = useState(false)
  const [isCompressing, setIsCompressing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showUrlInput, setShowUrlInput] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileSelected(file: File) {
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      setError(t("Please select an image or PDF file", "ইমেজ বা পিডিএফ ফাইল নির্বাচন করুন"))
      return
    }

    if (file.size > MAX_MEDIA_FILE_SIZE) {
      setError(t("File exceeds 10 MB limit", "ফাইল সাইজ সর্বোচ্চ ১০ এমবি"))
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      let fileToUpload = file
      if (file.type.startsWith("image/")) {
        setIsCompressing(true)
        fileToUpload = await compressImage(file)
        setIsCompressing(false)
      }

      const formData = new FormData()
      formData.append("file", fileToUpload)
      formData.append("folder", "documents")

      // Upload via user image upload
      const res = await fetch("/api/upload/image", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to upload file")

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
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-xs font-medium">
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

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        disabled={disabled || isUploading}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFileSelected(file)
        }}
      />

      {value ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/20 p-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            {value.match(/\.(jpeg|jpg|png|webp|gif|svg)$/i) || value.includes("ik.imagekit.io") ? (
              <div className="relative size-10 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                <Image
                  src={value}
                  alt={label}
                  fill
                  sizes="40px"
                  unoptimized
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground">
                <FileText className="size-5" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <span className="truncate block font-mono text-xs">{value}</span>
              <a
                href={value}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline"
              >
                {t("View file", "ফাইল দেখুন")}
                <ExternalLink className="size-2.5" />
              </a>
            </div>
          </div>

          {!disabled && (
            <div className="flex shrink-0 items-center gap-1">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <Upload className="mr-1 size-3" />
                {t("Replace", "পরিবর্তন")}
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="size-7 text-destructive hover:bg-destructive/10"
                onClick={() => onChange("")}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2 rounded-lg border border-dashed border-border/80 bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-0.5">
            <p className="text-xs font-medium">
              {placeholder || t("No document uploaded yet", "কোনো ডকুমেন্ট আপলোড করা হয়নি")}
            </p>
            {helpText ? (
              <p className="text-[11px] text-muted-foreground">{helpText}</p>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-1.5 size-3 animate-spin" />
                  {isCompressing
                    ? t("Optimizing...", "অপ্টিমাইজ...")
                    : t("Uploading...", "আপলোড হচ্ছে...")}
                </>
              ) : (
                <>
                  <Upload className="mr-1.5 size-3 text-primary" />
                  {t("Upload File", "ফাইল আপলোড")}
                </>
              )}
            </Button>
            <button
              type="button"
              className="text-[11px] text-muted-foreground hover:text-foreground hover:underline"
              onClick={() => setShowUrlInput(!showUrlInput)}
            >
              {showUrlInput ? t("Hide URL", "লুকান") : t("Or URL", "বা লিংক")}
            </button>
          </div>
        </div>
      )}

      {showUrlInput && (
        <div className="pt-1">
          <input
            type="url"
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://..."
            className="border-input placeholder:text-muted-foreground/60 focus-visible:ring-ring flex h-8 w-full rounded-md border bg-background px-2.5 text-xs font-mono shadow-xs transition-colors focus-visible:ring-1 focus-visible:outline-hidden"
          />
        </div>
      )}
    </div>
  )
}
