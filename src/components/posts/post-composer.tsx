"use client"

import {
  AlertCircle,
  ArrowLeft,
  Check,
  ExternalLink,
  Globe,
  ImageOff,
  Lock,
  MessageSquare,
  Send,
  Trash2,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"

import { useLanguage } from "@/components/language-provider"
import { MarkdownEditor } from "@/components/posts/markdown-editor"
import { SeoPreview } from "@/components/posts/seo-preview"
import { TagInput } from "@/components/posts/tag-input"
import { Button } from "@/components/ui/button"
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
  MAX_POST_CONTENT_LENGTH,
  MAX_POST_EXCERPT_LENGTH,
  MAX_POST_SEO_DESCRIPTION_LENGTH,
  MAX_POST_SLUG_LENGTH,
  MAX_POST_TAGS,
  MAX_POST_TITLE_LENGTH,
} from "@/lib/post-constants"
import { toPostSlug } from "@/lib/post-slug"
import { cn } from "cn"

export type PostFormValues = {
  title: string
  titleBn: string
  slug: string
  excerpt: string
  excerptBn: string
  content: string
  contentBn: string
  coverImage: string
  ogImage: string
  categoryId: string | null
  tags: string[]
  seoTitle: string
  seoDescription: string
  isFeatured: boolean
}

export type CategoryOption = {
  id: string
  name: string
  nameBn: string | null
  slug: string
}

export type PostComposerProps = {
  /** `admin` writes through the admin endpoints and may set status directly. */
  scope: "author" | "admin"
  initialValues?: Partial<
    PostFormValues & {
      category?: CategoryOption | string | null
    }
  >
  initialCategories?: CategoryOption[]
  postId?: string
  status?: PostStatus
  massageForAuthor?: string | null
  /** Author editing an already approved post: show the lock notice, no writes. */
  locked?: boolean
  backHref: string
}

const EMPTY: PostFormValues = {
  title: "",
  titleBn: "",
  slug: "",
  excerpt: "",
  excerptBn: "",
  content: "",
  contentBn: "",
  coverImage: "",
  ogImage: "",
  categoryId: null,
  tags: [],
  seoTitle: "",
  seoDescription: "",
  isFeatured: false,
}

type Notice = { tone: "success" | "error"; message: string } | null

