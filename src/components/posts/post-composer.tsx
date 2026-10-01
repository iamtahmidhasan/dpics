"use client"

import {
  AlertCircle,
  ArrowLeft,
  Check,
  Eye,
  Loader2,
  Save,
  Send,
  Trash2,
  Undo2,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useMemo, useState } from "react"

import { useLanguage } from "@/components/language-provider"
import { MarkdownEditor } from "@/components/posts/markdown-editor"
import { SeoPreview } from "@/components/posts/seo-preview"
import { TagInput } from "@/components/posts/tag-input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { PostCategory, PostStatus } from "@/generated/prisma/enums"
import { POST_CATEGORY_LABELS, postStatusBadgeVariant, postStatusLabel } from "@/lib/post-labels"
import {
  MAX_POST_CONTENT_LENGTH,
  MAX_POST_EXCERPT_LENGTH,
  MAX_POST_SLUG_LENGTH,
  MAX_POST_SEO_DESCRIPTION_LENGTH,
  MAX_POST_TAGS,
  MAX_POST_TITLE_LENGTH,
} from "@/lib/post-constants"
import { toPostSlug } from "@/lib/post-slug"
import { cn } from "cn"

export type PostFormValues = {
  title: string
  slug: string
  excerpt: string
  content: string
  coverImage: string
  ogImage: string
  category: PostCategory | null
  tags: string[]
  seoTitle: string
  seoDescription: string
  isFeatured: boolean
}

export type PostComposerProps = {
  /** `admin` writes through the admin endpoints and may set status directly. */
  scope: "author" | "admin"
  initialValues?: Partial<PostFormValues>
  postId?: string
  status?: PostStatus
  rejectionReason?: string | null
  /** Author editing an already approved post: show the lock notice, no writes. */
  locked?: boolean
  backHref: string
}

const EMPTY: PostFormValues = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  coverImage: "",
  ogImage: "",
  category: null,
  tags: [],
  seoTitle: "",
  seoDescription: "",
  isFeatured: false,
}

const CATEGORY_VALUES = Object.values(PostCategory)

type Notice = { tone: "success" | "error"; message: string } | null

