"use client"

import {
  AlertCircle,
  ArrowLeft,
  Check,
  ChevronDown,
  Code2,
  ExternalLink,
  FolderGit2,
  Globe,
  Image as ImageIcon,
  Layers,
  Lock,
  Plus,
  Search,
  Send,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  Video,
  X,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"

import { GithubIcon } from "@/components/icons/github-icon"
import { useLanguage } from "@/components/language-provider"
import { ImageUploadField } from "@/components/media/image-upload-field"
import { MediaPickerModal } from "@/components/media/media-picker-modal"
import { MemberPickerDialog } from "@/components/projects/member-picker-dialog"
import { MarkdownEditor } from "@/components/posts/markdown-editor"
import { TagInput } from "@/components/posts/tag-input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
import { Textarea } from "@/components/ui/textarea"
import { PostStatus } from "@/generated/prisma/enums"
import {
  COMMON_TECH_STACK,
  MAX_PROJECT_DESCRIPTION_LENGTH,
  MAX_PROJECT_EXCERPT_LENGTH,
  MAX_PROJECT_SLUG_LENGTH,
  MAX_PROJECT_TITLE_LENGTH,
} from "@/lib/project-constants"
import { toProjectSlug } from "@/lib/project-slug"
import type { TeamMember } from "@/lib/services/project.service"

export type ProjectFormValues = {
  title: string
  titleBn: string
  slug: string
  categoryId: string | null
  excerpt: string
  excerptBn: string
  description: string
  descriptionBn: string
  coverImage: string
  images: string[]
  liveUrl: string
  githubUrl: string
  youtubeUrl: string
  techStack: string[]
  tags: string[]
  teamMembers: TeamMember[]
  isFeatured: boolean
}

export type CategoryOption = {
  id: string
  name: string
  nameBn: string | null
  slug: string
}

export type ApprovedMember = {
  id: string
  userId: string
  name: string
  email: string
  avatar: string | null
  studentId: string | null
  department: string | null
  session?: string | null
  semester?: string | null
  shift?: string | null
}

export type ProjectComposerFormProps = {
  scope: "author" | "admin"
  initialValues?: Partial<ProjectFormValues>
  initialCategories?: CategoryOption[]
  projectId?: string
  status?: PostStatus
  massageForAuthor?: string | null
  locked?: boolean
  backHref: string
}

const COMMON_ROLES = [
  "Lead Developer",
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Hardware / IoT Engineer",
  "Robotics Engineer",
  "UI/UX Designer",
  "Firmware Engineer",
  "QA & Testing",
  "Contributor",
]

const EMPTY: ProjectFormValues = {
  title: "",
  titleBn: "",
  slug: "",
  categoryId: null,
  excerpt: "",
  excerptBn: "",
  description: "",
  descriptionBn: "",
  coverImage: "",
  images: [],
  liveUrl: "",
  githubUrl: "",
  youtubeUrl: "",
  techStack: [],
  tags: [],
  teamMembers: [],
  isFeatured: false,
}

export function ProjectComposerForm({
  scope,
  initialValues,
  initialCategories = [],
  projectId,
  status: initialStatus = PostStatus.DRAFT,
  massageForAuthor,
  locked = false,
  backHref,
}: ProjectComposerFormProps) {
  const router = useRouter()
  const { t, lang } = useLanguage()
  const isBn = lang === "bn"

  const [values, setValues] = useState<ProjectFormValues>({
    ...EMPTY,
    ...initialValues,
  })

  const [categories, setCategories] = useState<CategoryOption[]>(initialCategories)
  const [activeLangTab, setActiveLangTab] = useState<"en" | "bn">("en")
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(Boolean(initialValues?.slug))
  const [adminStatus, setAdminStatus] = useState<PostStatus>(initialStatus)

  // Media Gallery Modal state
  const [galleryPickerOpen, setGalleryPickerOpen] = useState(false)
  const [newGalleryUrl, setNewGalleryUrl] = useState("")

  // Tech stack custom input state
  const [customTech, setCustomTech] = useState("")

  // Team Member Picker Modal state
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false)

  // Form submission state
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Fetch project categories if none passed
  useEffect(() => {
    if (categories.length > 0) return
    let active = true

    fetch("/api/categories?type=PROJECT")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (active && Array.isArray(data)) setCategories(data)
      })
      .catch(() => {})

    return () => {
      active = false
    }
  }, [categories.length])

  // Auto-generate slug from title
  const handleTitleChange = (val: string) => {
    setValues((prev) => ({
      ...prev,
      title: val,
      slug: slugManuallyEdited ? prev.slug : toProjectSlug(val),
    }))
  }

  const handleFieldChange = <K extends keyof ProjectFormValues>(
    field: K,
    val: ProjectFormValues[K]
  ) => {
    setValues((prev) => ({ ...prev, [field]: val }))
  }

  // Tech stack toggling
  const toggleTechStack = (tech: string) => {
    setValues((prev) => {
      const exists = prev.techStack.includes(tech)
      return {
        ...prev,
        techStack: exists
          ? prev.techStack.filter((t) => t !== tech)
          : [...prev.techStack, tech],
      }
    })
  }

  const addCustomTech = () => {
    const trimmed = customTech.trim()
    if (!trimmed) return
    if (!values.techStack.includes(trimmed)) {
      setValues((prev) => ({
        ...prev,
        techStack: [...prev.techStack, trimmed],
      }))
    }
    setCustomTech("")
  }

  // Gallery images
  const addGalleryImage = (url: string) => {
    const trimmed = url.trim()
    if (!trimmed || values.images.includes(trimmed) || values.images.length >= 8) return
    setValues((prev) => ({ ...prev, images: [...prev.images, trimmed] }))
    setNewGalleryUrl("")
  }

  const removeGalleryImage = (idx: number) => {
    setValues((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== idx),
    }))
  }

  // Team Member Actions
  const handleAddTeamMember = (member: TeamMember) => {
    // Check if user already added
    if (member.userId && values.teamMembers.some((m) => m.userId === member.userId)) {
      setError(t("This member is already added to the team.", "এই সদস্য ইতিমধ্যে প্রজেক্ট টিমে যুক্ত আছেন।"))
      return
    }
    setValues((prev) => ({
      ...prev,
      teamMembers: [...prev.teamMembers, member],
    }))
    setError(null)
  }

  const handleRemoveMember = (idx: number) => {
    setValues((prev) => ({
      ...prev,
      teamMembers: prev.teamMembers.filter((_, i) => i !== idx),
    }))
  }

  // Save / Submit logic
  const saveProject = useCallback(
    async (targetStatus?: PostStatus, isSubmitAction = false) => {
      setError(null)
      setSuccess(null)

      if (!values.title.trim()) {
        setError(t("Project title is required", "প্রজেক্টের শিরোনাম আবশ্যক"))
        return
      }

      if (!values.description.trim()) {
        setError(
          t(
            "Project detailed description (Markdown) is required",
            "প্রজেক্টের বিস্তারিত বিবরণ (মার্কডাউন) আবশ্যক"
          )
        )
        return
      }

      if (isSubmitAction) setSubmitting(true)
      else setSaving(true)

      try {
        const payload: Record<string, unknown> = {
          title: values.title.trim(),
          titleBn: values.titleBn.trim() || null,
          slug: values.slug.trim() || toProjectSlug(values.title),
          categoryId: values.categoryId === "none" ? null : values.categoryId,
          excerpt: values.excerpt.trim() || null,
          excerptBn: values.excerptBn.trim() || null,
          description: values.description,
          descriptionBn: values.descriptionBn || null,
          coverImage: values.coverImage || null,
          images: values.images,
          liveUrl: values.liveUrl.trim() || null,
          githubUrl: values.githubUrl.trim() || null,
          youtubeUrl: values.youtubeUrl.trim() || null,
          techStack: values.techStack,
          tags: values.tags,
          teamMembers: values.teamMembers,
          isFeatured: values.isFeatured,
          submitForReview: isSubmitAction,
        }

        if (scope === "admin") {
          const finalStatus = targetStatus ?? adminStatus
          payload.status = finalStatus
          payload.publishImmediately = finalStatus === PostStatus.PUBLISHED
        }

        const endpoint =
          scope === "admin"
            ? projectId
              ? `/api/admin/projects/${projectId}`
              : `/api/admin/projects`
            : projectId
              ? `/api/projects/${projectId}`
              : `/api/projects`

        const method = projectId ? "PATCH" : "POST"

        const res = await fetch(endpoint, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })

        const data = await res.json()
        if (!res.ok) {
          throw new Error(data?.error?.message ?? data?.error ?? "Failed to save project")
        }

        setSuccess(
          isSubmitAction
            ? t("Project submitted for review!", "প্রজেক্টটি পর্যালোচনার জন্য জমা হয়েছে!")
            : t("Saved successfully!", "সফলভাবে সংরক্ষিত হয়েছে!")
        )
        router.push(backHref)
        router.refresh()
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "An error occurred while saving")
      } finally {
        setSaving(false)
        setSubmitting(false)
      }
    },
    [values, scope, adminStatus, projectId, backHref, router, t]
  )

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Link
            href={backHref}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <ArrowLeft className="size-4 mr-1.5" />
            {t("Back", "ফিরে যান")}
          </Link>
          <div className="space-y-0.5">
            <h2 className="font-heading text-lg font-bold">
              {projectId
                ? t("Edit Project", "প্রজেক্ট সম্পাদনা করুন")
                : scope === "admin"
                  ? t("Create New Project", "নতুন প্রজেক্ট তৈরি করুন")
                  : t("Submit Student Project", "শিক্ষার্থী প্রজেক্ট জমা দিন")}
            </h2>
            <p className="text-xs text-muted-foreground">
              {scope === "admin"
                ? t("Admin project composer with direct publishing capabilities.", "অ্যাডমিন প্রজেক্ট কম্পোজার ও সরাসরি প্রকাশনা।")
                : t("Showcase your portfolio, semester projects, and hardware prototypes.", "আপনার পোর্টফোলিও, সেমিস্টার প্রজেক্ট বা হার্ডওয়্যার প্রোটোটাইপ প্রদর্শন করুন।")}
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2">
          {scope === "author" ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => saveProject(PostStatus.DRAFT, false)}
                disabled={saving || submitting || locked}
              >
                {saving && <Spinner className="size-3.5 mr-1.5" />}
                {t("Save Draft", "খসড়া সংরক্ষণ")}
              </Button>
              <Button
                size="sm"
                onClick={() => saveProject(PostStatus.PENDING, true)}
                disabled={saving || submitting || locked}
              >
                {submitting ? (
                  <Spinner className="size-3.5 mr-1.5" />
                ) : (
                  <Send className="size-3.5 mr-1.5" />
                )}
                {t("Submit for Review", "পর্যালোচনার জন্য জমা দিন")}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => saveProject(PostStatus.DRAFT, false)}
                disabled={saving || submitting || locked}
              >
                {saving && <Spinner className="size-3.5 mr-1.5" />}
                {t("Save as Draft", "খসড়া রাখুন")}
              </Button>
              <Button
                size="sm"
                onClick={() => saveProject(PostStatus.PUBLISHED, false)}
                disabled={saving || submitting || locked}
              >
                {saving ? (
                  <Spinner className="size-3.5 mr-1.5" />
                ) : (
                  <Check className="size-3.5 mr-1.5" />
                )}
                {t("Publish Immediately", "সরাসরি প্রকাশ করুন")}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Rejection / Moderation Notice */}
      {massageForAuthor && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-xs space-y-1">
          <p className="font-bold text-destructive flex items-center gap-1.5">
            <AlertCircle className="size-4" />
            {t("Feedback from Reviewer / Admin:", "পর্যালোচকের মন্তব্য:")}
          </p>
          <p className="text-foreground/90">{massageForAuthor}</p>
        </div>
      )}

      {/* Success / Error Banners */}
      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
          <Check className="size-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Language Tabs + Title + Markdown Editor (2 Cols) */}
        <div className="lg:col-span-2 space-y-5">
          {/* Language Tab Switcher */}
          <div className="flex items-center justify-between border-b border-border/80 pb-2">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={activeLangTab === "en" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveLangTab("en")}
                className="h-8 text-xs font-semibold"
              >
                🇬🇧 {t("English Content", "ইংরেজি বিবরণ")}
              </Button>
              <Button
                type="button"
                variant={activeLangTab === "bn" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveLangTab("bn")}
                className="h-8 text-xs font-semibold"
              >
                🇧🇩 {t("বাংলা (Bangla Content)", "বাংলা বিবরণ")}
              </Button>
            </div>
            <span className="text-[11px] text-muted-foreground">
              {activeLangTab === "en"
                ? t("Primary language (Required)", "প্রধান ভাষা (আবশ্যক)")
                : t("Optional bilingual version", "ঐচ্ছিক দ্বিভাষিক সংস্করণ")}
            </span>
          </div>

          {/* Tab 1: English Fields */}
          {activeLangTab === "en" ? (
            <div className="space-y-4">
              {/* Title */}
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-xs font-semibold">
                  {t("Project Title (English)*", "প্রজেক্টের শিরোনাম (ইংরেজি)*")}
                </Label>
                <Input
                  id="title"
                  value={values.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder={t(
                    "e.g., Autonomous Obstacle Avoiding Robot with ROS 2",
                    "যেমন: স্বয়ংক্রিয় রোবটিক ভেহিকল"
                  )}
                  maxLength={MAX_PROJECT_TITLE_LENGTH}
                  disabled={locked}
                />
              </div>

              {/* Short Excerpt */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label htmlFor="excerpt" className="text-xs font-semibold">
                    {t("Short Excerpt (English)", "সংক্ষিপ্ত বিবরণ (ইংরেজি)")}
                  </Label>
                  <span className="text-[10px] text-muted-foreground">
                    {values.excerpt.length}/{MAX_PROJECT_EXCERPT_LENGTH}
                  </span>
                </div>
                <Textarea
                  id="excerpt"
                  value={values.excerpt}
                  onChange={(e) => handleFieldChange("excerpt", e.target.value)}
                  placeholder={t(
                    "A crisp overview displayed on showcase cards and search engines...",
                    "শোকেস কার্ড এবং সার্চ রেজাল্টে প্রদর্শিত সংক্ষিপ্ত পরিচিতি..."
                  )}
                  maxLength={MAX_PROJECT_EXCERPT_LENGTH}
                  rows={2}
                  disabled={locked}
                />
              </div>

              {/* Detailed Markdown Story */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">
                    {t(
                      "Detailed Documentation & Case Study (Markdown)*",
                      "বিস্তারিত ডকুমেন্টেশন ও কেস স্টাডি (মার্কডাউন)*"
                    )}
                  </Label>
                  <span className="text-[10px] text-muted-foreground">
                    {t("Supports headings, tables, code blocks, images", "হেডিং, টেবিল, কোড ব্লক, ছবি সমর্থন করে")}
                  </span>
                </div>
                <MarkdownEditor
                  value={values.description}
                  onChange={(val) => handleFieldChange("description", val)}
                  disabled={locked}
                />
              </div>
            </div>
          ) : (
            /* Tab 2: Bangla Fields */
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="titleBn" className="text-xs font-semibold">
                  {t("Project Title (Bangla)", "প্রজেক্টের শিরোনাম (বাংলা)")}
                </Label>
                <Input
                  id="titleBn"
                  value={values.titleBn}
                  onChange={(e) => handleFieldChange("titleBn", e.target.value)}
                  placeholder="যেমন: আরডুইনো চালিত স্মার্ট হোম অটোমেশন ও সিকিউরিটি সিস্টেম"
                  maxLength={MAX_PROJECT_TITLE_LENGTH}
                  disabled={locked}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label htmlFor="excerptBn" className="text-xs font-semibold">
                    {t("Short Excerpt (Bangla)", "সংক্ষিপ্ত বিবরণ (বাংলা)")}
                  </Label>
                  <span className="text-[10px] text-muted-foreground">
                    {values.excerptBn.length}/{MAX_PROJECT_EXCERPT_LENGTH}
                  </span>
                </div>
                <Textarea
                  id="excerptBn"
                  value={values.excerptBn}
                  onChange={(e) => handleFieldChange("excerptBn", e.target.value)}
                  placeholder="কার্ড এবং সার্চ ফলাফলে প্রদর্শনের জন্য সংক্ষেপ"
                  maxLength={MAX_PROJECT_EXCERPT_LENGTH}
                  rows={2}
                  disabled={locked}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  {t(
                    "Detailed Documentation & Story (Bangla Markdown)",
                    "বিস্তারিত ডকুমেন্টেশন ও গল্প (বাংলা মার্কডাউন)"
                  )}
                </Label>
                <MarkdownEditor
                  value={values.descriptionBn}
                  onChange={(val) => handleFieldChange("descriptionBn", val)}
                  disabled={locked}
                />
              </div>
            </div>
          )}

          {/* External Links Card */}
          <Card className="p-4 border-border/80 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Globe className="size-3.5 text-primary" />
              {t("Project Links & Repositories", "প্রজেক্ট লিঙ্ক ও রিপোজিটরি")}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="liveUrl" className="text-xs font-medium flex items-center gap-1">
                  <ExternalLink className="size-3 text-muted-foreground" />
                  {t("Live Demo URL", "লাইভ ডেমো লিঙ্ক")}
                </Label>
                <Input
                  id="liveUrl"
                  type="url"
                  value={values.liveUrl}
                  onChange={(e) => handleFieldChange("liveUrl", e.target.value)}
                  placeholder="https://..."
                  disabled={locked}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="githubUrl" className="text-xs font-medium flex items-center gap-1">
                  <GithubIcon className="size-3 text-muted-foreground" />
                  {t("GitHub Repository", "গিটহাব রিপো")}
                </Label>
                <Input
                  id="githubUrl"
                  type="url"
                  value={values.githubUrl}
                  onChange={(e) => handleFieldChange("githubUrl", e.target.value)}
                  placeholder="https://github.com/..."
                  disabled={locked}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="youtubeUrl" className="text-xs font-medium flex items-center gap-1">
                  <Video className="size-3 text-muted-foreground" />
                  {t("Video Demo URL", "ভিডিও ডেমো লিঙ্ক")}
                </Label>
                <Input
                  id="youtubeUrl"
                  type="url"
                  value={values.youtubeUrl}
                  onChange={(e) => handleFieldChange("youtubeUrl", e.target.value)}
                  placeholder="https://youtube.com/..."
                  disabled={locked}
                />
              </div>
            </div>
          </Card>

          {/* Team Members Section from Approved Members */}
          <Card className="p-4 border-border/80 space-y-4 overflow-visible">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Users className="size-3.5 text-primary" />
                  {t("Team Members & Contributors", "প্রজেক্ট টিম ও অবদানকারী")}
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  {t(
                    "Add verified society members who built this project with you.",
                    "সোসাইটির ভেরিফাইড সক্রিয় সদস্যদের টিম মেম্বার হিসেবে যুক্ত করুন।"
                  )}
                </p>
              </div>
              <Badge variant="outline" className="text-[10px]">
                {values.teamMembers.length} {t("Members", "সদস্য")}
              </Badge>
            </div>

            {/* List of currently added team members */}
            {values.teamMembers.length > 0 && (
              <div className="space-y-2">
                {values.teamMembers.map((member, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-border/70 bg-muted/30 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar className="size-8 shrink-0 border border-border/60">
                        {member.avatar && <AvatarImage src={member.avatar} />}
                        <AvatarFallback className="text-[11px] font-bold">
                          {member.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-foreground truncate">{member.name}</p>
                          <Badge variant="secondary" className="text-[10px] py-0 px-1.5 font-normal">
                            {member.role || "Contributor"}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {member.studentId ? `ID: ${member.studentId}` : ""}
                          {member.department ? ` • ${member.department.replace(/_/g, " ")}` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {member.githubUrl && (
                        <a
                          href={member.githubUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 text-muted-foreground hover:text-foreground"
                        >
                          <GithubIcon className="size-3.5" />
                        </a>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMember(idx)}
                        disabled={locked}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Member Add Trigger via Modal Dialog */}
            <div className="pt-2 border-t border-border/60 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                {t(
                  "Add approved society members or external project contributors.",
                  "অনুমোদিত সদস্য বা বহিরাগত সহযোগীদের প্রজেক্টে যুক্ত করুন।"
                )}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsMemberModalOpen(true)}
                disabled={locked}
                className="gap-1.5"
              >
                <UserPlus className="size-3.5 text-primary" />
                <span>{t("Select from Approved Members", "অনুমোদিত সদস্যদের মধ্য থেকে নির্বাচন")}</span>
              </Button>
            </div>

            <MemberPickerDialog
              open={isMemberModalOpen}
              onOpenChange={setIsMemberModalOpen}
              onAddMember={handleAddTeamMember}
              existingTeamMemberUserIds={values.teamMembers
                .map((m) => m.userId)
                .filter((id): id is string => Boolean(id))}
            />
          </Card>
        </div>

        {/* Right Sidebar: Metadata, Cover Image from Media, Tech Stack (1 Col) */}
        <div className="space-y-5">
          {/* Metadata Card */}
          <Card className="p-4 border-border/80 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <FolderGit2 className="size-3.5 text-primary" />
              {t("Project Classification", "প্রজেক্টের তথ্য")}
            </h4>

            {/* Category */}
            <div className="space-y-1.5">
              <Label htmlFor="categoryId" className="text-xs font-medium">
                {t("Category", "ক্যাটাগরি")}
              </Label>
              <Select
                value={values.categoryId ?? "none"}
                onValueChange={(val) =>
                  handleFieldChange("categoryId", val === "none" ? null : val)
                }
                disabled={locked}
              >
                <SelectTrigger id="categoryId" className="text-xs w-full">
                  <SelectValue placeholder={t("Select a category", "ক্যাটাগরি নির্বাচন করুন")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("None / General", "সাধারণ")}</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {isBn && c.nameBn ? c.nameBn : c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Slug */}
            <div className="space-y-1.5">
              <Label htmlFor="slug" className="text-xs font-medium">
                {t("URL Slug", "ইউআরএল স্লাগ")}
              </Label>
              <Input
                id="slug"
                value={values.slug}
                onChange={(e) => {
                  setSlugManuallyEdited(true)
                  handleFieldChange("slug", toProjectSlug(e.target.value))
                }}
                maxLength={MAX_PROJECT_SLUG_LENGTH}
                placeholder="project-slug-preview"
                className="font-mono text-xs"
                disabled={locked}
              />
              <p className="text-[10px] text-muted-foreground truncate">
                /projects/{values.slug || "your-project-slug"}
              </p>
            </div>

            {/* Admin-only Featured & Status controls */}
            {scope === "admin" && (
              <div className="pt-3 border-t border-border/60 space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="isFeatured" className="text-xs font-medium cursor-pointer">
                    {t("Feature on Showcase Home", "হোমপেজে ফিচার্ড হিসেবে দেখান")}
                  </Label>
                  <input
                    id="isFeatured"
                    type="checkbox"
                    checked={values.isFeatured}
                    onChange={(e) => handleFieldChange("isFeatured", e.target.checked)}
                    className="size-4 rounded accent-primary cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">{t("Moderation Status", "স্ট্যাটাস")}</Label>
                  <Select
                    value={adminStatus}
                    onValueChange={(val) => val && setAdminStatus(val as PostStatus)}
                  >
                    <SelectTrigger className="text-xs w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={PostStatus.PUBLISHED}>{t("Published", "প্রকাশিত")}</SelectItem>
                      <SelectItem value={PostStatus.PENDING}>{t("Pending Review", "অপেক্ষমান")}</SelectItem>
                      <SelectItem value={PostStatus.DRAFT}>{t("Draft", "খসড়া")}</SelectItem>
                      <SelectItem value={PostStatus.REJECTED}>{t("Changes Requested", "ফেরত")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </Card>

          {/* Cover Image via Media Library Card */}
          <Card className="p-4 border-border/80 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <ImageIcon className="size-3.5 text-primary" />
              {t("Cover Banner (From Media)", "কভার ছবি (মিডিয়া থেকে)")}
            </h4>

            {/* Cover Image Upload & Picker */}
            <ImageUploadField
              id="coverImage"
              label={t("Cover Image", "কভার ছবি")}
              value={values.coverImage}
              onChange={(url) => handleFieldChange("coverImage", url)}
              disabled={locked}
              aspectRatio="video"
              allowLibrary={true}
              defaultFolder="general"
              helpText={t(
                "Upload directly or choose from DPI Computing Society media library.",
                "সরাসরি আপলোড করুন বা মিডিয়া লাইব্রেরি থেকে একটি ছবি নির্বাচন করুন।"
              )}
            />
          </Card>

          {/* Gallery Screenshots Card */}
          <Card className="p-4 border-border/80 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Layers className="size-3.5 text-primary" />
                {t("Project Gallery & Screenshots", "প্রজেক্ট স্ক্রিনশট ও ছবি")}
              </h4>
              <span className="text-[10px] text-muted-foreground">
                {values.images.length}/8
              </span>
            </div>

            {/* Existing images list */}
            {values.images.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {values.images.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-video rounded-lg overflow-hidden border border-border bg-muted group"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt="Screenshot" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeGalleryImage(idx)}
                      className="absolute top-1 right-1 size-6 rounded-md bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Gallery Image with Media Picker Modal */}
            {values.images.length < 8 && (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setGalleryPickerOpen(true)}
                  disabled={locked}
                  className="w-full text-xs gap-1.5"
                >
                  <Plus className="size-3.5" />
                  {t("Add from Media Library", "মিডিয়া লাইব্রেরি থেকে যোগ করুন")}
                </Button>
              </div>
            )}

            {/* Media picker modal for gallery */}
            <MediaPickerModal
              open={galleryPickerOpen}
              onOpenChange={setGalleryPickerOpen}
              onSelect={(url) => {
                addGalleryImage(url)
                setGalleryPickerOpen(false)
              }}
              title={t("Select Screenshot for Gallery", "গ্যালারির জন্য স্ক্রিনশট নির্বাচন করুন")}
              defaultFolder="general"
            />
          </Card>

          {/* Tech Stack & Tags Card */}
          <Card className="p-4 border-border/80 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Code2 className="size-3.5 text-primary" />
              {t("Tech Stack & Tags", "ব্যবহৃত প্রযুক্তি ও ট্যাগ")}
            </h4>

            {/* Quick Tech Stack suggestions */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">
                {t("Popular Tech Stack (Click to toggle)", "জনপ্রিয় টেকনোলজি")}
              </Label>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 border border-border/50 rounded-lg">
                {COMMON_TECH_STACK.map((tech) => {
                  const isSelected = values.techStack.includes(tech)
                  return (
                    <button
                      key={tech}
                      type="button"
                      onClick={() => toggleTechStack(tech)}
                      className={`text-[11px] px-2 py-0.5 rounded-md transition-colors ${
                        isSelected
                          ? "bg-primary text-primary-foreground font-semibold"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {tech}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Custom tech input */}
            <div className="flex gap-2">
              <Input
                value={customTech}
                onChange={(e) => setCustomTech(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addCustomTech()
                  }
                }}
                placeholder={t("Add custom tech...", "অন্য প্রযুক্তি যোগ করুন...")}
                className="h-8 text-xs"
                disabled={locked}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCustomTech}
                className="h-8 text-xs shrink-0"
              >
                {t("Add", "যোগ")}
              </Button>
            </div>

            {/* Tags */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">{t("Search Tags", "ট্যাগসমূহ")}</Label>
              <TagInput
                value={values.tags}
                onChange={(tags) => handleFieldChange("tags", tags)}
                disabled={locked}
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