export function PostComposer({
  scope,
  initialValues,
  initialCategories,
  postId,
  status = PostStatus.DRAFT,
  massageForAuthor,
  locked = false,
  backHref,
}: PostComposerProps) {
  const router = useRouter()
  const { t, lang } = useLanguage()

  const resolvedInitialCategoryId = useMemo(() => {
    if (initialValues?.categoryId !== undefined) return initialValues.categoryId
    const cat = initialValues?.category
    if (cat && typeof cat === "object" && "id" in cat) return cat.id
    if (typeof cat === "string") return cat
    return null
  }, [initialValues])

  const [values, setValues] = useState<PostFormValues>({
    ...EMPTY,
    ...initialValues,
    categoryId: resolvedInitialCategoryId,
  })

  const [categories, setCategories] = useState<CategoryOption[]>(
    initialCategories || []
  )
  const [statusValue] = useState<PostStatus>(status)
  const [contentTab, setContentTab] = useState<"en" | "bn">("en")
  const [slugTouched, setSlugTouched] = useState(Boolean(initialValues?.slug))
  const [pending, setPending] = useState<null | "save" | "submit" | "withdraw" | "delete">(null)
  const [notice, setNotice] = useState<Notice>(null)

  useEffect(() => {
    if (initialCategories && initialCategories.length > 0) return
    let active = true

    fetch("/api/categories?type=post")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (active && Array.isArray(data)) {
          setCategories(data)
        }
      })
      .catch(() => {})

    return () => {
      active = false
    }
  }, [initialCategories])

  const readOnly = locked || pending !== null

  const patch = useCallback(<K extends keyof PostFormValues>(key: K, value: PostFormValues[K]) => {
    setValues((previous) => ({ ...previous, [key]: value }))
    setNotice(null)
  }, [])

  // The slug tracks the title until the author edits it by hand.
  const patchTitle = useCallback(
    (next: string) => {
      setValues((previous) => ({
        ...previous,
        title: next,
        slug: slugTouched ? previous.slug : toPostSlug(next),
      }))
      setNotice(null)
    },
    [slugTouched]
  )

  const endpoint = useMemo(() => {
    const base = scope === "admin" ? "/api/admin/posts" : "/api/my/posts"
    return postId ? `${base}/${postId}` : base
  }, [scope, postId])

  const request = useCallback(
    async (
      method: "POST" | "PATCH" | "DELETE",
      body?: unknown,
      suffix = ""
    ): Promise<unknown> => {
      const response = await fetch(`${endpoint}${suffix}`, {
        method,
        headers: body === undefined ? undefined : { "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(
          (payload as { error?: { message?: string } } | null)?.error?.message ?? "Request failed"
        )
      }

      return payload
    },
    [endpoint]
  )

  const buildPayload = useCallback(
    () => ({
      title: values.title.trim(),
      titleBn: values.titleBn.trim() || null,
      slug: slugTouched ? values.slug.trim() : toPostSlug(values.title),
      excerpt: values.excerpt.trim() || null,
      excerptBn: values.excerptBn.trim() || null,
      content: values.content,
      contentBn: values.contentBn.trim() ? values.contentBn : null,
      coverImage: values.coverImage.trim() || null,
      ogImage: values.ogImage.trim() || null,
      categoryId: values.categoryId,
      tags: values.tags,
      seoTitle: values.seoTitle.trim() || null,
      seoDescription: values.seoDescription.trim() || null,
      ...(scope === "admin" ? { isFeatured: values.isFeatured, status: statusValue } : {}),
    }),
    [scope, slugTouched, statusValue, values]
  )

  const validate = useCallback((): string | null => {
    if (values.title.trim().length < 5) {
      return t("Title must be at least 5 characters.", "শিরোনাম অন্তত ৫ অক্ষরের হতে হবে।")
    }

    if (values.title.length > MAX_POST_TITLE_LENGTH) {
      return t("Title is too long.", "শিরোনাম অনেক লম্বা।")
    }

    if (values.titleBn && values.titleBn.length > MAX_POST_TITLE_LENGTH) {
      return t("Bangla title is too long.", "বাংলা শিরোনাম অনেক লম্বা।")
    }

    if (!values.content.trim() && !values.contentBn.trim()) {
      return t("Content is required (in English or Bangla).", "কন্টেন্ট আবশ্যক (ইংরেজি বা বাংলায়)।")
    }

    if (values.content.length > MAX_POST_CONTENT_LENGTH) {
      return t("English content is too long.", "ইংরেজি কন্টেন্ট অনেক লম্বা।")
    }

    if (values.contentBn.length > MAX_POST_CONTENT_LENGTH) {
      return t("Bangla content is too long.", "বাংলা কন্টেন্ট অনেক লম্বা।")
    }

    if (values.excerpt.length > MAX_POST_EXCERPT_LENGTH) {
      return t("Excerpt is too long.", "সংক্ষিপ্ত বিবরণ অনেক লম্বা।")
    }

    if (values.excerptBn.length > MAX_POST_EXCERPT_LENGTH) {
      return t("Bangla excerpt is too long.", "বাংলা সংক্ষিপ্ত বিবরণ অনেক লম্বা।")
    }

    if (values.seoDescription.length > MAX_POST_SEO_DESCRIPTION_LENGTH) {
      return t("SEO description is too long.", "SEO বিবরণ অনেক লম্বা।")
    }

    if (values.tags.length > MAX_POST_TAGS) {
      return t("Too many tags.", "অনেক বেশি ট্যাগ।")
    }

    return null
  }, [t, values])

  const run = useCallback(
    async (
      kind: NonNullable<typeof pending>,
      success: string,
      onDone?: (result: never) => void
    ) => {
      if (kind === "save" || kind === "submit") {
        const invalid = validate()

        if (invalid) {
          setNotice({ tone: "error", message: invalid })
          return
        }
      }

      setPending(kind)
      setNotice(null)

      try {
        if (kind === "save") {
          const result = await request(postId ? "PATCH" : "POST", buildPayload())

          setNotice({ tone: "success", message: t("Saved.", "সংরক্ষিত হয়েছে।") })

          if (!postId) {
            const created = result as { id?: string }

            if (created?.id) router.replace(`${backHref}/${created.id}`)
          } else {
            router.refresh()
          }
        }

        if (kind === "submit") {
          if (!postId) {
            const created = (await request("POST", buildPayload())) as { id?: string }

            if (!created?.id) throw new Error("Post was created without an id")

            await fetch(`/api/my/posts/${created.id}/submit`, { method: "POST" })
            setNotice({ tone: "success", message: t("Sent for review.", "পর্যালোচনার জন্য পাঠানো হয়েছে।") })
            router.push("/profile/posts")
            return
          }

          await request("PATCH", buildPayload())
          const submitRes = await fetch(`/api/my/posts/${postId}/submit`, { method: "POST" })
          if (!submitRes.ok) {
            const err = await submitRes.json().catch(() => null)
            throw new Error(err?.error?.message ?? "Failed to submit post")
          }
          setNotice({
            tone: "success",
            message:
              status === PostStatus.PUBLISHED || status === PostStatus.UPDATE
                ? t("Update sent for review.", "আপডেট পর্যালোচনার জন্য পাঠানো হয়েছে।")
                : t("Sent for review.", "পর্যালোচনার জন্য পাঠানো হয়েছে।"),
          })
          router.refresh()
        }

        if (kind === "withdraw") {
          if (!postId) return
          const withdrawRes = await fetch(`/api/my/posts/${postId}/withdraw`, { method: "POST" })
          if (!withdrawRes.ok) {
            const err = await withdrawRes.json().catch(() => null)
            throw new Error(err?.error?.message ?? "Failed to withdraw post")
          }
          setNotice({ tone: "success", message: t("Withdrawn to draft.", "খসড়ায় ফেরত আনা হয়েছে।") })
          router.refresh()
        }

        if (kind === "delete") {
          if (!postId) return
          await request("DELETE")
          router.push(backHref)
          return
        }

        onDone?.(undefined as never)
      } catch (error) {
        setNotice({
          tone: "error",
          message: error instanceof Error ? error.message : "Something went wrong",
        })
      } finally {
        setPending(null)
      }
    },
    [backHref, buildPayload, postId, request, router, status, t, validate]
  )

  const isUpdate = status === PostStatus.PUBLISHED || status === PostStatus.UPDATE
  const canSubmit =
    scope === "author" &&
    (status === PostStatus.DRAFT ||
      status === PostStatus.REJECTED ||
      status === PostStatus.PUBLISHED ||
      status === PostStatus.UPDATE)
  const canWithdraw = scope === "author" && (status === PostStatus.PENDING || status === PostStatus.UPDATE)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => router.push(backHref)}
          className="text-xs"
        >
          <ArrowLeft className="size-3.5" />
          {t("Back", "ফিরে যান")}
        </Button>

        <div className="flex flex-wrap items-center gap-2">
          {postId && !locked ? (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={readOnly}
              onClick={() => {
                if (confirm(t("Delete this post permanently?", "এই পোস্টটি স্থায়ীভাবে মুছে ফেলতে চান?"))) {
                  void run("delete", "")
                }
              }}
              className="text-xs"
            >
              {pending === "delete" ? (
                <Spinner className="size-3.5" />
              ) : (
                <Trash2 className="size-3.5" />
              )}
              {t("Delete", "মুছুন")}
            </Button>
          ) : null}

          {canWithdraw ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={readOnly}
              onClick={() => void run("withdraw", "")}
              className="text-xs"
            >
              {pending === "withdraw" ? (
                <Spinner className="size-3.5" />
              ) : (
                <ArrowLeft className="size-3.5" />
              )}
              {t("Withdraw to draft", "খসড়ায় ফেরত আনুন")}
            </Button>
          ) : null}

          {!locked ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={readOnly}
              onClick={() => void run("save", "")}
              className="text-xs"
            >
              {pending === "save" ? (
                <Spinner className="size-3.5" />
              ) : (
                <Check className="size-3.5" />
              )}
              {scope === "admin"
                ? t("Save post", "পোস্ট সংরক্ষণ করুন")
                : isUpdate
                  ? t("Save update", "আপডেট সংরক্ষণ করুন")
                  : t("Save draft", "খসড়া সংরক্ষণ করুন")}
            </Button>
          ) : null}

          {canSubmit ? (
            <Button
              type="button"
              size="sm"
              disabled={readOnly}
              onClick={() => void run("submit", "")}
              className="text-xs"
            >
              {pending === "submit" ? (
                <Spinner className="size-3.5" />
              ) : (
                <Send className="size-3.5" />
              )}
              {isUpdate
                ? t("Submit update for review", "আপডেট পর্যালোচনার জন্য জমা দিন")
                : t("Submit for review", "পর্যালোচনার জন্য জমা দিন")}
            </Button>
          ) : null}
        </div>
      </div>

      {locked ? (
        <div className="flex items-center gap-2 rounded-md border border-muted bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          <Lock className="size-3.5 shrink-0" />
          <span>
            {t(
              "This post has been archived. Only an admin can edit or restore it.",
              "এই পোস্টটি আর্কাইভ করা হয়েছে। শুধুমাত্র অ্যাডমিন এটি সম্পাদনা বা পুনরুদ্ধার করতে পারেন।"
            )}
          </span>
        </div>
      ) : null}

      {status === PostStatus.UPDATE ? (
        <div className="flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
          <AlertCircle className="size-3.5 shrink-0" />
          <span>
            {t(
              "An update for this post is currently in review by administrators.",
              "এই পোস্টের একটি পরিবর্তন বর্তমানে অ্যাডমিন পর্যালোচনার অপেক্ষায় রয়েছে।"
            )}
          </span>
        </div>
      ) : null}

      {massageForAuthor ? (
        <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200">
          <MessageSquare className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="space-y-0.5">
            <p className="font-semibold text-amber-900 dark:text-amber-100">
              {t("Message from admin:", "অ্যাডমিনের বার্তা:")}
            </p>
            <p className="text-xs/relaxed font-medium">
              {massageForAuthor}
            </p>
          </div>
        </div>
      ) : null}

      {notice ? (
        <div
          role="status"
          className={cn(
            "flex items-center gap-2 rounded-md border px-3 py-2 text-xs",
            notice.tone === "success"
              ? "border-success/40 bg-success/10 text-success"
              : "border-destructive/40 bg-destructive/10 text-destructive"
          )}
        >
          {notice.tone === "success" ? <Check className="size-3.5" /> : <AlertCircle className="size-3.5" />}
          {notice.message}
        </div>
      ) : null}

      <div className="flex flex-col xl:flex-row gap-4">
        {/* Main Column */}
        <div className=" min-w-0 space-y-4 w-full">
          {/* Cover Image Hero Preview */}
          {values.coverImage ? (
            <div className="group relative aspect-[16/9] w-full overflow-hidden rounded-lg border bg-muted shadow-xs">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={values.coverImage}
                alt={values.title || "Cover preview"}
                className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.01]"
                onError={(e) => {
                  const target = e.currentTarget
                  target.style.display = "none"
                  const parent = target.parentElement
                  const errEl = parent?.querySelector(".cover-error-state")
                  if (errEl) errEl.classList.remove("hidden")
                }}
              />
              <div className="cover-error-state hidden absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-muted/95 p-4 text-center text-xs text-destructive">
                <ImageOff className="size-6" />
                <span className="font-medium">
                  {t("Unable to load image from this URL.", "এই লিংক থেকে ছবি লোড করা যায়নি।")}
                </span>
                <span className="text-[0.6875rem] text-muted-foreground">
                  {values.coverImage}
                </span>
              </div>
              <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 opacity-90 transition-opacity group-hover:opacity-100">
                <a
                  href={values.coverImage}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="rounded-md bg-background/85 px-2 py-1 text-xs font-medium backdrop-blur-xs hover:bg-background inline-flex items-center gap-1 shadow-xs"
                >
                  <ExternalLink className="size-3" />
                  {t("View original", "মূল ছবি")}
                </a>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => patch("coverImage", "")}
                    className="rounded-md bg-destructive/90 px-2 py-1 text-xs font-medium text-destructive-foreground backdrop-blur-xs hover:bg-destructive inline-flex items-center gap-1 shadow-xs"
                    title={t("Remove cover image", "কভার ছবি সরান")}
                  >
                    <Trash2 className="size-3" />
                    {t("Remove", "মুছুন")}
                  </button>
                )}
              </div>
            </div>
          ) : null}

          {/* Bilingual Titles */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="post-title">
                {t("Title (English)", "শিরোনাম (ইংরেজি)")}{" "}
                <span className="text-muted-foreground">
                  ({values.title.length}/{MAX_POST_TITLE_LENGTH})
                </span>{" "}
                *
              </Label>
              <Input
                id="post-title"
                value={values.title}
                disabled={readOnly}
                onChange={(event) => patchTitle(event.target.value)}
                placeholder={t("A clear, specific headline", "স্পষ্ট ও নির্দিষ্ট শিরোনাম")}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="post-title-bn">
                {t("Title (Bangla)", "শিরোনাম (বাংলা)")}{" "}
                <span className="text-muted-foreground">
                  ({values.titleBn.length}/{MAX_POST_TITLE_LENGTH})
                </span>
              </Label>
              <Input
                id="post-title-bn"
                value={values.titleBn}
                disabled={readOnly}
                onChange={(event) => patch("titleBn", event.target.value)}
                placeholder={t("বাংলায় স্পষ্ট শিরোনাম", "বাংলায় স্পষ্ট শিরোনাম")}
              />
            </div>
          </div>

          {/* Bilingual Content Editor with Tabs */}
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b pb-1.5">
              <div className="flex items-center gap-2">
                <Globe className="text-muted-foreground size-4" />
                <Label className="text-sm font-semibold">{t("Post Content", "পোস্ট কন্টেন্ট")}</Label>
              </div>

              <div className="flex items-center gap-1 rounded-md bg-muted p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setContentTab("en")}
                  className={cn(
                    "rounded px-2.5 py-1 text-xs font-medium transition-colors",
                    contentTab === "en"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  English {values.content ? "✓" : ""}
                </button>
                <button
                  type="button"
                  onClick={() => setContentTab("bn")}
                  className={cn(
                    "rounded px-2.5 py-1 text-xs font-medium transition-colors",
                    contentTab === "bn"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  বাংলা (Bangla) {values.contentBn ? "✓" : ""}
                </button>
              </div>
            </div>

            {contentTab === "en" ? (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{t("Markdown supported", "মার্কডাউন সমর্থিত")} (English)</span>
                  <span>{values.content.length}/{MAX_POST_CONTENT_LENGTH}</span>
                </div>
                <MarkdownEditor
                  id="post-content-en"
                  value={values.content}
                  onChange={(next) => patch("content", next)}
                  disabled={readOnly}
                />
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{t("Markdown supported", "মার্কডাউন সমর্থিত")} (বাংলা / Bengali)</span>
                  <span>{values.contentBn.length}/{MAX_POST_CONTENT_LENGTH}</span>
                </div>
                <MarkdownEditor
                  id="post-content-bn"
                  value={values.contentBn}
                  onChange={(next) => patch("contentBn", next)}
                  disabled={readOnly}
                />
              </div>
            )}
          </div>
        </div>

        {/* Aside Sidebar */}
        <aside className="space-y-4 xl:max-w-[19rem]">
          <div className="space-y-1.5">
            <Label htmlFor="post-slug">
              {t("Slug", "স্লাগ")}{" "}
              <span className="text-muted-foreground">
                ({values.slug.length}/{MAX_POST_SLUG_LENGTH})
              </span>
            </Label>
            <Input
              id="post-slug"
              value={values.slug}
              disabled={readOnly}
              onChange={(event) => {
                setSlugTouched(true)
                patch("slug", toPostSlug(event.target.value))
              }}
              className="font-mono text-xs"
            />
          </div>

          {/* Category Dropdown */}
          <div className="space-y-1.5">
            <Label htmlFor="post-category">{t("Category", "বিভাগ")}</Label>
            <Select
              value={values.categoryId ?? "none"}
              disabled={readOnly}
              onValueChange={(next) =>
                patch("categoryId", next === "none" ? null : next)
              }
            >
              <SelectTrigger id="post-category" className="w-full">
                <SelectValue placeholder={t("Select a category", "একটি ক্যাটাগরি নির্বাচন করুন")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("Uncategorised", "শ্রেণিবিহীন")}</SelectItem>
                {categories.map((category) => {
                  const label =
                    lang === "bn" && category.nameBn
                      ? `${category.nameBn} (${category.name})`
                      : `${category.name}${category.nameBn ? ` (${category.nameBn})` : ""}`
                  return (
                    <SelectItem key={category.id} value={category.id}>
                      {label}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="post-tags">{t("Tags", "ট্যাগ")}</Label>
            <TagInput
              id="post-tags"
              value={values.tags}
              onChange={(next) => patch("tags", next)}
              disabled={readOnly}
            />
          </div>

          {/* Excerpt (English & Bangla) */}
          <div className="space-y-1.5">
            <Label htmlFor="post-excerpt">
              {t("Excerpt (English)", "সংক্ষিপ্ত বিবরণ (ইংরেজি)")}{" "}
              <span className="text-muted-foreground">
                ({values.excerpt.length}/{MAX_POST_EXCERPT_LENGTH})
              </span>
            </Label>
            <Textarea
              id="post-excerpt"
              value={values.excerpt}
              disabled={readOnly}
              rows={2}
              onChange={(event) => patch("excerpt", event.target.value)}
              placeholder={t(
                "Leave empty to derive it from English content.",
                "খালি রাখলে ইংরেজি কন্টেন্ট থেকে নিজে থেকেই তৈরি হবে।"
              )}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="post-excerpt-bn">
              {t("Excerpt (Bangla)", "সংক্ষিপ্ত বিবরণ (বাংলা)")}{" "}
              <span className="text-muted-foreground">
                ({values.excerptBn.length}/{MAX_POST_EXCERPT_LENGTH})
              </span>
            </Label>
            <Textarea
              id="post-excerpt-bn"
              value={values.excerptBn}
              disabled={readOnly}
              rows={2}
              onChange={(event) => patch("excerptBn", event.target.value)}
              placeholder={t(
                "Leave empty to derive it from Bangla content.",
                "খালি রাখলে বাংলা কন্টেন্ট থেকে নিজে থেকেই তৈরি হবে।"
              )}
            />
          </div>

          {/* Cover image URL and Preview in Sidebar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="post-cover">{t("Cover image URL", "কভার ছবির লিংক")}</Label>
              {values.coverImage && !readOnly ? (
                <button
                  type="button"
                  onClick={() => patch("coverImage", "")}
                  className="text-[0.6875rem] text-destructive hover:underline"
                >
                  {t("Remove", "মুছুন")}
                </button>
              ) : null}
            </div>
            <Input
              id="post-cover"
              type="url"
              value={values.coverImage}
              disabled={readOnly}
              onChange={(event) => patch("coverImage", event.target.value)}
              placeholder="https://… or /hero-tech.jpg"
            />

          </div>

          {scope === "admin" ? (
            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <Label htmlFor="post-featured" className="text-xs font-normal">
                {t("Feature on the blog", "ব্লগে হাইলাইট করুন")}
              </Label>
              <input
                id="post-featured"
                type="checkbox"
                checked={values.isFeatured}
                disabled={readOnly}
                onChange={(event) => patch("isFeatured", event.target.checked)}
                className="size-4 rounded"
              />
            </div>
          ) : null}

          <div className="rounded-md border p-3">
            <SeoPreview
              title={values.seoTitle || values.title}
              description={values.seoDescription || values.excerpt}
              slug={values.slug}
              image={values.ogImage || values.coverImage}
            />
          </div>
        </aside>
      </div>
    </div>
  )
}
