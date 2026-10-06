"use client"

import {
  AlertCircle,
  Check,
  Copy,
  ExternalLink,
  FileCheck2,
  FileText,
  Folder,
  IdCard,
  Images,
  Loader2,
  ShieldCheck,
  Trash2,
  Upload,
  User as UserIcon,
} from "lucide-react"
import Image from "next/image"
import { useEffect, useState } from "react"

import { useLanguage } from "@/components/language-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
  formatBytes,
  MEDIA_FOLDERS,
  type MediaFolderId,
  type MediaItemSummary,
} from "@/lib/media-constants"
import { compressImage } from "@/lib/client-image-compression"
import type { AdminUserDetail } from "@/lib/services/admin-user.service"
import { cn } from "cn"

interface AdminUserMediaProps {
  user: AdminUserDetail
  isSelf: boolean
}

export function AdminUserMedia({ user }: AdminUserMediaProps) {
  const { t } = useLanguage()

  const [mediaList, setMediaList] = useState<MediaItemSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeFolder, setActiveFolder] = useState<MediaFolderId>("all")
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  // Quick upload for user
  const [isUploading, setIsUploading] = useState(false)
  const [uploadTargetFolder, setUploadTargetFolder] = useState<string>("documents")

  const avatarUrl =
    user.avatar || (user.images.length > 0 ? user.images[user.selectedImageIndex] || user.images[0] : null)
  const studentCardUrl = user.member?.studentIdCardUrl || null
  const nidUrl = user.member?.nidorbirthUrl || null

  useEffect(() => {
    let active = true

    fetch(`/api/admin/media?userId=${user.id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load user media")
        return res.json()
      })
      .then((data) => {
        if (active) {
          setMediaList(data.items || [])
          setLoading(false)
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : String(err))
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [user.id])

  async function copyToClipboard(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedKey(key)
      setTimeout(() => setCopiedKey(null), 2000)
    } catch {
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

  async function handleAdminFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      let fileToUpload = file
      if (file.type.startsWith("image/")) {
        fileToUpload = await compressImage(file)
      }

      const formData = new FormData()
      formData.append("file", fileToUpload)
      formData.append("folder", uploadTargetFolder)

      const res = await fetch("/api/admin/media", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to upload file")

      setMediaList((prev) => [data, ...prev])
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setIsUploading(false)
      e.target.value = ""
    }
  }

  async function handleDeleteMedia(item: MediaItemSummary) {
    if (!confirm(t("Delete this file permanently?", "এই ফাইলটি স্থায়ীভাবে মুছে ফেলতে চান?"))) {
      return
    }

    try {
      const res = await fetch(`/api/admin/media/${item.id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete media item")
      setMediaList((prev) => prev.filter((m) => m.id !== item.id))
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Delete failed")
    }
  }

  const filteredMedia = mediaList.filter((item) => {
    if (activeFolder === "all") return true
    return (
      item.folder?.toLowerCase() === activeFolder.toLowerCase() ||
      item.filePath?.toLowerCase().includes(`/${activeFolder}/`)
    )
  })

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. Identity & Verification Documents Overview */}
      {/* ========================================================================= */}
      <Card className="border-border/80 bg-card/60 backdrop-blur-xs">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <IdCard className="size-4 text-primary" />
            <span>{t("Identity & Verification Documents", "পরিচয় ও ভেরিফিকেশন ডকুমেন্টস")}</span>
          </CardTitle>
          <CardDescription className="text-xs">
            {t(
              "Official profile photo, student identity card, and NID / Birth certificate submitted by the user.",
              "ব্যবহারকারীর অফিসিয়াল প্রোফাইল ছবি, স্টুডেন্ট আইডি কার্ড এবং এনআইডি / জন্ম সনদ।"
            )}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-4 pt-2">
          <div className="grid gap-3 sm:grid-cols-3">
            {/* Avatar Tile */}
            <div className="flex flex-col justify-between rounded-xl border border-border/70 bg-background/50 p-3.5">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold flex items-center gap-1.5">
                    <UserIcon className="size-3.5 text-blue-500" />
                    {t("Profile Avatar", "প্রোফাইল ছবি")}
                  </span>
                  {avatarUrl ? (
                    <Badge variant="secondary" className="text-[10px]">
                      {t("Uploaded", "আপলোড করা")}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] text-muted-foreground">
                      {t("None", "নেই")}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <Avatar className="size-16 border border-border/80">
                    <AvatarImage src={avatarUrl || ""} alt={user.name} />
                    <AvatarFallback className="text-sm font-bold">
                      {user.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 space-y-0.5 text-xs">
                    <p className="font-semibold truncate">{user.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate font-mono">
                      {user.email}
                    </p>
                  </div>
                </div>
              </div>

              {avatarUrl && (
                <div className="mt-3 flex items-center gap-1.5 border-t border-border/60 pt-2 text-xs">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs flex-1 gap-1"
                    onClick={() => copyToClipboard(avatarUrl, "avatar-url")}
                  >
                    {copiedKey === "avatar-url" ? (
                      <Check className="size-3 text-emerald-500" />
                    ) : (
                      <Copy className="size-3" />
                    )}
                    <span>{t("Copy URL", "কপি ইউআরএল")}</span>
                  </Button>
                  <a
                    href={avatarUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex size-7 items-center justify-center rounded-md border border-border hover:bg-muted"
                    title={t("View Original", "মূল ছবি দেখুন")}
                  >
                    <ExternalLink className="size-3" />
                  </a>
                </div>
              )}
            </div>

            {/* Student ID Card Tile */}
            <div className="flex flex-col justify-between rounded-xl border border-border/70 bg-background/50 p-3.5">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold flex items-center gap-1.5">
                    <FileCheck2 className="size-3.5 text-emerald-500" />
                    {t("Student ID Card", "স্টুডেন্ট আইডি কার্ড")}
                  </span>
                  {studentCardUrl ? (
                    <Badge variant="secondary" className="text-[10px]">
                      {t("Uploaded", "আপলোড করা")}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] text-muted-foreground">
                      {t("Not Uploaded", "আপলোড হয়নি")}
                    </Badge>
                  )}
                </div>

                {studentCardUrl ? (
                  <div className="pt-1">
                    {studentCardUrl.endsWith(".pdf") ? (
                      <div className="flex h-16 items-center justify-center rounded-lg border border-border/60 bg-muted/40 p-2">
                        <FileText className="size-6 text-red-500" />
                        <span className="ml-2 text-xs font-medium">PDF Document</span>
                      </div>
                    ) : (
                      <div className="relative h-16 w-full overflow-hidden rounded-lg border border-border/60 bg-muted/30">
                        <Image
                          src={studentCardUrl}
                          alt="Student ID Card"
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex h-16 items-center justify-center rounded-lg border border-dashed border-border/80 text-[11px] text-muted-foreground">
                    {t("No student ID card provided", "কোনো স্টুডেন্ট আইডি কার্ড জমা দেওয়া হয়নি")}
                  </div>
                )}
              </div>

              {studentCardUrl && (
                <div className="mt-3 flex items-center gap-1.5 border-t border-border/60 pt-2 text-xs">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs flex-1 gap-1"
                    onClick={() => copyToClipboard(studentCardUrl, "student-id-url")}
                  >
                    {copiedKey === "student-id-url" ? (
                      <Check className="size-3 text-emerald-500" />
                    ) : (
                      <Copy className="size-3" />
                    )}
                    <span>{t("Copy URL", "কপি ইউআরএল")}</span>
                  </Button>
                  <a
                    href={studentCardUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex size-7 items-center justify-center rounded-md border border-border hover:bg-muted"
                    title={t("Open Document", "ডকুমেন্ট খুলুন")}
                  >
                    <ExternalLink className="size-3" />
                  </a>
                </div>
              )}
            </div>

            {/* NID / Birth Certificate Tile */}
            <div className="flex flex-col justify-between rounded-xl border border-border/70 bg-background/50 p-3.5">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold flex items-center gap-1.5">
                    <ShieldCheck className="size-3.5 text-amber-500" />
                    {t("NID / Birth Certificate", "এনআইডি / জন্ম সনদ")}
                  </span>
                  {nidUrl ? (
                    <Badge variant="secondary" className="text-[10px]">
                      {t("Uploaded", "আপলোড করা")}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] text-muted-foreground">
                      {t("Not Uploaded", "আপলোড হয়নি")}
                    </Badge>
                  )}
                </div>

                {nidUrl ? (
                  <div className="pt-1">
                    {nidUrl.endsWith(".pdf") ? (
                      <div className="flex h-16 items-center justify-center rounded-lg border border-border/60 bg-muted/40 p-2">
                        <FileText className="size-6 text-red-500" />
                        <span className="ml-2 text-xs font-medium">PDF Document</span>
                      </div>
                    ) : (
                      <div className="relative h-16 w-full overflow-hidden rounded-lg border border-border/60 bg-muted/30">
                        <Image
                          src={nidUrl}
                          alt="NID or Birth Certificate"
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex h-16 items-center justify-center rounded-lg border border-dashed border-border/80 text-[11px] text-muted-foreground">
                    {t("No verification document provided", "কোনো ভেরিফিকেশন ডকুমেন্ট জমা দেওয়া হয়নি")}
                  </div>
                )}
              </div>

              {nidUrl && (
                <div className="mt-3 flex items-center gap-1.5 border-t border-border/60 pt-2 text-xs">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs flex-1 gap-1"
                    onClick={() => copyToClipboard(nidUrl, "nid-url")}
                  >
                    {copiedKey === "nid-url" ? (
                      <Check className="size-3 text-emerald-500" />
                    ) : (
                      <Copy className="size-3" />
                    )}
                    <span>{t("Copy URL", "কপি ইউআরএল")}</span>
                  </Button>
                  <a
                    href={nidUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex size-7 items-center justify-center rounded-md border border-border hover:bg-muted"
                    title={t("Open Document", "ডকুমেন্ট খুলুন")}
                  >
                    <ExternalLink className="size-3" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* 2. All Uploaded Media & Files */}
      {/* ========================================================================= */}
      <Card className="border-border/80 bg-card/60 backdrop-blur-xs">
        <CardHeader className="p-4 pb-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Images className="size-4 text-primary" />
                <span>{t("User Uploaded Files", "ব্যবহারকারীর আপলোডকৃত ফাইলসমূহ")}</span>
                <span className="text-xs font-mono text-muted-foreground font-normal">
                  ({mediaList.length})
                </span>
              </CardTitle>
              <CardDescription className="text-xs">
                {t(
                  "All files and media uploaded to ImageKit by this account.",
                  "এই অ্যাকাউন্ট থেকে ইমেজকিটে আপলোড করা সমস্ত মিডিয়া ও ফাইল।"
                )}
              </CardDescription>
            </div>

            {/* Quick Upload Action */}
            <div className="flex items-center gap-2">
              <label
                className={cn(
                  "inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-primary/30 bg-primary/10 px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors",
                  isUploading && "pointer-events-none opacity-60"
                )}
              >
                {isUploading ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Upload className="size-3.5" />
                )}
                <span>{t("Upload for this user", "এই ইউজারের জন্য আপলোড")}</span>
                <input
                  type="file"
                  className="hidden"
                  onChange={handleAdminFileUpload}
                  disabled={isUploading}
                />
              </label>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 p-4 pt-2">
          {/* Folder filter pills */}
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
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
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

          {/* Media Grid / Empty State */}
          {loading ? (
            <div className="flex h-48 flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-6 animate-spin text-primary" />
              <span>{t("Loading media...", "মিডিয়া লোড হচ্ছে...")}</span>
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : filteredMedia.length === 0 ? (
            <div className="flex h-44 flex-col items-center justify-center rounded-xl border border-dashed border-border/80 p-6 text-center text-xs text-muted-foreground">
              <Images className="size-8 text-muted-foreground/50 mb-2" />
              <p className="font-medium text-foreground">
                {t("No media found in this folder", "এই ফোল্ডারে কোনো মিডিয়া পাওয়া যায়নি")}
              </p>
              <p className="text-[11px] mt-0.5">
                {t(
                  "Files uploaded by this user will appear here.",
                  "এই ব্যবহারকারীর আপলোডকৃত সমস্ত ফাইল এখানে প্রদর্শিত হবে।"
                )}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {filteredMedia.map((item) => {
                const isUrlCopied = copiedKey === `url-${item.id}`
                const isPdf = item.mimeType === "application/pdf"

                return (
                  <Card
                    key={item.id}
                    className="group relative flex flex-col overflow-hidden border-border/80 bg-background/50 hover:border-primary/40 transition-all shadow-xs"
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-square w-full overflow-hidden bg-muted/40">
                      {isPdf ? (
                        <div className="flex size-full flex-col items-center justify-center gap-1 p-2 text-center text-muted-foreground">
                          <FileText className="size-8 text-red-500" />
                          <span className="truncate max-w-full text-[10px] font-mono">
                            {item.name}
                          </span>
                        </div>
                      ) : (
                        <Image
                          src={item.thumbnailUrl || item.url}
                          alt={item.alt || item.name}
                          fill
                          sizes="(max-width: 640px) 50vw, 25vw"
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                      )}

                      {/* Folder & Size Badges */}
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

                    {/* Metadata & Actions */}
                    <div className="flex flex-1 flex-col justify-between p-2 text-xs">
                      <div>
                        <p className="truncate font-medium text-[11px]" title={item.name}>
                          {item.name}
                        </p>
                        {item.alt ? (
                          <p className="truncate text-[10px] text-muted-foreground" title={item.alt}>
                            alt: {item.alt}
                          </p>
                        ) : null}
                      </div>

                      <div className="mt-2 flex items-center justify-between border-t border-border/60 pt-1.5">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-6 text-muted-foreground hover:text-foreground"
                          onClick={() => copyToClipboard(item.url, `url-${item.id}`)}
                          title={t("Copy URL", "কপি")}
                        >
                          {isUrlCopied ? (
                            <Check className="size-3 text-emerald-500" />
                          ) : (
                            <Copy className="size-3" />
                          )}
                        </Button>

                        <div className="flex items-center gap-1">
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex size-6 items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                            title={t("Open in new tab", "নতুন ট্যাবে খুলুন")}
                          >
                            <ExternalLink className="size-3" />
                          </a>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-6 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeleteMedia(item)}
                            title={t("Delete file", "মুছুন")}
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
          )}
        </CardContent>
      </Card>
    </div>
  )
}
