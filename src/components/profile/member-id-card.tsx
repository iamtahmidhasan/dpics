"use client"

import { useEffect, useState } from "react"
import {
  CreditCard,
  Download,
  ExternalLink,
  Eye,
  Loader2,
  RefreshCw,
  Share2,
  Sparkles,
} from "lucide-react"
import { toast } from "sonner"
import { useLanguage } from "@/components/language-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import type { MediaTemplateSummary } from "@/lib/template-engine/types"

interface MemberIdCardProps {
  userId: string
  memberId?: string | null
  userName: string
  studentId?: string | null
  department?: string | null
  isVerified?: boolean
}

export function MemberIdCard({
  userId,
  memberId,
  userName,
  studentId,
  department,
  isVerified = true,
}: MemberIdCardProps) {
  const { t } = useLanguage()

  const [templates, setTemplates] = useState<MediaTemplateSummary[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true)
  const [isImageLoading, setIsImageLoading] = useState(true)
  const [showFullModal, setShowFullModal] = useState(false)
  const [cacheBust, setCacheBust] = useState(Date.now())

  useEffect(() => {
    async function fetchTemplates() {
      try {
        const res = await fetch("/api/media/templates?type=MEMBER_CARD&active=true")
        if (res.ok) {
          const list: MediaTemplateSummary[] = await res.json()
          setTemplates(list)
          if (list.length > 0) {
            setSelectedTemplateId(list[0].id)
          }
        }
      } catch (err) {
        console.warn("Failed to load member templates:", err)
      } finally {
        setIsLoadingTemplates(false)
      }
    }

    fetchTemplates()
  }, [])

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId) || templates[0]

  const renderUrl = selectedTemplate
    ? `/api/media/templates/${selectedTemplate.id}/render?userId=${userId}&_t=${cacheBust}`
    : null

  const downloadUrl = selectedTemplate
    ? `/api/media/templates/${selectedTemplate.id}/render?userId=${userId}&download=1`
    : null

  const handleShare = async () => {
    if (!renderUrl) return

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${userName}'s DPICS Member ID Card`,
          text: `Official Digital Membership Card for ${userName} - DPI Computing Society`,
          url: window.location.origin + `/u/${userId}`,
        })
        toast.success(t("Shared successfully", "সফলভাবে শেয়ার করা হয়েছে"))
      } catch {
        // User dismissed
      }
    } else {
      navigator.clipboard.writeText(window.location.origin + `/u/${userId}`)
      toast.success(t("Profile link copied to clipboard", "প্রোফাইল লিংক কপি করা হয়েছে"))
    }
  }

  if (isLoadingTemplates) {
    return (
      <Card size="sm" className="flex items-center justify-center p-8">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </Card>
    )
  }

  if (templates.length === 0) {
    return null // No member card templates configured by admin yet
  }

  return (
    <>
      <Card size="sm" className="overflow-hidden border-border/80 bg-gradient-to-br from-card via-card to-muted/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-1.5 text-sm font-semibold">
              <CreditCard className="size-4 text-primary" />
              <span>{t("Digital Member ID Card", "ডিজিটাল মেম্বার আইডি কার্ড")}</span>
            </CardTitle>
            <Badge variant={isVerified ? "success" : "warning"} className="text-[10px]">
              {isVerified ? t("Official", "অফিসিয়াল") : t("Pending", "পেন্ডিং")}
            </Badge>
          </div>
          <CardDescription className="text-xs">
            {t(
              "Generated dynamically in high-resolution with embedded verification QR.",
              "যাচাইকরণ কিউআর সহ উচ্চ রেজোলিউশনে স্বয়ংক্রিয়ভাবে তৈরি।"
            )}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Card Preview Container */}
          <div
            onClick={() => setShowFullModal(true)}
            className="group relative aspect-[16/10] w-full cursor-pointer overflow-hidden rounded-lg border border-border/70 bg-black/5 shadow-inner transition-all hover:border-primary/40 hover:shadow-md"
          >
            {isImageLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/50 backdrop-blur-xs z-10 gap-2">
                <Loader2 className="size-5 animate-spin text-primary" />
                <span className="text-[11px] text-muted-foreground">{t("Rendering Card...", "কার্ড তৈরি হচ্ছে...")}</span>
              </div>
            )}

            {renderUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={renderUrl}
                alt={`${userName} Member Card`}
                onLoad={() => setIsImageLoading(false)}
                className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-102"
              />
            )}

            {/* Hover overlay hint */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 backdrop-blur-[2px] transition-opacity group-hover:opacity-100">
              <span className="flex items-center gap-1.5 rounded-full bg-background/90 px-3 py-1 text-xs font-semibold text-foreground shadow-sm">
                <Eye className="size-3.5" />
                {t("Click to Expand", "ক্লিক করে বড় দেখুন")}
              </span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex items-center justify-between gap-2 border-t border-border/50 pt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="gap-1.5 text-xs h-8"
          >
            <Share2 className="size-3.5" />
            <span>{t("Share", "শেয়ার")}</span>
          </Button>

          {downloadUrl && (
            <a href={downloadUrl} download>
              <Button size="sm" className="gap-1.5 text-xs font-semibold h-8">
                <Download className="size-3.5" />
                <span>{t("Download PNG", "ডাউনলোড পিএনজি")}</span>
              </Button>
            </a>
          )}
        </CardFooter>
      </Card>

      {/* Fullscreen Preview Modal */}
      {showFullModal && selectedTemplate && (
        <Dialog open={showFullModal} onOpenChange={setShowFullModal}>
          <DialogContent className="max-w-3xl p-6">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <Sparkles className="size-4 text-primary" />
                <span>{t("Official DPICS Membership Card", "ডিপিআইসিএস মেম্বারশিপ কার্ড")}</span>
              </DialogTitle>
              <DialogDescription className="text-xs">
                {userName} • {studentId || "DPI Member"}
              </DialogDescription>
            </DialogHeader>

            <div className="relative my-2 flex items-center justify-center rounded-lg border border-border bg-muted/20 p-2">
              {renderUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={renderUrl}
                  alt={`${userName} Member Card`}
                  className="max-h-[480px] w-auto rounded shadow-xl object-contain"
                />
              )}
            </div>

            <DialogFooter className="flex items-center justify-between sm:justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCacheBust(Date.now())}
                className="gap-1.5 text-xs text-muted-foreground"
              >
                <RefreshCw className="size-3.5" />
                <span>{t("Refresh", "রিফ্রেশ")}</span>
              </Button>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleShare} className="gap-1.5 text-xs">
                  <Share2 className="size-3.5" />
                  <span>{t("Share", "শেয়ার")}</span>
                </Button>

                {downloadUrl && (
                  <a href={downloadUrl} download>
                    <Button size="sm" className="gap-1.5 text-xs font-semibold">
                      <Download className="size-3.5" />
                      <span>{t("Download ID Card", "আইডি কার্ড ডাউনলোড")}</span>
                    </Button>
                  </a>
                )}
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
