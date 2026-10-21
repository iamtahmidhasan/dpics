"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import {
  AlertCircle,
  Check,
  Copy,
  ExternalLink,
  Eye,
  FileCode,
  Folder,
  Grid,
  HardDrive,
  Image as ImageIcon,
  Images,
  LayoutGrid,
  List,
  Loader2,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react"

import { useLanguage } from "@/components/language-provider"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { compressImage } from "@/lib/client-image-compression"
import {
  formatBytes,
  MAX_MEDIA_FILE_SIZE,
  MEDIA_FOLDERS,
  type MediaFolderId,
  type MediaItemSummary,
  type MediaStats,
} from "@/lib/media-constants"
import { cn } from "cn"

interface UserMediaManagerProps {
  initialItems: MediaItemSummary[]
  initialStats: MediaStats
  canDelete?: boolean
}

export function UserMediaManager({
  initialItems,
  initialStats,
  canDelete = false,
}: UserMediaManagerProps) {
  const { t, lang } = useLanguage()
  const isBn = lang === "bn"

  const [items, setItems] = useState<MediaItemSummary[]>(initialItems)
  const [stats, setStats] = useState<MediaStats>(initialStats)
  const [loading, setLoading] = useState(false)

  // Filters & Search
  const [search, setSearch] = useState("")
  const [selectedFolder, setSelectedFolder] = useState<MediaFolderId>("all")
  const [sort, setSort] = useState<"newest" | "oldest" | "size-desc" | "size-asc" | "name">("newest")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  // Copy feedback states
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  // Modals
  const [previewItem, setPreviewItem] = useState<MediaItemSummary | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<MediaItemSummary | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Upload modal state
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadPreview, setUploadPreview] = useState<string | null>(null)
  const [uploadFolder, setUploadFolder] = useState<string>("general")
  const [uploadAlt, setUploadAlt] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [isCompressing, setIsCompressing] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Fetch updated list on filter changes
  const fetchMedia = async (folder = selectedFolder, searchQuery = search, sortOrder = sort) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (folder !== "all") params.set("folder", folder)
      if (searchQuery.trim()) params.set("search", searchQuery.trim())
      params.set("sort", sortOrder)
      params.set("limit", "150")

      const res = await fetch(`/api/my/media?${params.toString()}`)
      if (res.ok) {
        const json = await res.json()
        setItems(json.items || [])
        setStats(json.stats || stats)
      }
    } catch (err) {
      console.error("Failed to fetch user media:", err)
    } finally {
      setLoading(false)
    }
  }

  // Refetch when filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMedia(selectedFolder, search, sort)
    }, 250)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFolder, search, sort])

  // Copy helpers
  const copyUrl = async (url: string, key: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedKey(key)
      setTimeout(() => setCopiedKey(null), 2000)
    } catch {
      // Fallback
    }
  }

  const copyMarkdown = async (item: MediaItemSummary, key: string) => {
    try {
      const md = `![${item.alt || item.name}](${item.url})`
      await navigator.clipboard.writeText(md)
      setCopiedKey(key)
      setTimeout(() => setCopiedKey(null), 2000)
    } catch {
      // Fallback
    }
  }

  // Handle local file drop / pick
  const handleFileChange = async (file: File | null) => {
    if (!file) return
    setUploadError(null)

    if (file.size > MAX_MEDIA_FILE_SIZE) {
      setUploadError(t("File exceeds 10MB limit", "ফাইলের আকার ১০ মেগাবাইটের বেশি"))
      return
    }

    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      setUploadError(t("Only images and PDF documents are supported", "কেবল ছবি ও পিডিএফ ডকুমেন্ট সমর্থিত"))
      return
    }

    // Client-side image compression
    if (file.type.startsWith("image/") && file.type !== "image/svg+xml" && file.type !== "image/gif") {
      setIsCompressing(true)
      try {
        const compressed = await compressImage(file, {
          maxWidthOrHeight: 1920,
          quality: 0.85,
        })
        setUploadFile(compressed)
        setUploadPreview(URL.createObjectURL(compressed))
      } catch {
        setUploadFile(file)
        setUploadPreview(URL.createObjectURL(file))
      } finally {
        setIsCompressing(false)
      }
    } else {
      setUploadFile(file)
      setUploadPreview(file.type.startsWith("image/") ? URL.createObjectURL(file) : null)
    }
  }

  // Submit upload
  const handleUploadSubmit = async () => {
    if (!uploadFile) return
    setIsUploading(true)
    setUploadError(null)

    try {
      const formData = new FormData()
      formData.append("file", uploadFile)
      formData.append("folder", uploadFolder)
      if (uploadAlt.trim()) {
        formData.append("alt", uploadAlt.trim())
      }

      const res = await fetch("/api/my/media", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error?.message ?? data?.error ?? "Upload failed")
      }

      // Reset upload modal and reload list
      setUploadOpen(false)
      setUploadFile(null)
      setUploadPreview(null)
      setUploadAlt("")
      fetchMedia()
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Failed to upload image")
    } finally {
      setIsUploading(false)
    }
  }

  // Delete media item (only admin and super_admin permitted)
  const handleDeleteSubmit = async () => {
    if (!deleteTarget || !canDelete) return
    setIsDeleting(true)

    try {
      const res = await fetch(`/api/my/media/${deleteTarget.id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== deleteTarget.id))
        setStats((prev) => ({
          ...prev,
          totalCount: Math.max(0, prev.totalCount - 1),
          totalSize: Math.max(0, prev.totalSize - deleteTarget.size),
        }))
        setDeleteTarget(null)
      }
    } catch (err) {
      console.error("Failed to delete media:", err)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border/80">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Images className="size-5 text-primary" />
            <h1 className="font-heading text-xl font-bold tracking-tight">
              {t("My Uploaded Media", "আমার আপলোডকৃত মিডিয়া")}
            </h1>
            <Badge variant="secondary" className="text-xs font-mono">
              {stats.totalCount} {t("Images", "ছবি")}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {t(
              "Central gallery for your uploaded images across projects, articles, and profile credentials.",
              "প্রজেক্ট, ব্লগ পোস্ট ও প্রোফাইলের জন্য আপনার আপলোড করা সকল ছবি ও মিডিয়ার সংগ্রহশালা।"
            )}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Total Storage Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/60 bg-muted/40 text-xs text-muted-foreground">
            <HardDrive className="size-3.5 text-primary" />
            <span>
              {t("Storage Used:", "ব্যবহৃত স্টোরেজ:")}{" "}
              <strong className="text-foreground font-mono">{formatBytes(stats.totalSize)}</strong>
            </span>
          </div>

          <Button
            size="sm"
            onClick={() => setUploadOpen(true)}
            className="gap-1.5 shadow-sm"
          >
            <Plus className="size-4" />
            <span>{t("Upload Image", "নতুন ছবি আপলোড")}</span>
          </Button>
        </div>
      </div>

      {/* Filter Chips & Search Bar */}
      <Card className="p-3.5 border-border/80 shadow-xs space-y-3">
        {/* Top toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("Search by filename or description...", "ফাইলের নাম বা বিবরণ দিয়ে খুঁজুন...")}
              className="pl-8 pr-7 h-8 text-xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Sort & View Mode */}
          <div className="flex items-center gap-2 shrink-0">
            <Select value={sort} onValueChange={(val: any) => setSort(val)}>
              <SelectTrigger className="h-8 text-xs w-[140px]">
                <SelectValue placeholder={t("Sort by", "সর্ট করুন")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">{t("Newest First", "নতুনতম আগে")}</SelectItem>
                <SelectItem value="oldest">{t("Oldest First", "পুরাতনতম আগে")}</SelectItem>
                <SelectItem value="size-desc">{t("Size (Largest)", "আকার (বড়)")}</SelectItem>
                <SelectItem value="size-asc">{t("Size (Smallest)", "আকার (ছোট)")}</SelectItem>
                <SelectItem value="name">{t("File Name (A-Z)", "নাম অনুসারে")}</SelectItem>
              </SelectContent>
            </Select>

            {/* View Mode Toggle */}
            <div className="flex items-center rounded-lg border border-border p-0.5 bg-muted/40">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-1 rounded-md transition-colors",
                  viewMode === "grid"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title={t("Grid View", "গ্রিড ভিউ")}
              >
                <LayoutGrid className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={cn(
                  "p-1 rounded-md transition-colors",
                  viewMode === "list"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title={t("List View", "লিস্ট ভিউ")}
              >
                <List className="size-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Folder Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 border-t border-border/50 pt-2.5">
          {MEDIA_FOLDERS.map((f) => {
            const count =
              f.id === "all"
                ? stats.totalCount
                : stats.folderCounts?.[f.id] || 0
            const active = selectedFolder === f.id

            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setSelectedFolder(f.id)}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full transition-colors whitespace-nowrap",
                  active
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                )}
              >
                <span>{isBn ? f.nameBn : f.name}</span>
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-full",
                    active
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
      </Card>

      {/* Gallery Content Area */}
      {loading ? (
        <div className="py-20 text-center text-xs text-muted-foreground space-y-2">
          <Spinner className="size-6 mx-auto text-primary" />
          <p>{t("Loading your media library...", "মিডিয়া লোড হচ্ছে...")}</p>
        </div>
      ) : items.length === 0 ? (
        <Card className="border-dashed p-12 text-center space-y-4">
          <div className="size-14 rounded-full bg-muted/60 mx-auto flex items-center justify-center text-muted-foreground/40">
            <ImageIcon className="size-7" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-sm">
              {t("No images found in your gallery", "আপনার গ্যালারিতে কোনো ছবি পাওয়া যায়নি")}
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {search || selectedFolder !== "all"
                ? t(
                    "Try clearing your search query or folder filter to see more images.",
                    "সার্চ বা ফোল্ডার ফিল্টার পরিবর্তন করে দেখুন।"
                  )
                : t(
                    "Upload project cover pictures, circuit diagrams, or article illustrations to your personal media gallery.",
                    "আপনার প্রজেক্ট, সার্কিট ডায়াগ্রাম বা আর্টিকেলের জন্য ব্যক্তিগত গ্যালারিতে ছবি আপলোড করুন।"
                  )}
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setUploadOpen(true)}
            className="gap-1.5 mx-auto"
          >
            <Plus className="size-4" />
            <span>{t("Upload First Image", "প্রথম ছবি আপলোড করুন")}</span>
          </Button>
        </Card>
      ) : viewMode === "grid" ? (
        /* Grid View */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
          {items.map((item) => (
            <div
              key={item.id}
              className="group relative rounded-xl border border-border/70 bg-card overflow-hidden shadow-xs hover:border-primary/50 hover:shadow-md transition-all duration-200 flex flex-col"
            >
              {/* Image Preview Container */}
              <div
                onClick={() => setPreviewItem(item)}
                className="relative aspect-square w-full bg-muted/30 overflow-hidden cursor-pointer"
              >
                <img
                  src={item.thumbnailUrl || item.url}
                  alt={item.alt || item.name}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />

                {/* Hover overlay with action icons */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-1.5 p-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setPreviewItem(item)
                    }}
                    className="p-1.5 rounded-full bg-background/90 text-foreground hover:bg-background transition-colors"
                    title={t("Preview image", "প্রিভিউ দেখুন")}
                  >
                    <Eye className="size-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      copyUrl(item.url, `card-url-${item.id}`)
                    }}
                    className="p-1.5 rounded-full bg-background/90 text-foreground hover:bg-background transition-colors"
                    title={t("Copy Direct URL", "লিঙ্ক কপি করুন")}
                  >
                    {copiedKey === `card-url-${item.id}` ? (
                      <Check className="size-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      copyMarkdown(item, `card-md-${item.id}`)
                    }}
                    className="p-1.5 rounded-full bg-background/90 text-foreground hover:bg-background transition-colors"
                    title={t("Copy Markdown", "মার্কডাউন কোড কপি করুন")}
                  >
                    {copiedKey === `card-md-${item.id}` ? (
                      <Check className="size-3.5 text-emerald-600" />
                    ) : (
                      <FileCode className="size-3.5" />
                    )}
                  </button>
                </div>

                {/* Folder pill tag */}
                {item.folder && (
                  <Badge
                    variant="secondary"
                    className="absolute top-2 left-2 text-[9px] px-1.5 py-0 bg-background/80 backdrop-blur-xs border-0 shadow-xs capitalize"
                  >
                    {item.folder}
                  </Badge>
                )}
              </div>

              {/* Card Meta Footer */}
              <div className="p-2.5 flex-1 flex flex-col justify-between space-y-1">
                <p className="text-xs font-semibold text-foreground truncate" title={item.name}>
                  {item.name}
                </p>

                <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
                  <span>{formatBytes(item.size)}</span>
                  {item.width && item.height && (
                    <span>
                      {item.width}×{item.height}
                    </span>
                  )}
                </div>

                {/* Quick actions bottom row */}
                <div className="flex items-center justify-between pt-1 border-t border-border/40">
                  <button
                    type="button"
                    onClick={() => copyUrl(item.url, `btn-url-${item.id}`)}
                    className="text-[10px] text-primary hover:underline flex items-center gap-1 font-medium"
                  >
                    {copiedKey === `btn-url-${item.id}` ? (
                      <span className="text-emerald-600 flex items-center gap-0.5">
                        <Check className="size-2.5" /> {t("Copied!", "কপি হয়েছে!")}
                      </span>
                    ) : (
                      <span>{t("Copy URL", "কপি")}</span>
                    )}
                  </button>

                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(item)}
                      className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                      title={t("Delete image", "ছবি মুছুন")}
                    >
                      <Trash2 className="size-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <Card className="overflow-hidden border-border/80">
          <div className="divide-y divide-border/60">
            {items.map((item) => (
              <div
                key={item.id}
                className="p-3 flex items-center justify-between gap-3 text-xs hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={item.thumbnailUrl || item.url}
                    alt={item.alt || item.name}
                    className="size-11 rounded-lg object-cover border border-border shrink-0 cursor-pointer"
                    onClick={() => setPreviewItem(item)}
                  />
                  <div className="min-w-0 space-y-0.5">
                    <p className="font-semibold text-foreground truncate" title={item.name}>
                      {item.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {item.alt || t("No description", "কোনো বিবরণ নেই")}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
                      <span>{formatBytes(item.size)}</span>
                      {item.width && item.height && (
                        <span>
                          • {item.width}×{item.height}px
                        </span>
                      )}
                      {item.folder && (
                        <span className="capitalize bg-muted px-1.5 py-0.2 rounded-xs">
                          {item.folder}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => copyUrl(item.url, `list-url-${item.id}`)}
                    className="h-7 text-xs gap-1"
                  >
                    {copiedKey === `list-url-${item.id}` ? (
                      <Check className="size-3 text-emerald-600" />
                    ) : (
                      <Copy className="size-3" />
                    )}
                    <span>{t("Copy URL", "কপি")}</span>
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setPreviewItem(item)}
                    className="h-7 w-7 p-0"
                    title={t("Preview", "প্রিভিউ")}
                  >
                    <Eye className="size-3.5" />
                  </Button>

                  {canDelete && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTarget(item)}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      title={t("Delete", "মুছুন")}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Upload Modal Dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="size-5 text-primary" />
              <span>{t("Upload Image to Gallery", "গ্যালারিতে ছবি আপলোড")}</span>
            </DialogTitle>
            <DialogDescription className="text-xs pt-1">
              {t(
                "Upload photos, screenshots, or diagrams. Images are automatically optimized and served via CDN.",
                "ছবি, স্ক্রিনশট বা ডায়াগ্রাম আপলোড করুন। ছবিগুলো স্বয়ংক্রিয়ভাবে অপ্টিমাইজ হয়ে ক্লাউড সিডিএন-এ সংরক্ষিত হবে।"
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Drag & drop file area */}
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault()
                setIsDragging(false)
                if (e.dataTransfer.files?.[0]) {
                  handleFileChange(e.dataTransfer.files[0])
                }
              }}
              className={cn(
                "relative rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors",
                isDragging
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50 hover:bg-muted/30"
              )}
            >
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleFileChange(e.target.files[0])
                  }
                }}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />

              {uploadPreview ? (
                <div className="space-y-2">
                  <img
                    src={uploadPreview}
                    alt="Preview"
                    className="size-24 rounded-lg object-cover mx-auto border border-border shadow-xs"
                  />
                  <p className="text-xs font-semibold text-foreground truncate max-w-xs mx-auto">
                    {uploadFile?.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {uploadFile ? formatBytes(uploadFile.size) : ""} •{" "}
                    <span className="text-primary hover:underline">
                      {t("Click to change file", "ফাইল পরিবর্তন করতে ক্লিক করুন")}
                    </span>
                  </p>
                </div>
              ) : isCompressing ? (
                <div className="space-y-2 py-4">
                  <Spinner className="size-6 mx-auto text-primary" />
                  <p className="text-xs text-muted-foreground">
                    {t("Optimizing image...", "ছবি অপ্টিমাইজ করা হচ্ছে...")}
                  </p>
                </div>
              ) : (
                <div className="space-y-2 py-2">
                  <div className="size-10 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
                    <Upload className="size-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">
                      {t("Click to browse or drag & drop image here", "ক্লিক করে বা ড্র্যাগ করে ছবি নির্বাচন করুন")}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      JPG, PNG, WebP, GIF, SVG (Max 10 MB)
                    </p>
                  </div>
                </div>
              )}
            </div>

            {uploadError && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Folder selection */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{t("Target Folder", "ফোল্ডার")}</Label>
              <Select value={uploadFolder} onValueChange={(val) => { if (val) setUploadFolder(val) }}>
                <SelectTrigger className="text-xs h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">{t("General", "সাধারণ")}</SelectItem>
                  <SelectItem value="projects">{t("Projects", "প্রজেক্ট")}</SelectItem>
                  <SelectItem value="posts">{t("Posts & Articles", "পোস্ট ও আর্টিকেল")}</SelectItem>
                  <SelectItem value="achievements">{t("Achievements", "অর্জনসমূহ")}</SelectItem>
                  <SelectItem value="avatars">{t("Avatars & Profile", "প্রোফাইল ছবি")}</SelectItem>
                  <SelectItem value="documents">{t("Documents", "ডকুমেন্টস")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Alt text input */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                {t("Description / Alt Text (Optional)", "ছবির বিবরণ (ঐচ্ছিক)")}
              </Label>
              <Input
                value={uploadAlt}
                onChange={(e) => setUploadAlt(e.target.value)}
                placeholder={t("Brief description of the image content...", "ছবির বিষয়বস্তু সম্পর্কে সংক্ষিপ্ত বিবরণ...")}
                className="text-xs h-8"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isUploading}
              onClick={() => {
                setUploadOpen(false)
                setUploadFile(null)
                setUploadPreview(null)
                setUploadError(null)
              }}
            >
              {t("Cancel", "বাতিল")}
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={!uploadFile || isUploading || isCompressing}
              onClick={handleUploadSubmit}
              className="gap-1.5"
            >
              {isUploading && <Spinner className="size-3.5" />}
              <span>{t("Upload Now", "আপলোড সম্পন্ন করুন")}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Lightbox Modal */}
      <Dialog open={Boolean(previewItem)} onOpenChange={(open) => !open && setPreviewItem(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-4 border-b border-border bg-muted/20">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-sm font-bold truncate pr-6">
                {previewItem?.name}
              </DialogTitle>
            </div>
          </DialogHeader>

          {previewItem && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="rounded-lg overflow-hidden border border-border bg-black/5 dark:bg-black/30 flex items-center justify-center p-2">
                <img
                  src={previewItem.url}
                  alt={previewItem.alt || previewItem.name}
                  className="max-h-[380px] w-auto max-w-full object-contain rounded-md"
                />
              </div>

              {/* Image Info Details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2.5 rounded-lg border border-border bg-muted/20 space-y-0.5">
                  <p className="text-[10px] text-muted-foreground uppercase">{t("File Size", "সাইজ")}</p>
                  <p className="font-semibold font-mono">{formatBytes(previewItem.size)}</p>
                </div>
                <div className="p-2.5 rounded-lg border border-border bg-muted/20 space-y-0.5">
                  <p className="text-[10px] text-muted-foreground uppercase">{t("Dimensions", "মাত্রা")}</p>
                  <p className="font-semibold font-mono">
                    {previewItem.width && previewItem.height
                      ? `${previewItem.width}×${previewItem.height}px`
                      : "Auto"}
                  </p>
                </div>
                <div className="p-2.5 rounded-lg border border-border bg-muted/20 space-y-0.5">
                  <p className="text-[10px] text-muted-foreground uppercase">{t("Folder", "ফোল্ডার")}</p>
                  <p className="font-semibold capitalize">{previewItem.folder || "general"}</p>
                </div>
                <div className="p-2.5 rounded-lg border border-border bg-muted/20 space-y-0.5">
                  <p className="text-[10px] text-muted-foreground uppercase">{t("Type", "টাইপ")}</p>
                  <p className="font-semibold font-mono truncate">{previewItem.mimeType || "image"}</p>
                </div>
              </div>

              {/* Direct URL Box */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">{t("CDN Image Link", "সিডিএন লিঙ্ক")}</Label>
                <div className="flex items-center gap-2">
                  <Input value={previewItem.url} readOnly className="h-8 text-xs font-mono" />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => copyUrl(previewItem.url, "modal-url")}
                    className="h-8 px-3 text-xs shrink-0"
                  >
                    {copiedKey === "modal-url" ? (
                      <Check className="size-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="p-4 border-t border-border flex justify-between sm:justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => previewItem && copyMarkdown(previewItem, "modal-md")}
              className="gap-1.5 text-xs"
            >
              {copiedKey === "modal-md" ? (
                <Check className="size-3.5 text-emerald-600" />
              ) : (
                <FileCode className="size-3.5" />
              )}
              <span>{t("Copy Markdown Code", "মার্কডাউন কোড")}</span>
            </Button>

            <div className="flex items-center gap-2">
              <a
                href={previewItem?.url}
                target="_blank"
                rel="noreferrer"
                className={buttonVariants({ variant: "outline", size: "sm", className: "gap-1 text-xs" })}
              >
                <span>{t("Open in New Tab", "নতুন ট্যাবে খুলুন")}</span>
                <ExternalLink className="size-3" />
              </a>
              {canDelete && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    const target = previewItem
                    setPreviewItem(null)
                    setDeleteTarget(target)
                  }}
                  className="gap-1 text-xs"
                >
                  <Trash2 className="size-3.5" />
                  <span>{t("Delete", "মুছুন")}</span>
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="size-5" />
              <span>{t("Delete Image Permanently?", "ছবিটি স্থায়ীভাবে মুছে ফেলবেন?")}</span>
            </DialogTitle>
            <DialogDescription className="text-xs pt-1">
              {t(
                `Are you sure you want to delete "${deleteTarget?.name}"? Any post or project referencing this image may show a broken link. This cannot be undone.`,
                `আপনি কি নিশ্চিত যে "${deleteTarget?.name}" স্থায়ীভাবে মুছে ফেলতে চান? এটি আর ফিরিয়ে আনা যাবে না।`
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isDeleting}
              onClick={() => setDeleteTarget(null)}
            >
              {t("Cancel", "বাতিল")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isDeleting}
              onClick={handleDeleteSubmit}
              className="gap-1.5"
            >
              {isDeleting && <Spinner className="size-3.5" />}
              <span>{t("Yes, Delete", "হ্যাঁ, মুছে ফেলুন")}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
