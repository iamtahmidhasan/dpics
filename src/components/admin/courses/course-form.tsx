"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Globe,
  ImageIcon,
  Layers,
  Loader2,
  Save,
} from "lucide-react"

import { MarkdownEditor } from "@/components/posts/markdown-editor"
import { ImageUploadField } from "@/components/media/image-upload-field"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useLanguage } from "@/components/language-provider"
import { cn } from "cn"

export interface InitialCourseData {
  id?: string
  title?: string
  slug?: string
  excerpt?: string | null
  description?: string | null
  titleBn?: string | null
  excerptBn?: string | null
  descriptionBn?: string | null
  thumbnail?: string | null
  level?: string
  isFree?: boolean
  price?: number | null
  discountPrice?: number | null
  tags?: string[]
  isPublished?: boolean
  featured?: boolean
  [key: string]: unknown
}

interface CourseFormProps {
  initialCourse?: InitialCourseData
  isEditing?: boolean
}

type LangTab = "en" | "bn"

export function CourseForm({ initialCourse, isEditing = false }: CourseFormProps) {
  const { t } = useLanguage()
  const router = useRouter()

  const [activeTab, setActiveTab] = React.useState<LangTab>("en")

  // English fields
  const [title, setTitle] = React.useState(initialCourse?.title || "")
  const [slug, setSlug] = React.useState(initialCourse?.slug || "")
  const [excerpt, setExcerpt] = React.useState(initialCourse?.excerpt || "")
  const [description, setDescription] = React.useState(initialCourse?.description || "")

  // Bangla fields
  const [titleBn, setTitleBn] = React.useState(initialCourse?.titleBn || "")
  const [excerptBn, setExcerptBn] = React.useState(initialCourse?.excerptBn || "")
  const [descriptionBn, setDescriptionBn] = React.useState(initialCourse?.descriptionBn || "")

  // Shared metadata
  const [thumbnail, setThumbnail] = React.useState(initialCourse?.thumbnail || "")
  const [level, setLevel] = React.useState(initialCourse?.level || "ALL_LEVELS")
  const [isFree, setIsFree] = React.useState(
    initialCourse ? Boolean(initialCourse.isFree) : true
  )
  const [price, setPrice] = React.useState(
    initialCourse?.price !== undefined ? String(initialCourse.price) : "0"
  )
  const [discountPrice, setDiscountPrice] = React.useState(
    initialCourse?.discountPrice ? String(initialCourse.discountPrice) : ""
  )
  const [tags, setTags] = React.useState(
    Array.isArray(initialCourse?.tags) ? initialCourse.tags.join(", ") : ""
  )
  const [isPublished, setIsPublished] = React.useState(
    initialCourse ? Boolean(initialCourse.isPublished) : false
  )
  const [featured, setFeatured] = React.useState(
    initialCourse ? Boolean(initialCourse.featured) : false
  )

  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleTitleChange = (val: string) => {
    setTitle(val)
    if (!isEditing) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "")
      setSlug(generated)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const parsedTags = tags
        .split(",")
        .map((tagItem: string) => tagItem.trim())
        .filter(Boolean)

      const payload = {
        title,
        titleBn: titleBn.trim() ? titleBn : null,
        slug,
        excerpt: excerpt.trim() ? excerpt : null,
        excerptBn: excerptBn.trim() ? excerptBn : null,
        description: description.trim() ? description : null,
        descriptionBn: descriptionBn.trim() ? descriptionBn : null,
        thumbnail: thumbnail.trim() ? thumbnail : null,
        level,
        isFree,
        price: isFree ? 0 : parseInt(price) || 0,
        discountPrice: isFree || !discountPrice ? null : parseInt(discountPrice) || null,
        tags: parsedTags,
        isPublished,
        featured,
      }

      const url = isEditing && initialCourse?.id ? `/api/courses/${initialCourse.id}` : "/api/courses"
      const method = isEditing ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.error?.message || "Failed to save course")
      }

      const savedId = isEditing ? initialCourse?.id : data.course?.id

      if (!isEditing && savedId) {
        router.push(`/admin/courses/${savedId}/curriculum`)
      } else {
        router.push("/admin/courses")
      }
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save course")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      {/* Navigation header */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/courses"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "text-xs gap-1.5 text-muted-foreground"
          )}
        >
          <ArrowLeft className="size-3.5" />
          <span>{t("Back to Courses", "কোর্স তালিকায় ফিরুন")}</span>
        </Link>

        {isEditing && initialCourse?.id ? (
          <Link
            href={`/admin/courses/${initialCourse.id}/curriculum`}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "text-xs gap-1.5 font-medium"
            )}
          >
            <Layers className="size-3.5 text-primary" />
            <span>{t("Manage Curriculum Syllabus", "সিলেবাস সম্পাদনা")}</span>
            <ArrowRight className="size-3" />
          </Link>
        ) : null}
      </div>

      <div className="grid gap-6">
        {/* Bilingual Content Switcher Card */}
        <Card className="border-border shadow-xs overflow-hidden">
          <CardHeader className="bg-muted/20 border-b border-border pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Globe className="size-4 text-primary" />
                  <span>{t("Bilingual Course Content", "দ্বিভাষিক কোর্স বিষয়বস্তু")}</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  {t(
                    "Provide title, excerpt, and rich markdown description in English and Bangla.",
                    "ইংরেজি ও বাংলা উভয় ভাষায় কোর্সের শিরোনাম, সারসংক্ষেপ এবং মার্কডাউন বিবরণ লিখুন।"
                  )}
                </CardDescription>
              </div>

              {/* Language Switcher Tabs */}
              <div className="flex items-center rounded-lg border border-border bg-card p-1 shadow-xs shrink-0 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab("en")}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer",
                    activeTab === "en"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span>English</span>
                  {title.trim() && <Check className="size-3" />}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("bn")}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer",
                    activeTab === "bn"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span>বাংলা (Bangla)</span>
                  {titleBn.trim() && <Check className="size-3" />}
                </button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-5 pt-5">
            {activeTab === "en" ? (
              /* English Fields */
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold">
                      {t("Course Title (English)", "কোর্স শিরোনাম (ইংরেজি)")} *
                    </Label>
                    <span className="text-[10px] text-muted-foreground font-mono">EN</span>
                  </div>
                  <Input
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="e.g. Master Full-Stack Next.js 15 & React 19"
                    className="text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold">
                      {t("Short Excerpt (English)", "সংক্ষিপ্ত বিবরণ (ইংরেজি)")}
                    </Label>
                    <span className="text-[10px] text-muted-foreground font-mono">EN</span>
                  </div>
                  <Input
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    placeholder="One sentence summary of the course in English"
                    className="text-xs"
                  />
                </div>

                {/* Markdown Editor for English Description */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold">
                      {t("Detailed Description (English Markdown)", "কোর্সের বিস্তারিত বিবরণ (ইংরেজি মার্কডাউন)")}
                    </Label>
                    <span className="text-[10px] text-muted-foreground font-mono">Markdown Editor</span>
                  </div>
                  <div className="rounded-lg border border-border overflow-hidden">
                    <MarkdownEditor
                      value={description}
                      onChange={setDescription}
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* Bangla Fields */
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold">
                      {t("Course Title (Bangla)", "কোর্স শিরোনাম (বাংলা)")}
                    </Label>
                    <span className="text-[10px] text-primary font-mono font-semibold">বাংলা</span>
                  </div>
                  <Input
                    value={titleBn}
                    onChange={(e) => setTitleBn(e.target.value)}
                    placeholder="যেমন: ফুল-স্ট্যাক নেক্সট.জেএস ১৫ ও রিয়েক্ট ১৯ মাস্টারি"
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold">
                      {t("Short Excerpt (Bangla)", "সংক্ষিপ্ত বিবরণ (বাংলা)")}
                    </Label>
                    <span className="text-[10px] text-primary font-mono font-semibold">বাংলা</span>
                  </div>
                  <Input
                    value={excerptBn}
                    onChange={(e) => setExcerptBn(e.target.value)}
                    placeholder="বাংলায় এক লাইনে কোর্সের সংক্ষিপ্ত রূপরেখা"
                    className="text-xs"
                  />
                </div>

                {/* Markdown Editor for Bangla Description */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold">
                      {t("Detailed Description (Bangla Markdown)", "কোর্সের বিস্তারিত বিবরণ (বাংলা মার্কডাউন)")}
                    </Label>
                    <span className="text-[10px] text-primary font-mono font-semibold">বাংলা এডিটর</span>
                  </div>
                  <div className="rounded-lg border border-border overflow-hidden">
                    <MarkdownEditor
                      value={descriptionBn}
                      onChange={setDescriptionBn}
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* URL Slug & Skill Level */}
        <Card className="border-border shadow-xs">
          <CardHeader>
            <CardTitle className="text-base font-bold">
              {t("URL & Classification", "ইউআরএল ও ক্যাটাগরি")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{t("URL Slug", "ইউআরএল স্ল্যাগ")} *</Label>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. master-full-stack-nextjs"
                className="text-xs font-mono"
                required
              />
              <p className="text-[11px] text-muted-foreground font-mono">
                /courses/{slug || "slug-here"}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">{t("Skill Level", "লেভেল")}</Label>
                <Select value={level} onValueChange={(val) => val && setLevel(val)}>
                  <SelectTrigger className="w-full text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL_LEVELS">All Levels</SelectItem>
                    <SelectItem value="BEGINNER">Beginner</SelectItem>
                    <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                    <SelectItem value="ADVANCED">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  {t("Tags (comma-separated)", "ট্যাগ (কমা দিয়ে আলাদা করুন)")}
                </Label>
                <Input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="Next.js, React, Full-Stack, TypeScript"
                  className="text-xs"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Thumbnail with Live Image Preview & Media Library */}
        <Card className="border-border shadow-xs">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <ImageIcon className="size-4 text-primary" />
              <span>{t("Course Thumbnail Image", "কোর্স থাম্বনেইল ছবি")}</span>
            </CardTitle>
            <CardDescription className="text-xs">
              {t(
                "Upload a 16:9 course banner or select an existing graphic from your ImageKit media library.",
                "১৬:৯ অনুপাতে কোর্সের ব্যানার আপলোড করুন অথবা ইমেজকিট লাইব্রেরি থেকে বেছে নিন।"
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ImageUploadField
              label={t("Thumbnail Image", "থাম্বনেইল ছবি")}
              value={thumbnail}
              onChange={setThumbnail}
              aspectRatio="video"
              defaultFolder="courses"
              placeholder={t("Upload 16:9 course thumbnail or pick from library", "কোর্স ব্যানার আপলোড করুন বা লাইব্রেরি থেকে বেছে নিন")}
            />
          </CardContent>
        </Card>

        {/* Pricing Settings */}
        <Card className="border-border shadow-xs">
          <CardHeader>
            <CardTitle className="text-base font-bold">
              {t("Pricing & Enrollment", "কোর্স ফি ও এনরোলমেন্ট")}
            </CardTitle>
            <CardDescription className="text-xs">
              {t(
                "Set whether this course is 100% free or requires tuition fee payment.",
                "কোর্সটি সম্পূর্ণ ফ্রি নাকি পেইড তা নির্ধারণ করুন।"
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3.5 rounded-lg border border-border bg-muted/20">
              <div className="space-y-0.5">
                <Label className="text-xs font-bold">{t("100% Free Course", "১০০% সম্পূর্ণ ফ্রি কোর্স")}</Label>
                <p className="text-[11px] text-muted-foreground">
                  {t(
                    "Students can enroll with instant 1-click access without payment verification",
                    "শিক্ষার্থীরা কোনো পেমেন্ট ভেরিফিকেশন ছাড়াই তাৎক্ষণিক এনরোল করতে পারবে"
                  )}
                </p>
              </div>
              <Switch checked={isFree} onCheckedChange={setIsFree} />
            </div>

            {!isFree && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">{t("Regular Tuition Fee (৳)", "মূল ফি (৳)")} *</Label>
                  <Input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="1200"
                    className="text-xs font-mono"
                    required={!isFree}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">
                    {t("Discounted Fee (৳, Optional)", "ডিসকাউন্ট ফি (৳, ঐচ্ছিক)")}
                  </Label>
                  <Input
                    type="number"
                    value={discountPrice}
                    onChange={(e) => setDiscountPrice(e.target.value)}
                    placeholder="800"
                    className="text-xs font-mono"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Publishing & Feature Status */}
        <Card className="border-border shadow-xs">
          <CardHeader>
            <CardTitle className="text-base font-bold">
              {t("Publishing Status", "প্রকাশনা ও স্ট্যাটাস")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs font-semibold cursor-pointer" htmlFor="publish-switch">
                  {t("Publish to Public Catalog", "ওয়েবসাইটে প্রকাশ্যে প্রকাশ করুন")}
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  {t(
                    "When disabled, this course is kept as a draft and only admins can see it",
                    "বন্ধ থাকলে কোর্সটি ড্রাফট হিসেবে থাকবে এবং শুধু অ্যাডমিনরা দেখতে পাবে"
                  )}
                </p>
              </div>
              <Switch
                id="publish-switch"
                checked={isPublished}
                onCheckedChange={setIsPublished}
              />
            </div>

            <div className="flex items-center justify-between border-t border-border/60 pt-3">
              <div>
                <Label className="text-xs font-semibold cursor-pointer" htmlFor="featured-switch">
                  {t("Featured Badge", "ফিচার্ড ব্যাজ")}
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  {t(
                    "Featured courses are highlighted with a special badge in the catalog",
                    "ক্যাটালগে বিশেষ ব্যাজ দিয়ে কোর্সটি হাইলাইট করা হবে"
                  )}
                </p>
              </div>
              <Switch
                id="featured-switch"
                checked={featured}
                onCheckedChange={setFeatured}
              />
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="rounded-lg bg-destructive/15 p-3 text-xs text-destructive font-medium">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/admin/courses"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            {t("Cancel", "বাতিল")}
          </Link>

          <Button type="submit" size="sm" disabled={loading} className="gap-1.5 font-bold cursor-pointer">
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            <span>
              {isEditing
                ? t("Save Changes", "পরিবর্তন সংরক্ষণ করুন")
                : t("Create Course & Continue to Curriculum", "কোর্স তৈরি ও সিলেবাসে যান")}
            </span>
          </Button>
        </div>
      </div>
    </form>
  )
}
