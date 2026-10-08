"use client"

import { useState } from "react"
import {
  IdCard,
  Download,
  Eye,
  Award,
  Ticket,
  FileBadge,
  CheckCircle2,
  Loader2,
  Check,
  ImageIcon,
  User,
  ArrowUpRight,
  ExternalLink,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useLanguage } from "@/components/language-provider"
import { cn } from "cn"
import type { TemplateAssignmentSummary } from "@/lib/template-engine/types"

interface UserTemplatesGalleryProps {
  initialAssignments: TemplateAssignmentSummary[]
  userId: string
  userName: string
  userImages?: string[]
  initialSelectedImageIndex?: number
}

function getTemplateTypeLabel(type: string, t: (en: string, bn: string) => string) {
  switch (type) {
    case "MEMBER_CARD":
      return t("ID Card", "আইডি কার্ড")
    case "CERTIFICATE":
    case "COURSE_CERTIFICATE":
      return t("Certificate", "সার্টিফিকেট")
    case "EVENT_PASS":
      return t("Event Pass", "ইভেন্ট পাস")
    default:
      return t("Template", "টেমপ্লেট")
  }
}

export function UserTemplatesGallery({
  initialAssignments,
  userId,
  userName,
  userImages = [],
  initialSelectedImageIndex = 0,
}: UserTemplatesGalleryProps) {
  const { t } = useLanguage()

  const [assignments] = useState<TemplateAssignmentSummary[]>(initialAssignments)
  const [filterType, setFilterType] = useState<string>("ALL")

  // Selected Image from User.image array
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(
    initialSelectedImageIndex >= 0 && initialSelectedImageIndex < userImages.length
      ? initialSelectedImageIndex
      : 0
  )
  const [isUpdatingImage, setIsUpdatingImage] = useState<boolean>(false)
  const [renderCacheKey, setRenderCacheKey] = useState<number>(Date.now())

  // Preview Modal
  const [activePreviewTemplate, setActivePreviewTemplate] = useState<{ id: string; name: string } | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const filteredAssignments = assignments.filter((item) => {
    if (filterType === "ALL") return true
    if (filterType === "CERTIFICATE") {
      return item.template.type === "CERTIFICATE" || item.template.type === "COURSE_CERTIFICATE"
    }
    return item.template.type === filterType
  })

  // Handle User Photo Selection Change
  const handleSelectImage = async (index: number) => {
    if (index === selectedImageIndex && !isUpdatingImage) return
    setSelectedImageIndex(index)
    setIsUpdatingImage(true)

    try {
      const res = await fetch("/api/user/select-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedImageIndex: index }),
      })

      if (!res.ok) {
        throw new Error("Failed to update photo preference")
      }

      setRenderCacheKey(Date.now())
    } catch {
      setRenderCacheKey(Date.now())
    } finally {
      setIsUpdatingImage(false)
    }
  }

  const handleDownload = async (templateId: string, templateName: string) => {
    setDownloadingId(templateId)
    try {
      const renderUrl = `/api/media/templates/${templateId}/render?userId=${userId}&imageIndex=${selectedImageIndex}&download=1&_t=${renderCacheKey}`
      const res = await fetch(renderUrl)
      if (!res.ok) throw new Error("Failed to render card")

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${templateName.toLowerCase().replace(/\s+/g, "-")}-${userName.toLowerCase().replace(/\s+/g, "-")}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      alert(t("Failed to download image. Please try again.", "ডাউনলোড ব্যর্থ হয়েছে। আবার চেষ্টা করুন।"))
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header - Simple & Clean, matching /profile/enrolled */}
      <div className="space-y-1">
        <h1 className="font-heading text-lg font-semibold text-foreground flex items-center gap-2">
          <IdCard className="size-5 text-primary" />
          <span>{t("Cards & Certificates", "কার্ড ও সার্টিফিকেট")}</span>
        </h1>
        <p className="text-xs/relaxed text-muted-foreground">
          {t(
            "Access and download your digital membership cards, event passes, and verified credentials.",
            "আপনার ডিজিটাল মেম্বারশিপ কার্ড, ইভেন্ট পাস এবং ভেরিফাইড সনদ দেখুন ও ডাউনলোড করুন।"
          )}
        </p>
      </div>

      {/* Active Card Photo Customizer - Sleek & Interactive */}
      {userImages.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-md bg-primary/10 flex items-center justify-center text-primary">
                <ImageIcon className="size-3.5" />
              </div>
              <div>
                <h2 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <span>{t("Card Photo Selection", "কার্ডের ছবি নির্বাচন")}</span>
                  {isUpdatingImage ? (
                    <span className="inline-flex items-center gap-1 text-[10px] text-primary">
                      <Loader2 className="size-3 animate-spin" />
                      {t("Updating...", "আপডেট হচ্ছে...")}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-normal text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="size-3" />
                      {t("Live Preview Synced", "লাইভ সিঙ্ক")}
                    </span>
                  )}
                </h2>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground">
              {t(
                "Click a photo to display it on your ID cards and certificates.",
                "কার্ড ও সনদে ব্যবহারের জন্য যেকোনো একটি ছবিতে ক্লিক করুন।"
              )}
            </p>
          </div>

          <div className="flex items-center gap-2.5 overflow-x-auto pb-1 pt-0.5">
            {userImages.map((imgUrl, idx) => {
              const isSelected = idx === selectedImageIndex
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectImage(idx)}
                  className={cn(
                    "group relative w-12 h-14 sm:w-14 sm:h-16 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer text-left bg-muted/30",
                    isSelected
                      ? "border-primary ring-2 ring-primary/30 shadow-xs"
                      : "border-border/80 opacity-70 hover:opacity-100 hover:border-primary/50"
                  )}
                  title={t(`Select Photo #${idx + 1}`, `ছবি #${idx + 1} নির্বাচন করুন`)}
                >
                  <img
                    src={imgUrl}
                    alt={`Photo ${idx + 1}`}
                    className="size-full object-cover transition-transform duration-200 group-hover:scale-105"
                  />

                  {/* Active Selection Badge */}
                  {isSelected ? (
                    <div className="absolute top-1 right-1 size-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xs">
                      <Check className="size-2.5 stroke-[3]" />
                    </div>
                  ) : null}

                  {/* Photo Index Tag */}
                  <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-xs py-0.5 text-center">
                    <span className="text-[9px] font-mono font-medium text-white/90">
                      #{idx + 1}
                    </span>
                  </div>
                </button>
              )
            })}

            {/* Manage/Upload More in Profile */}
            <Link
              href="/profile"
              className="group flex flex-col items-center justify-center w-12 h-14 sm:w-14 sm:h-16 rounded-lg border border-dashed border-border hover:border-primary bg-muted/10 hover:bg-primary/5 text-muted-foreground hover:text-primary transition-all shrink-0 gap-1"
              title={t("Manage gallery photos in profile", "প্রোফাইলে ছবি পরিবর্তন করুন")}
            >
              <User className="size-3.5 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-medium leading-none">{t("Upload", "আপলোড")}</span>
              <ArrowUpRight className="size-2.5 opacity-60 group-hover:opacity-100" />
            </Link>
          </div>
        </div>
      )}

      {/* Filter Tabs (when multiple templates exist) */}
      {assignments.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <Button
            type="button"
            variant={filterType === "ALL" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType("ALL")}
            className="text-xs h-7 px-3"
          >
            {t("All", "সকল")} ({assignments.length})
          </Button>

          <Button
            type="button"
            variant={filterType === "MEMBER_CARD" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType("MEMBER_CARD")}
            className="text-xs h-7 px-3 gap-1"
          >
            <IdCard className="size-3" />
            <span>{t("ID Cards", "আইডি কার্ড")}</span>
          </Button>

          <Button
            type="button"
            variant={filterType === "CERTIFICATE" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType("CERTIFICATE")}
            className="text-xs h-7 px-3 gap-1"
          >
            <Award className="size-3" />
            <span>{t("Certificates", "সনদসমূহ")}</span>
          </Button>

          <Button
            type="button"
            variant={filterType === "EVENT_PASS" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType("EVENT_PASS")}
            className="text-xs h-7 px-3 gap-1"
          >
            <Ticket className="size-3" />
            <span>{t("Event Passes", "ইভেন্ট পাস")}</span>
          </Button>
        </div>
      )}

      {/* Empty State - Matching /profile/enrolled */}
      {filteredAssignments.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border p-12 text-center">
          <FileBadge className="size-12 text-muted-foreground/40 mb-3" />
          <h3 className="font-semibold text-sm text-foreground">
            {t("No cards or certificates yet", "এখনও কোনো কার্ড বা সনদ পাওয়া যায়নি")}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm">
            {t(
              "Cards and certificates assigned to you by administrators or upon event/course completion will appear here.",
              "অ্যাডমিনের মাধ্যমে নির্ধারিত অথবা ইভেন্ট/কোর্স শেষে প্রাপ্ত কার্ড ও সনদ এখানে দেখতে পাবেন।"
            )}
          </p>
        </div>
      ) : (
        /* Cards Grid - Matching /profile/enrolled format */
        <div className="grid gap-4 md:grid-cols-2">
          {filteredAssignments.map((assignment) => {
            const tpl = assignment.template
            const renderUrl = `/api/media/templates/${tpl.id}/render?userId=${userId}&imageIndex=${selectedImageIndex}&preview=1&_t=${renderCacheKey}`
            const typeLabel = getTemplateTypeLabel(tpl.type, t)

            return (
              <div
                key={assignment.id}
                className="flex flex-col justify-between overflow-hidden rounded-xl border border-border bg-card shadow-xs transition-all hover:border-primary/50 group"
              >
                {/* Header & Visual Preview */}
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white text-[10px] gap-1">
                      <CheckCircle2 className="size-3" />
                      <span>{t("Active Access", "চালু আছে")}</span>
                    </Badge>

                    <Badge variant="outline" className="text-[10px] text-muted-foreground font-mono">
                      {typeLabel}
                    </Badge>
                  </div>

                  <h3 className="font-heading font-bold text-sm text-foreground line-clamp-1 mb-3">
                    {tpl.name}
                  </h3>

                  {/* Template Canvas Preview */}
                  <div
                    className="relative aspect-[16/10] w-full rounded-lg overflow-hidden border border-border/80 bg-zinc-950 flex items-center justify-center p-2 cursor-pointer group-hover:border-primary/40 transition-colors"
                    onClick={() => setActivePreviewTemplate({ id: tpl.id, name: tpl.name })}
                    title={t("Click to view full screen", "ফুল স্ক্রিন দেখতে ক্লিক করুন")}
                  >
                    <img
                      src={renderUrl}
                      alt={tpl.name}
                      className="size-full object-contain rounded transition-transform duration-300 group-hover:scale-[1.01]"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background/90 text-foreground text-xs font-semibold shadow-md backdrop-blur-xs">
                        <Eye className="size-3.5" />
                        {t("Preview", "প্রিভিউ")}
                      </span>
                    </div>
                  </div>

                  {tpl.description && (
                    <p className="mt-3 text-xs text-muted-foreground line-clamp-2">
                      {tpl.description}
                    </p>
                  )}
                </div>

                {/* Footer - Matching /profile/enrolled */}
                <div className="border-t border-border bg-muted/20 px-5 py-3 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setActivePreviewTemplate({ id: tpl.id, name: tpl.name })}
                    className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>{t("Details", "বিবরণ")}</span>
                    <ExternalLink className="size-3" />
                  </button>

                  <Button
                    type="button"
                    size="sm"
                    className="text-xs font-semibold gap-1.5 h-8 px-3.5"
                    disabled={downloadingId === tpl.id}
                    onClick={() => handleDownload(tpl.id, tpl.name)}
                  >
                    {downloadingId === tpl.id ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Download className="size-3.5" />
                    )}
                    <span>{t("Download", "ডাউনলোড")}</span>
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Clean Full-Screen Preview Dialog */}
      {activePreviewTemplate && (
        <Dialog open={!!activePreviewTemplate} onOpenChange={() => setActivePreviewTemplate(null)}>
          <DialogContent className="max-w-4xl p-0 overflow-hidden bg-background border-border">
            <DialogHeader className="p-4 border-b border-border flex flex-row items-center justify-between gap-3">
              <DialogTitle className="text-sm font-semibold truncate">
                {activePreviewTemplate.name}
              </DialogTitle>
            </DialogHeader>

            <div className="relative aspect-[16/10] w-full bg-zinc-950 flex items-center justify-center p-4">
              <img
                src={`/api/media/templates/${activePreviewTemplate.id}/render?userId=${userId}&imageIndex=${selectedImageIndex}&preview=1&_t=${renderCacheKey}`}
                alt={activePreviewTemplate.name}
                className="size-full object-contain rounded shadow-lg"
              />
            </div>

            <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setActivePreviewTemplate(null)}
                className="text-xs h-8"
              >
                {t("Close", "বন্ধ করুন")}
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={() => handleDownload(activePreviewTemplate.id, activePreviewTemplate.name)}
                disabled={downloadingId === activePreviewTemplate.id}
                className="text-xs gap-1.5 h-8 font-semibold"
              >
                {downloadingId === activePreviewTemplate.id ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Download className="size-3.5" />
                )}
                {t("Download PNG", "ডাউনলোড পিএনজি")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
