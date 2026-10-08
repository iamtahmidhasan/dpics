"use client"

import {
  AlertCircle,
  Check,
  Code,
  Copy,
  Edit3,
  ExternalLink,
  Eye,
  FileImage,
  Folder,
  HardDrive,
  Images,
  LayoutGrid,
  List,
  Loader2,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react"
import Image from "next/image"
import { useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useLanguage } from "@/components/language-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  formatBytes,
  MAX_ALT_TEXT_LENGTH,
  MAX_MEDIA_FILE_SIZE,
  MEDIA_FOLDERS,
  type MediaFolderId,
  type MediaItemSummary,
  type MediaStats,
} from "@/lib/media-constants"
import { compressImage } from "@/lib/client-image-compression"
import { cn } from "cn"

interface AdminMediaManagerProps {
  initialMedia: MediaItemSummary[]
  initialStats: MediaStats
}

export function AdminMediaManager({
  initialMedia,
  initialStats,
}: AdminMediaManagerProps) {
  const { t } = useLanguage()
  const router = useRouter()

  const [mediaList, setMediaList] = useState<MediaItemSummary[]>(initialMedia)
  const [stats, setStats] = useState<MediaStats>(initialStats)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [search, setSearch] = useState("")
  const [activeFolder, setActiveFolder] = useState<MediaFolderId>("all")
  const [uploadTargetFolder, setUploadTargetFolder] = useState<string>("general")
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "size-desc" | "size-asc" | "name">("newest")

  // Copy status indicators (item id -> type -> boolean)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  // Upload state
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null)
  const [uploadAltText, setUploadAltText] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [isCompressing, setIsCompressing] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Edit Alt Modal state
  const [editingItem, setEditingItem] = useState<MediaItemSummary | null>(null)
  const [editAltInput, setEditAltInput] = useState("")
  const [isUpdatingAlt, setIsUpdatingAlt] = useState(false)
  const [updateAltError, setUpdateAltError] = useState<string | null>(null)

  // Delete Modal state
  const [deletingItem, setDeletingItem] = useState<MediaItemSummary | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Detail / Lightbox Modal state
  const [inspectingItem, setInspectingItem] = useState<MediaItemSummary | null>(null)

  // Copy helper
  async function copyToClipboard(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedKey(key)
      setTimeout(() => setCopiedKey(null), 2000)
    } catch {
      // Fallback
      const textArea = document.createElement("textarea")
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
      setCopiedKey(key)
      setTimeout(() => setCopiedKey(null), 2000)
    }
  }

  // Create template helper
  async function handleCreateTemplateFromMedia(item: MediaItemSummary) {
    try {
      const res = await fetch("/api/media/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${item.name.replace(/\.[^/.]+$/, "")} Template`,
          type: "MEMBER_CARD",
          mediaId: item.id,
        }),
      })
      if (!res.ok) throw new Error("Failed to create template")
      const created = await res.json()
      toast.success(t("Opening Template Editor...", "টেমপ্লেট এডিটর লোড হচ্ছে..."))
      router.push(`/admin/templates/${created.id}/edit`)
    } catch {
      toast.error(t("Could not create template", "টেমপ্লেট তৈরি করা যায়নি"))
    }
  }

  // File selection
  function handleFileSelected(file: File | null) {
    if (!file) return
    if (!file.type.startsWith("image/")) {
      setUploadError(t("Please select a valid image file", "অনুগ্রহ করে একটি সঠিক ইমেজ ফাইল নির্বাচন করুন"))
      return
    }
    if (file.size > MAX_MEDIA_FILE_SIZE) {
      setUploadError(t("File exceeds 10 MB maximum limit", "ফাইল সাইজ সর্বোচ্চ ১০ মেগাবাইটের বেশি"))
      return
    }

    setUploadError(null)
    setUploadSuccess(null)
    setSelectedFile(file)
    setFilePreviewUrl(URL.createObjectURL(file))
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null
    handleFileSelected(file)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0] || null
    handleFileSelected(file)
  }

  function cancelSelectedFile() {
    setSelectedFile(null)
    if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl)
    setFilePreviewUrl(null)
    setUploadAltText("")
    setUploadError(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  // Upload submission
  async function handleUploadSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedFile) return

    setIsUploading(true)
    setUploadError(null)
    setUploadSuccess(null)

    try {
      let fileToUpload = selectedFile
      if (selectedFile.type.startsWith("image/")) {
        setIsCompressing(true)
        fileToUpload = await compressImage(selectedFile)
        setIsCompressing(false)
      }

      const formData = new FormData()
      formData.append("file", fileToUpload)
      formData.append("folder", uploadTargetFolder)
      if (uploadAltText.trim()) {
        formData.append("alt", uploadAltText.trim())
      }

      const res = await fetch("/api/admin/media", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to upload file")
      }

      setMediaList((prev) => [data, ...prev])
      setStats((prev) => ({
        totalCount: prev.totalCount + 1,
        totalSize: prev.totalSize + data.size,
      }))
      setUploadSuccess(
        t(
          "Image optimized (WebP) and uploaded successfully to ImageKit!",
          "ছবি ওয়েবপিতে অপ্টিমাইজ করে ইমেজকিট-এ সফলভাবে আপলোড সম্পন্ন হয়েছে!"
        )
      )
      cancelSelectedFile()
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsCompressing(false)
      setIsUploading(false)
    }
  }

  // Edit Alt Text
  function openEditAlt(item: MediaItemSummary) {
    setEditingItem(item)
    setEditAltInput(item.alt || "")
    setUpdateAltError(null)
  }

  async function handleSaveAlt(e: React.FormEvent) {
    e.preventDefault()
    if (!editingItem) return

    setIsUpdatingAlt(true)
    setUpdateAltError(null)

    try {
      const res = await fetch(`/api/admin/media/${editingItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alt: editAltInput.trim() }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to update alt text")

      setMediaList((prev) =>
        prev.map((item) => (item.id === data.id ? { ...item, alt: data.alt } : item))
      )
      if (inspectingItem && inspectingItem.id === data.id) {
        setInspectingItem((prev) => (prev ? { ...prev, alt: data.alt } : null))
      }
      setEditingItem(null)
    } catch (err: unknown) {
      setUpdateAltError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsUpdatingAlt(false)
    }
  }

  // Delete Media
  async function handleDeleteConfirm() {
    if (!deletingItem) return

    setIsDeleting(true)
    setDeleteError(null)

    try {
      const res = await fetch(`/api/admin/media/${deletingItem.id}`, {
        method: "DELETE",
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to delete media")

      setMediaList((prev) => prev.filter((item) => item.id !== deletingItem.id))
      setStats((prev) => ({
        totalCount: Math.max(0, prev.totalCount - 1),
        totalSize: Math.max(0, prev.totalSize - deletingItem.size),
      }))

      if (inspectingItem && inspectingItem.id === deletingItem.id) {
        setInspectingItem(null)
      }
      setDeletingItem(null)
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsDeleting(false)
    }
  }

  // Filtered and sorted media list
  const filteredList = useMemo(() => {
    let result = [...mediaList]

    if (activeFolder !== "all") {
      result = result.filter((item) => {
        if (item.folder) {
          return item.folder.toLowerCase() === activeFolder.toLowerCase()
        }
        return item.filePath?.toLowerCase().includes(`/${activeFolder}/`)
      })
    }

    if (search.trim()) {
      const term = search.toLowerCase()
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(term) ||
          (item.alt && item.alt.toLowerCase().includes(term))
      )
    }

    result.sort((a, b) => {
      if (sortBy === "oldest") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      }
      if (sortBy === "size-desc") {
        return b.size - a.size
      }
      if (sortBy === "size-asc") {
        return a.size - b.size
      }
      if (sortBy === "name") {
        return a.name.localeCompare(b.name)
      }
      // default: newest
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    return result
  }, [mediaList, activeFolder, search, sortBy])

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* Stats Summary & Quick Info */}
      {/* ========================================================================= */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-card/60 backdrop-blur-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {t("Total Files", "মোট ফাইল")}
            </CardTitle>
            <Images className="size-4 text-primary" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{stats.totalCount}</div>
            <p className="text-[11px] text-muted-foreground">
              {t("Images stored via ImageKit CDN", "ইমেজকিট সিডিএন-এ সংরক্ষিত")}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/60 backdrop-blur-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {t("Storage Used", "ব্যবহৃত স্টোরেজ")}
            </CardTitle>
            <HardDrive className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{formatBytes(stats.totalSize)}</div>
            <p className="text-[11px] text-muted-foreground">
              {t("Optimized cloud delivery", "ক্লাউড ডেলিভারি অপ্টিমাইজড")}
            </p>
          </CardContent>
        </Card>

        <Card className="hidden bg-card/60 backdrop-blur-xs lg:block">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {t("Supported Formats", "সমর্থিত ফরম্যাট")}
            </CardTitle>
            <FileImage className="size-4 text-blue-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex flex-wrap gap-1 pt-1">
              {["WEBP", "PNG", "JPEG", "SVG", "GIF", "AVIF"].map((ext) => (
                <span
                  key={ext}
                  className="rounded-md border border-border/80 bg-muted/60 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground"
                >
                  {ext}
                </span>
              ))}
            </div>
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              {t("Max 10 MB per image", "ছবি প্রতি সর্বোচ্চ ১০ মেগাবাইট")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ========================================================================= */}
      {/* Upload Zone */}
      {/* ========================================================================= */}
      <Card className="overflow-hidden border-border/80 bg-card/40 backdrop-blur-xs">
        <CardHeader className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <CardTitle className="text-sm font-semibold">
                {t("Upload New Media", "নতুন মিডিয়া আপলোড")}
              </CardTitle>
              <CardDescription className="text-xs">
                {t(
                  "Upload images to ImageKit. Copy direct CDN URLs or markdown links instantly.",
                  "ইমেজকিটে ছবি আপলোড করুন এবং সরাসরি সিডিএন ইউআরএল বা মার্কডাউন লিংক কপি করুন।"
                )}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 pt-2">
          {uploadError ? (
            <div className="mb-3 flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
          ) : null}

          {uploadSuccess ? (
            <div className="mb-3 flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs text-emerald-600 dark:text-emerald-400">
              <Check className="size-4 shrink-0" />
              <span>{uploadSuccess}</span>
            </div>
          ) : null}

          {selectedFile && filePreviewUrl ? (
            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div className="flex flex-col gap-4 rounded-xl border border-border bg-background/50 p-4 sm:flex-row sm:items-center">
                <div className="relative size-24 shrink-0 overflow-hidden rounded-lg border border-border bg-muted/30">
                  <Image
                    src={filePreviewUrl}
                    alt="Upload Preview"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>

                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-semibold">{selectedFile.name}</span>
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {formatBytes(selectedFile.size)}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-muted-foreground">
                        {t("Target Folder", "টার্গেট ফোল্ডার")}
                      </label>
                      <Select
                        value={uploadTargetFolder}
                        onValueChange={(val) => setUploadTargetFolder(val || "general")}
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
                        {t("Alt Text (Recommended for SEO)", "অল্ট টেক্সট (এসইও-র জন্য)")}
                      </label>
                      <input
                        type="text"
                        value={uploadAltText}
                        onChange={(e) => setUploadAltText(e.target.value)}
                        maxLength={MAX_ALT_TEXT_LENGTH}
                        placeholder={t("e.g. Students participating in event", "যেমন: অনুষ্ঠানে অংশগ্রহণকারী")}
                        className="border-input placeholder:text-muted-foreground/60 focus-visible:ring-ring flex h-8 w-full rounded-md border bg-background px-2.5 text-xs shadow-xs transition-colors focus-visible:ring-1 focus-visible:outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={cancelSelectedFile}
                    disabled={isUploading || isCompressing}
                  >
                    <X className="mr-1 size-3.5" />
                    {t("Cancel", "বাতিল")}
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="h-8 text-xs font-medium"
                    disabled={isUploading || isCompressing}
                  >
                    {isCompressing ? (
                      <>
                        <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                        {t("Optimizing (WebP)...", "ওয়েবপিতে অপ্টিমাইজ হচ্ছে...")}
                      </>
                    ) : isUploading ? (
                      <>
                        <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                        {t("Uploading to ImageKit...", "আপলোড হচ্ছে...")}
                      </>
                    ) : (
                      <>
                        <Upload className="mr-1.5 size-3.5" />
                        {t("Upload Now", "আপলোড করুন")}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          ) : (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "group relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all duration-200",
                isDragging
                  ? "border-primary bg-primary/5 scale-[1.005]"
                  : "border-border/70 bg-muted/20 hover:border-primary/50 hover:bg-muted/40"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="mb-2 rounded-full border border-border/80 bg-background p-2.5 shadow-xs transition-transform group-hover:scale-105">
                <Upload className="size-5 text-primary" />
              </div>
              <p className="text-xs font-semibold">
                {t(
                  "Click to browse or drag and drop image here",
                  "ছবি সিলেক্ট করতে ক্লিক করুন অথবা এখানে টেনে আনুন"
                )}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {t(
                  "PNG, JPG, WebP, GIF, SVG or AVIF (Auto converted to WebP)",
                  "পিএনজি, জেপিজি, ওয়েবপি, গিফ, এসভিজি (স্বয়ংক্রিয় ওয়েবপিতে রূপান্তর)"
                )}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* Folder Navigation Tabs */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-border/60 pb-3">
        {MEDIA_FOLDERS.map((f) => {
          const count =
            f.id === "all"
              ? mediaList.length
              : mediaList.filter(
                  (m) =>
                    m.folder?.toLowerCase() === f.id.toLowerCase() ||
                    m.filePath?.toLowerCase().includes(`/${f.id}/`)
                ).length
          const isActive = activeFolder === f.id

          return (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                setActiveFolder(f.id)
                if (f.id !== "all") setUploadTargetFolder(f.id)
              }}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Folder className="size-3.5" />
              <span>{t(f.name, f.nameBn)}</span>
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.2 text-[10px]",
                  isActive
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-background/80 text-muted-foreground"
                )}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* ========================================================================= */}
      {/* Controls: Search, Sort & View Mode Toggle */}
      {/* ========================================================================= */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("Search by filename or alt text...", "ফাইলের নাম বা অল্ট টেক্সট দিয়ে খুঁজুন...")}
            className="border-input placeholder:text-muted-foreground/70 focus-visible:ring-ring flex h-8 w-full rounded-md border bg-background py-1 pr-3 pl-8 text-xs shadow-xs transition-colors focus-visible:ring-1 focus-visible:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Sort Selector */}
          <Select
            value={sortBy}
            onValueChange={(val) =>
              setSortBy(val as "newest" | "oldest" | "size-desc" | "size-asc" | "name")
            }
          >
            <SelectTrigger className="h-8 w-38 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest" className="text-xs">
                {t("Newest first", "সর্বশেষ আগে")}
              </SelectItem>
              <SelectItem value="oldest" className="text-xs">
                {t("Oldest first", "প্রাচীনতম আগে")}
              </SelectItem>
              <SelectItem value="size-desc" className="text-xs">
                {t("Size: Largest", "সাইজ: বড়")}
              </SelectItem>
              <SelectItem value="size-asc" className="text-xs">
                {t("Size: Smallest", "সাইজ: ছোট")}
              </SelectItem>
              <SelectItem value="name" className="text-xs">
                {t("Name: A to Z", "নাম: ক থেকে ঁ")}
              </SelectItem>
            </SelectContent>
          </Select>

          {/* View Toggle */}
          <div className="flex items-center rounded-md border border-border p-0.5">
            <Button
              type="button"
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="size-7"
              onClick={() => setViewMode("grid")}
              aria-label={t("Grid View", "গ্রিড ভিউ")}
            >
              <LayoutGrid className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              className="size-7"
              onClick={() => setViewMode("list")}
              aria-label={t("List View", "তালিকা ভিউ")}
            >
              <List className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* Media Gallery / List */}
      {/* ========================================================================= */}
      {filteredList.length === 0 ? (
        <Card className="border-dashed bg-card/30">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-3 rounded-full border border-border/80 bg-muted/40 p-3">
              <Images className="size-8 text-muted-foreground/60" />
            </div>
            <h3 className="font-heading text-sm font-semibold">
              {search
                ? t("No media items matched your search", "আপনার অনুসন্ধানের সাথে কোনো মিডিয়া মেলেনি")
                : t("No media items found", "কোনো মিডিয়া পাওয়া যায়নি")}
            </h3>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              {search
                ? t("Try clearing the search query or search by another keyword.", "অনুসন্ধানটি মুছে বা অন্য শব্দ দিয়ে চেষ্টা করুন।")
                : t(
                    "Upload your first image to ImageKit to start building your media library.",
                    "আপনার মিডিয়া লাইব্রেরি তৈরি করতে প্রথম ছবিটি ইমেজকিটে আপলোড করুন।"
                  )}
            </p>
            {search ? (
              <Button
                variant="outline"
                size="sm"
                className="mt-4 text-xs"
                onClick={() => setSearch("")}
              >
                {t("Clear Search", "অনুসন্ধান মুছুন")}
              </Button>
            ) : (
              <Button
                size="sm"
                className="mt-4 text-xs"
                onClick={() => fileInputRef.current?.click()}
              >
                <Plus className="mr-1.5 size-3.5" />
                {t("Upload Image", "ছবি আপলোড করুন")}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        /* Grid View */
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filteredList.map((item) => {
            const isUrlCopied = copiedKey === `url-${item.id}`
            const isMdCopied = copiedKey === `md-${item.id}`
            const mdSnippet = `![${item.alt || item.name}](${item.url})`

            return (
              <Card
                key={item.id}
                className="group relative flex flex-col overflow-hidden border-border/80 bg-card/60 transition-all duration-200 hover:border-primary/40 hover:shadow-xs"
              >
                {/* Thumbnail Container */}
                <div
                  className="relative aspect-square w-full cursor-pointer overflow-hidden bg-muted/40"
                  onClick={() => setInspectingItem(item)}
                >
                  <Image
                    src={item.thumbnailUrl || item.url}
                    alt={item.alt || item.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center gap-1.5 bg-black/45 opacity-0 backdrop-blur-[2px] transition-opacity duration-200 group-hover:opacity-100">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="size-7 rounded-full shadow-xs"
                      onClick={(e) => {
                        e.stopPropagation()
                        setInspectingItem(item)
                      }}
                      title={t("Preview Details", "বিস্তারিত দেখুন")}
                    >
                      <Eye className="size-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="size-7 rounded-full shadow-xs"
                      onClick={(e) => {
                        e.stopPropagation()
                        copyToClipboard(item.url, `url-${item.id}`)
                      }}
                      title={t("Copy Image URL", "ইমেজ ইউআরএল কপি")}
                    >
                      {isUrlCopied ? (
                        <Check className="size-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="size-3.5" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="size-7 rounded-full shadow-xs"
                      onClick={(e) => {
                        e.stopPropagation()
                        openEditAlt(item)
                      }}
                      title={t("Edit Alt Text", "অল্ট টেক্সট এডিট")}
                    >
                      <Edit3 className="size-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="size-7 rounded-full shadow-xs"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCreateTemplateFromMedia(item)
                      }}
                      title={t("Create Template", "টেমপ্লেট তৈরি")}
                    >
                      <Folder className="size-3.5 text-primary" />
                    </Button>
                  </div>

                  {/* Size & Folder Badges */}
                  <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between pointer-events-none">
                    {item.folder ? (
                      <span className="rounded-md bg-black/60 px-1.5 py-0.5 text-[8px] font-mono uppercase text-white/90 backdrop-blur-xs">
                        {item.folder}
                      </span>
                    ) : (
                      <span />
                    )}
                    <span className="rounded-md bg-black/60 px-1.5 py-0.5 text-[9px] font-mono text-white backdrop-blur-xs">
                      {formatBytes(item.size)}
                    </span>
                  </div>
                </div>

                {/* Card Meta & Bottom Actions */}
                <div className="flex flex-1 flex-col justify-between p-2.5">
                  <div className="space-y-0.5">
                    <p
                      className="cursor-pointer truncate text-xs font-medium text-foreground hover:text-primary"
                      onClick={() => setInspectingItem(item)}
                      title={item.name}
                    >
                      {item.name}
                    </p>
                    <p
                      className="truncate text-[10px] text-muted-foreground"
                      title={item.alt || t("No alt text set", "কোনো অল্ট টেক্সট নেই")}
                    >
                      {item.alt ? `alt: "${item.alt}"` : t("No alt text", "অল্ট টেক্সট নেই")}
                    </p>
                  </div>

                  <div className="mt-2 flex items-center justify-between border-t border-border/60 pt-2">
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-6 text-muted-foreground hover:text-foreground"
                        onClick={() => copyToClipboard(item.url, `url-${item.id}`)}
                        title={t("Copy URL", "ইউআরএল কপি")}
                      >
                        {isUrlCopied ? (
                          <Check className="size-3 text-emerald-500" />
                        ) : (
                          <Copy className="size-3" />
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-6 text-muted-foreground hover:text-foreground"
                        onClick={() => copyToClipboard(mdSnippet, `md-${item.id}`)}
                        title={t("Copy Markdown snippet", "মার্কডাউন কপি")}
                      >
                        {isMdCopied ? (
                          <Check className="size-3 text-emerald-500" />
                        ) : (
                          <Code className="size-3" />
                        )}
                      </Button>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-6 text-muted-foreground hover:text-foreground"
                        onClick={() => openEditAlt(item)}
                        title={t("Edit Alt Text", "অল্ট টেক্সট এডিট")}
                      >
                        <Edit3 className="size-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-6 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => {
                          setDeletingItem(item)
                          setDeleteError(null)
                        }}
                        title={t("Delete Media", "মুছে ফেলুন")}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        /* List / Table View */
        <Card className="overflow-hidden border-border/80">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-muted/40 font-medium text-muted-foreground">
                <tr>
                  <th className="py-2.5 pr-4 pl-4">{t("Preview", "প্রিভিউ")}</th>
                  <th className="py-2.5 pr-4">{t("Filename", "ফাইলের নাম")}</th>
                  <th className="py-2.5 pr-4">{t("Alt Text", "অল্ট টেক্সট")}</th>
                  <th className="py-2.5 pr-4">{t("Dimensions / Size", "সাইজ")}</th>
                  <th className="py-2.5 pr-4">{t("Uploaded", "আপলোড")}</th>
                  <th className="py-2.5 pr-4 text-right">{t("Actions", "অ্যাকশন")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredList.map((item) => {
                  const isUrlCopied = copiedKey === `url-${item.id}`
                  const isMdCopied = copiedKey === `md-${item.id}`
                  const mdSnippet = `![${item.alt || item.name}](${item.url})`

                  return (
                    <tr key={item.id} className="transition-colors hover:bg-muted/30">
                      <td className="py-2 pr-4 pl-4">
                        <div
                          className="relative size-10 cursor-pointer overflow-hidden rounded-md border border-border bg-muted/40"
                          onClick={() => setInspectingItem(item)}
                        >
                          <Image
                            src={item.thumbnailUrl || item.url}
                            alt={item.alt || item.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      </td>
                      <td className="py-2 pr-4 font-medium">
                        <span
                          className="cursor-pointer hover:text-primary"
                          onClick={() => setInspectingItem(item)}
                        >
                          {item.name}
                        </span>
                      </td>
                      <td className="max-w-xs py-2 pr-4 text-muted-foreground">
                        {item.alt ? (
                          <span className="truncate block" title={item.alt}>
                            {item.alt}
                          </span>
                        ) : (
                          <span className="italic text-muted-foreground/60">
                            {t("None", "নেই")}
                          </span>
                        )}
                      </td>
                      <td className="py-2 pr-4 font-mono text-[11px] text-muted-foreground">
                        <div>{formatBytes(item.size)}</div>
                        {item.width && item.height ? (
                          <div className="text-[10px] text-muted-foreground/70">
                            {item.width} × {item.height}
                          </div>
                        ) : null}
                      </td>
                      <td className="py-2 pr-4 text-[11px] text-muted-foreground">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-2 pr-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-7"
                            onClick={() => copyToClipboard(item.url, `url-${item.id}`)}
                            title={t("Copy URL", "ইউআরএল কপি")}
                          >
                            {isUrlCopied ? (
                              <Check className="size-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="size-3.5" />
                            )}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-7"
                            onClick={() => copyToClipboard(mdSnippet, `md-${item.id}`)}
                            title={t("Copy Markdown", "মার্কডাউন কপি")}
                          >
                            {isMdCopied ? (
                              <Check className="size-3.5 text-emerald-500" />
                            ) : (
                              <Code className="size-3.5" />
                            )}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-7"
                            onClick={() => openEditAlt(item)}
                            title={t("Edit Alt Text", "অল্ট টেক্সট এডিট")}
                          >
                            <Edit3 className="size-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive size-7"
                            onClick={() => {
                              setDeletingItem(item)
                              setDeleteError(null)
                            }}
                            title={t("Delete", "মুছুন")}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* Lightbox / Full Inspection Modal */}
      {/* ========================================================================= */}
      <Dialog
        open={Boolean(inspectingItem)}
        onOpenChange={(open) => !open && setInspectingItem(null)}
      >
        <DialogContent className="max-w-2xl">
          {inspectingItem ? (
            <>
              <DialogHeader>
                <DialogTitle className="truncate text-sm font-semibold">
                  {inspectingItem.name}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  {t("Media asset details and CDN links", "মিডিয়া ফাইলের বিস্তারিত ও সিডিএন লিংক")}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                {/* Large Preview */}
                <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-black/10">
                  <Image
                    src={inspectingItem.url}
                    alt={inspectingItem.alt || inspectingItem.name}
                    fill
                    className="object-contain"
                  />
                </div>

                {/* Details Grid */}
                <div className="grid gap-2 text-xs sm:grid-cols-2">
                  <div className="rounded-md border border-border bg-muted/20 p-2.5">
                    <span className="text-[11px] text-muted-foreground">{t("ImageKit URL", "ইমেজকিট ইউআরএল")}</span>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <span className="truncate font-mono text-[11px]">{inspectingItem.url}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-6 shrink-0"
                        onClick={() => copyToClipboard(inspectingItem.url, `modal-url`)}
                      >
                        {copiedKey === "modal-url" ? (
                          <Check className="size-3 text-emerald-500" />
                        ) : (
                          <Copy className="size-3" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-md border border-border bg-muted/20 p-2.5">
                    <span className="text-[11px] text-muted-foreground">{t("Markdown Snippet", "মার্কডাউন কোড")}</span>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <span className="truncate font-mono text-[11px]">
                        {`![${inspectingItem.alt || inspectingItem.name}](${inspectingItem.url})`}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-6 shrink-0"
                        onClick={() =>
                          copyToClipboard(
                            `![${inspectingItem.alt || inspectingItem.name}](${inspectingItem.url})`,
                            `modal-md`
                          )
                        }
                      >
                        {copiedKey === "modal-md" ? (
                          <Check className="size-3 text-emerald-500" />
                        ) : (
                          <Copy className="size-3" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-md border border-border bg-muted/20 p-2.5">
                    <span className="text-[11px] text-muted-foreground">{t("Alt Text", "অল্ট টেক্সট")}</span>
                    <p className="mt-1 font-medium">
                      {inspectingItem.alt || (
                        <span className="italic text-muted-foreground/70">
                          {t("No alt text provided", "কোনো অল্ট টেক্সট দেওয়া হয়নি")}
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="rounded-md border border-border bg-muted/20 p-2.5">
                    <span className="text-[11px] text-muted-foreground">{t("File Specs", "ফাইল তথ্য")}</span>
                    <p className="mt-1 font-mono text-[11px]">
                      {formatBytes(inspectingItem.size)}
                      {inspectingItem.width && inspectingItem.height
                        ? ` • ${inspectingItem.width}×${inspectingItem.height}px`
                        : ""}
                      {inspectingItem.mimeType ? ` • ${inspectingItem.mimeType}` : ""}
                    </p>
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2 sm:justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => window.open(inspectingItem.url, "_blank")}
                >
                  <ExternalLink className="mr-1.5 size-3.5" />
                  {t("Open Original in Tab", "ট্যাবে খুলুন")}
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      if (inspectingItem) {
                        handleCreateTemplateFromMedia(inspectingItem)
                      }
                    }}
                  >
                    <Folder className="mr-1.5 size-3.5 text-primary" />
                    {t("Create Template", "টেমপ্লেট তৈরি")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      const item = inspectingItem
                      setInspectingItem(null)
                      openEditAlt(item)
                    }}
                  >
                    <Edit3 className="mr-1.5 size-3.5" />
                    {t("Edit Alt Text", "অল্ট টেক্সট এডিট")}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      const item = inspectingItem
                      setInspectingItem(null)
                      setDeletingItem(item)
                    }}
                  >
                    <Trash2 className="mr-1.5 size-3.5" />
                    {t("Delete", "মুছুন")}
                  </Button>
                </div>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* Edit Alt Text Modal */}
      {/* ========================================================================= */}
      <Dialog
        open={Boolean(editingItem)}
        onOpenChange={(open) => !open && setEditingItem(null)}
      >
        <DialogContent className="sm:max-w-md">
          {editingItem ? (
            <form onSubmit={handleSaveAlt}>
              <DialogHeader>
                <DialogTitle className="text-sm font-semibold">
                  {t("Update Alt Text", "অল্ট টেক্সট হালনাগাদ")}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  {t(
                    "Alt text describes the image for visually impaired users and improves search indexing.",
                    "অল্ট টেক্সট স্ক্রিন রিডার ব্যবহারকারী ও সার্চ ইঞ্জিনের জন্য ছবির বিবরণ দেয়।"
                  )}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {updateAltError ? (
                  <div className="rounded-md border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
                    {updateAltError}
                  </div>
                ) : null}

                <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/20 p-2.5">
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                    <Image
                      src={editingItem.thumbnailUrl || editingItem.url}
                      alt={editingItem.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold">{editingItem.name}</p>
                    <p className="font-mono text-[10px] text-muted-foreground">
                      {formatBytes(editingItem.size)}
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium">
                      {t("Alt Text", "অল্ট টেক্সট")}
                    </label>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {editAltInput.length} / {MAX_ALT_TEXT_LENGTH}
                    </span>
                  </div>
                  <textarea
                    value={editAltInput}
                    onChange={(e) => setEditAltInput(e.target.value)}
                    maxLength={MAX_ALT_TEXT_LENGTH}
                    rows={3}
                    placeholder={t(
                      "Describe what is happening in this image...",
                      "এই ছবিতে কী দেখা যাচ্ছে তার একটি স্পষ্ট বিবরণ লিখুন..."
                    )}
                    className="border-input placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border bg-background p-2.5 text-xs shadow-xs transition-colors focus-visible:ring-1 focus-visible:outline-hidden"
                  />
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setEditingItem(null)}
                >
                  {t("Cancel", "বাতিল")}
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="text-xs font-medium"
                  disabled={isUpdatingAlt}
                >
                  {isUpdatingAlt ? (
                    <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                  ) : (
                    <Check className="mr-1.5 size-3.5" />
                  )}
                  {t("Save Changes", "সংরক্ষণ করুন")}
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* Delete Confirmation Modal */}
      {/* ========================================================================= */}
      <Dialog
        open={Boolean(deletingItem)}
        onOpenChange={(open) => !open && setDeletingItem(null)}
      >
        <DialogContent className="sm:max-w-md">
          {deletingItem ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-sm font-semibold text-destructive">
                  {t("Delete Media File", "মিডিয়া ফাইল মুছুন")}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  {t(
                    `Are you sure you want to delete "${deletingItem.name}"? This permanently removes the file from ImageKit and the database.`,
                    `আপনি কি নিশ্চিত যে "${deletingItem.name}" মুছে ফেলতে চান? এটি ইমেজকিট এবং ডেটাবেস থেকে স্থায়ীভাবে মুছে যাবে।`
                  )}
                </DialogDescription>
              </DialogHeader>

              <div className="py-2">
                {deleteError ? (
                  <div className="rounded-md border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
                    {deleteError}
                  </div>
                ) : null}

                <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/20 p-2.5">
                  <div className="relative size-12 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                    <Image
                      src={deletingItem.thumbnailUrl || deletingItem.url}
                      alt={deletingItem.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold">{deletingItem.name}</p>
                    <p className="font-mono text-[10px] text-muted-foreground">
                      {formatBytes(deletingItem.size)}
                    </p>
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setDeletingItem(null)}
                >
                  {t("Cancel", "বাতিল")}
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="text-xs"
                  disabled={isDeleting}
                  onClick={handleDeleteConfirm}
                >
                  {isDeleting ? (
                    <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="mr-1.5 size-3.5" />
                  )}
                  {t("Delete Permanently", "স্থায়ীভাবে মুছুন")}
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
