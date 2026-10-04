"use client"

import {
  AlertCircle,
  ArrowLeft,
  Award,
  Building2,
  Calendar,
  Check,
  ExternalLink,
  Globe,
  Image as ImageIcon,
  ImageOff,
  Link as LinkIcon,
  Lock,
  Plus,
  Send,
  Trash2,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

import { useLanguage } from "@/components/language-provider"
import { MarkdownEditor } from "@/components/posts/markdown-editor"
import { TagInput } from "@/components/posts/tag-input"
import { Button, buttonVariants } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { PostStatus } from "@/generated/prisma/enums"
import {
  MAX_ACHIEVEMENT_CONTENT_LENGTH,
  MAX_ACHIEVEMENT_EXCERPT_LENGTH,
  MAX_ACHIEVEMENT_ORGANIZATION_LENGTH,
  MAX_ACHIEVEMENT_SLUG_LENGTH,
  MAX_ACHIEVEMENT_TITLE_LENGTH,
} from "@/lib/achievement-constants"
import { toAchievementSlug } from "@/lib/achievement-slug"
import { cn } from "cn"

export type AchievementFormValues = {
  title: string
  titleBn: string
  slug: string
  organization: string
  organizationBn: string
  eventDate: string
  certificateUrl: string
  excerpt: string
  excerptBn: string
  content: string
  contentBn: string
  coverImage: string
  images: string[]
  categoryId: string | null
  tags: string[]
  isFeatured: boolean
}

export type CategoryOption = {
  id: string
  name: string
  nameBn: string | null
  slug: string
}

export type AchievementComposerProps = {
  scope: "author" | "admin"
  initialValues?: Partial<AchievementFormValues>
  initialCategories?: CategoryOption[]
  achievementId?: string
  status?: PostStatus
  massageForAuthor?: string | null
  locked?: boolean
  backHref: string
}

const EMPTY: AchievementFormValues = {
  title: "",
  titleBn: "",
  slug: "",
  organization: "",
  organizationBn: "",
  eventDate: "",
  certificateUrl: "",
  excerpt: "",
  excerptBn: "",
  content: "",
  contentBn: "",
  coverImage: "",
  images: [],
  categoryId: null,
  tags: [],
  isFeatured: false,
}

export function AchievementComposer({
  scope,
  initialValues,
  initialCategories = [],
  achievementId,
  status: initialStatus = PostStatus.DRAFT,
  massageForAuthor,
  locked = false,
  backHref,
}: AchievementComposerProps) {
  const router = useRouter()
  const { t, lang } = useLanguage()
  const isBn = lang === "bn"

  const [values, setValues] = useState<AchievementFormValues>({
    ...EMPTY,
    ...initialValues,
  })

  const [categories, setCategories] = useState<CategoryOption[]>(initialCategories)
  const [activeLangTab, setActiveLangTab] = useState<"en" | "bn">("en")
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(Boolean(initialValues?.slug))
  const [adminStatus, setAdminStatus] = useState<PostStatus>(initialStatus)
  const [newImageUrl, setNewImageUrl] = useState("")

  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Fetch achievement categories if none passed
  useEffect(() => {
    if (categories.length > 0) return
    let active = true

    fetch("/api/categories?type=ACHIEVEMENT")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (active && Array.isArray(data)) setCategories(data)
      })
      .catch(() => {})

    return () => {
      active = false
    }
  }, [categories.length])

  // Update slug automatically when title changes if author has not typed a custom slug
  const handleTitleChange = (val: string) => {
    setValues((prev) => ({
      ...prev,
      title: val,
      slug: slugManuallyEdited ? prev.slug : toAchievementSlug(val),
    }))
  }

  const handleFieldChange = <K extends keyof AchievementFormValues>(
    field: K,
    val: AchievementFormValues[K]
  ) => {
    setValues((prev) => ({ ...prev, [field]: val }))
  }

  const addGalleryImage = () => {
    const trimmed = newImageUrl.trim()
    if (!trimmed) return
    if (values.images.includes(trimmed)) return
    if (values.images.length >= 6) return
    setValues((prev) => ({ ...prev, images: [...prev.images, trimmed] }))
    setNewImageUrl("")
  }

  const removeGalleryImage = (idx: number) => {
    setValues((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== idx),
    }))
  }

  const saveAchievement = useCallback(
    async (targetStatus?: PostStatus, isSubmitAction = false) => {
      setError(null)
      setSuccess(null)
      if (isSubmitAction) setSubmitting(true)
      else setSaving(true)

      try {
        const payload: Record<string, unknown> = {
          title: values.title,
          titleBn: values.titleBn || null,
          slug: values.slug || toAchievementSlug(values.title),
          organization: values.organization || null,
          organizationBn: values.organizationBn || null,
          eventDate: values.eventDate ? new Date(values.eventDate).toISOString() : null,
          certificateUrl: values.certificateUrl || null,
          excerpt: values.excerpt || null,
          excerptBn: values.excerptBn || null,
          content: values.content,
          contentBn: values.contentBn || null,
          coverImage: values.coverImage || null,
          images: values.images,
          categoryId: values.categoryId === "none" ? null : values.categoryId,
          tags: values.tags,
          isFeatured: values.isFeatured,
        }

        if (scope === "admin") {
          payload.status = targetStatus ?? adminStatus
        }

        const endpoint =
          scope === "admin"
            ? achievementId
              ? `/api/admin/achievements/${achievementId}`
              : `/api/admin/achievements`
            : achievementId
            ? `/api/my/achievements/${achievementId}`
            : `/api/my/achievements`

        const method = achievementId ? "PATCH" : "POST"

        const res = await fetch(endpoint, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })

        const data = await res.json()
        if (!res.ok) {
          throw new Error(data?.error?.message ?? data?.error ?? "Failed to save achievement")
        }

        const savedId = achievementId || data.id

        // If author clicked "Submit for review", call the submit endpoint
        if (scope === "author" && isSubmitAction && savedId) {
          const submitRes = await fetch(`/api/my/achievements/${savedId}/submit`, {
            method: "POST",
          })
          if (!submitRes.ok) {
            const submitErr = await submitRes.json()
            throw new Error(submitErr?.error?.message ?? "Saved draft, but failed to submit for review")
          }
        }

        setSuccess(t("Saved successfully!", "সফলভাবে সংরক্ষিত হয়েছে!"))
        router.push(backHref)
        router.refresh()
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "An error occurred while saving")
      } finally {
        setSaving(false)
        setSubmitting(false)
      }
    },
    [values, scope, adminStatus, achievementId, backHref, router, t]
  )

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <a
          href={backHref}
          className={buttonVariants({ variant: "outline", size: "sm", className: "gap-1.5" })}
        >
          <ArrowLeft className="size-3.5" />
          {t("Back", "ফিরে যান")}
        </a>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {scope === "admin" ? (
            <>
              <Select
                value={adminStatus}
                onValueChange={(val) => {
                  if (val) setAdminStatus(val as PostStatus)
                }}
              >
                <SelectTrigger className="h-8 w-36 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={PostStatus.PUBLISHED}>{t("Published", "প্রকাশিত")}</SelectItem>
                  <SelectItem value={PostStatus.PENDING}>{t("In review", "পর্যালোচনায়")}</SelectItem>
                  <SelectItem value={PostStatus.DRAFT}>{t("Draft", "খসড়া")}</SelectItem>
                  <SelectItem value={PostStatus.REJECTED}>{t("Rejected", "ফেরত")}</SelectItem>
                  <SelectItem value={PostStatus.ARCHIVED}>{t("Archived", "আর্কাইভ")}</SelectItem>
                </SelectContent>
              </Select>

              <Button
                size="sm"
                onClick={() => saveAchievement(adminStatus, false)}
                disabled={saving || locked}
                className="gap-1.5"
              >
                {saving && <Spinner className="size-3.5" />}
                <Check className="size-3.5" />
                {achievementId ? t("Update", "আপডেট করুন") : t("Save & Publish", "সংরক্ষণ ও প্রকাশ")}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => saveAchievement(PostStatus.DRAFT, false)}
                disabled={saving || submitting || locked}
                className="gap-1.5"
              >
                {saving && <Spinner className="size-3.5" />}
                {t("Save draft", "খসড়া সংরক্ষণ")}
              </Button>

              <Button
                size="sm"
                onClick={() => saveAchievement(PostStatus.PENDING, true)}
                disabled={saving || submitting || locked}
                className="gap-1.5"
              >
                {submitting && <Spinner className="size-3.5" />}
                <Send className="size-3.5" />
                {t("Submit for review", "পর্যালোচনায় জমা দিন")}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Notices */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {massageForAuthor && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">{t("Feedback from admin:", "অ্যাডমিনের মতামত:")}</p>
            <p className="mt-0.5">{massageForAuthor}</p>
          </div>
        </div>
      )}

      {locked && (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 p-3 text-xs text-muted-foreground">
          <Lock className="size-4" />
          <span>
            {t(
              "This achievement is currently published or under review. It cannot be edited directly.",
              "এই অর্জনটি বর্তমানে প্রকাশিত বা পর্যালোচনাধীন রয়েছে। এটি সরাসরি সম্পাদনা করা যাবে না।"
            )}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content Form (2 Cols) */}
        <div className="space-y-5 lg:col-span-2">
          {/* Language Switcher for Bilingual Input */}
          <div className="flex items-center gap-2 border-b pb-2">
            <span className="text-xs font-medium text-muted-foreground">{t("Content language:", "ভাষার সংস্করণ:")}</span>
            <Button
              type="button"
              variant={activeLangTab === "en" ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setActiveLangTab("en")}
            >
              English
            </Button>
            <Button
              type="button"
              variant={activeLangTab === "bn" ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setActiveLangTab("bn")}
            >
              বাংলা (Bangla)
            </Button>
          </div>

          {/* Title & Slug */}
          {activeLangTab === "en" ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-xs font-semibold">
                  {t("Achievement Title (English)*", "অর্জনের শিরোনাম (ইংরেজি)*")}
                </Label>
                <Input
                  id="title"
                  value={values.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder={t("e.g. 1st Place at National Hackathon 2026", "যেমন: জাতীয় হ্যাকাথন ২০২৬ এ প্রথম স্থান")}
                  maxLength={MAX_ACHIEVEMENT_TITLE_LENGTH}
                  disabled={locked}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="slug" className="text-xs text-muted-foreground">
                  {t("Slug (URL identifier)*", "স্লাগ (ইউআরএল আইডেন্টিফায়ার)*")}
                </Label>
                <Input
                  id="slug"
                  value={values.slug}
                  onChange={(e) => {
                    setSlugManuallyEdited(true)
                    handleFieldChange("slug", toAchievementSlug(e.target.value))
                  }}
                  placeholder="1st-place-national-hackathon-2026"
                  maxLength={MAX_ACHIEVEMENT_SLUG_LENGTH}
                  disabled={locked}
                  className="font-mono text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="organization" className="text-xs font-semibold">
                  {t("Organization / Awarded By (English)", "প্রতিষ্ঠান / প্রদানকারী (ইংরেজি)")}
                </Label>
                <Input
                  id="organization"
                  value={values.organization}
                  onChange={(e) => handleFieldChange("organization", e.target.value)}
                  placeholder="e.g. Bangladesh Computer Council / BUET"
                  maxLength={MAX_ACHIEVEMENT_ORGANIZATION_LENGTH}
                  disabled={locked}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="excerpt" className="text-xs font-semibold">
                  {t("Short Excerpt (English)", "সংক্ষিপ্ত বিবরণ (ইংরেজি)")}
                </Label>
                <Textarea
                  id="excerpt"
                  value={values.excerpt}
                  onChange={(e) => handleFieldChange("excerpt", e.target.value)}
                  placeholder={t("A concise summary displayed on cards and search results", "কার্ড এবং সার্চ ফলাফলে প্রদর্শনের জন্য সংক্ষেপ")}
                  maxLength={MAX_ACHIEVEMENT_EXCERPT_LENGTH}
                  rows={2}
                  disabled={locked}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  {t("Detailed Story / Description (Markdown)*", "বিস্তারিত বিবরণ / গল্প (মার্কডাউন)*")}
                </Label>
                <MarkdownEditor
                  value={values.content}
                  onChange={(val) => handleFieldChange("content", val)}
                  disabled={locked}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="titleBn" className="text-xs font-semibold">
                  {t("Achievement Title (Bangla)", "অর্জনের শিরোনাম (বাংলা)")}
                </Label>
                <Input
                  id="titleBn"
                  value={values.titleBn}
                  onChange={(e) => handleFieldChange("titleBn", e.target.value)}
                  placeholder="যেমন: জাতীয় হ্যাকাথন ২০২৬ এ চ্যাম্পিয়ন"
                  maxLength={MAX_ACHIEVEMENT_TITLE_LENGTH}
                  disabled={locked}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="organizationBn" className="text-xs font-semibold">
                  {t("Organization / Awarded By (Bangla)", "প্রতিষ্ঠান / প্রদানকারী (বাংলা)")}
                </Label>
                <Input
                  id="organizationBn"
                  value={values.organizationBn}
                  onChange={(e) => handleFieldChange("organizationBn", e.target.value)}
                  placeholder="যেমন: বাংলাদেশ কম্পিউটার কাউন্সিল / বুয়েট"
                  maxLength={MAX_ACHIEVEMENT_ORGANIZATION_LENGTH}
                  disabled={locked}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="excerptBn" className="text-xs font-semibold">
                  {t("Short Excerpt (Bangla)", "সংক্ষিপ্ত বিবরণ (বাংলা)")}
                </Label>
                <Textarea
                  id="excerptBn"
                  value={values.excerptBn}
                  onChange={(e) => handleFieldChange("excerptBn", e.target.value)}
                  placeholder="কার্ড এবং সার্চ ফলাফলে প্রদর্শনের জন্য সংক্ষেপ"
                  maxLength={MAX_ACHIEVEMENT_EXCERPT_LENGTH}
                  rows={2}
                  disabled={locked}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  {t("Detailed Story / Description (Bangla Markdown)", "বিস্তারিত বিবরণ / গল্প (বাংলা মার্কডাউন)")}
                </Label>
                <MarkdownEditor
                  value={values.contentBn}
                  onChange={(val) => handleFieldChange("contentBn", val)}
                  disabled={locked}
                />
              </div>
            </div>
          )}
        </div>

        {/* Sidebar / Metadata options (1 Col) */}
        <div className="space-y-5">
          {/* Metadata Card */}
          <div className="rounded-xl border border-border/80 bg-card p-4 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {t("Achievement Details", "অর্জনের তথ্য")}
            </h4>

            {/* Event Date */}
            <div className="space-y-1.5">
              <Label htmlFor="eventDate" className="text-xs font-medium flex items-center gap-1.5">
                <Calendar className="size-3.5" />
                {t("Date of Achievement", "অর্জনের তারিখ")}
              </Label>
              <Input
                id="eventDate"
                type="date"
                value={values.eventDate ? values.eventDate.split("T")[0] : ""}
                onChange={(e) => handleFieldChange("eventDate", e.target.value)}
                disabled={locked}
              />
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <Label htmlFor="category" className="text-xs font-medium flex items-center gap-1.5">
                <Award className="size-3.5" />
                {t("Category", "ক্যাটাগরি")}
              </Label>
              <Select
                value={values.categoryId ?? "none"}
                onValueChange={(val) => handleFieldChange("categoryId", val === "none" ? null : val)}
                disabled={locked}
              >
                <SelectTrigger id="category" className="text-xs">
                  <SelectValue placeholder={t("Select a category", "ক্যাটাগরি নির্বাচন করুন")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("None", "কোনটি নয়")}</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {isBn && c.nameBn ? c.nameBn : c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Credential / Certificate Link */}
            <div className="space-y-1.5">
              <Label htmlFor="certificateUrl" className="text-xs font-medium flex items-center gap-1.5">
                <ExternalLink className="size-3.5" />
                {t("Certificate / Proof Link", "সার্টিফিকেট / প্রমাণ লিঙ্ক")}
              </Label>
              <Input
                id="certificateUrl"
                type="url"
                value={values.certificateUrl}
                onChange={(e) => handleFieldChange("certificateUrl", e.target.value)}
                placeholder="https://..."
                disabled={locked}
              />
            </div>

            {/* Cover Image */}
            <div className="space-y-1.5">
              <Label htmlFor="coverImage" className="text-xs font-medium flex items-center gap-1.5">
                <ImageIcon className="size-3.5" />
                {t("Cover Image URL", "কভার ছবির ইউআরএল")}
              </Label>
              <Input
                id="coverImage"
                type="url"
                value={values.coverImage}
                onChange={(e) => handleFieldChange("coverImage", e.target.value)}
                placeholder="https://images.unsplash.com/..."
                disabled={locked}
              />
              {values.coverImage && (
                <div className="relative mt-2 aspect-video w-full overflow-hidden rounded-md border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={values.coverImage}
                    alt="Cover preview"
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
            </div>

            {/* Additional Images (Gallery) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                {t("Additional Gallery Images (Max 6)", "অতিরিক্ত গ্যালারি ছবি (সর্বোচ্চ ৬টি)")}
              </Label>
              <div className="flex gap-1.5">
                <Input
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="text-xs"
                  disabled={locked || values.images.length >= 6}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addGalleryImage}
                  disabled={locked || values.images.length >= 6 || !newImageUrl.trim()}
                >
                  <Plus className="size-3.5" />
                </Button>
              </div>

              {values.images.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {values.images.map((img, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2 rounded border bg-muted/40 px-2 py-1 text-xs"
                    >
                      <span className="truncate max-w-[180px] font-mono">{img}</span>
                      <button
                        type="button"
                        onClick={() => removeGalleryImage(idx)}
                        disabled={locked}
                        className="text-destructive hover:opacity-80"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tags */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                {t("Tags (up to 8)", "ট্যাগ (সর্বোচ্চ ৮টি)")}
              </Label>
              <TagInput
                value={values.tags}
                onChange={(tags) => handleFieldChange("tags", tags)}
                disabled={locked}
                maxTags={8}
              />
            </div>

            {/* Featured toggle (for Admin) */}
            {scope === "admin" && (
              <div className="flex items-center justify-between rounded-lg border p-2.5">
                <div className="space-y-0.5">
                  <Label htmlFor="featured" className="text-xs font-medium cursor-pointer">
                    {t("Feature on homepage", "হোমপেজে ফিচার করুন")}
                  </Label>
                  <p className="text-[10px] text-muted-foreground">
                    {t("Highlight this achievement prominently", "এই অর্জনটি গুরুত্বসহ প্রদর্শন করুন")}
                  </p>
                </div>
                <input
                  id="featured"
                  type="checkbox"
                  checked={values.isFeatured}
                  onChange={(e) => handleFieldChange("isFeatured", e.target.checked)}
                  className="size-4 rounded accent-primary cursor-pointer"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
