"use client"

import { useState } from "react"
import {
  IdCard,
  Plus,
  Trash2,
  Download,
  Eye,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Layers,
  Calendar,
  ExternalLink,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useLanguage } from "@/components/language-provider"
import type { AdminUserDetail } from "@/lib/services/admin-user.service"
import type { MediaTemplateSummary, TemplateAssignmentSummary } from "@/lib/template-engine/types"

interface AdminUserTemplatesProps {
  user: AdminUserDetail
  initialAssignments: TemplateAssignmentSummary[]
  availableTemplates: MediaTemplateSummary[]
}

export function AdminUserTemplates({
  user,
  initialAssignments = [],
  availableTemplates = [],
}: AdminUserTemplatesProps) {
  const { t } = useLanguage()
  const [assignments, setAssignments] = useState<TemplateAssignmentSummary[]>(initialAssignments)
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    availableTemplates[0]?.id || ""
  )
  const [assigning, setAssigning] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [previewModalImage, setPreviewModalImage] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(
    user.selectedImageIndex ?? 0
  )
  const [isUpdatingImage, setIsUpdatingImage] = useState<boolean>(false)
  const [renderCacheKey, setRenderCacheKey] = useState<number>(Date.now())

  const handleSelectImage = async (index: number) => {
    setSelectedImageIndex(index)
    setIsUpdatingImage(true)
    try {
      await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: {
            selectedImageIndex: index,
          },
        }),
      })
      setRenderCacheKey(Date.now())
    } catch {
      setRenderCacheKey(Date.now())
    } finally {
      setIsUpdatingImage(false)
    }
  }

  // Filter templates that are not yet assigned
  const assignedIds = new Set(assignments.map((a) => a.templateId))
  const unassignedTemplates = availableTemplates.filter((tpl) => !assignedIds.has(tpl.id))

  const handleAssign = async () => {
    if (!selectedTemplateId) return
    setAssigning(true)
    setError(null)

    try {
      const res = await fetch("/api/admin/templates/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: selectedTemplateId,
          userIds: [user.id],
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error?.message || "Failed to assign template")
      }

      // Add to local state
      const tpl = availableTemplates.find((t) => t.id === selectedTemplateId)
      if (tpl) {
        const newAssignment: TemplateAssignmentSummary = {
          id: `new-${Date.now()}`,
          userId: user.id,
          templateId: tpl.id,
          template: tpl,
          status: "ACTIVE",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        setAssignments([newAssignment, ...assignments])
      }

      setAssignModalOpen(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to assign template")
    } finally {
      setAssigning(false)
    }
  }

  const handleUnassign = async (assignment: TemplateAssignmentSummary) => {
    if (!confirm(t("Are you sure you want to unassign this template?", "আপনি কি নিশ্চিত এই টেমপ্লেটটি বাতিল করতে চান?"))) {
      return
    }

    setDeletingId(assignment.id)
    try {
      const res = await fetch(`/api/admin/templates/assignments/${assignment.id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        throw new Error("Failed to remove assignment")
      }

      setAssignments(assignments.filter((a) => a.id !== assignment.id))
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error unassigning")
    } finally {
      setDeletingId(null)
    }
  }

  const handleDownload = async (templateId: string, templateName: string) => {
    setDownloadingId(templateId)
    try {
      const renderUrl = `/api/media/templates/${templateId}/render?userId=${user.id}&imageIndex=${selectedImageIndex}&download=1&_t=${renderCacheKey}`
      const res = await fetch(renderUrl)
      if (!res.ok) throw new Error("Failed to render card")

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${templateName.toLowerCase().replace(/\s+/g, "-")}-${user.name.toLowerCase().replace(/\s+/g, "-")}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      alert(err instanceof Error ? err.message : "Download failed")
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Photo Selector for Cards */}
      {user.images && user.images.length > 1 && (
        <div className="p-3.5 rounded-xl border border-border/70 bg-muted/20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-foreground">
              {t("Active Photo on Cards:", "কার্ডে সক্রিয় ছবি:")}
            </span>
            {isUpdatingImage && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />}
          </div>
          <div className="flex items-center gap-2">
            {user.images.map((imgUrl: string, idx: number) => {
              const isSelected = idx === selectedImageIndex
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectImage(idx)}
                  className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-all cursor-pointer ${
                    isSelected
                      ? "border-primary ring-2 ring-primary/40 scale-105"
                      : "border-border/60 opacity-60 hover:opacity-100"
                  }`}
                  title={`Select Photo #${idx + 1}`}
                >
                  <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                </button>
              )
            })}
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <IdCard className="w-5 h-5 text-primary" />
            {t("Assigned Cards & Templates", "অ্যাসাইনকৃত কার্ড ও টেমপ্লেট")}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t(
              "Manage dynamic ID cards, certificates, and event passes assigned to this user.",
              "এই ব্যবহারকারীর জন্য অ্যাসাইনকৃত আইডি কার্ড, সার্টিফিকেট এবং পাস পরিচালনা করুন।"
            )}
          </p>
        </div>

        <Button
          type="button"
          size="sm"
          onClick={() => {
            if (unassignedTemplates.length > 0) {
              setSelectedTemplateId(unassignedTemplates[0].id)
            }
            setAssignModalOpen(true)
          }}
          className="gap-1.5 text-xs h-9"
        >
          <Plus className="w-3.5 h-3.5" />
          {t("Assign New Template", "নতুন টেমপ্লেট অ্যাসাইন করুন")}
        </Button>
      </div>

      {/* Error notification */}
      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid of Assigned Templates */}
      {assignments.length === 0 ? (
        <Card className="border-dashed bg-muted/20">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Layers className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold">
                {t("No templates assigned yet", "এখনও কোনো টেমপ্লেট অ্যাসাইন করা হয়নি")}
              </p>
              <p className="text-xs text-muted-foreground max-w-sm">
                {t(
                  "Assign an ID card, achievement badge, or course certificate specifically to this member.",
                  "এই ব্যবহারকারীকে একটি আইডি কার্ড, অর্জন সনদ বা কোর্স সার্টিফিকেট অ্যাসাইন করুন।"
                )}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAssignModalOpen(true)}
              className="text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              {t("Assign First Template", "প্রথম টেমপ্লেট অ্যাসাইন করুন")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assignments.map((assignment) => {
            const tpl = assignment.template
            const renderUrl = `/api/media/templates/${tpl.id}/render?userId=${user.id}&imageIndex=${selectedImageIndex}&preview=1&_t=${renderCacheKey}`

            return (
              <Card
                key={assignment.id}
                className="overflow-hidden border border-border/70 hover:border-primary/40 transition-all shadow-sm flex flex-col"
              >
                {/* Visual Live Render Preview */}
                <div className="relative aspect-[16/10] bg-muted/40 border-b border-border/50 overflow-hidden group">
                  <img
                    src={renderUrl}
                    alt={tpl.name}
                    className="w-full h-full object-contain p-2 transition-transform duration-300 group-hover:scale-[1.02]"
                    loading="lazy"
                  />

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-4">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="text-xs h-8 gap-1.5 shadow-md"
                      onClick={() => setPreviewModalImage(renderUrl)}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      {t("View Full", "বড় করে দেখুন")}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="text-xs h-8 gap-1.5 shadow-md"
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

                  <div className="absolute top-2 left-2">
                    <Badge variant="secondary" className="text-[10px] px-2 py-0.5 bg-background/90 backdrop-blur shadow-xs">
                      {tpl.type}
                    </Badge>
                  </div>
                </div>

                {/* Body */}
                <CardContent className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-bold text-foreground leading-tight">
                        {tpl.name}
                      </h3>
                      <Badge variant="outline" className="text-[9px] uppercase tracking-wider text-emerald-600 border-emerald-500/30">
                        {assignment.status}
                      </Badge>
                    </div>
                    {tpl.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {tpl.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(assignment.createdAt).toLocaleDateString()}
                    </span>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={deletingId === assignment.id}
                      onClick={() => handleUnassign(assignment)}
                      className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive gap-1"
                    >
                      {deletingId === assignment.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                      {t("Unassign", "বাতিল")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Assign Template Dialog */}
      <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              {t("Assign Template to User", "ব্যবহারকারীকে টেমপ্লেট অ্যাসাইন করুন")}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {t(
                `Select a template to assign to ${user.name}.`,
                `${user.name} এর জন্য একটি টেমপ্লেট নির্বাচন করুন।`
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {availableTemplates.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                {t("No templates available. Create templates first in the Media Templates manager.", "কোনো টেমপ্লেট নেই।")}
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {availableTemplates.map((tpl) => {
                  const isAssigned = assignedIds.has(tpl.id)
                  const isSelected = selectedTemplateId === tpl.id

                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      disabled={isAssigned}
                      onClick={() => setSelectedTemplateId(tpl.id)}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-lg border text-left transition-all ${
                        isAssigned
                          ? "opacity-50 cursor-not-allowed bg-muted/30 border-border/40"
                          : isSelected
                          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                          : "border-border/60 hover:border-border hover:bg-muted/40"
                      }`}
                    >
                      <div className="w-9 h-9 rounded bg-muted flex items-center justify-center shrink-0 border overflow-hidden">
                        {tpl.media.thumbnailUrl || tpl.media.url ? (
                          <img
                            src={tpl.media.thumbnailUrl || tpl.media.url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Layers className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold truncate">{tpl.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">
                            {tpl.type}
                          </Badge>
                          {isAssigned && (
                            <span className="text-[10px] text-emerald-600 font-medium">
                              {t("Already Assigned", "ইতিমধ্যে অ্যাসাইনকৃত")}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setAssignModalOpen(false)}
              disabled={assigning}
              className="text-xs"
            >
              {t("Cancel", "বাতিল")}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleAssign}
              disabled={assigning || !selectedTemplateId || assignedIds.has(selectedTemplateId)}
              className="text-xs gap-1.5"
            >
              {assigning ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {t("Assigning...", "অ্যাসাইন হচ্ছে...")}
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {t("Assign Template", "অ্যাসাইন করুন")}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Full Preview Modal */}
      {previewModalImage && (
        <Dialog open={!!previewModalImage} onOpenChange={() => setPreviewModalImage(null)}>
          <DialogContent className="max-w-4xl p-2 bg-black/90 border-zinc-800 text-white">
            <div className="relative aspect-[16/10] w-full flex items-center justify-center">
              <img
                src={previewModalImage}
                alt="Card Preview"
                className="w-full h-full object-contain rounded"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
