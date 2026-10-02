"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  Clock,
  Code2,
  ExternalLink,
  FileDown,
  FileText,
  GraduationCap,
  HelpCircle,
  Layers,
  PlayCircle,
  Radio,
  Sparkles,
  Users,
  Video,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { VideoPlayer } from "@/components/courses/video-player"
import { useLanguage } from "@/components/language-provider"
import { cn } from "cn"

interface ClassroomViewProps {
  course: any
  initialLessonId?: string
}

type TabType = "overview" | "live" | "documents" | "quiz" | "assignment" | "resources" | "instructors"

export function ClassroomView({ course, initialLessonId }: ClassroomViewProps) {
  const { t } = useLanguage()
  const router = useRouter()

  // Flatten all lessons across sections
  const allLessons = React.useMemo(() => {
    return (course.sections || []).flatMap((s: any) => s.lessons || [])
  }, [course.sections])

  // Current selected lesson
  const [activeLessonId, setActiveLessonId] = React.useState<string>(() => {
    if (initialLessonId && allLessons.some((l: any) => l.id === initialLessonId)) {
      return initialLessonId
    }
    return allLessons[0]?.id || ""
  })

  // Collapsed / expanded state for modules in sidebar
  const [expandedSections, setExpandedSections] = React.useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {}
    ;(course.sections || []).forEach((s: any) => {
      map[s.id] = true
    })
    return map
  })

  // Mobile drawer state
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false)

  // Completed lessons state (optimistic update + server sync)
  const [completedMap, setCompletedMap] = React.useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {}
    allLessons.forEach((l: any) => {
      map[l.id] = Boolean(l.isCompleted)
    })
    return map
  })

  const [savingProgress, setSavingProgress] = React.useState(false)

  // Active Tab
  const [activeTab, setActiveTab] = React.useState<TabType>("overview")

  const currentLesson = allLessons.find((l: any) => l.id === activeLessonId) || allLessons[0]
  const currentIndex = allLessons.findIndex((l: any) => l.id === activeLessonId)
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null

  // Calculate progress
  const completedCount = Object.values(completedMap).filter(Boolean).length
  const progressPercent = allLessons.length > 0 ? Math.round((completedCount / allLessons.length) * 100) : 0
  const isLessonCompleted = Boolean(currentLesson && completedMap[currentLesson.id])

  // Quiz state
  const [userQuizAnswers, setUserQuizAnswers] = React.useState<Record<number, number>>({})
  const [quizSubmitted, setQuizSubmitted] = React.useState(false)

  React.useEffect(() => {
    setUserQuizAnswers({})
    setQuizSubmitted(false)
  }, [activeLessonId])

  // Normalize quiz questions
  const quizQuestions: any[] = React.useMemo(() => {
    if (!currentLesson?.quiz) return []
    if (Array.isArray(currentLesson.quiz)) return currentLesson.quiz
    if (Array.isArray(currentLesson.quiz.questions)) return currentLesson.quiz.questions
    return []
  }, [currentLesson?.quiz])

  const toggleLessonComplete = async (lessonId: string) => {
    const newStatus = !completedMap[lessonId]
    setCompletedMap((prev) => ({ ...prev, [lessonId]: newStatus }))
    setSavingProgress(true)

    try {
      await fetch(`/api/courses/${course.id}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, completed: newStatus }),
      })
    } catch (err) {
      console.error("Failed to update progress:", err)
    } finally {
      setSavingProgress(false)
    }
  }

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }))
  }

  const handleSelectLesson = (lessonId: string) => {
    setActiveLessonId(lessonId)
    setMobileSidebarOpen(false)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // Available tabs definition
  const tabs = React.useMemo(() => {
    const list: Array<{ id: TabType; label: { en: string; bn: string }; icon: any; count?: number }> = [
      { id: "overview", label: { en: "Overview", bn: "ওভারভিউ" }, icon: FileText },
    ]

    if (currentLesson?.liveClass) {
      list.push({ id: "live", label: { en: "Live Class", bn: "লাইভ ক্লাস" }, icon: Radio })
    }

    if (Array.isArray(currentLesson?.documents) && currentLesson.documents.length > 0) {
      list.push({
        id: "documents",
        label: { en: "Documents", bn: "ডকুমেন্ট" },
        icon: FileDown,
        count: currentLesson.documents.length,
      })
    }

    if (quizQuestions.length > 0) {
      list.push({
        id: "quiz",
        label: { en: "Quiz", bn: "কুইজ" },
        icon: HelpCircle,
        count: quizQuestions.length,
      })
    }

    if (currentLesson?.assignment) {
      list.push({ id: "assignment", label: { en: "Assignment", bn: "অ্যাসাইনমেন্ট" }, icon: Award })
    }

    if (
      (Array.isArray(currentLesson?.resources) && currentLesson.resources.length > 0) ||
      (Array.isArray(currentLesson?.externalLinks) && currentLesson.externalLinks.length > 0)
    ) {
      list.push({ id: "resources", label: { en: "Resources", bn: "রিসোর্স" }, icon: Code2 })
    }

    if (Array.isArray(currentLesson?.instructors) && currentLesson.instructors.length > 0) {
      list.push({
        id: "instructors",
        label: { en: "Instructors", bn: "শিক্ষক" },
        icon: Users,
        count: currentLesson.instructors.length,
      })
    }

    return list
  }, [currentLesson, quizQuestions.length])

  // If active tab doesn't exist for new lesson, reset to overview
  React.useEffect(() => {
    if (!tabs.some((t) => t.id === activeTab)) {
      setActiveTab("overview")
    }
  }, [tabs, activeTab])

  // Render curriculum syllabus list (reused in desktop card and mobile sheet)
  const renderCurriculumList = () => (
    <div className="divide-y divide-border">
      {(course.sections || []).map((section: any, sIdx: number) => {
        const isExpanded = expandedSections[section.id] !== false
        const sectionLessons = section.lessons || []
        const sectionCompleted = sectionLessons.filter((l: any) => completedMap[l.id]).length

        return (
          <div key={section.id} className="bg-card">
            {/* Module Accordion Header */}
            <button
              type="button"
              onClick={() => toggleSection(section.id)}
              className="flex w-full items-center justify-between bg-muted/30 px-3 py-2 text-left text-xs/relaxed font-medium hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0 pr-2">
                {isExpanded ? (
                  <ChevronDown className="size-3.5 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronRight className="size-3.5 text-muted-foreground shrink-0" />
                )}
                <div className="min-w-0">
                  <span className="text-[10px] text-muted-foreground uppercase font-mono block">
                    {t("Module", "মডিউল")} {sIdx + 1}
                  </span>
                  <span className="truncate font-semibold text-foreground block">
                    {section.title}
                  </span>
                </div>
              </div>

              <Badge variant="outline" className="font-mono text-[10px] shrink-0">
                {sectionCompleted}/{sectionLessons.length}
              </Badge>
            </button>

            {/* Lessons list */}
            {isExpanded && (
              <div className="divide-y divide-border/40">
                {sectionLessons.map((lesson: any) => {
                  const isActive = lesson.id === activeLessonId
                  const isDone = completedMap[lesson.id]

                  return (
                    <div
                      key={lesson.id}
                      onClick={() => handleSelectLesson(lesson.id)}
                      className={cn(
                        "flex cursor-pointer items-center justify-between px-3 py-2 text-xs/relaxed transition-colors hover:bg-muted/40",
                        isActive && "border-l-2 border-primary bg-primary/5 font-medium text-primary"
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleLessonComplete(lesson.id)
                          }}
                          className="text-muted-foreground hover:text-primary transition-colors shrink-0 p-0.5"
                          title={isDone ? t("Completed", "সম্পন্ন") : t("Mark complete", "সম্পন্ন করুন")}
                        >
                          {isDone ? (
                            <CheckCircle2 className="size-3.5 text-emerald-500" />
                          ) : (
                            <Circle className="size-3.5 text-muted-foreground/60" />
                          )}
                        </button>

                        <div className="truncate">
                          <span className={cn("truncate block", isActive ? "text-primary font-semibold" : "text-foreground")}>
                            {lesson.title}
                          </span>
                          {lesson.videoDuration && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-mono">
                              <Clock className="size-2.5" />
                              {lesson.videoDuration}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-1">
                        {lesson.liveClass && (
                          <Badge variant="destructive" className="px-1 py-0 text-[9px] gap-0.5">
                            <Radio className="size-2" />
                            Live
                          </Badge>
                        )}
                        {(lesson.quiz || (Array.isArray(lesson.quiz?.questions) && lesson.quiz.questions.length > 0)) && (
                          <Badge variant="warning" className="px-1 py-0 text-[9px]">
                            Quiz
                          </Badge>
                        )}
                        {lesson.assignment && (
                          <Badge variant="secondary" className="px-1 py-0 text-[9px]">
                            Task
                          </Badge>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Top Header Card matching Admin Panel */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <GraduationCap className="size-5" />
          </div>

          <div className="flex min-w-0 flex-col gap-0.5">
            <h1 className="truncate font-heading text-lg font-semibold text-foreground">
              {course.title}
            </h1>
            <p className="truncate text-xs/relaxed text-muted-foreground">
              {completedCount} / {allLessons.length} {t("lessons completed", "টি পাঠ সম্পন্ন")} • {progressPercent}%
            </p>
            <div className="flex flex-wrap gap-1">
              <Badge variant="outline" className="text-[10px] font-mono">
                {course.level?.replace("_", " ") || "ALL LEVELS"}
              </Badge>
              {course.isFree ? (
                <Badge variant="success" className="text-[10px]">
                  {t("Free", "ফ্রি")}
                </Badge>
              ) : (
                <Badge variant="default" className="text-[10px]">
                  {t("Premium", "প্রিমিয়াম")}
                </Badge>
              )}
              {course.featured ? (
                <Badge variant="secondary" className="text-[10px] gap-1">
                  <Sparkles className="size-2.5 text-amber-500" />
                  {t("Featured", "ফিচার্ড")}
                </Badge>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile Curriculum Drawer Trigger */}
          <Button
            variant="outline"
            size="sm"
            className="lg:hidden text-xs gap-1.5"
            onClick={() => setMobileSidebarOpen(true)}
          >
            <Layers className="size-3.5" data-icon="inline-start" />
            <span>{t("Curriculum", "সিলেবাস")}</span>
            <Badge variant="secondary" className="ml-1 px-1 py-0 text-[10px] font-mono">
              {completedCount}/{allLessons.length}
            </Badge>
          </Button>

          <Link
            href={`/courses/${course.slug}`}
            className="rounded-md border border-border px-2.5 py-1.5 text-xs/relaxed transition-colors hover:bg-muted inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="size-3.5" />
            {t("Course overview", "কোর্স ওভারভিউ")}
          </Link>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Main 12-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Player & Lesson Contents */}
        <div className="lg:col-span-8 space-y-4 min-w-0">
          {/* Video Player Card */}
          <Card size="sm" className="gap-0 overflow-hidden border-border bg-black shadow-xs">
            <VideoPlayer
              videoUrl={currentLesson?.videoUrl}
              title={currentLesson?.title}
            />
          </Card>

          {/* Lesson Action Bar */}
          <Card size="sm" className="gap-0 border-border">
            <CardContent className="p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] font-mono uppercase">
                    {t("Lesson", "পাঠ")} {currentIndex + 1} / {allLessons.length}
                  </Badge>
                  {currentLesson?.videoDuration && (
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
                      <Clock className="size-3" />
                      {currentLesson.videoDuration}
                    </span>
                  )}
                </div>
                <h2 className="font-heading text-sm md:text-base font-semibold text-foreground truncate mt-1">
                  {currentLesson?.title}
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <Button
                  variant={isLessonCompleted ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "text-xs gap-1.5 transition-colors",
                    isLessonCompleted && "bg-emerald-600 hover:bg-emerald-700 text-white"
                  )}
                  onClick={() => currentLesson && toggleLessonComplete(currentLesson.id)}
                  disabled={savingProgress}
                >
                  {isLessonCompleted ? (
                    <>
                      <CheckCircle2 className="size-3.5" data-icon="inline-start" />
                      <span>{t("Completed", "সম্পন্ন")}</span>
                    </>
                  ) : (
                    <>
                      <Circle className="size-3.5 text-muted-foreground" data-icon="inline-start" />
                      <span>{t("Mark as completed", "সম্পন্ন করুন")}</span>
                    </>
                  )}
                </Button>

                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!prevLesson}
                    onClick={() => prevLesson && handleSelectLesson(prevLesson.id)}
                    className="text-xs px-2.5"
                    title={prevLesson?.title}
                  >
                    <ArrowLeft className="size-3.5" data-icon="inline-start" />
                    <span className="hidden sm:inline">{t("Previous", "আগের")}</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!nextLesson}
                    onClick={() => nextLesson && handleSelectLesson(nextLesson.id)}
                    className="text-xs px-2.5"
                    title={nextLesson?.title}
                  >
                    <span className="hidden sm:inline">{t("Next", "পরবর্তী")}</span>
                    <ArrowRight className="size-3.5" data-icon="inline-end" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sub-navbar Section Tabs (matches admin-user-detail.tsx nav) */}
          <nav aria-label={t("Lesson tabs", "পাঠের বিভাগসমূহ")} className="border-b border-border">
            <ul className="-mb-px flex gap-1 overflow-x-auto">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id
                const Icon = tab.icon

                return (
                  <li key={tab.id} className="shrink-0">
                    <button
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "border-b-2 px-3 py-2 text-xs/relaxed font-medium transition-colors flex items-center gap-1.5",
                        isActive
                          ? "border-primary text-foreground font-semibold"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Icon className="size-3.5" />
                      <span>{t(tab.label)}</span>
                      {tab.count !== undefined ? (
                        <span className="ml-1 rounded-full bg-muted px-1.5 py-0.2 text-[10px] font-mono text-muted-foreground">
                          {tab.count}
                        </span>
                      ) : null}
                    </button>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Tab Content Cards */}
          <div className="space-y-4">
            {/* 1. Overview & Notes */}
            {activeTab === "overview" && (
              <Card size="sm">
                <CardHeader>
                  <CardTitle>{t("Lecture Notes & Overview", "লেকচার নোট ও ওভারভিউ")}</CardTitle>
                  <CardDescription>
                    {t("Key concepts and documentation for this lesson.", "এই পাঠের মূল ধারণা ও সহায়ক তথ্যসমূহ।")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {currentLesson?.description ? (
                    <div className="text-xs/relaxed text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {currentLesson.description}
                    </div>
                  ) : (
                    <p className="text-xs/relaxed text-muted-foreground italic">
                      {t("No specific notes for this lesson. Enjoy the video lecture!", "এই পাঠের জন্য কোনো অতিরিক্ত নোট নেই।")}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* 2. Live Class */}
            {activeTab === "live" && currentLesson?.liveClass && (
              <Card size="sm">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Radio className="size-4 text-rose-500 animate-pulse" />
                      {t("Live Session Information", "লাইভ সেশন তথ্য")}
                    </span>
                    <Badge variant="destructive">{t("Live Event", "লাইভ ইভেন্ট")}</Badge>
                  </CardTitle>
                  <CardDescription>
                    {t("Join live interactive discussions, Q&A, and mentoring.", "লাইভ প্রশ্নোত্তর ও মেন্টরিং সেশনে অংশগ্রহণ করুন।")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2 text-xs/relaxed">
                    {(currentLesson.liveClass.date || currentLesson.liveClass.scheduledAt) && (
                      <div className="rounded-md border border-border p-3">
                        <span className="text-muted-foreground block text-[10px] uppercase font-mono">{t("Date & Time", "তারিখ ও সময়")}</span>
                        <span className="font-medium text-foreground mt-0.5 block">
                          {currentLesson.liveClass.date || currentLesson.liveClass.scheduledAt}
                        </span>
                      </div>
                    )}
                    {currentLesson.liveClass.platform && (
                      <div className="rounded-md border border-border p-3">
                        <span className="text-muted-foreground block text-[10px] uppercase font-mono">{t("Platform", "প্ল্যাটফর্ম")}</span>
                        <span className="font-medium text-foreground mt-0.5 block">
                          {currentLesson.liveClass.platform}
                        </span>
                      </div>
                    )}
                  </div>

                  {(currentLesson.liveClass.instructions || currentLesson.liveClass.description) && (
                    <p className="text-xs/relaxed text-muted-foreground">
                      {currentLesson.liveClass.instructions || currentLesson.liveClass.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {(currentLesson.liveClass.link || currentLesson.liveClass.meetingUrl) && (
                      <a
                        href={currentLesson.liveClass.link || currentLesson.liveClass.meetingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={buttonVariants({ size: "sm" })}
                      >
                        <ExternalLink className="size-3.5" data-icon="inline-start" />
                        {t("Join Live Class", "লাইভ ক্লাসে যোগ দিন")}
                      </a>
                    )}

                    {(currentLesson.liveClass.recording || currentLesson.liveClass.recordingUrl) && (
                      <a
                        href={currentLesson.liveClass.recording || currentLesson.liveClass.recordingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={buttonVariants({ variant: "outline", size: "sm" })}
                      >
                        <PlayCircle className="size-3.5" data-icon="inline-start" />
                        {t("Watch Recording", "রেকর্ডিং দেখুন")}
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 3. Documents & PDFs */}
            {activeTab === "documents" && (
              <Card size="sm">
                <CardHeader>
                  <CardTitle>{t("Downloadable Documents & PDFs", "ডকুমেন্ট ও ফাইলসমূহ")}</CardTitle>
                  <CardDescription>
                    {t("Download lecture slides, cheatsheets, and reference materials.", "লেকচার স্লাইড, চিটশিট ও প্রয়োজনীয় ফাইল ডাউনলোড করুন।")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {Array.isArray(currentLesson?.documents) && currentLesson.documents.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("File Title", "ফাইলের নাম")}</TableHead>
                          <TableHead className="w-24">{t("Size", "সাইজ")}</TableHead>
                          <TableHead className="w-28 text-right">{t("Action", "অ্যাকশন")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentLesson.documents.map((doc: any, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <FileText className="size-3.5 text-primary shrink-0" />
                                <span>{doc.title}</span>
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-muted-foreground text-[11px]">
                              {doc.size || "—"}
                            </TableCell>
                            <TableCell className="text-right">
                              {doc.url && (
                                <a
                                  href={doc.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-7 text-[11px]")}
                                >
                                  <FileDown className="size-3" data-icon="inline-start" />
                                  {t("Download", "ডাউনলোড")}
                                </a>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="p-6 text-center text-xs text-muted-foreground">
                      {t("No document attachments in this lesson.", "এই পাঠে কোনো ফাইল নেই।")}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* 4. Quiz */}
            {activeTab === "quiz" && (
              <Card size="sm">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{currentLesson?.quiz?.title || t("Lesson Practice Quiz", "অনুশীলনী কুইজ")}</span>
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {quizQuestions.length} {t("Questions", "টি প্রশ্ন")}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    {t("Test your understanding with these practice questions.", "অনুশীলনী প্রশ্নের মাধ্যমে নিজের প্রস্তুতি যাচাই করুন।")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {quizQuestions.map((q: any, qIdx: number) => {
                    const correctIdx = q.correctIndex !== undefined ? q.correctIndex : q.answerIndex
                    const selectedOption = userQuizAnswers[qIdx]
                    const isCorrect = selectedOption === correctIdx

                    return (
                      <div key={q.id || qIdx} className="space-y-2 rounded-md border border-border p-3.5">
                        <p className="text-xs/relaxed font-semibold text-foreground">
                          {qIdx + 1}. {q.question}
                        </p>

                        <div className="grid gap-2 sm:grid-cols-2 pt-1">
                          {Array.isArray(q.options) &&
                            q.options.map((opt: string, optIdx: number) => {
                              const isSelected = selectedOption === optIdx
                              let btnClass = "border-border bg-card hover:bg-muted text-muted-foreground"

                              if (quizSubmitted) {
                                if (optIdx === correctIdx) {
                                  btnClass = "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold"
                                } else if (isSelected && !isCorrect) {
                                  btnClass = "border-destructive bg-destructive/10 text-destructive font-semibold"
                                }
                              } else if (isSelected) {
                                btnClass = "border-primary bg-primary/10 text-primary font-semibold"
                              }

                              return (
                                <button
                                  key={optIdx}
                                  type="button"
                                  disabled={quizSubmitted}
                                  onClick={() =>
                                    setUserQuizAnswers((prev) => ({
                                      ...prev,
                                      [qIdx]: optIdx,
                                    }))
                                  }
                                  className={cn(
                                    "flex items-center text-left rounded-md border p-2 text-xs/relaxed transition-colors",
                                    btnClass
                                  )}
                                >
                                  <span className="mr-2 flex size-4 shrink-0 items-center justify-center rounded-full border border-border text-[9px] font-mono font-bold">
                                    {String.fromCharCode(65 + optIdx)}
                                  </span>
                                  <span className="truncate">{opt}</span>
                                </button>
                              )
                            })}
                        </div>

                        {quizSubmitted && q.explanation ? (
                          <div className="rounded-md bg-muted/60 p-2.5 text-[11px]/relaxed text-muted-foreground border-l-2 border-primary mt-2">
                            <strong>{t("Explanation:", "ব্যাখ্যা:")}</strong> {q.explanation}
                          </div>
                        ) : null}
                      </div>
                    )
                  })}

                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    {!quizSubmitted ? (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => setQuizSubmitted(true)}
                        disabled={Object.keys(userQuizAnswers).length === 0}
                      >
                        {t("Submit answers", "উত্তর জমা দিন")}
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setUserQuizAnswers({})
                          setQuizSubmitted(false)
                        }}
                      >
                        {t("Retake quiz", "আবার পরীক্ষা দিন")}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 5. Assignment */}
            {activeTab === "assignment" && currentLesson?.assignment && (
              <Card size="sm">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{currentLesson.assignment.title || t("Project Assignment", "প্রজেক্ট অ্যাসাইনমেন্ট")}</span>
                    {(currentLesson.assignment.deadline || currentLesson.assignment.dueDate) && (
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {t("Deadline:", "সময়সীমা:")} {currentLesson.assignment.deadline || currentLesson.assignment.dueDate}
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {t("Hands-on task to complete and submit for evaluation.", "নির্দিষ্ট সময়ের মধ্যে অ্যাসাইনমেন্ট সম্পন্ন করে জমা দিন।")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(currentLesson.assignment.description || currentLesson.assignment.instructions) && (
                    <div className="text-xs/relaxed text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {currentLesson.assignment.description || currentLesson.assignment.instructions}
                    </div>
                  )}

                  {currentLesson.assignment.submissionUrl && (
                    <div className="pt-2">
                      <a
                        href={currentLesson.assignment.submissionUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={buttonVariants({ size: "sm" })}
                      >
                        <ExternalLink className="size-3.5" data-icon="inline-start" />
                        {t("Submit Assignment", "অ্যাসাইনমেন্ট সাবমিট করুন")}
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* 6. Code & Resources */}
            {activeTab === "resources" && (
              <Card size="sm">
                <CardHeader>
                  <CardTitle>{t("Starter Code & Reference Links", "সোর্স কোড ও লিংকসমূহ")}</CardTitle>
                  <CardDescription>
                    {t("Access repository starters, official documentation, and sandboxes.", "প্রয়োজনীয় কোড রিপোজিটরি ও অফিশিয়াল ডকুমেন্টস দেখুন।")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("Resource Title", "রিসোর্সের নাম")}</TableHead>
                        <TableHead className="w-28 text-right">{t("Action", "অ্যাকশন")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.isArray(currentLesson?.resources) &&
                        currentLesson.resources.map((res: any, idx: number) => (
                          <TableRow key={`res-${idx}`}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <Code2 className="size-3.5 text-primary shrink-0" />
                                <span>{res.title}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <a
                                href={res.url}
                                target="_blank"
                                rel="noreferrer"
                                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-7 text-[11px]")}
                              >
                                <ExternalLink className="size-3" data-icon="inline-start" />
                                {t("Open", "খুলুন")}
                              </a>
                            </TableCell>
                          </TableRow>
                        ))}
                      {Array.isArray(currentLesson?.externalLinks) &&
                        currentLesson.externalLinks.map((link: any, idx: number) => (
                          <TableRow key={`link-${idx}`}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <ExternalLink className="size-3.5 text-primary shrink-0" />
                                <span>{link.title}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <a
                                href={link.url}
                                target="_blank"
                                rel="noreferrer"
                                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-7 text-[11px]")}
                              >
                                <ExternalLink className="size-3" data-icon="inline-start" />
                                {t("Visit", "ভিজিট")}
                              </a>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* 7. Instructors */}
            {activeTab === "instructors" && Array.isArray(currentLesson?.instructors) && currentLesson.instructors.length > 0 && (
              <Card size="sm">
                <CardHeader>
                  <CardTitle>{t("Lesson Instructors", "পাঠের শিক্ষকবৃন্দ")}</CardTitle>
                  <CardDescription>
                    {t("The mentors guiding you through this lesson.", "এই পাঠে পাঠদানকারী ইনস্ট্রাক্টরগণ।")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {currentLesson.instructors.map((inst: any, idx: number) => {
                      const initials = (inst.name || "?").trim().charAt(0).toUpperCase()

                      return (
                        <div
                          key={idx}
                          className="flex items-center gap-3 rounded-md border border-border p-3 bg-muted/20"
                        >
                          <Avatar className="size-10">
                            {inst.avatar ? (
                              <AvatarImage src={inst.avatar} alt={inst.name} />
                            ) : null}
                            <AvatarFallback>{initials}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-semibold text-foreground truncate">{inst.name}</h4>
                            <Badge variant="outline" className="text-[10px] mt-0.5">
                              {inst.role || t("Instructor", "শিক্ষক")}
                            </Badge>
                            {inst.email ? (
                              <p className="text-[10px] text-muted-foreground truncate mt-0.5">{inst.email}</p>
                            ) : null}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Right Column (4 cols on desktop): Sticky Curriculum Syllabus Card */}
        <div className="hidden lg:block lg:col-span-4 sticky top-20 space-y-4">
          <Card size="sm" className="gap-0 border-border">
            <CardHeader className="border-b border-border bg-muted/20 py-2.5 px-3.5 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-semibold flex items-center gap-2">
                <Layers className="size-3.5 text-primary" />
                {t("Curriculum", "সিলেবাস")}
              </CardTitle>
              <Badge variant="outline" className="font-mono text-[10px]">
                {completedCount}/{allLessons.length} {t("completed", "সম্পন্ন")}
              </Badge>
            </CardHeader>
            <div className="max-h-[calc(100vh-14rem)] overflow-y-auto">
              {renderCurriculumList()}
            </div>
          </Card>
        </div>
      </div>

      {/* Mobile Slide-Over Curriculum Sheet Drawer */}
      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="right" className="p-0 flex flex-col w-80 sm:w-96">
          <SheetHeader className="p-4 border-b border-border">
            <SheetTitle className="text-xs font-semibold flex items-center gap-2">
              <Layers className="size-3.5 text-primary" />
              {t("Course Curriculum", "কোর্স সিলেবাস")}
            </SheetTitle>
            <SheetDescription className="text-xs">
              {completedCount} of {allLessons.length} {t("lessons completed", "টি পাঠ সম্পন্ন")} ({progressPercent}%)
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto">
            {renderCurriculumList()}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
