"use client"

import {
  AlertCircle,
  Check,
  Globe,
  ImageIcon,
  Images,
  Loader2,
  Search,
  Upload,
} from "lucide-react"
import Image from "next/image"
import { useEffect, useState } from "react"

import { useLanguage } from "@/components/language-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  formatBytes,
  MAX_MEDIA_FILE_SIZE,
  MEDIA_FOLDERS,
  type MediaFolderId,
  type MediaItemSummary,
} from "@/lib/media-constants"
import { compressImage } from "@/lib/client-image-compression"
import { cn } from "cn"

interface MediaPickerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (url: string, alt?: string) => void
  title?: string
  defaultFolder?: MediaFolderId
}

export function MediaPickerModal({
  open,
  onOpenChange,
  onSelect,
  title,
  defaultFolder = "all",
}: MediaPickerModalProps) {
  const { t } = useLanguage()

  const [tab, setTab] = useState<"library" | "upload" | "url">("library")
  const [items, setItems] = useState<MediaItemSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [selectedFolder, setSelectedFolder] = useState<MediaFolderId>(defaultFolder)
  const [uploadFolder, setUploadFolder] = useState<string>(
    defaultFolder !== "all" ? defaultFolder : "general"
  )
  const [selectedItem, setSelectedItem] = useState<MediaItemSummary | null>(null)

  // Direct URL state
  const [customUrl, setCustomUrl] = useState("")
  const [customAlt, setCustomAlt] = useState("")

  // Upload state
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isCompressing, setIsCompressing] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadAlt, setUploadAlt] = useState("")

  // Reset state when closing dialog
  function handleClose(nextOpen: boolean) {
    if (!nextOpen) {
      setSelectedItem(null)
      setCustomUrl("")
      setCustomAlt("")
      setUploadError(null)
      setUploadAlt("")
    }
    onOpenChange(nextOpen)
  }

  // Load items when modal opens
  useEffect(() => {
    if (!open || items !== null) return

    let active = true
    fetch("/api/admin/media")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load media library")
        return res.json()
      })
      .then((data) => {
        if (active) {
          setItems(data.items || [])
        }
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof Error ? err.message : String(err))
        }
      })

    return () => {
      active = false
    }
  }, [open, items])

  // Handle direct file upload
  async function handleFileUpload(file: File) {
    if (!file.type.startsWith("image/")) {
      setUploadError(t("Please select a valid image file", "সঠিক ইমেজ ফাইল নির্বাচন করুন"))
      return
    }
    if (file.size > MAX_MEDIA_FILE_SIZE) {
      setUploadError(t("File exceeds 10 MB limit", "ফাইল সাইজ সর্বোচ্চ ১০ এমবি"))
      return
    }

    setIsUploading(true)
    setUploadError(null)

    try {
      setIsCompressing(true)
      const compressedFile = await compressImage(file)
      setIsCompressing(false)

      const formData = new FormData()
      formData.append("file", compressedFile)
      formData.append("folder", uploadFolder)
      if (uploadAlt.trim()) {
        formData.append("alt", uploadAlt.trim())
      }

      const res = await fetch("/api/admin/media", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to upload image")

      // Add to local items list and select it
      setItems((prev) => [data, ...(prev ?? [])])
      onSelect(data.url, data.alt || "")
      onOpenChange(false)
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsCompressing(false)
      setIsUploading(false)
    }
  }

  // Filtered library items
  const filteredItems = (items || []).filter((item) => {
    if (selectedFolder !== "all") {
      const matchFolder = item.folder?.toLowerCase() === selectedFolder.toLowerCase()
      const matchPath = item.filePath?.toLowerCase().includes(`/${selectedFolder}/`)
      if (!matchFolder && !matchPath) return false
    }

    if (!search.trim()) return true
    const term = search.toLowerCase()
    return (
      item.name.toLowerCase().includes(term) ||
      (item.alt && item.alt.toLowerCase().includes(term))
    )
  })

  function handleConfirmSelect() {
    if (tab === "library" && selectedItem) {
      onSelect(selectedItem.url, selectedItem.alt || "")
      onOpenChange(false)
    } else if (tab === "url" && customUrl.trim()) {
      onSelect(customUrl.trim(), customAlt.trim())
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            {title || t("Choose Media from ImageKit", "ইমেজকিট থেকে মিডিয়া নির্বাচন করুন")}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {t(
              "Select an existing asset from the library, upload directly from your device, or use a custom URL.",
              "লাইব্রেরি থেকে ছবি নির্বাচন করুন, সরাসরি আপলোড করুন অথবা লিংক ব্যবহার করুন।"
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Tab switcher */}
        <div className="flex border-b border-border text-xs">
          <button
            type="button"
            onClick={() => setTab("library")}
            className={cn(
              "flex items-center gap-1.5 border-b-2 px-3.5 py-2 font-medium transition-colors",
              tab === "library"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Images className="size-3.5" />
            {t("Media Library", "মিডিয়া লাইব্রেরি")} ({items?.length || 0})
          </button>
          <button
            type="button"
            onClick={() => setTab("upload")}
            className={cn(
              "flex items-center gap-1.5 border-b-2 px-3.5 py-2 font-medium transition-colors",
              tab === "upload"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Upload className="size-3.5" />
            {t("Upload New", "নতুন আপলোড")}
          </button>
          <button
            type="button"
            onClick={() => setTab("url")}
            className={cn(
              "flex items-center gap-1.5 border-b-2 px-3.5 py-2 font-medium transition-colors",
              tab === "url"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Globe className="size-3.5" />
            {t("Custom URL", "কাস্টম লিংক")}
          </button>
        </div>

        {/* Tab 1: Library */}
        {tab === "library" && (
          <div className="space-y-3 py-1">
            <div className="flex items-center justify-between gap-2">
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("Search library...", "লাইব্রেরিতে খুঁজুন...")}
                  className="border-input placeholder:text-muted-foreground focus-visible:ring-ring flex h-8 w-full rounded-md border bg-background py-1 pr-3 pl-8 text-xs shadow-xs transition-colors focus-visible:ring-1 focus-visible:outline-hidden"
                />
              </div>

              {selectedItem && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="truncate max-w-40 font-medium">{selectedItem.name}</span>
                  <Badge variant="outline" className="text-[10px]">
                    {formatBytes(selectedItem.size)}
                  </Badge>
                </div>
              )}
            </div>

            {/* Folder filter pills */}
            <div className="flex flex-wrap items-center gap-1 overflow-x-auto pb-1">
              {MEDIA_FOLDERS.map((f) => {
                const isActive = selectedFolder === f.id
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSelectedFolder(f.id)}
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {t(f.name, f.nameBn)}
                  </button>
                )
              })}
            </div>

            {items === null ? (
              <div className="flex h-64 flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="size-6 animate-spin text-primary" />
                <span>{t("Loading media library...", "মিডিয়া লাইব্রেরি লোড হচ্ছে...")}</span>
              </div>
            ) : error ? (
              <div className="flex h-64 flex-col items-center justify-center gap-2 text-xs text-destructive">
                <AlertCircle className="size-6" />
                <span>{error}</span>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center gap-2 text-center text-xs text-muted-foreground">
                <ImageIcon className="size-8 text-muted-foreground/50" />
                <span>{t("No images found in library", "লাইব্রেরিতে কোনো ছবি নেই")}</span>
                <Button size="sm" variant="outline" className="mt-2 text-xs" onClick={() => setTab("upload")}>
                  <Upload className="mr-1.5 size-3.5" />
                  {t("Upload an image now", "এখনই ছবি আপলোড করুন")}
                </Button>
              </div>
            ) : (
              <div className="grid max-h-[360px] grid-cols-3 gap-2.5 overflow-y-auto p-0.5 sm:grid-cols-4 md:grid-cols-5">
                {filteredItems.map((item) => {
                  const isSelected = selectedItem?.id === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedItem(item)}
                      onDoubleClick={() => {
                        onSelect(item.url, item.alt || "")
                        onOpenChange(false)
                      }}
                      className={cn(
                        "group relative aspect-square w-full overflow-hidden rounded-lg border-2 text-left transition-all",
                        isSelected
                          ? "border-primary ring-2 ring-primary/30"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <Image
                        src={item.thumbnailUrl || item.url}
                        alt={item.alt || item.name}
                        fill
                        className="object-cover"
                      />
                      {isSelected && (
                        <div className="absolute inset-0 flex items-center justify-center bg-primary/25 backdrop-blur-[1px]">
                          <span className="rounded-full bg-primary p-1 text-primary-foreground shadow-xs">
                            <Check className="size-3.5" />
                          </span>
                        </div>
                      )}
                      <span className="absolute bottom-1 right-1 rounded-md bg-black/60 px-1 py-0.5 text-[8px] font-mono text-white backdrop-blur-xs">
                        {formatBytes(item.size)}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Upload */}
        {tab === "upload" && (
          <div className="space-y-3 py-2">
            {uploadError && (
              <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
                <AlertCircle className="size-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground">
                  {t("Target Folder", "টার্গেট ফোল্ডার")}
                </label>
                <Select
                  value={uploadFolder}
                  onValueChange={(val) => setUploadFolder(val || "general")}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MEDIA_FOLDERS.filter((f) => f.id !== "all").map((f) => (
                      <SelectItem key={f.id} value={f.id} className="text-xs">
                        {t(f.name, f.nameBn)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground">
                  {t("Alt Text (Optional)", "অল্ট টেক্সট (ঐচ্ছিক)")}
                </label>
                <Input
                  value={uploadAlt}
                  onChange={(e) => setUploadAlt(e.target.value)}
                  placeholder={t("e.g. Workshop group photo", "যেমন: ওয়ার্কশপের দলীয় ছবি")}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={(e) => {
                e.preventDefault()
                setIsDragging(false)
              }}
              onDrop={(e) => {
                e.preventDefault()
                setIsDragging(false)
                const file = e.dataTransfer.files?.[0]
                if (file) handleFileUpload(file)
              }}
              className={cn(
                "flex h-48 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all",
                isDragging
                  ? "border-primary bg-primary/5 scale-[1.01]"
                  : "border-border/80 bg-muted/20 hover:border-primary/50 hover:bg-muted/40"
              )}
              onClick={() => {
                const input = document.createElement("input")
                input.type = "file"
                input.accept = "image/*"
                input.onchange = (e) => {
                  const target = e.target as HTMLInputElement
                  const file = target.files?.[0]
                  if (file) handleFileUpload(file)
                }
                input.click()
              }}
            >
              {isCompressing ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="size-8 animate-spin text-primary" />
                  <p className="text-xs font-semibold">{t("Optimizing & converting to WebP...", "ওয়েবপিতে অপ্টিমাইজ করা হচ্ছে...")}</p>
                </div>
              ) : isUploading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="size-8 animate-spin text-primary" />
                  <p className="text-xs font-semibold">{t("Uploading to ImageKit...", "ইমেজকিটে আপলোড হচ্ছে...")}</p>
                </div>
              ) : (
                <>
                  <div className="mb-2 rounded-full border border-border bg-background p-2.5 shadow-xs">
                    <Upload className="size-5 text-primary" />
                  </div>
                  <p className="text-xs font-semibold">
                    {t("Click to browse or drop an image file here", "ছবি নির্বাচন করতে ক্লিক করুন বা ড্র্যাগ করুন")}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {t("Auto converted to WebP (Up to 10 MB)", "স্বয়ংক্রিয়ভাবে ওয়েবপিতে রূপান্তর (সর্বোচ্চ ১০ এমবি)")}
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Custom URL */}
        {tab === "url" && (
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">{t("Image URL", "ছবির লিংক")} *</label>
              <Input
                type="url"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="text-xs font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">{t("Alt Text", "অল্ট টেক্সট")}</label>
              <Input
                value={customAlt}
                onChange={(e) => setCustomAlt(e.target.value)}
                placeholder={t("Brief description of the image", "ছবির সংক্ষিপ্ত বিবরণ")}
                className="text-xs"
              />
            </div>

            {customUrl.trim() && (
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground">{t("Preview", "প্রিভিউ")}:</span>
                <div className="relative aspect-video max-w-sm overflow-hidden rounded-lg border border-border bg-muted/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={customUrl}
                    alt={customAlt || "Preview"}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" size="sm" className="text-xs" onClick={() => onOpenChange(false)}>
            {t("Cancel", "বাতিল")}
          </Button>
          {tab !== "upload" && (
            <Button
              type="button"
              size="sm"
              className="text-xs"
              disabled={
                (tab === "library" && !selectedItem) ||
                (tab === "url" && !customUrl.trim())
              }
              onClick={handleConfirmSelect}
            >
              <Check className="mr-1.5 size-3.5" />
              {t("Use Selected Image", "নির্বাচিত ছবি ব্যবহার করুন")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
