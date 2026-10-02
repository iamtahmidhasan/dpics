"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  AlertTriangle,
  ArrowLeft,
  Award,
  Check,
  ChevronDown,
  ChevronRight,
  Code2,
  FileDown,
  FileText,
  HelpCircle,
  Layers,
  Loader2,
  PlayCircle,
  Plus,
  Radio,
  Save,
  Trash2,
  Users,
  Video,
  X,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useLanguage } from "@/components/language-provider"
import { cn } from "cn"

interface CurriculumBuilderProps {
  course: any
  availableInstructors: any[]
}

export function CurriculumBuilder({
  course,
  availableInstructors,
}: CurriculumBuilderProps) {
  const { t } = useLanguage()
  const router = useRouter()

  const [sections, setSections] = React.useState<any[]>(() => {
    return (course.sections || []).map((sec: any) => ({
      ...sec,
      lessons: (sec.lessons || []).map((les: any) => ({
        ...les,
        instructorIds: (les.instructors || []).map((li: any) => ({
          instructorId: li.instructorId || li.instructor?.id,
          role: li.role || "Instructor",
        })),
      })),
    }))
  })

  const [expandedSections, setExpandedSections] = React.useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {}
    sections.forEach((s, idx) => {
      map[s.id || idx] = true
    })
    return map
  })

  const [saving, setSaving] = React.useState(false)
  const [saveSuccess, setSaveSuccess] = React.useState(false)
  const [saveError, setSaveError] = React.useState<string | null>(null)

  // Module / Section Modal State
  const [moduleModalOpen, setModuleModalOpen] = React.useState(false)
  const [moduleTitle, setModuleTitle] = React.useState("")
  const [moduleTitleBn, setModuleTitleBn] = React.useState("")
  const [moduleDescription, setModuleDescription] = React.useState("")
  const [moduleDescriptionBn, setModuleDescriptionBn] = React.useState("")
  const [moduleError, setModuleError] = React.useState<string | null>(null)

  // Delete Confirmation Modal State
  const [deleteTarget, setDeleteTarget] = React.useState<{
    type: "section" | "lesson"
    sIdx: number
    lIdx?: number
    title: string
  } | null>(null)

  // Lesson Edit Modal State
  const [lessonModalOpen, setLessonModalOpen] = React.useState(false)
  const [targetSectionIdx, setTargetSectionIdx] = React.useState<number | null>(null)
  const [editingLessonIdx, setEditingLessonIdx] = React.useState<number | null>(null)
  const [lessonError, setLessonError] = React.useState<string | null>(null)

  // Active tab inside lesson editor modal
  const [lessonTab, setLessonTab] = React.useState<
    "general" | "video" | "live" | "documents" | "quiz" | "assignment" | "resources" | "instructors"
  >("general")

  // Lesson Form Draft
  const [lessonDraft, setLessonDraft] = React.useState<any>({
    title: "",
    titleBn: "",
    description: "",
    descriptionBn: "",
    videoUrl: "",
    videoDuration: "",
    isPreview: false,
    liveClass: null,
    documents: [],
    quiz: [],
    assignment: null,
    resources: [],
    externalLinks: [],
    instructorIds: [],
  })

  // Open Lesson Modal for New or Existing
  const openLessonEditor = (sectionIdx: number, lessonIdx: number | null) => {
    setTargetSectionIdx(sectionIdx)
    setEditingLessonIdx(lessonIdx)
    setLessonTab("general")
    setLessonError(null)

    if (lessonIdx !== null) {
      const les = sections[sectionIdx].lessons[lessonIdx]
      setLessonDraft({
        id: les.id,
        title: les.title || "",
        titleBn: les.titleBn || "",
        description: les.description || "",
        descriptionBn: les.descriptionBn || "",
        videoUrl: les.videoUrl || "",
        videoDuration: les.videoDuration || "",
        isPreview: Boolean(les.isPreview),
        liveClass: les.liveClass || null,
        documents: Array.isArray(les.documents) ? les.documents : [],
        quiz: Array.isArray(les.quiz) ? les.quiz : [],
        assignment: les.assignment || null,
        resources: Array.isArray(les.resources) ? les.resources : [],
        externalLinks: Array.isArray(les.externalLinks) ? les.externalLinks : [],
        instructorIds: Array.isArray(les.instructorIds) ? [...les.instructorIds] : [],
      })
    } else {
      setLessonDraft({
        title: "",
        titleBn: "",
        description: "",
        descriptionBn: "",
        videoUrl: "",
        videoDuration: "",
        isPreview: false,
        liveClass: null,
        documents: [],
        quiz: [],
        assignment: null,
        resources: [],
        externalLinks: [],
        instructorIds: [],
      })
    }

    setLessonModalOpen(true)
  }

  // Save Lesson from Draft into local state
  const handleSaveLessonDraft = () => {
    if (!lessonDraft.title.trim() && !lessonDraft.titleBn?.trim()) {
      setLessonError(t("Lesson title is required", "পাঠের শিরোনাম আবশ্যক"))
      return
    }

    if (targetSectionIdx === null) return

    setSections((prev) => {
      const updated = [...prev]
      const sec = { ...updated[targetSectionIdx] }
      const secLessons = [...sec.lessons]

      if (editingLessonIdx !== null) {
        secLessons[editingLessonIdx] = {
          ...secLessons[editingLessonIdx],
          ...lessonDraft,
          title: lessonDraft.title.trim() || lessonDraft.titleBn.trim(),
        }
      } else {
        secLessons.push({
          ...lessonDraft,
          title: lessonDraft.title.trim() || lessonDraft.titleBn.trim(),
          orderIndex: secLessons.length,
        })
      }

      sec.lessons = secLessons
      updated[targetSectionIdx] = sec
      return updated
    })

    setLessonModalOpen(false)
  }

  // Open Add Section Modal
  const openAddSectionModal = () => {
    setModuleTitle("")
    setModuleTitleBn("")
    setModuleDescription("")
    setModuleDescriptionBn("")
    setModuleError(null)
    setModuleModalOpen(true)
  }

  // Confirm Add Section
  const handleConfirmAddSection = (e: React.FormEvent) => {
    e.preventDefault()
    if (!moduleTitle.trim() && !moduleTitleBn.trim()) {
      setModuleError(t("Module title is required", "মডিউলের শিরোনাম আবশ্যক"))
      return
    }

    setSections((prev) => [
      ...prev,
      {
        title: (moduleTitle.trim() || moduleTitleBn.trim()),
        titleBn: moduleTitleBn.trim() || null,
        description: moduleDescription.trim() || null,
        descriptionBn: moduleDescriptionBn.trim() || null,
        orderIndex: prev.length,
        lessons: [],
      },
    ])

    setModuleModalOpen(false)
  }

  // Confirm Delete
  const handleConfirmDelete = () => {
    if (!deleteTarget) return

    if (deleteTarget.type === "section") {
      setSections((prev) => prev.filter((_, idx) => idx !== deleteTarget.sIdx))
    } else if (deleteTarget.type === "lesson" && typeof deleteTarget.lIdx === "number") {
      setSections((prev) => {
        const updated = [...prev]
        const sec = { ...updated[deleteTarget.sIdx] }
        sec.lessons = sec.lessons.filter((_: any, idx: number) => idx !== deleteTarget.lIdx)
        updated[deleteTarget.sIdx] = sec
        return updated
      })
    }

    setDeleteTarget(null)
  }

  // Save Curriculum to Server
  const handleSaveCurriculum = async () => {
    setSaving(true)
    setSaveSuccess(false)
    setSaveError(null)

    try {
      const res = await fetch(`/api/courses/${course.id}/curriculum`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data?.error?.message || "Failed to save curriculum")
      }

      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
      router.refresh()
    } catch (err: any) {
      setSaveError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/admin/courses"
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              <span>{t("Back to Courses", "কোর্স তালিকায় ফিরুন")}</span>
            </Link>
          </div>
          <h1 className="font-heading text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span>{t("Curriculum Builder:", "সিলেবাস বিল্ডার:")}</span>
            <span className="text-primary font-bold">{course.title}</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={openAddSectionModal}
            className="text-xs gap-1.5"
          >
            <Plus className="size-3.5" />
            <span>{t("Add Module", "নতুন মডিউল")}</span>
          </Button>

          <Button
            size="sm"
            onClick={handleSaveCurriculum}
            disabled={saving}
            className="text-xs gap-1.5 font-bold shadow-sm"
          >
            {saving ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : saveSuccess ? (
              <Check className="size-3.5 text-emerald-400" />
            ) : (
              <Save className="size-3.5" />
            )}
            <span>
              {saving
                ? t("Saving...", "সংরক্ষণ হচ্ছে...")
                : saveSuccess
                ? t("Saved!", "সংরক্ষিত হয়েছে!")
                : t("Save Curriculum", "সিলেবাস সংরক্ষণ")}
            </span>
          </Button>
        </div>
      </div>

      {saveError && (
        <div className="flex items-center justify-between rounded-lg bg-destructive/15 p-3 text-xs text-destructive border border-destructive/20">
          <span>{saveError}</span>
          <Button variant="ghost" size="icon" className="size-5" onClick={() => setSaveError(null)}>
            <X className="size-3" />
          </Button>
        </div>
      )}

      {/* Sections and Lessons Outline */}
      {sections.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border p-12 text-center">
          <Layers className="size-12 text-muted-foreground/40 mb-3" />
          <h3 className="font-semibold text-sm text-foreground">
            {t("No modules created yet", "এখনও কোনো মডিউল তৈরি করা হয়নি")}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm">
            {t(
              "Organize your course into structured modules/sections, then add rich lessons inside each module.",
              "কোর্সটিকে মডিউল বা সেকশনে ভাগ করুন এবং প্রতিটিতে লেকচার, কুইজ ও অ্যাসাইনমেন্ট যোগ করুন।"
            )}
          </p>
          <Button size="sm" onClick={openAddSectionModal} className="mt-4 text-xs gap-1.5">
            <Plus className="size-3.5" />
            <span>{t("Create First Module", "প্রথম মডিউল যোগ করুন")}</span>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {sections.map((section, sIdx) => {
            const isExpanded = expandedSections[section.id || sIdx] !== false

            return (
              <div
                key={section.id || sIdx}
                className="overflow-hidden rounded-xl border border-border bg-card shadow-xs"
              >
                {/* Section Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-muted/40 px-4 py-3 border-b border-border/70 gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedSections((prev) => ({
                          ...prev,
                          [section.id || sIdx]: !isExpanded,
                        }))
                      }
                      className="text-muted-foreground hover:text-foreground shrink-0"
                    >
                      {isExpanded ? (
                        <ChevronDown className="size-4" />
                      ) : (
                        <ChevronRight className="size-4" />
                      )}
                    </button>
                    <span className="rounded bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary shrink-0">
                      {t("Module", "মডিউল")} {sIdx + 1}
                    </span>

                    <div className="flex flex-1 items-center gap-2 min-w-0">
                      <div className="relative flex-1 min-w-[120px]">
                        <input
                          type="text"
                          value={section.title || ""}
                          placeholder={t("Module title (EN)", "মডিউল শিরোনাম (ইংরেজি)")}
                          onChange={(e) => {
                            const val = e.target.value
                            setSections((prev) => {
                              const updated = [...prev]
                              updated[sIdx] = { ...updated[sIdx], title: val }
                              return updated
                            })
                          }}
                          className="w-full bg-background/50 border border-border/60 font-semibold text-xs sm:text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary rounded px-2 py-1 pr-7"
                        />
                        <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] font-mono text-muted-foreground uppercase pointer-events-none">EN</span>
                      </div>

                      <div className="relative flex-1 min-w-[120px]">
                        <input
                          type="text"
                          value={section.titleBn || ""}
                          placeholder={t("Module title (বাংলা)", "মডিউল শিরোনাম (বাংলা)")}
                          onChange={(e) => {
                            const val = e.target.value
                            setSections((prev) => {
                              const updated = [...prev]
                              updated[sIdx] = { ...updated[sIdx], titleBn: val }
                              return updated
                            })
                          }}
                          className="w-full bg-background/50 border border-border/60 font-semibold text-xs sm:text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary rounded px-2 py-1 pr-11"
                        />
                        <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] font-mono text-emerald-600 dark:text-emerald-400 uppercase pointer-events-none">বাংলা</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openLessonEditor(sIdx, null)}
                      className="h-7 px-2.5 text-[11px] gap-1"
                    >
                      <Plus className="size-3" />
                      <span>{t("Add Lesson", "পাঠ যোগ করুন")}</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-destructive hover:bg-destructive/10"
                      onClick={() =>
                        setDeleteTarget({
                          type: "section",
                          sIdx,
                          title: section.title,
                        })
                      }
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Section Lessons */}
                {isExpanded && (
                  <div className="divide-y divide-border/50">
                    {section.lessons.length === 0 ? (
                      <div className="px-5 py-4 text-center text-xs text-muted-foreground">
                        {t("No lessons in this module. Click 'Add Lesson' above.", "এই মডিউলে কোনো পাঠ নেই। উপরে 'পাঠ যোগ করুন'-এ ক্লিক করুন।")}
                      </div>
                    ) : (
                      section.lessons.map((lesson: any, lIdx: number) => {
                        return (
                          <div
                            key={lesson.id || lIdx}
                            className="flex items-center justify-between px-5 py-3 text-xs hover:bg-muted/20 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="text-muted-foreground/60 font-mono text-[10px]">
                                {sIdx + 1}.{lIdx + 1}
                              </span>

                              {lesson.videoUrl ? (
                                <PlayCircle className="size-4 text-primary shrink-0" />
                              ) : lesson.liveClass ? (
                                <Radio className="size-4 text-rose-500 shrink-0" />
                              ) : lesson.quiz?.length > 0 ? (
                                <HelpCircle className="size-4 text-amber-500 shrink-0" />
                              ) : (
                                <FileText className="size-4 text-muted-foreground shrink-0" />
                              )}

                              <div className="truncate">
                                <div className="flex items-center gap-1.5 flex-wrap truncate">
                                  <span className="font-medium text-foreground truncate">
                                    {lesson.title || lesson.titleBn}
                                  </span>
                                  {lesson.titleBn && lesson.title && lesson.titleBn !== lesson.title && (
                                    <span className="text-[11px] text-muted-foreground truncate">
                                      ({lesson.titleBn})
                                    </span>
                                  )}
                                </div>
                                <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                                  {lesson.videoDuration && (
                                    <span>{lesson.videoDuration}</span>
                                  )}
                                  {lesson.isPreview && (
                                    <span className="text-emerald-500 font-bold">
                                      • {t("Free Preview", "ফ্রি প্রিভিউ")}
                                    </span>
                                  )}
                                  {lesson.instructorIds?.length > 0 && (
                                    <span>
                                      • {lesson.instructorIds.length} {t("instructor(s)", "জন ইনস্ট্রাক্টর")}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 px-2 text-[10px]"
                                onClick={() => openLessonEditor(sIdx, lIdx)}
                              >
                                {t("Edit Lesson", "সম্পাদনা")}
                              </Button>

                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-6 text-destructive hover:bg-destructive/10"
                                onClick={() =>
                                  setDeleteTarget({
                                    type: "lesson",
                                    sIdx,
                                    lIdx,
                                    title: lesson.title,
                                  })
                                }
                              >
                                <Trash2 className="size-3" />
                              </Button>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Add Module Dialog (Replaces browser prompt) */}
      <Dialog open={moduleModalOpen} onOpenChange={setModuleModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("Add New Module / Section", "নতুন মডিউল যোগ করুন")}</DialogTitle>
            <DialogDescription className="text-xs">
              {t("Enter the title and optional description for this section.", "এই মডিউলের জন্য শিরোনাম ও সংক্ষিপ্ত বিবরণ দিন।")}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConfirmAddSection} className="space-y-3.5">
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center justify-between">
                <span>{t("Module Title (English)", "মডিউল শিরোনাম (ইংরেজি)")} *</span>
                <span className="text-[10px] text-muted-foreground font-mono">EN</span>
              </Label>
              <Input
                value={moduleTitle}
                onChange={(e) => setModuleTitle(e.target.value)}
                placeholder="e.g. Module 1: Getting Started & Setup"
                className="text-xs"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs flex items-center justify-between">
                <span>{t("Module Title (Bangla)", "মডিউল শিরোনাম (বাংলা)")}</span>
                <span className="text-[10px] text-emerald-600 font-mono">বাংলা</span>
              </Label>
              <Input
                value={moduleTitleBn}
                onChange={(e) => setModuleTitleBn(e.target.value)}
                placeholder="যেমন: মডিউল ১: শুরু ও প্রস্তুতি"
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs flex items-center justify-between">
                <span>{t("Description (English - Optional)", "বিবরণ (ইংরেজি - ঐচ্ছিক)")}</span>
                <span className="text-[10px] text-muted-foreground font-mono">EN</span>
              </Label>
              <Textarea
                rows={2}
                value={moduleDescription}
                onChange={(e) => setModuleDescription(e.target.value)}
                placeholder="Brief summary of what this module covers..."
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs flex items-center justify-between">
                <span>{t("Description (Bangla - Optional)", "বিবরণ (বাংলা - ঐচ্ছিক)")}</span>
                <span className="text-[10px] text-emerald-600 font-mono">বাংলা</span>
              </Label>
              <Textarea
                rows={2}
                value={moduleDescriptionBn}
                onChange={(e) => setModuleDescriptionBn(e.target.value)}
                placeholder="এই মডিউলে যা শেখানো হবে..."
                className="text-xs"
              />
            </div>

            {moduleError && (
              <div className="rounded-md bg-destructive/15 p-2.5 text-xs text-destructive">
                {moduleError}
              </div>
            )}

            <DialogFooter className="mt-4">
              <Button variant="outline" type="button" onClick={() => setModuleModalOpen(false)}>
                {t("Cancel", "বাতিল")}
              </Button>
              <Button type="submit">
                {t("Add Module", "মডিউল যোগ করুন")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog (Replaces browser confirm) */}
      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-5" />
              <DialogTitle className="text-base">
                {deleteTarget?.type === "section"
                  ? t("Delete Module?", "মডিউল মুছে ফেলতে চান?")
                  : t("Delete Lesson?", "পাঠ মুছে ফেলতে চান?")}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs pt-1">
              {t("Are you sure you want to delete", "আপনি কি নিশ্চিতভাবে")} &quot;
              <strong className="text-foreground">{deleteTarget?.title}</strong>&quot;?{" "}
              {deleteTarget?.type === "section" &&
                t(
                  "All lessons inside this module will be removed.",
                  "এই মডিউলের সব পাঠ মুছে যাবে।"
                )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4">
            <Button variant="outline" type="button" onClick={() => setDeleteTarget(null)}>
              {t("Cancel", "বাতিল")}
            </Button>
            <Button variant="destructive" type="button" onClick={handleConfirmDelete}>
              {t("Delete Permanently", "স্থায়ীভাবে মুছুন")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Comprehensive Lesson Editor Modal */}
      <Dialog open={lessonModalOpen} onOpenChange={setLessonModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingLessonIdx !== null
                ? t("Edit Lesson Details", "পাঠ বিবরণ সম্পাদনা")
                : t("Add New Lesson", "নতুন পাঠ যোগ করুন")}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {t(
                "Attach videos, live classes, PDFs, quizzes, assignments, and assign instructors.",
                "ভিডিও, লাইভ ক্লাস, পিডিএফ, কুইজ ও অ্যাসাইনমেন্ট সংযুক্ত করুন এবং ইনস্ট্রাক্টর নির্ধারণ করুন।"
              )}
            </DialogDescription>
          </DialogHeader>

          {/* Modal Tab Navigator */}
          <div className="flex gap-1.5 overflow-x-auto border-b border-border pb-2 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setLessonTab("general")}
              className={cn(
                "rounded-md px-3 py-1.5 transition-colors whitespace-nowrap",
                lessonTab === "general"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {t("General & Video", "সাধারণ ও ভিডিও")}
            </button>

            <button
              type="button"
              onClick={() => setLessonTab("live")}
              className={cn(
                "rounded-md px-3 py-1.5 transition-colors whitespace-nowrap",
                lessonTab === "live"
                  ? "bg-rose-600 text-white"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {t("Live Class", "লাইভ ক্লাস")}
            </button>

            <button
              type="button"
              onClick={() => setLessonTab("documents")}
              className={cn(
                "rounded-md px-3 py-1.5 transition-colors whitespace-nowrap",
                lessonTab === "documents"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {t("Documents", "ডকুমেন্ট")} ({lessonDraft.documents?.length || 0})
            </button>

            <button
              type="button"
              onClick={() => setLessonTab("quiz")}
              className={cn(
                "rounded-md px-3 py-1.5 transition-colors whitespace-nowrap",
                lessonTab === "quiz"
                  ? "bg-amber-600 text-white"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {t("Quiz", "কুইজ")} ({lessonDraft.quiz?.length || 0})
            </button>

            <button
              type="button"
              onClick={() => setLessonTab("assignment")}
              className={cn(
                "rounded-md px-3 py-1.5 transition-colors whitespace-nowrap",
                lessonTab === "assignment"
                  ? "bg-indigo-600 text-white"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {t("Assignment", "অ্যাসাইনমেন্ট")}
            </button>

            <button
              type="button"
              onClick={() => setLessonTab("instructors")}
              className={cn(
                "rounded-md px-3 py-1.5 transition-colors whitespace-nowrap",
                lessonTab === "instructors"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {t("Instructors", "ইনস্ট্রাক্টর")} ({lessonDraft.instructorIds?.length || 0})
            </button>
          </div>

          {lessonError && (
            <div className="rounded-md bg-destructive/15 p-2.5 text-xs text-destructive">
              {lessonError}
            </div>
          )}

          <div className="space-y-4 py-2">
            {/* TAB 1: General & Video */}
            {lessonTab === "general" && (
              <div className="space-y-4">
                <div className="rounded-lg border border-border p-3 space-y-3 bg-muted/15">
                  <div className="flex items-center justify-between border-b border-border/60 pb-2">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-primary" />
                      {t("Lesson Title & Notes (Bilingual)", "পাঠের নাম ও নোট (দ্বিভাষিক)")}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {t("Shared video, independent language contents", "ভিডিও এক থাকবে, নাম ও নোট দুই ভাষায়")}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs flex items-center justify-between">
                        <span>{t("Lesson Title (English)", "পাঠের শিরোনাম (ইংরেজি)")} *</span>
                        <span className="text-[10px] text-muted-foreground font-mono">EN</span>
                      </Label>
                      <Input
                        value={lessonDraft.title}
                        onChange={(e) =>
                          setLessonDraft((prev: any) => ({ ...prev, title: e.target.value }))
                        }
                        placeholder="e.g. 01. Introduction to Next.js App Router"
                        className="text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs flex items-center justify-between">
                        <span>{t("Lesson Title (Bangla)", "পাঠের শিরোনাম (বাংলা)")}</span>
                        <span className="text-[10px] text-emerald-600 font-mono">বাংলা</span>
                      </Label>
                      <Input
                        value={lessonDraft.titleBn || ""}
                        onChange={(e) =>
                          setLessonDraft((prev: any) => ({ ...prev, titleBn: e.target.value }))
                        }
                        placeholder="যেমন: ০১. নেক্সট জেএস পরিচিতি ও সেটআপ"
                        className="text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs flex items-center justify-between">
                        <span>{t("Lesson Notes (English - Markdown)", "লেকচার নোট (ইংরেজি - মার্কডাউন)")}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">EN</span>
                      </Label>
                      <Textarea
                        rows={4}
                        value={lessonDraft.description || ""}
                        onChange={(e) =>
                          setLessonDraft((prev: any) => ({ ...prev, description: e.target.value }))
                        }
                        placeholder="Key takeaways, formulas, bullet points..."
                        className="text-xs font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs flex items-center justify-between">
                        <span>{t("Lesson Notes (Bangla - Markdown)", "লেকচার নোট (বাংলা - মার্কডাউন)")}</span>
                        <span className="text-[10px] text-emerald-600 font-mono">বাংলা</span>
                      </Label>
                      <Textarea
                        rows={4}
                        value={lessonDraft.descriptionBn || ""}
                        onChange={(e) =>
                          setLessonDraft((prev: any) => ({ ...prev, descriptionBn: e.target.value }))
                        }
                        placeholder="এই পাঠের মূল সূত্র, পয়েন্ট ও নোট..."
                        className="text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">
                      {t("YouTube Video URL or Video ID", "ইউটিউব ভিডিও লিংক বা আইডি")}
                    </Label>
                    <Input
                      value={lessonDraft.videoUrl || ""}
                      onChange={(e) =>
                        setLessonDraft((prev: any) => ({ ...prev, videoUrl: e.target.value }))
                      }
                      placeholder="e.g. https://youtu.be/... or dQw4w9WgXcQ"
                      className="text-xs font-mono"
                    />
                    <span className="text-[10px] text-muted-foreground">
                      {t("Unlisted YouTube videos are wrapped with Plyr player.", "আনলিস্টেড ইউটিউব ভিডিও প্লায়ার প্লেয়ার দিয়ে চলবে।")}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">{t("Estimated Duration", "সময়সীমা")}</Label>
                    <Input
                      value={lessonDraft.videoDuration || ""}
                      onChange={(e) =>
                        setLessonDraft((prev: any) => ({ ...prev, videoDuration: e.target.value }))
                      }
                      placeholder="e.g. 18:45 or 25 mins"
                      className="text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border p-3 bg-muted/20">
                  <div>
                    <Label className="text-xs font-bold">{t("Free Preview Lesson", "ফ্রি প্রিভিউ পাঠ")}</Label>
                    <p className="text-[11px] text-muted-foreground">
                      {t("Allow unregistered/unenrolled users to watch this lesson", "যে কেউ এনরোল ছাড়াই এই পাঠটি দেখতে পারবে")}
                    </p>
                  </div>
                  <Switch
                    checked={Boolean(lessonDraft.isPreview)}
                    onCheckedChange={(checked) =>
                      setLessonDraft((prev: any) => ({ ...prev, isPreview: checked }))
                    }
                  />
                </div>
              </div>
            )}

            {/* TAB 2: Live Class */}
            {lessonTab === "live" && (
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground">
                  {t(
                    "Schedule an online live meeting (Zoom, Google Meet, Microsoft Teams) for this lecture.",
                    "এই ক্লাসের জন্য গুগল মিট বা জুম মিটিং লিংক নির্ধারণ করুন।"
                  )}
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">{t("Date & Time", "তারিখ ও সময়")}</Label>
                    <Input
                      value={lessonDraft.liveClass?.scheduledAt || ""}
                      onChange={(e) =>
                        setLessonDraft((prev: any) => ({
                          ...prev,
                          liveClass: { ...prev.liveClass, scheduledAt: e.target.value },
                        }))
                      }
                      placeholder="e.g. 15 Oct, 2026 - 8:00 PM"
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">{t("Platform", "প্ল্যাটফর্ম")}</Label>
                    <Input
                      value={lessonDraft.liveClass?.platform || ""}
                      onChange={(e) =>
                        setLessonDraft((prev: any) => ({
                          ...prev,
                          liveClass: { ...prev.liveClass, platform: e.target.value },
                        }))
                      }
                      placeholder="e.g. Google Meet or Zoom"
                      className="text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">{t("Live Meeting URL", "লাইভ মিটিং লিংক")}</Label>
                  <Input
                    value={lessonDraft.liveClass?.meetingUrl || ""}
                    onChange={(e) =>
                      setLessonDraft((prev: any) => ({
                        ...prev,
                        liveClass: { ...prev.liveClass, meetingUrl: e.target.value },
                      }))
                    }
                    placeholder="https://meet.google.com/..."
                    className="text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">{t("Class Recording URL (After session)", "রেকর্ডিং লিংক")}</Label>
                  <Input
                    value={lessonDraft.liveClass?.recordingUrl || ""}
                    onChange={(e) =>
                      setLessonDraft((prev: any) => ({
                        ...prev,
                        liveClass: { ...prev.liveClass, recordingUrl: e.target.value },
                      }))
                    }
                    placeholder="https://..."
                    className="text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">{t("Special Instructions", "বিশেষ নির্দেশনা")}</Label>
                  <Textarea
                    rows={2}
                    value={lessonDraft.liveClass?.instructions || ""}
                    onChange={(e) =>
                      setLessonDraft((prev: any) => ({
                        ...prev,
                        liveClass: { ...prev.liveClass, instructions: e.target.value },
                      }))
                    }
                    placeholder="Keep your microphones muted. Bring your project notebook..."
                    className="text-xs"
                  />
                </div>
              </div>
            )}

            {/* TAB 3: Documents & PDFs */}
            {lessonTab === "documents" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold">{t("Downloadable Documents & PDFs", "ডকুমেন্ট ও পিডিএফ ফাইল")}</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-[11px]"
                    onClick={() => {
                      setLessonDraft((prev: any) => ({
                        ...prev,
                        documents: [...(prev.documents || []), { title: "", url: "", size: "" }],
                      }))
                    }}
                  >
                    <Plus className="mr-1 size-3" />
                    {t("Add Document", "ফাইল যোগ করুন")}
                  </Button>
                </div>

                {lessonDraft.documents?.map((doc: any, dIdx: number) => (
                  <div
                    key={dIdx}
                    className="flex items-center gap-2 rounded-lg border border-border p-2.5 bg-muted/20"
                  >
                    <Input
                      placeholder="Document Title (e.g. Chapter 1 Slides.pdf)"
                      value={doc.title}
                      onChange={(e) => {
                        const val = e.target.value
                        setLessonDraft((prev: any) => {
                          const updated = [...prev.documents]
                          updated[dIdx] = { ...updated[dIdx], title: val }
                          return { ...prev, documents: updated }
                        })
                      }}
                      className="text-xs flex-1"
                    />
                    <Input
                      placeholder="URL (Google Drive / S3 / Link)"
                      value={doc.url}
                      onChange={(e) => {
                        const val = e.target.value
                        setLessonDraft((prev: any) => {
                          const updated = [...prev.documents]
                          updated[dIdx] = { ...updated[dIdx], url: val }
                          return { ...prev, documents: updated }
                        })
                      }}
                      className="text-xs font-mono flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7 text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        setLessonDraft((prev: any) => ({
                          ...prev,
                          documents: prev.documents.filter((_: any, idx: number) => idx !== dIdx),
                        }))
                      }}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 4: Quiz */}
            {lessonTab === "quiz" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold">{t("Quiz Questions (Multiple Choice)", "কুইজ প্রশ্নসমূহ")}</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-[11px]"
                    onClick={() => {
                      setLessonDraft((prev: any) => ({
                        ...prev,
                        quiz: [
                          ...(prev.quiz || []),
                          {
                            question: "",
                            options: ["Option A", "Option B", "Option C", "Option D"],
                            answerIndex: 0,
                            explanation: "",
                          },
                        ],
                      }))
                    }}
                  >
                    <Plus className="mr-1 size-3" />
                    {t("Add Question", "প্রশ্ন যোগ করুন")}
                  </Button>
                </div>

                {lessonDraft.quiz?.map((q: any, qIdx: number) => (
                  <div
                    key={qIdx}
                    className="rounded-lg border border-border p-3.5 space-y-3 bg-muted/20"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">
                        {t("Question", "প্রশ্ন")} #{qIdx + 1}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-6 text-destructive"
                        onClick={() => {
                          setLessonDraft((prev: any) => ({
                            ...prev,
                            quiz: prev.quiz.filter((_: any, idx: number) => idx !== qIdx),
                          }))
                        }}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>

                    <Input
                      placeholder="e.g. Which hook is used for client side lifecycle in Next.js?"
                      value={q.question}
                      onChange={(e) => {
                        const val = e.target.value
                        setLessonDraft((prev: any) => {
                          const updated = [...prev.quiz]
                          updated[qIdx] = { ...updated[qIdx], question: val }
                          return { ...prev, quiz: updated }
                        })
                      }}
                      className="text-xs"
                    />

                    {/* Options & Correct Answer Radio */}
                    <div className="space-y-1.5 pt-1">
                      <Label className="text-[11px] text-muted-foreground">
                        {t("Options (select bullet for correct answer):", "অপশনসমূহ (সঠিক উত্তরে টিক দিন):")}
                      </Label>
                      {q.options?.map((opt: string, optIdx: number) => (
                        <div key={optIdx} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`quiz_answer_${qIdx}`}
                            checked={q.answerIndex === optIdx}
                            onChange={() => {
                              setLessonDraft((prev: any) => {
                                const updated = [...prev.quiz]
                                updated[qIdx] = { ...updated[qIdx], answerIndex: optIdx }
                                return { ...prev, quiz: updated }
                              })
                            }}
                            className="size-3.5 text-primary"
                          />
                          <Input
                            value={opt}
                            onChange={(e) => {
                              const val = e.target.value
                              setLessonDraft((prev: any) => {
                                const updated = [...prev.quiz]
                                const updatedOptions = [...updated[qIdx].options]
                                updatedOptions[optIdx] = val
                                updated[qIdx] = { ...updated[qIdx], options: updatedOptions }
                                return { ...prev, quiz: updated }
                              })
                            }}
                            className="text-xs h-7"
                          />
                        </div>
                      ))}
                    </div>

                    <Input
                      placeholder="Answer explanation (optional)"
                      value={q.explanation || ""}
                      onChange={(e) => {
                        const val = e.target.value
                        setLessonDraft((prev: any) => {
                          const updated = [...prev.quiz]
                          updated[qIdx] = { ...updated[qIdx], explanation: val }
                          return { ...prev, quiz: updated }
                        })
                      }}
                      className="text-xs h-7"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* TAB 5: Assignment */}
            {lessonTab === "assignment" && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">{t("Assignment Title", "অ্যাসাইনমেন্ট শিরোনাম")}</Label>
                  <Input
                    placeholder="e.g. Build a Responsive Portfolio with Flexbox"
                    value={lessonDraft.assignment?.title || ""}
                    onChange={(e) =>
                      setLessonDraft((prev: any) => ({
                        ...prev,
                        assignment: { ...prev.assignment, title: e.target.value },
                      }))
                    }
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">{t("Deadline / Due Date", "জমা দেওয়ার শেষ তারিখ")}</Label>
                  <Input
                    placeholder="e.g. 7 days from enrollment or specific date"
                    value={lessonDraft.assignment?.dueDate || ""}
                    onChange={(e) =>
                      setLessonDraft((prev: any) => ({
                        ...prev,
                        assignment: { ...prev.assignment, dueDate: e.target.value },
                      }))
                    }
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">{t("Instructions & Requirements", "নির্দেশনা ও রিকোয়ারমেন্ট")}</Label>
                  <Textarea
                    rows={4}
                    placeholder="1. Create GitHub repository... 2. Deploy on Vercel..."
                    value={lessonDraft.assignment?.instructions || ""}
                    onChange={(e) =>
                      setLessonDraft((prev: any) => ({
                        ...prev,
                        assignment: { ...prev.assignment, instructions: e.target.value },
                      }))
                    }
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">{t("Submission Link / Form URL", "সাবমিশন লিংক / ফর্ম")}</Label>
                  <Input
                    placeholder="https://forms.google.com/..."
                    value={lessonDraft.assignment?.submissionUrl || ""}
                    onChange={(e) =>
                      setLessonDraft((prev: any) => ({
                        ...prev,
                        assignment: { ...prev.assignment, submissionUrl: e.target.value },
                      }))
                    }
                    className="text-xs font-mono"
                  />
                </div>
              </div>
            )}

            {/* TAB 6: Multiple Instructors for this Lesson */}
            {lessonTab === "instructors" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs font-bold">{t("Assign Instructors to this Lesson", "ইনস্ট্রাক্টর নির্বাচন করুন")}</Label>
                    <p className="text-[11px] text-muted-foreground">
                      {t("You can select multiple instructors and set specific roles (e.g. Lead, Guest Lecturer, Mentor).", "এই পাঠের জন্য একাধিক শিক্ষক ও তাদের পদবী নির্ধারণ করুন।")}
                    </p>
                  </div>
                </div>

                {availableInstructors.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                    {t("No registered instructors found. Instructors can register via user profile /admin/users.", "কোনো ইনস্ট্রাক্টর পাওয়া যায়নি।")}
                  </div>
                ) : (
                  <div className="grid gap-2.5">
                    {availableInstructors.map((inst: any) => {
                      const assigned = (lessonDraft.instructorIds || []).find(
                        (li: any) => li.instructorId === inst.id
                      )

                      return (
                        <div
                          key={inst.id}
                          className={cn(
                            "flex items-center justify-between rounded-lg border p-3 text-xs transition-colors",
                            assigned
                              ? "border-primary bg-primary/5"
                              : "border-border bg-card"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={Boolean(assigned)}
                              onChange={(e) => {
                                const checked = e.target.checked
                                setLessonDraft((prev: any) => {
                                  const current = prev.instructorIds || []
                                  if (checked) {
                                    return {
                                      ...prev,
                                      instructorIds: [
                                        ...current,
                                        { instructorId: inst.id, role: "Instructor" },
                                      ],
                                    }
                                  } else {
                                    return {
                                      ...prev,
                                      instructorIds: current.filter(
                                        (li: any) => li.instructorId !== inst.id
                                      ),
                                    }
                                  }
                                })
                              }}
                              className="size-4 text-primary rounded"
                            />
                            <div className="flex items-center gap-2">
                              <Avatar className="size-8 shrink-0">
                                {inst.avatar || (typeof inst.image === "string" ? inst.image : null) ? (
                                  <AvatarImage src={inst.avatar || inst.image} alt={inst.name || ""} />
                                ) : null}
                                <AvatarFallback className="text-[10px]">
                                  {(inst.name || "?").charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <span className="font-semibold text-foreground block">{inst.name}</span>
                                <span className="text-[10px] text-muted-foreground">{inst.email}</span>
                              </div>
                            </div>
                          </div>

                          {assigned && (
                            <div className="flex items-center gap-2">
                              <Label className="text-[10px] text-muted-foreground">{t("Role:", "পদবী:")}</Label>
                              <Input
                                value={assigned.role || "Instructor"}
                                onChange={(e) => {
                                  const val = e.target.value
                                  setLessonDraft((prev: any) => {
                                    const updated = (prev.instructorIds || []).map((li: any) =>
                                      li.instructorId === inst.id ? { ...li, role: val } : li
                                    )
                                    return { ...prev, instructorIds: updated }
                                  })
                                }}
                                placeholder="e.g. Lead Instructor"
                                className="text-xs h-7 w-36"
                              />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="mt-4 border-t border-border pt-3">
            <Button
              variant="outline"
              type="button"
              onClick={() => setLessonModalOpen(false)}
            >
              {t("Cancel", "বাতিল")}
            </Button>
            <Button type="button" onClick={handleSaveLessonDraft}>
              {t("Done & Apply to Module", "সম্পন্ন করুন")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
