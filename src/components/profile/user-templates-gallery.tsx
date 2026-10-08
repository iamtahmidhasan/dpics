"use client"

import { useState } from "react"
import {
  IdCard,
  Download,
  Eye,
  Sparkles,
  Award,
  Ticket,
  FileBadge,
  Layers,
  CheckCircle2,
  Calendar,
  Share2,
  Loader2,
  Printer,
  Copy,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useLanguage } from "@/components/language-provider"
import type { TemplateAssignmentSummary } from "@/lib/template-engine/types"

interface UserTemplatesGalleryProps {
  initialAssignments: TemplateAssignmentSummary[]
  userId: string
  userName: string
}

export function UserTemplatesGallery({
  initialAssignments,
  userId,
  userName,
}: UserTemplatesGalleryProps) {
  const { t } = useLanguage()
  const [assignments] = useState<TemplateAssignmentSummary[]>(initialAssignments)
  const [filterType, setFilterType] = useState<string>("ALL")
  const [activePreviewUrl, setActivePreviewUrl] = useState<string | null>(null)
  const [activePreviewTitle, setActivePreviewTitle] = useState<string>("")
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const filteredAssignments = assignments.filter((item) => {
    if (filterType === "ALL") return true
    return item.template.type === filterType
  })

  const handleDownload = async (templateId: string, templateName: string) => {
    setDownloadingId(templateId)
    try {
      const renderUrl = `/api/media/templates/${templateId}/render?userId=${userId}&download=1`
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

  const handleCopyLink = (templateId: string) => {
    const url = `${window.location.origin}/api/media/templates/${templateId}/render?userId=${userId}&preview=1`
    navigator.clipboard.writeText(url)
    setCopiedId(templateId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl border border-primary/20 bg-linear-to-r from-primary/10 via-primary/5 to-transparent p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/15 text-primary text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              {t("Digital Credentials & Passes", "ডিজিটাল সনদ ও পাস")}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              {t("My Cards & Certificates", "আমার কার্ড ও সার্টিফিকেট")}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
              {t(
                "Access and download your verified membership cards, event passes, and certificates in high resolution.",
                "আপনার ভেরিফাইড মেম্বারশিপ কার্ড, ইভেন্ট পাস এবং সার্টিফিকেট হাই রেজোলিউশনে দেখুন ও ডাউনলোড করুন।"
              )}
            </p>
          </div>

          <Badge variant="outline" className="self-start sm:self-auto text-xs px-3 py-1 font-mono">
            {assignments.length} {t("Items Available", "টি আইটেম")}
          </Badge>
        </div>
      </div>

      {/* Filter Tabs */}
      {assignments.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Button
            type="button"
            variant={filterType === "ALL" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType("ALL")}
            className="text-xs h-8"
          >
            <Layers className="w-3.5 h-3.5 mr-1.5" />
            {t("All", "সকল")} ({assignments.length})
          </Button>

          <Button
            type="button"
            variant={filterType === "MEMBER_CARD" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType("MEMBER_CARD")}
            className="text-xs h-8"
          >
            <IdCard className="w-3.5 h-3.5 mr-1.5" />
            {t("ID Cards", "আইডি কার্ড")}
          </Button>

          <Button
            type="button"
            variant={filterType === "CERTIFICATE" || filterType === "COURSE_CERTIFICATE" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType("CERTIFICATE")}
            className="text-xs h-8"
          >
            <Award className="w-3.5 h-3.5 mr-1.5" />
            {t("Certificates", "সনদসমূহ")}
          </Button>

          <Button
            type="button"
            variant={filterType === "EVENT_PASS" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType("EVENT_PASS")}
            className="text-xs h-8"
          >
            <Ticket className="w-3.5 h-3.5 mr-1.5" />
            {t("Event Passes", "ইভেন্ট পাস")}
          </Button>
        </div>
      )}

      {/* Gallery Cards Grid */}
      {filteredAssignments.length === 0 ? (
        <Card className="border-dashed bg-muted/20">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <FileBadge className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <p className="text-base font-semibold">
                {t("No cards or certificates found", "কোনো কার্ড বা সার্টিফিকেট পাওয়া যায়নি")}
              </p>
              <p className="text-xs text-muted-foreground max-w-md">
                {t(
                  "Cards and certificates assigned to you by administrators or upon event/course completion will appear here.",
                  "অ্যাডমিনের মাধ্যমে অ্যাসাইন করা অথবা ইভেন্ট/কোর্স শেষে প্রাপ্ত কার্ড ও সনদ এখানে দেখতে পাবেন।"
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredAssignments.map((assignment) => {
            const tpl = assignment.template
            const renderUrl = `/api/media/templates/${tpl.id}/render?userId=${userId}&preview=1`

            return (
              <Card
                key={assignment.id}
                className="overflow-hidden border border-border/70 hover:border-primary/50 transition-all shadow-md group flex flex-col justify-between"
              >
                {/* Visual Preview */}
                <div className="relative aspect-[16/10] bg-zinc-950/80 border-b border-border/50 overflow-hidden flex items-center justify-center p-3">
                  <img
                    src={renderUrl}
                    alt={tpl.name}
                    className="w-full h-full object-contain rounded transition-transform duration-300 group-hover:scale-[1.02]"
                    loading="lazy"
                  />

                  {/* Top Badge */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <Badge variant="secondary" className="text-[10px] font-semibold backdrop-blur bg-background/90 shadow">
                      {tpl.type}
                    </Badge>
                  </div>

                  {/* Hover Quick Action Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2.5 p-4">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="text-xs h-9 shadow-lg gap-1.5"
                      onClick={() => {
                        setActivePreviewUrl(renderUrl)
                        setActivePreviewTitle(tpl.name)
                      }}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      {t("View Full Screen", "ফুল স্ক্রিন দেখুন")}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="text-xs h-9 shadow-lg gap-1.5"
                      disabled={downloadingId === tpl.id}
                      onClick={() => handleDownload(tpl.id, tpl.name)}
                    >
                      {downloadingId === tpl.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )}
                      {t("Download PNG", "ডাউনলোড পিএনজি")}
                    </Button>
                  </div>
                </div>

                {/* Footer / Details */}
                <div className="p-4 sm:p-5 space-y-3">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-base font-bold text-foreground">{tpl.name}</h3>
                      <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {t("Verified", "ভেরিফাইড")}
                      </span>
                    </div>
                    {tpl.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {tpl.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-border/40 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(assignment.createdAt).toLocaleDateString()}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs"
                        onClick={() => handleCopyLink(tpl.id)}
                      >
                        {copiedId === tpl.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500 mr-1" />
                        ) : (
                          <Share2 className="w-3.5 h-3.5 mr-1" />
                        )}
                        {copiedId === tpl.id ? t("Copied", "কপি হয়েছে") : t("Share", "শেয়ার")}
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        className="h-8 text-xs gap-1.5"
                        disabled={downloadingId === tpl.id}
                        onClick={() => handleDownload(tpl.id, tpl.name)}
                      >
                        {downloadingId === tpl.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Download className="w-3.5 h-3.5" />
                        )}
                        {t("Download", "ডাউনলোড")}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Full Preview Modal */}
      {activePreviewUrl && (
        <Dialog open={!!activePreviewUrl} onOpenChange={() => setActivePreviewUrl(null)}>
          <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/95 border-zinc-800 text-white">
            <DialogHeader className="p-4 border-b border-zinc-800 flex flex-row items-center justify-between">
              <DialogTitle className="text-sm font-semibold">{activePreviewTitle}</DialogTitle>
            </DialogHeader>
            <div className="relative aspect-[16/10] w-full flex items-center justify-center p-4">
              <img
                src={activePreviewUrl}
                alt={activePreviewTitle}
                className="w-full h-full object-contain rounded shadow-2xl"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