export function PostComposer({
  scope,
  initialValues,
  postId,
  status = PostStatus.DRAFT,
  rejectionReason,
  locked = false,
  backHref,
}: PostComposerProps) {
  const router = useRouter()
  const { t } = useLanguage()

  const [values, setValues] = useState<PostFormValues>({ ...EMPTY, ...initialValues })
  const [slugTouched, setSlugTouched] = useState(Boolean(initialValues?.slug))
  const [pending, setPending] = useState<null | "save" | "submit" | "withdraw" | "delete">(null)
  const [notice, setNotice] = useState<Notice>(null)

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
      slug: slugTouched ? values.slug.trim() : toPostSlug(values.title),
      excerpt: values.excerpt.trim() || null,
      content: values.content,
      coverImage: values.coverImage.trim() || null,
      ogImage: values.ogImage.trim() || null,
      category: values.category,
      tags: values.tags,
      seoTitle: values.seoTitle.trim() || null,
      seoDescription: values.seoDescription.trim() || null,
      ...(scope === "admin" ? { isFeatured: values.isFeatured } : {}),
    }),
    [scope, slugTouched, values]
  )

  const validate = useCallback((): string | null => {
    if (values.title.trim().length < 5) {
      return t("Title must be at least 5 characters.", "শিরোনাম অন্তত ৫ অক্ষরের হতে হবে।")
    }

    if (values.title.length > MAX_POST_TITLE_LENGTH) {
      return t("Title is too long.", "শিরোনাম অনেক লম্বা।")
    }

    if (!values.content.trim()) {
      return t("Content is required.", "কন্টেন্ট আবশ্যক।")
    }

    if (values.content.length > MAX_POST_CONTENT_LENGTH) {
      return t("Content is too long.", "কন্টেন্ট অনেক লম্বা।")
    }

    if (values.excerpt.length > MAX_POST_EXCERPT_LENGTH) {
      return t("Excerpt is too long.", "সংক্ষিপ্ত বিবরণ অনেক লম্বা।")
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
            // A fresh save gives the post an id, so subsequent submits work.
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

          await request("POST", undefined, "/submit")
          setNotice({ tone: "success", message: t("Sent for review.", "পর্যালোচনার জন্য পাঠানো হয়েছে।") })
          router.refresh()
        }

        if (kind === "withdraw") {
          await request("POST", undefined, "/withdraw")
          setNotice({ tone: "success", message: t("Pulled back to draft.", "খসড়ায় ফিরিয়ে আনা হয়েছে।") })
          router.refresh()
        }

        if (kind === "delete") {
          await request("DELETE")
          router.push(backHref)
          router.refresh()
        }

        onDone?.(undefined as never)
      } catch (cause) {
        setNotice({
          tone: "error",
          message: cause instanceof Error ? cause.message : t("Something went wrong.", "কিছু একটা ভুল হয়েছে।"),
        })
      } finally {
        setPending(null)
      }
    },
    [backHref, buildPayload, postId, request, router, t, validate]
  )

  const statusLabel = useMemo(() => postStatusLabel(t), [t])
  const canSubmit = status === PostStatus.DRAFT || status === PostStatus.REJECTED
  const canWithdraw = status === PostStatus.PENDING
  const canDelete = canSubmit || canWithdraw

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault()
        void run("save", "")
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={() => router.push(backHref)}>
            <ArrowLeft className="size-3.5" />
            {t("Back", "ফিরে যান")}
          </Button>
          {scope === "admin" || postId ? (
            <Badge variant={postStatusBadgeVariant(status)}>{statusLabel(status)}</Badge>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {postId && (canDelete || scope === "admin") ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={readOnly}
              onClick={() => void run("delete", "")}
            >
              <Trash2 className="size-3.5" />
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
            >
              <Undo2 className="size-3.5" />
              {t("Withdraw", "প্রত্যাহার")}
            </Button>
          ) : null}

          <Button type="submit" variant="outline" size="sm" disabled={readOnly}>
            {pending === "save" ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Save className="size-3.5" />
            )}
            {t("Save draft", "খসড়া সংরক্ষণ")}
          </Button>

          {scope === "author" && canSubmit ? (
            <Button
              type="button"
              size="sm"
              disabled={readOnly}
              onClick={() => void run("submit", "")}
            >
              {pending === "submit" ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Send className="size-3.5" />
              )}
              {t("Submit for review", "পর্যালোচনায় পাঠান")}
            </Button>
          ) : null}
        </div>
      </div>

      {locked ? (
        <div className="flex items-start gap-2 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-xs">
          <Eye className="mt-0.5 size-3.5 shrink-0" />
          <p className="text-xs/relaxed">
            {t(
              "This post is already approved, so it can no longer be edited or deleted. Ask an admin to archive it if you need changes.",
              "এই পোস্টটি ইতিমধ্যে অনুমোদিত, তাই এটি আর সম্পাদনা বা মুছে ফেলা যাবে না। পরিবর্তন দরকার হলে অ্যাডমিনকে জানান।"
            )}
          </p>
        </div>
      ) : null}

      {status === PostStatus.REJECTED && rejectionReason ? (
        <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs">
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
          <p className="text-xs/relaxed">
            <span className="font-medium">
              {t("Sent back by a reviewer:", "একজন পর্যালোচক ফেরত পাঠিয়েছেন:")}
            </span>{" "}
            {rejectionReason}
          </p>
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

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="post-title">
              {t("Title", "শিরোনাম")}{" "}
              <span className="text-muted-foreground">
                ({values.title.length}/{MAX_POST_TITLE_LENGTH})
              </span>
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
            <Label htmlFor="post-content">{t("Content", "কন্টেন্ট")}</Label>
            <MarkdownEditor
              id="post-content"
              value={values.content}
              onChange={(next) => patch("content", next)}
              disabled={readOnly}
            />
          </div>
        </div>

        <aside className="space-y-4">
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

          <div className="space-y-1.5">
            <Label htmlFor="post-category">{t("Category", "বিভাগ")}</Label>
            <Select
              value={values.category ?? "none"}
              disabled={readOnly}
              onValueChange={(next) =>
                patch("category", next === "none" ? null : (next as PostCategory))
              }
            >
              <SelectTrigger id="post-category" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("Uncategorised", "শ্রেণিবিহীন")}</SelectItem>
                {CATEGORY_VALUES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {t(POST_CATEGORY_LABELS[category])}
                  </SelectItem>
                ))}
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

          <div className="space-y-1.5">
            <Label htmlFor="post-excerpt">
              {t("Excerpt", "সংক্ষিপ্ত বিবরণ")}{" "}
              <span className="text-muted-foreground">
                ({values.excerpt.length}/{MAX_POST_EXCERPT_LENGTH})
              </span>
            </Label>
            <Textarea
              id="post-excerpt"
              value={values.excerpt}
              disabled={readOnly}
              rows={3}
              onChange={(event) => patch("excerpt", event.target.value)}
              placeholder={t(
                "Leave empty to derive it from the content.",
                "খালি রাখলে কন্টেন্ট থেকে নিজে থেকেই তৈরি হবে।"
              )}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="post-cover">{t("Cover image URL", "কভার ছবির লিংক")}</Label>
            <Input
              id="post-cover"
              type="url"
              value={values.coverImage}
              disabled={readOnly}
              onChange={(event) => patch("coverImage", event.target.value)}
              placeholder="https://…"
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
                className="size-3.5 accent-primary"
              />
            </div>
          ) : null}

          <div className="space-y-3 border-t pt-3">
            <p className="text-muted-foreground text-[0.625rem] font-medium tracking-wide uppercase">
              {t("Search & social", "সার্চ ও সোশ্যাল")}
            </p>

            <div className="space-y-1.5">
              <Label htmlFor="post-seo-title">{t("SEO title", "SEO শিরোনাম")}</Label>
              <Input
                id="post-seo-title"
                value={values.seoTitle}
                disabled={readOnly}
                onChange={(event) => patch("seoTitle", event.target.value)}
                placeholder={values.title || t("Defaults to the title", "শিরোনাম থেকেই নেবে")}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="post-seo-description">{t("SEO description", "SEO বিবরণ")}</Label>
              <Textarea
                id="post-seo-description"
                value={values.seoDescription}
                disabled={readOnly}
                rows={2}
                onChange={(event) => patch("seoDescription", event.target.value)}
                placeholder={t("Defaults to an excerpt", "সংক্ষিপ্ত বিবরণ থেকেই নেবে")}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="post-og-image">{t("Social image URL", "সোশ্যাল ছবির লিংক")}</Label>
              <Input
                id="post-og-image"
                type="url"
                value={values.ogImage}
                disabled={readOnly}
                onChange={(event) => patch("ogImage", event.target.value)}
                placeholder="https://…"
              />
            </div>

            <SeoPreview
              title={values.seoTitle || values.title}
              slug={values.slug}
              description={values.seoDescription || values.excerpt || null}
              content={values.content}
            />
          </div>
        </aside>
      </div>
    </form>
  )
}
